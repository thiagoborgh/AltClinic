const express = require('express');
const router = express.Router();
const PacienteModel = require('../models/Paciente');
const AgendamentoModel = require('../models/Agendamento');
const dbManager = require('../models/database');
const authUtil = require('../utils/auth');
const { mailchimpService } = require('../utils/mailchimp');
const cronManager = require('../cron/inactivityChecker');

/**
 * @route GET /crm/relatorios
 * @desc Relatório de inativos para ativação de vendas
 */
router.get('/relatorios', authUtil.authenticate, async (req, res) => {
  try {
    const { 
      tipo = 'inativos', 
      dias_inativo = 90,
      page = 1,
      limit = 50 
    } = req.query;

    let dados = {};

    switch (tipo) {
      case 'inativos':
        dados = await gerarRelatorioInativos(req.user.clinica_id, dias_inativo, page, limit);
        break;
      case 'ativos':
        dados = await gerarRelatorioAtivos(req.user.clinica_id, page, limit);
        break;
      case 'novos':
        dados = await gerarRelatorioNovos(req.user.clinica_id, page, limit);
        break;
      case 'geral':
        dados = await gerarRelatorioGeral(req.user.clinica_id);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Tipo de relatório inválido'
        });
    }

    res.json({
      success: true,
      data: dados
    });

  } catch (error) {
    console.error('Erro ao gerar relatório CRM:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /crm/campanhas/inativos
 * @desc Dispara campanha para pacientes inativos
 */
router.post('/campanhas/inativos', authUtil.authenticate, authUtil.authorize(['admin']), async (req, res) => {
  try {
    const { 
      dias_inativo = 90,
      mensagem_personalizada,
      incluir_email = true 
    } = req.body;

    const pacientesInativos = PacienteModel.findInativos(req.user.clinica_id, dias_inativo);

    if (pacientesInativos.length === 0) {
      return res.json({
        success: true,
        message: 'Nenhum paciente inativo encontrado',
        data: { enviados: 0, errors: 0 }
      });
    }

    let enviados = 0;
    let errors = 0;

    // Simular envio da campanha manual
    const db = dbManager.getDb();
    
    for (const paciente of pacientesInativos) {
      try {
        const mensagem = mensagem_personalizada || 
          `Olá ${paciente.nome}! 😊\n\nSentimos sua falta na clínica! ` +
          `Que tal agendar uma nova sessão? Temos promoções especiais esperando por você! ✨\n\n` +
          `Responda esta mensagem para agendar.`;

        // Registrar tentativa de envio
        db.prepare(`
          INSERT INTO mensagem_crm (paciente_id, tipo, conteudo, status)
          VALUES (?, 'campanha_inativo', ?, 'enviada')
        `).run(paciente.id, mensagem);

        enviados++;

        // Pequeno delay para evitar spam
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Erro ao enviar para paciente ${paciente.id}:`, error.message);
        errors++;
      }
    }

    // Sincronizar com Mailchimp se solicitado
    if (incluir_email) {
      try {
        const pacientesComEmail = pacientesInativos.filter(p => p.email);
        if (pacientesComEmail.length > 0) {
          await mailchimpService.sendInactiveCampaign(pacientesComEmail, mensagem_personalizada);
        }
      } catch (error) {
        console.error('Erro na integração com Mailchimp:', error.message);
      }
    }

    res.json({
      success: true,
      message: 'Campanha para inativos disparada',
      data: {
        total_pacientes: pacientesInativos.length,
        enviados,
        errors,
        mailchimp_sync: incluir_email
      }
    });

  } catch (error) {
    console.error('Erro ao disparar campanha:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /crm/mensagens
 * @desc Lista mensagens CRM enviadas
 */
router.get('/mensagens', authUtil.authenticate, async (req, res) => {
  try {
    const { 
      tipo,
      paciente_id,
      data_inicio,
      data_fim,
      page = 1,
      limit = 50 
    } = req.query;

    const db = dbManager.getDb();
    
    let query = `
      SELECT m.*, p.nome as paciente_nome, p.telefone as paciente_telefone
      FROM mensagem_crm m
      LEFT JOIN paciente p ON m.paciente_id = p.id
      WHERE p.clinica_id = ?
    `;
    
    const params = [req.user.clinica_id];
    
    if (tipo) {
      query += ' AND m.tipo = ?';
      params.push(tipo);
    }
    
    if (paciente_id) {
      query += ' AND m.paciente_id = ?';
      params.push(paciente_id);
    }
    
    if (data_inicio) {
      query += ' AND DATE(m.data_envio) >= ?';
      params.push(data_inicio);
    }
    
    if (data_fim) {
      query += ' AND DATE(m.data_envio) <= ?';
      params.push(data_fim);
    }
    
    query += ' ORDER BY m.data_envio DESC';
    
    // Paginação
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    
    const mensagens = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: mensagens,
      pagination: {
        current_page: parseInt(page),
        items_per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar mensagens CRM:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /crm/estatisticas
 * @desc Estatísticas gerais do CRM
 */
router.get('/estatisticas', authUtil.authenticate, async (req, res) => {
  try {
    const { periodo = 'mes' } = req.query;
    
    let dataInicio;
    switch (periodo) {
      case 'semana':
        dataInicio = "date('now', '-7 days')";
        break;
      case 'mes':
        dataInicio = "date('now', '-30 days')";
        break;
      case 'trimestre':
        dataInicio = "date('now', '-90 days')";
        break;
      default:
        dataInicio = "date('now', '-30 days')";
    }

    const db = dbManager.getDb();
    
    // Estatísticas de pacientes
    const estatisticasPacientes = PacienteModel.getStatusCounts(req.user.clinica_id);
    
    // Estatísticas de mensagens
    const mensagensEnviadas = db.prepare(`
      SELECT COUNT(*) as count
      FROM mensagem_crm m
      LEFT JOIN paciente p ON m.paciente_id = p.id
      WHERE p.clinica_id = ? AND DATE(m.data_envio) >= ${dataInicio}
    `).get(req.user.clinica_id).count;
    
    const mensagensPorTipo = db.prepare(`
      SELECT m.tipo, COUNT(*) as count
      FROM mensagem_crm m
      LEFT JOIN paciente p ON m.paciente_id = p.id
      WHERE p.clinica_id = ? AND DATE(m.data_envio) >= ${dataInicio}
      GROUP BY m.tipo
    `).all(req.user.clinica_id);
    
    // Estatísticas de agendamentos
    const estatisticasAgendamentos = AgendamentoModel.getEstatisticas(req.user.clinica_id, periodo);
    
    // Taxa de conversão (agendamentos após mensagem)
    const conversoes = db.prepare(`
      SELECT COUNT(DISTINCT a.paciente_id) as convertidos
      FROM agendamento a
      LEFT JOIN paciente p ON a.paciente_id = p.id
      WHERE p.clinica_id = ?
        AND DATE(a.created_at) >= ${dataInicio}
        AND a.paciente_id IN (
          SELECT DISTINCT paciente_id FROM mensagem_crm 
          WHERE DATE(data_envio) >= ${dataInicio}
        )
    `).get(req.user.clinica_id).convertidos;
    
    const taxaConversao = mensagensEnviadas > 0 ? 
      ((conversoes / mensagensEnviadas) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        periodo,
        pacientes: estatisticasPacientes,
        mensagens: {
          total_enviadas: mensagensEnviadas,
          por_tipo: mensagensPorTipo,
          conversoes: conversoes,
          taxa_conversao: `${taxaConversao}%`
        },
        agendamentos: estatisticasAgendamentos,
        mailchimp: mailchimpService.getStatus()
      }
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas CRM:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /crm/sync/mailchimp
 * @desc Sincroniza pacientes com Mailchimp
 */
router.post('/sync/mailchimp', authUtil.authenticate, authUtil.authorize(['admin']), async (req, res) => {
  try {
    const pacientes = PacienteModel.findByClinica(req.user.clinica_id);
    const pacientesComEmail = pacientes.filter(p => p.email);

    if (pacientesComEmail.length === 0) {
      return res.json({
        success: true,
        message: 'Nenhum paciente com email para sincronizar',
        data: { sincronizados: 0, errors: 0 }
      });
    }

    const resultado = await mailchimpService.syncPatients(pacientesComEmail);

    res.json({
      success: true,
      message: 'Sincronização com Mailchimp concluída',
      data: resultado
    });

  } catch (error) {
    console.error('Erro na sincronização com Mailchimp:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro na sincronização com Mailchimp'
    });
  }
});

/**
 * @route POST /crm/cron/manual
 * @desc Executa job de CRM manualmente para teste
 */
router.post('/cron/manual', authUtil.authenticate, authUtil.authorize(['admin']), async (req, res) => {
  try {
    const { job_name = 'inactivity' } = req.body;

    await cronManager.runManual(job_name);

    res.json({
      success: true,
      message: `Job ${job_name} executado manualmente com sucesso`
    });

  } catch (error) {
    console.error('Erro ao executar job manual:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao executar job manual'
    });
  }
});

// Funções auxiliares para relatórios

async function gerarRelatorioInativos(clinicaId, diasInativo, page, limit) {
  const pacientes = PacienteModel.findInativos(clinicaId, diasInativo);
  
  // Paginação
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const pacientesPaginados = pacientes.slice(startIndex, endIndex);

  return {
    tipo: 'inativos',
    total: pacientes.length,
    pacientes: pacientesPaginados,
    pagination: {
      current_page: parseInt(page),
      total_items: pacientes.length,
      items_per_page: parseInt(limit),
      total_pages: Math.ceil(pacientes.length / limit)
    }
  };
}

async function gerarRelatorioAtivos(clinicaId, page, limit) {
  const db = dbManager.getDb();
  
  const pacientes = db.prepare(`
    SELECT p.*, 
           (SELECT COUNT(*) FROM agendamento WHERE paciente_id = p.id AND status = 'realizado') as total_atendimentos,
           (SELECT MAX(data_hora) FROM agendamento WHERE paciente_id = p.id AND status = 'realizado') as ultimo_agendamento
    FROM paciente p
    WHERE p.clinica_id = ?
      AND p.ultimo_atendimento > datetime('now', '-90 days')
    ORDER BY p.ultimo_atendimento DESC
    LIMIT ? OFFSET ?
  `).all(clinicaId, parseInt(limit), (page - 1) * limit);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM paciente 
    WHERE clinica_id = ? AND ultimo_atendimento > datetime('now', '-90 days')
  `).get(clinicaId).count;

  return {
    tipo: 'ativos',
    total,
    pacientes,
    pagination: {
      current_page: parseInt(page),
      total_items: total,
      items_per_page: parseInt(limit),
      total_pages: Math.ceil(total / limit)
    }
  };
}

async function gerarRelatorioNovos(clinicaId, page, limit) {
  const db = dbManager.getDb();
  
  const pacientes = db.prepare(`
    SELECT p.*, 
           (SELECT COUNT(*) FROM agendamento WHERE paciente_id = p.id) as total_agendamentos
    FROM paciente p
    WHERE p.clinica_id = ?
      AND p.created_at > datetime('now', '-30 days')
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(clinicaId, parseInt(limit), (page - 1) * limit);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM paciente 
    WHERE clinica_id = ? AND created_at > datetime('now', '-30 days')
  `).get(clinicaId).count;

  return {
    tipo: 'novos',
    total,
    pacientes,
    pagination: {
      current_page: parseInt(page),
      total_items: total,
      items_per_page: parseInt(limit),
      total_pages: Math.ceil(total / limit)
    }
  };
}

async function gerarRelatorioGeral(clinicaId) {
  const statusCounts = PacienteModel.getStatusCounts(clinicaId);
  const estatisticasAgendamentos = AgendamentoModel.getEstatisticas(clinicaId, 'mes');
  
  const db = dbManager.getDb();
  
  // Top procedimentos
  const topProcedimentos = db.prepare(`
    SELECT proc.nome, COUNT(*) as total_agendamentos
    FROM agendamento a
    LEFT JOIN procedimento proc ON a.procedimento_id = proc.id
    LEFT JOIN paciente p ON a.paciente_id = p.id
    WHERE p.clinica_id = ?
      AND a.created_at > datetime('now', '-30 days')
    GROUP BY proc.id, proc.nome
    ORDER BY total_agendamentos DESC
    LIMIT 5
  `).all(clinicaId);

  return {
    tipo: 'geral',
    pacientes: statusCounts,
    agendamentos: estatisticasAgendamentos,
    top_procedimentos: topProcedimentos,
    data_relatorio: new Date().toISOString()
  };
}

module.exports = router;
