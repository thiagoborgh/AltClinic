const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  // Inicializar transporter SMTP
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false // Para desenvolvimento
        }
      });

      console.log('✅ Serviço de email inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar serviço de email:', error);
    }
  }

  // Verificar conexão SMTP
  async verifyConnection() {
    try {
      if (!this.transporter) {
        throw new Error('Transporter não inicializado');
      }

      await this.transporter.verify();
      console.log('✅ Conexão SMTP verificada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro na verificação SMTP:', error);
      return false;
    }
  }

  // Carregar template de email
  loadTemplate(templateName) {
    try {
      const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
      
      if (fs.existsSync(templatePath)) {
        return fs.readFileSync(templatePath, 'utf8');
      }

      // Template padrão se arquivo não existir
      return this.getDefaultTemplate(templateName);
    } catch (error) {
      console.error(`Erro ao carregar template ${templateName}:`, error);
      return this.getDefaultTemplate(templateName);
    }
  }

  // Templates padrão em HTML
  getDefaultTemplate(templateName) {
    const templates = {
      'user-invite': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Convite para {tenantName}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 AltClinic</h1>
              <p>Convite para acessar {tenantName}</p>
            </div>
            <div class="content">
              <h2>Olá!</h2>
              <p><strong>{inviterName}</strong> convidou você para acessar a clínica <strong>{tenantName}</strong> na plataforma AltClinic.</p>
              
              <p><strong>Seu perfil:</strong> {role}</p>
              
              <p>Para aceitar o convite e começar a usar a plataforma, clique no botão abaixo:</p>
              
              <div style="text-align: center;">
                <a href="{inviteUrl}" class="button">Aceitar Convite</a>
              </div>
              
              <p><strong>⚠️ Importante:</strong> Este convite expira em {expiresAt}.</p>
              
              <hr>
              
              <h3>🚀 O que você pode fazer na AltClinic:</h3>
              <ul>
                <li>📅 Gerenciar agendamentos</li>
                <li>👥 Cadastrar e acompanhar pacientes</li>
                <li>💰 Controlar financeiro</li>
                <li>📊 Gerar relatórios</li>
                <li>📱 Integração com WhatsApp</li>
                <li>🔒 Sistema seguro e confiável</li>
              </ul>
              
              <p>Se você não solicitou este convite, pode ignorar este email.</p>
            </div>
            <div class="footer">
              <p>© 2025 AltClinic - Plataforma SaaS para Clínicas</p>
              <p>altclinic.com.br</p>
            </div>
          </div>
        </body>
        </html>
      `,

      'welcome': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Bem-vindo à AltClinic!</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bem-vindo à AltClinic!</h1>
            </div>
            <div class="content">
              <h2>Olá, {userName}!</h2>
              <p>Seu convite foi aceito com sucesso! Agora você tem acesso à <strong>{tenantName}</strong>.</p>
              
              <div style="text-align: center;">
                <a href="{loginUrl}" class="button">Acessar Plataforma</a>
              </div>
              
              <h3>🚀 Próximos passos:</h3>
              <ol>
                <li>Faça login na plataforma</li>
                <li>Complete seu perfil</li>
                <li>Explore as funcionalidades</li>
                <li>Configure suas preferências</li>
              </ol>
              
              <p>Se precisar de ajuda, nossa equipe está à disposição!</p>
            </div>
            <div class="footer">
              <p>© 2025 AltClinic - Plataforma SaaS para Clínicas</p>
              <p>altclinic.com.br</p>
            </div>
          </div>
        </body>
        </html>
      `,

      'password-reset': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Redefinir Senha - AltClinic</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Redefinir Senha</h1>
            </div>
            <div class="content">
              <h2>Solicitação de nova senha</h2>
              <p>Você solicitou a redefinição de sua senha na AltClinic.</p>
              
              <div style="text-align: center;">
                <a href="{resetUrl}" class="button">Redefinir Senha</a>
              </div>
              
              <p><strong>⚠️ Este link expira em 1 hora.</strong></p>
              
              <p>Se você não solicitou esta alteração, ignore este email. Sua senha permanecerá inalterada.</p>
            </div>
            <div class="footer">
              <p>© 2025 AltClinic - Plataforma SaaS para Clínicas</p>
              <p>altclinic.com.br</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return templates[templateName] || templates['user-invite'];
  }

  // Substituir variáveis no template
  replaceVariables(template, data) {
    let processedTemplate = template;

    Object.keys(data).forEach(key => {
      const placeholder = `{${key}}`;
      const value = data[key] || '';
      processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), value);
    });

    return processedTemplate;
  }

  // Enviar email
  async sendEmail({
    to,
    subject,
    template,
    data = {},
    html = null,
    text = null
  }) {
    try {
      if (!this.transporter) {
        throw new Error('Serviço de email não configurado');
      }

      let emailHtml = html;
      let emailText = text;

      // Se template especificado, carregar e processar
      if (template) {
        emailHtml = this.loadTemplate(template);
        emailHtml = this.replaceVariables(emailHtml, data);
        
        // Gerar versão text do HTML
        emailText = emailHtml.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'AltClinic <noreply@altclinic.com.br>',
        to: to,
        subject: subject,
        html: emailHtml,
        text: emailText
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Email enviado para ${to}:`, result.messageId);
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error(`❌ Erro ao enviar email para ${to}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enviar convite de usuário
  async sendUserInvite({
    email,
    tenantName,
    inviterName,
    role,
    inviteUrl,
    expiresAt
  }) {
    return await this.sendEmail({
      to: email,
      subject: `Convite para acessar ${tenantName} - AltClinic`,
      template: 'user-invite',
      data: {
        tenantName,
        inviterName,
        role,
        inviteUrl,
        expiresAt: new Date(expiresAt).toLocaleDateString('pt-BR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
    });
  }

  // Enviar email de boas-vindas
  async sendWelcomeEmail({
    email,
    userName,
    tenantName,
    loginUrl
  }) {
    return await this.sendEmail({
      to: email,
      subject: `Bem-vindo à ${tenantName} - AltClinic`,
      template: 'welcome',
      data: {
        userName,
        tenantName,
        loginUrl: loginUrl || process.env.FRONTEND_URL
      }
    });
  }

  // Enviar email de redefinição de senha
  async sendPasswordReset({
    email,
    resetUrl
  }) {
    return await this.sendEmail({
      to: email,
      subject: 'Redefinir sua senha - AltClinic',
      template: 'password-reset',
      data: {
        resetUrl
      }
    });
  }
}

// Singleton instance
let emailService = null;

const getEmailService = () => {
  if (!emailService) {
    emailService = new EmailService();
  }
  return emailService;
};

module.exports = {
  EmailService,
  sendEmail: getEmailService().sendEmail.bind(getEmailService()),
  sendUserInvite: getEmailService().sendUserInvite.bind(getEmailService()),
  sendWelcomeEmail: getEmailService().sendWelcomeEmail.bind(getEmailService()),
  sendPasswordReset: getEmailService().sendPasswordReset.bind(getEmailService()),
  verifyConnection: getEmailService().verifyConnection.bind(getEmailService())
};
