import React, { useState, useEffect, useCallback } from 'react';
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
  Tabs,
  Tab
} from '@mui/material';
import {
  People,
  TrendingUp,
  Campaign,
  Email,
  WhatsApp,
  BarChart,
  PersonAdd
} from '@mui/icons-material';
import axios from 'axios';

const CRM = () => {
  const [tabValue, setTabValue] = useState(0);
  const [dadosCRM, setDadosCRM] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState('');

  const fetchDadosCRM = useCallback(async () => {
    try {
      setLoading(true);
      let endpoint = '';

      switch (tabValue) {
        case 0:
          endpoint = '/crm/relatorios?tipo=inativos';
          break;
        case 1:
          endpoint = '/crm/relatorios?tipo=ativos';
          break;
        case 2:
          endpoint = '/crm/relatorios?tipo=novos';
          break;
        default:
          endpoint = '/crm/relatorios?tipo=geral';
      }

      const response = await axios.get(endpoint);
      if (response.data.success) {
        setDadosCRM(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados CRM:', error);
    } finally {
      setLoading(false);
    }
  }, [tabValue]);

  useEffect(() => {
    fetchDadosCRM();
  }, [fetchDadosCRM]);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await axios.get('/api/tenants/admin/list');
      if (response.data.success) {
        setTenants(response.data.tenants);
      }
    } catch (error) {
      console.error('Erro ao carregar tenants:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (type) => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTenant('');
  };

  const handleSendCampaign = async () => {
    try {
      const response = await axios.post('/api/crm/campaign', {
        tenantId: selectedTenant,
        tipo: 'reativacao'
      });

      if (response.data.success) {
        handleCloseDialog();
        // Mostrar mensagem de sucesso
      }
    } catch (error) {
      console.error('Erro ao enviar campanha:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Carregando dados do CRM...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        🎯 Centro de Relacionamento com o Cliente (CRM)
      </Typography>

      {/* Cards de Resumo */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total de Clientes
                  </Typography>
                  <Typography variant="h5">
                    {dadosCRM?.totalClientes || 0}
                  </Typography>
                </Box>
                <People color="primary" sx={{ fontSize: 40 }} />
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
                    Clientes Ativos
                  </Typography>
                  <Typography variant="h5">
                    {dadosCRM?.clientesAtivos || 0}
                  </Typography>
                </Box>
                <TrendingUp color="success" sx={{ fontSize: 40 }} />
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
                    Campanhas Enviadas
                  </Typography>
                  <Typography variant="h5">
                    {dadosCRM?.campanhasEnviadas || 0}
                  </Typography>
                </Box>
                <Campaign color="secondary" sx={{ fontSize: 40 }} />
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
                    Taxa de Conversão
                  </Typography>
                  <Typography variant="h5">
                    {dadosCRM?.taxaConversao || '0'}%
                  </Typography>
                </Box>
                <BarChart color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs para diferentes segmentos */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Clientes Inativos" />
              <Tab label="Clientes Ativos" />
              <Tab label="Novos Clientes" />
              <Tab label="Relatório Geral" />
            </Tabs>
          </Box>

          {/* Conteúdo das tabs */}
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom color="error">
                🚨 Clientes Inativos (90+ dias sem agendamento)
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Estes clientes podem precisar de campanhas de reativação.
              </Typography>

              {dadosCRM?.inativos?.map((cliente, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6">{cliente.nome}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {cliente.email} • {cliente.telefone}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Último agendamento: {cliente.ultimoAgendamento}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        <Chip
                          label={`${cliente.diasInativo} dias inativo`}
                          color="error"
                          size="small"
                        />
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<WhatsApp />}
                        >
                          WhatsApp
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Email />}
                        >
                          Email
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom color="success">
                ✅ Clientes Ativos
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Clientes que agendaram nos últimos 30 dias.
              </Typography>
              {/* Lista de clientes ativos */}
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom color="warning">
                🆕 Novos Clientes
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Clientes que se cadastraram nos últimos 30 dias.
              </Typography>
              {/* Lista de novos clientes */}
            </Box>
          )}

          {tabValue === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                📊 Relatório Geral do CRM
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6">Métricas de Engajamento</Typography>
                      <Typography>Taxa de abertura de emails: {dadosCRM?.metricas?.taxaAbertura || '0'}%</Typography>
                      <Typography>Taxa de clique: {dadosCRM?.metricas?.taxaClique || '0'}%</Typography>
                      <Typography>Resposta WhatsApp: {dadosCRM?.metricas?.respostaWhatsApp || '0'}%</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6">Segmentação</Typography>
                      <Typography>Clientes VIP: {dadosCRM?.segmentacao?.vip || 0}</Typography>
                      <Typography>Clientes Regulares: {dadosCRM?.segmentacao?.regulares || 0}</Typography>
                      <Typography>Clientes Ocasional: {dadosCRM?.segmentacao?.ocasionais || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Ações de CRM */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ⚡ Ações de CRM
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<Campaign />}
              onClick={() => handleOpenDialog('campanha')}
            >
              Criar Campanha
            </Button>
            <Button
              variant="outlined"
              startIcon={<Email />}
            >
              Enviar Newsletter
            </Button>
            <Button
              variant="outlined"
              startIcon={<PersonAdd />}
            >
              Importar Contatos
            </Button>
            <Button
              variant="outlined"
              startIcon={<BarChart />}
            >
              Relatórios Avançados
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Dialog para campanhas */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Criar Campanha de Reativação</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Selecionar Tenant</InputLabel>
            <Select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              label="Selecionar Tenant"
            >
              {tenants.map((tenant) => (
                <MenuItem key={tenant.id} value={tenant.id}>
                  {tenant.nome} - {tenant.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Mensagem da Campanha"
            multiline
            rows={4}
            sx={{ mt: 2 }}
            defaultValue="Olá! Sentimos sua falta na clínica. Que tal agendar uma consulta para cuidar da sua pele?"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSendCampaign} variant="contained">
            Enviar Campanha
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CRM;
