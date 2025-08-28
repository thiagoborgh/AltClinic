import React, { useState } from 'react';
import { Button, Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import EnvioMensagemModal from './EnvioMensagemModal';
import HistoricoMensagens from './HistoricoMensagens';
import ConfiguracaoAPI from './ConfiguracaoAPI';
import useMensagens from '../../hooks/mensagens/useMensagens';
import useConfiguracaoAPI from '../../hooks/mensagens/useConfiguracaoAPI';

const MensagensDashboard = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [tabAtiva, setTabAtiva] = useState(0);
  const mensagensHook = useMensagens();
  const configAPI = useConfiguracaoAPI();

  const handleEnviar = (dados) => {
    mensagensHook.enviarMensagemManual(dados);
    setModalOpen(false);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Mensagens</Typography>
        <Button variant="contained" color="primary" onClick={() => setModalOpen(true)}>
          Nova Mensagem
        </Button>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabAtiva} onChange={(e, newValue) => setTabAtiva(newValue)}>
          <Tab label="Histórico" />
          <Tab label="Configuração API" />
        </Tabs>
      </Paper>

      {tabAtiva === 0 && (
        <Box>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="body1" color="textSecondary">
              Envie mensagens para seus pacientes por WhatsApp, Email ou SMS.
              {configAPI.apiAtiva ? ' (API Integrada)' : ' (Modo Manual)'}
            </Typography>
          </Paper>
          <HistoricoMensagens mensagens={mensagensHook.mensagens} />
        </Box>
      )}

      {tabAtiva === 1 && <ConfiguracaoAPI />}

      <EnvioMensagemModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onEnviar={handleEnviar}
        apiAtiva={configAPI.apiAtiva}
        statusConexao={configAPI.statusConexao}
      />
    </Box>
  );
};
export default MensagensDashboard;
