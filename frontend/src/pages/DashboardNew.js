import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Container
} from '@mui/material';
import {
  CalendarMonth,
  People,
  AttachMoney,
  TrendingUp
} from '@mui/icons-material';

// Componentes personalizados
import MetricCard from '../components/common/MetricCard';
import RecentActivities from '../components/common/RecentActivities';
import NextAppointments from '../components/common/NextAppointments';
import AppointmentsRevenueChart from '../components/charts/AppointmentsRevenueChart';
import ProceduresChart from '../components/charts/ProceduresChart';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Hooks
import useDashboard from '../hooks/useDashboard';

const Dashboard = () => {
  const { loading, metrics, activities, appointments, chartData } = useDashboard();

  if (loading) {
    return <LoadingSpinner message="Carregando dashboard..." />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Saudação */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Olá! 👋
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Aqui um resumo da sua clínica hoje.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Métricas principais */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Agendamentos Hoje"
            value={metrics.todayAppointments.value}
            variation={metrics.todayAppointments.variation}
            icon={CalendarMonth}
            color="primary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Pacientes Ativos"
            value={metrics.activePatients.value}
            variation={metrics.activePatients.variation}
            icon={People}
            color="success"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Receita Mensal"
            value={metrics.monthlyRevenue.value}
            variation={metrics.monthlyRevenue.variation}
            icon={AttachMoney}
            color="warning"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Taxa de Ocupação"
            value={metrics.occupationRate.value}
            variation={metrics.occupationRate.variation}
            icon={TrendingUp}
            color="info"
          />
        </Grid>

        {/* Gráfico de linha - Agendamentos & Receita */}
        <Grid item xs={12} lg={8}>
          <AppointmentsRevenueChart data={chartData?.appointmentsRevenue} />
        </Grid>

        {/* Atividades Recentes */}
        <Grid item xs={12} lg={4}>
          <RecentActivities activities={activities} />
        </Grid>

        {/* Gráfico de pizza - Procedimentos */}
        <Grid item xs={12} md={6}>
          <ProceduresChart data={chartData?.procedures} />
        </Grid>

        {/* Próximos Agendamentos */}
        <Grid item xs={12} md={6}>
          <NextAppointments appointments={appointments} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
