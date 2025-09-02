import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  PlayArrow as IniciarIcon,
  Pause as EsperaIcon,
  Cancel as CancelarIcon,
  CheckCircle as ConcluirIcon,
  AccessTime as TimerIcon
} from '@mui/icons-material';

const STATUS_CONFIG = {
  pendente: { 
    color: 'default', 
    label: 'Pendente', 
    bg: '#f5f5f5' 
  },
  em_atendimento: { 
    color: 'success', 
    label: 'Em Atendimento', 
    bg: '#e8f5e8' 
  },
  em_espera: { 
    color: 'warning', 
    label: 'Em Espera', 
    bg: '#fff3e0' 
  },
  cancelado: { 
    color: 'error', 
    label: 'Cancelado', 
    bg: '#ffebee' 
  },
  concluido: { 
    color: 'info', 
    label: 'Concluído', 
    bg: '#e3f2fd' 
  }
};

const MOTIVOS_ESPERA = [
  'Paciente atrasado',
  'Emergência médica',
  'Problema técnico',
  'Procedimento complexo',
  'Aguardando exames',
  'Outro'
];

const MOTIVOS_CANCELAMENTO = [
  'Paciente não compareceu',
  'Paciente cancelou',
  'Emergência médica',
  'Problema técnico',
  'Reagendamento solicitado',
  'Outro'
];

export default function AtendimentoControls({ 
  paciente, 
  statusAtual = 'pendente', 
  tempoAtendimento = 0,
  onIniciarAtendimento,
  onColocarEmEspera,
  onCancelarAtendimento,
  onConcluirAtendimento,
  disabled = false
}) {
  const [modalAberto, setModalAberto] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [motivoCustom, setMotivoCustom] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);

  const formatarTempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}h ${minutos}m ${segs}s`;
    }
    return `${minutos}m ${segs}s`;
  };

  const handleAcao = async (acao) => {
    setLoading(true);
    try {
      const dados = {
        pacienteId: paciente.id,
        acao,
        motivo: motivo === 'Outro' ? motivoCustom : motivo,
        observacoes,
        timestamp: new Date().toISOString(),
        statusAnterior: statusAtual
      };

      switch (acao) {
        case 'iniciar':
          await onIniciarAtendimento?.(dados);
          break;
        case 'espera':
          await onColocarEmEspera?.(dados);
          break;
        case 'cancelar':
          await onCancelarAtendimento?.(dados);
          break;
        case 'concluir':
          await onConcluirAtendimento?.(dados);
          break;
        default:
          console.warn('Ação não reconhecida:', acao);
      }

      // Fechar modal
      setModalAberto(null);
      setMotivo('');
      setMotivoCustom('');
      setObservacoes('');
    } catch (error) {
      console.error('Erro na ação:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = STATUS_CONFIG[statusAtual] || STATUS_CONFIG.pendente;

  return (
    <Box sx={{ p: 3, bgcolor: statusConfig.bg, borderRadius: 2, mb: 3 }}>
      {/* Status Atual e Timer */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h6">Status do Atendimento</Typography>
          <Chip 
            label={statusConfig.label} 
            color={statusConfig.color} 
            size="large"
          />
        </Box>
        
        {statusAtual === 'em_atendimento' && (
          <Box display="flex" alignItems="center" gap={1}>
            <TimerIcon color="action" />
            <Typography variant="h6" color="primary">
              {formatarTempo(tempoAtendimento)}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Botões de Ação */}
      <Box display="flex" gap={2} flexWrap="wrap">
        {/* Iniciar Atendimento */}
        {statusAtual === 'pendente' && (
          <Button
            variant="contained"
            color="success"
            startIcon={<IniciarIcon />}
            onClick={() => handleAcao('iniciar')}
            disabled={disabled || loading}
            size="large"
          >
            Iniciar Atendimento
          </Button>
        )}

        {/* Colocar em Espera */}
        {statusAtual === 'em_atendimento' && (
          <Button
            variant="contained"
            color="warning"
            startIcon={<EsperaIcon />}
            onClick={() => setModalAberto('espera')}
            disabled={disabled || loading}
            size="large"
          >
            Colocar em Espera
          </Button>
        )}

        {/* Retomar Atendimento */}
        {statusAtual === 'em_espera' && (
          <Button
            variant="contained"
            color="success"
            startIcon={<IniciarIcon />}
            onClick={() => handleAcao('iniciar')}
            disabled={disabled || loading}
            size="large"
          >
            Retomar Atendimento
          </Button>
        )}

        {/* Cancelar Atendimento */}
        {['pendente', 'em_atendimento', 'em_espera'].includes(statusAtual) && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelarIcon />}
            onClick={() => setModalAberto('cancelar')}
            disabled={disabled || loading}
            size="large"
          >
            Cancelar Atendimento
          </Button>
        )}

        {/* Concluir Atendimento */}
        {statusAtual === 'em_atendimento' && (
          <Button
            variant="contained"
            color="info"
            startIcon={<ConcluirIcon />}
            onClick={() => setModalAberto('concluir')}
            disabled={disabled || loading}
            size="large"
          >
            Concluir Atendimento
          </Button>
        )}
      </Box>

      {loading && <LinearProgress sx={{ mt: 2 }} />}

      {/* Modal para Espera */}
      <Dialog open={modalAberto === 'espera'} onClose={() => setModalAberto(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Colocar Atendimento em Espera</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Motivo da Espera</InputLabel>
              <Select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                label="Motivo da Espera"
              >
                {MOTIVOS_ESPERA.map(m => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {motivo === 'Outro' && (
              <TextField
                fullWidth
                label="Especifique o motivo"
                value={motivoCustom}
                onChange={(e) => setMotivoCustom(e.target.value)}
                sx={{ mb: 2 }}
              />
            )}

            <TextField
              fullWidth
              label="Observações (opcional)"
              multiline
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalAberto(null)}>Cancelar</Button>
          <Button 
            onClick={() => handleAcao('espera')} 
            variant="contained" 
            color="warning"
            disabled={!motivo}
          >
            Colocar em Espera
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para Cancelamento */}
      <Dialog open={modalAberto === 'cancelar'} onClose={() => setModalAberto(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancelar Atendimento</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta ação cancelará o atendimento e liberará o horário na agenda.
          </Alert>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Motivo do Cancelamento *</InputLabel>
            <Select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              label="Motivo do Cancelamento *"
              required
            >
              {MOTIVOS_CANCELAMENTO.map(m => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {motivo === 'Outro' && (
            <TextField
              fullWidth
              label="Especifique o motivo *"
              value={motivoCustom}
              onChange={(e) => setMotivoCustom(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            fullWidth
            label="Observações (opcional)"
            multiline
            rows={3}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalAberto(null)}>Cancelar</Button>
          <Button 
            onClick={() => handleAcao('cancelar')} 
            variant="contained" 
            color="error"
            disabled={!motivo || (motivo === 'Outro' && !motivoCustom)}
          >
            Confirmar Cancelamento
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para Conclusão */}
      <Dialog open={modalAberto === 'concluir'} onClose={() => setModalAberto(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Concluir Atendimento</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            O atendimento será marcado como concluído e um relatório automático será gerado.
          </Alert>
          
          <TextField
            fullWidth
            label="Observações finais (opcional)"
            multiline
            rows={4}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Resumo do atendimento, próximos passos, etc..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalAberto(null)}>Cancelar</Button>
          <Button 
            onClick={() => handleAcao('concluir')} 
            variant="contained" 
            color="info"
          >
            Concluir Atendimento
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
