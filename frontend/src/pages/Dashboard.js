import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper
} from '@mui/material';
import {
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';

const Dashboard = () => {
  const stats = [
    {
      title: 'Pacientes Ativos',
      value: '248',
      icon: PeopleIcon,
      color: 'primary',
      trend: '+12%'
    },
    {
      title: 'Consultas Hoje',
      value: '18',
      icon: CalendarIcon,
      color: 'success',
      trend: '+5%'
    },
    {
      title: 'Receita Mensal',
      value: 'R$ 45.280',
      icon: MoneyIcon,
      color: 'warning',
      trend: '+8%'
    },
    {
      title: 'Taxa de Crescimento',
      value: '23%',
      icon: TrendingIcon,
      color: 'info',
      trend: '+3%'
    }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bem-vindo ao Sistema de Atendimento de Estética e Emagrecimento
        </Typography>
      </Box>

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      backgroundColor: `${stat.color}.light`,
                      mr: 2
                    }}
                  >
                    <stat.icon sx={{ color: `${stat.color}.main` }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {stat.title}
                  </Typography>
                </Box>
                <Typography variant="h4" component="div" gutterBottom>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="success.main">
                  {stat.trend} vs mês anterior
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Área de Conteúdo Principal */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Visão Geral dos Atendimentos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gráficos e estatísticas dos atendimentos serão exibidos aqui.
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Próximos Agendamentos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lista dos próximos agendamentos do dia.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;