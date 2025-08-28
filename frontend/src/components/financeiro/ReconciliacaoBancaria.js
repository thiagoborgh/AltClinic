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
  Button,
  TextField,
  MenuItem,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  AccountBalance,
  Upload,
  CheckCircle,
  Warning,
  Error,
  ExpandMore,
  Sync,
  Download,
  CompareArrows
} from '@mui/icons-material';
import moment from 'moment';

const ReconciliacaoBancaria = () => {
  const [arquivo, setArquivo] = useState(null);
  const [contaBancaria, setContaBancaria] = useState('bradesco');
  const [periodo, setPeriodo] = useState('mes');
  const [modalConciliacaoOpen, setConciliacaoModalOpen] = useState(false);
  const [dadosConciliacao, setDadosConciliacao] = useState(null);

  // Dados simulados de extrato bancário
  const extratoSimulado = [
    {
      id: 1,
      data: '2024-01-15',
      descricao: 'PIX Recebido - João Silva',
      valor: 150.00,
      tipo: 'credito',
      conciliado: true,
      contaRelacionada: 'CONTA-001'
    },
    {
      id: 2,
      data: '2024-01-14',
      descricao: 'TED Fornecedor ABC',
      valor: -800.00,
      tipo: 'debito',
      conciliado: true,
      contaRelacionada: 'CONTA-002'
    },
    {
      id: 3,
      data: '2024-01-13',
      descricao: 'PIX Recebido - Maria Santos',
      valor: 200.00,
      tipo: 'credito',
      conciliado: false,
      contaRelacionada: null
    },
    {
      id: 4,
      data: '2024-01-12',
      descricao: 'Tarifa Bancária',
      valor: -12.90,
      tipo: 'debito',
      conciliado: false,
      contaRelacionada: null
    }
  ];

  // Dados simulados de movimentação interna
  const movimentacaoInterna = [
    {
      id: 'CONTA-003',
      data: '2024-01-13',
      cliente: 'Ana Costa',
      descricao: 'Consulta Dermatológica',
      valor: 200.00,
      tipo: 'recebimento',
      conciliado: false
    },
    {
      id: 'CONTA-004',
      data: '2024-01-12',
      fornecedor: 'Clínica Supplies',
      descricao: 'Material de Limpeza',
      valor: 120.00,
      tipo: 'pagamento',
      conciliado: false
    }
  ];

  const calcularEstatisticas = () => {
    const totalConciliado = extratoSimulado.filter(item => item.conciliado).length;
    const totalItens = extratoSimulado.length;
    const percentualConciliado = (totalConciliado / totalItens) * 100;

    const valorConciliado = extratoSimulado
      .filter(item => item.conciliado)
      .reduce((acc, item) => acc + Math.abs(item.valor), 0);

    const valorTotal = extratoSimulado
      .reduce((acc, item) => acc + Math.abs(item.valor), 0);

    const diferencas = extratoSimulado.filter(item => !item.conciliado);

    return {
      totalConciliado,
      totalItens,
      percentualConciliado,
      valorConciliado,
      valorTotal,
      diferencas
    };
  };

  const stats = calcularEstatisticas();

  const handleUploadExtrato = (event) => {
    const file = event.target.files[0];
    if (file) {
      setArquivo(file);
      // Simular processamento
      setTimeout(() => {
        alert('✅ Extrato bancário importado com sucesso!');
        // Aqui seria feito o processamento do arquivo
      }, 1000);
    }
  };

  const executarConciliacao = () => {
    setDadosConciliacao({
      itensProcessados: extratoSimulado.length + movimentacaoInterna.length,
      itensConciliados: 6,
      diferencasEncontradas: 2,
      valorConciliado: 1150.00,
      valorDiferenca: 332.90
    });
    setConciliacaoModalOpen(true);
  };

  const getStatusColor = (conciliado) => {
    return conciliado ? 'success' : 'warning';
  };

  const getStatusIcon = (conciliado) => {
    return conciliado ? <CheckCircle /> : <Warning />;
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Reconciliação Bancária
      </Typography>

      {/* Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: 'success.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle fontSize="large" sx={{ mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.percentualConciliado.toFixed(1)}%
              </Typography>
              <Typography variant="body2">
                Conciliado
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: 'info.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <AccountBalance fontSize="large" sx={{ mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                R$ {stats.valorConciliado.toLocaleString('pt-BR')}
              </Typography>
              <Typography variant="body2">
                Valor Conciliado
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: 'warning.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Warning fontSize="large" sx={{ mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.diferencas.length}
              </Typography>
              <Typography variant="body2">
                Diferenças
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: 'error.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Error fontSize="large" sx={{ mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                R$ {(stats.valorTotal - stats.valorConciliado).toLocaleString('pt-BR')}
              </Typography>
              <Typography variant="body2">
                Valor Pendente
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Configuração e Upload */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ⚙️ Configuração da Reconciliação
          </Typography>

          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Conta Bancária"
                select
                value={contaBancaria}
                onChange={(e) => setContaBancaria(e.target.value)}
              >
                <MenuItem value="bradesco">Bradesco - Conta Corrente</MenuItem>
                <MenuItem value="itau">Itaú - Conta Corrente</MenuItem>
                <MenuItem value="santander">Santander - Conta Corrente</MenuItem>
                <MenuItem value="bb">Banco do Brasil - Conta Corrente</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Período"
                select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
              >
                <MenuItem value="semana">Esta Semana</MenuItem>
                <MenuItem value="mes">Este Mês</MenuItem>
                <MenuItem value="trimestre">Este Trimestre</MenuItem>
                <MenuItem value="personalizado">Personalizado</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<Upload />}
                fullWidth
              >
                Upload Extrato
                <input
                  type="file"
                  hidden
                  accept=".csv,.xlsx,.ofx"
                  onChange={handleUploadExtrato}
                />
              </Button>
              {arquivo && (
                <Typography variant="caption" color="success.main">
                  ✅ {arquivo.name}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                startIcon={<Sync />}
                onClick={executarConciliacao}
                fullWidth
                size="large"
              >
                Executar Reconciliação
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Progresso da Reconciliação */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Progresso da Reconciliação
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2">
                Itens Conciliados
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {stats.totalConciliado} de {stats.totalItens}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={stats.percentualConciliado} 
              sx={{ height: 8, borderRadius: 4 }}
              color="success"
            />
          </Box>

          <Alert severity="info">
            A reconciliação automática identifica e relaciona transações bancárias com as movimentações internas do sistema.
          </Alert>
        </CardContent>
      </Card>

      {/* Detalhes das Transações */}
      <Grid container spacing={3}>
        {/* Extrato Bancário */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Extrato Bancário
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Data</TableCell>
                      <TableCell>Descrição</TableCell>
                      <TableCell align="right">Valor</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {extratoSimulado.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {moment(item.data).format('DD/MM')}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.descricao}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            color={item.tipo === 'credito' ? 'success.main' : 'error.main'}
                            fontWeight="bold"
                          >
                            {item.tipo === 'credito' ? '+' : ''}R$ {Math.abs(item.valor).toLocaleString('pt-BR')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(item.conciliado)}
                            label={item.conciliado ? 'Conciliado' : 'Pendente'}
                            color={getStatusColor(item.conciliado)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Movimentação Interna */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Movimentação Interna
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Data</TableCell>
                      <TableCell>Descrição</TableCell>
                      <TableCell align="right">Valor</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movimentacaoInterna.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {moment(item.data).format('DD/MM')}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.descricao}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.cliente || item.fornecedor}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            color={item.tipo === 'recebimento' ? 'success.main' : 'error.main'}
                            fontWeight="bold"
                          >
                            {item.tipo === 'recebimento' ? '+' : '-'}R$ {item.valor.toLocaleString('pt-BR')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(item.conciliado)}
                            label={item.conciliado ? 'Conciliado' : 'Pendente'}
                            color={getStatusColor(item.conciliado)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Accordion com Diferenças */}
      <Box sx={{ mt: 3 }}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              ⚠️ Diferenças Encontradas ({stats.diferencas.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Alert severity="warning" sx={{ mb: 2 }}>
              As seguintes transações não foram conciliadas automaticamente e requerem análise manual:
            </Alert>
            
            {stats.diferencas.map((item) => (
              <Card key={item.id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" fontWeight="bold">
                        {item.descricao}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {moment(item.data).format('DD/MM/YYYY')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant="body2" fontWeight="bold">
                        R$ {Math.abs(item.valor).toLocaleString('pt-BR')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<CompareArrows />}
                      >
                        Conciliar Manual
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Modal Resultado da Reconciliação */}
      <Dialog 
        open={modalConciliacaoOpen} 
        onClose={() => setConciliacaoModalOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircle color="success" />
            Reconciliação Concluída
          </Box>
        </DialogTitle>
        <DialogContent>
          {dadosConciliacao && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  ✅ Reconciliação executada com sucesso!
                </Alert>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Itens Processados:
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {dadosConciliacao.itensProcessados}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Itens Conciliados:
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  {dadosConciliacao.itensConciliados}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Diferenças Encontradas:
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="warning.main">
                  {dadosConciliacao.diferencasEncontradas}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Valor Conciliado:
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  R$ {dadosConciliacao.valorConciliado.toLocaleString('pt-BR')}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConciliacaoModalOpen(false)}>
            Fechar
          </Button>
          <Button variant="contained" startIcon={<Download />}>
            Exportar Relatório
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReconciliacaoBancaria;
