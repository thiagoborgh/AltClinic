import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  LinearProgress,
  Fab,
  Menu,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Receipt,
  Payment,
  AccountBalance,
  Analytics,
  PieChart,
  Add,
  Search,
  FilterList,
  Download,
  Upload,
  QrCode,
  SmartToy,
  AutoAwesome,
  Notifications,
  CreditCard,
  Inventory,
  Description
} from '@mui/icons-material';

// Componentes do módulo financeiro
import PropostasOrcamentos from '../../components/financeiro/PropostasOrcamentos';
import ContasReceber from '../../components/financeiro/ContasReceber';
import ContasPagar from '../../components/financeiro/ContasPagar';
import FluxoCaixa from '../../components/financeiro/FluxoCaixa';
import RelatoriosFinanceiros from '../../components/financeiro/RelatoriosFinanceiros';
import PIXGenerator from '../../components/financeiro/PIXGenerator';
import ReconciliacaoBancaria from '../../components/financeiro/ReconciliacaoBancaria';
import ControleEstoque from '../../components/financeiro/ControleEstoque';

// Hook para dados financeiros
import { useFinanceiro } from '../../hooks/financeiro/useFinanceiro';

// Dados mock
import { mockFinanceiroData } from '../../data/financeiro/mockFinanceiroData';

const FinanceiroDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);
  
  // Hook personalizado para dados financeiros
  const {
    resumoFinanceiro,
    fluxoCaixa,
    contasReceber,
    contasPagar,
    propostas,
    loading,
    error,
    insightsIA
  } = useFinanceiro();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Cards de resumo financeiro
  const renderResumoCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* Saldo Atual */}
      <Grid item xs={12} md={3}>
        <Card sx={{ 
          height: '100%',
          background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
          color: 'white'
        }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" gutterBottom>
                  Saldo Atual
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  R$ {resumoFinanceiro?.saldoAtual?.toLocaleString('pt-BR') || '0,00'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  Atualizado em tempo real
                </Typography>
              </Box>
              <AccountBalance sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Receita Mensal */}
      <Grid item xs={12} md={3}>
        <Card sx={{ 
          height: '100%',
          background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
          color: 'white'
        }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" gutterBottom>
                  Receita Mensal
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  R$ {resumoFinanceiro?.receitaMensal?.toLocaleString('pt-BR') || '0,00'}
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2">
                    +{resumoFinanceiro?.variacaoReceita || 0}% vs mês anterior
                  </Typography>
                </Box>
              </Box>
              <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Despesas Mensais */}
      <Grid item xs={12} md={3}>
        <Card sx={{ 
          height: '100%',
          background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
          color: 'white'
        }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" gutterBottom>
                  Despesas Mensais
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  R$ {resumoFinanceiro?.despesasMensais?.toLocaleString('pt-BR') || '0,00'}
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <TrendingDown sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2">
                    {resumoFinanceiro?.variacaoDespesas || 0}% vs mês anterior
                  </Typography>
                </Box>
              </Box>
              <Payment sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Contas Pendentes */}
      <Grid item xs={12} md={3}>
        <Card sx={{ 
          height: '100%',
          background: 'linear-gradient(135deg, #F44336 0%, #EF5350 100%)',
          color: 'white'
        }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" gutterBottom>
                  ⚠️ Pendentes
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {resumoFinanceiro?.contasPendentes || 0}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  R$ {resumoFinanceiro?.valorPendente?.toLocaleString('pt-BR') || '0,00'}
                </Typography>
              </Box>
              <Receipt sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Insights de IA
  const renderInsightsIA = () => {
    if (!insightsIA?.length) return null;

    return (
      <Alert 
        severity="info" 
        icon={<AutoAwesome />}
        sx={{ mb: 3, background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)' }}
      >
        <Typography variant="h6" gutterBottom>
          Insights de IA - Otimização Financeira
        </Typography>
        {insightsIA.map((insight, index) => (
          <Typography key={index} variant="body2" sx={{ mb: 1 }}>
            • {insight}
          </Typography>
        ))}
      </Alert>
    );
  };

  // Barra de ferramentas
  const renderToolbar = () => (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
      <Typography variant="h4" fontWeight="bold">
        Módulo Financeiro SAAE
      </Typography>
      
      <Box display="flex" gap={2}>
        <TextField
          size="small"
          placeholder="Buscar transações..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        
        <Tooltip title="Gerar Relatório">
          <Button
            variant="outlined"
            startIcon={<Analytics />}
            onClick={(event) => setMenuAnchor(event.currentTarget)}
          >
            Relatórios
          </Button>
        </Tooltip>

        <Tooltip title="Reconciliação Bancária">
          <Button
            variant="outlined"
            startIcon={<Upload />}
            color="secondary"
          >
            Importar Extrato
          </Button>
        </Tooltip>

        <Tooltip title="Gerar PIX">
          <Button
            variant="contained"
            startIcon={<QrCode />}
            color="primary"
          >
            PIX
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>⏳ Carregando dados financeiros...</Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          ❌ Erro ao carregar módulo financeiro: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {renderToolbar()}
      {renderResumoCards()}
      {renderInsightsIA()}

      {/* Abas do Módulo Financeiro */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              label="Propostas/Orçamentos" 
              icon={<Description />} 
              iconPosition="start" 
            />
            <Tab 
              label="Contas a Receber" 
              icon={<TrendingUp />} 
              iconPosition="start" 
            />
            <Tab 
              label="Contas a Pagar" 
              icon={<TrendingDown />} 
              iconPosition="start" 
            />
            <Tab 
              label="Fluxo de Caixa" 
              icon={<Analytics />} 
              iconPosition="start" 
            />
            <Tab 
              label="Relatórios" 
              icon={<PieChart />} 
              iconPosition="start" 
            />
            <Tab 
              label="Reconciliação" 
              icon={<AccountBalance />} 
              iconPosition="start" 
            />
            <Tab 
              label="Estoque" 
              icon={<Inventory />} 
              iconPosition="start" 
            />
          </Tabs>
        </Box>

        <CardContent sx={{ minHeight: 600 }}>
          {tabValue === 0 && <PropostasOrcamentos searchTerm={searchTerm} />}
          {tabValue === 1 && <ContasReceber searchTerm={searchTerm} />}
          {tabValue === 2 && <ContasPagar searchTerm={searchTerm} />}
          {tabValue === 3 && <FluxoCaixa />}
          {tabValue === 4 && <RelatoriosFinanceiros />}
          {tabValue === 5 && <ReconciliacaoBancaria />}
          {tabValue === 6 && <ControleEstoque />}
        </CardContent>
      </Card>

      {/* FAB para ações rápidas */}
      <Fab 
        color="primary" 
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={(e) => setMenuAnchor(e.currentTarget)}
      >
        <Add />
      </Fab>

      {/* Menu de ações rápidas */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => setTabValue(0)}>
          <Description sx={{ mr: 1 }} /> Nova Proposta
        </MenuItem>
        <MenuItem onClick={() => setTabValue(1)}>
          <Receipt sx={{ mr: 1 }} /> Registrar Recebimento
        </MenuItem>
        <MenuItem onClick={() => setTabValue(2)}>
          <Payment sx={{ mr: 1 }} /> Nova Despesa
        </MenuItem>
        <MenuItem>
          <QrCode sx={{ mr: 1 }} /> Gerar PIX
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default FinanceiroDashboard;
