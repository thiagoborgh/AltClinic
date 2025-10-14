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
      // Para desenvolvimento, usar console se SMTP não estiver configurado
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_PASS === 'sua_senha_de_app_do_gmail') {
        console.log('⚠️ SMTP não configurado completamente. Emails serão logados no console.');
        this.transporter = null;
        return;
      }

      const smtpConfig = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        // Aumentar timeouts para evitar ETIMEDOUT
        connectionTimeout: 60000, // 60 segundos
        greetingTimeout: 30000,   // 30 segundos
        socketTimeout: 60000,     // 60 segundos
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2'
        },
        // Configurações adicionais para melhor compatibilidade
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 5
      };

      console.log(`📧 Configurando SMTP: ${process.env.SMTP_USER} → ${process.env.SMTP_HOST}:${smtpConfig.port}`);
      
      this.transporter = nodemailer.createTransport(smtpConfig);

      console.log('✅ Serviço de email inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar serviço de email:', error);
      this.transporter = null;
    }
  }

  // Verificar conexão SMTP
  async verifyConnection() {
    try {
      // Se não há transporter configurado, retornar false
      if (!this.transporter) {
        console.log('⚠️ SMTP não configurado - emails serão simulados no console');
        return false;
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
          <title>Redefinição de Senha - AltClinic</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1976d2;">Redefinição de Senha</h2>
            <p>Olá,</p>
            <p>Recebemos uma solicitação para redefinir sua senha no sistema AltClinic.</p>
            <p>Clique no link abaixo para criar uma nova senha:</p>
            <p style="margin: 20px 0;">
              <a href="{resetUrl}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Redefinir Senha
              </a>
            </p>
            <p><strong>Importante:</strong></p>
            <ul>
              <li>Este link expira em 1 hora</li>
              <li>Se você não solicitou esta redefinição, ignore este email</li>
              <li>Por segurança, não compartilhe este link com ninguém</li>
            </ul>
            <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #666;">{resetUrl}</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              Esta é uma mensagem automática. Não responda este email.
            </p>
          </div>
        </body>
        </html>
      `,

      'first-access': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Bem-vindo à {tenantName} - Suas Credenciais</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .credentials { background: #fff; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .button { display: inline-block; background: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bem-vindo à {tenantName}!</h1>
            </div>
            <div class="content">
              <h2>Olá, {userName}!</h2>
              <p>Sua conta foi criada com sucesso na plataforma AltClinic. Aqui estão suas credenciais de acesso:</p>
              
              <div class="credentials">
                <h3>🔐 Suas Credenciais</h3>
                <p><strong>Email:</strong> {email}</p>
                <p><strong>Senha Temporária:</strong> {tempPassword}</p>
                <p style="color: #d32f2f;"><strong>⚠️ Importante:</strong> Altere sua senha no primeiro acesso!</p>
              </div>
              
              <div style="text-align: center;">
                <a href="{loginUrl}" class="button">Acessar Plataforma</a>
              </div>
              
              <h3>🚀 Próximos passos:</h3>
              <ol>
                <li>Clique no botão acima para fazer login</li>
                <li>Altere sua senha temporária</li>
                <li>Complete seu perfil</li>
                <li>Configure sua clínica</li>
              </ol>
              
              {trialExpireAt}
              
              <p>Se precisar de ajuda, nossa equipe está à disposição!</p>
              
              <p><strong>📞 Suporte:</strong> suporte@altclinic.com.br</p>
            </div>
            <div class="footer">
              <p>© 2025 AltClinic - Plataforma SaaS para Clínicas</p>
              <p>altclinic.com.br</p>
            </div>
          </div>
        </body>
        </html>
      `,

      'first-access-reminder': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Lembrete de Primeiro Acesso - {tenantName}</title>
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
              <h1>🔑 Primeiro Acesso</h1>
            </div>
            <div class="content">
              <h2>Olá, {userName}!</h2>
              <p>Recebemos sua solicitação de primeiro acesso à {tenantName}.</p>
              
              <p>Para acessar sua conta, siga estes passos:</p>
              
              <ol>
                <li>Clique no botão abaixo para ir à tela de login</li>
                <li>Use seu email cadastrado</li>
                <li>Use a senha que foi enviada no email de boas-vindas</li>
                <li>Altere sua senha no primeiro acesso</li>
              </ol>
              
              <div style="text-align: center;">
                <a href="{loginUrl}" class="button">Ir para Login</a>
              </div>
              
              <p><strong>Não lembra sua senha?</strong> Entre em contato conosco em {supportEmail}</p>
              
              <p>Se você não solicitou este acesso, ignore este email.</p>
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
      // Se não há transporter configurado, logar no console
      if (!this.transporter) {
        console.log('📧 [EMAIL SIMULADO - SMTP não configurado]');
        console.log(`📧 Para: ${to}`);
        console.log(`📧 Assunto: ${subject}`);
        console.log(`📧 Template: ${template}`);
        console.log(`📧 Dados:`, data);

        // Mostrar conteúdo do template processado
        if (template) {
          let simulatedHtml = this.loadTemplate(template);
          simulatedHtml = this.replaceVariables(simulatedHtml, data);
          console.log('📧 Conteúdo HTML processado (primeiras 500 chars):');
          console.log(simulatedHtml.substring(0, 500));
        }

        console.log('📧 --- FIM DO EMAIL SIMULADO ---');

        return {
          success: true,
          messageId: 'simulated-' + Date.now(),
          simulated: true
        };
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

  // Enviar email de primeiro acesso (trial)
  async sendFirstAccessEmail({
    email,
    userName,
    tenantName,
    tempPassword,
    trialExpireAt,
    loginUrl
  }) {
    return await this.sendEmail({
      to: email,
      subject: `Bem-vindo à ${tenantName} - Suas Credenciais de Acesso`,
      template: 'first-access',
      data: {
        userName,
        tenantName,
        email,
        tempPassword,
        loginUrl: loginUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
        supportEmail: process.env.SUPPORT_EMAIL || 'suporte@altclinic.com.br',
        trialExpireAt: new Date(trialExpireAt).toLocaleDateString('pt-BR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
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

  // Enviar senha temporária para novo usuário
  async sendTempPassword({
    to,
    nome,
    clinica,
    tempPassword,
    loginUrl,
    tenantSlug,
    createdByAdmin = false
  }) {
    const subject = createdByAdmin
      ? `Conta criada - ${clinica} - AltClinic`
      : 'Bem-vindo ao Alt Clinic - Sua conta está pronta!';

    return await this.sendEmail({
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1976d2;">${createdByAdmin ? '🏥' : '🎉'} ${createdByAdmin ? 'Conta Criada' : 'Bem-vindo ao Alt Clinic'}!</h1>
          
          <p>Olá <strong>${nome}</strong>,</p>
          
          ${createdByAdmin
          ? `<p>Sua conta foi criada com sucesso no sistema AltClinic para a clínica <strong>${clinica}</strong>.</p>`
          : `<p>Sua conta trial do Alt Clinic está pronta! Você tem <strong>30 dias grátis</strong> para explorar todas as funcionalidades.</p>`
        }
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📋 Dados de Acesso:</h3>
            <p><strong>URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
            <p><strong>Email:</strong> ${to}</p>
            <p><strong>Senha temporária:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 4px; font-size: 16px;">${tempPassword}</code></p>
            <p><strong>Clínica:</strong> ${clinica}</p>
          </div>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>🚀 Próximos Passos:</h3>
            <ol>
              <li>Acesse sua conta usando os dados acima</li>
              <li><strong>Altere sua senha</strong> na primeira vez que fizer login</li>
              <li>Configure os dados da sua clínica</li>
              <li>Adicione seus primeiros pacientes</li>
              <li>Explore o sistema de agendamentos</li>
            </ol>
          </div>
          
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>💡 Dicas para Começar:</h3>
            <ul>
              <li><strong>WhatsApp:</strong> Configure a integração para enviar lembretes automáticos</li>
              <li><strong>Agenda:</strong> Cadastre seus horários de atendimento</li>
              <li><strong>Serviços:</strong> Adicione os tratamentos que você oferece</li>
              <li><strong>Relatórios:</strong> Acompanhe o desempenho da sua clínica</li>
            </ul>
          </div>
          
          <p>Precisa de ajuda? Nossa equipe está aqui para você:</p>
          <ul>
            <li>📧 Email: suporte@altclinic.com.br</li>
            <li>📱 WhatsApp: (11) 99999-9999</li>
            <li>🕒 Horário: Segunda a Sexta, 8h às 18h</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background: #1976d2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              🚀 Acessar Minha Conta
            </a>
          </div>
          
          <p>Sucesso e bons resultados!</p>
          <p><strong>Equipe Alt Clinic</strong></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Este é um email automático. ${createdByAdmin ? 'Conta criada pelo administrador.' : 'Sua trial expira em 30 dias.'}
          </p>
        </div>
      `
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
  sendFirstAccessEmail: getEmailService().sendFirstAccessEmail.bind(getEmailService()),
  sendPasswordReset: getEmailService().sendPasswordReset.bind(getEmailService()),
  sendTempPassword: getEmailService().sendTempPassword.bind(getEmailService()),
  verifyConnection: getEmailService().verifyConnection.bind(getEmailService())
};
