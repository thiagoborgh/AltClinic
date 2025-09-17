import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Tabs,
  Tab,
  Chip,
  Switch,
  FormControlLabel,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Security,
  Api,
  Message,
  Settings,
  Phone,
  QrCode,
  Visibility,
  VisibilityOff,
  AttachMoney
} from '@mui/icons-material';

const Configuracoes = () => {
  const { licencaId } = useParams();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [licencaInfo, setLicencaInfo] = useState(null);
  const [configuracoes, setConfiguracoes] = useState({});
  const [qrCodeDialog, setQrCodeDialog] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showPasswords, setShowPasswords] = useState({});

  const fetchLicencaData = async () => {
    try {
      // const [licencaRes, configRes] = await Promise.all([
      //   axios.get(`/licencas/${licencaId}`),
      //   axios.get(`/configuracoes/${licencaId}`)
      // ]);
      
      // Dados mock para desenvolvimento
      setLicencaInfo({
        id: licencaId,
        cliente: 'Clínica São Paulo Ltda',
        email: 'contato@clinicasp.com.br',
        plano: 'Premium',
        status: 'ativa',
        dataVencimento: '2025-12-15'
      });

      setConfiguracoes({
        // AI
        claude_api_key: 'sk-ant-xxxxx',
        claude_model: 'claude-3-sonnet-20240229',
        claude_max_tokens: '4000',
        claude_ativo: true,
        gemini_api_key: 'AIzaSyxxxxx',
        huggingface_api_key: 'hf_xxxxx',

        // CRM
        periodo_inatividade: '90',

        // EMAIL
        smtp_host: 'smtp.gmail.com',
        smtp_port: '587',
        smtp_secure: true,
        smtp_user: 'sistema@clinicasp.com.br',
        smtp_password: 'senha123',

        // INTEGRACOES
        twilio_account_sid: 'ACxxxxx',
        twilio_auth_token: 'xxxxx',
        twilio_whatsapp_number: '+5511999999999',
        telegram_bot_token: '123456:ABCxxxxx',
        telegram_chat_id: '-100xxxxxx',
        telegram_ativo: true,
        mailchimp_api_key: 'xxxxx-us1',
        mailchimp_server_prefix: 'us1',
        mailchimp_list_id: 'xxxxxx',
        mailchimp_from_email: 'contato@clinicasp.com.br',
        mailchimp_from_name: 'Clínica São Paulo',
        mailchimp_ativo: true,

        // LGPD
        texto_consentimento: 'Eu autorizo o tratamento dos meus dados pessoais conforme a Lei Geral de Proteção de Dados...',

        // PIX
        chave_pix: 'contato@clinicasp.com.br',
        banco: 'Banco do Brasil',
        nome_titular: 'Clínica São Paulo Ltda',
        pix_cpf_cnpj: '12.345.678/0001-90',
        pix_ativo: true,

        // Gateway Adquirentes
        gateway_stripe_public_key: '',
        gateway_stripe_secret_key: '',
        gateway_stripe_ativo: false,

        gateway_pagseguro_email: '',
        gateway_pagseguro_token: '',
        gateway_pagseguro_ativo: false,

        // Configurações Gerais Financeiras
        moeda_padrao: 'BRL',
        timezone: 'America/Sao_Paulo',
        notificacoes_email: true,
        notificacoes_whatsapp: true,
        ambiente: 'production',
        debug_mode: false,
        log_level: 'info',
        max_upload_size: '10485760',

        // WHATSAPP
        api_token: 'xxxxx',
        auto_init: true,
        qr_timeout: '60000',
        session_path: './sessions',
        webhook_url: 'https://api.clinicasp.com.br/webhook'
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicencaData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [licencaId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // await axios.put(`/configuracoes/${licencaId}`, configuracoes);
      console.log('Configurações salvas:', configuracoes);
      // Mostrar sucesso
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = (section, key, value) => {
    const configKey = `${section}_${key}`;
    setConfiguracoes(prev => ({
      ...prev,
      [configKey]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const generateWhatsAppQR = async () => {
    try {
      // const response = await axios.post(`/whatsapp/${licencaId}/qr`);
      // setQrCodeUrl(response.data.qrCode);
      setQrCodeUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
      setQrCodeDialog(true);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
    }
  };

  const tabLabels = [
    { label: 'Financeiro da Empresa', icon: <AttachMoney /> },
    { label: 'IA & Automação', icon: <Api /> },
    { label: 'Comunicação', icon: <Message /> },
    { label: 'WhatsApp', icon: <Phone /> },
    { label: 'Sistema', icon: <Settings /> },
    { label: 'LGPD', icon: <Security /> }
  ];

  const renderAITab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          🤖 Inteligência Artificial
        </Typography>
      </Grid>
      
      {/* Claude AI */}
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Claude AI (Anthropic)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="API Key"
                  type={showPasswords.claude_api_key ? 'text' : 'password'}
                  value={configuracoes.claude_api_key || ''}
                  onChange={(e) => handleConfigChange('claude', 'api_key', e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={() => togglePasswordVisibility('claude_api_key')}>
                        {showPasswords.claude_api_key ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Modelo"
                  value={configuracoes.claude_model || ''}
                  onChange={(e) => handleConfigChange('claude', 'model', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Tokens"
                  type="number"
                  value={configuracoes.claude_max_tokens || ''}
                  onChange={(e) => handleConfigChange('claude', 'max_tokens', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configuracoes.claude_ativo || false}
                      onChange={(e) => handleConfigChange('claude', 'ativo', e.target.checked)}
                    />
                  }
                  label="Ativo"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Gemini */}
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Google Gemini
            </Typography>
            <TextField
              fullWidth
              label="API Key"
              type={showPasswords.gemini_api_key ? 'text' : 'password'}
              value={configuracoes.gemini_api_key || ''}
              onChange={(e) => handleConfigChange('gemini', 'api_key', e.target.value)}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => togglePasswordVisibility('gemini_api_key')}>
                    {showPasswords.gemini_api_key ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )
              }}
            />
          </CardContent>
        </Card>
      </Grid>

      {/* Hugging Face */}
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Hugging Face
            </Typography>
            <TextField
              fullWidth
              label="API Key"
              type={showPasswords.huggingface_api_key ? 'text' : 'password'}
              value={configuracoes.huggingface_api_key || ''}
              onChange={(e) => handleConfigChange('huggingface', 'api_key', e.target.value)}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => togglePasswordVisibility('huggingface_api_key')}>
                    {showPasswords.huggingface_api_key ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )
              }}
            />
          </CardContent>
        </Card>
      </Grid>

      {/* CRM */}
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              👥 Gestão de Pacientes
            </Typography>
            <TextField
              fullWidth
              label="Período de Inatividade (dias)"
              type="number"
              value={configuracoes.periodo_inatividade || ''}
              onChange={(e) => handleConfigChange('', 'periodo_inatividade', e.target.value)}
              helperText="Tempo para considerar paciente inativo"
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderCommunicationTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          📧 Email & Comunicação
        </Typography>
      </Grid>

      {/* SMTP */}
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Configurações SMTP
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Servidor SMTP"
                  value={configuracoes.smtp_host || ''}
                  onChange={(e) => handleConfigChange('smtp', 'host', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Porta"
                  type="number"
                  value={configuracoes.smtp_port || ''}
                  onChange={(e) => handleConfigChange('smtp', 'port', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configuracoes.smtp_secure || false}
                      onChange={(e) => handleConfigChange('smtp', 'secure', e.target.checked)}
                    />
                  }
                  label="SSL/TLS"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Usuário"
                  value={configuracoes.smtp_user || ''}
                  onChange={(e) => handleConfigChange('smtp', 'user', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Senha"
                  type={showPasswords.smtp_password ? 'text' : 'password'}
                  value={configuracoes.smtp_password || ''}
                  onChange={(e) => handleConfigChange('smtp', 'password', e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={() => togglePasswordVisibility('smtp_password')}>
                        {showPasswords.smtp_password ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    )
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Telegram */}
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Telegram
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bot Token"
                  type={showPasswords.telegram_bot_token ? 'text' : 'password'}
                  value={configuracoes.telegram_bot_token || ''}
                  onChange={(e) => handleConfigChange('telegram', 'bot_token', e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={() => togglePasswordVisibility('telegram_bot_token')}>
                        {showPasswords.telegram_bot_token ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Chat ID"
                  value={configuracoes.telegram_chat_id || ''}
                  onChange={(e) => handleConfigChange('telegram', 'chat_id', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configuracoes.telegram_ativo || false}
                      onChange={(e) => handleConfigChange('telegram', 'ativo', e.target.checked)}
                    />
                  }
                  label="Ativo"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Mailchimp */}
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Mailchimp
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="API Key"
                  type={showPasswords.mailchimp_api_key ? 'text' : 'password'}
                  value={configuracoes.mailchimp_api_key || ''}
                  onChange={(e) => handleConfigChange('mailchimp', 'api_key', e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={() => togglePasswordVisibility('mailchimp_api_key')}>
                        {showPasswords.mailchimp_api_key ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Server Prefix"
                  value={configuracoes.mailchimp_server_prefix || ''}
                  onChange={(e) => handleConfigChange('mailchimp', 'server_prefix', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="List ID"
                  value={configuracoes.mailchimp_list_id || ''}
                  onChange={(e) => handleConfigChange('mailchimp', 'list_id', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Remetente"
                  value={configuracoes.mailchimp_from_email || ''}
                  onChange={(e) => handleConfigChange('mailchimp', 'from_email', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome Remetente"
                  value={configuracoes.mailchimp_from_name || ''}
                  onChange={(e) => handleConfigChange('mailchimp', 'from_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configuracoes.mailchimp_ativo || false}
                      onChange={(e) => handleConfigChange('mailchimp', 'ativo', e.target.checked)}
                    />
                  }
                  label="Ativo"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderWhatsAppTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          📱 WhatsApp Integration
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1">
                Configurações WhatsApp
              </Typography>
              <Button
                variant="outlined"
                startIcon={<QrCode />}
                onClick={generateWhatsAppQR}
              >
                Gerar QR Code
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="API Token"
                  type={showPasswords.api_token ? 'text' : 'password'}
                  value={configuracoes.api_token || ''}
                  onChange={(e) => handleConfigChange('', 'api_token', e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={() => togglePasswordVisibility('api_token')}>
                        {showPasswords.api_token ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Número WhatsApp"
                  value={configuracoes.twilio_whatsapp_number || ''}
                  onChange={(e) => handleConfigChange('twilio', 'whatsapp_number', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Timeout QR (ms)"
                  type="number"
                  value={configuracoes.qr_timeout || ''}
                  onChange={(e) => handleConfigChange('', 'qr_timeout', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Webhook URL"
                  value={configuracoes.webhook_url || ''}
                  onChange={(e) => handleConfigChange('', 'webhook_url', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configuracoes.auto_init || false}
                      onChange={(e) => handleConfigChange('', 'auto_init', e.target.checked)}
                    />
                  }
                  label="Inicialização Automática"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Twilio */}
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Twilio (SMS/WhatsApp Business)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Account SID"
                  value={configuracoes.twilio_account_sid || ''}
                  onChange={(e) => handleConfigChange('twilio', 'account_sid', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Auth Token"
                  type={showPasswords.twilio_auth_token ? 'text' : 'password'}
                  value={configuracoes.twilio_auth_token || ''}
                  onChange={(e) => handleConfigChange('twilio', 'auth_token', e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={() => togglePasswordVisibility('twilio_auth_token')}>
                        {showPasswords.twilio_auth_token ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    )
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderSystemTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          ⚙️ Configurações do Sistema
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Sistema
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Ambiente"
                  value={configuracoes.ambiente || ''}
                  onChange={(e) => handleConfigChange('', 'ambiente', e.target.value)}
                  disabled
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Log Level"
                  value={configuracoes.log_level || ''}
                  onChange={(e) => handleConfigChange('', 'log_level', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Max Upload Size (bytes)"
                  type="number"
                  value={configuracoes.max_upload_size || ''}
                  onChange={(e) => handleConfigChange('', 'max_upload_size', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configuracoes.debug_mode || false}
                      onChange={(e) => handleConfigChange('', 'debug_mode', e.target.checked)}
                    />
                  }
                  label="Modo Debug"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderLGPDTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          🔒 LGPD - Proteção de Dados
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Termo de Consentimento
            </Typography>
            <TextField
              fullWidth
              label="Texto do Consentimento LGPD"
              multiline
              rows={10}
              value={configuracoes.texto_consentimento || ''}
              onChange={(e) => handleConfigChange('', 'texto_consentimento', e.target.value)}
              helperText="Texto que será exibido aos pacientes para consentimento do tratamento de dados"
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderFinanceTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          💰 Configurações Financeiras da Empresa
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure os dados para recebimento de pagamentos dos clientes (clínicas usuárias) via PIX e gateways.
        </Typography>
      </Grid>

      {/* PIX Configuration */}
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              🏦 Configuração PIX
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Dados para geração automática de QR Codes PIX para faturas dos clientes.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Chave PIX"
                  value={configuracoes.chave_pix || ''}
                  onChange={(e) => handleConfigChange('', 'chave_pix', e.target.value)}
                  helperText="Email, telefone, CPF/CNPJ ou chave aleatória"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome do Titular"
                  value={configuracoes.nome_titular || ''}
                  onChange={(e) => handleConfigChange('', 'nome_titular', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="CPF/CNPJ do Titular"
                  value={configuracoes.pix_cpf_cnpj || ''}
                  onChange={(e) => handleConfigChange('', 'pix_cpf_cnpj', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Banco"
                  value={configuracoes.banco || ''}
                  onChange={(e) => handleConfigChange('', 'banco', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configuracoes.pix_ativo || false}
                      onChange={(e) => handleConfigChange('', 'pix_ativo', e.target.checked)}
                    />
                  }
                  label="PIX Ativo"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Gateway Configuration */}
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              💳 Gateway de Pagamento
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Integração com gateways para processamento de cartões de crédito.
            </Typography>
            <Grid container spacing={2}>
              {/* Stripe */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary">
                  Stripe
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Public Key"
                  type={showPasswords.stripe_public_key ? 'text' : 'password'}
                  value={configuracoes.gateway_stripe_public_key || ''}
                  onChange={(e) => handleConfigChange('gateway_stripe', 'public_key', e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={() => togglePasswordVisibility('stripe_public_key')}>
                        {showPasswords.stripe_public_key ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Secret Key"
                  type={showPasswords.stripe_secret_key ? 'text' : 'password'}
                  value={configuracoes.gateway_stripe_secret_key || ''}
                  onChange={(e) => handleConfigChange('gateway_stripe', 'secret_key', e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={() => togglePasswordVisibility('stripe_secret_key')}>
                        {showPasswords.stripe_secret_key ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configuracoes.gateway_stripe_ativo || false}
                      onChange={(e) => handleConfigChange('gateway_stripe', 'ativo', e.target.checked)}
                    />
                  }
                  label="Stripe Ativo"
                />
              </Grid>

              {/* PagSeguro */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="primary">
                  PagSeguro
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={configuracoes.gateway_pagseguro_email || ''}
                  onChange={(e) => handleConfigChange('gateway_pagseguro', 'email', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Token"
                  type={showPasswords.pagseguro_token ? 'text' : 'password'}
                  value={configuracoes.gateway_pagseguro_token || ''}
                  onChange={(e) => handleConfigChange('gateway_pagseguro', 'token', e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={() => togglePasswordVisibility('pagseguro_token')}>
                        {showPasswords.pagseguro_token ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configuracoes.gateway_pagseguro_ativo || false}
                      onChange={(e) => handleConfigChange('gateway_pagseguro', 'ativo', e.target.checked)}
                    />
                  }
                  label="PagSeguro Ativo"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* General Settings */}
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              ⚙️ Configurações Gerais
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Moeda Padrão"
                  value={configuracoes.moeda_padrao || 'BRL'}
                  onChange={(e) => handleConfigChange('', 'moeda_padrao', e.target.value)}
                  select
                >
                  <MenuItem value="BRL">BRL - Real Brasileiro</MenuItem>
                  <MenuItem value="USD">USD - Dólar Americano</MenuItem>
                  <MenuItem value="EUR">EUR - Euro</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Timezone"
                  value={configuracoes.timezone || 'America/Sao_Paulo'}
                  onChange={(e) => handleConfigChange('', 'timezone', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configuracoes.notificacoes_email || false}
                      onChange={(e) => handleConfigChange('', 'notificacoes_email', e.target.checked)}
                    />
                  }
                  label="Notificações por Email"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configuracoes.notificacoes_whatsapp || false}
                      onChange={(e) => handleConfigChange('', 'notificacoes_whatsapp', e.target.checked)}
                    />
                  }
                  label="Notificações por WhatsApp"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Test and Validation Section */}
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              🧪 Testes e Validação
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Teste suas configurações antes de ativar para produção.
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<QrCode />}
                onClick={generateWhatsAppQR}
                disabled={!configuracoes.chave_pix || !configuracoes.pix_ativo}
              >
                Gerar QR Code PIX de Teste
              </Button>
              <Button
                variant="outlined"
                startIcon={<AttachMoney />}
                disabled={!configuracoes.gateway_stripe_ativo && !configuracoes.gateway_pagseguro_ativo}
              >
                Simular Recebimento R$1
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTabContent = () => {
    switch (currentTab) {
      case 0: return renderFinanceTab();
      case 1: return renderAITab();
      case 2: return renderCommunicationTab();
      case 3: return renderWhatsAppTab();
      case 4: return renderSystemTab();
      case 5: return renderLGPDTab();
      default: return renderFinanceTab();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography>Carregando configurações...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/licencas')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box flexGrow={1}>
          <Typography variant="h4">
            Configurações - {licencaInfo?.cliente}
          </Typography>
          <Box display="flex" alignItems="center" mt={1}>
            <Chip label={licencaInfo?.id} size="small" sx={{ mr: 1 }} />
            <Chip 
              label={licencaInfo?.status?.toUpperCase()} 
              color={licencaInfo?.status === 'ativa' ? 'success' : 'warning'} 
              size="small" 
            />
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabLabels.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {/* Content */}
      <Box>
        {renderTabContent()}
      </Box>

      {/* QR Code Dialog */}
      <Dialog open={qrCodeDialog} onClose={() => setQrCodeDialog(false)}>
        <DialogTitle>QR Code WhatsApp</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" alignItems="center" p={2}>
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="QR Code WhatsApp" style={{ maxWidth: 300 }} />
            )}
            <Typography variant="body2" color="text.secondary" mt={2} textAlign="center">
              Escaneie este QR Code com o WhatsApp da clínica para conectar
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrCodeDialog(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Configuracoes;
