import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  Business,
  Settings,
  TrendingUp,
  Warning,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalLicencas: 0,
    licencasAtivas: 0,
    licencasVencendo: 0,
    licencasVencidas: 0,
    faturamentoMensal: 0,
    crescimentoMensal: 0
  });
  const [licencasRecentes, setLicencasRecentes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dados mock para gráficos
  const statusData = [
    { name: 'Ativas', value: 45, color: '#4caf50' },
    { name: 'Vencendo', value: 8, color: '#ff9800' },
    { name: 'Vencidas', value: 3, color: '#f44336' },
    { name: 'Suspensas', value: 2, color: '#9e9e9e' }
  ];

  const faturamentoData = [
    { mes: 'Jan', valor: 25000 },
    { mes: 'Fev', valor: 28000 },
    { mes: 'Mar', valor: 32000 },
    { mes: 'Abr', valor: 35000 },
    { mes: 'Mai', valor: 38000 },
    { mes: 'Jun', valor: 42000 }
  ];

  const crescimentoData = [
    { mes: 'Jan', licencas: 40 },
    { mes: 'Fev', licencas: 43 },
    { mes: 'Mar', licencas: 48 },
    { mes: 'Abr', licencas: 52 },
    { mes: 'Mai', licencas: 55 },
    { mes: 'Jun', licencas: 58 }
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // const response = await axios.get('/dashboard/stats');
        // setStats(response.data.stats);
        // setLicencasRecentes(response.data.licencasRecentes);
        
        // Dados mock por enquanto
        setStats({
          totalLicencas: 58,
          licencasAtivas: 45,
          licencasVencendo: 8,
          licencasVencidas: 3,
          faturamentoMensal: 42000,
          crescimentoMensal: 12.5
        });
        
        setLicencasRecentes([
          { id: 'LIC001', cliente: 'Clínica São Paulo', status: 'ativa', dataVencimento: '2025-12-15' },
          { id: 'LIC002', cliente: 'Consultório Dr. Silva', status: 'vencendo', dataVencimento: '2025-09-20' },
          { id: 'LIC003', cliente: 'Clínica Odonto Plus', status: 'ativa', dataVencimento: '2026-01-10' },
          { id: 'LIC004', cliente: 'Centro Médico ABC', status: 'vencida', dataVencimento: '2025-08-30' },
          { id: 'LIC005', cliente: 'Clínica Dermatologia', status: 'ativa', dataVencimento: '2025-11-25' }
        ]);
        
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon, color, subtitle }) => (
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
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'ativa': return 'success';
      case 'vencendo': return 'warning';
      case 'vencida': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ativa': return <CheckCircle />;
      case 'vencendo': return <Warning />;
      case 'vencida': return <ErrorIcon />;
      default: return <ErrorIcon />;
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard - Visão Geral
      </Typography>
      
      {/* Cards de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total de Licenças"
            value={stats.totalLicencas}
            icon={<Business />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Licenças Ativas"
            value={stats.licencasAtivas}
            icon={<CheckCircle />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Vencendo em 30 dias"
            value={stats.licencasVencendo}
            icon={<Warning />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Faturamento Mensal"
            value={`R$ ${stats.faturamentoMensal.toLocaleString()}`}
            icon={<TrendingUp />}
            color="info.main"
            subtitle={`+${stats.crescimentoMensal}% vs mês anterior`}
          />
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Status das Licenças
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Faturamento (6 meses)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={faturamentoData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${value.toLocaleString()}`, 'Faturamento']} />
                <Bar dataKey="valor" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Crescimento de Licenças */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Crescimento de Licenças
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={crescimentoData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="licencas" stroke="#4caf50" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Licenças Recentes */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Licenças Recentes
        </Typography>
        <Grid container spacing={2}>
          {licencasRecentes.map((licenca) => (
            <Grid item xs={12} md={6} lg={4} key={licenca.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="h6" color="primary">
                      {licenca.id}
                    </Typography>
                    <Chip
                      icon={getStatusIcon(licenca.status)}
                      label={licenca.status.toUpperCase()}
                      color={getStatusColor(licenca.status)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body1" gutterBottom>
                    {licenca.cliente}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vence em: {new Date(licenca.dataVencimento).toLocaleDateString('pt-BR')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default Dashboard;
