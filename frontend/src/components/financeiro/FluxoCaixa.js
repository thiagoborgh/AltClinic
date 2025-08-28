import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  DateRange,
  Insights,
  BarChart,
  Schedule
} from '@mui/icons-material';
import { useFinanceiro } from '../../hooks/financeiro/useFinanceiro';
import moment from 'moment';

const FluxoCaixa = () => {
  const [tabAtiva, setTabAtiva] = useState(0);
  const [periodoFiltro, setPeriodoFiltro] = useState('mes');
  const [dataInicio, setDataInicio] = useState(moment().startOf('month').format('YYYY-MM-DD'));
  const [dataFim, setDataFim] = useState(moment().endOf('month').format('YYYY-MM-DD'));
  const { contasReceber, contasPagar } = useFinanceiro();

  // Calcular dados do fluxo de caixa
  const calcularFluxo = () => {
    const inicio = moment(dataInicio);
    const fim = moment(dataFim);
    
    // Entradas (Contas a Receber pagas no período)
    const entradas = contasReceber?.filter(conta => 
      conta.status === 'paga' && 
      moment(conta.dataPagamento).isBetween(inicio, fim, 'day', '[]')
    ) || [];
    
    // Saídas (Contas a Pagar pagas no período)
    const saidas = contasPagar?.filter(conta => 
      conta.status === 'paga' && 
      moment(conta.dataPagamento).isBetween(inicio, fim, 'day', '[]')
    ) || [];
    
    const totalEntradas = entradas.reduce((acc, conta) => acc + conta.valor, 0);
    const totalSaidas = saidas.reduce((acc, conta) => acc + conta.valor, 0);
    const saldoLiquido = totalEntradas - totalSaidas;
    
    return {
      entradas,
      saidas,
      totalEntradas,
      totalSaidas,
      saldoLiquido
    };
  };

  const dados = calcularFluxo();

  // Projeção para próximos 30 dias
  const calcularProjecao = () => {
    const proximoMes = moment().add(30, 'days');
    
    const entradasPrevistas = contasReceber?.filter(conta => 
      conta.status === 'pendente' && 
      moment(conta.dataVencimento).isBetween(moment(), proximoMes, 'day', '[]')
    ) || [];
    
    const saidasPrevistas = contasPagar?.filter(conta => 
      conta.status === 'pendente' && 
      moment(conta.dataVencimento).isBetween(moment(), proximoMes, 'day', '[]')
    ) || [];
    
    const totalEntradasPrevistas = entradasPrevistas.reduce((acc, conta) => acc + conta.valor, 0);
    const totalSaidasPrevistas = saidasPrevistas.reduce((acc, conta) => acc + conta.valor, 0);
    const saldoProjetado = totalEntradasPrevistas - totalSaidasPrevistas;
    
    return {
      entradasPrevistas,
      saidasPrevistas,
      totalEntradasPrevistas,
      totalSaidasPrevistas,
      saldoProjetado
    };
  };

  const projecao = calcularProjecao();

  // Análise de tendências
  const analiseTendencia = () => {
    if (dados.saldoLiquido > 0) {
      return {
        tipo: 'positivo',
        mensagem: 'Fluxo de caixa positivo - situação saudável',
        cor: 'success',
        icone: <TrendingUp />
      };
    } else if (dados.saldoLiquido < 0) {
      return {
        tipo: 'negativo',
        mensagem: 'Fluxo de caixa negativo - atenção necessária',
        cor: 'error',
        icone: <TrendingDown />
      };
    } else {
      return {
        tipo: 'neutro',
        mensagem: 'Fluxo de caixa equilibrado',
        cor: 'warning',
        icone: <AccountBalance />
      };
    }
  };

  const tendencia = analiseTendencia();

  // Fluxo diário dos últimos 30 dias
  const calcularFluxoDiario = () => {
    const diasAnalise = [];
    
    for (let i = 29; i >= 0; i--) {
      const data = moment().subtract(i, 'days');
      
      const entradasDia = contasReceber?.filter(conta => 
        conta.status === 'paga' && 
        moment(conta.dataPagamento).isSame(data, 'day')
      ).reduce((acc, conta) => acc + conta.valor, 0) || 0;
      
      const saidasDia = contasPagar?.filter(conta => 
        conta.status === 'paga' && 
        moment(conta.dataPagamento).isSame(data, 'day')
      ).reduce((acc, conta) => acc + conta.valor, 0) || 0;
      
      diasAnalise.push({
        data: data.format('DD/MM'),
        entradas: entradasDia,
        saidas: saidasDia,
        saldo: entradasDia - saidasDia
      });
    }
    
    return diasAnalise;
  };

  const fluxoDiario = calcularFluxoDiario();

  const handleChangePeriodo = (periodo) => {
    setPeriodoFiltro(periodo);
    const hoje = moment();
    
    switch (periodo) {
      case 'semana':
        setDataInicio(hoje.startOf('week').format('YYYY-MM-DD'));
        setDataFim(hoje.endOf('week').format('YYYY-MM-DD'));
        break;
      case 'mes':
        setDataInicio(hoje.startOf('month').format('YYYY-MM-DD'));
        setDataFim(hoje.endOf('month').format('YYYY-MM-DD'));
        break;
      case 'trimestre':
        setDataInicio(hoje.startOf('quarter').format('YYYY-MM-DD'));
        setDataFim(hoje.endOf('quarter').format('YYYY-MM-DD'));
        break;
      case 'ano':
        setDataInicio(hoje.startOf('year').format('YYYY-MM-DD'));
        setDataFim(hoje.endOf('year').format('YYYY-MM-DD'));
        break;
      default:
        break;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Fluxo de Caixa
        </Typography>
        <Box display="flex" gap={2}>
          <TextField
            select
            size="small"
            value={periodoFiltro}
            onChange={(e) => handleChangePeriodo(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="semana">Esta Semana</MenuItem>
            <MenuItem value="mes">Este Mês</MenuItem>
            <MenuItem value="trimestre">Este Trimestre</MenuItem>
            <MenuItem value="ano">Este Ano</MenuItem>
            <MenuItem value="personalizado">Personalizado</MenuItem>
          </TextField>
          
          {periodoFiltro === 'personalizado' && (
            <>
              <TextField
                type="date"
                size="small"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="date"
                size="small"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}
        </Box>
      </Box>

      {/* Alerta de Tendência */}
      <Alert severity={tendencia.cor} icon={tendencia.icone} sx={{ mb: 3 }}>
        {tendencia.mensagem} - Período: {moment(dataInicio).format('DD/MM/YYYY')} a {moment(dataFim).format('DD/MM/YYYY')}
      </Alert>

      {/* Cards Principais */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: 'success.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp fontSize="large" sx={{ mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                R$ {dados.totalEntradas.toLocaleString('pt-BR')}
              </Typography>
              <Typography variant="body2">
                Entradas ({dados.entradas.length})
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: 'error.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingDown fontSize="large" sx={{ mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                R$ {dados.totalSaidas.toLocaleString('pt-BR')}
              </Typography>
              <Typography variant="body2">
                Saídas ({dados.saidas.length})
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            backgroundColor: dados.saldoLiquido >= 0 ? 'success.main' : 'error.main', 
            color: 'white' 
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <AccountBalance fontSize="large" sx={{ mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                R$ {dados.saldoLiquido.toLocaleString('pt-BR')}
              </Typography>
              <Typography variant="body2">
                Saldo Líquido
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            backgroundColor: projecao.saldoProjetado >= 0 ? 'info.main' : 'warning.main', 
            color: 'white' 
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Insights fontSize="large" sx={{ mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                R$ {projecao.saldoProjetado.toLocaleString('pt-BR')}
              </Typography>
              <Typography variant="body2">
                Projeção 30 dias
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs para diferentes visualizações */}
      <Card>
        <Tabs 
          value={tabAtiva} 
          onChange={(e, newValue) => setTabAtiva(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Resumo Período" icon={<BarChart />} />
          <Tab label="Fluxo Diário" icon={<DateRange />} />
          <Tab label="Projeção" icon={<Schedule />} />
        </Tabs>

        <CardContent>
          {/* Tab 0: Resumo do Período */}
          {tabAtiva === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Análise do Período Selecionado
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="success.main" fontWeight="bold" gutterBottom>
                    Entradas
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Data</TableCell>
                          <TableCell>Cliente</TableCell>
                          <TableCell>Valor</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dados.entradas.slice(0, 5).map((entrada, index) => (
                          <TableRow key={index}>
                            <TableCell>{moment(entrada.dataPagamento).format('DD/MM')}</TableCell>
                            <TableCell>{entrada.cliente}</TableCell>
                            <TableCell>R$ {entrada.valor.toLocaleString('pt-BR')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {dados.entradas.length > 5 && (
                    <Typography variant="caption" color="text.secondary">
                      ... e mais {dados.entradas.length - 5} entradas
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="error.main" fontWeight="bold" gutterBottom>
                    Saídas
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Data</TableCell>
                          <TableCell>Fornecedor</TableCell>
                          <TableCell>Valor</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dados.saidas.slice(0, 5).map((saida, index) => (
                          <TableRow key={index}>
                            <TableCell>{moment(saida.dataPagamento).format('DD/MM')}</TableCell>
                            <TableCell>{saida.fornecedor}</TableCell>
                            <TableCell>R$ {saida.valor.toLocaleString('pt-BR')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {dados.saidas.length > 5 && (
                    <Typography variant="caption" color="text.secondary">
                      ... e mais {dados.saidas.length - 5} saídas
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Tab 1: Fluxo Diário */}
          {tabAtiva === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Fluxo de Caixa Diário (Últimos 30 dias)
              </Typography>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Data</strong></TableCell>
                      <TableCell><strong>Entradas</strong></TableCell>
                      <TableCell><strong>Saídas</strong></TableCell>
                      <TableCell><strong>Saldo do Dia</strong></TableCell>
                      <TableCell><strong>Indicador</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fluxoDiario.map((dia, index) => (
                      <TableRow key={index}>
                        <TableCell>{dia.data}</TableCell>
                        <TableCell>
                          <Typography color="success.main" fontWeight="bold">
                            R$ {dia.entradas.toLocaleString('pt-BR')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography color="error.main" fontWeight="bold">
                            R$ {dia.saidas.toLocaleString('pt-BR')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            color={dia.saldo >= 0 ? 'success.main' : 'error.main'}
                            fontWeight="bold"
                          >
                            R$ {dia.saldo.toLocaleString('pt-BR')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <LinearProgress
                              variant="determinate"
                              value={dia.entradas > 0 ? Math.min((dia.entradas / Math.max(...fluxoDiario.map(d => d.entradas))) * 100, 100) : 0}
                              sx={{ width: 50, mr: 1 }}
                              color={dia.saldo >= 0 ? 'success' : 'error'}
                            />
                            <Chip
                              size="small"
                              label={dia.saldo >= 0 ? '↑' : '↓'}
                              color={dia.saldo >= 0 ? 'success' : 'error'}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Tab 2: Projeção */}
          {tabAtiva === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Projeção para os Próximos 30 dias
              </Typography>
              
              <Alert 
                severity={projecao.saldoProjetado >= 0 ? 'success' : 'warning'} 
                sx={{ mb: 3 }}
              >
                Projeção de saldo: R$ {projecao.saldoProjetado.toLocaleString('pt-BR')} 
                {projecao.saldoProjetado >= 0 ? ' (Positivo)' : ' (Negativo - Planejamento necessário)'}
              </Alert>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="success.main" fontWeight="bold" gutterBottom>
                    Entradas Previstas
                  </Typography>
                  <Typography variant="h5" color="success.main" fontWeight="bold" gutterBottom>
                    R$ {projecao.totalEntradasPrevistas.toLocaleString('pt-BR')}
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Vencimento</TableCell>
                          <TableCell>Cliente</TableCell>
                          <TableCell>Valor</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {projecao.entradasPrevistas.slice(0, 5).map((entrada, index) => (
                          <TableRow key={index}>
                            <TableCell>{moment(entrada.dataVencimento).format('DD/MM')}</TableCell>
                            <TableCell>{entrada.cliente}</TableCell>
                            <TableCell>R$ {entrada.valor.toLocaleString('pt-BR')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="error.main" fontWeight="bold" gutterBottom>
                    Saídas Previstas
                  </Typography>
                  <Typography variant="h5" color="error.main" fontWeight="bold" gutterBottom>
                    R$ {projecao.totalSaidasPrevistas.toLocaleString('pt-BR')}
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Vencimento</TableCell>
                          <TableCell>Fornecedor</TableCell>
                          <TableCell>Valor</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {projecao.saidasPrevistas.slice(0, 5).map((saida, index) => (
                          <TableRow key={index}>
                            <TableCell>{moment(saida.dataVencimento).format('DD/MM')}</TableCell>
                            <TableCell>{saida.fornecedor}</TableCell>
                            <TableCell>R$ {saida.valor.toLocaleString('pt-BR')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default FluxoCaixa;
