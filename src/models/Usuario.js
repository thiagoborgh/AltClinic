const dbManager = require('./database');
const authUtil = require('../utils/auth');

class UsuarioModel {
  constructor() {
    this.db = dbManager.getDb();
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
      
      const result = this.db.prepare(`
        INSERT INTO usuarios (clinica_id, nome, role, email, senha_hash)
        VALUES (?, ?, ?, ?, ?)
      `).run(clinica_id, nome, role, email, senhaHash);
      
      return this.findById(result.lastInsertRowid);
      
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
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
  findById(id) {
    return this.db.prepare(`
      SELECT u.*, c.nome as clinica_nome
      FROM usuarios u
      LEFT JOIN clinicas c ON u.clinica_id = c.id
      WHERE u.id = ?
    `).get(id);
  }

  /**
   * Busca usuário por email
   * @param {string} email - Email do usuário
   * @returns {Object|null} - Usuário encontrado
   */
  findByEmail(email) {
    return this.db.prepare(`
      SELECT u.*, c.nome as clinica_nome
      FROM usuarios u
      LEFT JOIN clinicas c ON u.clinica_id = c.id
      WHERE u.email = ?
    `).get(email);
  }

  /**
   * Autentica usuário
   * @param {string} email - Email do usuário
   * @param {string} senha - Senha do usuário
   * @returns {Object|null} - Dados do usuário autenticado
   */
  async authenticate(email, senha) {
    const usuario = this.findByEmail(email);
    
    if (!usuario) {
      return null;
    }
    
    const senhaValida = await authUtil.verifyPassword(senha, usuario.senha_hash);
    
    if (!senhaValida) {
      return null;
    }
    
    // Remover hash da senha do retorno
    delete usuario.senha_hash;
    return usuario;
  }

  /**
   * Lista usuários de uma clínica
   * @param {number} clinicaId - ID da clínica
   * @returns {Array} - Lista de usuários
   */
  findByClinica(clinicaId) {
    return this.db.prepare(`
      SELECT id, nome, role, email, created_at, updated_at
      FROM usuario
      WHERE clinica_id = ?
      ORDER BY nome
    `).all(clinicaId);
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
    
    if (nome) {
      updates.push('nome = ?');
      values.push(nome);
    }
    
    if (role) {
      updates.push('role = ?');
      values.push(role);
    }
    
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    
    if (senha) {
      const senhaHash = await authUtil.hashPassword(senha);
      updates.push('senha_hash = ?');
      values.push(senhaHash);
    }
    
    if (updates.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    try {
      this.db.prepare(`
        UPDATE usuario
        SET ${updates.join(', ')}
        WHERE id = ?
      `).run(...values);
      
      return this.findById(id);
      
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
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
  delete(id) {
    const result = this.db.prepare('DELETE FROM usuario WHERE id = ?').run(id);
    return result.changes > 0;
  }

  /**
   * Verifica se usuário pertence à clínica
   * @param {number} usuarioId - ID do usuário
   * @param {number} clinicaId - ID da clínica
   * @returns {boolean} - True se pertence
   */
  belongsToClinica(usuarioId, clinicaId) {
    const result = this.db.prepare(`
      SELECT 1 FROM usuario
      WHERE id = ? AND clinica_id = ?
    `).get(usuarioId, clinicaId);
    
    return !!result;
  }
}

module.exports = new UsuarioModel();
