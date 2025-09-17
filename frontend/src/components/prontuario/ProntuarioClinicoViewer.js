import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Tooltip,
  Avatar,
  Grid,
  Button
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Assignment as TimelineIcon,
  Assessment as AssessmentIcon,
  Description as DescriptionIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';
import { useProntuario } from '../../hooks/useProntuario';
import AnamneseViewer from './AnamneseViewer';
import TimelinePaciente from './TimelinePaciente';
import PlanoDeTratamento from './PlanoDeTratamento';
import ResultadosAnalises from './ResultadosAnalises';
import ComunicacaoHistorico from './ComunicacaoHistorico';
import NovoAtendimentoModal from './NovoAtendimentoModal';
import AtendimentoControls from './AtendimentoControls';

// Componente principal do Prontuário Clínico
const ProntuarioClinicoViewer = ({ pacienteId, onClose }) => {
  const {
    prontuario,
    paciente,
    timeline,
    loading,
    error,
    analises,
    gerarRelatorio,
    clearError
  } = useProntuario(pacienteId);

  const [tabAtiva, setTabAtiva] = useState(0);
  const [modalAtendimento, setModalAtendimento] = useState(false);
  const [atendimento, setAtendimento] = useState(null);
  const [tempoAtendimento, setTempoAtendimento] = useState(0);
  const [cronometroAtivo, setCronometroAtivo] = useState(false);

  // Auto-iniciar atendimento quando o componente carrega
  useEffect(() => {
    if (paciente && !atendimento) {
      const novoAtendimento = {
        id: Date.now(),
        pacienteId: pacienteId,
        status: 'ativo',
        dataInicio: new Date().toISOString(),
        especialidade: 'Geral'
      };
      setAtendimento(novoAtendimento);
      setCronometroAtivo(true);
    }
  }, [paciente, pacienteId, atendimento]);

  // Cronômetro do atendimento
  useEffect(() => {
    let interval;
    if (cronometroAtivo && atendimento && atendimento.status === 'ativo') {
      interval = setInterval(() => {
        const inicio = new Date(atendimento.dataInicio);
        const agora = new Date();
        const diferenca = Math.floor((agora - inicio) / 1000); // em segundos
        setTempoAtendimento(diferenca);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cronometroAtivo, atendimento]);

  // Formatar tempo do cronômetro
  const formatarTempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  // Handler para mudanças no atendimento
  const handleAtualizarDados = (novoAtendimento) => {
    setAtendimento(novoAtendimento);
    if (novoAtendimento?.status === 'ativo') {
      setCronometroAtivo(true);
    } else {
      setCronometroAtivo(false);
    }
  };

  // Abas do prontuário
  const abas = [
    { label: 'Timeline', icon: <TimelineIcon />, component: 'timeline' },
    { label: 'Anamnese', icon: <DescriptionIcon />, component: 'anamnese' },
    { label: 'Plano de Tratamento', icon: <AssessmentIcon />, component: 'plano' },
    { label: 'Análises & Resultados', icon: <AssessmentIcon />, component: 'resultados' },
    { label: 'Comunicação', icon: <ShareIcon />, component: 'comunicacao' }
  ];

  // Calcular estatísticas rápidas
  const estatisticas = {
    totalAtendimentos: timeline?.length || 0,
    ultimoAtendimento: timeline?.[0]?.data,
    statusAtivo: prontuario?.metadata?.status === 'Ativo',
    numeroProtocolo: prontuario?.numeroProtocolo
  };

  const handleTabChange = (event, novaTab) => {
    setTabAtiva(novaTab);
  };

  const handleGerarRelatorio = async () => {
    await gerarRelatorio('completo');
  };

  const renderTabContent = () => {
    const abaAtual = abas[tabAtiva];
    
    switch (abaAtual.component) {
      case 'timeline':
        return (
          <TimelinePaciente
            timeline={timeline}
            pacienteId={pacienteId}
            onNovoAtendimento={() => setModalAtendimento(true)}
          />
        );
      
      case 'anamnese':
        return (
          <AnamneseViewer
            anamnese={prontuario?.anamnese}
            pacienteId={pacienteId}
            readonly={false}
          />
        );
        
      case 'plano':
        return (
          <PlanoDeTratamento
            planoTratamento={prontuario?.planoTratamento}
            pacienteId={pacienteId}
            readonly={false}
          />
        );
        
      case 'resultados':
        return (
          <ResultadosAnalises
            resultados={prontuario?.resultados}
            analises={analises}
            timeline={timeline}
            pacienteId={pacienteId}
          />
        );
        
      case 'comunicacao':
        return (
          <ComunicacaoHistorico
            comunicacao={prontuario?.comunicacao}
            pacienteId={pacienteId}
          />
        );
        
      default:
        return <Typography>Selecione uma aba</Typography>;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography>Carregando prontuário...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error" gutterBottom>
          Erro ao carregar prontuário: {error}
        </Typography>
        <Button onClick={clearError} variant="outlined">
          Tentar novamente
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header do Prontuário */}
      <Card sx={{ mb: 2 }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {paciente?.nomeCompleto?.charAt(0) || 'P'}
            </Avatar>
          }
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6">
                {paciente?.nomeCompleto || 'Paciente'}
              </Typography>
              <Chip
                icon={<BadgeIcon />}
                label={estatisticas.numeroProtocolo}
                size="small"
                variant="outlined"
              />
              <Chip
                label={estatisticas.statusAtivo ? 'Ativo' : 'Inativo'}
                size="small"
                color={estatisticas.statusAtivo ? 'success' : 'default'}
              />
              {atendimento && atendimento.status === 'ativo' && (
                <Chip
                  label={`⏱️ ${formatarTempo(tempoAtendimento)}`}
                  size="small"
                  color="primary"
                  variant="filled"
                  sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}
                />
              )}
            </Box>
          }
          subheader={
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Total de atendimentos:</strong> {estatisticas.totalAtendimentos}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Último atendimento:</strong>{' '}
                  {estatisticas.ultimoAtendimento
                    ? new Date(estatisticas.ultimoAtendimento).toLocaleDateString('pt-BR')
                    : 'Nenhum'
                  }
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  <strong>CPF:</strong> {paciente?.cpf || 'Não informado'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Telefone:</strong> {paciente?.telefone || 'Não informado'}
                </Typography>
              </Grid>
            </Grid>
          }
          action={
            <Box display="flex" gap={1} alignItems="center">
              {/* Controles de Atendimento */}
              <AtendimentoControls
                paciente={paciente}
                atendimentoAtivo={atendimento}
                onAtendimentoChange={handleAtualizarDados}
                size="small"
              />
              
              {/* Botões de Ação */}
              <Box display="flex" gap={1}>
                <Tooltip title="Gerar Relatório">
                  <IconButton onClick={handleGerarRelatorio}>
                    <PrintIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Editar Dados do Paciente">
                  <IconButton>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          }
        />
      </Card>

      {/* Abas de Navegação */}
      <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabAtiva}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2 }}
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

        {/* Conteúdo da Aba Ativa */}
        <CardContent sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
          {renderTabContent()}
        </CardContent>
      </Card>

      {/* Modal para Novo Atendimento */}
      <NovoAtendimentoModal
        open={modalAtendimento}
        onClose={() => setModalAtendimento(false)}
        pacienteId={pacienteId}
        paciente={paciente}
      />
    </Box>
  );
};

export default ProntuarioClinicoViewer;
