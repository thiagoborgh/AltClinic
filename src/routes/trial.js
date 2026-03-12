const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const mgr = require('../database/MultiTenantPostgres');
const { sendEmail } = require('../services/emailService');

/**
 * @route POST /api/tenants/trial
 * @desc Criar novo tenant para trial
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

    const masterDb = mgr.getMasterDb();

    // Verificar se email já existe
    const existingTenant = await masterDb.get(
      'SELECT id FROM tenants WHERE email = $1',
      [email]
    );

    if (existingTenant) {
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
    while (await masterDb.get('SELECT id FROM tenants WHERE slug = $1', [slug])) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Data de expiração do trial (15 dias)
    const trialExpireAt = new Date();
    trialExpireAt.setDate(trialExpireAt.getDate() + 15);

    // Configurações padrão do tenant
    const defaultConfig = {
      whatsapp_enabled: true,
      email_enabled: true,
      sms_enabled: false,
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
      language: 'pt-BR'
    };

    const defaultTheme = {
      primary_color: '#1976d2',
      secondary_color: '#dc004e',
      logo_url: null,
      custom_css: null
    };

    const defaultBilling = {
      plan: 'trial',
      status: 'trial',
      trial_started_at: new Date().toISOString(),
      trial_expire_at: trialExpireAt.toISOString()
    };

    // Criar tenant no database master
    const tenantId = crypto.randomUUID();
    const databaseName = `tenant_${slug}_${Date.now()}`;

    // Inserir tenant
    await masterDb.run(
      `INSERT INTO tenants (
        id, slug, nome, email, telefone, plano, status,
        trial_expire_at, database_name, config, billing, theme,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug, nome = EXCLUDED.nome, email = EXCLUDED.email,
        telefone = EXCLUDED.telefone, plano = EXCLUDED.plano, status = EXCLUDED.status,
        trial_expire_at = EXCLUDED.trial_expire_at, database_name = EXCLUDED.database_name,
        config = EXCLUDED.config, billing = EXCLUDED.billing, theme = EXCLUDED.theme,
        updated_at = EXCLUDED.updated_at`,
      [
        tenantId,
        slug,
        clinica,
        email,
        telefone || '',
        'trial',
        'trial',
        trialExpireAt.toISOString(),
        databaseName,
        JSON.stringify(defaultConfig),
        JSON.stringify(defaultBilling),
        JSON.stringify(defaultTheme),
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );

    // Criar schema do tenant
    await mgr.createTenantSchema(tenantId, slug);

    // Criar usuário admin para o tenant
    const tenantDb = mgr.getTenantDb(tenantId, slug);
    const bcrypt = require('bcryptjs');

    // Gerar senha temporária
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    await tenantDb.run(
      `INSERT INTO usuarios (
        tenant_id, nome, email, senha_hash, role, status,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        tenantId,
        nome,
        email,
        hashedPassword,
        'owner',
        'active',
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );

    // Enviar email de boas-vindas com credenciais
    try {
      const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?tenant=${slug}`;

      await sendEmail({
        to: email,
        subject: 'Bem-vindo ao Alt Clinic - Sua conta trial está pronta!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1976d2;">🎉 Bem-vindo ao Alt Clinic!</h1>

            <p>Olá <strong>${nome}</strong>,</p>

            <p>Sua conta trial do Alt Clinic está pronta! Você tem <strong>15 dias grátis</strong> para explorar todas as funcionalidades.</p>

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
              Este é um email automático. Sua trial expira em ${trialExpireAt.toLocaleDateString('pt-BR')}.
            </p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Erro ao enviar email de boas-vindas:', emailError);
      // Não falhar a criação do tenant por causa do email
    }

    // Log de auditoria
    console.log(`🎯 Trial criado: ${clinica} (${email}) - Slug: ${slug}`);

    res.status(201).json({
      success: true,
      message: 'Trial criado com sucesso! Verifique seu email.',
      tenant: {
        id: tenantId,
        slug: slug,
        nome: clinica,
        email: email,
        trial_expire_at: trialExpireAt.toISOString()
      },
      credentials: {
        email: email,
        temp_password: tempPassword,
        login_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?tenant=${slug}`
      }
    });

  } catch (error) {
    console.error('Erro ao criar trial:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/tenants/:tenantId/upgrade
 * @desc Fazer upgrade de um tenant trial para plano pago
 */
router.post('/:tenantId/upgrade', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { plano, paymentMethod } = req.body;

    if (!plano || !['starter', 'professional', 'enterprise'].includes(plano)) {
      return res.status(400).json({
        success: false,
        message: 'Plano inválido. Escolha: starter, professional ou enterprise'
      });
    }

    const masterDb = mgr.getMasterDb();

    // Verificar se tenant existe e está em trial
    const tenant = await masterDb.get(
      "SELECT * FROM tenants WHERE id = $1 AND status = 'trial'",
      [tenantId]
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant não encontrado ou não está em trial'
      });
    }

    // Definir preços dos planos
    const planos = {
      starter: { preco: 97, nome: 'Starter', max_users: 3 },
      professional: { preco: 197, nome: 'Professional', max_users: 10 },
      enterprise: { preco: 397, nome: 'Enterprise', max_users: 999 }
    };

    const planoInfo = planos[plano];

    // Aplicar desconto de 30% nos primeiros 30 dias
    const precoComDesconto = Math.round(planoInfo.preco * 0.7);

    // Atualizar billing info
    const newBilling = {
      plan: plano,
      status: 'active',
      price: planoInfo.preco,
      discounted_price: precoComDesconto,
      discount_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      trial_started_at: JSON.parse(tenant.billing).trial_started_at,
      trial_expire_at: tenant.trial_expire_at,
      upgraded_at: new Date().toISOString(),
      next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    // Atualizar tenant
    await masterDb.run(
      'UPDATE tenants SET plano = $1, status = $2, billing = $3, updated_at = $4 WHERE id = $5',
      [
        plano,
        'active',
        JSON.stringify(newBilling),
        new Date().toISOString(),
        tenantId
      ]
    );

    // Aqui você integraria com seu gateway de pagamento
    // Por enquanto, vamos simular a cobrança

    // Enviar email de confirmação
    try {
      await sendEmail({
        to: tenant.email,
        subject: `Upgrade realizado - Bem-vindo ao plano ${planoInfo.nome}!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1976d2;">🎉 Upgrade Realizado com Sucesso!</h1>

            <p>Parabéns! Sua clínica <strong>${tenant.nome}</strong> foi atualizada para o plano <strong>${planoInfo.nome}</strong>.</p>

            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>📋 Detalhes do Plano:</h3>
              <p><strong>Plano:</strong> ${planoInfo.nome}</p>
              <p><strong>Usuários:</strong> Até ${planoInfo.max_users === 999 ? 'ilimitados' : planoInfo.max_users}</p>
              <p><strong>Preço normal:</strong> R$ ${planoInfo.preco}/mês</p>
              <p><strong>Preço promocional:</strong> R$ ${precoComDesconto}/mês (30% OFF nos primeiros 30 dias)</p>
              <p><strong>Próxima cobrança:</strong> ${new Date(newBilling.next_billing_date).toLocaleDateString('pt-BR')}</p>
            </div>

            <p>Agora você tem acesso a todos os recursos do plano ${planoInfo.nome}!</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?tenant=${tenant.slug}" style="background: #1976d2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                🚀 Acessar Sistema
              </a>
            </div>

            <p>Obrigado por escolher o Alt Clinic!</p>
            <p><strong>Equipe Alt Clinic</strong></p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Erro ao enviar email de upgrade:', emailError);
    }

    console.log(`🚀 Upgrade realizado: ${tenant.nome} -> ${planoInfo.nome}`);

    res.json({
      success: true,
      message: `Upgrade para plano ${planoInfo.nome} realizado com sucesso!`,
      plan: {
        name: planoInfo.nome,
        price: planoInfo.preco,
        discounted_price: precoComDesconto,
        max_users: planoInfo.max_users,
        discount_until: newBilling.discount_until,
        next_billing_date: newBilling.next_billing_date
      }
    });

  } catch (error) {
    console.error('Erro ao fazer upgrade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
