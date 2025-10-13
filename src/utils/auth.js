const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');

class AuthUtil {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
    this.jwtExpiry = '24h';
    this.saltRounds = 12;
  }

  /**
   * Gera hash da senha
   * @param {string} password - Senha em texto plano
   * @returns {Promise<string>} - Hash da senha
   */
  async hashPassword(password) {
    try {
      return await bcryptjs.hash(password, this.saltRounds);
    } catch (error) {
      console.error('❌ Erro ao gerar hash da senha:', error.message);
      throw new Error('Erro interno do servidor');
    }
  }

  /**
   * Verifica se a senha está correta
   * @param {string} password - Senha em texto plano
   * @param {string} hashedPassword - Hash armazenado
   * @returns {Promise<boolean>} - True se a senha está correta
   */
  async verifyPassword(password, hashedPassword) {
    try {
      return await bcryptjs.compare(password, hashedPassword);
    } catch (error) {
      console.error('❌ Erro ao verificar senha:', error.message);
      return false;
    }
  }

  /**
   * Gera token JWT
   * @param {Object} payload - Dados do usuário
   * @returns {string} - Token JWT
   */
  generateToken(payload) {
    try {
      return jwt.sign(payload, this.jwtSecret, { 
        expiresIn: this.jwtExpiry,
        issuer: 'saee-system'
      });
    } catch (error) {
      console.error('❌ Erro ao gerar token:', error.message);
      throw new Error('Erro interno do servidor');
    }
  }

  /**
   * Verifica e decodifica token JWT
   * @param {string} token - Token JWT
   * @returns {Object} - Payload decodificado
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expirado');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Token inválido');
      }
      throw new Error('Erro na validação do token');
    }
  }

  /**
   * Middleware para verificar autenticação
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  authenticate = (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Token de acesso requerido'
        });
      }
      
      const token = authHeader.substring(7);
      const decoded = this.verifyToken(token);
      
      req.user = decoded;
      next();
      
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Middleware para verificar permissões de role
   * @param {string[]} allowedRoles - Roles permitidas
   * @returns {Function} - Middleware function
   */
  authorize(allowedRoles = []) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }
      
      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado. Permissões insuficientes'
        });
      }
      
      next();
    };
  }

  /**
   * Middleware para verificar se o usuário pertence à clínica
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  checkClinicaAccess(req, res, next) {
    const clinicaId = req.params.clinicaId || req.body.clinica_id || req.query.clinica_id;
    
    if (!clinicaId) {
      return res.status(400).json({
        success: false,
        message: 'ID da clínica é obrigatório'
      });
    }
    
    if (req.user.clinica_id !== parseInt(clinicaId)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado à clínica especificada'
      });
    }
    
    next();
  }
}

module.exports = new AuthUtil();
