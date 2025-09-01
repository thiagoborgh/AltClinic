const express = require('express');
const router = express.Router();

// Dados mock de prontuários para desenvolvimento
const mockProntuarios = {
  1: {
    id: 1,
    pacienteId: 1,
    numeroProtocolo: 'ALT-2024-12345',
    anamnese: {
      historicoMedico: {
        alergias: {
          medicamentosas: ['Penicilina'],
          alimentares: ['Frutos do mar'],
          ambientais: ['Pólen'],
          outras: []
        },
        medicamentosAtuais: [
          { nome: 'Omeprazol', dosagem: '20mg', frequencia: '1x ao dia' }
        ],
        condicoesMedicas: {
          cardiovasculares: [],
          endocrinas: [],
          neurologicas: [],
          dermatologicas: ['Acne'],
          respiratorias: [],
          gastrointestinais: ['Gastrite'],
          geniturinarias: [],
          outras: []
        },
        cirurgiasAnteriores: [
          { tipo: 'Apendicectomia', data: '2020-03-15', observacoes: 'Sem complicações' }
        ],
        habitosVida: {
          tabagismo: { status: 'Não fumante' },
          etilismo: { status: 'Social (fins de semana)' },
          atividade_fisica: { pratica: true, tipo: 'Academia 3x/semana' },
          alimentacao: { tipo: 'Balanceada', restricoes: [] },
          sono: { horasDiarias: 7, qualidade: 'Boa' }
        }
      },
      especialidade: {
        motivoConsulta: 'Tratamento facial para acne',
        expectativas: 'Redução das lesões e cicatrizes',
        historicoEstetico: 'Primeira vez em clínica estética'
      },
      assinatura: { 
        pacienteAssinou: true,
        dataAssinatura: '2024-01-15T10:30:00Z'
      }
    },
    timeline: [
      {
        id: 1,
        data: '2024-01-15T10:30:00Z',
        tipo: 'consulta',
        titulo: 'Consulta Inicial',
        descricao: 'Avaliação dermatológica e definição do plano de tratamento',
        profissional: 'Dra. Maria Silva',
        status: 'concluido'
      },
      {
        id: 2,
        data: '2024-02-15T14:00:00Z',
        tipo: 'procedimento',
        titulo: 'Limpeza de Pele Profunda',
        descricao: 'Limpeza de pele com extração de comedões',
        profissional: 'Dra. Maria Silva',
        status: 'concluido'
      },
      {
        id: 3,
        data: '2024-03-15T15:30:00Z',
        tipo: 'retorno',
        titulo: 'Retorno - Avaliação',
        descricao: 'Avaliação da evolução do tratamento',
        profissional: 'Dra. Maria Silva',
        status: 'agendado'
      }
    ],
    planoTratamento: {
      objetivo: 'Tratamento de acne grau II',
      procedimentos: [
        {
          nome: 'Limpeza de Pele',
          frequencia: 'Mensal',
          sessoes: 6,
          realizadas: 2
        },
        {
          nome: 'Peeling Químico',
          frequencia: 'Quinzenal',
          sessoes: 4,
          realizadas: 1
        }
      ],
      medicamentos: [
        {
          nome: 'Gel de Ácido Salicílico 2%',
          instrucoes: 'Aplicar à noite, 3x por semana'
        }
      ],
      evolucaoEsperada: 'Melhora significativa em 3-4 meses',
      proximoRetorno: '2024-03-15'
    },
    resultadosAnalises: [
      {
        id: 1,
        data: '2024-01-15',
        tipo: 'Avaliação Dermatológica',
        resultado: 'Acne grau II com comedões e pápulas',
        profissional: 'Dra. Maria Silva'
      }
    ],
    comunicacaoHistorico: [
      {
        id: 1,
        data: '2024-01-16T09:00:00Z',
        tipo: 'whatsapp',
        conteudo: 'Lembrete: Aplicar o gel conforme orientado',
        enviado: true
      },
      {
        id: 2,
        data: '2024-02-10T16:00:00Z',
        tipo: 'email',
        conteudo: 'Confirmação do próximo procedimento',
        enviado: true
      }
    ],
    estatisticas: {
      totalConsultas: 2,
      totalProcedimentos: 1,
      satisfacaoGeral: 4.5,
      aderenciaTratamento: 90
    }
  },
  2: {
    id: 2,
    pacienteId: 2,
    numeroProtocolo: 'ALT-2024-12346',
    anamnese: {
      historicoMedico: {
        alergias: {
          medicamentosas: [],
          alimentares: [],
          ambientais: [],
          outras: []
        },
        medicamentosAtuais: [],
        condicoesMedicas: {
          cardiovasculares: [],
          endocrinas: [],
          neurologicas: [],
          dermatologicas: [],
          respiratorias: [],
          gastrointestinais: [],
          geniturinarias: [],
          outras: []
        },
        cirurgiasAnteriores: [],
        habitosVida: {
          tabagismo: { status: 'Não fumante' },
          etilismo: { status: 'Não bebe' },
          atividade_fisica: { pratica: true, tipo: 'Corrida 2x/semana' },
          alimentacao: { tipo: 'Balanceada', restricoes: [] },
          sono: { horasDiarias: 8, qualidade: 'Excelente' }
        }
      },
      especialidade: {
        motivoConsulta: 'Rejuvenescimento facial',
        expectativas: 'Redução de rugas e linhas de expressão',
        historicoEstetico: 'Já realizou botox anteriormente'
      },
      assinatura: { 
        pacienteAssinou: true,
        dataAssinatura: '2024-02-20T09:15:00Z'
      }
    },
    timeline: [
      {
        id: 1,
        data: '2024-02-20T09:15:00Z',
        tipo: 'consulta',
        titulo: 'Consulta Inicial',
        descricao: 'Avaliação para procedimentos de rejuvenescimento',
        profissional: 'Dr. João Santos',
        status: 'concluido'
      }
    ],
    planoTratamento: {
      objetivo: 'Rejuvenescimento facial não invasivo',
      procedimentos: [
        {
          nome: 'Toxina Botulínica',
          frequencia: 'A cada 6 meses',
          sessoes: 1,
          realizadas: 0
        }
      ],
      medicamentos: [],
      evolucaoEsperada: 'Resultados visíveis em 7-15 dias',
      proximoRetorno: '2024-03-20'
    },
    resultadosAnalises: [],
    comunicacaoHistorico: [],
    estatisticas: {
      totalConsultas: 1,
      totalProcedimentos: 0,
      satisfacaoGeral: 5.0,
      aderenciaTratamento: 100
    }
  }
};

/**
 * @route GET /api/prontuario/:pacienteId
 * @desc Busca prontuário por ID do paciente
 */
router.get('/:pacienteId', (req, res) => {
  try {
    const { pacienteId } = req.params;
    const prontuario = mockProntuarios[pacienteId];

    if (!prontuario) {
      return res.status(404).json({
        success: false,
        message: 'Prontuário não encontrado'
      });
    }

    res.json({
      success: true,
      prontuario
    });

  } catch (error) {
    console.error('Erro ao buscar prontuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route POST /api/prontuario/auditoria
 * @desc Registra acesso ao prontuário para auditoria
 */
router.post('/auditoria', (req, res) => {
  try {
    const { pacienteId, acao, timestamp } = req.body;
    
    // Em um sistema real, isso seria salvo no banco de dados
    console.log(`Auditoria: ${acao} no prontuário do paciente ${pacienteId} em ${timestamp}`);
    
    res.json({
      success: true,
      message: 'Acesso registrado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route POST /api/prontuario/upload
 * @desc Upload de arquivos para o prontuário
 */
router.post('/upload', (req, res) => {
  try {
    // Em um sistema real, aqui seria feito o upload do arquivo
    res.json({
      success: true,
      message: 'Arquivo enviado com sucesso',
      arquivo: {
        id: Date.now(),
        nome: 'documento.pdf',
        tipo: 'application/pdf',
        tamanho: 1024,
        url: '/uploads/documento.pdf'
      }
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route POST /api/ai/analisar-prontuario
 * @desc Análise de prontuário com IA (mock)
 */
router.post('/analisar-prontuario', (req, res) => {
  try {
    // Mock de análise de IA
    const analises = {
      riscoGeral: 'Baixo',
      recomendacoes: [
        'Manter hidratação adequada da pele',
        'Usar protetor solar diariamente',
        'Seguir o protocolo de medicamentos prescritos'
      ],
      alertas: [],
      pontuacaoSaude: 8.5
    };

    res.json({
      success: true,
      analises
    });

  } catch (error) {
    console.error('Erro na análise:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route POST /api/automacao/disparar
 * @desc Dispara automações (mock)
 */
router.post('/disparar', (req, res) => {
  try {
    const { trigger, dados } = req.body;
    
    console.log(`Automação disparada: ${trigger}`, dados);
    
    res.json({
      success: true,
      message: 'Automação disparada com sucesso'
    });

  } catch (error) {
    console.error('Erro na automação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;
