import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Divider,
  Paper,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import {
  Save,
  ArrowBack,
  Business,
  Settings as SettingsIcon,
  Payment,
  Description,
  WhatsApp,
  QrCode,
  Api,
  Person,
  CheckCircle,
  ExpandMore,
  Refresh
} from '@mui/icons-material';
import axios from 'axios';

const CadastroLicenca = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Estado dos dados do formulário
  const [formData, setFormData] = useState({
    // Dados da Licença/Clínica
    nomeClinica: '',
    cnpjCpf: '',
    tipoLicenca: 'freemium',
    chaveLicenca: '',
    responsavel: {
      nome: '',
      email: '',
      telefone: ''
    },

    // Configurações
    whatsapp: {
      token: '',
      qrCode: null,
      status: false
    },
    apis: {
      gemini: '',
      mailchimp: '',
      huggingface: ''
    },
    horarios: [],
    equipamentos: [],
    templates: {
      anamnese: '',
      mensagens: ''
    },

    // Financeiro
    plano: {
      tipo: 'mensal',
      valor: 0,
      recorrencia: 'mensal'
    },
    pix: {
      chave: '',
      titular: '',
      banco: ''
    },
    contasReceber: [],
    contasPagar: [],

    // Validações
    errors: {},
    touched: {}
  });

  // Geração automática de chave de licença
  useEffect(() => {
    if (!formData.chaveLicenca && formData.nomeClinica) {
      const chave = `LIC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setFormData(prev => ({ ...prev, chaveLicenca: chave }));
    }
  }, [formData.nomeClinica, formData.chaveLicenca]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      touched: { ...prev.touched, [field]: true }
    }));

    // Limpar erro quando campo é preenchido
    if (formData.errors[field]) {
      setFormData(prev => ({
        ...prev,
        errors: { ...prev.errors, [field]: null }
      }));
    }
  };

  const handleNestedInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      },
      touched: { ...prev.touched, [`${section}.${field}`]: true }
    }));
  };

  const validateForm = () => {
    const errors = {};

    // Validações obrigatórias
    if (!formData.nomeClinica.trim()) {
      errors.nomeClinica = 'Nome da clínica é obrigatório';
    }

    if (!formData.cnpjCpf.trim()) {
      errors.cnpjCpf = 'CNPJ/CPF é obrigatório';
    }

    if (!formData.responsavel.nome.trim()) {
      errors['responsavel.nome'] = 'Nome do responsável é obrigatório';
    }

    if (!formData.responsavel.email.trim()) {
      errors['responsavel.email'] = 'Email do responsável é obrigatório';
    }

    if (formData.tipoLicenca === 'premium' && !formData.plano.valor) {
      errors['plano.valor'] = 'Valor do plano é obrigatório para licenças premium';
    }

    setFormData(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Preencha todos os campos obrigatórios',
        severity: 'error'
      });
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post('/api/admin/licencas', formData);

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Licença cadastrada com sucesso!',
          severity: 'success'
        });

        // Reset form or redirect
        setTimeout(() => {
          window.location.href = '/admin/licencas';
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao salvar licença:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Erro ao salvar licença',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const generateWhatsAppQR = async () => {
    try {
      const response = await axios.post('/api/admin/whatsapp/generate-qr');
      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          whatsapp: {
            ...prev.whatsapp,
            qrCode: response.data.qrCode,
            token: response.data.token
          }
        }));
        setSnackbar({
          open: true,
          message: 'QR Code gerado com sucesso!',
          severity: 'success'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao gerar QR Code',
        severity: 'error'
      });
    }
  };

  const testAPIConnection = async (apiName) => {
    try {
      const response = await axios.post(`/api/admin/test-api/${apiName}`, {
        key: formData.apis[apiName]
      });

      setSnackbar({
        open: true,
        message: response.data.success ? 'Conexão bem-sucedida!' : 'Erro na conexão',
        severity: response.data.success ? 'success' : 'error'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao testar conexão',
        severity: 'error'
      });
    }
  };

  const renderDadosLicenca = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
          Dados da Licença/Clínica
        </Typography>
        <Divider sx={{ mb: 3 }} />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Nome da Clínica *"
          value={formData.nomeClinica}
          onChange={(e) => handleInputChange('nomeClinica', e.target.value)}
          error={!!formData.errors.nomeClinica}
          helperText={formData.errors.nomeClinica}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="CNPJ/CPF *"
          value={formData.cnpjCpf}
          onChange={(e) => handleInputChange('cnpjCpf', e.target.value)}
          error={!!formData.errors.cnpjCpf}
          helperText={formData.errors.cnpjCpf}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth required>
          <InputLabel>Tipo de Licença</InputLabel>
          <Select
            value={formData.tipoLicenca}
            label="Tipo de Licença"
            onChange={(e) => handleInputChange('tipoLicenca', e.target.value)}
          >
            <MenuItem value="freemium">Freemium (Gratuita)</MenuItem>
            <MenuItem value="premium">Premium (Paga)</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Chave de Licença"
          value={formData.chaveLicenca}
          InputProps={{
            readOnly: true,
          }}
          helperText="Gerada automaticamente"
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
          Dados do Responsável
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Nome *"
          value={formData.responsavel.nome}
          onChange={(e) => handleNestedInputChange('responsavel', 'nome', e.target.value)}
          error={!!formData.errors['responsavel.nome']}
          helperText={formData.errors['responsavel.nome']}
          required
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Email *"
          type="email"
          value={formData.responsavel.email}
          onChange={(e) => handleNestedInputChange('responsavel', 'email', e.target.value)}
          error={!!formData.errors['responsavel.email']}
          helperText={formData.errors['responsavel.email']}
          required
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Telefone"
          value={formData.responsavel.telefone}
          onChange={(e) => handleNestedInputChange('responsavel', 'telefone', e.target.value)}
        />
      </Grid>
    </Grid>
  );

  const renderConfiguracoes = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Configurações
        </Typography>
        <Divider sx={{ mb: 3 }} />
      </Grid>

      {/* WhatsApp */}
      <Grid item xs={12}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              <WhatsApp sx={{ mr: 1, verticalAlign: 'middle' }} />
              Integração WhatsApp
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Token WhatsApp"
                  value={formData.whatsapp.token}
                  onChange={(e) => handleNestedInputChange('whatsapp', 'token', e.target.value)}
                  helperText="Token de acesso da API WhatsApp"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" gap={2} alignItems="center">
                  <Button
                    variant="outlined"
                    startIcon={<QrCode />}
                    onClick={generateWhatsAppQR}
                    disabled={saving}
                  >
                    Gerar QR Code
                  </Button>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.whatsapp.status}
                        onChange={(e) => handleNestedInputChange('whatsapp', 'status', e.target.checked)}
                      />
                    }
                    label="Ativo"
                  />
                </Box>
              </Grid>
              {formData.whatsapp.qrCode && (
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      QR Code WhatsApp
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      {/* Aqui seria renderizado o QR Code */}
                      <Box
                        sx={{
                          width: 200,
                          height: 200,
                          bgcolor: 'grey.200',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <QrCode sx={{ fontSize: 60, color: 'grey.500' }} />
                        <Typography variant="caption" sx={{ mt: 1 }}>
                          QR Code Preview
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Grid>

      {/* APIs */}
      <Grid item xs={12}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              <Api sx={{ mr: 1, verticalAlign: 'middle' }} />
              APIs e Integrações
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Chave Gemini API"
                  type="password"
                  value={formData.apis.gemini}
                  onChange={(e) => handleNestedInputChange('apis', 'gemini', e.target.value)}
                />
                <Button
                  size="small"
                  onClick={() => testAPIConnection('gemini')}
                  sx={{ mt: 1 }}
                >
                  Testar
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Chave Mailchimp API"
                  type="password"
                  value={formData.apis.mailchimp}
                  onChange={(e) => handleNestedInputChange('apis', 'mailchimp', e.target.value)}
                />
                <Button
                  size="small"
                  onClick={() => testAPIConnection('mailchimp')}
                  sx={{ mt: 1 }}
                >
                  Testar
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Chave Hugging Face API"
                  type="password"
                  value={formData.apis.huggingface}
                  onChange={(e) => handleNestedInputChange('apis', 'huggingface', e.target.value)}
                />
                <Button
                  size="small"
                  onClick={() => testAPIConnection('huggingface')}
                  sx={{ mt: 1 }}
                >
                  Testar
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Grid>

      {/* Templates */}
      <Grid item xs={12}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
              Templates e Configurações
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Template Anamnese"
                  value={formData.templates.anamnese}
                  onChange={(e) => handleNestedInputChange('templates', 'anamnese', e.target.value)}
                  placeholder="JSON ou texto do template de anamnese"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Templates de Mensagens"
                  value={formData.templates.mensagens}
                  onChange={(e) => handleNestedInputChange('templates', 'mensagens', e.target.value)}
                  placeholder="Templates de mensagens automáticas"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Grid>
    </Grid>
  );

  const renderFinanceiro = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          <Payment sx={{ mr: 1, verticalAlign: 'middle' }} />
          Financeiro
        </Typography>
        <Divider sx={{ mb: 3 }} />
      </Grid>

      {/* Plano de Pagamento */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Plano de Pagamento
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Recorrência</InputLabel>
                <Select
                  value={formData.plano.recorrencia}
                  label="Recorrência"
                  onChange={(e) => handleNestedInputChange('plano', 'recorrencia', e.target.value)}
                >
                  <MenuItem value="mensal">Mensal</MenuItem>
                  <MenuItem value="anual">Anual</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={`Valor ${formData.plano.recorrencia === 'anual' ? 'Anual' : 'Mensal'} *`}
                type="number"
                value={formData.plano.valor}
                onChange={(e) => handleNestedInputChange('plano', 'valor', parseFloat(e.target.value) || 0)}
                error={!!formData.errors['plano.valor']}
                helperText={formData.errors['plano.valor']}
                InputProps={{
                  startAdornment: 'R$'
                }}
                required={formData.tipoLicenca === 'premium'}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Total Calculado"
                value={`R$ ${(formData.plano.recorrencia === 'anual' ? formData.plano.valor : formData.plano.valor * 12).toFixed(2)}`}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Dados PIX */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Dados PIX
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Chave PIX"
                value={formData.pix.chave}
                onChange={(e) => handleNestedInputChange('pix', 'chave', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Titular"
                value={formData.pix.titular}
                onChange={(e) => handleNestedInputChange('pix', 'titular', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Banco"
                value={formData.pix.banco}
                onChange={(e) => handleNestedInputChange('pix', 'banco', e.target.value)}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderResumo = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
          Resumo da Licença
        </Typography>
        <Divider sx={{ mb: 3 }} />
      </Grid>

      {/* Resumo dos Dados */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Dados da Licença
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Clínica:</Typography>
            <Typography variant="body1">{formData.nomeClinica || 'Não informado'}</Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">CNPJ/CPF:</Typography>
            <Typography variant="body1">{formData.cnpjCpf || 'Não informado'}</Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Tipo:</Typography>
            <Chip
              label={formData.tipoLicenca === 'premium' ? 'Premium' : 'Freemium'}
              color={formData.tipoLicenca === 'premium' ? 'primary' : 'default'}
              size="small"
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Chave:</Typography>
            <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
              {formData.chaveLicenca || 'Será gerada automaticamente'}
            </Typography>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Responsável
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Nome:</Typography>
            <Typography variant="body1">{formData.responsavel.nome || 'Não informado'}</Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Email:</Typography>
            <Typography variant="body1">{formData.responsavel.email || 'Não informado'}</Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Telefone:</Typography>
            <Typography variant="body1">{formData.responsavel.telefone || 'Não informado'}</Typography>
          </Box>
        </Paper>
      </Grid>

      {/* Resumo Financeiro */}
      {formData.tipoLicenca === 'premium' && (
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Financeiro
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Plano:</Typography>
                  <Typography variant="body1">
                    {formData.plano.recorrencia === 'anual' ? 'Anual' : 'Mensal'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Valor:</Typography>
                  <Typography variant="body1">
                    R$ {formData.plano.valor.toFixed(2)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Anual:</Typography>
                  <Typography variant="body1">
                    R$ {(formData.plano.recorrencia === 'anual' ? formData.plano.valor : formData.plano.valor * 12).toFixed(2)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      )}

      {/* Status das Configurações */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Status das Configurações
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircle color={formData.whatsapp.token ? 'success' : 'disabled'} />
                <Typography variant="body2">
                  WhatsApp: {formData.whatsapp.token ? 'Configurado' : 'Não configurado'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircle color={formData.apis.gemini ? 'success' : 'disabled'} />
                <Typography variant="body2">
                  APIs: {formData.apis.gemini ? 'Configuradas' : 'Não configuradas'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircle color={formData.pix.chave ? 'success' : 'disabled'} />
                <Typography variant="body2">
                  PIX: {formData.pix.chave ? 'Configurado' : 'Não configurado'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => window.history.back()}
          >
            Voltar
          </Button>
          <Typography variant="h4">
            Cadastro de Licença
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
          >
            Limpar
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar Licença'}
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="cadastro-licenca-tabs">
              <Tab
                label="Dados da Licença"
                icon={<Business />}
                iconPosition="start"
              />
              <Tab
                label="Configurações"
                icon={<SettingsIcon />}
                iconPosition="start"
              />
              <Tab
                label="Financeiro"
                icon={<Payment />}
                iconPosition="start"
              />
              <Tab
                label="Resumo"
                icon={<Description />}
                iconPosition="start"
              />
            </Tabs>
          </Box>

          <Box sx={{ mt: 3 }}>
            {activeTab === 0 && renderDadosLicenca()}
            {activeTab === 1 && renderConfiguracoes()}
            {activeTab === 2 && renderFinanceiro()}
            {activeTab === 3 && renderResumo()}
          </Box>
        </CardContent>
      </Card>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
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

export default CadastroLicenca;
