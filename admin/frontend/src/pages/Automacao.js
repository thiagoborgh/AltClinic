import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  PlayArrow,
  Settings,
  ExpandMore,
  Notifications,
  PersonAdd,
  CalendarToday,
  TrendingUp
} from '@mui/icons-material';
import axios from 'axios';

const Automacao = () => {
  const [automacoes, setAutomacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedAutomacao, setSelectedAutomacao] = useState(null);

  useEffect(() => {
    fetchAutomacoes();
    fetchTenants();
  }, []);

  const fetchAutomacoes = async () => {
    try {
      setLoading(true);
      // Buscar automações ativas
      const response = await axios.get('/automacao/list');
      if (response.data.success) {
        setAutomacoes(response.data.automacoes || []);
      }
    } catch (error) {
      console.error('Erro ao carregar automações:', error);
      // Dados mock para desenvolvimento
      setAutomacoes([
        {
          id: 1,
          nome: 'Boas-vindas para Novos Clientes',
          tipo: 'cadastro',
          status: 'ativo',
          tenantId: 'all',
          configuracao: {
            disparador: 'novo_cadastro',
            acoes: ['email', 'whatsapp'],
            mensagem: 'Bem-vindo à nossa clínica!'
          }
        },
        {
          id: 2,
          nome: 'Lembrete de Consulta',
          tipo: 'agendamento',
          status: 'ativo',
          tenantId: 'all',
          configuracao: {
            disparador: '24h_antes_consulta',
            acoes: ['whatsapp'],
            mensagem: 'Lembrete: Você tem consulta amanhã às 14h'
          }
        },
        {
          id: 3,
          nome: 'Reativação de Clientes Inativos',
          tipo: 'crm',
          status: 'inativo',
          tenantId: 'all',
          configuracao: {
            disparador: '90_dias_inativo',
            acoes: ['email', 'whatsapp'],
            mensagem: 'Sentimos sua falta! Que tal agendar uma consulta?'
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await axios.get('/tenants/admin/list');
      if (response.data.success) {
        setTenants(response.data.tenants);
      }
    } catch (error) {
      console.error('Erro ao carregar tenants:', error);
    }
  };

  const handleToggleAutomacao = async (automacaoId, status) => {
    try {
      const response = await axios.put(`/automacao/${automacaoId}/toggle`, {
        status: status ? 'ativo' : 'inativo'
      });

      if (response.data.success) {
        setAutomacoes(automacoes.map(auto =>
          auto.id === automacaoId
            ? { ...auto, status: status ? 'ativo' : 'inativo' }
            : auto
        ));
      }
    } catch (error) {
      console.error('Erro ao alterar status da automação:', error);
    }
  };

  const handleOpenDialog = (automacao = null) => {
    setSelectedAutomacao(automacao);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAutomacao(null);
    setSelectedTenant('');
  };

  const handleSaveAutomacao = async () => {
    try {
      const automacaoData = {
        tenantId: selectedTenant,
        nome: selectedAutomacao?.nome || 'Nova Automação',
        tipo: selectedAutomacao?.tipo || 'cadastro',
        status: 'ativo'
      };

      const response = selectedAutomacao
        ? await axios.put(`/automacao/${selectedAutomacao.id}`, automacaoData)
        : await axios.post('/automacao/create', automacaoData);

      if (response.data.success) {
        handleCloseDialog();
        fetchAutomacoes();
      }
    } catch (error) {
      console.error('Erro ao salvar automação:', error);
    }
  };

  const handleDispararAutomacao = async (automacaoId) => {
    try {
      const response = await axios.post('/automacao/disparar', {
        automacaoId,
        tenantId: selectedTenant
      });

      if (response.data.success) {
        console.log('Automação disparada com sucesso');
      }
    } catch (error) {
      console.error('Erro ao disparar automação:', error);
    }
  };

  const getStatusColor = (status) => {
    return status === 'ativo' ? 'success' : 'default';
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'cadastro': return <PersonAdd />;
      case 'agendamento': return <CalendarToday />;
      case 'crm': return <TrendingUp />;
      default: return <Settings />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Carregando automações...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        🤖 Centro de Automação
      </Typography>

      {/* Cards de Resumo */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Automações Ativas
                  </Typography>
                  <Typography variant="h5">
                    {automacoes.filter(a => a.status === 'ativo').length}
                  </Typography>
                </Box>
                <PlayArrow color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Disparos Hoje
                  </Typography>
                  <Typography variant="h5">
                    {automacoes.reduce((acc, auto) => acc + (auto.disparosHoje || 0), 0)}
                  </Typography>
                </Box>
                <Notifications color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Taxa de Sucesso
                  </Typography>
                  <Typography variant="h5">
                    85%
                  </Typography>
                </Box>
                <TrendingUp color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total de Automações
                  </Typography>
                  <Typography variant="h5">
                    {automacoes.length}
                  </Typography>
                </Box>
                <Settings color="secondary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de Automações */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6">Automações Configuradas</Typography>
            <Button
              variant="contained"
              startIcon={<Settings />}
              onClick={() => handleOpenDialog()}
            >
              Nova Automação
            </Button>
          </Box>

          {automacoes.map((automacao) => (
            <Accordion key={automacao.id} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" width="100%">
                  <Box sx={{ mr: 2 }}>
                    {getTipoIcon(automacao.tipo)}
                  </Box>
                  <Box flexGrow={1}>
                    <Typography variant="h6">{automacao.nome}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Tipo: {automacao.tipo} • Status: {automacao.status}
                    </Typography>
                  </Box>
                  <Chip
                    label={automacao.status.toUpperCase()}
                    color={getStatusColor(automacao.status)}
                    size="small"
                    sx={{ mr: 2 }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={automacao.status === 'ativo'}
                        onChange={(e) => handleToggleAutomacao(automacao.id, e.target.checked)}
                        color="primary"
                      />
                    }
                    label=""
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Configuração
                    </Typography>
                    <Typography variant="body2">
                      Disparador: {automacao.configuracao?.disparador || 'Não definido'}
                    </Typography>
                    <Typography variant="body2">
                      Ações: {automacao.configuracao?.acoes?.join(', ') || 'Nenhuma'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Mensagem
                    </Typography>
                    <Typography variant="body2">
                      {automacao.configuracao?.mensagem || 'Mensagem não definida'}
                    </Typography>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PlayArrow />}
                    onClick={() => handleDispararAutomacao(automacao.id)}
                  >
                    Disparar Agora
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Settings />}
                    onClick={() => handleOpenDialog(automacao)}
                  >
                    Editar
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>

      {/* Templates de Automação */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 Templates de Automação
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ cursor: 'pointer' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                    <PersonAdd color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Boas-vindas</Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Automação para novos clientes com email e WhatsApp de boas-vindas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ cursor: 'pointer' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                    <CalendarToday color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Lembretes</Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Lembretes automáticos de consultas por WhatsApp e email
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ cursor: 'pointer' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                    <TrendingUp color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6">Reativação</Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Campanhas de reativação para clientes inativos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Dialog para criar/editar automação */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedAutomacao ? 'Editar Automação' : 'Nova Automação'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome da Automação"
                defaultValue={selectedAutomacao?.nome || ''}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select defaultValue={selectedAutomacao?.tipo || 'cadastro'}>
                  <MenuItem value="cadastro">Cadastro</MenuItem>
                  <MenuItem value="agendamento">Agendamento</MenuItem>
                  <MenuItem value="crm">CRM</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Selecionar Tenant</InputLabel>
                <Select
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  label="Selecionar Tenant"
                >
                  <MenuItem value="all">Todos os Tenants</MenuItem>
                  {tenants.map((tenant) => (
                    <MenuItem key={tenant.id} value={tenant.id}>
                      {tenant.nome} - {tenant.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mensagem"
                multiline
                rows={3}
                defaultValue={selectedAutomacao?.configuracao?.mensagem || ''}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveAutomacao} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Automacao;
