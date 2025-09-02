import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Grid,
  Avatar,
  Chip,
  Alert,
  Skeleton,
  Badge
} from '@mui/material';
import {
  Person as PersonIcon,
  Description as DescriptionIcon,
  Timeline as TimelineIcon,
  PhotoLibrary as PhotoIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  GetApp as ExportIcon,
  Warning as WarningIcon,
  PlayArrow as AtendimentoIcon,
  History as LogsIcon,
  Dashboard as MetricasIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import AnamneseTab from './AnamneseTab';
import EvolucaoMedidasTab from './EvolucaoMedidasTab';
import ImagensTab from './ImagensTab';
import HistoricoTab from './HistoricoTab';
import RelatoriosTab from './RelatoriosTab';
import ConfiguracoesTab from './ConfiguracoesTab';
import AtendimentoControls from './AtendimentoControls';
import LogsAtendimento from './LogsAtendimento';
import DashboardMetricas from './DashboardMetricas';
import useProntuarioCompleto from '../../hooks/useProntuarioCompleto';
import useAtendimento from '../../hooks/useAtendimento';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`prontuario-tabpanel-${index}`}
      aria-labelledby={`prontuario-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function ProntuarioCompleto({ pacienteId, onClose }) {
  const [tabValue, setTabValue] = useState(0);
  const [alertas, setAlertas] = useState([]);
  
  const {
    prontuario,
    carregando,
    erro,
    carregarProntuario,
    atualizarAnamnese,
    adicionarEvolucao,
    adicionarImagem,
    exportarRelatorio
  } = useProntuarioCompleto();

  const {
    atendimento,
    logs,
    buscarLogs,
    buscarMetricas,
    exportarLogs
  } = useAtendimento(pacienteId);

  useEffect(() => {
    if (pacienteId) {
      carregarProntuario(pacienteId);
    }
  }, [pacienteId, carregarProntuario]);

  // Verificar alertas clínicos
  useEffect(() => {
    const novosAlertas = [];
    
    if (prontuario?.anamnese?.alergias?.length > 0) {
      novosAlertas.push({
        tipo: 'warning',
        mensagem: `Paciente possui ${prontuario.anamnese.alergias.length} alergia(s) registrada(s)`,
        icon: <WarningIcon />
      });
    }

    if (atendimento?.status === 'em_atendimento') {
      novosAlertas.push({
        tipo: 'info',
        mensagem: 'Atendimento em andamento',
        icon: <AtendimentoIcon />
      });
    }

    setAlertas(novosAlertas);
  }, [prontuario, atendimento]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleVisualizarDetalhesLog = (log) => {
    // TODO: Implementar modal de detalhes do log
    console.log('Visualizar detalhes do log:', log);
  };

  const handleAtualizarDados = () => {
    if (pacienteId) {
      buscarLogs();
      buscarMetricas();
    }
  };

  const tabs = [
    { label: 'Atendimento', icon: <AtendimentoIcon />, badge: atendimento?.status === 'em_atendimento' },
    { label: 'Anamnese', icon: <DescriptionIcon /> },
    { label: 'Medidas', icon: <AssessmentIcon /> },
    { label: 'Imagens', icon: <PhotoIcon /> },
    { label: 'Histórico', icon: <TimelineIcon /> },
    { label: 'Logs', icon: <LogsIcon />, badge: logs?.length > 0 },
    { label: 'Métricas', icon: <MetricasIcon /> },
    { label: 'Relatórios', icon: <ExportIcon /> },
    { label: 'Configurações', icon: <SettingsIcon /> }
  ];

  if (carregando) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" width="100%" height={200} />
        <Skeleton variant="text" sx={{ mt: 2 }} />
        <Skeleton variant="text" />
      </Box>
    );
  }

  if (erro) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Erro ao carregar prontuário: {erro}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Header do Prontuário */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <Avatar sx={{ bgcolor: 'white', color: 'primary.main' }}>
              <PersonIcon />
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h5" gutterBottom>
              {prontuario?.paciente?.nome || 'Carregando...'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              ID: {prontuario?.paciente?.id} | 
              Idade: {prontuario?.paciente?.idade} anos |
              Último atendimento: {prontuario?.ultimoAtendimento ? 
                format(new Date(prontuario.ultimoAtendimento), 'dd/MM/yyyy', { locale: ptBR }) : 
                'Não registrado'
              }
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white' }}
              onClick={onClose}
            >
              Fechar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Alertas Clínicos */}
      {alertas.length > 0 && (
        <Box sx={{ px: 2, mb: 2 }}>
          {alertas.map((alerta, index) => (
            <Alert
              key={index}
              severity={alerta.tipo}
              icon={alerta.icon}
              sx={{ mb: 1 }}
            >
              {alerta.mensagem}
            </Alert>
          ))}
        </Box>
      )}

      {/* Tabs de Navegação */}
      <Paper sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="tabs do prontuário"
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              icon={tab.badge ? <Badge color="error" variant="dot">{tab.icon}</Badge> : tab.icon}
              label={tab.label}
              iconPosition="start"
              id={`prontuario-tab-${index}`}
              aria-controls={`prontuario-tabpanel-${index}`}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Conteúdo das Tabs */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {/* Aba Atendimento - Nova */}
        <TabPanel value={tabValue} index={0}>
          <AtendimentoControls
            pacienteId={pacienteId}
            atendimento={atendimento}
          />
        </TabPanel>

        {/* Aba Anamnese */}
        <TabPanel value={tabValue} index={1}>
          <AnamneseTab
            prontuario={prontuario}
            onAtualizarAnamnese={atualizarAnamnese}
          />
        </TabPanel>

        {/* Aba Medidas */}
        <TabPanel value={tabValue} index={2}>
          <EvolucaoMedidasTab
            prontuario={prontuario}
            onAdicionarEvolucao={adicionarEvolucao}
          />
        </TabPanel>

        {/* Aba Imagens */}
        <TabPanel value={tabValue} index={3}>
          <ImagensTab
            prontuario={prontuario}
            onAdicionarImagem={adicionarImagem}
          />
        </TabPanel>

        {/* Aba Histórico */}
        <TabPanel value={tabValue} index={4}>
          <HistoricoTab
            prontuario={prontuario}
          />
        </TabPanel>

        {/* Aba Logs - Nova */}
        <TabPanel value={tabValue} index={5}>
          <LogsAtendimento
            pacienteId={pacienteId}
            logs={logs}
            onExportarLogs={exportarLogs}
            onVisualizarDetalhes={handleVisualizarDetalhesLog}
          />
        </TabPanel>

        {/* Aba Métricas - Nova */}
        <TabPanel value={tabValue} index={6}>
          <DashboardMetricas
            pacienteId={pacienteId}
            logs={logs}
            onAtualizarDados={handleAtualizarDados}
          />
        </TabPanel>

        {/* Aba Relatórios */}
        <TabPanel value={tabValue} index={7}>
          <RelatoriosTab
            prontuario={prontuario}
            onExportar={exportarRelatorio}
          />
        </TabPanel>

        {/* Aba Configurações */}
        <TabPanel value={tabValue} index={8}>
          <ConfiguracoesTab
            prontuario={prontuario}
          />
        </TabPanel>
      </Box>

      {/* Status de Sincronização */}
      <Paper 
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16, 
          p: 1, 
          bgcolor: 'success.main', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Chip 
          size="small" 
          label="Sincronizado" 
          sx={{ bgcolor: 'white', color: 'success.main' }}
        />
      </Paper>
    </Box>
  );
}
