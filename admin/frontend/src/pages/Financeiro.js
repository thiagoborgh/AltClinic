import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  Receipt,
  CreditCard,
  AccountBalance,
  BarChart
} from '@mui/icons-material';
import axios from 'axios';

const Financeiro = () => {
  const [dadosFinanceiros, setDadosFinanceiros] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');

  useEffect(() => {
    fetchDadosFinanceiros();
    fetchTenants();
  }, []);

  const fetchDadosFinanceiros = async () => {
    try {
      setLoading(true);
      // Buscar dados financeiros agregados de todos os tenants
      const response = await axios.get('/financeiro/resumo');
      if (response.data.success) {
        setDadosFinanceiros(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
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

  const handleOpenDialog = (type, tenant = null) => {
    setDialogType(type);
    setSelectedTenant(tenant?.id || '');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTenant('');
    setDialogType('');
  };

  const handleSaveAction = async () => {
    try {
      let response;
      switch (dialogType) {
        case 'gerar-fatura':
          response = await axios.post(`/billing/invoice/${selectedTenant}`);
          break;
        case 'alterar-plano':
          response = await axios.put(`/tenants/admin/${selectedTenant}/change-plan`, {
            plano: 'professional' // exemplo
          });
          break;
        default:
          return;
      }

      if (response.data.success) {
        handleCloseDialog();
        fetchDadosFinanceiros();
      }
    } catch (error) {
      console.error('Erro ao salvar ação:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Carregando dados financeiros...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        💰 Gestão Financeira
      </Typography>

      {/* Cards de Resumo */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Receita Total
                  </Typography>
                  <Typography variant="h5">
                    R$ {dadosFinanceiros?.resumoFinanceiro?.receitaMensal?.toLocaleString('pt-BR') || '0,00'}
                  </Typography>
                </Box>
                <AttachMoney color="success" sx={{ fontSize: 40 }} />
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
                    Contas a Receber
                  </Typography>
                  <Typography variant="h5">
                    R$ {dadosFinanceiros?.resumoFinanceiro?.contasReceber?.toLocaleString('pt-BR') || '0,00'}
                  </Typography>
                </Box>
                <Receipt color="warning" sx={{ fontSize: 40 }} />
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
                    Lucro Mensal
                  </Typography>
                  <Typography variant="h5">
                    R$ {dadosFinanceiros?.resumoFinanceiro?.lucroMensal?.toLocaleString('pt-BR') || '0,00'}
                  </Typography>
                </Box>
                <TrendingUp color="primary" sx={{ fontSize: 40 }} />
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
                    Meta Mensal
                  </Typography>
                  <Typography variant="h5">
                    {dadosFinanceiros?.resumoFinanceiro?.percentualMeta?.toFixed(1) || '0'}%
                  </Typography>
                </Box>
                <BarChart color="secondary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Planos Disponíveis */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 Planos de Licenciamento
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="primary">Starter</Typography>
                  <Typography variant="h4">R$ 199<span style={{fontSize: '16px'}}>/mês</span></Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    • 3 usuários<br/>
                    • 500 pacientes<br/>
                    • WhatsApp Business<br/>
                    • Relatórios básicos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ border: '2px solid #1976d2' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" color="primary">Professional</Typography>
                    <Chip label="Mais Popular" color="primary" size="small" />
                  </Box>
                  <Typography variant="h4">R$ 399<span style={{fontSize: '16px'}}>/mês</span></Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    • 10 usuários<br/>
                    • 2.000 pacientes<br/>
                    • WhatsApp Business<br/>
                    • Telemedicina<br/>
                    • Relatórios avançados
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="primary">Enterprise</Typography>
                  <Typography variant="h4">R$ 799<span style={{fontSize: '16px'}}>/mês</span></Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    • Usuários ilimitados<br/>
                    • Pacientes ilimitados<br/>
                    • Todas as funcionalidades<br/>
                    • Suporte 24/7<br/>
                    • API completa
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ⚡ Ações Rápidas
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<Receipt />}
              onClick={() => handleOpenDialog('gerar-fatura')}
            >
              Gerar Fatura
            </Button>
            <Button
              variant="outlined"
              startIcon={<CreditCard />}
              onClick={() => handleOpenDialog('alterar-plano')}
            >
              Alterar Plano
            </Button>
            <Button
              variant="outlined"
              startIcon={<AccountBalance />}
            >
              Relatório Financeiro
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Dialog para ações */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'gerar-fatura' ? 'Gerar Fatura' : 'Alterar Plano'}
        </DialogTitle>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveAction} variant="contained">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Financeiro;
