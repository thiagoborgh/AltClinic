import { useState, useCallback } from 'react';

const useProntuarioCompleto = () => {
  const [prontuario, setProntuario] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const carregarProntuario = useCallback(async (pacienteId) => {
    setCarregando(true);
    setErro(null);
    
    try {
      const response = await fetch(`http://localhost:3000/api/prontuario-completo/${pacienteId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar prontuário');
      }
      
      const data = await response.json();
      setProntuario(data);
    } catch (error) {
      console.error('Erro ao carregar prontuário:', error);
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  const atualizarAnamnese = useCallback(async (dadosAnamnese) => {
    if (!prontuario?.paciente?.id) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/prontuario-completo/${prontuario.paciente.id}/anamnese`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosAnamnese),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar anamnese');
      }
      
      const data = await response.json();
      setProntuario(prev => ({
        ...prev,
        anamnese: data.anamnese
      }));
      
      return data;
    } catch (error) {
      console.error('Erro ao atualizar anamnese:', error);
      setErro(error.message);
      throw error;
    }
  }, [prontuario]);

  const adicionarEvolucao = useCallback(async (dadosEvolucao) => {
    if (!prontuario?.paciente?.id) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/prontuario-completo/${prontuario.paciente.id}/evolucao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosEvolucao),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao adicionar evolução');
      }
      
      const data = await response.json();
      setProntuario(prev => ({
        ...prev,
        evolucoes: [...(prev.evolucoes || []), data.evolucao]
      }));
      
      return data;
    } catch (error) {
      console.error('Erro ao adicionar evolução:', error);
      setErro(error.message);
      throw error;
    }
  }, [prontuario]);

  const adicionarImagem = useCallback(async (dadosImagem) => {
    if (!prontuario?.paciente?.id) return;
    
    try {
      // Para upload de arquivo, usar FormData
      let body;
      let headers = {};
      
      if (dadosImagem.arquivo) {
        const formData = new FormData();
        formData.append('imagem', dadosImagem.arquivo);
        formData.append('descricao', dadosImagem.descricao || '');
        formData.append('categoria', dadosImagem.categoria || 'antes');
        formData.append('tags', JSON.stringify(dadosImagem.tags || []));
        body = formData;
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(dadosImagem);
      }
      
      const response = await fetch(`http://localhost:3000/api/prontuario/${prontuario.paciente.id}/imagem`, {
        method: 'POST',
        headers,
        body,
      });
      
      if (!response.ok) {
        throw new Error('Erro ao adicionar imagem');
      }
      
      const data = await response.json();
      setProntuario(prev => ({
        ...prev,
        imagens: [...(prev.imagens || []), data.imagem]
      }));
      
      return data;
    } catch (error) {
      console.error('Erro ao adicionar imagem:', error);
      setErro(error.message);
      throw error;
    }
  }, [prontuario]);

  const exportarRelatorio = useCallback(async (configRelatorio) => {
    if (!prontuario?.paciente?.id) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/prontuario/${prontuario.paciente.id}/relatorio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configRelatorio),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao gerar relatório');
      }
      
      // Para downloads de arquivo
      if (configRelatorio.formato === 'pdf') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio-${prontuario.paciente.nome}-${configRelatorio.tipo}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      setErro(error.message);
      throw error;
    }
  }, [prontuario]);

  const analisarComIA = useCallback(async (tipo, dados) => {
    try {
      const response = await fetch(`http://localhost:3000/api/ai/analisar-prontuario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: tipo,
          dados: dados,
          pacienteId: prontuario?.paciente?.id
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erro na análise de IA');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro na análise de IA:', error);
      setErro(error.message);
      throw error;
    }
  }, [prontuario]);

  const registrarAuditoria = useCallback(async (acao, detalhes) => {
    if (!prontuario?.paciente?.id) return;
    
    try {
      await fetch(`http://localhost:3000/api/prontuario/auditoria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pacienteId: prontuario.paciente.id,
          acao: acao,
          detalhes: detalhes,
          timestamp: new Date().toISOString(),
          usuario: localStorage.getItem('userId') || 'anonimo'
        }),
      });
    } catch (error) {
      console.error('Erro ao registrar auditoria:', error);
    }
  }, [prontuario]);

  const limparErro = useCallback(() => {
    setErro(null);
  }, []);

  return {
    prontuario,
    carregando,
    erro,
    carregarProntuario,
    atualizarAnamnese,
    adicionarEvolucao,
    adicionarImagem,
    exportarRelatorio,
    analisarComIA,
    registrarAuditoria,
    limparErro,
  };
};

export default useProntuarioCompleto;
