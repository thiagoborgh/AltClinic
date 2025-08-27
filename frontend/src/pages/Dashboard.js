import React, { useState, useEffect } from 'react';
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

import { useAuthStore } from '../store/authStore';

// Dados de exemplo (substituir por dados reais da API)
const metricsData = [
  { name: 'Jan', agendamentos: 65, receita: 12000 },
  { name: 'Fev', agendamentos: 78, receita: 15000 },
  { name: 'Mar', agendamentos: 92, receita: 18000 },
  { name: 'Abr', agendamentos: 88, receita: 16500 },
  { name: 'Mai', agendamentos: 95, receita: 19000 },
  { name: 'Jun', agendamentos: 110, receita: 22000 },
];

const procedimentosData = [
  { name: 'Limpeza de Pele', value: 35, color: '#1976d2' },
  { name: 'Botox', value: 25, color: '#42a5f5' },
  { name: 'Preenchimento', value: 20, color: '#90caf9' },
  { name: 'Peeling', value: 15, color: '#bbdefb' },
  { name: 'Outros', value: 5, color: '#e3f2fd' },
];

const recentActivities = [
  {
    id: 1,
    type: 'agendamento',
    message: 'Nova consulta agendada - Maria Silva',
    time: '5 min atrás',
    icon: CalendarMonth,
    color: 'primary',
  },
  {
    id: 2,
    type: 'whatsapp',
    message: 'Mensagem WhatsApp - João Santos',
    time: '10 min atrás',
    icon: WhatsApp,
    color: 'success',
  },
  {
    id: 3,
    type: 'proposta',
    message: 'Proposta aprovada - R$ 1.200',
    time: '15 min atrás',
    icon: AttachMoney,
    color: 'warning',
  },
  {
    id: 4,
    type: 'paciente',
    message: 'Novo paciente cadastrado',
    time: '1 hora atrás',
    icon: Person,
    color: 'info',
  },
];

const MetricCard = ({ title, value, change, icon: Icon, color = 'primary' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1} mt={1}>
            {change > 0 ? (
              <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} />
            ) : (
              <TrendingDown sx={{ color: 'error.main', fontSize: 16 }} />
            )}
            <Typography
              variant="body2"
              color={change > 0 ? 'success.main' : 'error.main'}
              fontWeight="medium"
            >
              {Math.abs(change)}% vs mês anterior
            </Typography>
          </Stack>
        </Box>
        <Avatar
          sx={{
            bgcolor: `${color}.main`,
            width: 56,
            height: 56,
          }}
        >
          <Icon />
        </Avatar>
      </Stack>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useAuthStore();

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Olá, {user?.nome?.split(' ')[0]}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Aqui está um resumo da sua clínica hoje
        </Typography>
      </Box>

      {/* Métricas principais */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Agendamentos Hoje"
            value="12"
            change={8.5}
            icon={CalendarMonth}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Pacientes Ativos"
            value="248"
            change={12.3}
            icon={People}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Receita Mensal"
            value="R$ 22.5k"
            change={15.7}
            icon={AttachMoney}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Taxa de Ocupação"
            value="85%"
            change={-2.1}
            icon={Schedule}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Gráfico de Agendamentos */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight="bold">
                  Agendamentos & Receita
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip label="Últimos 6 meses" size="small" />
                </Stack>
              </Box>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="right" dataKey="receita" fill="#1976d2" opacity={0.3} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="agendamentos"
                      stroke="#1976d2"
                      strokeWidth={3}
                      dot={{ fill: '#1976d2', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Atividades Recentes */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Atividades Recentes
                </Typography>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>
              <List disablePadding>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem disablePadding>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: `${activity.color}.main`,
                            width: 32,
                            height: 32,
                          }}
                        >
                          <activity.icon fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.message}
                        secondary={activity.time}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && (
                      <Divider sx={{ my: 1 }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Procedimentos Populares */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                Procedimentos Mais Procurados
              </Typography>
              <Box height={250}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={procedimentosData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {procedimentosData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Stack spacing={1} mt={2}>
                {procedimentosData.map((item) => (
                  <Stack key={item.name} direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: item.color,
                        }}
                      />
                      <Typography variant="body2">{item.name}</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight="medium">
                      {item.value}%
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Próximos Agendamentos */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                Próximos Agendamentos
              </Typography>
              <Stack spacing={2}>
                {[
                  { nome: 'Maria Silva', procedimento: 'Limpeza de Pele', horario: '09:00', status: 'confirmado' },
                  { nome: 'João Santos', procedimento: 'Botox', horario: '10:30', status: 'pendente' },
                  { nome: 'Ana Costa', procedimento: 'Preenchimento', horario: '14:00', status: 'confirmado' },
                  { nome: 'Pedro Lima', procedimento: 'Peeling', horario: '15:30', status: 'reagendado' },
                ].map((agendamento, index) => (
                  <Paper key={index} sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {agendamento.nome}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {agendamento.procedimento}
                        </Typography>
                      </Box>
                      <Stack alignItems="flex-end" spacing={1}>
                        <Typography variant="body2" fontWeight="medium">
                          {agendamento.horario}
                        </Typography>
                        <Chip
                          label={agendamento.status}
                          size="small"
                          color={
                            agendamento.status === 'confirmado' ? 'success' :
                            agendamento.status === 'pendente' ? 'warning' : 'error'
                          }
                        />
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
