const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const firestoreService = require('../services/firestoreService');
const { sendEmail } = require('../services/emailService');
const bcrypt = require('bcryptjs');

/**
 * @route POST /api/tenants/trial
 * @desc Criar novo tenant para trial usando Firestore
 */
router.post('/trial', async (req, res) => {
  try {
    const { nome, email, telefone, clinica, especialidade } = req.body;

    // Validações básicas
    if (!nome || !email || !telefone || !clinica) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email, telefone e nome da clínica são obrigatórios'
      });
    }

    // Verificar se email já existe
    const existingResult = await firestoreService.emailExistsInAnyTenant(email);
    
    if (existingResult.exists) {
      return res.status(409).json({
        success: false,
        message: 'Este email já possui uma conta. Faça login ou entre em contato conosco.'
      });
    }

    // Gerar slug único para o tenant
    const baseSlug = clinica
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífen
      .substring(0, 30);

    let slug = baseSlug;
    let counter = 1;

    // Garantir que o slug é único
    while (await firestoreService.slugExists(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Data de expiração do trial (15 dias)
    const trialExpireAt = new Date();
    trialExpireAt.setDate(trialExpireAt.getDate() + 15);

    // Gerar senha temporária
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Criar tenant no Firestore
    const tenantData = {
      slug,
      nome: clinica,
      email,
      telefone: telefone || '',
      plano: 'trial',
      status: 'trial',
      trial_expire_at: trialExpireAt.toISOString(),
      config: {
        whatsapp_enabled: true,
        email_enabled: true,
        sms_enabled: false,
        timezone: 'America/Sao_Paulo',
        currency: 'BRL',
        language: 'pt-BR'
      },
      billing: {
        plan: 'trial',
        status: 'trial',
        trial_started_at: new Date().toISOString(),
        trial_expire_at: trialExpireAt.toISOString()
      },
      theme: {
        primary_color: '#1976d2',
        secondary_color: '#dc004e',
        logo_url: null,
        custom_css: null
      }
    };

    const tenant = await firestoreService.createTrialTenant(tenantData);

    // Criar usuário admin para o tenant
    const userData = {
      nome,
      email,
      senha_hash: hashedPassword,
      papel: 'owner',
      status: 'active'
    };

    await firestoreService.createFirstAdminUser(tenant.id, userData);

    // Enviar email de boas-vindas com credenciais
    try {
      const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?tenant=${slug}`;
      
      await sendEmail({
        to: email,
        subject: 'Bem-vindo ao AliClinic - Sua conta trial está pronta!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1976d2;">🎉 Bem-vindo ao AliClinic!</h1>
            
            <p>Olá <strong>${nome}</strong>,</p>
            
            <p>Sua conta trial do AliClinic está pronta! Você tem <strong>15 dias grátis</strong> para explorar todas as funcionalidades.</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>📋 Dados de Acesso:</h3>
              <p><strong>URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Senha temporária:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
              <p><strong>Clínica:</strong> ${clinica}</p>
            </div>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>🚀 Próximos Passos:</h3>
              <ol>
                <li>Acesse sua conta usando os dados acima</li>
                <li>Altere sua senha na primeira vez</li>
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
              <li>📧 Email: suporte@aliclinic.com.br</li>
              <li>📱 WhatsApp: (11) 99999-9999</li>
              <li>🕒 Horário: Segunda a Sexta, 8h às 18h</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" style="background: #1976d2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                🚀 Acessar Minha Conta
              </a>
            </div>
            
            <p>Sucesso e bons resultados!</p>
            <p><strong>Equipe AliClinic</strong></p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            
            <p style="font-size: 12px; color: #666;">
              Este é um período de teste gratuito de 15 dias. Você pode cancelar a qualquer momento.
              Após o período trial, você pode escolher um plano que se adeque às suas necessidades.
            </p>
          </div>
        `
      });

      console.log('✅ Email de boas-vindas enviado para:', email);
    } catch (emailError) {
      console.error('⚠️  Erro ao enviar email (mas tenant foi criado):', emailError);
      // Não falha a requisição se o email falhar
    }

    res.status(201).json({
      success: true,
      message: 'Conta trial criada com sucesso! Verifique seu email para as credenciais de acesso.',
      tenant: {
        id: tenant.id,
        slug,
        nome: clinica,
        email,
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?tenant=${slug}`,
        trialExpiresAt: trialExpireAt.toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro ao criar trial:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar conta trial',
      error: error.message
    });
  }
});

/**
 * @route GET /api/tenants/trial/:slug/status
 * @desc Verificar status do trial
 */
router.get('/trial/:slug/status', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const tenant = await firestoreService.getTenantBySlug(slug);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant não encontrado'
      });
    }

    const now = new Date();
    const trialExpireAt = new Date(tenant.trial_expire_at);
    const daysRemaining = Math.ceil((trialExpireAt - now) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      trial: {
        status: tenant.status,
        plan: tenant.plano,
        expiresAt: tenant.trial_expire_at,
        daysRemaining: Math.max(0, daysRemaining),
        expired: now > trialExpireAt
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status do trial:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status',
      error: error.message
    });
  }
});

/**
 * @route POST /api/tenants/trial/:slug/extend
 * @desc Estender período trial (apenas para admin)
 */
router.post('/trial/:slug/extend', async (req, res) => {
  try {
    const { slug } = req.params;
    const { days = 7 } = req.body;
    
    const tenant = await firestoreService.getTenantBySlug(slug);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant não encontrado'
      });
    }

    const newExpireDate = new Date(tenant.trial_expire_at);
    newExpireDate.setDate(newExpireDate.getDate() + days);

    await firestoreService.updateTenant(tenant.id, {
      trial_expire_at: newExpireDate.toISOString(),
      'billing.trial_expire_at': newExpireDate.toISOString()
    });

    res.json({
      success: true,
      message: `Trial estendido por ${days} dias`,
      newExpirationDate: newExpireDate.toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao estender trial:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao estender trial',
      error: error.message
    });
  }
});

module.exports = router;
