const dbManager = require('./database');
const multiTenantDb = require('./MultiTenantDatabase');
const authUtil = require('../utils/auth');

console.log('🔧 UsuarioMultiTenant: authUtil loaded:', typeof authUtil);
console.log('🔧 UsuarioMultiTenant: authUtil.verifyPassword:', typeof authUtil.verifyPassword);

class UsuarioMultiTenantModel {
  constructor() {
    this.masterDb = dbManager.getDb(); // Database principal
    this.tenantConnections = new Map(); // Cache de conexões por tenant
  }

  /**
   * Obter conexão do banco do tenant
   */
  getTenantDb(tenantId) {
    if (!this.tenantConnections.has(tenantId)) {
      const tenantDb = multiTenantDb.getTenantDb(tenantId);
      this.tenantConnections.set(tenantId, tenantDb);
    }
    return this.tenantConnections.get(tenantId);
  }

  /**
   * Cria um novo usuário (multi-tenant)
   */
  async create(userData, tenantId) {
    const { nome, role, email, senha, permissions } = userData;
    
    try {
      // Verificar limites do tenant
      const tenant = await this.getTenantInfo(tenantId);
      if (!tenant.canCreateUser()) {
        throw new Error('Limite de usuários atingido para este plano');
      }

      const senhaHash = await authUtil.hashPassword(senha);
      const tenantDb = this.getTenantDb(tenantId);
      
      // Definir permissões padrão baseadas no role
      const defaultPermissions = this.getDefaultPermissions(role);
      const finalPermissions = permissions || defaultPermissions;
      
      const result = tenantDb.prepare(`
        INSERT INTO usuarios (tenant_id, nome, role, email, senha_hash, permissions, status)
        VALUES (?, ?, ?, ?, ?, ?, 'active')
      `).run(tenantId, nome, role, email, senhaHash, JSON.stringify(finalPermissions));
      
      return this.findById(result.lastInsertRowid, tenantId);
      
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
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
  findById(id, tenantId) {
    const tenantDb = this.getTenantDb(tenantId);
    const usuario = tenantDb.prepare(`
      SELECT id, tenant_id, nome, email, role, permissions, avatar, telefone, 
             crm, especialidade, status, last_login, created_at, updated_at
      FROM usuarios 
      WHERE id = ? AND tenant_id = ?
    `).get(id, tenantId);
    
    if (usuario) {
      usuario.permissions = JSON.parse(usuario.permissions || '{}');
    }
    
    return usuario;
  }

  /**
   * Busca usuário por email (multi-tenant)
   * @param {string} email - Email do usuário
   * @param {string} tenantId - ID do tenant
   * @returns {Object|null} - Usuário encontrado
   */
  findByEmail(email, tenantId) {
    console.log('🔧 findByEmail called with:', email, 'tenantId:', tenantId);
    const tenantDb = this.getTenantDb(tenantId);
    console.log('🔧 tenantDb obtained for tenant:', tenantId);

    const usuario = tenantDb.prepare(`
      SELECT id, tenant_id, nome, email, senha_hash, role, permissions, avatar, telefone,
             crm, especialidade, status, last_login, created_at, updated_at
      FROM usuarios
      WHERE email = ? AND tenant_id = ?
    `).get(email, tenantId);

    console.log('🔧 Query result:', usuario ? 'User found' : 'User not found');
    if (usuario) {
      console.log('🔧 User data:', { id: usuario.id, email: usuario.email, tenant_id: usuario.tenant_id });
      usuario.permissions = JSON.parse(usuario.permissions || '{}');
    }

    return usuario;
  }

  /**
   * Autentica usuário (multi-tenant)
   * @param {string} email - Email do usuário
   * @param {string} senha - Senha do usuário
   * @param {string} tenantId - ID do tenant
   * @returns {Object|null} - Dados do usuário autenticado
   */
  authenticate(email, senha, tenantId) {
    console.log('🔧 UsuarioMultiTenant.authenticate called with:', email, 'tenantId:', tenantId);
    console.log('🔧 authenticate: Starting authentication process');

    const usuario = this.findByEmail(email, tenantId);
    
    if (!usuario) {
      console.log('🔧 UsuarioMultiTenant.authenticate: User not found');
      return null;
    }
    
    console.log('🔧 UsuarioMultiTenant.authenticate: User found, verifying password');
    // Por enquanto, verificar senha de forma síncrona
    const bcrypt = require('bcryptjs');
    const senhaValida = bcrypt.compareSync(senha, usuario.senha_hash);
    
    if (!senhaValida) {
      console.log('🔧 UsuarioMultiTenant.authenticate: Invalid password');
      return null;
    }
    
    // Remover hash da senha do retorno
    delete usuario.senha_hash;
    
    console.log('🔧 UsuarioMultiTenant.authenticate: Authentication successful');
    return usuario;
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
      SELECT id, nome, role, email, permissions, avatar, telefone, 
             crm, especialidade, status, last_login, created_at
      FROM usuarios 
      WHERE tenant_id = ?
    `;
    const params = [tenantId];

    if (filters.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY created_at DESC';

    const usuarios = tenantDb.prepare(query).all(...params);
    
    return usuarios.map(usuario => {
      usuario.permissions = JSON.parse(usuario.permissions || '{}');
      return usuario;
    });
  }

  /**
   * Atualizar usuário
   */
  async update(id, updateData, tenantId) {
    const tenantDb = this.getTenantDb(tenantId);
    const { nome, role, email, permissions, avatar, telefone, crm, especialidade, status } = updateData;
    
    try {
      let query = `
        UPDATE usuarios SET 
          nome = COALESCE(?, nome),
          role = COALESCE(?, role),
          email = COALESCE(?, email),
          permissions = COALESCE(?, permissions),
          avatar = COALESCE(?, avatar),
          telefone = COALESCE(?, telefone),
          crm = COALESCE(?, crm),
          especialidade = COALESCE(?, especialidade),
          status = COALESCE(?, status),
          updated_at = datetime('now')
        WHERE id = ? AND tenant_id = ?
      `;
      
      const permissionsJson = permissions ? JSON.stringify(permissions) : null;
      
      tenantDb.prepare(query).run(
        nome, role, email, permissionsJson, avatar, telefone, crm, especialidade, status, id, tenantId
      );
      
      return this.findById(id, tenantId);
      
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
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
    
    tenantDb.prepare(`
      UPDATE usuarios SET 
        senha_hash = ?,
        updated_at = datetime('now')
      WHERE id = ? AND tenant_id = ?
    `).run(senhaHash, id, tenantId);
    
    return true;
  }

  /**
   * Registrar último login
   */
  async updateLastLogin(id, tenantId) {
    const tenantDb = this.getTenantDb(tenantId);
    tenantDb.prepare(`
      UPDATE usuarios SET last_login = datetime('now')
      WHERE id = ? AND tenant_id = ?
    `).run(id, tenantId);
  }

  /**
   * Verificar permissão
   */
  hasPermission(usuario, permission) {
    // Owner e Admin têm todas as permissões
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
    const tenant = this.masterDb.prepare(`
      SELECT id, slug, nome, plano, status, config, billing
      FROM tenants 
      WHERE id = ?
    `).get(tenantId);
    
    if (tenant) {
      tenant.config = JSON.parse(tenant.config || '{}');
      tenant.billing = JSON.parse(tenant.billing || '{}');
      
      // Adicionar métodos helper
      tenant.canCreateUser = function() {
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
    const result = tenantDb.prepare(`
      SELECT COUNT(*) as total 
      FROM usuarios 
      WHERE tenant_id = ? AND status = 'active'
    `).get(tenantId);
    
    return result.total;
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
    
    const result = tenantDb.prepare(`
      INSERT INTO usuarios (tenant_id, nome, email, role, status, invite_token, invite_expire_at, permissions)
      VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)
    `).run(
      tenantId, 
      nome, 
      email, 
      role, 
      inviteToken, 
      inviteExpireAt.toISOString(),
      JSON.stringify(this.getDefaultPermissions(role))
    );
    
    // TODO: Enviar email de convite
    // await emailService.sendInvite(email, inviteToken, tenant);
    
    return {
      id: result.lastInsertRowid,
      inviteToken,
      inviteExpireAt
    };
  }

  /**
   * Aceitar convite
   */
  async acceptInvite(inviteToken, senha) {
    // Buscar em todos os tenants (ou usar índice global)
    const allTenants = this.masterDb.prepare('SELECT id FROM tenants').all();
    
    for (const tenant of allTenants) {
      const tenantDb = this.getTenantDb(tenant.id);
      const usuario = tenantDb.prepare(`
        SELECT * FROM usuarios 
        WHERE invite_token = ? AND invite_expire_at > datetime('now')
      `).get(inviteToken);
      
      if (usuario) {
        const senhaHash = await authUtil.hashPassword(senha);
        
        tenantDb.prepare(`
          UPDATE usuarios SET 
            senha_hash = ?,
            status = 'active',
            invite_token = NULL,
            invite_expire_at = NULL,
            email_verified_at = datetime('now'),
            updated_at = datetime('now')
          WHERE id = ?
        `).run(senhaHash, usuario.id);
        
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
    tenantDb.prepare(`
      UPDATE usuarios SET 
        status = 'inactive',
        updated_at = datetime('now')
      WHERE id = ? AND tenant_id = ?
    `).run(id, tenantId);
    
    return true;
  }

  /**
   * Permissões padrão por role
   */
  getDefaultPermissions(role) {
    const defaultPermissions = {
      owner: {
        agendamentos: true,
        pacientes: true,
        financeiro: true,
        whatsapp: true,
        automacoes: true,
        relatorios: true,
        configuracoes: true
      },
      admin: {
        agendamentos: true,
        pacientes: true,
        financeiro: true,
        whatsapp: true,
        automacoes: true,
        relatorios: true,
        configuracoes: false
      },
      medico: {
        agendamentos: true,
        pacientes: true,
        financeiro: false,
        whatsapp: false,
        automacoes: false,
        relatorios: true,
        configuracoes: false
      },
      recepcionista: {
        agendamentos: true,
        pacientes: true,
        financeiro: false,
        whatsapp: true,
        automacoes: false,
        relatorios: false,
        configuracoes: false
      },
      financeiro: {
        agendamentos: false,
        pacientes: false,
        financeiro: true,
        whatsapp: false,
        automacoes: false,
        relatorios: true,
        configuracoes: false
      }
    };

    return defaultPermissions[role] || defaultPermissions.medico;
  }
}

module.exports = new UsuarioMultiTenantModel();
