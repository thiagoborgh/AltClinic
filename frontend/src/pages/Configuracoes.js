import React from 'react';
import { PacienteProvider } from '../contexts/PacienteContext';
import ConfiguracoesManager from '../components/configuracoes/ConfiguracoesManager';

const Configuracoes = () => {
  return (
    <PacienteProvider>
      <ConfiguracoesManager />
    </PacienteProvider>
  );
};

export default Configuracoes;
