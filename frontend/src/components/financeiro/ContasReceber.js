import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Card,
  CardContent,
  Tooltip,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Add,
  Edit,
  CheckCircle,
  Schedule,
  Warning,
  QrCode,
  Send,
  Receipt,
  AccessTime,
} from '@mui/icons-material';
import { useFinanceiro } from '../../hooks/financeiro/useFinanceiro';
import moment from 'moment';

const ContasReceber = ({ searchTerm }) => {
  const { contasReceber, registrarPagamento, gerarPIX } = useFinanceiro();
  const [modalPagamentoOpen, setModalPagamentoOpen] = useState(false);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState(null);
  const [dadosPIX, setDadosPIX] = useState(null);
  
  const [dadosPagamento, setDadosPagamento] = useState({
    valorPago: 0,
    formaPagamento: 'pix',
    dataPagamento: moment().format('YYYY-MM-DD'),
    observacoes: ''
  });

  // Filtrar contas por termo de busca
  const contasFiltradas = contasReceber?.filter(conta =>
    conta.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conta.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Separar contas por status
  const contasVencidas = contasFiltradas.filter(conta => 
    conta.status === 'pendente' && moment(conta.dataVencimento).isBefore(moment(), 'day')
  );
  
  const contasVencendoHoje = contasFiltradas.filter(conta => 
    conta.status === 'pendente' && moment(conta.dataVencimento).isSame(moment(), 'day')
  );
  
  const contasAVencer = contasFiltradas.filter(conta => 
    conta.status === 'pendente' && moment(conta.dataVencimento).isAfter(moment(), 'day')
  );

  const contasPagas = contasFiltradas.filter(conta => conta.status === 'paga');

  const totalVencidas = contasVencidas.reduce((acc, conta) => acc + conta.valor, 0);
  const totalVencendoHoje = contasVencendoHoje.reduce((acc, conta) => acc + conta.valor, 0);
  const totalAVencer = contasAVencer.reduce((acc, conta) => acc + conta.valor, 0);
  const totalPago = contasPagas.reduce((acc, conta) => acc + conta.valor, 0);

  const handleRegistrarPagamento = async () => {
    try {
      await registrarPagamento(contaSelecionada.id, dadosPagamento);
      setModalPagamentoOpen(false);
      setContaSelecionada(null);
      setDadosPagamento({
        valorPago: 0,
        formaPagamento: 'pix',
        dataPagamento: moment().format('YYYY-MM-DD'),
        observacoes: ''
      });
      
      alert('✅ Pagamento registrado com sucesso!');
    } catch (error) {
      alert('❌ Erro ao registrar pagamento');
    }
  };

  const handleGerarPIX = async (conta) => {
    try {
      const pix = gerarPIX(conta.valor, `Pagamento - ${conta.descricao}`);
      setDadosPIX(pix);
      setContaSelecionada(conta);
      setPixModalOpen(true);
    } catch (error) {
      alert('❌ Erro ao gerar PIX');
    }
  };


  const getStatusIcon = (conta) => {
    if (conta.status === 'paga') return <CheckCircle />;
    if (moment(conta.dataVencimento).isBefore(moment(), 'day')) return <Warning />;
    return <Schedule />;
  };

  const getRowColor = (conta) => {
    if (conta.status === 'paga') return 'rgba(76, 175, 80, 0.1)';
    if (moment(conta.dataVencimento).isBefore(moment(), 'day')) return 'rgba(244, 67, 54, 0.1)';
    if (moment(conta.dataVencimento).isSame(moment(), 'day')) return 'rgba(255, 193, 7, 0.1)';
    return 'transparent';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Contas a Receber
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          size="large"
        >
          Nova Conta
        </Button>
      </Box>

      {/* Alertas */}
      {contasVencidas.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          ⚠️ Você tem {contasVencidas.length} contas vencidas no valor de R$ {totalVencidas.toLocaleString('pt-BR')}
        </Alert>
      )}
      
      {contasVencendoHoje.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {contasVencendoHoje.length} contas vencem hoje no valor de R$ {totalVencendoHoje.toLocaleString('pt-BR')}
        </Alert>
      )}

      {/* Estatísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: 'error.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Warning fontSize="large" sx={{ mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                R$ {totalVencidas.toLocaleString('pt-BR')}
              </Typography>
              <Typography variant="body2">
                Vencidas ({contasVencidas.length})
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: 'warning.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <AccessTime fontSize="large" sx={{ mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                R$ {totalVencendoHoje.toLocaleString('pt-BR')}
              </Typography>
              <Typography variant="body2">
                Vencem Hoje ({contasVencendoHoje.length})
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: 'info.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Schedule fontSize="large" sx={{ mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                R$ {totalAVencer.toLocaleString('pt-BR')}
              </Typography>
              <Typography variant="body2">
                A Vencer ({contasAVencer.length})
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: 'success.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle fontSize="large" sx={{ mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                R$ {totalPago.toLocaleString('pt-BR')}
              </Typography>
              <Typography variant="body2">
                Pagas ({contasPagas.length})
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráfico de Performance */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Performance de Recebimento
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom>
                Taxa de Recebimento no Prazo
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={75} 
                sx={{ height: 10, borderRadius: 5 }}
                color="success"
              />
              <Typography variant="caption" color="text.secondary">
                75% das contas são pagas no prazo
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom>
                Inadimplência
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={15} 
                sx={{ height: 10, borderRadius: 5 }}
                color="error"
              />
              <Typography variant="caption" color="text.secondary">
                15% de inadimplência
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabela de contas */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Cliente</strong></TableCell>
              <TableCell><strong>Descrição</strong></TableCell>
              <TableCell><strong>Valor</strong></TableCell>
              <TableCell><strong>Vencimento</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Dias</strong></TableCell>
              <TableCell><strong>Ações</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contasFiltradas.map((conta) => (
              <TableRow 
                key={conta.id} 
                sx={{ backgroundColor: getRowColor(conta) }}
              >
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {conta.cliente}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {conta.telefone}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {conta.descricao}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Criado em: {moment(conta.dataEmissao).format('DD/MM/YYYY')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    R$ {conta.valor.toLocaleString('pt-BR')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    color={
                      moment(conta.dataVencimento).isBefore(moment(), 'day') 
                        ? 'error' 
                        : moment(conta.dataVencimento).isSame(moment(), 'day')
                        ? 'warning.main'
                        : 'text.primary'
                    }
                    fontWeight={
                      moment(conta.dataVencimento).isSameOrBefore(moment(), 'day') 
                        ? 'bold' 
                        : 'normal'
                    }
                  >
                    {moment(conta.dataVencimento).format('DD/MM/YYYY')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(conta)}
                    label={
                      conta.status === 'paga' 
                        ? 'PAGA' 
                        : moment(conta.dataVencimento).isBefore(moment(), 'day')
                        ? 'VENCIDA'
                        : 'PENDENTE'
                    }
                    color={
                      conta.status === 'paga' 
                        ? 'success' 
                        : moment(conta.dataVencimento).isBefore(moment(), 'day')
                        ? 'error'
                        : 'warning'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    color={
                      moment(conta.dataVencimento).isBefore(moment(), 'day') 
                        ? 'error' 
                        : 'text.secondary'
                    }
                  >
                    {Math.abs(moment(conta.dataVencimento).diff(moment(), 'days'))} dias
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    {conta.status !== 'paga' && (
                      <>
                        <Tooltip title="Registrar Pagamento">
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => {
                              setContaSelecionada(conta);
                              setDadosPagamento(prev => ({ ...prev, valorPago: conta.valor }));
                              setModalPagamentoOpen(true);
                            }}
                          >
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Gerar PIX">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleGerarPIX(conta)}
                          >
                            <QrCode />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Enviar Cobrança">
                          <IconButton size="small" color="warning">
                            <Send />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    <Tooltip title="Comprovante">
                      <IconButton size="small">
                        <Receipt />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton size="small">
                        <Edit />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal Registrar Pagamento */}
      <Dialog open={modalPagamentoOpen} onClose={() => setModalPagamentoOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>✅ Registrar Pagamento</DialogTitle>
        <DialogContent>
          {contaSelecionada && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {contaSelecionada.cliente}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {contaSelecionada.descricao}
                    </Typography>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      R$ {contaSelecionada.valor.toLocaleString('pt-BR')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Valor Pago *"
                  type="number"
                  value={dadosPagamento.valorPago}
                  onChange={(e) => setDadosPagamento(prev => ({ 
                    ...prev, 
                    valorPago: parseFloat(e.target.value) || 0 
                  }))}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Forma de Pagamento"
                  select
                  value={dadosPagamento.formaPagamento}
                  onChange={(e) => setDadosPagamento(prev => ({ 
                    ...prev, 
                    formaPagamento: e.target.value 
                  }))}
                >
                  <MenuItem value="pix">PIX</MenuItem>
                  <MenuItem value="dinheiro">Dinheiro</MenuItem>
                  <MenuItem value="cartao_credito">Cartão de Crédito</MenuItem>
                  <MenuItem value="cartao_debito">Cartão de Débito</MenuItem>
                  <MenuItem value="transferencia">Transferência</MenuItem>
                  <MenuItem value="boleto">Boleto</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Data do Pagamento"
                  type="date"
                  value={dadosPagamento.dataPagamento}
                  onChange={(e) => setDadosPagamento(prev => ({ 
                    ...prev, 
                    dataPagamento: e.target.value 
                  }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observações"
                  multiline
                  rows={3}
                  value={dadosPagamento.observacoes}
                  onChange={(e) => setDadosPagamento(prev => ({ 
                    ...prev, 
                    observacoes: e.target.value 
                  }))}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalPagamentoOpen(false)}>Cancelar</Button>
          <Button onClick={handleRegistrarPagamento} variant="contained">
            Registrar Pagamento
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal PIX */}
      <Dialog open={pixModalOpen} onClose={() => setPixModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>PIX para Cobrança</DialogTitle>
        <DialogContent>
          {dadosPIX && contaSelecionada && (
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>
                Cliente: {contaSelecionada.cliente}
              </Typography>
              <Typography variant="h4" color="primary" fontWeight="bold" gutterBottom>
                R$ {dadosPIX.valor.toFixed(2)}
              </Typography>
              
              <Box sx={{ 
                border: 1, 
                borderColor: 'grey.300', 
                borderRadius: 2, 
                p: 2, 
                mb: 2,
                backgroundColor: 'grey.50'
              }}>
                <Typography variant="body2" gutterBottom>
                  Código PIX (Copia e Cola):
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={dadosPIX.codigo}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  size="small"
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                Válido até: {moment(dadosPIX.vencimento).format('DD/MM/YYYY HH:mm')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPixModalOpen(false)}>Fechar</Button>
          <Button variant="contained" startIcon={<Send />}>
            Enviar por WhatsApp
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContasReceber;
