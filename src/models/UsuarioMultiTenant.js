const multiTenantDb = require('../database/MultiTenantPostgres');
const authUtil = require('../utils/auth');

console.log('UsuarioMultiTenant: authUtil loaded:', typeof authUtil);
console.log('UsuarioMultiTenant: authUtil.verifyPassword:', typeof authUtil.verifyPassword);

class UsuarioMultiTenantModel {
  constructor() {
    this._masterDb = multiTenantDb.getMasterDb();
  }

  /**
   * Obter TenantDb para o tenant
   */
  getTenantDb(tenantId) {
    try {
      return multiTenantDb.getTenantDb(tenantId);
    } catch (error) {
      console.log('getTenantDb error:', error.message);
      return null;
    }
  }

  /**
   * Cria um novo usuário (multi-tenant)
   */
  async create(userData, tenantId) {
    const { nome, role, email, senha, permissions } = userData;

    try {
      const tenant = await this.getTenantInfo(tenantId);
      if (!tenant.canCreateUser()) {
        throw new Error('Limite de usuários atingido para este plano');
      }

      const senhaHash = await authUtil.hashPassword(senha);
      const tenantDb = this.getTenantDb(tenantId);

      const defaultPermissions = this.getDefaultPermissions(role);
      const finalPermissions = permissions || defaultPermissions;

      const r = await tenantDb.run(
        `INSERT INTO usuarios (nome, role, email, senha_hash, status)
         VALUES ($1, $2, $3, $4, 'active')
         RETURNING id`,
        [nome, role, email, senhaHash]
      );

      return this.findById(r.lastID, tenantId);
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Email já está em uso nesta clínica');
      }
      throw error;
    }
  }

  /**
   * Busca usuário por ID (multi-tenant)
   * @param {number} id - ID do usuário
   * @param {string} tenantId - ID do tenant
   * @returns {Object|null} - Usuário encontrado
   */
  async findById(id, tenantId) {
    const tenantDb = this.getTenantDb(tenantId);
    return tenantDb.get(
      `SELECT id, nome, email, role, telefone, avatar,
              status, last_login, created_at, updated_at
       FROM usuarios
       WHERE id = $1`,
      [id]
    );
  }

  /**
   * Busca usuário por email (multi-tenant)
   * @param {string} email - Email do usuário
   * @param {string} tenantId - ID do tenant
   * @returns {Object|null} - Usuário encontrado
   */
  async findByEmail(email, tenantId) {
    console.log('findByEmail called with:', email, 'tenantId:', tenantId);
    try {
      const tenantDb = this.getTenantDb(tenantId);
      if (!tenantDb) {
        console.log('findByEmail: tenantDb is null');
        return null;
      }
      console.log('tenantDb obtained for tenant:', tenantId);

      const usuario = await tenantDb.get(
        `SELECT id, nome, email, senha_hash, role, telefone, avatar,
                status, last_login, created_at, updated_at
         FROM usuarios
         WHERE email = $1`,
        [email]
      );

      console.log('Query result:', usuario ? 'User found' : 'User not found');
      if (usuario) {
        console.log('User data:', { id: usuario.id, email: usuario.email });
      }

      return usuario;
    } catch (error) {
      console.log('findByEmail error:', error.message);
      return null;
    }
  }

  /**
   * Autentica usuário (multi-tenant)
   * @param {string} email - Email do usuário
   * @param {string} senha - Senha do usuário
   * @param {string} tenantId - ID do tenant
   * @returns {Object} - Resultado da autenticação com informações detalhadas
   */
  async authenticate(email, senha, tenantId) {
    console.log('UsuarioMultiTenant.authenticate called with:', email, 'tenantId:', tenantId);

    const usuario = await this.findByEmail(email, tenantId);

    if (!usuario) {
      console.log('UsuarioMultiTenant.authenticate: User not found');
      return { success: false, error: 'USER_NOT_FOUND', message: 'Usuário não encontrado' };
    }

    console.log('UsuarioMultiTenant.authenticate: User found, verifying password');
    const senhaValida = await authUtil.verifyPassword(senha, usuario.senha_hash);
    console.log('UsuarioMultiTenant.authenticate: senhaValida =', senhaValida);

    if (!senhaValida) {
      console.log('UsuarioMultiTenant.authenticate: Invalid password');
      return { success: false, error: 'INVALID_PASSWORD', message: 'Senha incorreta' };
    }

    delete usuario.senha_hash;

    console.log('UsuarioMultiTenant.authenticate: Authentication successful');
    return { success: true, user: usuario };
  }

  /**
   * Verificar senha
   */
  async checkPassword(usuario, senha) {
    return await authUtil.verifyPassword(senha, usuario.senha_hash);
  }

  /**
   * Listar usuários do tenant
   */
  async listByTenant(tenantId, filters = {}) {
    const tenantDb = this.getTenantDb(tenantId);
    let query = `
      SELECT id, nome, role, email, telefone, avatar,
             status, last_login, created_at
      FROM usuarios
    `;
    const params = [];
    let whereAdded = false;
    let idx = 1;

    if (filters.role) {
      query += whereAdded ? ` AND role = $${idx++}` : ` WHERE role = $${idx++}`;
      params.push(filters.role);
      whereAdded = true;
    }

    if (filters.status) {
      query += whereAdded ? ` AND status = $${idx++}` : ` WHERE status = $${idx++}`;
      params.push(filters.status);
      whereAdded = true;
    }

    query += ' ORDER BY created_at DESC';

    return tenantDb.all(query, params);
  }

  /**
   * Atualizar usuário
   */
  async update(id, updateData, tenantId) {
    const tenantDb = this.getTenantDb(tenantId);
    const { nome, role, email, telefone, status } = updateData;

    try {
      await tenantDb.run(
        `UPDATE usuarios SET
           nome = COALESCE($1, nome),
           role = COALESCE($2, role),
           email = COALESCE($3, email),
           telefone = COALESCE($4, telefone),
           status = COALESCE($5, status),
           updated_at = NOW()
         WHERE id = $6`,
        [nome, role, email, telefone, status, id]
      );

      return this.findById(id, tenantId);
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Email já está em uso nesta clínica');
      }
      throw error;
    }
  }

  /**
   * Atualizar senha
   */
  async updatePassword(id, novaSenha, tenantId) {
    const tenantDb = this.getTenantDb(tenantId);
    const senhaHash = await authUtil.hashPassword(novaSenha);

    await tenantDb.run(
      `UPDATE usuarios SET senha_hash = $1, updated_at = NOW() WHERE id = $2`,
      [senhaHash, id]
    );

    return true;
  }

  /**
   * Registrar último login
   */
  async updateLastLogin(id, tenantId) {
    const tenantDb = this.getTenantDb(tenantId);
    await tenantDb.run(
      `UPDATE usuarios SET last_login = NOW() WHERE id = $1`,
      [id]
    );
  }

  /**
   * Verificar permissão
   */
  hasPermission(usuario, permission) {
    if (usuario.role === 'owner' || usuario.role === 'admin') {
      return true;
    }
    return usuario.permissions && usuario.permissions[permission] === true;
  }

  /**
   * Verificar se pode gerenciar usuários
   */
  canManageUsers(usuario) {
    return usuario.role === 'owner' || usuario.role === 'admin';
  }

  /**
   * Obter informações do tenant
   */
  async getTenantInfo(tenantId) {
    const tenant = await this._masterDb.get(
      `SELECT id, slug, nome, plano, status, config, billing
       FROM tenants
       WHERE id = $1`,
      [tenantId]
    );

    if (tenant) {
      // No PostgreSQL com JSONB o objeto já vem parseado; garante compatibilidade
      if (typeof tenant.config === 'string') tenant.config = JSON.parse(tenant.config || '{}');
      if (typeof tenant.billing === 'string') tenant.billing = JSON.parse(tenant.billing || '{}');

      tenant.canCreateUser = function () {
        const currentUsers = this.totalUsuarios || 0;
        return this.config.maxUsuarios === -1 || currentUsers < this.config.maxUsuarios;
      };
    }

    return tenant;
  }

  /**
   * Contar usuários do tenant
   */
  async countByTenant(tenantId) {
    const tenantDb = this.getTenantDb(tenantId);
    const result = await tenantDb.get(
      `SELECT COUNT(*) as total FROM usuarios WHERE status = 'active'`
    );
    return parseInt(result.total, 10);
  }

  /**
   * Convidar usuário
   */
  async inviteUser(userData, tenantId, invitedBy) {
    const { nome, email, role } = userData;
    const crypto = require('crypto');

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpireAt = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 dias

    const tenantDb = this.getTenantDb(tenantId);

    const r = await tenantDb.run(
      `INSERT INTO usuarios (nome, email, role, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id`,
      [nome, email, role]
    );

    // TODO: Enviar email de convite
    // await emailService.sendInvite(email, inviteToken, tenant);

    return { id: r.lastID, inviteToken, inviteExpireAt };
  }

  /**
   * Aceitar convite
   */
  async acceptInvite(inviteToken, senha) {
    const allTenants = await this._masterDb.all('SELECT id FROM tenants');

    for (const tenant of allTenants) {
      const tenantDb = this.getTenantDb(tenant.id);
      const usuario = await tenantDb.get(
        `SELECT * FROM usuarios
         WHERE invite_token = $1 AND invite_expire_at > NOW()`,
        [inviteToken]
      );

      if (usuario) {
        const senhaHash = await authUtil.hashPassword(senha);

        await tenantDb.run(
          `UPDATE usuarios SET
             senha_hash = $1,
             status = 'active',
             invite_token = NULL,
             invite_expire_at = NULL,
             email_verified_at = NOW(),
             updated_at = NOW()
           WHERE id = $2`,
          [senhaHash, usuario.id]
        );

        return this.findById(usuario.id, tenant.id);
      }
    }

    throw new Error('Convite inválido ou expirado');
  }

  /**
   * Deletar usuário (soft delete)
   */
  async delete(id, tenantId) {
    const tenantDb = this.getTenantDb(tenantId);
    await tenantDb.run(
      `UPDATE usuarios SET status = 'inactive', updated_at = NOW() WHERE id = $1`,
      [id]
    );
    return true;
  }

  /**
   * Permissões padrão por role
   */
  getDefaultPermissions(role) {
    const defaultPermissions = {
      owner: {
        agendamentos: true, pacientes: true, financeiro: true, whatsapp: true,
        automacoes: true, relatorios: true, configuracoes: true
      },
      admin: {
        agendamentos: true, pacientes: true, financeiro: true, whatsapp: true,
        automacoes: true, relatorios: true, configuracoes: false
      },
      medico: {
        agendamentos: true, pacientes: true, financeiro: false, whatsapp: false,
        automacoes: false, relatorios: true, configuracoes: false
      },
      recepcionista: {
        agendamentos: true, pacientes: true, financeiro: false, whatsapp: true,
        automacoes: false, relatorios: false, configuracoes: false
      },
      financeiro: {
        agendamentos: false, pacientes: false, financeiro: true, whatsapp: false,
        automacoes: false, relatorios: true, configuracoes: false
      }
    };

    return defaultPermissions[role] || defaultPermissions.medico;
  }
}

module.exports = new UsuarioMultiTenantModel();
