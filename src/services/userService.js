const multiTenantDb = require('../models/MultiTenantDatabase');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../services/emailService');

class UserService {
  /**
   * Verifica se usuário já existe e determina ação necessária
   */
  async checkExistingUser(email) {
    try {
      const masterDb = multiTenantDb.getMasterDb();

      // Buscar usuário no master DB
      const user = masterDb.prepare(`
        SELECT mu.*, t.nome as tenantNome, t.slug as tenantSlug
        FROM master_users mu
        JOIN tenants t ON mu.tenant_id = t.id
        WHERE mu.email = ?
      `).get(email);

      if (!user) {
        return { exists: false };
      }

      // Verificar se fez primeiro acesso checando no banco do tenant
      let firstAccessCompleted = false;
      
      try {
        const tenantDb = multiTenantDb.getTenantDb(user.tenant_id);
        const tenantUser = tenantDb.prepare(`
          SELECT email_verified_at, status 
          FROM usuarios 
          WHERE email = ? AND tenant_id = ?
        `).get(user.email, user.tenant_id);
        
        firstAccessCompleted = tenantUser && 
                              tenantUser.email_verified_at && 
                              tenantUser.status === 'active';
      } catch (error) {
        console.error('⚠️ Erro ao verificar primeiro acesso:', error);
        // Se não conseguir verificar, assume que não completou
        firstAccessCompleted = false;
      }

      if (!firstAccessCompleted) {
        // Primeiro acesso nunca foi feito, reenviar email completo de boas-vindas
        return {
          exists: true,
          action: 'resend-first-access',
          user: user,
          tenant: {
            nome: user.tenantNome,
            slug: user.tenantSlug
          }
        };
      }

      // Se fez primeiro acesso, significa que a senha foi alterada
      // Enviar email de recuperação de senha
      return {
        exists: true,
        action: 'send-password-recovery',
        user: user,
        tenant: {
          nome: user.tenantNome,
          slug: user.tenantSlug
        }
      };

    } catch (error) {
      console.error('Erro ao verificar usuário existente:', error);
      throw error;
    }
  }

  /**
   * Reenvia email de primeiro acesso
   */
  async resendFirstAccessEmail(user, tenant) {
    try {
      // Para usuários que nunca fizeram primeiro acesso, reenviar email completo
      // Gerar nova senha temporária para segurança
      const tempPassword = require('crypto').randomBytes(8).toString('hex');

      // Atualizar senha no banco com a nova temporária
      const masterDb = require('../models/MultiTenantDatabase').getMasterDb();
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      masterDb.prepare(`
        UPDATE master_users
        SET senha_hash = ?
        WHERE id = ?
      `).run(hashedPassword, user.id);

      const templateData = {
        userName: user.name || 'Usuário',
        tenantName: tenant.nome,
        email: user.email,
        tempPassword: tempPassword,
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login/${tenant.slug}`,
        trialExpireAt: `<p><strong>📅 Período de teste:</strong> Expira em ${new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}</p>`
      };

      const emailResult = await sendEmail({
        to: user.email,
        subject: `Bem-vindo à ${tenant.nome} - Suas credenciais de acesso`,
        template: 'first-access',
        data: templateData
      });

      return emailResult;

    } catch (error) {
      console.error('Erro ao reenviar email de primeiro acesso:', error);
      throw error;
    }
  }

  /**
   * Envia email de recuperação de senha
   */
  async sendPasswordRecoveryEmail(user, tenant) {
    try {
      // Usar o endpoint padrão de forgot-password que já salva o token corretamente
      const axios = require('axios');
      const response = await axios.post(`${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/forgot-password`, {
        email: user.email
      });

      console.log('📧 Email de recuperação enviado via endpoint padrão:', user.email);
      return { success: true };

    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
