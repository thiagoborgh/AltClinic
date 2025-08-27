import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  Schedule,
  AttachMoney,
  People,
  CheckCircle,
  Cancel,
  Close,
  FileDownload,
  Print
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { mockRelatoriosAgenda } from '../../data/mockAgenda';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`tabpanel-${index}`}
    aria-labelledby={`tab-${index}`}
    {...other}
  >
    {value === index && (
      <Box sx={{ p: 3 }}>
        {children}
      </Box>
    )}
  </div>
);

const RelatoriosAgenda = ({ open, onClose, agendamentos }) => {
  const [tabValue, setTabValue] = useState(0);
  const [periodo, setPeriodo] = useState('mes');

  // Calcular estatísticas baseadas nos agendamentos reais
  const estatisticas = useMemo(() => {
    if (!agendamentos || agendamentos.length === 0) {
      return mockRelatoriosAgenda.estatisticas;
    }

    const total = agendamentos.length;
    const confirmados = agendamentos.filter(a => a.status === 'confirmado').length;
    const cancelados = agendamentos.filter(a => a.status === 'cancelado').length;
    const concluidos = agendamentos.filter(a => a.status === 'concluido').length;
    
    const taxaConfirmacao = total > 0 ? Math.round((confirmados / total) * 100) : 0;
    const taxaCancelamento = total > 0 ? Math.round((cancelados / total) * 100) : 0;
    const taxaConclusao = total > 0 ? Math.round((concluidos / total) * 100) : 0;
    
    const receitaTotal = agendamentos
      .filter(a => a.status === 'concluido')
      .reduce((sum, a) => sum + (a.valor || 0), 0);

    return {
      totalAgendamentos: total,
      taxaConfirmacao,
      taxaCancelamento,
      taxaConclusao,
      receitaTotal,
      tempoMedioAtendimento: 65 // Mock
    };
  }, [agendamentos]);

  // Dados para gráficos
  const dadosGraficos = useMemo(() => {
    // Usar dados mock se não houver agendamentos suficientes
    if (!agendamentos || agendamentos.length < 5) {
      return {
        tendencias: mockRelatoriosAgenda.tendencias,
        statusDistribution: [
          { name: 'Confirmados', value: 45, color: '#4caf50' },
          { name: 'Pendentes', value: 25, color: '#ff9800' },
          { name: 'Cancelados', value: 15, color: '#f44336' },
          { name: 'Concluídos', value: 15, color: '#2196f3' }
        ],
        horariosPico: mockRelatoriosAgenda.horariosPico,
        especialidadesRanking: [
          { especialidade: 'Estética', agendamentos: 35, receita: 15000 },
          { especialidade: 'Fisioterapia', agendamentos: 28, receita: 8500 },
          { especialidade: 'Dermatologia', agendamentos: 22, receita: 12000 }
        ]
      };
    }

    // Processar dados reais
    const statusCounts = agendamentos.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      color: status === 'confirmado' ? '#4caf50' : 
             status === 'pendente' ? '#ff9800' :
             status === 'cancelado' ? '#f44336' : '#2196f3'
    }));

    return {
      tendencias: mockRelatoriosAgenda.tendencias, // Manter mock para tendências
      statusDistribution,
      horariosPico: mockRelatoriosAgenda.horariosPico,
      especialidadesRanking: [
        { especialidade: 'Estética', agendamentos: 35, receita: 15000 },
        { especialidade: 'Fisioterapia', agendamentos: 28, receita: 8500 },
        { especialidade: 'Dermatologia', agendamentos: 22, receita: 12000 }
      ]
    };
  }, [agendamentos]);

  const handleExportar = (formato) => {
    console.log(`Exportando relatório em ${formato}`);
    // Implementar exportação
  };

  const CardEstatistica = ({ titulo, valor, icone, tendencia, cor = 'primary' }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {titulo}
            </Typography>
            <Typography variant="h4" color={cor + '.main'}>
              {valor}
            </Typography>
            {tendencia && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {tendencia > 0 ? (
                  <TrendingUp color="success" sx={{ mr: 0.5 }} />
                ) : (
                  <TrendingDown color="error" sx={{ mr: 0.5 }} />
                )}
                <Typography variant="caption" color={tendencia > 0 ? 'success.main' : 'error.main'}>
                  {Math.abs(tendencia)}% vs mês anterior
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ color: cor + '.main' }}>
            {icone}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment />
          <Typography variant="h6">
            Relatórios e Insights da Agenda
          </Typography>
        </Box>
        <Box>
          <IconButton onClick={() => handleExportar('pdf')} title="Exportar PDF">
            <FileDownload />
          </IconButton>
          <IconButton onClick={() => handleExportar('print')} title="Imprimir">
            <Print />
          </IconButton>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Filtros */}
        <Box sx={{ mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={periodo}
              label="Período"
              onChange={(e) => setPeriodo(e.target.value)}
            >
              <MenuItem value="semana">Última Semana</MenuItem>
              <MenuItem value="mes">Último Mês</MenuItem>
              <MenuItem value="trimestre">Último Trimestre</MenuItem>
              <MenuItem value="ano">Último Ano</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Estatísticas Principais */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <CardEstatistica
              titulo="Total de Agendamentos"
              valor={estatisticas.totalAgendamentos}
              icone={<Schedule fontSize="large" />}
              tendencia={12}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CardEstatistica
              titulo="Taxa de Confirmação"
              valor={`${estatisticas.taxaConfirmacao}%`}
              icone={<CheckCircle fontSize="large" />}
              tendencia={5}
              cor="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CardEstatistica
              titulo="Receita Total"
              valor={`R$ ${estatisticas.receitaTotal.toLocaleString('pt-BR')}`}
              icone={<AttachMoney fontSize="large" />}
              tendencia={8}
              cor="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CardEstatistica
              titulo="Taxa de Cancelamento"
              valor={`${estatisticas.taxaCancelamento}%`}
              icone={<Cancel fontSize="large" />}
              tendencia={-3}
              cor="error"
            />
          </Grid>
        </Grid>

        {/* Tabs para diferentes tipos de relatório */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Tendências" />
            <Tab label="Status" />
            <Tab label="Horários" />
            <Tab label="Especialidades" />
          </Tabs>
        </Box>

        {/* Aba Tendências */}
        <TabPanel value={tabValue} index={0}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Evolução de Agendamentos e Receita
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dadosGraficos.tendencias}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="agendamentos"
                  stackId="1"
                  stroke="#2196f3"
                  fill="#2196f3"
                  fillOpacity={0.6}
                  name="Agendamentos"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="receita"
                  stroke="#4caf50"
                  strokeWidth={3}
                  name="Receita (R$)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </TabPanel>

        {/* Aba Status */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Distribuição por Status
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dadosGraficos.statusDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {dadosGraficos.statusDistribution.map((entry, index) => (
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
                  Detalhes por Status
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Quantidade</TableCell>
                        <TableCell align="right">Percentual</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dadosGraficos.statusDistribution.map((item) => (
                        <TableRow key={item.name}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  backgroundColor: item.color,
                                  borderRadius: '50%',
                                  mr: 1
                                }}
                              />
                              {item.name}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{item.value}</TableCell>
                          <TableCell align="right">
                            {((item.value / estatisticas.totalAgendamentos) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Aba Horários */}
        <TabPanel value={tabValue} index={2}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Horários de Pico - Ocupação por Horário
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGraficos.horariosPico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="horario" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="ocupacao" fill="#ff9800" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </TabPanel>

        {/* Aba Especialidades */}
        <TabPanel value={tabValue} index={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ranking por Especialidade
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Especialidade</TableCell>
                    <TableCell align="right">Agendamentos</TableCell>
                    <TableCell align="right">Receita</TableCell>
                    <TableCell align="right">Ticket Médio</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dadosGraficos.especialidadesRanking.map((esp, index) => (
                    <TableRow key={esp.especialidade}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              backgroundColor: 'primary.main',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.8rem',
                              mr: 2
                            }}
                          >
                            {index + 1}
                          </Box>
                          {esp.especialidade}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{esp.agendamentos}</TableCell>
                      <TableCell align="right">
                        R$ {esp.receita.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell align="right">
                        R$ {(esp.receita / esp.agendamentos).toLocaleString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RelatoriosAgenda;
