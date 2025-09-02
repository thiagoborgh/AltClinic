import React, { createContext, useContext, useState, useCallback } from 'react';

const PacienteContext = createContext();

export const usePaciente = () => {
  const context = useContext(PacienteContext);
  if (!context) {
    throw new Error('usePaciente deve ser usado dentro de PacienteProvider');
  }
  return context;
};

export const PacienteProvider = ({ children }) => {
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [atendimentoAtivo, setAtendimentoAtivo] = useState(null);

  const selecionarPaciente = useCallback((paciente) => {
    setPacienteSelecionado(paciente);
  }, []);

  const desselecionarPaciente = useCallback(() => {
    setPacienteSelecionado(null);
    setAtendimentoAtivo(null);
  }, []);

  const limparSelecao = useCallback(() => {
    setPacienteSelecionado(null);
    setAtendimentoAtivo(null);
  }, []);

  const iniciarAtendimento = useCallback((dadosAtendimento) => {
    if (pacienteSelecionado) {
      setAtendimentoAtivo({
        ...dadosAtendimento,
        pacienteId: pacienteSelecionado.id,
        pacienteNome: pacienteSelecionado.nome,
        iniciadoEm: new Date().toISOString()
      });
    }
  }, [pacienteSelecionado]);

  const finalizarAtendimento = useCallback(() => {
    setAtendimentoAtivo(null);
  }, []);

  const atualizarStatusAtendimento = useCallback((novoStatus) => {
    if (atendimentoAtivo) {
      setAtendimentoAtivo(prev => ({
        ...prev,
        status: novoStatus,
        ultimaAtualizacao: new Date().toISOString()
      }));
    }
  }, [atendimentoAtivo]);

  const value = {
    // Estado
    pacienteSelecionado,
    atendimentoAtivo,
    
    // Ações
    selecionarPaciente,
    desselecionarPaciente,
    limparSelecao,
    iniciarAtendimento,
    finalizarAtendimento,
    atualizarStatusAtendimento,
    
    // Estado derivado
    temPacienteSelecionado: !!pacienteSelecionado,
    temAtendimentoAtivo: !!atendimentoAtivo,
    podeIniciarAtendimento: !!pacienteSelecionado && !atendimentoAtivo,
    modoProntuario: !!pacienteSelecionado
  };

  return (
    <PacienteContext.Provider value={value}>
      {children}
    </PacienteContext.Provider>
  );
};

export default PacienteContext;
