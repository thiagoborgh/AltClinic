const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Inicializar Firebase Admin (se ainda não inicializado)
if (!admin.apps.length) {
  const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: `${serviceAccount.project_id}.appspot.com`
    });
  } else {
    admin.initializeApp();
  }
}

const bucket = admin.storage().bucket();

/**
 * Serviço para gerenciar arquivos de mídia do WhatsApp no Cloud Storage
 */
class StorageService {
  /**
   * Faz upload de arquivo para o Cloud Storage
   * @param {string} tenantId - ID do tenant
   * @param {Buffer} fileBuffer - Buffer do arquivo
   * @param {string} fileName - Nome do arquivo
   * @param {string} contentType - Tipo do arquivo (image/jpeg, etc)
   * @returns {Promise<Object>} - URL pública do arquivo
   */
  async uploadWhatsAppMedia(tenantId, fileBuffer, fileName, contentType) {
    try {
      const filePath = `whatsapp_media/${tenantId}/${Date.now()}_${fileName}`;
      const file = bucket.file(filePath);

      await file.save(fileBuffer, {
        metadata: {
          contentType,
          metadata: {
            tenantId,
            uploadedAt: new Date().toISOString()
          }
        }
      });

      // Tornar arquivo público (ou gerar URL assinada)
      await file.makePublic();

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

      return {
        success: true,
        url: publicUrl,
        filePath
      };

    } catch (error) {
      console.error('❌ Erro ao fazer upload de mídia:', error);
      throw error;
    }
  }

  /**
   * Baixa arquivo da URL do Twilio e salva no Storage
   * @param {string} tenantId - ID do tenant
   * @param {string} mediaUrl - URL da mídia no Twilio
   * @param {string} messageId - ID da mensagem
   * @returns {Promise<Object>} - URL pública do arquivo
   */
  async downloadAndUploadFromTwilio(tenantId, mediaUrl, messageId) {
    try {
      const axios = require('axios');
      
      // Baixar arquivo do Twilio
      const response = await axios.get(mediaUrl, {
        responseType: 'arraybuffer',
        auth: {
          username: process.env.TWILIO_ACCOUNT_SID,
          password: process.env.TWILIO_AUTH_TOKEN
        }
      });

      const contentType = response.headers['content-type'];
      const extension = this.getExtensionFromContentType(contentType);
      const fileName = `${messageId}${extension}`;

      // Upload para Cloud Storage
      return await this.uploadWhatsAppMedia(
        tenantId,
        Buffer.from(response.data),
        fileName,
        contentType
      );

    } catch (error) {
      console.error('❌ Erro ao baixar e fazer upload de mídia:', error);
      throw error;
    }
  }

  /**
   * Gera URL assinada temporária (válida por 1 hora)
   * @param {string} filePath - Caminho do arquivo no Storage
   * @returns {Promise<string>} - URL assinada
   */
  async getSignedUrl(filePath) {
    try {
      const file = bucket.file(filePath);
      
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000 // 1 hora
      });

      return url;

    } catch (error) {
      console.error('❌ Erro ao gerar URL assinada:', error);
      throw error;
    }
  }

  /**
   * Deleta arquivo do Storage
   * @param {string} filePath - Caminho do arquivo
   * @returns {Promise<boolean>} - Sucesso
   */
  async deleteFile(filePath) {
    try {
      await bucket.file(filePath).delete();
      return true;

    } catch (error) {
      console.error('❌ Erro ao deletar arquivo:', error);
      throw error;
    }
  }

  /**
   * Lista arquivos de um tenant
   * @param {string} tenantId - ID do tenant
   * @returns {Promise<Array>} - Lista de arquivos
   */
  async listTenantMedia(tenantId) {
    try {
      const [files] = await bucket.getFiles({
        prefix: `whatsapp_media/${tenantId}/`
      });

      return files.map(file => ({
        name: file.name,
        size: file.metadata.size,
        contentType: file.metadata.contentType,
        created: file.metadata.timeCreated,
        publicUrl: `https://storage.googleapis.com/${bucket.name}/${file.name}`
      }));

    } catch (error) {
      console.error('❌ Erro ao listar arquivos:', error);
      throw error;
    }
  }

  /**
   * Retorna extensão baseada no content-type
   * @param {string} contentType - Content type do arquivo
   * @returns {string} - Extensão
   */
  getExtensionFromContentType(contentType) {
    const map = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/mpeg': '.mpeg',
      'audio/mpeg': '.mp3',
      'audio/ogg': '.ogg',
      'audio/wav': '.wav',
      'application/pdf': '.pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
    };

    return map[contentType] || '.bin';
  }

  /**
   * Limpa arquivos antigos (mais de 90 dias)
   * @param {string} tenantId - ID do tenant (opcional)
   * @returns {Promise<number>} - Quantidade de arquivos deletados
   */
  async cleanupOldMedia(tenantId = null) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      const prefix = tenantId 
        ? `whatsapp_media/${tenantId}/` 
        : 'whatsapp_media/';

      const [files] = await bucket.getFiles({ prefix });

      let deletedCount = 0;

      for (const file of files) {
        const created = new Date(file.metadata.timeCreated);
        
        if (created < cutoffDate) {
          await file.delete();
          deletedCount++;
        }
      }

      console.log(`🧹 ${deletedCount} arquivos antigos deletados`);
      return deletedCount;

    } catch (error) {
      console.error('❌ Erro ao limpar arquivos antigos:', error);
      throw error;
    }
  }
}

module.exports = new StorageService();
