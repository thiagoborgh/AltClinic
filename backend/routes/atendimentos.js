const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Simulação de dados em memória
let atendimentos = new Map();
let logs = new Map();

// Middleware para validação de dados
const validarAtendimento = (req, res, next) => {
  const { pacienteId } = req.body;
  
  if (!pacienteId) {
    return res.status(400).json({
      success: false,
      message: 'pacienteId é obrigatório'
    });
  }
  
  next();
};

const validarLog = (req, res, next) => {
  const { pacienteId, acao, usuario } = req.body;
  
  if (!pacienteId || !acao || !usuario) {
    return res.status(400).json({
      success: false,
      message: 'pacienteId, acao e usuario são obrigatórios'
    });
  }
  
  const acoesValidas = ['iniciar', 'espera', 'cancelar', 'concluir', 'retomar'];
  if (!acoesValidas.includes(acao)) {
    return res.status(400).json({
      success: false,
      message: 'Ação inválida. Ações válidas: ' + acoesValidas.join(', ')
    });
  }
  
  next();
};

// GET /api/atendimentos/:pacienteId - Buscar atendimento atual do paciente
router.get('/:pacienteId', (req, res) => {
  try {
    const { pacienteId } = req.params;
    const atendimento = atendimentos.get(pacienteId);
    
    if (!atendimento) {
      return res.json({
        success: true,
        data: {
          pacienteId,
          status: 'pendente',
          iniciadoEm: null,
          ultimaAtualizacao: new Date().toISOString(),
          tempoDecorrido: 0
        }
      });
    }
    
    // Calcular tempo decorrido se estiver em atendimento
    let tempoDecorrido = 0;
    if (atendimento.status === 'em_atendimento' && atendimento.iniciadoEm) {
      tempoDecorrido = Math.floor((new Date() - new Date(atendimento.iniciadoEm)) / 1000);
    }
    
    res.json({
      success: true,
      data: {
        ...atendimento,
        tempoDecorrido
      }
    });
  } catch (error) {
    console.error('Erro ao buscar atendimento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/atendimentos - Criar/atualizar atendimento
router.post('/', validarAtendimento, (req, res) => {
  try {
    const { pacienteId, status = 'pendente' } = req.body;
    const agora = new Date().toISOString();
    
    const atendimentoExistente = atendimentos.get(pacienteId);
    const novoAtendimento = {
      id: atendimentoExistente?.id || uuidv4(),
      pacienteId,
      status,
      iniciadoEm: status === 'em_atendimento' ? agora : atendimentoExistente?.iniciadoEm,
      ultimaAtualizacao: agora,
      criadoEm: atendimentoExistente?.criadoEm || agora
    };
    
    atendimentos.set(pacienteId, novoAtendimento);
    
    res.json({
      success: true,
      data: novoAtendimento,
      message: 'Atendimento criado/atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar/atualizar atendimento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/atendimentos/:pacienteId/status - Atualizar status do atendimento
router.put('/:pacienteId/status', (req, res) => {
  try {
    const { pacienteId } = req.params;
    const { status, motivo, observacoes, usuario } = req.body;
    
    if (!status || !usuario) {
      return res.status(400).json({
        success: false,
        message: 'status e usuario são obrigatórios'
      });
    }
    
    const statusValidos = ['pendente', 'em_atendimento', 'em_espera', 'cancelado', 'concluido'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido. Status válidos: ' + statusValidos.join(', ')
      });
    }
    
    const atendimentoAtual = atendimentos.get(pacienteId);
    const agora = new Date().toISOString();
    
    const atendimentoAtualizado = {
      id: atendimentoAtual?.id || uuidv4(),
      pacienteId,
      status,
      statusAnterior: atendimentoAtual?.status || 'pendente',
      iniciadoEm: status === 'em_atendimento' && !atendimentoAtual?.iniciadoEm ? agora : atendimentoAtual?.iniciadoEm,
      concluidoEm: status === 'concluido' ? agora : null,
      canceladoEm: status === 'cancelado' ? agora : null,
      ultimaAtualizacao: agora,
      criadoEm: atendimentoAtual?.criadoEm || agora
    };
    
    atendimentos.set(pacienteId, atendimentoAtualizado);
    
    // Registrar log da ação
    const logId = uuidv4();
    const novoLog = {
      id: logId,
      pacienteId,
      atendimentoId: atendimentoAtualizado.id,
      acao: obterAcaoDoStatus(atendimentoAtualizado.statusAnterior, status),
      statusAnterior: atendimentoAtualizado.statusAnterior,
      statusNovo: status,
      motivo,
      observacoes,
      usuario,
      timestamp: agora,
      metadata: {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    };
    
    if (!logs.has(pacienteId)) {
      logs.set(pacienteId, []);
    }
    logs.get(pacienteId).push(novoLog);
    
    res.json({
      success: true,
      data: {
        atendimento: atendimentoAtualizado,
        log: novoLog
      },
      message: `Status atualizado para ${status} com sucesso`
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/atendimentos/:pacienteId/logs - Buscar logs do paciente
router.get('/:pacienteId/logs', (req, res) => {
  try {
    const { pacienteId } = req.params;
    const { limite = 50, pagina = 1, periodo, acao } = req.query;
    
    const logsPatiente = logs.get(pacienteId) || [];
    let logsFiltrados = [...logsPatiente];
    
    // Filtro por período
    if (periodo) {
      const diasAtras = parseInt(periodo);
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasAtras);
      
      logsFiltrados = logsFiltrados.filter(log => 
        new Date(log.timestamp) >= dataLimite
      );
    }
    
    // Filtro por ação
    if (acao && acao !== 'todas') {
      logsFiltrados = logsFiltrados.filter(log => log.acao === acao);
    }
    
    // Ordenar por data (mais recente primeiro)
    logsFiltrados.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Paginação
    const total = logsFiltrados.length;
    const limiteNum = parseInt(limite);
    const paginaNum = parseInt(pagina);
    const offset = (paginaNum - 1) * limiteNum;
    const logsPaginados = logsFiltrados.slice(offset, offset + limiteNum);
    
    res.json({
      success: true,
      data: {
        logs: logsPaginados,
        total,
        pagina: paginaNum,
        limite: limiteNum,
        totalPaginas: Math.ceil(total / limiteNum)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/atendimentos/:pacienteId/logs - Adicionar log manual
router.post('/:pacienteId/logs', validarLog, (req, res) => {
  try {
    const { pacienteId } = req.params;
    const { acao, motivo, observacoes, usuario, metadata = {} } = req.body;
    
    const atendimento = atendimentos.get(pacienteId);
    const logId = uuidv4();
    const agora = new Date().toISOString();
    
    const novoLog = {
      id: logId,
      pacienteId,
      atendimentoId: atendimento?.id,
      acao,
      statusAnterior: atendimento?.status,
      statusNovo: obterStatusDaAcao(acao),
      motivo,
      observacoes,
      usuario,
      timestamp: agora,
      metadata: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        manual: true,
        ...metadata
      }
    };
    
    if (!logs.has(pacienteId)) {
      logs.set(pacienteId, []);
    }
    logs.get(pacienteId).push(novoLog);
    
    res.json({
      success: true,
      data: novoLog,
      message: 'Log registrado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao registrar log:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/atendimentos/:pacienteId/metricas - Buscar métricas do paciente
router.get('/:pacienteId/metricas', (req, res) => {
  try {
    const { pacienteId } = req.params;
    const { periodo = '30' } = req.query;
    
    const logsPatiente = logs.get(pacienteId) || [];
    const diasAtras = parseInt(periodo);
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasAtras);
    
    const logsPeriodo = logsPatiente.filter(log => 
      new Date(log.timestamp) >= dataLimite
    );
    
    // Calcular métricas
    const atendimentosIniciados = logsPeriodo.filter(l => l.acao === 'iniciar').length;
    const atendimentosConcluidos = logsPeriodo.filter(l => l.acao === 'concluir').length;
    const atendimentosCancelados = logsPeriodo.filter(l => l.acao === 'cancelar').length;
    const temposEspera = logsPeriodo.filter(l => l.acao === 'espera').length;
    
    const taxaConclusao = atendimentosIniciados > 0 
      ? Math.round((atendimentosConcluidos / atendimentosIniciados) * 100)
      : 0;
    
    const taxaCancelamento = atendimentosIniciados > 0 
      ? Math.round((atendimentosCancelados / atendimentosIniciados) * 100)
      : 0;
    
    // Calcular tempos médios de atendimento
    const sessoes = [];
    for (let i = 0; i < logsPeriodo.length - 1; i++) {
      const logAtual = logsPeriodo[i];
      const proximoLog = logsPeriodo[i + 1];
      
      if (logAtual.acao === 'iniciar' && proximoLog.acao === 'concluir') {
        const duracao = (new Date(proximoLog.timestamp) - new Date(logAtual.timestamp)) / (1000 * 60);
        sessoes.push(Math.round(duracao));
      }
    }
    
    const tempoMedio = sessoes.length > 0 
      ? Math.round(sessoes.reduce((a, b) => a + b, 0) / sessoes.length)
      : 0;
    
    res.json({
      success: true,
      data: {
        periodo: parseInt(periodo),
        metricas: {
          atendimentosIniciados,
          atendimentosConcluidos,
          atendimentosCancelados,
          temposEspera,
          taxaConclusao,
          taxaCancelamento,
          tempoMedio,
          totalLogs: logsPeriodo.length
        },
        sessoes,
        geradoEm: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erro ao calcular métricas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/atendimentos/:pacienteId - Remover atendimento e logs
router.delete('/:pacienteId', (req, res) => {
  try {
    const { pacienteId } = req.params;
    
    const atendimentoRemovido = atendimentos.get(pacienteId);
    const logsRemovidos = logs.get(pacienteId) || [];
    
    atendimentos.delete(pacienteId);
    logs.delete(pacienteId);
    
    res.json({
      success: true,
      data: {
        atendimentoRemovido,
        logsRemovidos: logsRemovidos.length
      },
      message: 'Atendimento e logs removidos com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover atendimento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Funções auxiliares
function obterAcaoDoStatus(statusAnterior, statusNovo) {
  const transicoes = {
    'pendente->em_atendimento': 'iniciar',
    'em_atendimento->em_espera': 'espera',
    'em_espera->em_atendimento': 'retomar',
    'em_atendimento->concluido': 'concluir',
    'em_atendimento->cancelado': 'cancelar',
    'em_espera->cancelado': 'cancelar',
    'pendente->cancelado': 'cancelar'
  };
  
  const chave = `${statusAnterior}->${statusNovo}`;
  return transicoes[chave] || 'atualizar';
}

function obterStatusDaAcao(acao) {
  const statusMap = {
    'iniciar': 'em_atendimento',
    'espera': 'em_espera',
    'retomar': 'em_atendimento',
    'cancelar': 'cancelado',
    'concluir': 'concluido'
  };
  
  return statusMap[acao] || 'pendente';
}

module.exports = router;
