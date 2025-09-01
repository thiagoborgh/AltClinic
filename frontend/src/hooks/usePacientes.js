import { useState, useCallback, useEffect } from 'react';
import { validationRules, automationConfig } from '../models/pacienteSchema';

// URL base da API
const API_BASE_URL = 'http://localhost:3000/api';

// Dados mock para fallback (quando backend não disponível)
const mockPacientes = [
  {
    id: '1',
    nome: 'Maria Silva Santos',
    email: 'maria.santos@email.com',
    telefone: '(11) 99999-1234',
    cpf: '123.456.789-01',
    dataNascimento: '1985-03-15',
    idade: 39,
    endereco: {
      logradouro: 'Rua das Flores, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01234-567'
    },
    estadoCivil: 'Casada',
    profissao: 'Engenheira',
    convenio: {
      nome: 'Unimed',
      numero: '123456789'
    },
    observacoes: 'Paciente regular, sem restrições',
    dataUltimaConsulta: '2024-08-15',
    proximaConsulta: '2024-09-15',
    criadoEm: '2024-01-15T10:30:00Z',
    ultimoAtendimento: '2024-08-15T14:20:00Z',
    status: 'ativo'
  },
  {
    id: '2',
    nome: 'João Pedro Oliveira',
    email: 'joao.oliveira@email.com',
    telefone: '(11) 88888-5678',
    cpf: '987.654.321-09',
    dataNascimento: '1978-07-22',
    idade: 46,
    endereco: {
      logradouro: 'Av. Paulista, 456',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01310-100'
    },
    estadoCivil: 'Solteiro',
    profissao: 'Advogado',
    convenio: {
      nome: 'Bradesco Saúde',
      numero: '987654321'
    },
    observacoes: 'Paciente com histórico de hipertensão',
    dataUltimaConsulta: '2024-08-20',
    proximaConsulta: null,
    criadoEm: '2024-02-10T09:15:00Z',
    ultimoAtendimento: '2024-08-20T16:45:00Z',
    status: 'ativo'
  }
];

// Hook personalizado para gerenciamento de pacientes
export const usePacientes = () => {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  // Carregar lista de pacientes
  const carregarPacientes = useCallback(async (filtros = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Verificar se o backend está disponível
      const baseURL = 'http://localhost:3000';
      const queryParams = new URLSearchParams(filtros).toString();
      const response = await fetch(`${baseURL}/api/pacientes?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // Se for 404 ou erro de rede, usar dados mock
        console.log('Backend não disponível, usando dados simulados');
        setPacientes(mockPacientes);
        return { pacientes: mockPacientes };
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta não é JSON válido');
      }
      
      const data = await response.json();
      setPacientes(data.pacientes || []);
      return data;
    } catch (err) {
      console.log('Erro na conexão com backend, usando dados simulados:', err.message);
      // Em caso de erro, usar dados mock para desenvolvimento
      setPacientes(mockPacientes);
      return { pacientes: mockPacientes };
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar paciente por ID
  const buscarPacientePorId = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const baseURL = 'http://localhost:3000';
      const response = await fetch(`${baseURL}/api/pacientes/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // Se backend não disponível, buscar nos dados mock
        const pacienteMock = mockPacientes.find(p => p.id === id);
        if (pacienteMock) return pacienteMock;
        throw new Error('Paciente não encontrado');
      }
      
      const paciente = await response.json();
      return paciente;
    } catch (err) {
      // Fallback para dados mock
      const pacienteMock = mockPacientes.find(p => p.id === id);
      if (pacienteMock) {
        console.log('Backend não disponível, usando dados simulados');
        return pacienteMock;
      }
      
      setError(err.message);
      console.error('Erro ao buscar paciente:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar pacientes (por nome, CPF, telefone)
  const buscarPacientes = useCallback(async (termo) => {
    if (!termo || termo.length < 3) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const baseURL = 'http://localhost:3000';
      const response = await fetch(`${baseURL}/api/pacientes/buscar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ termo })
      });
      
      if (!response.ok) {
        throw new Error('Erro na busca');
      }
      
      const results = await response.json();
      setSearchResults(results);
      return results;
    } catch (err) {
      setError(err.message);
      console.error('Erro na busca:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Verificar duplicatas (CPF/Telefone)
  const verificarDuplicatas = useCallback(async (cpf, telefone) => {
    try {
      const baseURL = 'http://localhost:3000';
      const response = await fetch(`${baseURL}/api/pacientes/verificar-duplicatas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cpf, telefone })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao verificar duplicatas');
      }
      
      const result = await response.json();
      return result; // { exists: boolean, paciente?: object }
    } catch (err) {
      console.error('Erro ao verificar duplicatas:', err);
      return { exists: false };
    }
  }, []);

  // Criar novo paciente
  const criarPaciente = useCallback(async (dadosPaciente) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validações client-side
      const errosValidacao = validarDadosPaciente(dadosPaciente);
      if (errosValidacao.length > 0) {
        throw new Error(`Erros de validação: ${errosValidacao.join(', ')}`);
      }

      // Verificar duplicatas
      const duplicata = await verificarDuplicatas(dadosPaciente.cpf, dadosPaciente.telefone);
      if (duplicata.exists) {
        throw new Error('Paciente já cadastrado com este CPF ou telefone');
      }

      // Calcular idade automaticamente
      if (dadosPaciente.dataNascimento) {
        dadosPaciente.metadata = {
          ...dadosPaciente.metadata,
          idade: automationConfig.autoFill.idade.calculation(dadosPaciente.dataNascimento)
        };
      }

      // Registrar consentimento com metadados
      if (dadosPaciente.consentimentos?.mensagensAutomatizadas) {
        dadosPaciente.consentimentos.mensagensAutomatizadas = {
          value: true,
          dataConsentimento: new Date().toISOString(),
          ipConsentimento: await obterIP(),
          textoConsentimento: "Autorizo o envio de mensagens automatizadas para agendamentos, lembretes e ofertas (LGPD Art. 9º)"
        };
      }

      const baseURL = 'http://localhost:3000';
      const response = await fetch(`${baseURL}/api/pacientes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosPaciente)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar paciente');
      }
      
      const novoPaciente = await response.json();
      
      // Atualizar lista local
      setPacientes(prev => [novoPaciente, ...prev]);
      
      // Disparar automações se consentimento dado
      if (novoPaciente.consentimentos?.mensagensAutomatizadas?.value) {
        await dispararMensagemBoasVindas(novoPaciente);
      }
      
      return novoPaciente;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao criar paciente:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [verificarDuplicatas]);

  // Atualizar paciente
  const atualizarPaciente = useCallback(async (id, dadosAtualizados) => {
    setLoading(true);
    setError(null);
    
    try {
      // Recalcular idade se data nascimento mudou
      if (dadosAtualizados.dataNascimento) {
        dadosAtualizados.metadata = {
          ...dadosAtualizados.metadata,
          idade: automationConfig.autoFill.idade.calculation(dadosAtualizados.dataNascimento),
          atualizadoEm: new Date().toISOString()
        };
      }

      const baseURL = 'http://localhost:3000';
      const response = await fetch(`${baseURL}/api/pacientes/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosAtualizados)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar paciente');
      }
      
      const pacienteAtualizado = await response.json();
      
      // Atualizar lista local
      setPacientes(prev => 
        prev.map(p => p.id === id ? pacienteAtualizado : p)
      );
      
      return pacienteAtualizado;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao atualizar paciente:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Excluir paciente (soft delete)
  const excluirPaciente = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const baseURL = 'http://localhost:3000';
      const response = await fetch(`${baseURL}/api/pacientes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir paciente');
      }
      
      // Remover da lista local
      setPacientes(prev => prev.filter(p => p.id !== id));
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao excluir paciente:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sugerir anamnese com IA
  const sugerirAnamnese = useCallback(async (genero, idade) => {
    try {
      const baseURL = 'http://localhost:3000';
      const response = await fetch(`${baseURL}/api/ai/sugerir-anamnese`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ genero, idade })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao gerar sugestões');
      }
      
      const sugestoes = await response.json();
      return sugestoes;
    } catch (err) {
      console.error('Erro ao sugerir anamnese:', err);
      return {
        alergias: [],
        medicamentos: [],
        condicoesMedicas: [],
        perguntasPersonalizadas: []
      };
    }
  }, []);

  // Buscar CEP
  const buscarCEP = useCallback(async (cep) => {
    try {
      const cepLimpo = cep.replace(/[^\d]/g, '');
      if (cepLimpo.length !== 8) return null;

      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      if (!response.ok) return null;

      const endereco = await response.json();
      if (endereco.erro) return null;

      return {
        rua: endereco.logradouro,
        bairro: endereco.bairro,
        cidade: endereco.localidade,
        estado: endereco.uf
      };
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
      return null;
    }
  }, []);

  // Validação de dados
  const validarDadosPaciente = (dados) => {
    const erros = [];
    
    // Validar campos obrigatórios
    if (!dados.nomeCompleto || dados.nomeCompleto.length < 3) {
      erros.push('Nome completo deve ter pelo menos 3 caracteres');
    }
    
    if (!dados.cpf) {
      erros.push('CPF é obrigatório');
    } else if (!validationRules.cpf.validator(dados.cpf)) {
      erros.push(validationRules.cpf.message);
    }
    
    if (!dados.telefone) {
      erros.push('Telefone é obrigatório');
    } else if (!validationRules.telefone.validator(dados.telefone)) {
      erros.push(validationRules.telefone.message);
    }
    
    if (!dados.dataNascimento) {
      erros.push('Data de nascimento é obrigatória');
    }
    
    if (!dados.genero) {
      erros.push('Gênero é obrigatório');
    }
    
    if (dados.email && !validationRules.email.validator(dados.email)) {
      erros.push(validationRules.email.message);
    }
    
    if (dados.consentimentos?.mensagensAutomatizadas === undefined) {
      erros.push('Consentimento para mensagens automatizadas é obrigatório');
    }
    
    return erros;
  };

  // Funções auxiliares
  const obterIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const dispararMensagemBoasVindas = async (paciente) => {
    try {
      const baseURL = 'http://localhost:3000';
      await fetch(`${baseURL}/api/automacao/boas-vindas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pacienteId: paciente.id })
      });
    } catch (err) {
      console.error('Erro ao enviar boas-vindas:', err);
    }
  };

  // Carregar pacientes na inicialização
  useEffect(() => {
    carregarPacientes();
  }, [carregarPacientes]);

  return {
    // Estado
    pacientes,
    loading,
    error,
    searchResults,
    
    // Ações
    carregarPacientes,
    buscarPacientePorId,
    buscarPacientes,
    criarPaciente,
    atualizarPaciente,
    excluirPaciente,
    verificarDuplicatas,
    
    // Funcionalidades especiais
    sugerirAnamnese,
    buscarCEP,
    validarDadosPaciente,
    
    // Utilitários
    clearError: () => setError(null),
    clearSearch: () => setSearchResults([])
  };
};
