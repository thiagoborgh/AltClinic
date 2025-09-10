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

      // Verificar se fez primeiro acesso
      const firstAccessCompleted = user.firstAccessCompleted || false;

      // Se não fez primeiro acesso, reenviar email de primeiro acesso
      if (!firstAccessCompleted) {
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

      // Se fez primeiro acesso, verificar se senha foi alterada
      // Para simplificar, vamos considerar que se fez primeiro acesso, a senha foi alterada
      // Em produção, seria melhor armazenar um hash da senha temporária para comparação
      if (firstAccessCompleted) {
        return {
          exists: true,
          action: 'send-password-recovery',
          user: user,
          tenant: {
            nome: user.tenantNome,
            slug: user.tenantSlug
          }
        };
      } else {
        // Primeiro acesso não foi feito, reenviar email de primeiro acesso
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
      // Para usuários existentes, vamos enviar um lembrete de primeiro acesso
      // sem mostrar a senha por segurança
      const templateData = {
        userName: user.name || 'Usuário',
        tenantName: tenant.nome,
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login/${tenant.slug}`,
        supportEmail: process.env.SUPPORT_EMAIL || 'suporte@altclinic.com.br'
      };

      const emailResult = await sendEmail({
        to: user.email,
        subject: `Lembrete de Primeiro Acesso - ${tenant.nome}`,
        template: 'first-access-reminder',
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
      // Gerar token de recuperação
      const resetToken = require('crypto').randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hora

      const templateData = {
        userName: user.name || 'Usuário',
        tenantName: tenant.nome,
        resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${user.email}`,
        supportEmail: process.env.SUPPORT_EMAIL || 'suporte@altclinic.com.br'
      };

      const emailResult = await sendEmail({
        to: user.email,
        subject: `Recuperação de Senha - ${tenant.nome}`,
        template: 'password-reset',
        data: templateData
      });

      return emailResult;

    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
