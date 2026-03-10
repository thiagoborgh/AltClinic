const authUtil = require('../utils/auth');

class UsuarioModel {
  constructor(db) {
    this.db = db;
  }

  /**
   * Cria um novo usuário
   * @param {Object} userData - Dados do usuário
   * @returns {Object} - Usuário criado
   */
  async create(userData) {
    const { clinica_id, nome, role, email, senha } = userData;

    try {
      const senhaHash = await authUtil.hashPassword(senha);

      const r = await this.db.run(
        `INSERT INTO usuarios (clinica_id, nome, role, email, senha_hash)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [clinica_id, nome, role, email, senhaHash]
      );

      return this.findById(r.lastID);
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Email já está em uso');
      }
      throw error;
    }
  }

  /**
   * Busca usuário por ID
   * @param {number} id - ID do usuário
   * @returns {Object|null} - Usuário encontrado
   */
  async findById(id) {
    return this.db.get(
      `SELECT u.*, c.nome as clinica_nome
       FROM usuarios u
       LEFT JOIN clinicas c ON u.clinica_id = c.id
       WHERE u.id = $1`,
      [id]
    );
  }

  /**
   * Busca usuário por email
   * @param {string} email - Email do usuário
   * @returns {Object|null} - Usuário encontrado
   */
  async findByEmail(email) {
    return this.db.get(
      `SELECT u.*, c.nome as clinica_nome
       FROM usuarios u
       LEFT JOIN clinicas c ON u.clinica_id = c.id
       WHERE u.email = $1`,
      [email]
    );
  }

  /**
   * Autentica usuário
   * @param {string} email - Email do usuário
   * @param {string} senha - Senha do usuário
   * @returns {Object|null} - Dados do usuário autenticado
   */
  async authenticate(email, senha) {
    const usuario = await this.findByEmail(email);

    if (!usuario) {
      return null;
    }

    const senhaValida = await authUtil.verifyPassword(senha, usuario.senha_hash);

    if (!senhaValida) {
      return null;
    }

    delete usuario.senha_hash;
    return usuario;
  }

  /**
   * Lista usuários de uma clínica
   * @param {number} clinicaId - ID da clínica
   * @returns {Array} - Lista de usuários
   */
  async findByClinica(clinicaId) {
    return this.db.all(
      `SELECT id, nome, role, email, created_at, updated_at
       FROM usuario
       WHERE clinica_id = $1
       ORDER BY nome`,
      [clinicaId]
    );
  }

  /**
   * Atualiza dados do usuário
   * @param {number} id - ID do usuário
   * @param {Object} userData - Dados para atualizar
   * @returns {Object} - Usuário atualizado
   */
  async update(id, userData) {
    const { nome, role, email, senha } = userData;
    const updates = [];
    const values = [];
    let idx = 1;

    if (nome) {
      updates.push(`nome = $${idx++}`);
      values.push(nome);
    }

    if (role) {
      updates.push(`role = $${idx++}`);
      values.push(role);
    }

    if (email) {
      updates.push(`email = $${idx++}`);
      values.push(email);
    }

    if (senha) {
      const senhaHash = await authUtil.hashPassword(senha);
      updates.push(`senha_hash = $${idx++}`);
      values.push(senhaHash);
    }

    if (updates.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    try {
      await this.db.run(
        `UPDATE usuario SET ${updates.join(', ')} WHERE id = $${idx}`,
        values
      );

      return this.findById(id);
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Email já está em uso');
      }
      throw error;
    }
  }

  /**
   * Remove usuário
   * @param {number} id - ID do usuário
   * @returns {boolean} - True se removido com sucesso
   */
  async delete(id) {
    const result = await this.db.run(
      'DELETE FROM usuario WHERE id = $1',
      [id]
    );
    return result.changes > 0;
  }

  /**
   * Verifica se usuário pertence à clínica
   * @param {number} usuarioId - ID do usuário
   * @param {number} clinicaId - ID da clínica
   * @returns {boolean} - True se pertence
   */
  async belongsToClinica(usuarioId, clinicaId) {
    const result = await this.db.get(
      `SELECT 1 FROM usuario WHERE id = $1 AND clinica_id = $2`,
      [usuarioId, clinicaId]
    );
    return !!result;
  }
}

module.exports = UsuarioModel;
