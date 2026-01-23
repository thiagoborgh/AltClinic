import { useState, useCallback, useEffect } from 'react';
import { validationRules, automationConfig } from '../models/pacienteSchema';
import api from '../services/api';

// Sistema profissional: sem dados mockados

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
      const response = await api.get('/pacientes-v2', { params: filtros });
      
      const data = response.data;
      const listaPacientes = data.data || data.pacientes || [];
      setPacientes(listaPacientes);
      return { pacientes: listaPacientes };
    } catch (err) {
      console.error('Erro ao carregar pacientes:', err);
      setError(err.message);
      setPacientes([]);
      return { pacientes: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar paciente por ID
  const buscarPacientePorId = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/pacientes-v2/${id}`);
      
      const paciente = response.data.paciente || response.data.data || response.data;
      return paciente;
    } catch (err) {
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
      const response = await api.get('/pacientes-v2/buscar', { params: { termo } });
      
      const results = response.data.data || response.data.pacientes || [];
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
      const params = {};
      if (cpf) params.cpf = cpf;
      if (telefone) params.telefone = telefone;
      
      const response = await api.get('/pacientes-v2/verificar-duplicatas', { params });
      
      return response.data; // { cpfDuplicado, telefoneDuplicado }
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
      const url = `${baseURL}/api/pacientes-v2`;
      console.log('🚀 [FIRESTORE] Criando paciente na URL:', url);
      console.log('🚀 [FIRESTORE] Timestamp:', new Date().toISOString());
      
      const response = await api.post('/pacientes-v2', dadosPaciente);
      
      const resultado = response.data;
      const novoPaciente = resultado.data || resultado.paciente || resultado;
      
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
      const response = await api.put(`/pacientes-v2/${id}`, dadosAtualizados);
      
      const pacienteAtualizado = response.data.paciente || response.data.data || response.data;
      
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
      await api.delete(`/pacientes-v2/${id}`);
      
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
      const response = await api.post('/ai/sugerir-anamnese', { genero, idade });
      return response.data;
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
    
    // Validar campos obrigatórios (apenas nome e telefone)
    const nomeParaValidar = dados.nome || dados.nomeCompleto;
    if (!nomeParaValidar || nomeParaValidar.trim().length < 3) {
      erros.push('Nome completo deve ter pelo menos 3 caracteres');
    }
    
    // CPF é OPCIONAL
    if (dados.cpf && !validationRules.cpf.validator(dados.cpf)) {
      erros.push(validationRules.cpf.message);
    }
    
    if (!dados.telefone) {
      erros.push('Telefone é obrigatório');
    } else if (!validationRules.telefone.validator(dados.telefone)) {
      erros.push(validationRules.telefone.message);
    }
    
    // Data de nascimento e gênero são OPCIONAIS
    // Removido: validação obrigatória de dataNascimento
    // Removido: validação obrigatória de genero/sexo
    
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
      await api.post('/automacao/boas-vindas', { pacienteId: paciente.id });
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
