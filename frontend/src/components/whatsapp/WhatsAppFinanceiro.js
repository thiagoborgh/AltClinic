import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  Receipt,
  Warning,
  CheckCircle,
  Schedule,
  Send,
  Link as LinkIcon,
  Payment,
  TrendingUp,
  Assessment
} from '@mui/icons-material';
import useWhatsAppAPI from '../../hooks/whatsapp/useWhatsAppAPI';

const WhatsAppFinanceiro = () => {
  const { enviarMensagemInterativa, enviarTemplate, loading } = useWhatsAppAPI();
  
  const [tabValue, setTabValue] = useState(0);
  const [faturas, setFaturas] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [novaCobranca, setNovaCobranca] = useState({
    pacienteId: '',
    nome: '',
    telefone: '',
    descricao: '',
    valor: '',
    vencimento: '',
    observacoes: ''
  });
  const [dialogCobranca, setDialogCobranca] = useState(false);
  const [linkPagamento, setLinkPagamento] = useState('');

  useEffect(() => {
    carregarDadosFinanceiros();
  }, []);

  const carregarDadosFinanceiros = () => {
    // Simulando dados - em produção viria da API
    const faturasSimuladas = [
      {
        id: 1,
        pacienteId: '123',
        nome: 'João Silva',
        telefone: '5511999999999',
        descricao: 'Consulta Médica + Exames',
        valor: 250.00,
        vencimento: '2024-01-20',
        status: 'pendente',
        dataCriacao: '2024-01-10',
        linkPagamento: 'https://pay.altclinic.com/fatura/abc123'
      },
      {
        id: 2,
        pacienteId: '124',
        nome: 'Maria Santos',
        telefone: '5511888888888',
        descricao: 'Procedimento Especializado',
        valor: 450.00,
        vencimento: '2024-01-15',
        status: 'vencida',
        dataCriacao: '2024-01-05',
        linkPagamento: 'https://pay.altclinic.com/fatura/def456'
      },
      {
        id: 3,
        pacienteId: '125',
        nome: 'Carlos Oliveira',
        telefone: '5511777777777',
        descricao: 'Consulta de Retorno',
        valor: 150.00,
        vencimento: '2024-01-25',
        status: 'paga',
        dataCriacao: '2024-01-08',
        dataPagamento: '2024-01-12',
        linkPagamento: 'https://pay.altclinic.com/fatura/ghi789'
      }
    ];

    const pagamentosSimulados = [
      {
        id: 1,
        faturaId: 3,
        valor: 150.00,
        data: '2024-01-12',
        metodo: 'PIX',
        status: 'confirmado'
      }
    ];

    setFaturas(faturasSimuladas);
    setPagamentos(pagamentosSimulados);
  };

  const criarCobranca = async () => {
    try {
      const fatura = {
        ...novaCobranca,
        id: Date.now(),
        status: 'pendente',
        dataCriacao: new Date().toISOString().split('T')[0],
        linkPagamento: `https://pay.altclinic.com/fatura/${Date.now()}`
      };

      setFaturas(prev => [...prev, fatura]);
      await enviarLinkPagamento(fatura);

      setDialogCobranca(false);
      setNovaCobranca({
        pacienteId: '',
        nome: '',
        telefone: '',
        descricao: '',
        valor: '',
        vencimento: '',
        observacoes: ''
      });
    } catch (error) {
      console.error('Erro ao criar cobrança:', error);
    }
  };

  const enviarLinkPagamento = async (fatura) => {
    const mensagem = {
      type: 'interactive',
      interactive: {
        type: 'button',
        header: {
          type: 'text',
          text: '💰 Fatura Disponível'
        },
        body: {
          text: `Olá ${fatura.nome}!\n\nSua fatura está disponível para pagamento:\n\n📋 *Descrição:* ${fatura.descricao}\n💰 *Valor:* R$ ${fatura.valor.toFixed(2).replace('.', ',')}\n📅 *Vencimento:* ${formatarData(fatura.vencimento)}\n\nEscolha sua forma de pagamento:`
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: `pagar_pix_${fatura.id}`,
                title: '💳 PIX'
              }
            },
            {
              type: 'reply',
              reply: {
                id: `pagar_cartao_${fatura.id}`,
                title: '💳 Cartão'
              }
            },
            {
              type: 'reply',
              reply: {
                id: `ver_fatura_${fatura.id}`,
                title: '📄 Ver Fatura'
              }
            }
          ]
        }
      }
    };

    await enviarMensagemInterativa(fatura.telefone, mensagem);
  };

  const enviarLembreteCobranca = async (fatura) => {
    const diasVencimento = Math.ceil((new Date(fatura.vencimento) - new Date()) / (1000 * 60 * 60 * 24));
    
    let tipoLembrete = 'vencimento';
    if (diasVencimento < 0) tipoLembrete = 'vencida';
    else if (diasVencimento <= 3) tipoLembrete = 'urgente';

    try {
      await enviarTemplate(fatura.telefone, `lembrete_${tipoLembrete}`, [
        fatura.nome,
        fatura.descricao,
        `R$ ${fatura.valor.toFixed(2).replace('.', ',')}`,
        formatarData(fatura.vencimento),
        fatura.linkPagamento
      ]);
    } catch (error) {
      console.error('Erro ao enviar lembrete:', error);
    }
  };

  const gerarLinkPagamento = (fatura) => {
    const link = `https://pay.altclinic.com/fatura/${fatura.id}?valor=${fatura.valor}&desc=${encodeURIComponent(fatura.descricao)}`;
    setLinkPagamento(link);
    navigator.clipboard.writeText(link);
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paga': return 'success';
      case 'pendente': return 'warning';
      case 'vencida': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paga': return <CheckCircle />;
      case 'pendente': return <Schedule />;
      case 'vencida': return <Warning />;
      default: return null;
    }
  };

  // Estatísticas
  const totalPendente = faturas.filter(f => f.status === 'pendente').reduce((sum, f) => sum + f.valor, 0);
  const totalVencido = faturas.filter(f => f.status === 'vencida').reduce((sum, f) => sum + f.valor, 0);
  const totalRecebido = faturas.filter(f => f.status === 'paga').reduce((sum, f) => sum + f.valor, 0);
  const totalFaturado = faturas.reduce((sum, f) => sum + f.valor, 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Gestão Financeira</Typography>
        <Button
          variant="contained"
          startIcon={<Receipt />}
          onClick={() => setDialogCobranca(true)}
        >
          Nova Cobrança
        </Button>
      </Box>

      {/* Dashboard Financeiro */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{formatarMoeda(totalRecebido)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Recebido
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Schedule color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{formatarMoeda(totalPendente)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pendente
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Warning color="error" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{formatarMoeda(totalVencido)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vencido
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Assessment color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{formatarMoeda(totalFaturado)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Faturado
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
        <Tab label="Faturas" />
        <Tab label="Pagamentos" />
        <Tab label="Relatórios" />
      </Tabs>

      {tabValue === 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Faturas</Typography>
          <List>
            {faturas.map((fatura) => (
              <ListItem key={fatura.id} divider>
                <ListItemIcon>
                  {getStatusIcon(fatura.status)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">{fatura.nome}</Typography>
                      <Chip 
                        label={fatura.status} 
                        size="small" 
                        color={getStatusColor(fatura.status)}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2">
                        📋 {fatura.descricao}
                      </Typography>
                      <Typography variant="body2">
                        💰 {formatarMoeda(fatura.valor)} - Venc: {formatarData(fatura.vencimento)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        📱 {fatura.telefone}
                      </Typography>
                    </Box>
                  }
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Send />}
                    onClick={() => enviarLembreteCobranca(fatura)}
                    disabled={loading || fatura.status === 'paga'}
                  >
                    Lembrete
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<LinkIcon />}
                    onClick={() => gerarLinkPagamento(fatura)}
                    disabled={fatura.status === 'paga'}
                  >
                    Link
                  </Button>
                </Box>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Histórico de Pagamentos</Typography>
          <List>
            {pagamentos.map((pagamento) => {
              const fatura = faturas.find(f => f.id === pagamento.faturaId);
              return (
                <ListItem key={pagamento.id} divider>
                  <ListItemIcon>
                    <Payment color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={fatura?.nome || 'Paciente não encontrado'}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          💰 {formatarMoeda(pagamento.valor)} - {pagamento.metodo}
                        </Typography>
                        <Typography variant="body2">
                          📅 {formatarData(pagamento.data)}
                        </Typography>
                      </Box>
                    }
                  />
                  <Chip label={pagamento.status} size="small" color="success" />
                </ListItem>
              );
            })}
          </List>
        </Paper>
      )}

      {tabValue === 2 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Relatórios Financeiros</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Taxa de Conversão
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {faturas.length > 0 ? ((faturas.filter(f => f.status === 'paga').length / faturas.length) * 100).toFixed(1) : 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Faturas pagas / Total de faturas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Tempo Médio de Pagamento
                  </Typography>
                  <Typography variant="h4" color="info">
                    5.2 dias
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Média entre emissão e pagamento
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Dialog para nova cobrança */}
      <Dialog open={dialogCobranca} onClose={() => setDialogCobranca(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Cobrança</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Nome do Paciente"
                fullWidth
                value={novaCobranca.nome}
                onChange={(e) => setNovaCobranca({...novaCobranca, nome: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Telefone (WhatsApp)"
                fullWidth
                value={novaCobranca.telefone}
                onChange={(e) => setNovaCobranca({...novaCobranca, telefone: e.target.value})}
                placeholder="5511999999999"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descrição do Serviço"
                fullWidth
                value={novaCobranca.descricao}
                onChange={(e) => setNovaCobranca({...novaCobranca, descricao: e.target.value})}
                placeholder="Ex: Consulta médica + exames"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Valor"
                fullWidth
                type="number"
                value={novaCobranca.valor}
                onChange={(e) => setNovaCobranca({...novaCobranca, valor: parseFloat(e.target.value)})}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Data de Vencimento"
                type="date"
                fullWidth
                value={novaCobranca.vencimento}
                onChange={(e) => setNovaCobranca({...novaCobranca, vencimento: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Observações"
                fullWidth
                multiline
                rows={3}
                value={novaCobranca.observacoes}
                onChange={(e) => setNovaCobranca({...novaCobranca, observacoes: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogCobranca(false)}>Cancelar</Button>
          <Button 
            onClick={criarCobranca}
            variant="contained"
            disabled={!novaCobranca.nome || !novaCobranca.telefone || !novaCobranca.descricao || !novaCobranca.valor || !novaCobranca.vencimento}
          >
            Criar e Enviar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert para link gerado */}
      {linkPagamento && (
        <Alert 
          severity="success" 
          sx={{ mt: 2 }}
          onClose={() => setLinkPagamento('')}
        >
          Link de pagamento copiado para a área de transferência!
        </Alert>
      )}
    </Box>
  );
};

export default WhatsAppFinanceiro;
