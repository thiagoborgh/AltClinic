import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  PlayArrow as IniciarIcon,
  Pause as PausarIcon,
  Stop as FinalizarIcon,
  Cancel as CancelarIcon
} from '@mui/icons-material';
import { useAtendimento } from '../../hooks/useAtendimento';

export default function AtendimentoControls({
  paciente,
  atendimentoAtivo,
  onAtendimentoChange,
  size = 'medium'
}) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [tipoAcao, setTipoAcao] = useState('');
  const [motivo, setMotivo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [carregando, setCarregando] = useState(false);

  const { iniciarAtendimento, pausarAtendimento, finalizarAtendimento, cancelarAtendimento } = useAtendimento();

  const handleAcaoAtendimento = (acao) => {
    setTipoAcao(acao);
    setDialogAberto(true);
  };

  const handleConfirmarAcao = async () => {
    if (!motivo.trim()) {
      return;
    }

    setCarregando(true);
    try {
      const dados = {
        pacienteId: paciente.id,
        atendimentoId: atendimentoAtivo?.id,
        motivo,
        observacoes,
        timestamp: new Date().toISOString()
      };

      switch (tipoAcao) {
        case 'iniciar':
          await iniciarAtendimento(dados);
          break;
        case 'pausar':
          await pausarAtendimento(dados);
          break;
        case 'finalizar':
          await finalizarAtendimento(dados);
          break;
        case 'cancelar':
          await cancelarAtendimento(dados);
          break;
        default:
          break;
      }

      onAtendimentoChange && onAtendimentoChange(tipoAcao, dados);
      setDialogAberto(false);
      setMotivo('');
      setObservacoes('');

    } catch (error) {
      console.error('Erro na ação do atendimento:', error);
    } finally {
      setCarregando(false);
    }
  };

  const getStatusColor = () => {
    if (!atendimentoAtivo) return 'default';
    switch (atendimentoAtivo.status) {
      case 'ativo': return 'success';
      case 'pausado': return 'warning';
      case 'finalizado': return 'info';
      case 'cancelado': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = () => {
    if (!atendimentoAtivo) return 'Sem atendimento ativo';
    switch (atendimentoAtivo.status) {
      case 'ativo': return 'Atendimento em Andamento';
      case 'pausado': return 'Atendimento Pausado';
      case 'finalizado': return 'Atendimento Finalizado';
      case 'cancelado': return 'Atendimento Cancelado';
      default: return 'Status Desconhecido';
    }
  };

  // Renderização compacta para uso no header
  if (size === 'small') {
    return (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {!atendimentoAtivo || atendimentoAtivo.status === 'finalizado' || atendimentoAtivo.status === 'cancelado' ? (
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<IniciarIcon />}
            onClick={() => handleAcaoAtendimento('iniciar')}
            disabled={carregando}
          >
            Iniciar
          </Button>
        ) : (
          <>
            {atendimentoAtivo.status === 'ativo' && (
              <Button
                variant="outlined"
                color="warning"
                size="small"
                startIcon={<PausarIcon />}
                onClick={() => handleAcaoAtendimento('pausar')}
                disabled={carregando}
              >
                Pausar
              </Button>
            )}
            {atendimentoAtivo.status === 'pausado' && (
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<IniciarIcon />}
                onClick={() => handleAcaoAtendimento('iniciar')}
                disabled={carregando}
              >
                Retomar
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<FinalizarIcon />}
              onClick={() => handleAcaoAtendimento('finalizar')}
              disabled={carregando}
            >
              Finalizar
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<CancelarIcon />}
              onClick={() => handleAcaoAtendimento('cancelar')}
              disabled={carregando}
            >
              Cancelar
            </Button>
          </>
        )}
        {atendimentoAtivo && (
          <Chip
            label={getStatusText()}
            color={getStatusColor()}
            size="small"
          />
        )}
        {/* Dialog de confirmação */}
        <Dialog open={dialogAberto} onClose={() => setDialogAberto(false)}>
          <DialogTitle>
            {tipoAcao === 'iniciar' && 'Confirmar Início de Atendimento'}
            {tipoAcao === 'pausar' && 'Confirmar Pausa do Atendimento'}
            {tipoAcao === 'finalizar' && 'Confirmar Finalização do Atendimento'}
            {tipoAcao === 'cancelar' && 'Confirmar Cancelamento do Atendimento'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              {tipoAcao === 'iniciar' && 'Deseja realmente iniciar o atendimento para este paciente?'}
              {tipoAcao === 'pausar' && 'Deseja realmente pausar o atendimento atual?'}
              {tipoAcao === 'finalizar' && 'Deseja realmente finalizar o atendimento atual?'}
              {tipoAcao === 'cancelar' && 'Deseja realmente cancelar o atendimento atual?'}
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Motivo"
              fullWidth
              variant="outlined"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
            />
            <TextField
              margin="dense"
              label="Observações (opcional)"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogAberto(false)}>Cancelar</Button>
            <Button 
              onClick={handleConfirmarAcao} 
              disabled={!motivo.trim() || carregando}
              variant="contained"
            >
              Confirmar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Renderização completa para uso normal
  return (
    <>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Controle de Atendimento
            {atendimentoAtivo && (
              <Chip
                label={getStatusText()}
                color={getStatusColor()}
                size="small"
              />
            )}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {!atendimentoAtivo || atendimentoAtivo.status === 'finalizado' || atendimentoAtivo.status === 'cancelado' ? (
            <Button
              variant="contained"
              color="success"
              startIcon={<IniciarIcon />}
              onClick={() => handleAcaoAtendimento('iniciar')}
              disabled={carregando}
            >
              Iniciar Atendimento
            </Button>
          ) : (
            <>
              {atendimentoAtivo.status === 'ativo' && (
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<PausarIcon />}
                  onClick={() => handleAcaoAtendimento('pausar')}
                  disabled={carregando}
                >
                  Pausar
                </Button>
              )}

              {atendimentoAtivo.status === 'pausado' && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<IniciarIcon />}
                  onClick={() => handleAcaoAtendimento('iniciar')}
                  disabled={carregando}
                >
                  Retomar
                </Button>
              )}

              <Button
                variant="contained"
                color="primary"
                startIcon={<FinalizarIcon />}
                onClick={() => handleAcaoAtendimento('finalizar')}
                disabled={carregando}
              >
                Finalizar
              </Button>

              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelarIcon />}
                onClick={() => handleAcaoAtendimento('cancelar')}
                disabled={carregando}
              >
                Cancelar
              </Button>
            </>
          )}
        </Box>

        {atendimentoAtivo && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Iniciado em: {new Date(atendimentoAtivo.dataInicio).toLocaleString('pt-BR')}
            </Typography>
            {atendimentoAtivo.dataFim && (
              <Typography variant="body2" color="text.secondary">
                Finalizado em: {new Date(atendimentoAtivo.dataFim).toLocaleString('pt-BR')}
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      {/* Dialog de confirmação */}
      <Dialog
        open={dialogAberto}
        onClose={() => setDialogAberto(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {tipoAcao === 'iniciar' && 'Iniciar Atendimento'}
          {tipoAcao === 'pausar' && 'Pausar Atendimento'}
          {tipoAcao === 'finalizar' && 'Finalizar Atendimento'}
          {tipoAcao === 'cancelar' && 'Cancelar Atendimento'}
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Motivo</InputLabel>
              <Select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                label="Motivo"
              >
                {tipoAcao === 'iniciar' && [
                  <MenuItem key="consulta" value="Consulta médica">Consulta médica</MenuItem>,
                  <MenuItem key="retorno" value="Retorno">Retorno</MenuItem>,
                  <MenuItem key="emergencia" value="Emergência">Emergência</MenuItem>,
                  <MenuItem key="exame" value="Exame/Procedimento">Exame/Procedimento</MenuItem>
                ]}
                {tipoAcao === 'pausar' && [
                  <MenuItem key="pausa" value="Pausa técnica">Pausa técnica</MenuItem>,
                  <MenuItem key="interrupcao" value="Interrupção temporária">Interrupção temporária</MenuItem>,
                  <MenuItem key="outro" value="Outro motivo">Outro motivo</MenuItem>
                ]}
                {tipoAcao === 'finalizar' && [
                  <MenuItem key="concluido" value="Atendimento concluído">Atendimento concluído</MenuItem>,
                  <MenuItem key="encaminhamento" value="Encaminhamento">Encaminhamento</MenuItem>,
                  <MenuItem key="abandono" value="Paciente abandonou">Paciente abandonou</MenuItem>
                ]}
                {tipoAcao === 'cancelar' && [
                  <MenuItem key="paciente" value="Solicitação do paciente">Solicitação do paciente</MenuItem>,
                  <MenuItem key="medico" value="Decisão médica">Decisão médica</MenuItem>,
                  <MenuItem key="sistema" value="Problema técnico">Problema técnico</MenuItem>
                ]}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Observações (opcional)"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adicione observações sobre esta ação..."
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDialogAberto(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmarAcao}
            variant="contained"
            disabled={!motivo.trim() || carregando}
          >
            {carregando ? 'Processando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
