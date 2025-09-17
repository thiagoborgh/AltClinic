import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  AttachMoney,
  Receipt,
  CreditCard,
  AccountBalance,
  BarChart,
  WhatsApp,
  ContentCopy,
  Download
} from '@mui/icons-material';
import { Snackbar, Alert } from '@mui/material';
import axios from 'axios';
import QRCode from 'qrcode';

const Financeiro = () => {
  const [dadosFinanceiros, setDadosFinanceiros] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [faturaData, setFaturaData] = useState({
    valor: '',
    descricao: 'Mensalidade do plano',
    vencimento: new Date().toISOString().split('T')[0],
    metodoPagamento: 'pix', // 'pix' ou 'cartao'
    // Dados PIX
    pix_chave: '',
    pix_nome_titular: '',
    pix_cpf_cnpj: '',
    pix_banco: '',
    pix_qr_code: '',
    // Dados Cartão
    cartao_numero: '',
    cartao_nome: '',
    cartao_validade: '',
    cartao_cvv: '',
    cartao_parcelas: 1
  });
  const [configData, setConfigData] = useState({
    // PIX Institucional
    pix_chave: '',
    pix_tipo: 'cpf',
    pix_nome_titular: '',
    pix_cpf_cnpj: '',
    pix_banco: '',
    pix_ativo: true,

    // Gateway Adquirentes
    gateway_stripe_public_key: '',
    gateway_stripe_secret_key: '',
    gateway_stripe_ativo: false,

    gateway_pagseguro_email: '',
    gateway_pagseguro_token: '',
    gateway_pagseguro_ativo: false,

    gateway_cielo_merchant_id: '',
    gateway_cielo_merchant_key: '',
    gateway_cielo_ativo: false,

    // Configurações Gerais
    moeda_padrao: 'BRL',
    timezone: 'America/Sao_Paulo',
    notificacoes_email: true,
    notificacoes_whatsapp: true
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [pixData, setPixData] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchDadosFinanceiros();
    fetchTenants();
    fetchConfiguracoes(); // Carregar configurações salvas
  }, []);

  const fetchDadosFinanceiros = async () => {
    try {
      // Buscar dados financeiros agregados de todos os tenants
      const response = await axios.get('/financeiro/resumo');
      if (response.data.success) {
        setDadosFinanceiros(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      // Timeout pequeno para garantir que todas as chamadas terminem
      setTimeout(() => setLoading(false), 100);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await axios.get('/admin/licencas');
      if (response.data.success) {
        setTenants(response.data.licencas || []);
        console.log(`✅ ${response.data.licencas?.length || 0} tenant(s) carregado(s):`, response.data.licencas);
      }
    } catch (error) {
      console.error('Erro ao carregar tenants:', error);
    }
  };

  const handleOpenDialog = (type, tenant = null) => {
    setDialogType(type);
    setSelectedTenant(tenant);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTenant(null);
    setDialogType('');
  };

  const handleSaveAction = async () => {
    try {
      let response;
      switch (dialogType) {
        case 'gerar-fatura':
          // Preparar dados da fatura
          const dadosFatura = {
            tenantId: selectedTenant?.id,
            valor: parseFloat(faturaData.valor),
            descricao: faturaData.descricao,
            vencimento: faturaData.vencimento,
            metodoPagamento: faturaData.metodoPagamento
          };

          // Processar pagamento baseado no método selecionado
          if (faturaData.metodoPagamento === 'pix') {
            const qrCode = await gerarQRCodePIX();
            dadosFatura.pix = {
              chave: faturaData.pix_chave,
              nome_titular: faturaData.pix_nome_titular,
              cpf_cnpj: faturaData.pix_cpf_cnpj,
              banco: faturaData.pix_banco,
              qr_code: qrCode
            };
          } else if (faturaData.metodoPagamento === 'cartao') {
            const pagamentoProcessado = await processarPagamentoCartao();
            if (!pagamentoProcessado) {
              throw new Error('Erro ao processar pagamento com cartão');
            }
            dadosFatura.cartao = {
              numero: faturaData.cartao_numero,
              nome: faturaData.cartao_nome,
              validade: faturaData.cartao_validade,
              parcelas: faturaData.cartao_parcelas
            };
          }

          response = await axios.post(`/billing/invoice/${selectedTenant}`, dadosFatura);
          break;
        case 'alterar-plano':
          response = await axios.put(`/tenants/admin/${selectedTenant?.id}/change-plan`, {
            plano: 'professional' // exemplo
          });
          break;
        default:
          return;
      }

      if (response.data.success) {
        handleCloseDialog();
        fetchDadosFinanceiros();
        // Resetar dados da fatura
        setFaturaData({
          valor: '',
          descricao: 'Mensalidade do plano',
          vencimento: new Date().toISOString().split('T')[0],
          metodoPagamento: 'pix',
          pix_qr_code: '',
          cartao_numero: '',
          cartao_nome: '',
          cartao_validade: '',
          cartao_cvv: '',
          cartao_parcelas: 1
        });
      }
    } catch (error) {
      console.error('Erro ao salvar ação:', error);
    }
  };

  const fetchConfiguracoes = async () => {
    try {
      const response = await axios.get('/admin/financeiro/configuracoes');
      if (response.data.success) {
        setConfigData(prev => ({
          ...prev,
          ...response.data.data
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      // Em caso de erro, mantém os valores padrão
    }
  };

  const handleFaturaChange = (field, value) => {
    setFaturaData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Se mudou para PIX, preenche automaticamente os dados da empresa
      if (field === 'metodoPagamento' && value === 'pix' && configData.pix_chave) {
        newData.pix_chave = configData.pix_chave;
        newData.pix_nome_titular = configData.pix_nome_titular;
        newData.pix_cpf_cnpj = configData.pix_cpf_cnpj;
        newData.pix_banco = configData.pix_banco;
      }
      
      return newData;
    });
  };

  const gerarQRCodePIX = async () => {
    try {
      if (!faturaData.valor || parseFloat(faturaData.valor) <= 0) {
        setSnackbar({
          open: true,
          message: 'Por favor, informe um valor válido para a fatura',
          severity: 'error'
        });
        return;
      }

      // Fazer requisição para o backend gerar o PIX
      const response = await axios.post('/admin/financeiro/pix', {
        valor: parseFloat(faturaData.valor),
        descricao: faturaData.descricao || 'Fatura ALTclinic',
        tenant: selectedTenant?.id
      });

      if (response.data.success) {
        const pixInfo = response.data.data;
        
        // Gerar QR Code visual
        const qrCodeImageUrl = await QRCode.toDataURL(pixInfo.codigo, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        setPixData(pixInfo);
        setQrCodeImage(qrCodeImageUrl);
        setFaturaData(prev => ({
          ...prev,
          pix_qr_code: pixInfo.codigo
        }));

        // Salvar fatura no histórico
        if (selectedTenant) {
          try {
            await axios.post('/admin/financeiro/invoices', {
              subdomain: selectedTenant.slug,
              valor: faturaData.valor,
              descricao: faturaData.descricao || 'Fatura ALTclinic',
              qr_code: pixInfo.codigo,
              metodo_pagamento: 'PIX'
            });
            console.log('✅ Fatura salva no histórico do tenant:', selectedTenant.slug);
          } catch (historyError) {
            console.error('⚠️ Erro ao salvar no histórico (não crítico):', historyError);
          }
        }

        setSnackbar({
          open: true,
          message: 'QR Code PIX gerado com sucesso!',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code PIX:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Erro ao gerar QR Code PIX',
        severity: 'error'
      });
    }
  };

  const copiarCodigoPIX = () => {
    if (faturaData.pix_qr_code) {
      navigator.clipboard.writeText(faturaData.pix_qr_code);
      setSnackbar({
        open: true,
        message: 'Código PIX copiado para a área de transferência!',
        severity: 'success'
      });
    }
  };

  const baixarQRCode = () => {
    if (qrCodeImage) {
      const link = document.createElement('a');
      link.href = qrCodeImage;
      link.download = `qrcode-pix-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSnackbar({
        open: true,
        message: 'QR Code baixado com sucesso!',
        severity: 'success'
      });
    }
  };

  const enviarWhatsApp = () => {
    if (!pixData || !faturaData.pix_qr_code) {
      setSnackbar({
        open: true,
        message: 'Gere o QR Code PIX primeiro',
        severity: 'error'
      });
      return;
    }

    const mensagem = `
🏥 *ALTclinic - Fatura de Pagamento*

💰 *Valor:* R$ ${parseFloat(faturaData.valor).toFixed(2)}
📋 *Descrição:* ${faturaData.descricao}
📅 *Vencimento:* ${new Date(faturaData.vencimento).toLocaleDateString('pt-BR')}

💳 *PIX Copia e Cola:*
${faturaData.pix_qr_code}

📱 Para pagar, copie o código acima e cole no seu aplicativo bancário ou escaneie o QR Code.

✅ Pagamento processado automaticamente após confirmação.
    `.trim();

    const telefone = prompt('Digite o número do WhatsApp (com código do país):');
    if (telefone) {
      const url = `https://wa.me/${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
      window.open(url, '_blank');
    }
  };

  const processarPagamentoCartao = async () => {
    try {
      // Simular processamento de cartão de crédito
      console.log('Processando pagamento com cartão:', {
        numero: faturaData.cartao_numero.replace(/\d(?=\d{4})/g, '*'),
        nome: faturaData.cartao_nome,
        parcelas: faturaData.cartao_parcelas
      });
      return true;
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Carregando dados financeiros...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        💰 Gestão Financeira
      </Typography>

      {/* Cards de Resumo */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Tenants Ativos
                  </Typography>
                  <Typography variant="h5">
                    {tenants.length}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {tenants.length === 1 ? 'licença ativa' : 'licenças ativas'}
                  </Typography>
                </Box>
                <AccountBalance color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Receita Total
                  </Typography>
                  <Typography variant="h5">
                    R$ {dadosFinanceiros?.resumoFinanceiro?.receitaMensal?.toLocaleString('pt-BR') || '0,00'}
                  </Typography>
                </Box>
                <AttachMoney color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Contas a Receber
                  </Typography>
                  <Typography variant="h5">
                    R$ {dadosFinanceiros?.resumoFinanceiro?.contasReceber?.toLocaleString('pt-BR') || '0,00'}
                  </Typography>
                </Box>
                <Receipt color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Meta Mensal
                  </Typography>
                  <Typography variant="h5">
                    {dadosFinanceiros?.resumoFinanceiro?.percentualMeta?.toFixed(1) || '0'}%
                  </Typography>
                </Box>
                <BarChart color="secondary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Aviso quando há poucos tenants */}
      {tenants.length <= 1 && (
        <Card sx={{ mb: 4, bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              📊 Status do Sistema
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Você tem atualmente <strong>{tenants.length} tenant{tenants.length !== 1 ? 's' : ''}</strong> cadastrado{tenants.length !== 1 ? 's' : ''} no sistema.
            </Typography>
            {tenants.length === 1 && (
              <Typography variant="body2" color="textSecondary">
                Tenant ativo: <strong>{tenants[0]?.nome}</strong> ({tenants[0]?.responsavel?.email || tenants[0]?.email})
              </Typography>
            )}
            {tenants.length === 0 && (
              <Typography variant="body2" color="warning.main">
                Nenhum tenant cadastrado. Vá para a seção de Licenças para adicionar novos clientes.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Planos Disponíveis */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 Planos de Licenciamento
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="primary">Starter</Typography>
                  <Typography variant="h4">R$ 199<span style={{fontSize: '16px'}}>/mês</span></Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    • 3 usuários<br/>
                    • 500 pacientes<br/>
                    • WhatsApp Business<br/>
                    • Relatórios básicos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ border: '2px solid #1976d2' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" color="primary">Professional</Typography>
                    <Chip label="Mais Popular" color="primary" size="small" />
                  </Box>
                  <Typography variant="h4">R$ 399<span style={{fontSize: '16px'}}>/mês</span></Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    • 10 usuários<br/>
                    • 2.000 pacientes<br/>
                    • WhatsApp Business<br/>
                    • Telemedicina<br/>
                    • Relatórios avançados
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="primary">Enterprise</Typography>
                  <Typography variant="h4">R$ 799<span style={{fontSize: '16px'}}>/mês</span></Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    • Usuários ilimitados<br/>
                    • Pacientes ilimitados<br/>
                    • Todas as funcionalidades<br/>
                    • Suporte 24/7<br/>
                    • API completa
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ⚡ Ações Rápidas
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<Receipt />}
              onClick={() => handleOpenDialog('gerar-fatura')}
            >
              Gerar Fatura
            </Button>
            <Button
              variant="outlined"
              startIcon={<CreditCard />}
              onClick={() => handleOpenDialog('alterar-plano')}
            >
              Alterar Plano
            </Button>
            <Button
              variant="outlined"
              startIcon={<AccountBalance />}
            >
              Relatório Financeiro
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Dialog para ações */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'gerar-fatura' ? 'Gerar Fatura' : 'Alterar Plano'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'gerar-fatura' ? (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Seleção do Tenant */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Selecionar Tenant</InputLabel>
                  <Select
                    value={selectedTenant?.id || ''}
                    onChange={(e) => {
                      const tenant = tenants.find(t => t.id === e.target.value);
                      setSelectedTenant(tenant || null);
                    }}
                    label="Selecionar Tenant"
                  >
                    {tenants.length === 0 ? (
                      <MenuItem disabled>
                        Nenhum tenant cadastrado
                      </MenuItem>
                    ) : (
                      tenants.map((tenant) => (
                        <MenuItem key={tenant.id} value={tenant.id}>
                          {tenant.nome} - {tenant.responsavel?.email || tenant.email} ({tenant.tipo || tenant.plano || 'Sem plano'})
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
                {tenants.length === 0 && (
                  <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
                    Você precisa cadastrar tenants primeiro na seção de Licenças.
                  </Typography>
                )}
              </Grid>

              {/* Valor e Descrição */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Valor (R$)"
                  type="number"
                  value={faturaData.valor}
                  onChange={(e) => handleFaturaChange('valor', e.target.value)}
                  placeholder="0,00"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Data de Vencimento"
                  type="date"
                  value={faturaData.vencimento}
                  onChange={(e) => handleFaturaChange('vencimento', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrição"
                  value={faturaData.descricao}
                  onChange={(e) => handleFaturaChange('descricao', e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>

              {/* Método de Pagamento */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Método de Pagamento</InputLabel>
                  <Select
                    value={faturaData.metodoPagamento}
                    onChange={(e) => handleFaturaChange('metodoPagamento', e.target.value)}
                    label="Método de Pagamento"
                  >
                    <MenuItem value="pix">PIX</MenuItem>
                    <MenuItem value="cartao">Cartão de Crédito</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Campos específicos do PIX */}
              {faturaData.metodoPagamento === 'pix' && (
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom color="primary">
                      🏦 Pagamento via PIX
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Chave PIX"
                          value={faturaData.pix_chave}
                          InputProps={{ readOnly: true }}
                          helperText="Dados da empresa (configurados nas configurações)"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Nome do Titular"
                          value={faturaData.pix_nome_titular}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="CPF/CNPJ"
                          value={faturaData.pix_cpf_cnpj}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Banco"
                          value={faturaData.pix_banco}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      {faturaData.pix_qr_code && (
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="QR Code PIX (Copia e Cola)"
                            value={faturaData.pix_qr_code}
                            multiline
                            rows={3}
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>
                      )}
                      
                      {/* QR Code Visual */}
                      {qrCodeImage && (
                        <Grid item xs={12}>
                          <Box textAlign="center" sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                              📱 QR Code para Pagamento
                            </Typography>
                            <img 
                              src={qrCodeImage} 
                              alt="QR Code PIX" 
                              style={{ maxWidth: '300px', width: '100%' }}
                            />
                          </Box>
                        </Grid>
                      )}
                      
                      <Grid item xs={12}>
                        <Button
                          variant="outlined"
                          onClick={gerarQRCodePIX}
                          startIcon={<CreditCard />}
                          fullWidth
                          sx={{ mb: 1 }}
                        >
                          Gerar QR Code PIX
                        </Button>
                      </Grid>
                      
                      {/* Botões de Ação */}
                      {faturaData.pix_qr_code && (
                        <>
                          <Grid item xs={12} md={4}>
                            <Button
                              variant="contained"
                              onClick={copiarCodigoPIX}
                              startIcon={<ContentCopy />}
                              fullWidth
                              color="secondary"
                            >
                              Copiar PIX
                            </Button>
                          </Grid>
                          
                          <Grid item xs={12} md={4}>
                            <Button
                              variant="contained"
                              onClick={baixarQRCode}
                              startIcon={<Download />}
                              fullWidth
                              color="info"
                              disabled={!qrCodeImage}
                            >
                              Baixar QR Code
                            </Button>
                          </Grid>
                          
                          <Grid item xs={12} md={4}>
                            <Button
                              variant="contained"
                              onClick={enviarWhatsApp}
                              startIcon={<WhatsApp />}
                              fullWidth
                              color="success"
                            >
                              Enviar WhatsApp
                            </Button>
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Card>
                </Grid>
              )}

              {/* Campos específicos do Cartão */}
              {faturaData.metodoPagamento === 'cartao' && (
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom color="primary">
                      💳 Pagamento com Cartão de Crédito
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Número do Cartão"
                          value={faturaData.cartao_numero}
                          onChange={(e) => handleFaturaChange('cartao_numero', e.target.value)}
                          placeholder="0000 0000 0000 0000"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Nome no Cartão"
                          value={faturaData.cartao_nome}
                          onChange={(e) => handleFaturaChange('cartao_nome', e.target.value)}
                          placeholder="Como está no cartão"
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Validade"
                          value={faturaData.cartao_validade}
                          onChange={(e) => handleFaturaChange('cartao_validade', e.target.value)}
                          placeholder="MM/AA"
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="CVV"
                          value={faturaData.cartao_cvv}
                          onChange={(e) => handleFaturaChange('cartao_cvv', e.target.value)}
                          type="password"
                          placeholder="123"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Parcelas</InputLabel>
                          <Select
                            value={faturaData.cartao_parcelas}
                            onChange={(e) => handleFaturaChange('cartao_parcelas', e.target.value)}
                            label="Parcelas"
                          >
                            <MenuItem value={1}>1x (à vista)</MenuItem>
                            <MenuItem value={2}>2x</MenuItem>
                            <MenuItem value={3}>3x</MenuItem>
                            <MenuItem value={6}>6x</MenuItem>
                            <MenuItem value={12}>12x</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
              )}
            </Grid>
          ) : (
            <Box>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Selecionar Tenant</InputLabel>
                <Select
                  value={selectedTenant?.id || ''}
                  onChange={(e) => {
                    const tenant = tenants.find(t => t.id === e.target.value);
                    setSelectedTenant(tenant || null);
                  }}
                  label="Selecionar Tenant"
                >
                  {tenants.length === 0 ? (
                    <MenuItem disabled>
                      Nenhum tenant cadastrado
                    </MenuItem>
                  ) : (
                    tenants.map((tenant) => (
                      <MenuItem key={tenant.id} value={tenant.id}>
                        {tenant.nome} - {tenant.responsavel?.email || tenant.email} (Plano: {tenant.tipo || tenant.plano || 'Sem plano'})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              {tenants.length === 0 && (
                <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
                  Você precisa cadastrar tenants primeiro na seção de Licenças.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveAction} variant="contained">
            {dialogType === 'gerar-fatura' ? 'Gerar Fatura' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificações */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Financeiro;
