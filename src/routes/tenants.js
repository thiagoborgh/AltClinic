const express = require('express');
const router = express.Router();
const mgr = require('../database/MultiTenantPostgres');
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

    const masterDb = mgr.getMasterDb();
    console.log('✅ Master DB obtido');

    // Verificar se slug já existe
    const existingTenant = await masterDb.get(
      'SELECT id FROM tenants WHERE slug = $1',
      [slug]
    );

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

    // Hash da senha
    const senhaHash = await bcryptjs.hash(ownerSenha, 12);

    // Inserir tenant
    await masterDb.run(
      `INSERT INTO tenants (
        id, slug, nome, email, telefone, plano, status,
        trial_expire_at, database_name, config, billing, theme
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug, nome = EXCLUDED.nome, email = EXCLUDED.email,
        telefone = EXCLUDED.telefone, plano = EXCLUDED.plano, status = EXCLUDED.status,
        trial_expire_at = EXCLUDED.trial_expire_at, database_name = EXCLUDED.database_name,
        config = EXCLUDED.config, billing = EXCLUDED.billing, theme = EXCLUDED.theme`,
      [
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
      ]
    );

    // Inserir owner no master
    await masterDb.run(
      `INSERT INTO master_users (tenant_id, email, senha_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email, tenant_id) DO UPDATE SET senha_hash = EXCLUDED.senha_hash, role = EXCLUDED.role`,
      [tenantId, ownerEmail, senhaHash, 'owner']
    );

    // Criar schema do tenant
    await mgr.createTenantSchema(tenantId, slug);

    // Criar usuário owner no database do tenant
    const tenantDb = mgr.getTenantDb(tenantId, slug);
    await tenantDb.run(
      `INSERT INTO usuarios (
        tenant_id, nome, email, senha_hash, role, permissions, status, email_verified_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
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
      ]
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

    // Enviar email de primeiro acesso com credenciais (não bloquear resposta)
    setImmediate(async () => {
      try {
        console.log(`📧 Iniciando envio de email para: ${ownerEmail}`);
        const emailService = require('../services/emailService');

        // Gerar senha temporária para primeiro acesso
        const tempPassword = require('crypto').randomBytes(8).toString('hex');
        const tempPasswordHash = await bcryptjs.hash(tempPassword, 12);

        // Atualizar senha no banco do tenant para a temporária
        await tenantDb.run(
          `UPDATE usuarios
           SET senha_hash = $1, email_verified_at = NULL, status = 'pending_first_access'
           WHERE email = $2 AND tenant_id = $3`,
          [tempPasswordHash, ownerEmail, tenantId]
        );

        // Atualizar master_users também
        await masterDb.run(
          `UPDATE master_users
           SET senha_hash = $1
           WHERE email = $2 AND tenant_id = $3`,
          [tempPasswordHash, ownerEmail, tenantId]
        );

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
    });

    // Retornar resposta imediatamente (não esperar email)
    console.log(`✅ Preparando resposta de sucesso para: ${ownerEmail}`);

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

    const masterDb = mgr.getMasterDb();

    // Buscar tenant
    const tenant = await masterDb.get(
      'SELECT id, slug, nome, status, trial_expire_at FROM tenants WHERE slug = $1',
      [tenantSlug]
    );

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
    const tenantDb = mgr.getTenantDb(tenant.id, tenant.slug);
    const usuario = await tenantDb.get(
      `SELECT id, nome, email, senha_hash, role, permissions, status, last_login
       FROM usuarios
       WHERE email = $1 AND tenant_id = $2`,
      [email, tenant.id]
    );

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
    await tenantDb.run(
      'UPDATE usuarios SET last_login = NOW() WHERE id = $1',
      [usuario.id]
    );

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

    const masterDb = mgr.getMasterDb();
    const { page = 1, limit = 50, status, plano } = req.query;

    let query = 'SELECT * FROM tenants WHERE 1=1';
    const params = [];
    let paramIdx = 1;

    if (status) {
      query += ` AND status = $${paramIdx++}`;
      params.push(status);
    }

    if (plano) {
      query += ` AND plano = $${paramIdx++}`;
      params.push(plano);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const tenants = await masterDb.all(query, params);

    // Parsear JSON e adicionar estatísticas
    const tenantsWithStats = await Promise.all(tenants.map(async (tenant) => {
      tenant.config = JSON.parse(tenant.config || '{}');
      tenant.billing = JSON.parse(tenant.billing || '{}');
      tenant.theme = JSON.parse(tenant.theme || '{}');

      // Adicionar estatísticas
      try {
        const tenantDb = mgr.getTenantDb(tenant.id, tenant.slug);
        const [usuariosRow, pacientesRow, agendamentosRow] = await Promise.all([
          tenantDb.get('SELECT COUNT(*) as count FROM usuarios WHERE status = $1', ['active']),
          tenantDb.get('SELECT COUNT(*) as count FROM pacientes WHERE status = $1', ['ativo']),
          tenantDb.get('SELECT COUNT(*) as count FROM agendamentos WHERE data_agendamento >= CURRENT_DATE', [])
        ]);
        tenant.stats = {
          usuarios: usuariosRow.count,
          pacientes: pacientesRow.count,
          agendamentos: agendamentosRow.count
        };
      } catch (error) {
        tenant.stats = { usuarios: 0, pacientes: 0, agendamentos: 0 };
      }

      return tenant;
    }));

    const totalRow = await masterDb.get('SELECT COUNT(*) as count FROM tenants', []);

    res.json({
      tenants: tenantsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRow.count
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

    const masterDb = mgr.getMasterDb();

    const updateFields = [];
    const values = [];
    let paramIdx = 1;

    if (nome) {
      updateFields.push(`nome = $${paramIdx++}`);
      values.push(nome);
    }
    if (telefone) {
      updateFields.push(`telefone = $${paramIdx++}`);
      values.push(telefone);
    }
    if (config) {
      updateFields.push(`config = $${paramIdx++}`);
      values.push(JSON.stringify(config));
    }
    if (theme) {
      updateFields.push(`theme = $${paramIdx++}`);
      values.push(JSON.stringify(theme));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Nenhum dado para atualizar' });
    }

    updateFields.push(`updated_at = $${paramIdx++}`);
    values.push(new Date().toISOString());
    values.push(id);

    await masterDb.run(
      `UPDATE tenants SET ${updateFields.join(', ')} WHERE id = $${paramIdx}`,
      values
    );

    // Buscar tenant atualizado
    const tenant = await masterDb.get('SELECT * FROM tenants WHERE id = $1', [id]);
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

  for (const config of defaultConfigs) {
    await tenantDb.run(
      'INSERT INTO configuracoes (tenant_id, chave, valor, tipo) VALUES ($1, $2, $3, $4)',
      [tenantId, config.chave, config.valor, config.tipo]
    );
  }

  // Serviços padrão
  const defaultServicos = [
    { nome: 'Consulta Médica', descricao: 'Consulta médica geral', duracao: 60, valor: 150.00 },
    { nome: 'Retorno', descricao: 'Consulta de retorno', duracao: 30, valor: 80.00 },
    { nome: 'Exame de Rotina', descricao: 'Exames de rotina e preventivos', duracao: 30, valor: 100.00 }
  ];

  for (const servico of defaultServicos) {
    await tenantDb.run(
      'INSERT INTO servicos (tenant_id, nome, descricao, duracao, valor) VALUES ($1, $2, $3, $4, $5)',
      [tenantId, servico.nome, servico.descricao, servico.duracao, servico.valor]
    );
  }

  // Pacientes iniciais (fakes)
  const pacientes = [
    { nome: 'Maria Silva', email: 'maria.silva@example.com', telefone: '(11) 98888-1111', cpf: '123.456.789-00', data_nascimento: '1988-03-15', status: 'ativo' },
    { nome: 'João Santos', email: 'joao.santos@example.com', telefone: '(11) 97777-2222', cpf: '987.654.321-00', data_nascimento: '1982-07-22', status: 'ativo' },
    { nome: 'Ana Costa', email: 'ana.costa@example.com', telefone: '(11) 96666-3333', cpf: '111.222.333-44', data_nascimento: '1992-11-08', status: 'ativo' }
  ];

  const pacienteIds = [];
  for (const p of pacientes) {
    const result = await tenantDb.run(
      'INSERT INTO pacientes (tenant_id, nome, email, telefone, cpf, data_nascimento, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [tenantId, p.nome, p.email, p.telefone, p.cpf, p.data_nascimento, p.status]
    );
    pacienteIds.push(result.lastID);
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

  for (const a of agendamentos) {
    await tenantDb.run(
      'INSERT INTO agendamentos (tenant_id, paciente_id, medico_id, data_agendamento, duracao, servico, status, valor) VALUES ($1, $2, NULL, $3, $4, $5, $6, $7)',
      [tenantId, a.paciente_id, a.data_agendamento, a.duracao, a.servico, a.status, a.valor]
    );
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

    const masterDb = mgr.getMasterDb();
    const existingTenant = await masterDb.get(
      'SELECT id FROM tenants WHERE slug = $1',
      [slug]
    );

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
