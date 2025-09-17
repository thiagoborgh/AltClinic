import React, { createContext, useContext, useState } from 'react';

const PacienteContext = createContext();

export const usePaciente = () => {
  const context = useContext(PacienteContext);
  if (!context) {
    throw new Error('usePaciente deve ser usado dentro de um PacienteProvider');
  }
  return context;
};

export const PacienteProvider = ({ children }) => {
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [pacientes, setPacientes] = useState([]);

  const value = {
    pacienteSelecionado,
    setPacienteSelecionado,
    pacientes,
    setPacientes
  };

  return (
    <PacienteContext.Provider value={value}>
      {children}
    </PacienteContext.Provider>
  );
};