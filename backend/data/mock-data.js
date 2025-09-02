// Dados mock para teste do sistema de atendimentos

const { v4: uuidv4 } = require('uuid');

// Função para gerar dados de exemplo
function gerarDadosExemplo() {
  const pacienteId = 'paciente-123';
  const agora = new Date();
  const ontemTime = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
  const semanaPassadaTime = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);

  const logsExemplo = [
    {
      id: uuidv4(),
      pacienteId,
      atendimentoId: 'atend-001',
      acao: 'iniciar',
      statusAnterior: 'pendente',
      statusNovo: 'em_atendimento',
      motivo: 'Consulta de rotina',
      observacoes: 'Paciente chegou no horário marcado',
      usuario: 'Dr. João Silva',
      timestamp: semanaPassadaTime.toISOString(),
      metadata: {
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        manual: false
      }
    },
    {
      id: uuidv4(),
      pacienteId,
      atendimentoId: 'atend-001',
      acao: 'espera',
      statusAnterior: 'em_atendimento',
      statusNovo: 'em_espera',
      motivo: 'Aguardando resultado de exame',
      observacoes: 'Solicitado hemograma completo',
      usuario: 'Dr. João Silva',
      timestamp: new Date(semanaPassadaTime.getTime() + 30 * 60 * 1000).toISOString(),
      metadata: {
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        manual: false
      }
    },
    {
      id: uuidv4(),
      pacienteId,
      atendimentoId: 'atend-001',
      acao: 'retomar',
      statusAnterior: 'em_espera',
      statusNovo: 'em_atendimento',
      motivo: 'Resultado do exame disponível',
      observacoes: 'Hemograma dentro da normalidade',
      usuario: 'Dr. João Silva',
      timestamp: new Date(semanaPassadaTime.getTime() + 45 * 60 * 1000).toISOString(),
      metadata: {
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        manual: false
      }
    },
    {
      id: uuidv4(),
      pacienteId,
      atendimentoId: 'atend-001',
      acao: 'concluir',
      statusAnterior: 'em_atendimento',
      statusNovo: 'concluido',
      motivo: 'Consulta finalizada',
      observacoes: 'Prescrição medicamentosa entregue. Retorno em 30 dias.',
      usuario: 'Dr. João Silva',
      timestamp: new Date(semanaPassadaTime.getTime() + 60 * 60 * 1000).toISOString(),
      metadata: {
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        manual: false
      }
    },
    {
      id: uuidv4(),
      pacienteId,
      atendimentoId: 'atend-002',
      acao: 'iniciar',
      statusAnterior: 'pendente',
      statusNovo: 'em_atendimento',
      motivo: 'Consulta de retorno',
      observacoes: 'Paciente retorna conforme agendado',
      usuario: 'Dr. João Silva',
      timestamp: ontemTime.toISOString(),
      metadata: {
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        manual: false
      }
    },
    {
      id: uuidv4(),
      pacienteId,
      atendimentoId: 'atend-002',
      acao: 'cancelar',
      statusAnterior: 'em_atendimento',
      statusNovo: 'cancelado',
      motivo: 'Emergência médica',
      observacoes: 'Médico chamado para emergência. Reagendamento necessário.',
      usuario: 'Dr. João Silva',
      timestamp: new Date(ontemTime.getTime() + 15 * 60 * 1000).toISOString(),
      metadata: {
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        manual: false
      }
    },
    {
      id: uuidv4(),
      pacienteId,
      atendimentoId: 'atend-003',
      acao: 'iniciar',
      statusAnterior: 'pendente',
      statusNovo: 'em_atendimento',
      motivo: 'Consulta reagendada',
      observacoes: 'Reagendamento da consulta cancelada ontem',
      usuario: 'Dr. João Silva',
      timestamp: agora.toISOString(),
      metadata: {
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        manual: false
      }
    }
  ];

  const atendimentoAtual = {
    id: 'atend-003',
    pacienteId,
    status: 'em_atendimento',
    statusAnterior: 'pendente',
    iniciadoEm: agora.toISOString(),
    ultimaAtualizacao: agora.toISOString(),
    criadoEm: agora.toISOString()
  };

  return {
    logs: logsExemplo,
    atendimento: atendimentoAtual
  };
}

// Função para calcular métricas de exemplo
function calcularMetricasExemplo(logs) {
  const atendimentosIniciados = logs.filter(l => l.acao === 'iniciar').length;
  const atendimentosConcluidos = logs.filter(l => l.acao === 'concluir').length;
  const atendimentosCancelados = logs.filter(l => l.acao === 'cancelar').length;
  const temposEspera = logs.filter(l => l.acao === 'espera').length;

  const taxaConclusao = atendimentosIniciados > 0 
    ? Math.round((atendimentosConcluidos / atendimentosIniciados) * 100)
    : 0;

  const taxaCancelamento = atendimentosIniciados > 0 
    ? Math.round((atendimentosCancelados / atendimentosIniciados) * 100)
    : 0;

  return {
    atendimentosIniciados,
    atendimentosConcluidos,
    atendimentosCancelados,
    temposEspera,
    taxaConclusao,
    taxaCancelamento,
    tempoMedio: 45, // 45 minutos em média
    totalLogs: logs.length
  };
}

// Dados de exemplo de diferentes pacientes
const dadosMultiplosPacientes = {
  'paciente-123': gerarDadosExemplo(),
  'paciente-456': {
    logs: [],
    atendimento: {
      id: uuidv4(),
      pacienteId: 'paciente-456',
      status: 'pendente',
      statusAnterior: null,
      iniciadoEm: null,
      ultimaAtualizacao: new Date().toISOString(),
      criadoEm: new Date().toISOString()
    }
  }
};

module.exports = {
  gerarDadosExemplo,
  calcularMetricasExemplo,
  dadosMultiplosPacientes
};
