const crypto = require('crypto');

class EncryptionUtil {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
    
    // Usar chave do ambiente ou gerar uma para desenvolvimento
    this.key = process.env.ENCRYPTION_KEY 
      ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
      : crypto.randomBytes(this.keyLength);
      
    if (!process.env.ENCRYPTION_KEY) {
      console.warn('⚠️  ENCRYPTION_KEY não definida. Usando chave temporária para desenvolvimento.');
      console.log('🔑 Chave gerada:', this.key.toString('hex'));
    }
  }

  /**
   * Criptografa um texto ou buffer
   * @param {string|Buffer} data - Dados para criptografar
   * @returns {string} - String base64 com IV + tag + dados criptografados
   */
  encrypt(data) {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, this.key, { iv });
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Combinar IV + tag + dados criptografados em base64
      const combined = Buffer.concat([iv, tag, Buffer.from(encrypted, 'hex')]);
      return combined.toString('base64');
      
    } catch (error) {
      console.error('❌ Erro na criptografia:', error.message);
      throw new Error('Falha na criptografia dos dados');
    }
  }

  /**
   * Descriptografa dados criptografados
   * @param {string} encryptedData - String base64 com dados criptografados
   * @returns {string} - Dados descriptografados
   */
  decrypt(encryptedData) {
    try {
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extrair IV, tag e dados criptografados
      const iv = combined.slice(0, this.ivLength);
      const tag = combined.slice(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = combined.slice(this.ivLength + this.tagLength);
      
      const decipher = crypto.createDecipher(this.algorithm, this.key, { iv });
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, null, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
      
    } catch (error) {
      console.error('❌ Erro na descriptografia:', error.message);
      throw new Error('Falha na descriptografia dos dados');
    }
  }

  /**
   * Criptografa um arquivo e retorna o caminho criptografado
   * @param {string} originalPath - Caminho original do arquivo
   * @returns {string} - Caminho criptografado
   */
  encryptFilePath(originalPath) {
    return this.encrypt(originalPath);
  }

  /**
   * Descriptografa um caminho de arquivo
   * @param {string} encryptedPath - Caminho criptografado
   * @returns {string} - Caminho original
   */
  decryptFilePath(encryptedPath) {
    return this.decrypt(encryptedPath);
  }

  /**
   * Gera hash para dados sensíveis (não reversível)
   * @param {string} data - Dados para gerar hash
   * @returns {string} - Hash SHA-256
   */
  hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Gera um token aleatório seguro
   * @param {number} length - Tamanho do token em bytes
   * @returns {string} - Token em hexadecimal
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

module.exports = new EncryptionUtil();
