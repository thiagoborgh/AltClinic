import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  Collapse
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  AccessTime as TimerIcon,
  Pause as PausarIcon,
  Cancel as CancelarIcon,
  PlayArrow as ContinuarIcon,
  Stop as FinalizarIcon,
  Timeline as TimelineIcon,
  Description as DescriptionIcon,
  Assessment as AssessmentIcon,
  Photo as PhotoIcon,
  Share as ShareIcon
} from '@mui/icons-material';

// Importar componentes do prontuário
import { useProntuario } from '../../hooks/useProntuario';
import TimelinePaciente from '../pacientes/prontuario/TimelinePaciente';
import AnamneseViewer from '../pacientes/prontuario/AnamneseViewer';
import PlanoDeTratamento from '../pacientes/prontuario/PlanoDeTratamento';
import ImagemComparacaoViewer from '../pacientes/prontuario/ImagemComparacaoViewer';
import ComunicacaoHistorico from '../pacientes/prontuario/ComunicacaoHistorico';
import NovoAtendimentoModal from '../pacientes/prontuario/NovoAtendimentoModal';

const AtendimentoModal = ({ open, onClose, pacienteId, paciente }) => {
  const [tabAtiva, setTabAtiva] = useState(0);
  const [statusAtendimento, setStatusAtendimento] = useState('em_atendimento'); // em_atendimento, pausado, finalizado
  const [tempoInicio, setTempoInicio] = useState(new Date());
  const [tempoTotal, setTempoTotal] = useState(0);
  const [tempoPausado, setTempoPausado] = useState(0);
  const [pausas, setPausas] = useState([]);
  const [modalNovoAtendimento, setModalNovoAtendimento] = useState(false);
  
  const intervalRef = useRef(null);

  // Hook do prontuário
  const {
    prontuario,
    timeline,
    imagens,
    error,
    clearError,
    recarregarImagens
  } = useProntuario(pacienteId);

  // Abas do prontuário no modal de atendimento
  const abas = [
    { label: 'Timeline', icon: <TimelineIcon />, component: 'timeline' },
    { label: 'Anamnese', icon: <DescriptionIcon />, component: 'anamnese' },
    { label: 'Plano de Tratamento', icon: <AssessmentIcon />, component: 'plano' },
    { label: 'Imagens', icon: <PhotoIcon />, component: 'imagens' },
    { label: 'Comunicação', icon: <ShareIcon />, component: 'comunicacao' }
  ];

  // Função para formatar tempo em HH:MM:SS
  const formatarTempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  // Iniciar cronômetro quando modal abre
  useEffect(() => {
    if (open && statusAtendimento === 'em_atendimento') {
      setTempoInicio(new Date());
      intervalRef.current = setInterval(() => {
        const agora = new Date();
        const tempoDecorrido = Math.floor((agora - tempoInicio) / 1000) - tempoPausado;
        setTempoTotal(tempoDecorrido);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [open, statusAtendimento, tempoInicio, tempoPausado]);

  // Pausar atendimento
  const handlePausar = () => {
    if (statusAtendimento === 'em_atendimento') {
      clearInterval(intervalRef.current);
      const agora = new Date();
      setPausas(prev => [...prev, { inicio: agora, fim: null }]);
      setStatusAtendimento('pausado');
    }
  };

  // Continuar atendimento
  const handleContinuar = () => {
    if (statusAtendimento === 'pausado') {
      const agora = new Date();
      setPausas(prev => {
        const ultimaPausa = prev[prev.length - 1];
        if (ultimaPausa && !ultimaPausa.fim) {
          ultimaPausa.fim = agora;
          const tempoPausaAtual = Math.floor((agora - ultimaPausa.inicio) / 1000);
          setTempoPausado(prevTempo => prevTempo + tempoPausaAtual);
        }
        return [...prev];
      });
      setStatusAtendimento('em_atendimento');
    }
  };

  // Cancelar atendimento
  const handleCancelar = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setStatusAtendimento('cancelado');
    // Aqui você pode adicionar lógica para salvar dados do atendimento cancelado
    onClose();
  };

  // Finalizar atendimento
  const handleFinalizar = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setStatusAtendimento('finalizado');
    // Abrir modal para registrar dados do atendimento
    setModalNovoAtendimento(true);
  };

  // Limpar cronômetro ao fechar
  const handleClose = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    onClose();
  };

  const handleTabChange = (event, novaTab) => {
    setTabAtiva(novaTab);
  };

  // Renderizar conteúdo da aba ativa
  const renderConteudoAba = () => {
    const componente = abas[tabAtiva]?.component;

    switch (componente) {
      case 'timeline':
        return (
          <TimelinePaciente 
            timeline={timeline} 
            pacienteId={pacienteId}
            onNovoAtendimento={() => setModalNovoAtendimento(true)}
          />
        );
      case 'anamnese':
        return <AnamneseViewer prontuario={prontuario} pacienteId={pacienteId} />;
      case 'plano':
        return <PlanoDeTratamento prontuario={prontuario} pacienteId={pacienteId} />;
      case 'imagens':
        return (
          <ImagemComparacaoViewer 
            pacienteId={pacienteId} 
            imagens={imagens}
            onRecarregar={recarregarImagens}
          />
        );
      case 'comunicacao':
        return <ComunicacaoHistorico pacienteId={pacienteId} />;
      default:
        return <Typography>Conteúdo não disponível</Typography>;
    }
  };

  const getStatusColor = () => {
    switch (statusAtendimento) {
      case 'em_atendimento': return 'success';
      case 'pausado': return 'warning';
      case 'finalizado': return 'info';
      case 'cancelado': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = () => {
    switch (statusAtendimento) {
      case 'em_atendimento': return 'Em Atendimento';
      case 'pausado': return 'Pausado';
      case 'finalizado': return 'Finalizado';
      case 'cancelado': return 'Cancelado';
      default: return 'Pendente';
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh'
          }
        }}
      >
        {/* Header com cronômetro */}
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {paciente?.nomeCompleto || 'Atendimento em Andamento'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Prontuário Digital - Atendimento Ativo
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center" gap={2}>
              {/* Cronômetro */}
              <Card variant="outlined" sx={{ px: 2, py: 1 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <TimerIcon color="primary" />
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontFamily: 'monospace',
                      color: statusAtendimento === 'em_atendimento' ? 'success.main' : 'text.secondary'
                    }}
                  >
                    {formatarTempo(tempoTotal)}
                  </Typography>
                </Box>
              </Card>
              
              {/* Status */}
              <Chip
                label={getStatusLabel()}
                color={getStatusColor()}
                variant="filled"
              />
              
              <IconButton onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        {/* Controles de Atendimento */}
        <Box sx={{ px: 3, pb: 2 }}>
          <Card variant="outlined">
            <CardContent sx={{ py: 2 }}>
              <Box display="flex" justifyContent="center" gap={2}>
                {statusAtendimento === 'em_atendimento' && (
                  <>
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<PausarIcon />}
                      onClick={handlePausar}
                    >
                      Pausar
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<FinalizarIcon />}
                      onClick={handleFinalizar}
                    >
                      Finalizar Atendimento
                    </Button>
                  </>
                )}
                
                {statusAtendimento === 'pausado' && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<ContinuarIcon />}
                      onClick={handleContinuar}
                    >
                      Continuar
                    </Button>
                  </>
                )}
                
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelarIcon />}
                  onClick={handleCancelar}
                >
                  Cancelar
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Abas do Prontuário */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs 
            value={tabAtiva} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            {abas.map((aba, index) => (
              <Tab
                key={index}
                icon={aba.icon}
                label={aba.label}
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Conteúdo */}
        <DialogContent sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
              {error}
            </Alert>
          )}
          
          <Collapse in={statusAtendimento === 'pausado'}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Atendimento pausado. Clique em "Continuar" para retomar o cronômetro.
              </Typography>
            </Alert>
          </Collapse>

          {renderConteudoAba()}
        </DialogContent>
      </Dialog>

      {/* Modal para registrar dados do atendimento ao finalizar */}
      <NovoAtendimentoModal
        open={modalNovoAtendimento}
        onClose={() => {
          setModalNovoAtendimento(false);
          handleClose(); // Fechar o modal principal após salvar
        }}
        pacienteId={pacienteId}
        paciente={paciente}
        dadosIniciais={{
          data: tempoInicio,
          duracaoMinutos: Math.round(tempoTotal / 60),
          observacoes: `Atendimento realizado com duração de ${formatarTempo(tempoTotal)}${pausas.length > 0 ? `. Pausas: ${pausas.length}` : ''}`
        }}
      />
    </>
  );
};

export default AtendimentoModal;
