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
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Add,
  Edit,
  CheckCircle,
  Schedule,
  Warning,
  Receipt,
  AccessTime,
  AttachMoney,
  Business,
  LocalShipping
} from '@mui/icons-material';
import { useFinanceiro } from '../../hooks/financeiro/useFinanceiro';
import moment from 'moment';

const ContasPagar = ({ searchTerm }) => {
  const { contasPagar, pagarConta } = useFinanceiro();
  const [modalPagamentoOpen, setModalPagamentoOpen] = useState(false);
  const [modalNovaContaOpen, setModalNovaContaOpen] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState(null);
  
  const [dadosPagamento, setDadosPagamento] = useState({
    valorPago: 0,
    formaPagamento: 'pix',
    dataPagamento: moment().format('YYYY-MM-DD'),
    observacoes: ''
  });

  const [novaConta, setNovaConta] = useState({
    fornecedor: '',
    descricao: '',
    categoria: '',
    valor: 0,
    dataVencimento: '',
    formaPagamento: 'pix',
    observacoes: ''
  });

  // Garantir que contasPagar é sempre um array
  const contasPagarArray = Array.isArray(contasPagar) ? contasPagar : [];

  // Filtrar contas por termo de busca
  const contasFiltradas = contasPagarArray.filter(conta =>
    conta.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conta.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conta.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  // Agrupar por categoria para análise
  const gastoPorCategoria = contasFiltradas.reduce((acc, conta) => {
    acc[conta.categoria] = (acc[conta.categoria] || 0) + conta.valor;
    return acc;
  }, {});

  const handlePagarConta = async () => {
    try {
      await pagarConta(contaSelecionada.id, dadosPagamento);
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

  const getCategoriaIcon = (categoria) => {
    switch (categoria) {
      case 'Fornecedores': return <Business />;
      case 'Transporte': return <LocalShipping />;
      case 'Salários': return <AttachMoney />;
      default: return <Receipt />;
    }
  };

  const getCategoriaColor = (categoria) => {
    switch (categoria) {
      case 'Fornecedores': return 'primary';
      case 'Transporte': return 'secondary';
      case 'Salários': return 'success';
      case 'Aluguel': return 'warning';
      case 'Utilities': return 'info';
      default: return 'default';
    }
  };

  const getRowColor = (conta) => {
    if (conta.status === 'paga') return 'rgba(76, 175, 80, 0.1)';
    if (moment(conta.dataVencimento).isBefore(moment(), 'day')) return 'rgba(244, 67, 54, 0.1)';
    if (moment(conta.dataVencimento).isSame(moment(), 'day')) return 'rgba(255, 193, 7, 0.1)';
    return 'transparent';
  };

  const getStatusIcon = (conta) => {
    if (conta.status === 'paga') return <CheckCircle />;
    if (moment(conta.dataVencimento).isBefore(moment(), 'day')) return <Warning />;
    return <Schedule />;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Contas a Pagar
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setModalNovaContaOpen(true)}
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

      {/* Análise por Categoria */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Gastos por Categoria
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(gastoPorCategoria).map(([categoria, valor]) => (
              <Grid item xs={12} md={6} key={categoria}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  {getCategoriaIcon(categoria)}
                  <Typography variant="body2">
                    {categoria}: R$ {valor.toLocaleString('pt-BR')}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(valor / Math.max(...Object.values(gastoPorCategoria))) * 100} 
                  sx={{ height: 8, borderRadius: 4 }}
                  color={getCategoriaColor(categoria)}
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Tabela de contas */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Fornecedor</strong></TableCell>
              <TableCell><strong>Descrição</strong></TableCell>
              <TableCell><strong>Categoria</strong></TableCell>
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
                  <Box display="flex" alignItems="center" gap={1}>
                    {getCategoriaIcon(conta.categoria)}
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {conta.fornecedor}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {conta.contato}
                      </Typography>
                    </Box>
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
                  <Chip
                    label={conta.categoria}
                    color={getCategoriaColor(conta.categoria)}
                    size="small"
                    variant="outlined"
                  />
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
                      {contaSelecionada.fornecedor}
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
                  <MenuItem value="cheque">Cheque</MenuItem>
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
          <Button onClick={handlePagarConta} variant="contained">
            Registrar Pagamento
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Nova Conta */}
      <Dialog open={modalNovaContaOpen} onClose={() => setModalNovaContaOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nova Conta a Pagar</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fornecedor *"
                value={novaConta.fornecedor}
                onChange={(e) => setNovaConta(prev => ({ ...prev, fornecedor: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Categoria"
                select
                value={novaConta.categoria}
                onChange={(e) => setNovaConta(prev => ({ ...prev, categoria: e.target.value }))}
              >
                <MenuItem value="Fornecedores">Fornecedores</MenuItem>
                <MenuItem value="Transporte">Transporte</MenuItem>
                <MenuItem value="Salários">Salários</MenuItem>
                <MenuItem value="Aluguel">Aluguel</MenuItem>
                <MenuItem value="Utilities">Utilities</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="Equipamentos">Equipamentos</MenuItem>
                <MenuItem value="Outros">Outros</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição *"
                value={novaConta.descricao}
                onChange={(e) => setNovaConta(prev => ({ ...prev, descricao: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Valor *"
                type="number"
                value={novaConta.valor}
                onChange={(e) => setNovaConta(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Data de Vencimento *"
                type="date"
                value={novaConta.dataVencimento}
                onChange={(e) => setNovaConta(prev => ({ ...prev, dataVencimento: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Forma de Pagamento"
                select
                value={novaConta.formaPagamento}
                onChange={(e) => setNovaConta(prev => ({ ...prev, formaPagamento: e.target.value }))}
              >
                <MenuItem value="pix">PIX</MenuItem>
                <MenuItem value="boleto">Boleto</MenuItem>
                <MenuItem value="transferencia">Transferência</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={3}
                value={novaConta.observacoes}
                onChange={(e) => setNovaConta(prev => ({ ...prev, observacoes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalNovaContaOpen(false)}>Cancelar</Button>
          <Button variant="contained">
            Criar Conta
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContasPagar;
