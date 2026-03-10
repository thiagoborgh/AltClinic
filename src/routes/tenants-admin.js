const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const mgr = require('../database/MultiTenantPostgres');

/**
 * ADMIN: Listar todos os tenants
 * GET /api/tenants/admin/list
 */
router.get('/list', async (req, res) => {
  try {
    const masterDb = mgr.getMasterDb();

    // Buscar todos os tenants com informações do owner
    const tenants = await masterDb.all(`
      SELECT
        t.*,
        mu.email as owner_email,
        mu.role as owner_role,
        mu.created_at as owner_created_at
      FROM tenants t
      LEFT JOIN master_users mu ON t.id = mu.tenant_id AND mu.role = 'owner'
      ORDER BY t.created_at DESC
    `, []);

    // Formatar dados para resposta
    const formattedTenants = tenants.map(tenant => ({
      id: tenant.id,
      slug: tenant.slug,
      nome: tenant.nome,
      email: tenant.email,
      telefone: tenant.telefone,
      plano: tenant.plano,
      status: tenant.status,
      trial_expire_at: tenant.trial_expire_at,
      database_name: tenant.database_name,
      created_at: tenant.created_at,
      updated_at: tenant.updated_at,
      owner: {
        nome: tenant.owner_email, // Usando email como nome temporariamente
        email: tenant.owner_email,
        role: tenant.owner_role,
        created_at: tenant.owner_created_at,
        first_access_completed: null // Não disponível na tabela atual
      },
      estatisticas: {
        total_usuarios: 0 // TODO: implementar contagem de usuários por tenant
      },
      config: JSON.parse(tenant.config || '{}'),
      billing: JSON.parse(tenant.billing || '{}'),
      theme: JSON.parse(tenant.theme || '{}')
    }));

    res.json({
      success: true,
      tenants: formattedTenants,
      total: formattedTenants.length
    });

  } catch (error) {
    console.error('❌ Erro ao listar tenants:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao listar tenants'
    });
  }
});

/**
 * ADMIN: Estatísticas gerais
 * GET /api/tenants/admin/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const masterDb = mgr.getMasterDb();

    // Estatísticas gerais
    const stats = await masterDb.get(`
      SELECT
        COUNT(*) as total_tenants,
        SUM(CASE WHEN status = 'trial' THEN 1 ELSE 0 END) as trial_tenants,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_tenants,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_tenants,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_tenants,
        SUM(CASE WHEN plano = 'trial' THEN 1 ELSE 0 END) as trial_plan,
        SUM(CASE WHEN plano = 'basic' THEN 1 ELSE 0 END) as basic_plan,
        SUM(CASE WHEN plano = 'premium' THEN 1 ELSE 0 END) as premium_plan
      FROM tenants
    `, []);

    // Tenants próximos da expiração (próximos 7 dias)
    const proximosVencimentos = await masterDb.all(`
      SELECT id, nome, slug, trial_expire_at
      FROM tenants
      WHERE status = 'trial'
        AND trial_expire_at IS NOT NULL
        AND trial_expire_at <= NOW() + INTERVAL '7 days'
        AND trial_expire_at > NOW()
      ORDER BY trial_expire_at ASC
      LIMIT 10
    `, []);

    // Novos tenants (últimos 30 dias)
    const novosTenants = await masterDb.all(`
      SELECT id, nome, slug, created_at
      FROM tenants
      WHERE created_at >= NOW() - INTERVAL '30 days'
      ORDER BY created_at DESC
      LIMIT 10
    `, []);

    res.json({
      success: true,
      stats: {
        total_tenants: stats.total_tenants,
        por_status: {
          trial: stats.trial_tenants,
          active: stats.active_tenants,
          suspended: stats.suspended_tenants,
          cancelled: stats.cancelled_tenants
        },
        por_plano: {
          trial: stats.trial_plan,
          basic: stats.basic_plan,
          premium: stats.premium_plan
        }
      },
      proximos_vencimentos: proximosVencimentos,
      novos_tenants: novosTenants
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao buscar estatísticas'
    });
  }
});

/**
 * ADMIN: Buscar tenant por ID
 * GET /api/tenants/admin/:tenantId
 */
router.get('/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const masterDb = mgr.getMasterDb();

    // Buscar tenant específico
    const tenant = await masterDb.get(`
      SELECT
        t.*,
        mu.email as owner_email,
        mu.role as owner_role,
        mu.created_at as owner_created_at
      FROM tenants t
      LEFT JOIN master_users mu ON t.id = mu.tenant_id AND mu.role = 'owner'
      WHERE t.id = $1
    `, [tenantId]);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant não encontrado'
      });
    }

    // Formatar resposta
    const formattedTenant = {
      id: tenant.id,
      slug: tenant.slug,
      nome: tenant.nome,
      email: tenant.email,
      telefone: tenant.telefone,
      plano: tenant.plano,
      status: tenant.status,
      trial_expire_at: tenant.trial_expire_at,
      database_name: tenant.database_name,
      created_at: tenant.created_at,
      updated_at: tenant.updated_at,
      owner: {
        nome: tenant.owner_email,
        email: tenant.owner_email,
        role: tenant.owner_role,
        created_at: tenant.owner_created_at,
        first_access_completed: null
      },
      config: JSON.parse(tenant.config || '{}'),
      billing: JSON.parse(tenant.billing || '{}'),
      theme: JSON.parse(tenant.theme || '{}')
    };

    res.json({
      success: true,
      tenant: formattedTenant
    });

  } catch (error) {
    console.error('❌ Erro ao buscar tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao buscar tenant'
    });
  }
});

/**
 * ADMIN: Resetar período de teste
 * PUT /api/tenants/admin/:tenantId/reset-trial
 */
router.put('/:tenantId/reset-trial', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { dias = 30 } = req.body;

    const masterDb = mgr.getMasterDb();

    // Verificar se tenant existe
    const tenant = await masterDb.get('SELECT * FROM tenants WHERE id = $1', [tenantId]);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant não encontrado'
      });
    }

    // Calcular nova data de expiração
    const novaDataExpiracao = new Date(Date.now() + (dias * 24 * 60 * 60 * 1000));

    // Atualizar tenant
    const updateResult = await masterDb.run(
      'UPDATE tenants SET trial_expire_at = $1, updated_at = NOW() WHERE id = $2',
      [novaDataExpiracao.toISOString(), tenantId]
    );

    if (updateResult.changes === 0) {
      return res.status(400).json({
        success: false,
        error: 'Falha ao atualizar período de teste'
      });
    }

    console.log(`✅ Período de teste resetado para tenant ${tenantId}: ${novaDataExpiracao.toISOString()}`);

    res.json({
      success: true,
      message: `Período de teste extendido por ${dias} dias`,
      tenant: {
        id: tenantId,
        trial_expire_at: novaDataExpiracao.toISOString(),
        dias_adicionados: dias
      }
    });

  } catch (error) {
    console.error('❌ Erro ao resetar período de teste:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao resetar período de teste'
    });
  }
});

/**
 * ADMIN: Alterar plano do tenant
 * PUT /api/tenants/admin/:tenantId/change-plan
 */
router.put('/:tenantId/change-plan', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { plano } = req.body;

    if (!plano) {
      return res.status(400).json({
        success: false,
        error: 'Plano é obrigatório'
      });
    }

    const masterDb = mgr.getMasterDb();

    // Verificar se tenant existe
    const tenant = await masterDb.get('SELECT * FROM tenants WHERE id = $1', [tenantId]);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant não encontrado'
      });
    }

    // Atualizar tenant
    const updateResult = await masterDb.run(
      'UPDATE tenants SET plano = $1, updated_at = NOW() WHERE id = $2',
      [plano, tenantId]
    );

    if (updateResult.changes === 0) {
      return res.status(400).json({
        success: false,
        error: 'Falha ao alterar plano'
      });
    }

    console.log(`✅ Plano alterado para tenant ${tenantId}: ${plano}`);

    res.json({
      success: true,
      message: `Plano alterado para ${plano}`,
      tenant: {
        id: tenantId,
        plano: plano
      }
    });

  } catch (error) {
    console.error('❌ Erro ao alterar plano:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao alterar plano'
    });
  }
});

/**
 * ADMIN: Alterar status do tenant
 * PUT /api/tenants/admin/:tenantId/change-status
 */
router.put('/:tenantId/change-status', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { status } = req.body;

    const statusValidos = ['trial', 'active', 'suspended', 'cancelled'];
    if (!status || !statusValidos.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status inválido',
        validos: statusValidos
      });
    }

    const masterDb = mgr.getMasterDb();

    // Verificar se tenant existe
    const tenant = await masterDb.get('SELECT * FROM tenants WHERE id = $1', [tenantId]);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant não encontrado'
      });
    }

    // Atualizar status
    const updateResult = await masterDb.run(
      'UPDATE tenants SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, tenantId]
    );

    if (updateResult.changes === 0) {
      return res.status(400).json({
        success: false,
        error: 'Falha ao alterar status'
      });
    }

    console.log(`✅ Status alterado para tenant ${tenantId}: ${status}`);

    res.json({
      success: true,
      message: `Status alterado para ${status}`,
      tenant: {
        id: tenantId,
        status: status
      }
    });

  } catch (error) {
    console.error('❌ Erro ao alterar status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao alterar status'
    });
  }
});

/**
 * ADMIN: Excluir tenant (SOFT DELETE)
 * DELETE /api/tenants/admin/:tenantId
 */
router.delete('/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const masterDb = mgr.getMasterDb();

    // Verificar se tenant existe
    const tenant = await masterDb.get('SELECT * FROM tenants WHERE id = $1', [tenantId]);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant não encontrado'
      });
    }

    // Marcar como excluído (soft delete)
    const updateResult = await masterDb.run(
      "UPDATE tenants SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
      [tenantId]
    );

    if (updateResult.changes === 0) {
      return res.status(400).json({
        success: false,
        error: 'Falha ao excluir tenant'
      });
    }

    console.log(`✅ Tenant ${tenantId} marcado como excluído`);

    res.json({
      success: true,
      message: 'Tenant excluído com sucesso',
      tenant: {
        id: tenantId,
        status: 'cancelled'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao excluir tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao excluir tenant'
    });
  }
});

/**
 * ADMIN: Resumo financeiro de todos os tenants
 * GET /api/tenants/admin/financeiro/resumo
 */
router.get('/financeiro/resumo', async (req, res) => {
  try {
    // Simulação de dados financeiros agregados
    const resumoFinanceiro = {
      saldoAtual: 45750.80,
      receitaMensal: 28500.00,
      despesaMensal: 15200.00,
      lucroMensal: 13300.00,
      contasReceber: 12450.00,
      contasPagar: 8750.00,
      metaMensal: 35000.00,
      percentualMeta: 81.4
    };

    res.json({
      success: true,
      data: resumoFinanceiro
    });

  } catch (error) {
    console.error('❌ Erro ao buscar resumo financeiro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao buscar resumo financeiro'
    });
  }
});

/**
 * ADMIN: Gerar fatura para tenant
 * POST /api/tenants/admin/billing/invoice/:tenantId
 */
router.post('/billing/invoice/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const masterDb = mgr.getMasterDb();

    // Verificar se tenant existe
    const tenant = await masterDb.get('SELECT * FROM tenants WHERE id = $1', [tenantId]);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant não encontrado'
      });
    }

    // Simulação de geração de fatura
    const fatura = {
      id: `FAT-${Date.now()}`,
      tenantId: tenantId,
      tenantNome: tenant.nome,
      valor: tenant.plano === 'starter' ? 199 : tenant.plano === 'professional' ? 399 : 799,
      plano: tenant.plano,
      dataEmissao: new Date().toISOString(),
      dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pendente'
    };

    console.log(`✅ Fatura gerada para tenant ${tenantId}: ${fatura.id}`);

    res.json({
      success: true,
      message: 'Fatura gerada com sucesso',
      fatura: fatura
    });

  } catch (error) {
    console.error('❌ Erro ao gerar fatura:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao gerar fatura'
    });
  }
});

/**
 * ADMIN: Relatórios de CRM agregados
 * GET /api/tenants/admin/crm/relatorios?tipo=:tipo
 */
router.get('/crm/relatorios', async (req, res) => {
  try {
    const { tipo = 'geral' } = req.query;

    let dados = {};

    switch (tipo) {
      case 'inativos':
        // Simulação de dados de clientes inativos
        dados = {
          totalClientes: 1250,
          clientesAtivos: 890,
          clientesInativos: 360,
          inativos: [
            {
              nome: 'João Silva',
              email: 'joao@email.com',
              telefone: '(11) 99999-1234',
              ultimoAgendamento: '2024-08-15',
              diasInativo: 45
            },
            {
              nome: 'Maria Santos',
              email: 'maria@email.com',
              telefone: '(11) 98888-5678',
              ultimoAgendamento: '2024-07-20',
              diasInativo: 90
            }
          ]
        };
        break;

      case 'ativos':
        dados = {
          totalClientes: 1250,
          clientesAtivos: 890,
          clientesInativos: 360,
          ativos: [
            {
              nome: 'Ana Costa',
              email: 'ana@email.com',
              telefone: '(11) 97777-9012',
              ultimoAgendamento: '2024-09-10',
              totalAgendamentos: 15
            }
          ]
        };
        break;

      case 'novos':
        dados = {
          totalClientes: 1250,
          clientesAtivos: 890,
          clientesInativos: 360,
          novos: [
            {
              nome: 'Pedro Oliveira',
              email: 'pedro@email.com',
              telefone: '(11) 96666-3456',
              dataCadastro: '2024-09-05',
              primeiroAgendamento: null
            }
          ]
        };
        break;

      default:
        dados = {
          totalClientes: 1250,
          clientesAtivos: 890,
          clientesInativos: 360,
          campanhasEnviadas: 45,
          taxaConversao: 23.5,
          metricas: {
            taxaAbertura: 68.5,
            taxaClique: 24.3,
            respostaWhatsApp: 45.2
          },
          segmentacao: {
            vip: 45,
            regulares: 320,
            ocasionais: 525
          }
        };
        break;
    }

    res.json({
      success: true,
      data: dados
    });

  } catch (error) {
    console.error('❌ Erro ao buscar relatórios CRM:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao buscar relatórios CRM'
    });
  }
});

/**
 * ADMIN: Criar campanha de CRM
 * POST /api/tenants/admin/crm/campaign
 */
router.post('/crm/campaign', async (req, res) => {
  try {
    const { tenantId, tipo, mensagem } = req.body;

    if (!tenantId || !tipo) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID e tipo são obrigatórios'
      });
    }

    // Simulação de criação de campanha
    const campanha = {
      id: `CAMP-${Date.now()}`,
      tenantId: tenantId,
      tipo: tipo,
      mensagem: mensagem || 'Campanha de reativação automática',
      status: 'enviada',
      dataEnvio: new Date().toISOString(),
      destinatarios: 25 // simulação
    };

    console.log(`✅ Campanha criada: ${campanha.id} para tenant ${tenantId}`);

    res.json({
      success: true,
      message: 'Campanha criada e enviada com sucesso',
      campanha: campanha
    });

  } catch (error) {
    console.error('❌ Erro ao criar campanha:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao criar campanha'
    });
  }
});

/**
 * ADMIN: Listar automações
 * GET /api/tenants/admin/automacao/list
 */
router.get('/automacao/list', async (req, res) => {
  try {
    // Simulação de automações
    const automacoes = [
      {
        id: 1,
        nome: 'Boas-vindas para Novos Clientes',
        tipo: 'cadastro',
        status: 'ativo',
        tenantId: 'all',
        configuracao: {
          disparador: 'novo_cadastro',
          acoes: ['email', 'whatsapp'],
          mensagem: 'Bem-vindo à nossa clínica!'
        },
        disparosHoje: 5
      },
      {
        id: 2,
        nome: 'Lembrete de Consulta',
        tipo: 'agendamento',
        status: 'ativo',
        tenantId: 'all',
        configuracao: {
          disparador: '24h_antes_consulta',
          acoes: ['whatsapp'],
          mensagem: 'Lembrete: Você tem consulta amanhã às 14h'
        },
        disparosHoje: 12
      },
      {
        id: 3,
        nome: 'Reativação de Clientes Inativos',
        tipo: 'crm',
        status: 'inativo',
        tenantId: 'all',
        configuracao: {
          disparador: '90_dias_inativo',
          acoes: ['email', 'whatsapp'],
          mensagem: 'Sentimos sua falta! Que tal agendar uma consulta?'
        },
        disparosHoje: 0
      }
    ];

    res.json({
      success: true,
      automacoes: automacoes
    });

  } catch (error) {
    console.error('❌ Erro ao listar automações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao listar automações'
    });
  }
});

/**
 * ADMIN: Criar automação
 * POST /api/tenants/admin/automacao/create
 */
router.post('/automacao/create', async (req, res) => {
  try {
    const { tenantId, nome, tipo, status, configuracao } = req.body;

    if (!nome || !tipo) {
      return res.status(400).json({
        success: false,
        error: 'Nome e tipo são obrigatórios'
      });
    }

    // Simulação de criação de automação
    const automacao = {
      id: Date.now(),
      tenantId: tenantId || 'all',
      nome: nome,
      tipo: tipo,
      status: status || 'ativo',
      configuracao: configuracao || {},
      createdAt: new Date().toISOString()
    };

    console.log(`✅ Automação criada: ${automacao.id} - ${automacao.nome}`);

    res.json({
      success: true,
      message: 'Automação criada com sucesso',
      automacao: automacao
    });

  } catch (error) {
    console.error('❌ Erro ao criar automação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao criar automação'
    });
  }
});

/**
 * ADMIN: Alterar status da automação
 * PUT /api/tenants/admin/automacao/:automacaoId/toggle
 */
router.put('/automacao/:automacaoId/toggle', async (req, res) => {
  try {
    const { automacaoId } = req.params;
    const { status } = req.body;

    // Simulação de alteração de status
    console.log(`✅ Status da automação ${automacaoId} alterado para: ${status}`);

    res.json({
      success: true,
      message: `Automação ${status === 'ativo' ? 'ativada' : 'desativada'} com sucesso`,
      automacao: {
        id: automacaoId,
        status: status
      }
    });

  } catch (error) {
    console.error('❌ Erro ao alterar status da automação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao alterar status da automação'
    });
  }
});

/**
 * ADMIN: Disparar automação manualmente
 * POST /api/tenants/admin/automacao/disparar
 */
router.post('/automacao/disparar', async (req, res) => {
  try {
    const { automacaoId, tenantId } = req.body;

    if (!automacaoId) {
      return res.status(400).json({
        success: false,
        error: 'ID da automação é obrigatório'
      });
    }

    // Simulação de disparo de automação
    console.log(`✅ Automação ${automacaoId} disparada para tenant ${tenantId || 'todos'}`);

    res.json({
      success: true,
      message: 'Automação disparada com sucesso',
      resultado: {
        automacaoId: automacaoId,
        tenantId: tenantId || 'all',
        destinatarios: 25,
        dataDisparo: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro ao disparar automação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao disparar automação'
    });
  }
});

/**
 * ADMIN: Criar tenant manualmente
 * POST /api/tenants/admin/create
 */
router.post('/create', async (req, res) => {
  try {
    const {
      nome,
      email,
      telefone,
      clinica,
      plano = 'trial',
      especialidade,
      sendTempPassword = true,
      customPassword = null
    } = req.body;

    // Validações básicas
    if (!nome || !email || !clinica) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email e nome da clínica são obrigatórios'
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
        message: 'Este email já possui uma conta.'
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

    // Data de expiração do trial (30 dias se for trial)
    let trialExpireAt = null;
    if (plano === 'trial') {
      trialExpireAt = new Date();
      trialExpireAt.setDate(trialExpireAt.getDate() + 30);
    }

    // Configurações padrão do tenant
    const defaultConfig = {
      whatsapp_enabled: true,
      email_enabled: true,
      sms_enabled: false,
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
      language: 'pt-BR',
      especialidade: especialidade || null
    };

    const defaultTheme = {
      primary_color: '#1976d2',
      secondary_color: '#dc004e',
      logo_url: null,
      custom_css: null
    };

    const defaultBilling = {
      plan: plano,
      status: plano === 'trial' ? 'trial' : 'active',
      trial_started_at: plano === 'trial' ? new Date().toISOString() : null,
      trial_expire_at: trialExpireAt ? trialExpireAt.toISOString() : null
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
        plano,
        plano === 'trial' ? 'trial' : 'active',
        trialExpireAt ? trialExpireAt.toISOString() : null,
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

    // Gerar senha
    let tempPassword;
    if (customPassword) {
      tempPassword = customPassword;
    } else {
      tempPassword = Math.random().toString(36).slice(-10); // Senha mais forte
    }

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

    // Enviar email com senha se solicitado
    let emailSent = false;
    if (sendTempPassword) {
      try {
        const { sendTempPassword: sendEmail } = require('../services/emailService');
        const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?tenant=${slug}`;

        await sendEmail({
          to: email,
          nome: nome,
          clinica: clinica,
          tempPassword: tempPassword,
          loginUrl: loginUrl,
          tenantSlug: slug,
          createdByAdmin: true
        });

        emailSent = true;
        console.log(`✅ Email enviado para ${email} - Tenant: ${clinica}`);
      } catch (emailError) {
        console.error('❌ Erro ao enviar email:', emailError);
        // Não falhar a criação por causa do email
      }
    }

    // Log de auditoria
    console.log(`🎯 Tenant criado pelo admin: ${clinica} (${email}) - Slug: ${slug} - Plano: ${plano}`);

    res.status(201).json({
      success: true,
      message: `Tenant criado com sucesso!${emailSent ? ' Email enviado.' : ' Email não enviado.'}`,
      tenant: {
        id: tenantId,
        slug: slug,
        nome: clinica,
        email: email,
        plano: plano,
        status: plano === 'trial' ? 'trial' : 'active',
        trial_expire_at: trialExpireAt ? trialExpireAt.toISOString() : null
      },
      credentials: sendTempPassword ? {
        email: email,
        temp_password: tempPassword,
        login_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?tenant=${slug}`
      } : null,
      email_sent: emailSent
    });

  } catch (error) {
    console.error('Erro ao criar tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * ADMIN: Reenviar senha temporária
 * POST /api/tenants/admin/:tenantId/send-temp-password
 */
router.post('/:tenantId/send-temp-password', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { customPassword = null } = req.body;

    const masterDb = mgr.getMasterDb();

    // Buscar tenant
    const tenant = await masterDb.get(
      'SELECT * FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant não encontrado'
      });
    }

    // Buscar usuário owner
    const tenantDb = mgr.getTenantDb(tenantId, tenant.slug);
    const owner = await tenantDb.get(
      `SELECT nome, email FROM usuarios
       WHERE tenant_id = $1 AND role = 'owner' AND status = 'active'
       LIMIT 1`,
      [tenantId]
    );

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Usuário owner não encontrado'
      });
    }

    // Gerar nova senha
    const newPassword = customPassword || Math.random().toString(36).slice(-10);
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Atualizar senha no banco
    await tenantDb.run(
      'UPDATE usuarios SET senha_hash = $1, updated_at = $2 WHERE tenant_id = $3 AND role = $4',
      [hashedPassword, new Date().toISOString(), tenantId, 'owner']
    );

    // Enviar email
    try {
      const { sendTempPassword: sendEmail } = require('../services/emailService');
      const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?tenant=${tenant.slug}`;

      await sendEmail({
        to: owner.email,
        nome: owner.nome,
        clinica: tenant.nome,
        tempPassword: newPassword,
        loginUrl: loginUrl,
        tenantSlug: tenant.slug,
        createdByAdmin: true
      });

      console.log(`✅ Senha reenviada para ${owner.email} - Tenant: ${tenant.nome}`);

      res.json({
        success: true,
        message: 'Senha temporária reenviada com sucesso',
        credentials: {
          email: owner.email,
          temp_password: newPassword,
          login_url: loginUrl
        }
      });

    } catch (emailError) {
      console.error('❌ Erro ao reenviar email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Tenant atualizado, mas erro ao enviar email',
        credentials: {
          email: owner.email,
          temp_password: newPassword,
          login_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?tenant=${tenant.slug}`
        }
      });
    }

  } catch (error) {
    console.error('Erro ao reenviar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
