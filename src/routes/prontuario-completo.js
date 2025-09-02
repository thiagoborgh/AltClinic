const express = require('express');
const router = express.Router();

// Mock data para desenvolvimento
const mockProntuarios = new Map();

// Dados mock mais completos para o prontuário
const gerarProntuarioMock = (pacienteId) => ({
  id: `pront_${pacienteId}`,
  paciente: {
    id: pacienteId,
    nome: 'Maria Silva Santos',
    idade: 35,
    email: 'maria.silva@email.com',
    telefone: '(11) 99999-9999'
  },
  anamnese: {
    dataPreenchimento: '2025-08-15T10:00:00Z',
    dadosPessoais: {
      estadoCivil: 'Casada',
      profissao: 'Engenheira',
      motivoConsulta: 'Tratamento estético facial'
    },
    historico: {
      doencas: ['Hipertensão'],
      cirurgias: 'sim',
      descricaoCirurgias: 'Apendicectomia em 2018'
    },
    alergias: ['Dipirona', 'Penicilina'],
    medicamentos: ['Losartana 50mg', 'Vitamina D'],
    habitosVida: {
      tabagismo: 'nunca',
      alcool: 'social',
      atividadeFisica: 'moderado'
    },
    observacoes: 'Paciente muito colaborativa, busca resultados naturais.'
  },
  evolucoes: [
    {
      id: 1,
      data: '2025-08-15',
      medidas: {
        peso: '65.5',
        altura: '165',
        imc: '24.1',
        cintura: '68',
        quadril: '95'
      },
      observacoes: 'Avaliação inicial - medidas base',
      timestamp: '2025-08-15T14:30:00Z'
    },
    {
      id: 2,
      data: '2025-08-30',
      medidas: {
        peso: '64.8',
        cintura: '66',
        quadril: '93'
      },
      observacoes: 'Primeira reavaliação - paciente seguindo orientações',
      timestamp: '2025-08-30T15:00:00Z'
    }
  ],
  imagens: [
    {
      id: 1,
      nome: 'foto-inicial-frontal.jpg',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Gb3RvIEZyb250YWw8L3RleHQ+PC9zdmc+',
      descricao: 'Foto inicial - vista frontal',
      categoria: 'antes',
      tags: ['face', 'frontal', 'inicial'],
      dataUpload: '2025-08-15T14:45:00Z',
      tamanho: 2456789,
      tipo: 'image/jpeg'
    },
    {
      id: 2,
      nome: 'foto-inicial-perfil.jpg',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Gb3RvIFBlcmZpbDwvdGV4dD48L3N2Zz4=',
      descricao: 'Foto inicial - perfil direito',
      categoria: 'antes',
      tags: ['face', 'perfil', 'inicial'],
      dataUpload: '2025-08-15T14:46:00Z',
      tamanho: 2234567,
      tipo: 'image/jpeg'
    }
  ],
  atendimentos: [
    {
      id: 1,
      data: '2025-08-15',
      tipo: 'Consulta Inicial',
      profissional: 'Dra. Ana Costa',
      procedimentos: ['Avaliação facial', 'Anamnese'],
      observacoes: 'Paciente indicada para protocolo de rejuvenescimento facial'
    },
    {
      id: 2,
      data: '2025-08-30',
      tipo: 'Retorno',
      profissional: 'Dra. Ana Costa',
      procedimentos: ['Reavaliação', 'Ajuste do protocolo'],
      observacoes: 'Boa evolução, paciente satisfeita com resultados'
    }
  ],
  ultimoAtendimento: '2025-08-30T15:00:00Z',
  configuracoes: {
    especialidade: 'estetica',
    integracaoIA: {
      ativa: true,
      provedor: 'gemini'
    }
  }
});

// GET /api/prontuario/:pacienteId - Buscar prontuário por paciente
router.get('/:pacienteId', (req, res) => {
  try {
    const { pacienteId } = req.params;
    
    console.log(`Buscando prontuário para paciente: ${pacienteId}`);
    
    // Verificar se já existe no cache
    if (!mockProntuarios.has(pacienteId)) {
      mockProntuarios.set(pacienteId, gerarProntuarioMock(pacienteId));
    }
    
    const prontuario = mockProntuarios.get(pacienteId);
    
    res.json(prontuario);
    
  } catch (error) {
    console.error('Erro ao buscar prontuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PUT /api/prontuario/:pacienteId/anamnese - Atualizar anamnese
router.put('/:pacienteId/anamnese', (req, res) => {
  try {
    const { pacienteId } = req.params;
    const dadosAnamnese = req.body;
    
    console.log(`Atualizando anamnese para paciente: ${pacienteId}`);
    
    if (!mockProntuarios.has(pacienteId)) {
      mockProntuarios.set(pacienteId, gerarProntuarioMock(pacienteId));
    }
    
    const prontuario = mockProntuarios.get(pacienteId);
    prontuario.anamnese = {
      ...prontuario.anamnese,
      ...dadosAnamnese,
      dataAtualizacao: new Date().toISOString()
    };
    
    mockProntuarios.set(pacienteId, prontuario);
    
    res.json({
      success: true,
      message: 'Anamnese atualizada com sucesso',
      anamnese: prontuario.anamnese
    });
    
  } catch (error) {
    console.error('Erro ao atualizar anamnese:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar anamnese',
      error: error.message
    });
  }
});

// POST /api/prontuario/:pacienteId/evolucao - Adicionar evolução
router.post('/:pacienteId/evolucao', (req, res) => {
  try {
    const { pacienteId } = req.params;
    const dadosEvolucao = req.body;
    
    console.log(`Adicionando evolução para paciente: ${pacienteId}`);
    
    if (!mockProntuarios.has(pacienteId)) {
      mockProntuarios.set(pacienteId, gerarProntuarioMock(pacienteId));
    }
    
    const prontuario = mockProntuarios.get(pacienteId);
    
    const novaEvolucao = {
      ...dadosEvolucao,
      id: Date.now(),
      timestamp: new Date().toISOString()
    };
    
    if (!prontuario.evolucoes) {
      prontuario.evolucoes = [];
    }
    
    prontuario.evolucoes.push(novaEvolucao);
    mockProntuarios.set(pacienteId, prontuario);
    
    res.json({
      success: true,
      message: 'Evolução adicionada com sucesso',
      evolucao: novaEvolucao
    });
    
  } catch (error) {
    console.error('Erro ao adicionar evolução:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar evolução',
      error: error.message
    });
  }
});

// POST /api/prontuario/:pacienteId/imagem - Adicionar imagem
router.post('/:pacienteId/imagem', (req, res) => {
  try {
    const { pacienteId } = req.params;
    
    console.log(`Adicionando imagem para paciente: ${pacienteId}`);
    
    if (!mockProntuarios.has(pacienteId)) {
      mockProntuarios.set(pacienteId, gerarProntuarioMock(pacienteId));
    }
    
    const prontuario = mockProntuarios.get(pacienteId);
    
    // Simular upload da imagem
    const novaImagem = {
      id: Date.now(),
      nome: req.body.nome || `imagem-${Date.now()}.jpg`,
      url: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Ob3ZhIEZvdG88L3RleHQ+PC9zdmc+`,
      descricao: req.body.descricao || '',
      categoria: req.body.categoria || 'durante',
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      dataUpload: new Date().toISOString(),
      tamanho: Math.floor(Math.random() * 5000000),
      tipo: 'image/jpeg',
      criptografada: true
    };
    
    if (!prontuario.imagens) {
      prontuario.imagens = [];
    }
    
    prontuario.imagens.push(novaImagem);
    mockProntuarios.set(pacienteId, prontuario);
    
    res.json({
      success: true,
      message: 'Imagem adicionada com sucesso',
      imagem: novaImagem
    });
    
  } catch (error) {
    console.error('Erro ao adicionar imagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar imagem',
      error: error.message
    });
  }
});

// POST /api/prontuario/:pacienteId/relatorio - Gerar relatório
router.post('/:pacienteId/relatorio', (req, res) => {
  try {
    const { pacienteId } = req.params;
    const { tipo, formato } = req.body;
    
    console.log(`Gerando relatório ${tipo} em formato ${formato} para paciente: ${pacienteId}`);
    
    if (!mockProntuarios.has(pacienteId)) {
      return res.status(404).json({
        success: false,
        message: 'Prontuário não encontrado'
      });
    }
    
    const prontuario = mockProntuarios.get(pacienteId);
    
    // Simular geração do relatório
    const relatorio = {
      id: Date.now(),
      tipo: tipo,
      formato: formato,
      paciente: prontuario.paciente,
      dataGeracao: new Date().toISOString(),
      conteudo: prontuario,
      url: `/api/relatorios/mock-relatorio-${Date.now()}.${formato}`,
      tamanho: '2.3 MB',
      paginas: formato === 'pdf' ? 12 : null
    };
    
    res.json({
      success: true,
      message: 'Relatório gerado com sucesso',
      relatorio: relatorio
    });
    
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório',
      error: error.message
    });
  }
});

// POST /api/prontuario/auditoria - Registrar auditoria
router.post('/auditoria', (req, res) => {
  try {
    const { pacienteId, acao, detalhes, timestamp, usuario } = req.body;
    
    console.log(`Registrando auditoria: ${acao} para paciente ${pacienteId} por ${usuario}`);
    
    // Em um sistema real, isso seria salvo no banco de dados
    const registroAuditoria = {
      id: Date.now(),
      pacienteId,
      acao,
      detalhes,
      timestamp,
      usuario,
      ip: req.ip || 'localhost'
    };
    
    res.json({
      success: true,
      message: 'Auditoria registrada com sucesso',
      registro: registroAuditoria
    });
    
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar auditoria',
      error: error.message
    });
  }
});

module.exports = router;
