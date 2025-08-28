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
  Tooltip,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  QrCode,
  Send,
  CheckCircle,
  Cancel,
  Schedule
} from '@mui/icons-material';
import { useFinanceiro } from '../../hooks/financeiro/useFinanceiro';
import moment from 'moment';

const PropostasOrcamentos = ({ searchTerm }) => {
  const { propostas, criarProposta, gerarPIX } = useFinanceiro();
  const [modalOpen, setModalOpen] = useState(false);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [propostaSelecionada, setPropostaSelecionada] = useState(null);
  const [dadosPIX, setDadosPIX] = useState(null);
  
  const [novaProposta, setNovaProposta] = useState({
    paciente: { nome: '', telefone: '', email: '' },
    itens: [{ procedimento: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 }],
    desconto: 0,
    observacoes: '',
    formaPagamento: 'pix'
  });

  // Filtrar propostas por termo de busca
  const propostasFiltradas = propostas?.filter(proposta =>
    proposta.paciente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proposta.numero.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleAdicionarItem = () => {
    setNovaProposta(prev => ({
      ...prev,
      itens: [...prev.itens, { procedimento: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 }]
    }));
  };

  const handleRemoverItem = (index) => {
    setNovaProposta(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setNovaProposta(prev => {
      const novosItens = [...prev.itens];
      novosItens[index] = { ...novosItens[index], [field]: value };
      
      // Calcular valor total do item
      if (field === 'quantidade' || field === 'valorUnitario') {
        novosItens[index].valorTotal = novosItens[index].quantidade * novosItens[index].valorUnitario;
      }
      
      return { ...prev, itens: novosItens };
    });
  };

  const calcularTotal = () => {
    const subtotal = novaProposta.itens.reduce((acc, item) => acc + item.valorTotal, 0);
    return subtotal - novaProposta.desconto;
  };

  const handleSalvarProposta = async () => {
    try {
      const propostaCompleta = {
        ...novaProposta,
        numero: `PROP-${new Date().getFullYear()}-${String(propostas.length + 1).padStart(3, '0')}`,
        valorTotal: novaProposta.itens.reduce((acc, item) => acc + item.valorTotal, 0),
        valorFinal: calcularTotal(),
        dataValidade: moment().add(15, 'days').toDate()
      };
      
      await criarProposta(propostaCompleta);
      setModalOpen(false);
      setNovaProposta({
        paciente: { nome: '', telefone: '', email: '' },
        itens: [{ procedimento: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 }],
        desconto: 0,
        observacoes: '',
        formaPagamento: 'pix'
      });
      
      alert('✅ Proposta criada com sucesso!');
    } catch (error) {
      alert('❌ Erro ao criar proposta');
    }
  };

  const handleGerarPIX = async (proposta) => {
    try {
      const pix = gerarPIX(proposta.valorFinal, `Proposta ${proposta.numero}`);
      setDadosPIX(pix);
      setPropostaSelecionada(proposta);
      setPixModalOpen(true);
    } catch (error) {
      alert('❌ Erro ao gerar PIX');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'aprovada': return 'success';
      case 'pendente': return 'warning';
      case 'rejeitada': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'aprovada': return <CheckCircle />;
      case 'pendente': return <Schedule />;
      case 'rejeitada': return <Cancel />;
      default: return null;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Propostas e Orçamentos
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setModalOpen(true)}
          size="large"
        >
          Nova Proposta
        </Button>
      </Box>

      {/* Estatísticas rápidas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {propostasFiltradas.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total de Propostas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {propostasFiltradas.filter(p => p.status === 'aprovada').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aprovadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {propostasFiltradas.filter(p => p.status === 'pendente').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pendentes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                R$ {propostasFiltradas.reduce((acc, p) => acc + p.valorFinal, 0).toLocaleString('pt-BR')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Valor Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabela de propostas */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Número</strong></TableCell>
              <TableCell><strong>Paciente</strong></TableCell>
              <TableCell><strong>Valor Total</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Data Criação</strong></TableCell>
              <TableCell><strong>Validade</strong></TableCell>
              <TableCell><strong>Ações</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {propostasFiltradas.map((proposta) => (
              <TableRow key={proposta.id}>
                <TableCell>{proposta.numero}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {proposta.paciente.nome}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {proposta.paciente.telefone}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    R$ {proposta.valorFinal.toLocaleString('pt-BR')}
                  </Typography>
                  {proposta.desconto > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      Desconto: R$ {proposta.desconto.toLocaleString('pt-BR')}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(proposta.status)}
                    label={proposta.status.toUpperCase()}
                    color={getStatusColor(proposta.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {moment(proposta.dataCreated).format('DD/MM/YYYY')}
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    color={moment(proposta.dataValidade).isBefore(moment()) ? 'error' : 'text.primary'}
                  >
                    {moment(proposta.dataValidade).format('DD/MM/YYYY')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Visualizar">
                      <IconButton size="small">
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Gerar PIX">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleGerarPIX(proposta)}
                        disabled={proposta.status === 'rejeitada'}
                      >
                        <QrCode />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Enviar">
                      <IconButton size="small" color="secondary">
                        <Send />
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

      {/* Modal Nova Proposta */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Nova Proposta/Orçamento</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Dados do Paciente */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Dados do Paciente</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Nome do Paciente *"
                value={novaProposta.paciente.nome}
                onChange={(e) => setNovaProposta(prev => ({
                  ...prev,
                  paciente: { ...prev.paciente, nome: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Telefone"
                value={novaProposta.paciente.telefone}
                onChange={(e) => setNovaProposta(prev => ({
                  ...prev,
                  paciente: { ...prev.paciente, telefone: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="E-mail"
                value={novaProposta.paciente.email}
                onChange={(e) => setNovaProposta(prev => ({
                  ...prev,
                  paciente: { ...prev.paciente, email: e.target.value }
                }))}
              />
            </Grid>

            {/* Itens da Proposta */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Itens da Proposta</Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleAdicionarItem}
                  size="small"
                >
                  Adicionar Item
                </Button>
              </Box>
            </Grid>

            {novaProposta.itens.map((item, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Procedimento/Serviço"
                          value={item.procedimento}
                          onChange={(e) => handleItemChange(index, 'procedimento', e.target.value)}
                          select
                        >
                          <MenuItem value="Limpeza Facial">Limpeza Facial</MenuItem>
                          <MenuItem value="Massagem Relaxante">Massagem Relaxante</MenuItem>
                          <MenuItem value="Consulta Dermatológica">Consulta Dermatológica</MenuItem>
                          <MenuItem value="Fisioterapia">Fisioterapia</MenuItem>
                          <MenuItem value="Peeling Químico">Peeling Químico</MenuItem>
                          <MenuItem value="Hidratação Facial">Hidratação Facial</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          label="Qtd"
                          type="number"
                          value={item.quantidade}
                          onChange={(e) => handleItemChange(index, 'quantidade', parseInt(e.target.value) || 1)}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          label="Valor Unit."
                          type="number"
                          value={item.valorUnitario}
                          onChange={(e) => handleItemChange(index, 'valorUnitario', parseFloat(e.target.value) || 0)}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          label="Total"
                          value={item.valorTotal.toFixed(2)}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        {novaProposta.itens.length > 1 && (
                          <IconButton 
                            color="error" 
                            onClick={() => handleRemoverItem(index)}
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {/* Totais e Pagamento */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Forma de Pagamento e Totais</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Forma de Pagamento"
                select
                value={novaProposta.formaPagamento}
                onChange={(e) => setNovaProposta(prev => ({ ...prev, formaPagamento: e.target.value }))}
              >
                <MenuItem value="pix">PIX</MenuItem>
                <MenuItem value="cartao">Cartão</MenuItem>
                <MenuItem value="boleto">Boleto</MenuItem>
                <MenuItem value="parcelado">Parcelado</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Desconto (R$)"
                type="number"
                value={novaProposta.desconto}
                onChange={(e) => setNovaProposta(prev => ({ ...prev, desconto: parseFloat(e.target.value) || 0 }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Valor Final"
                value={`R$ ${calcularTotal().toFixed(2)}`}
                InputProps={{ readOnly: true }}
                sx={{ 
                  '& .MuiInputBase-input': { 
                    fontWeight: 'bold', 
                    fontSize: '1.1rem',
                    color: 'primary.main'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={3}
                value={novaProposta.observacoes}
                onChange={(e) => setNovaProposta(prev => ({ ...prev, observacoes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSalvarProposta} variant="contained">
            Criar Proposta
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal PIX */}
      <Dialog open={pixModalOpen} onClose={() => setPixModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>PIX Gerado com Sucesso</DialogTitle>
        <DialogContent>
          {dadosPIX && (
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>
                Proposta: {propostaSelecionada?.numero}
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

export default PropostasOrcamentos;
