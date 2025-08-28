import { useState, useEffect, useMemo } from 'react';

const useSegmentos = () => {
  const [segmentos, setSegmentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Segmentos iniciais (mock)
  const segmentosIniciais = useMemo(() => [
    {
      id: 'novos_pacientes',
      nome: 'Novos Pacientes',
      descricao: 'Pacientes cadastrados nos últimos 30 dias',
      tipo: 'automatico',
      criterios: 'Cadastro recente',
      cor: '#4caf50',
      pacientesCount: 15,
      ativo: true,
      criadoEm: new Date().toISOString()
    },
    {
      id: 'pacientes_ativos',
      nome: 'Pacientes Ativos',
      descricao: 'Pacientes com consultas nos últimos 60 dias',
      tipo: 'automatico',
      criterios: 'Atividade recente',
      cor: '#2196f3',
      pacientesCount: 89,
      ativo: true,
      criadoEm: new Date().toISOString()
    },
    {
      id: 'alto_valor',
      nome: 'Alto Valor',
      descricao: 'Pacientes com gastos acima de R$ 5.000',
      tipo: 'automatico',
      criterios: 'Valor monetário elevado',
      cor: '#9c27b0',
      pacientesCount: 23,
      ativo: true,
      criadoEm: new Date().toISOString()
    }
  ], []);

  useEffect(() => {
    const carregarSegmentosInterno = async () => {
      setLoading(true);
      try {
        // Simular carregamento de API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Carregar segmentos do localStorage ou usar iniciais
        const segmentosSalvos = localStorage.getItem('segmentos');
        if (segmentosSalvos) {
          setSegmentos(JSON.parse(segmentosSalvos));
        } else {
          setSegmentos(segmentosIniciais);
          localStorage.setItem('segmentos', JSON.stringify(segmentosIniciais));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    carregarSegmentosInterno();
  }, [segmentosIniciais]);

  const carregarSegmentos = async () => {
    setLoading(true);
    try {
      // Simular carregamento de API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Carregar segmentos do localStorage ou usar iniciais
      const segmentosSalvos = localStorage.getItem('segmentos');
      if (segmentosSalvos) {
        setSegmentos(JSON.parse(segmentosSalvos));
      } else {
        setSegmentos(segmentosIniciais);
        localStorage.setItem('segmentos', JSON.stringify(segmentosIniciais));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const criarSegmento = async (dadosSegmento) => {
    setLoading(true);
    try {
      const novoSegmento = {
        id: `segmento_${Date.now()}`,
        ...dadosSegmento,
        pacientesCount: dadosSegmento.pacientesCount || 0,
        ativo: true,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      };

      const novosSegmentos = [...segmentos, novoSegmento];
      setSegmentos(novosSegmentos);
      localStorage.setItem('segmentos', JSON.stringify(novosSegmentos));

      return novoSegmento;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const atualizarSegmento = async (id, dadosAtualizados) => {
    setLoading(true);
    try {
      const segmentosAtualizados = segmentos.map(segmento =>
        segmento.id === id
          ? {
              ...segmento,
              ...dadosAtualizados,
              atualizadoEm: new Date().toISOString()
            }
          : segmento
      );

      setSegmentos(segmentosAtualizados);
      localStorage.setItem('segmentos', JSON.stringify(segmentosAtualizados));

      return segmentosAtualizados.find(s => s.id === id);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const excluirSegmento = async (id) => {
    setLoading(true);
    try {
      const segmentosFiltrados = segmentos.filter(segmento => segmento.id !== id);
      setSegmentos(segmentosFiltrados);
      localStorage.setItem('segmentos', JSON.stringify(segmentosFiltrados));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const ativarDesativarSegmento = async (id, ativo) => {
    return await atualizarSegmento(id, { ativo });
  };

  const obterSegmentoPorId = (id) => {
    return segmentos.find(segmento => segmento.id === id);
  };

  const obterSegmentosAtivos = () => {
    return segmentos.filter(segmento => segmento.ativo);
  };

  const obterSegmentosPorTipo = (tipo) => {
    return segmentos.filter(segmento => segmento.tipo === tipo);
  };

  const executarSegmentacaoAutomatica = async () => {
    setLoading(true);
    try {
      // Simular processamento de segmentação automática
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Atualizar contadores dos segmentos automáticos
      const segmentosAtualizados = segmentos.map(segmento => {
        if (segmento.tipo === 'automatico') {
          return {
            ...segmento,
            pacientesCount: Math.floor(Math.random() * 100) + 10,
            atualizadoEm: new Date().toISOString()
          };
        }
        return segmento;
      });

      setSegmentos(segmentosAtualizados);
      localStorage.setItem('segmentos', JSON.stringify(segmentosAtualizados));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    segmentos,
    loading,
    error,
    carregarSegmentos,
    criarSegmento,
    atualizarSegmento,
    excluirSegmento,
    ativarDesativarSegmento,
    obterSegmentoPorId,
    obterSegmentosAtivos,
    obterSegmentosPorTipo,
    executarSegmentacaoAutomatica
  };
};

export { useSegmentos };
