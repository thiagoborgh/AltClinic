import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar
} from '@mui/material';
import {
  Download,
  Refresh,
  TrendingUp,
  TrendingDown,
  Assessment,
  Business,
  AttachMoney,
  CalendarToday,
  Print
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { BarChart, Bar, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import dayjs from 'dayjs';

const Relatorios = () => {
  const [dateRange, setDateRange] = useState({
    inicio: dayjs().subtract(30, 'day'),
    fim: dayjs()
  });
  const [tipoRelatorio, setTipoRelatorio] = useState('geral');
  const [loading, setLoading] = useState(false);
  const [dados] = useState({
    resumo: {
      totalLicencas: 58,
      faturamentoTotal: 245000,
      crescimentoMensal: 12.5,
      ticketMedio: 4224
    },
    licencasPorStatus: [
      { status: 'Ativas', quantidade: 45, cor: '#4caf50' },
      { status: 'Vencendo', quantidade: 8, cor: '#ff9800' },
      { status: 'Vencidas', quantidade: 3, cor: '#f44336' },
      { status: 'Suspensas', quantidade: 2, cor: '#9e9e9e' }
    ],
    faturamentoPorMes: [
      { mes: 'Jan', valor: 35000, licencas: 40 },
      { mes: 'Fev', valor: 38000, licencas: 43 },
      { mes: 'Mar', valor: 42000, licencas: 48 },
      { mes: 'Abr', valor: 45000, licencas: 52 },
      { mes: 'Mai', valor: 48000, licencas: 55 },
      { mes: 'Jun', valor: 52000, licencas: 58 }
    ],
    topClientes: [
      { id: 'LIC001', cliente: 'Clínica São Paulo', plano: 'Premium', valor: 8500, vencimento: '2025-12-15' },
      { id: 'LIC003', cliente: 'Clínica Odonto Plus', plano: 'Premium', valor: 8500, vencimento: '2026-01-10' },
      { id: 'LIC005', cliente: 'Clínica Dermatologia', plano: 'Premium', valor: 8500, vencimento: '2025-11-25' },
      { id: 'LIC004', cliente: 'Centro Médico ABC', plano: 'Empresarial', valor: 12000, vencimento: '2025-08-30' },
      { id: 'LIC002', cliente: 'Consultório Dr. Silva', plano: 'Básico', valor: 3500, vencimento: '2025-09-20' }
    ],
    alertas: [
      { tipo: 'vencimento', descricao: '8 licenças vencem em 30 dias', prioridade: 'alta' },
      { tipo: 'pagamento', descricao: '3 licenças com pagamento em atraso', prioridade: 'alta' },
      { tipo: 'suporte', descricao: '12 tickets de suporte em aberto', prioridade: 'media' },
      { tipo: 'sistema', descricao: '2 clientes com problemas de integração', prioridade: 'media' }
    ]
  });

  useEffect(() => {
    generateReport();
  }, [dateRange, tipoRelatorio]);

  const generateReport = async () => {
    setLoading(true);
    try {
      // Simulação de chamada à API
      // const response = await axios.get('/relatorios', {
      //   params: {
      //     inicio: dateRange.inicio.format('YYYY-MM-DD'),
      //     fim: dateRange.fim.format('YYYY-MM-DD'),
      //     tipo: tipoRelatorio
      //   }
      // });
      // setDados(response.data);
      
      // Por enquanto, usando dados mock
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setLoading(false);
    }
  };

  const exportarRelatorio = (formato) => {
    // Implementar exportação
    console.log(`Exportando relatório em ${formato}`);
  };

  const StatCard = ({ title, value, icon, color, subtitle, trend }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="h2" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Box display="flex" alignItems="center" mt={1}>
                {trend === 'up' ? (
                  <TrendingUp color="success" fontSize="small" />
                ) : (
                  <TrendingDown color="error" fontSize="small" />
                )}
                <Typography variant="body2" color="textSecondary" ml={0.5}>
                  {subtitle}
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade) {
      case 'alta': return 'error';
      case 'media': return 'warning';
      case 'baixa': return 'success';
      default: return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Relatórios e Analytics
        </Typography>

        {/* Filtros */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Data Inicial"
                  value={dateRange.inicio}
                  onChange={(newValue) => setDateRange(prev => ({ ...prev, inicio: newValue }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Data Final"
                  value={dateRange.fim}
                  onChange={(newValue) => setDateRange(prev => ({ ...prev, fim: newValue }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Relatório</InputLabel>
                  <Select
                    value={tipoRelatorio}
                    label="Tipo de Relatório"
                    onChange={(e) => setTipoRelatorio(e.target.value)}
                  >
                    <MenuItem value="geral">Relatório Geral</MenuItem>
                    <MenuItem value="financeiro">Financeiro</MenuItem>
                    <MenuItem value="licencas">Licenças</MenuItem>
                    <MenuItem value="suporte">Suporte</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={generateReport}
                    disabled={loading}
                  >
                    Atualizar
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={() => exportarRelatorio('pdf')}
                  >
                    Exportar
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Cards de Resumo */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total de Licenças"
              value={dados.resumo.totalLicencas}
              icon={<Business />}
              color="primary.main"
              subtitle="+12% vs mês anterior"
              trend="up"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Faturamento Total"
              value={`R$ ${dados.resumo.faturamentoTotal.toLocaleString()}`}
              icon={<AttachMoney />}
              color="success.main"
              subtitle="+8.5% vs mês anterior"
              trend="up"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Crescimento Mensal"
              value={`${dados.resumo.crescimentoMensal}%`}
              icon={<TrendingUp />}
              color="info.main"
              subtitle="Meta: 10%"
              trend="up"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Ticket Médio"
              value={`R$ ${dados.resumo.ticketMedio.toLocaleString()}`}
              icon={<Assessment />}
              color="secondary.main"
              subtitle="+5.2% vs mês anterior"
              trend="up"
            />
          </Grid>
        </Grid>

        {/* Gráficos */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Faturamento e Crescimento (6 meses)
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={dados.faturamentoPorMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <RechartsTooltip 
                    formatter={(value, name) => [
                      name === 'valor' ? `R$ ${value.toLocaleString()}` : value,
                      name === 'valor' ? 'Faturamento' : 'Licenças'
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="valor" fill="#1976d2" name="Faturamento (R$)" />
                  <Line yAxisId="right" dataKey="licencas" stroke="#4caf50" strokeWidth={3} name="Licenças" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Status das Licenças
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={dados.licencasPorStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, quantidade }) => `${status}: ${quantidade}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="quantidade"
                  >
                    {dados.licencasPorStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Tabelas */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top Clientes por Faturamento
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Licença</TableCell>
                      <TableCell>Plano</TableCell>
                      <TableCell align="right">Valor Mensal</TableCell>
                      <TableCell>Vencimento</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dados.topClientes.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: 14 }}>
                              {cliente.cliente.charAt(0)}
                            </Avatar>
                            {cliente.cliente}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={cliente.id} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={cliente.plano} 
                            color={cliente.plano === 'Premium' ? 'primary' : cliente.plano === 'Empresarial' ? 'secondary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            R$ {cliente.valor.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {new Date(cliente.vencimento).toLocaleDateString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Alertas e Notificações
              </Typography>
              <Box>
                {dados.alertas.map((alerta, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent sx={{ py: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">
                          {alerta.descricao}
                        </Typography>
                        <Chip 
                          label={alerta.prioridade.toUpperCase()} 
                          color={getPrioridadeColor(alerta.prioridade)}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Ações Rápidas */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Ações Rápidas
          </Typography>
          <Grid container spacing={2}>
            <Grid item>
              <Button 
                variant="outlined" 
                startIcon={<Download />}
                onClick={() => exportarRelatorio('excel')}
              >
                Exportar Excel
              </Button>
            </Grid>
            <Grid item>
              <Button 
                variant="outlined" 
                startIcon={<Print />}
                onClick={() => window.print()}
              >
                Imprimir
              </Button>
            </Grid>
            <Grid item>
              <Button 
                variant="outlined" 
                startIcon={<CalendarToday />}
              >
                Agendar Relatório
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default Relatorios;
