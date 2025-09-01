import { useState, useCallback, useEffect } from 'react';
import { usePacientes } from './usePacientes';
import { prontuarioValidations } from '../models/prontuarioSchema';

// Hook integrado para gerenciar Prontuário Clínico completo
export const useProntuario = (pacienteId = null) => {
  const { buscarPacientePorId } = usePacientes();
  
  const [prontuario, setProntuario] = useState(null);
  const [paciente, setPaciente] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analises, setAnalises] = useState({});

  // Gerar número de protocolo único
  const gerarNumeroProtocolo = useCallback(() => {
    const ano = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-5);
    return `ALT-${ano}-${timestamp}`;
  }, []);

  // Criar estrutura inicial do prontuário
  const criarProntuarioVazio = useCallback((pacienteId) => ({
    id: `pront_${Date.now()}`,
    pacienteId,
    numeroProtocolo: gerarNumeroProtocolo(),
    anamnese: {
      historicoMedico: {
        alergias: { medicamentosas: [], alimentares: [], ambientais: [], outras: [] },
        medicamentosAtuais: [],
        condicoesMedicas: {
          cardiovasculares: [], endocrinas: [], neurologicas: [],
          dermatologicas: [], respiratorias: [], gastrointestinais: [],
          geniturinarias: [], outras: []
        },
        cirurgiasAnteriores: [],
        habitosVida: {
          tabagismo: { status: 'Não fumante' },
          etilismo: { status: 'Não bebe' },
          atividade_fisica: { pratica: false },
          alimentacao: { tipo: '', restricoes: [] },
          sono: { horasDiarias: 8, qualidade: 'Boa' }
        }
      },
      especialidade: {},
      assinatura: { pacienteAssinou: false }
    },
    timeline: [],
    planoTratamento: {
      objetivo: '',
      etapas: [],
      contraIndicacoes: '',
      cuidadosEspeciais: ''
    },
    resultados: {
      avaliacoes: [],
      estatisticas: {
        totalSessoes: 0,
        faltas: 0,
        cancelamentos: 0,
        satisfacaoMedia: 0,
        investimentoTotal: 0
      }
    },
    comunicacao: {
      preferencias: {
        canalPreferido: 'WhatsApp',
        tipoConteudo: ['lembretes']
      },
      historico: []
    },
    compliance: {
      lgpd: {
        consentimentoTratamentoDados: { concedido: false },
        compartilhamentoDados: { autorizado: false }
      },
      consentimentosEspecificos: [],
      auditoriaAcessos: []
    },
    metadata: {
      versao: '1.0',
      criadoEm: new Date().toISOString(),
      status: 'Ativo',
      estatisticas: { totalAcessos: 0 }
    }
  }), [gerarNumeroProtocolo]);

  // Gerar análises automáticas com IA
  const carregarAnalises = useCallback(async (dadosProntuario) => {
    try {
      const baseURL = 'http://localhost:3000';
      const response = await fetch(`${baseURL}/api/ai/analisar-prontuario`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          prontuario: dadosProntuario,
          paciente: paciente 
        })
      });

      if (response.ok) {
        const analises = await response.json();
        setAnalises(analises);
      }
    } catch (err) {
      console.error('Erro ao carregar análises:', err);
    }
  }, [paciente]);

  // Carregar prontuário completo do paciente
  const carregarProntuario = useCallback(async (id = pacienteId) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Carregar dados do paciente e prontuário em paralelo
      const [pacienteData, prontuarioData] = await Promise.all([
        buscarPacientePorId(id),
        fetch(`/api/prontuario/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }).then(res => res.ok ? res.json() : null)
      ]);
      
      setPaciente(pacienteData);
      setProntuario(prontuarioData || criarProntuarioVazio(id));
      setTimeline(prontuarioData?.timeline || []);
      
      // Carregar análises automáticas
      if (prontuarioData) {
        await carregarAnalises(prontuarioData);
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar prontuário:', err);
    } finally {
      setLoading(false);
    }
  }, [pacienteId, buscarPacientePorId, carregarAnalises, criarProntuarioVazio]);

  // Disparar automações
  const dispararAutomacoes = useCallback(async (trigger, dados) => {
    try {
      const baseURL = 'http://localhost:3000';
      await fetch(`${baseURL}/api/automacao/disparar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trigger,
          pacienteId,
          dados
        })
      });
    } catch (err) {
      console.error('Erro em automação:', err);
    }
  }, [pacienteId]);

  // Adicionar novo atendimento à timeline
  const adicionarAtendimento = useCallback(async (dadosAtendimento) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validar dados obrigatórios
      const validacao = validarAtendimento(dadosAtendimento);
      if (!validacao.valido) {
        throw new Error(`Dados obrigatórios: ${validacao.erros.join(', ')}`);
      }

      const novoAtendimento = {
        id: `atend_${Date.now()}`,
        ...dadosAtendimento,
        data: dadosAtendimento.data || new Date().toISOString(),
        metadata: {
          criadoEm: new Date().toISOString(),
          criadoPor: localStorage.getItem('userId'),
          status: 'Aberto',
          faturado: false
        }
      };

      // Calcular IMC se peso e altura fornecidos
      if (novoAtendimento.exameClinico?.sinaisVitais?.peso && 
          novoAtendimento.exameClinico?.sinaisVitais?.altura) {
        const peso = novoAtendimento.exameClinico.sinaisVitais.peso;
        const altura = novoAtendimento.exameClinico.sinaisVitais.altura / 100; // cm para m
        novoAtendimento.exameClinico.sinaisVitais.imc = (peso / (altura * altura)).toFixed(2);
      }

      // Salvar no backend
      const response = await fetch(`/api/prontuario/${pacienteId}/atendimento`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(novoAtendimento)
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar atendimento');
      }

      const atendimentoSalvo = await response.json();
      
      // Atualizar timeline local
      setTimeline(prev => [atendimentoSalvo, ...prev]);
      
      // Disparar automações
      await dispararAutomacoes('novo_atendimento', atendimentoSalvo);
      
      return atendimentoSalvo;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pacienteId, dispararAutomacoes]);

  // Atualizar anamnese
  const atualizarAnamnese = useCallback(async (dadosAnamnese) => {
    setLoading(true);
    setError(null);
    
    try {
      const anamneseAtualizada = {
        ...prontuario.anamnese,
        ...dadosAnamnese,
        assinatura: {
          ...prontuario.anamnese.assinatura,
          dataAssinatura: new Date().toISOString()
        }
      };

      const response = await fetch(`/api/prontuario/${pacienteId}/anamnese`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(anamneseAtualizada)
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar anamnese');
      }

      setProntuario(prev => ({
        ...prev,
        anamnese: anamneseAtualizada
      }));

      return anamneseAtualizada;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pacienteId, prontuario]);

  // Adicionar procedimento realizado
  const adicionarProcedimento = useCallback(async (dadosProcedimento) => {
    try {
      const procedimento = {
        ...dadosProcedimento,
        id: `proc_${Date.now()}`,
        data: dadosProcedimento.data || new Date().toISOString(),
        status: 'Realizado'
      };

      // Se faz parte de um atendimento existente
      if (dadosProcedimento.atendimentoId) {
        setTimeline(prev => prev.map(atend => 
          atend.id === dadosProcedimento.atendimentoId
            ? {
                ...atend,
                procedimentosRealizados: [...(atend.procedimentosRealizados || []), procedimento]
              }
            : atend
        ));
      } else {
        // Criar novo atendimento só para o procedimento
        await adicionarAtendimento({
          tipo: 'Procedimento',
          motivoConsulta: `Procedimento: ${procedimento.nome}`,
          profissional: procedimento.profissionalExecutor,
          procedimentosRealizados: [procedimento]
        });
      }

      // Atualizar estatísticas
      setProntuario(prev => ({
        ...prev,
        resultados: {
          ...prev.resultados,
          estatisticas: {
            ...prev.resultados.estatisticas,
            totalSessoes: prev.resultados.estatisticas.totalSessoes + 1,
            investimentoTotal: prev.resultados.estatisticas.investimentoTotal + (procedimento.valor || 0)
          }
        }
      }));

      return procedimento;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [adicionarAtendimento]);

  // Upload de documentos/fotos
  const uploadDocumento = useCallback(async (arquivo, categoria, atendimentoId = null) => {
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      formData.append('categoria', categoria);
      formData.append('pacienteId', pacienteId);
      if (atendimentoId) formData.append('atendimentoId', atendimentoId);

      const baseURL = 'http://localhost:3000';
      const response = await fetch(`${baseURL}/api/prontuario/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erro no upload');
      }

      const documento = await response.json();
      
      // Atualizar timeline se vinculado a atendimento
      if (atendimentoId) {
        setTimeline(prev => prev.map(atend => 
          atend.id === atendimentoId
            ? {
                ...atend,
                anexos: {
                  ...atend.anexos,
                  [categoria]: [...(atend.anexos?.[categoria] || []), documento]
                }
              }
            : atend
        ));
      }

      return documento;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  // Validar dados de atendimento
  const validarAtendimento = (dados) => {
    const erros = [];
    const validacao = prontuarioValidations.obrigatorioPorAtendimento[dados.tipo?.toLowerCase()];
    
    if (validacao) {
      validacao.forEach(campo => {
        if (!dados[campo]) {
          erros.push(campo);
        }
      });
    }

    return {
      valido: erros.length === 0,
      erros
    };
  };

  // Buscar histórico de comunicação
  const buscarHistoricoComunicacao = useCallback(async () => {
    try {
      const response = await fetch(`/api/comunicacao/${pacienteId}/historico`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const historico = await response.json();
        setProntuario(prev => ({
          ...prev,
          comunicacao: {
            ...prev.comunicacao,
            historico
          }
        }));
      }
    } catch (err) {
      console.error('Erro ao buscar comunicação:', err);
    }
  }, [pacienteId]);

  // Gerar relatório do prontuário
  const gerarRelatorio = useCallback(async (tipoRelatorio = 'completo') => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/prontuario/${pacienteId}/relatorio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tipo: tipoRelatorio })
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar relatório');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prontuario_${paciente?.nomeCompleto}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [pacienteId, paciente]);

  // Registrar acesso para auditoria
  const registrarAcesso = useCallback(async (acao) => {
    try {
      const baseURL = 'http://localhost:3000';
      await fetch(`${baseURL}/api/prontuario/auditoria`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pacienteId,
          acao,
          timestamp: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error('Erro no registro de auditoria:', err);
    }
  }, [pacienteId]);

  // Carregar prontuário na inicialização
  useEffect(() => {
    if (pacienteId) {
      carregarProntuario(pacienteId);
      registrarAcesso('visualizacao');
    }
  }, [pacienteId, carregarProntuario, registrarAcesso]);

  return {
    // Estado
    prontuario,
    paciente,
    timeline,
    loading,
    error,
    analises,
    
    // Ações principais
    carregarProntuario,
    adicionarAtendimento,
    atualizarAnamnese,
    adicionarProcedimento,
    uploadDocumento,
    
    // Funcionalidades específicas
    buscarHistoricoComunicacao,
    gerarRelatorio,
    validarAtendimento,
    
    // Utilitários
    clearError: () => setError(null),
    recarregarAnalises: () => carregarAnalises(prontuario)
  };
};
