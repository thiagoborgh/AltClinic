import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Select, InputLabel, FormControl, Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { crmService } from '../../services/api';

const canais = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' }
];

const EnvioMensagemModal = ({ open, onClose, onEnviar, apiAtiva, statusConexao }) => {
  const [pacienteId, setPacienteId] = useState('');
  const [canal, setCanal] = useState('whatsapp');
  const [mensagem, setMensagem] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [enviandoAPI, setEnviandoAPI] = useState(false);
  const [pacientes, setPacientes] = useState([]);

  useEffect(() => {
    let mounted = true;
    const loadPacientes = async () => {
      try {
        const response = await crmService.getPacientes({ limit: 1000 });
        if (!mounted) return;
        setPacientes(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Erro ao carregar pacientes para envio de mensagem:', err);
      }
    };
    loadPacientes();
    return () => { mounted = false; };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(mensagem);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  };

  const handleClose = () => {
    setPacienteId('');
    setCanal('whatsapp');
    setMensagem('');
    setCopiado(false);
    setEnviandoAPI(false);
    onClose();
  };

  const handleEnviarAPI = async () => {
    if (pacienteId && canal && mensagem) {
      setEnviandoAPI(true);
      try {
        // Simulação de envio via API
        await new Promise(resolve => setTimeout(resolve, 2000));
        onEnviar({ pacienteId, canal, mensagem, modo: 'api' });
        handleClose();
      } catch (error) {
        console.error('Erro no envio via API:', error);
        setEnviandoAPI(false);
      }
    }
  };

  const handleEnviarManual = () => {
    if (pacienteId && canal && mensagem) {
      onEnviar({ pacienteId, canal, mensagem, modo: 'manual' });
      handleClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Nova Mensagem
        <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <FormControl fullWidth margin="normal">
          <InputLabel>Paciente</InputLabel>
          <Select
            value={pacienteId}
            label="Paciente"
            onChange={e => setPacienteId(e.target.value)}
          >
            {pacientes.map(p => (
              <MenuItem key={p.id} value={p.id}>{p.nome}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>Canal</InputLabel>
          <Select
            value={canal}
            label="Canal"
            onChange={e => setCanal(e.target.value)}
          >
            {canais.map(c => (
              <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Mensagem"
          multiline
          minRows={4}
          fullWidth
          margin="normal"
          value={mensagem}
          onChange={e => setMensagem(e.target.value)}
        />
        <Box mt={2} display="flex" alignItems="center" gap={2} flexWrap="wrap">
          {!apiAtiva || statusConexao !== 'conectado' ? (
            // Modo Manual
            <>
              <Button
                variant="outlined"
                onClick={handleCopy}
                disabled={!mensagem}
              >
                {copiado ? 'Copiado!' : 'Copiar Mensagem'}
              </Button>
              <Button
                variant="contained"
                onClick={handleEnviarManual}
                disabled={!pacienteId || !mensagem}
                color="primary"
              >
                Registrar Envio
              </Button>
              <Typography variant="caption" color="textSecondary">
                Envie manualmente pelo canal selecionado.
              </Typography>
            </>
          ) : (
            // Modo API
            <>
              <Button
                variant="contained"
                onClick={handleEnviarAPI}
                disabled={!pacienteId || !mensagem || enviandoAPI}
                color="primary"
              >
                {enviandoAPI ? 'Enviando...' : 'Enviar via API'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleCopy}
                disabled={!mensagem}
              >
                {copiado ? 'Copiado!' : 'Copiar Mensagem'}
              </Button>
              <Typography variant="caption" color="textSecondary">
                Mensagem será enviada automaticamente via API.
              </Typography>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};
export default EnvioMensagemModal;
