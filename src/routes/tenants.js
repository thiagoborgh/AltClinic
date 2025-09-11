const express = require('express');
const router = express.Router();
const multiTenantDb = require('../models/MultiTenantDatabase');
const { v4: uuidv4 } = require('uuid');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userService = require('../services/userService');

/**
 * Criar novo tenant (Self-service onboarding)
 * POST /api/tenants/register
 */
router.post('/register', async (req, res) => {
  console.log('🚀 REGISTRO: Rota /register chamada');
  console.log('📝 Body recebido:', req.body);
  
  try {
    const {
      clinicaNome,
      slug,
      ownerNome,
      ownerEmail,
      ownerSenha,
      telefone,
      plano = 'trial'
    } = req.body;

    console.log('🔍 Dados extraídos:', { clinicaNome, slug, ownerNome, ownerEmail, telefone, plano });

    // Validações básicas
    if (!clinicaNome || !slug || !ownerNome || !ownerEmail || !ownerSenha) {
      console.log('❌ Validação falhou - dados obrigatórios');
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos',
        required: ['clinicaNome', 'slug', 'ownerNome', 'ownerEmail', 'ownerSenha']
      });
    }

    console.log('✅ Validações básicas passaram');

    // Validar formato do slug
    if (!/^[a-z0-9-]+$/.test(slug) || slug.length < 3 || slug.length > 50) {
      console.log('❌ Slug inválido:', slug);
      return res.status(400).json({
        error: 'Slug inválido',
        message: 'Use apenas letras minúsculas, números e hífens (3-50 caracteres)'
      });
    }

    console.log('✅ Slug válido:', slug);

    const masterDb = multiTenantDb.getMasterDb();
    console.log('✅ Master DB obtido');

    // Verificar se slug já existe
    const existingTenant = masterDb.prepare(`
      SELECT id FROM tenants WHERE slug = ?
    `).get(slug);

    console.log('🔍 Verificação de slug existente:', existingTenant ? 'EXISTE' : 'LIVRE');

    if (existingTenant) {
      console.log('❌ Slug já existe:', slug);
      return res.status(409).json({
        error: 'Slug já existe',
        message: 'Escolha outro nome para sua clínica'
      });
    }

    console.log('✅ Slug disponível, verificando usuário existente...');

    // Verificar se email já existe e determinar ação
    const existingUserCheck = await userService.checkExistingUser(ownerEmail);
    console.log('🔍 Verificação de usuário existente:', existingUserCheck);

    if (existingUserCheck.exists) {
      // Email já existe, determinar ação baseada no status do usuário
      if (existingUserCheck.action === 'resend-first-access') {
        // Reenviar email de primeiro acesso
        try {
          await userService.resendFirstAccessEmail(existingUserCheck.user, existingUserCheck.tenant);
          return res.status(409).json({
            success: false,
            error: 'Email já cadastrado',
            message: 'Este email já está em uso, mas o primeiro acesso não foi feito. Email reenviado com instruções.',
            action: 'first-access-resent'
          });
        } catch (emailError) {
          console.error('Erro ao reenviar email:', emailError);
          return res.status(500).json({
            success: false,
            error: 'Erro interno',
            message: 'Erro ao reenviar email de primeiro acesso'
          });
        }
      } else if (existingUserCheck.action === 'send-password-recovery') {
        // Enviar email de recuperação de senha
        try {
          await userService.sendPasswordRecoveryEmail(existingUserCheck.user, existingUserCheck.tenant);
          return res.status(409).json({
            success: false,
            error: 'Email já cadastrado',
            message: 'Este email já está em uso. Email de recuperação de senha enviado.',
            action: 'password-recovery-sent'
          });
        } catch (emailError) {
          console.error('Erro ao enviar email de recuperação:', emailError);
          return res.status(500).json({
            success: false,
            error: 'Erro interno',
            message: 'Erro ao enviar email de recuperação'
          });
        }
      }
    }

    // Gerar IDs
    const tenantId = uuidv4();
    const databaseName = `tenant_${slug}_${Date.now()}`;
    
    // Configurar trial
    const trialExpireAt = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30 dias

    // Configurações padrão
    const defaultConfig = {
      maxUsuarios: plano === 'trial' ? 3 : getPlansConfig()[plano]?.maxUsuarios || 3,
      maxPacientes: plano === 'trial' ? 500 : getPlansConfig()[plano]?.maxPacientes || 500,
      whatsappEnabled: true,
      telemedicina: false,
      customBranding: false,
      apiAccess: false
    };

    const defaultBilling = {
      proximoVencimento: null,
      valor: 0,
      customerId: null,
      subscriptionId: null
    };

    const defaultTheme = {
      primaryColor: '#1976d2',
      logo: null,
      favicon: null,
      customDomain: null
    };

    // Iniciar transação
    const insertTenant = masterDb.prepare(`
      INSERT INTO tenants (
        id, slug, nome, email, telefone, plano, status, 
        trial_expire_at, database_name, config, billing, theme
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertOwner = masterDb.prepare(`
      INSERT INTO master_users (tenant_id, email, senha_hash, role)
      VALUES (?, ?, ?, ?)
    `);

    // Hash da senha
    const senhaHash = await bcryptjs.hash(ownerSenha, 12);

    // Executar transação
    const transaction = masterDb.transaction(() => {
      // Inserir tenant
      insertTenant.run(
        tenantId,
        slug,
        clinicaNome,
        ownerEmail,
        telefone,
        plano,
        'trial',
        trialExpireAt.toISOString(),
        databaseName,
        JSON.stringify(defaultConfig),
        JSON.stringify(defaultBilling),
        JSON.stringify(defaultTheme)
      );

      // Inserir owner no master
      insertOwner.run(tenantId, ownerEmail, senhaHash, 'owner');
    });

    transaction();

    // Criar database do tenant
    await multiTenantDb.createTenantDatabase(tenantId, databaseName);

    // Criar usuário owner no database do tenant
    const tenantDb = multiTenantDb.getTenantDb(tenantId);
    tenantDb.prepare(`
      INSERT INTO usuarios (
        tenant_id, nome, email, senha_hash, role, permissions, status, email_verified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tenantId,
      ownerNome,
      ownerEmail,
      senhaHash,
      'owner',
      JSON.stringify({
        agendamentos: true,
        pacientes: true,
        financeiro: true,
        whatsapp: true,
        automacoes: true,
        relatorios: true,
        configuracoes: true
      }),
      'active',
      new Date().toISOString()
    );

    // Inserir dados iniciais (configurações padrão)
    await seedTenantData(tenantDb, tenantId);

    // Gerar token JWT para login automático
    const token = jwt.sign(
      { 
        userId: 1, // primeiro usuário no tenant DB
        tenantId,
        email: ownerEmail,
        role: 'owner'
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    // Log da criação
    console.log(`✅ Tenant criado: ${clinicaNome} (${slug}) - Owner: ${ownerNome}`);

    // Enviar email de primeiro acesso com credenciais
    try {
      const emailService = require('../services/emailService');
      
      // Gerar senha temporária para primeiro acesso
      const tempPassword = require('crypto').randomBytes(8).toString('hex');
      const tempPasswordHash = await bcryptjs.hash(tempPassword, 12);
      
      // Atualizar senha no banco do tenant para a temporária
      tenantDb.prepare(`
        UPDATE usuarios 
        SET senha_hash = ?, email_verified_at = NULL, status = 'pending_first_access'
        WHERE email = ? AND tenant_id = ?
      `).run(tempPasswordHash, ownerEmail, tenantId);
      
      // Atualizar master_users também
      masterDb.prepare(`
        UPDATE master_users 
        SET senha_hash = ?
        WHERE email = ? AND tenant_id = ?
      `).run(tempPasswordHash, ownerEmail, tenantId);

      const templateData = {
        userName: ownerNome,
        tenantName: clinicaNome,
        email: ownerEmail,
        tempPassword: tempPassword,
        loginUrl: process.env.NODE_ENV === 'production' 
          ? `https://altclinic.onrender.com/login`
          : `http://localhost:3000/login`,
        trialExpireAt: `<p><strong>📅 Período de teste:</strong> Expira em ${trialExpireAt.toLocaleDateString('pt-BR')}</p>`
      };

      await emailService.sendEmail({
        to: ownerEmail,
        subject: `Bem-vindo à ${clinicaNome} - Suas credenciais de acesso`,
        template: 'first-access',
        data: templateData
      });

      console.log(`📧 Email de primeiro acesso enviado para: ${ownerEmail}`);
      console.log(`🔑 Senha temporária: ${tempPassword}`);

    } catch (emailError) {
      console.error('⚠️ Erro ao enviar email de primeiro acesso:', emailError);
      // Não falhar o cadastro por causa do email
    }

    res.status(201).json({
      message: 'Clínica criada com sucesso! Verifique seu email para acessar.',
      tenant: {
        id: tenantId,
        slug,
        nome: clinicaNome,
        url: process.env.NODE_ENV === 'production' 
          ? `https://altclinic.onrender.com`
          : `http://localhost:3000`,
        status: 'trial',
        trialExpireAt: trialExpireAt.toISOString(),
        config: defaultConfig
      },
      owner: {
        nome: ownerNome,
        email: ownerEmail,
        role: 'owner'
      },
      emailSent: true,
      loginInstructions: {
        message: 'Um email foi enviado com suas credenciais de primeiro acesso.',
        loginUrl: process.env.NODE_ENV === 'production' 
          ? `https://altclinic.onrender.com/login`
          : `http://localhost:3000/login`,
        checkEmail: 'Verifique sua caixa de entrada e spam.'
      },
      onboarding: {
        nextSteps: [
          'Verificar email com credenciais de acesso',
          'Fazer primeiro login com senha temporária',
          'Configurar nova senha personalizada',
          'Configurar perfil da clínica',
          'Adicionar serviços oferecidos'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Erro ao criar tenant:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Falha ao criar clínica'
    });
  }
});

/**
 * Login multi-tenant
 * POST /api/tenants/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, senha, tenantSlug } = req.body;

    if (!email || !senha || !tenantSlug) {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos',
        required: ['email', 'senha', 'tenantSlug']
      });
    }

    const masterDb = multiTenantDb.getMasterDb();

    // Buscar tenant
    const tenant = masterDb.prepare(`
      SELECT id, slug, nome, status, trial_expire_at 
      FROM tenants 
      WHERE slug = ?
    `).get(tenantSlug);

    if (!tenant) {
      return res.status(404).json({
        error: 'Clínica não encontrada',
        message: 'Verifique o endereço da clínica'
      });
    }

    // Verificar status do tenant
    if (tenant.status === 'suspended') {
      return res.status(402).json({
        error: 'Clínica suspensa',
        message: 'Entre em contato com o suporte'
      });
    }

    if (tenant.status === 'trial' && tenant.trial_expire_at) {
      const trialExpire = new Date(tenant.trial_expire_at);
      if (new Date() > trialExpire) {
        return res.status(402).json({
          error: 'Trial expirado',
          message: 'Faça upgrade do seu plano para continuar',
          upgradeUrl: `/upgrade?tenant=${tenantSlug}`
        });
      }
    }

    // Buscar usuário no database do tenant
    const tenantDb = multiTenantDb.getTenantDb(tenant.id);
    const usuario = tenantDb.prepare(`
      SELECT id, nome, email, senha_hash, role, permissions, status, last_login
      FROM usuarios 
      WHERE email = ? AND tenant_id = ?
    `).get(email, tenant.id);

    if (!usuario) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos'
      });
    }

    if (usuario.status !== 'active') {
      return res.status(401).json({
        error: 'Usuário inativo',
        message: 'Entre em contato com o administrador'
      });
    }

    // Verificar senha
    const senhaValida = await bcryptjs.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos'
      });
    }

    // Atualizar último login
    tenantDb.prepare(`
      UPDATE usuarios SET last_login = datetime('now') WHERE id = ?
    `).run(usuario.id);

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: usuario.id,
        tenantId: tenant.id,
        email: usuario.email,
        role: usuario.role
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        permissions: JSON.parse(usuario.permissions || '{}'),
        lastLogin: usuario.last_login
      },
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        nome: tenant.nome,
        status: tenant.status
      },
      auth: {
        token,
        expiresIn: '7d'
      }
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Falha no login'
    });
  }
});

/**
 * Listar todos os tenants (Admin)
 * GET /api/tenants
 */
router.get('/', async (req, res) => {
  try {
    // TODO: Adicionar middleware de autenticação admin
    
    const masterDb = multiTenantDb.getMasterDb();
    const { page = 1, limit = 50, status, plano } = req.query;
    
    let query = 'SELECT * FROM tenants WHERE 1=1';
    const params = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (plano) {
      query += ' AND plano = ?';
      params.push(plano);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const tenants = masterDb.prepare(query).all(...params);
    
    // Parsear JSON e adicionar estatísticas
    const tenantsWithStats = await Promise.all(tenants.map(async (tenant) => {
      tenant.config = JSON.parse(tenant.config || '{}');
      tenant.billing = JSON.parse(tenant.billing || '{}');
      tenant.theme = JSON.parse(tenant.theme || '{}');
      
      // Adicionar estatísticas
      try {
        const tenantDb = multiTenantDb.getTenantDb(tenant.id);
        const stats = {
          usuarios: tenantDb.prepare('SELECT COUNT(*) as count FROM usuarios WHERE status = "active"').get().count,
          pacientes: tenantDb.prepare('SELECT COUNT(*) as count FROM pacientes WHERE status = "ativo"').get().count,
          agendamentos: tenantDb.prepare('SELECT COUNT(*) as count FROM agendamentos WHERE date(data_agendamento) >= date("now")').get().count
        };
        tenant.stats = stats;
      } catch (error) {
        tenant.stats = { usuarios: 0, pacientes: 0, agendamentos: 0 };
      }
      
      return tenant;
    }));
    
    res.json({
      tenants: tenantsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: masterDb.prepare('SELECT COUNT(*) as count FROM tenants').get().count
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar tenants:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Atualizar tenant
 * PUT /api/tenants/:id
 */
router.put('/:id', async (req, res) => {
  try {
    // TODO: Adicionar middleware de autenticação (owner/admin)
    
    const { id } = req.params;
    const { nome, telefone, config, theme } = req.body;
    
    const masterDb = multiTenantDb.getMasterDb();
    
    const updateData = {};
    if (nome) updateData.nome = nome;
    if (telefone) updateData.telefone = telefone;
    if (config) updateData.config = JSON.stringify(config);
    if (theme) updateData.theme = JSON.stringify(theme);
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Nenhum dado para atualizar' });
    }
    
    updateData.updated_at = new Date().toISOString();
    
    const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);
    values.push(id);
    
    masterDb.prepare(`UPDATE tenants SET ${setClause} WHERE id = ?`).run(...values);
    
    // Buscar tenant atualizado
    const tenant = masterDb.prepare('SELECT * FROM tenants WHERE id = ?').get(id);
    tenant.config = JSON.parse(tenant.config || '{}');
    tenant.billing = JSON.parse(tenant.billing || '{}');
    tenant.theme = JSON.parse(tenant.theme || '{}');
    
    res.json({
      message: 'Tenant atualizado com sucesso',
      tenant
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar tenant:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Função auxiliar para obter configurações dos planos
 */
function getPlansConfig() {
  return {
    starter: {
      maxUsuarios: 3,
      maxPacientes: 500,
      whatsappEnabled: true,
      telemedicina: false,
      customBranding: false,
      apiAccess: false,
      valor: 199
    },
    professional: {
      maxUsuarios: 10,
      maxPacientes: 2000,
      whatsappEnabled: true,
      telemedicina: true,
      customBranding: true,
      apiAccess: true,
      valor: 399
    },
    enterprise: {
      maxUsuarios: -1, // ilimitado
      maxPacientes: -1, // ilimitado
      whatsappEnabled: true,
      telemedicina: true,
      customBranding: true,
      apiAccess: true,
      valor: 799
    }
  };
}

/**
 * Função auxiliar para inserir dados iniciais do tenant
 */
async function seedTenantData(tenantDb, tenantId) {
  // Configurações padrão
  const defaultConfigs = [
    { chave: 'clinica_nome', valor: '', tipo: 'string' },
    { chave: 'clinica_endereco', valor: '', tipo: 'string' },
    { chave: 'clinica_telefone', valor: '', tipo: 'string' },
    { chave: 'horario_funcionamento', valor: JSON.stringify({
      segunda: { inicio: '08:00', fim: '18:00', ativo: true },
      terca: { inicio: '08:00', fim: '18:00', ativo: true },
      quarta: { inicio: '08:00', fim: '18:00', ativo: true },
      quinta: { inicio: '08:00', fim: '18:00', ativo: true },
      sexta: { inicio: '08:00', fim: '18:00', ativo: true },
      sabado: { inicio: '08:00', fim: '12:00', ativo: false },
      domingo: { inicio: '08:00', fim: '12:00', ativo: false }
    }), tipo: 'json' },
    { chave: 'whatsapp_phone_id', valor: '', tipo: 'string' },
    { chave: 'whatsapp_access_token', valor: '', tipo: 'string' },
    { chave: 'whatsapp_webhook_token', valor: '', tipo: 'string' }
  ];

  const insertConfig = tenantDb.prepare(`
    INSERT INTO configuracoes (tenant_id, chave, valor, tipo) VALUES (?, ?, ?, ?)
  `);

  for (const config of defaultConfigs) {
    insertConfig.run(tenantId, config.chave, config.valor, config.tipo);
  }

  // Serviços padrão
  const defaultServicos = [
    { nome: 'Consulta Médica', descricao: 'Consulta médica geral', duracao: 60, valor: 150.00 },
    { nome: 'Retorno', descricao: 'Consulta de retorno', duracao: 30, valor: 80.00 },
    { nome: 'Exame de Rotina', descricao: 'Exames de rotina e preventivos', duracao: 30, valor: 100.00 }
  ];

  const insertServico = tenantDb.prepare(`
    INSERT INTO servicos (tenant_id, nome, descricao, duracao, valor) VALUES (?, ?, ?, ?, ?)
  `);

  for (const servico of defaultServicos) {
    insertServico.run(tenantId, servico.nome, servico.descricao, servico.duracao, servico.valor);
  }

  // Pacientes iniciais (fakes)
  const pacientes = [
    { nome: 'Maria Silva', email: 'maria.silva@example.com', telefone: '(11) 98888-1111', cpf: '123.456.789-00', data_nascimento: '1988-03-15', status: 'ativo' },
    { nome: 'João Santos', email: 'joao.santos@example.com', telefone: '(11) 97777-2222', cpf: '987.654.321-00', data_nascimento: '1982-07-22', status: 'ativo' },
    { nome: 'Ana Costa', email: 'ana.costa@example.com', telefone: '(11) 96666-3333', cpf: '111.222.333-44', data_nascimento: '1992-11-08', status: 'ativo' }
  ];

  const insertPaciente = tenantDb.prepare(`
    INSERT INTO pacientes (tenant_id, nome, email, telefone, cpf, data_nascimento, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const pacienteIds = [];
  for (const p of pacientes) {
    const res = insertPaciente.run(tenantId, p.nome, p.email, p.telefone, p.cpf, p.data_nascimento, p.status);
    pacienteIds.push(res.lastInsertRowid);
  }

  // Agendamentos iniciais (fakes) nos próximos dias
  const now = Date.now();
  function inDays(days, hour = 10) {
    const d = new Date(now + days * 24 * 60 * 60 * 1000);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  }

  const agendamentos = [
    { paciente_id: pacienteIds[0], data_agendamento: inDays(1, 10), duracao: 60, servico: 'Consulta Médica', status: 'agendado', valor: 150.00 },
    { paciente_id: pacienteIds[1], data_agendamento: inDays(2, 11), duracao: 30, servico: 'Retorno', status: 'agendado', valor: 80.00 },
    { paciente_id: pacienteIds[2], data_agendamento: inDays(3, 14), duracao: 30, servico: 'Exame de Rotina', status: 'agendado', valor: 100.00 }
  ];

  const insertAgendamento = tenantDb.prepare(`
    INSERT INTO agendamentos (tenant_id, paciente_id, medico_id, data_agendamento, duracao, servico, status, valor)
    VALUES (?, ?, NULL, ?, ?, ?, ?, ?)
  `);

  for (const a of agendamentos) {
    insertAgendamento.run(tenantId, a.paciente_id, a.data_agendamento, a.duracao, a.servico, a.status, a.valor);
  }

  console.log(`✅ Dados iniciais inseridos para tenant: ${tenantId}`);
}

/**
 * Verificar se slug já existe
 * GET /api/tenants/check-slug
 */
router.get('/check-slug', async (req, res) => {
  try {
    const { slug } = req.query;

    if (!slug) {
      return res.status(400).json({
        error: 'Slug é obrigatório',
        exists: false
      });
    }

    const masterDb = multiTenantDb.getMasterDb();
    const existingTenant = masterDb.prepare(`
      SELECT id FROM tenants WHERE slug = ?
    `).get(slug);

    res.json({
      exists: !!existingTenant,
      slug: slug
    });

  } catch (error) {
    console.error('❌ Erro ao verificar slug:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      exists: false
    });
  }
});

module.exports = router;
