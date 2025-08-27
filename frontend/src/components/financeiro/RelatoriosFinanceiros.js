import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
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
  TextField,
  MenuItem,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  GetApp,
  Print,
  Email,
  Assessment,
  ExpandMore,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart,
  DateRange,
  Receipt,
  AccountBalance,
  Business
} from '@mui/icons-material';
import { useFinanceiro } from '../../hooks/financeiro/useFinanceiro';
import moment from 'moment';

const RelatoriosFinanceiros = () => {
  const { contasReceber, contasPagar, propostas, iaInsights } = useFinanceiro();
  const [tipoRelatorio, setTipoRelatorio] = useState('dre');
  const [periodoInicio, setPeriodoInicio] = useState(moment().startOf('month').format('YYYY-MM-DD'));
  const [periodoFim, setPeriodoFim] = useState(moment().endOf('month').format('YYYY-MM-DD'));

  // Calcular DRE (Demonstração do Resultado do Exercício)
  const calcularDRE = () => {
    const inicio = moment(periodoInicio);
    const fim = moment(periodoFim);
    
    // Receitas
    const receitasRealizadas = contasReceber?.filter(conta => 
      conta.status === 'paga' && 
      moment(conta.dataPagamento).isBetween(inicio, fim, 'day', '[]')
    ) || [];
    
    const totalReceitas = receitasRealizadas.reduce((acc, conta) => acc + conta.valor, 0);
    
    // Custos e Despesas
    const despesasRealizadas = contasPagar?.filter(conta => 
      conta.status === 'paga' && 
      moment(conta.dataPagamento).isBetween(inicio, fim, 'day', '[]')
    ) || [];
    
    // Agrupar despesas por categoria
    const despesasPorCategoria = despesasRealizadas.reduce((acc, conta) => {
      acc[conta.categoria] = (acc[conta.categoria] || 0) + conta.valor;
      return acc;
    }, {});
    
    const totalDespesas = despesasRealizadas.reduce((acc, conta) => acc + conta.valor, 0);
    const lucroLiquido = totalReceitas - totalDespesas;
    const margemLucro = totalReceitas > 0 ? (lucroLiquido / totalReceitas) * 100 : 0;
    
    return {
      totalReceitas,
      totalDespesas,
      despesasPorCategoria,
      lucroLiquido,
      margemLucro,
      receitasRealizadas,
      despesasRealizadas
    };
  };

  // Relatório de Propostas
  const calcularRelatorioPropostas = () => {
    const inicio = moment(periodoInicio);
    const fim = moment(periodoFim);
    
    const propostasPeriodo = propostas?.filter(proposta => 
      moment(proposta.dataCreated).isBetween(inicio, fim, 'day', '[]')
    ) || [];
    
    const propostasAprovadas = propostasPeriodo.filter(p => p.status === 'aprovada');
    const propostasPendentes = propostasPeriodo.filter(p => p.status === 'pendente');
    const propostasRejeitadas = propostasPeriodo.filter(p => p.status === 'rejeitada');
    
    const valorTotalPropostas = propostasPeriodo.reduce((acc, p) => acc + p.valorFinal, 0);
    const valorAprovado = propostasAprovadas.reduce((acc, p) => acc + p.valorFinal, 0);
    const taxaAprovacao = propostasPeriodo.length > 0 ? (propostasAprovadas.length / propostasPeriodo.length) * 100 : 0;
    
    return {
      totalPropostas: propostasPeriodo.length,
      propostasAprovadas: propostasAprovadas.length,
      propostasPendentes: propostasPendentes.length,
      propostasRejeitadas: propostasRejeitadas.length,
      valorTotalPropostas,
      valorAprovado,
      taxaAprovacao,
      ticketMedio: propostasPeriodo.length > 0 ? valorTotalPropostas / propostasPeriodo.length : 0
    };
  };

  // Relatório de Inadimplência
  const calcularInadimplencia = () => {
    const contasVencidas = contasReceber?.filter(conta => 
      conta.status === 'pendente' && 
      moment(conta.dataVencimento).isBefore(moment(), 'day')
    ) || [];
    
    const totalVencido = contasVencidas.reduce((acc, conta) => acc + conta.valor, 0);
    const totalAReceber = contasReceber?.reduce((acc, conta) => acc + conta.valor, 0) || 0;
    const taxaInadimplencia = totalAReceber > 0 ? (totalVencido / totalAReceber) * 100 : 0;
    
    // Aging (análise por faixas de vencimento)
    const aging = {
      ate30: contasVencidas.filter(c => moment().diff(moment(c.dataVencimento), 'days') <= 30),
      de31a60: contasVencidas.filter(c => {
        const dias = moment().diff(moment(c.dataVencimento), 'days');
        return dias > 30 && dias <= 60;
      }),
      de61a90: contasVencidas.filter(c => {
        const dias = moment().diff(moment(c.dataVencimento), 'days');
        return dias > 60 && dias <= 90;
      }),
      acima90: contasVencidas.filter(c => moment().diff(moment(c.dataVencimento), 'days') > 90)
    };
    
    return {
      contasVencidas,
      totalVencido,
      taxaInadimplencia,
      aging
    };
  };

  const dre = calcularDRE();
  const relatorioPropostas = calcularRelatorioPropostas();
  const inadimplencia = calcularInadimplencia();

  const exportarRelatorio = (tipo) => {
    // Simulação de exportação
    alert(`📄 Exportando relatório ${tipo} em PDF...`);
  };

  const enviarPorEmail = () => {
    alert('📧 Enviando relatório por e-mail...');
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          📊 Relatórios Financeiros
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            startIcon={<GetApp />}
            onClick={() => exportarRelatorio(tipoRelatorio)}
            variant="outlined"
          >
            Exportar PDF
          </Button>
          <Button
            startIcon={<Print />}
            variant="outlined"
          >
            Imprimir
          </Button>
          <Button
            startIcon={<Email />}
            onClick={enviarPorEmail}
            variant="outlined"
          >
            Enviar Email
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Tipo de Relatório"
                select
                value={tipoRelatorio}
                onChange={(e) => setTipoRelatorio(e.target.value)}
              >
                <MenuItem value="dre">DRE - Demonstração de Resultado</MenuItem>
                <MenuItem value="propostas">Relatório de Propostas</MenuItem>
                <MenuItem value="inadimplencia">Análise de Inadimplência</MenuItem>
                <MenuItem value="fluxo">Fluxo de Caixa</MenuItem>
                <MenuItem value="comparativo">Comparativo Mensal</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Data Início"
                type="date"
                value={periodoInicio}
                onChange={(e) => setPeriodoInicio(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Data Fim"
                type="date"
                value={periodoFim}
                onChange={(e) => setPeriodoFim(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Assessment />}
                size="large"
              >
                Gerar Relatório
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Insights da IA */}
      {iaInsights && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🤖 Insights da IA Financeira
          </Typography>
          <Typography variant="body2">
            {iaInsights.analiseFluxoCaixa}
          </Typography>
        </Alert>
      )}

      {/* DRE - Demonstração do Resultado */}
      {tipoRelatorio === 'dre' && (
        <Grid container spacing={3}>
          {/* Resumo Executivo */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📈 Resumo Executivo - DRE
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <Card variant="outlined" sx={{ backgroundColor: 'success.light', color: 'white' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <TrendingUp fontSize="large" />
                        <Typography variant="h5" fontWeight="bold">
                          R$ {dre.totalReceitas.toLocaleString('pt-BR')}
                        </Typography>
                        <Typography variant="body2">Receitas</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card variant="outlined" sx={{ backgroundColor: 'error.light', color: 'white' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <TrendingDown fontSize="large" />
                        <Typography variant="h5" fontWeight="bold">
                          R$ {dre.totalDespesas.toLocaleString('pt-BR')}
                        </Typography>
                        <Typography variant="body2">Despesas</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card variant="outlined" sx={{ 
                      backgroundColor: dre.lucroLiquido >= 0 ? 'success.main' : 'error.main', 
                      color: 'white' 
                    }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <AccountBalance fontSize="large" />
                        <Typography variant="h5" fontWeight="bold">
                          R$ {dre.lucroLiquido.toLocaleString('pt-BR')}
                        </Typography>
                        <Typography variant="body2">Lucro Líquido</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card variant="outlined" sx={{ backgroundColor: 'info.main', color: 'white' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Assessment fontSize="large" />
                        <Typography variant="h5" fontWeight="bold">
                          {dre.margemLucro.toFixed(1)}%
                        </Typography>
                        <Typography variant="body2">Margem de Lucro</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Detalhamento DRE */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="success.main">
                  💰 Receitas Detalhadas
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Data</TableCell>
                        <TableCell>Cliente</TableCell>
                        <TableCell>Descrição</TableCell>
                        <TableCell align="right">Valor</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dre.receitasRealizadas.slice(0, 10).map((receita, index) => (
                        <TableRow key={index}>
                          <TableCell>{moment(receita.dataPagamento).format('DD/MM')}</TableCell>
                          <TableCell>{receita.cliente}</TableCell>
                          <TableCell>{receita.descricao}</TableCell>
                          <TableCell align="right">
                            R$ {receita.valor.toLocaleString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="error.main">
                  📋 Despesas por Categoria
                </Typography>
                {Object.entries(dre.despesasPorCategoria).map(([categoria, valor]) => (
                  <Box key={categoria} sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2">{categoria}</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        R$ {valor.toLocaleString('pt-BR')}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(valor / dre.totalDespesas) * 100} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {((valor / dre.totalDespesas) * 100).toFixed(1)}% do total
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Relatório de Propostas */}
      {tipoRelatorio === 'propostas' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  💼 Análise de Propostas
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={2}>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      {relatorioPropostas.totalPropostas}
                    </Typography>
                    <Typography variant="body2">Total de Propostas</Typography>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {relatorioPropostas.propostasAprovadas}
                    </Typography>
                    <Typography variant="body2">Aprovadas</Typography>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      {relatorioPropostas.propostasPendentes}
                    </Typography>
                    <Typography variant="body2">Pendentes</Typography>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Typography variant="h4" color="error.main" fontWeight="bold">
                      {relatorioPropostas.propostasRejeitadas}
                    </Typography>
                    <Typography variant="body2">Rejeitadas</Typography>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {relatorioPropostas.taxaAprovacao.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2">Taxa de Aprovação</Typography>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Typography variant="h4" color="secondary.main" fontWeight="bold">
                      R$ {relatorioPropostas.ticketMedio.toLocaleString('pt-BR')}
                    </Typography>
                    <Typography variant="body2">Ticket Médio</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Análise de Inadimplência */}
      {tipoRelatorio === 'inadimplencia' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Alert severity="warning">
              Taxa de Inadimplência: {inadimplencia.taxaInadimplencia.toFixed(2)}% 
              (R$ {inadimplencia.totalVencido.toLocaleString('pt-BR')} em atraso)
            </Alert>
          </Grid>
          
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📊 Aging de Recebíveis
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <Card variant="outlined" sx={{ backgroundColor: 'warning.light', color: 'white' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold">
                          {inadimplencia.aging.ate30.length}
                        </Typography>
                        <Typography variant="body2">Até 30 dias</Typography>
                        <Typography variant="caption">
                          R$ {inadimplencia.aging.ate30.reduce((acc, c) => acc + c.valor, 0).toLocaleString('pt-BR')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card variant="outlined" sx={{ backgroundColor: 'warning.main', color: 'white' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold">
                          {inadimplencia.aging.de31a60.length}
                        </Typography>
                        <Typography variant="body2">31 a 60 dias</Typography>
                        <Typography variant="caption">
                          R$ {inadimplencia.aging.de31a60.reduce((acc, c) => acc + c.valor, 0).toLocaleString('pt-BR')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card variant="outlined" sx={{ backgroundColor: 'error.light', color: 'white' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold">
                          {inadimplencia.aging.de61a90.length}
                        </Typography>
                        <Typography variant="body2">61 a 90 dias</Typography>
                        <Typography variant="caption">
                          R$ {inadimplencia.aging.de61a90.reduce((acc, c) => acc + c.valor, 0).toLocaleString('pt-BR')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card variant="outlined" sx={{ backgroundColor: 'error.main', color: 'white' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold">
                          {inadimplencia.aging.acima90.length}
                        </Typography>
                        <Typography variant="body2">Acima 90 dias</Typography>
                        <Typography variant="caption">
                          R$ {inadimplencia.aging.acima90.reduce((acc, c) => acc + c.valor, 0).toLocaleString('pt-BR')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Accordion com Detalhes Adicionais */}
      <Box sx={{ mt: 3 }}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              📋 Configurações de Relatório
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Formato de Exportação
                </Typography>
                <TextField
                  fullWidth
                  select
                  defaultValue="pdf"
                  size="small"
                >
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="excel">Excel</MenuItem>
                  <MenuItem value="csv">CSV</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Incluir Gráficos
                </Typography>
                <TextField
                  fullWidth
                  select
                  defaultValue="sim"
                  size="small"
                >
                  <MenuItem value="sim">Sim</MenuItem>
                  <MenuItem value="nao">Não</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
};

export default RelatoriosFinanceiros;
