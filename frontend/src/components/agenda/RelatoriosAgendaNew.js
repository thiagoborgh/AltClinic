import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const RelatoriosAgenda = ({ insights = {} }) => {
  const dadosGrafico = [
    { nome: 'Confirmados', valor: insights.confirmados || 0 },
    { nome: 'Pendentes', valor: insights.noShows || 0 },
    { nome: 'Cancelados', valor: 2 }
  ];

  const COLORS = ['#4caf50', '#ff9800', '#f44336'];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Relatórios e Analytics
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status dos Agendamentos
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dadosGrafico}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ nome, valor }) => `${nome}: ${valor}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="valor"
                  >
                    {dadosGrafico.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Insights de IA
              </Typography>
              <List>
                {insights.alertasIA?.map((alerta, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={alerta} />
                  </ListItem>
                )) || (
                  <ListItem>
                    <ListItemText primary="Nenhum insight disponível" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Métricas Principais
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4">{insights.agendamentosHoje || 0}</Typography>
                    <Typography variant="body2">Agendamentos Hoje</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4">{insights.taxaOcupacao || 0}%</Typography>
                    <Typography variant="body2">Taxa de Ocupação</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4">{insights.confirmados || 0}</Typography>
                    <Typography variant="body2">Confirmados</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4">{insights.noShows || 0}</Typography>
                    <Typography variant="body2">No-Shows</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RelatoriosAgenda;
