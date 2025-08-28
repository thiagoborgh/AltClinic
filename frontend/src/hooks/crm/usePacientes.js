import { useState, useEffect } from 'react';
import { mockPacientes } from '../../data/crm/mockCRMData';

const usePacientes = () => {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    carregarPacientes();
  }, []);

  const carregarPacientes = async () => {
    setLoading(true);
    try {
      // Simular carregamento de API
      await new Promise(resolve => setTimeout(resolve, 500));
      setPacientes(mockPacientes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const adicionarPaciente = async (paciente) => {
    setLoading(true);
    try {
      const novoPaciente = {
        id: Date.now(),
        ...paciente,
        dataCadastro: new Date().toISOString().split('T')[0]
      };
      setPacientes(prev => [...prev, novoPaciente]);
      return novoPaciente;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const atualizarPaciente = async (id, dados) => {
    setLoading(true);
    try {
      setPacientes(prev => prev.map(p => 
        p.id === id ? { ...p, ...dados } : p
      ));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const excluirPaciente = async (id) => {
    setLoading(true);
    try {
      setPacientes(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const buscarPacientes = (termo, filtros = {}) => {
    let resultado = [...pacientes];

    // Busca por termo
    if (termo && termo.trim()) {
      const termoBusca = termo.toLowerCase();
      resultado = resultado.filter(paciente =>
        paciente.nome.toLowerCase().includes(termoBusca) ||
        paciente.email.toLowerCase().includes(termoBusca) ||
        paciente.telefone.includes(termoBusca)
      );
    }

    // Aplicar filtros
    if (filtros.status && filtros.status !== 'todos') {
      resultado = resultado.filter(p => p.status === filtros.status);
    }

    if (filtros.segmento && filtros.segmento !== 'todos') {
      resultado = resultado.filter(p => p.segmento === filtros.segmento);
    }

    if (filtros.dataInicio) {
      resultado = resultado.filter(p => 
        new Date(p.dataCadastro) >= new Date(filtros.dataInicio)
      );
    }

    if (filtros.dataFim) {
      resultado = resultado.filter(p => 
        new Date(p.dataCadastro) <= new Date(filtros.dataFim)
      );
    }

    // Ordenação
    if (filtros.ordenacao) {
      resultado.sort((a, b) => {
        switch (filtros.ordenacao) {
          case 'nome_asc':
            return a.nome.localeCompare(b.nome);
          case 'nome_desc':
            return b.nome.localeCompare(a.nome);
          case 'data_asc':
            return new Date(a.dataCadastro) - new Date(b.dataCadastro);
          case 'data_desc':
            return new Date(b.dataCadastro) - new Date(a.dataCadastro);
          default:
            return 0;
        }
      });
    }

    return resultado;
  };

  const obterEstatisticas = () => {
    return {
      total: pacientes.length,
      ativos: pacientes.filter(p => p.status === 'ativo').length,
      inativos: pacientes.filter(p => p.status === 'inativo').length,
      novos: pacientes.filter(p => {
        const cadastro = new Date(p.dataCadastro);
        const trinta_dias = new Date();
        trinta_dias.setDate(trinta_dias.getDate() - 30);
        return cadastro >= trinta_dias;
      }).length
    };
  };

  return {
    pacientes,
    loading,
    error,
    carregarPacientes,
    adicionarPaciente,
    atualizarPaciente,
    excluirPaciente,
    buscarPacientes,
    obterEstatisticas
  };
};

export { usePacientes };
