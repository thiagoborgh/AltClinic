import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Card,
  CardContent,
  CardHeader,
  InputAdornment,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Pix as PixIcon,
  SmartToy as AIIcon,
  Email as EmailIcon,
  Visibility,
  VisibilityOff,
  TestTube as TestIcon,
  QrCode as QrCodeIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const IntegracoesExternas = ({ configuracoes, onSalvar, onTestar }) => {
  const [senhasVisiveis, setSenhasVisiveis] = useState({});
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [testando, setTestando] = useState({});
  const [resultadosTeste, setResultadosTeste] = useState({});

  const toggleSenhaVisivel = (campo) => {
    setSenhasVisiveis(prev => ({
      ...prev,
      [campo]: !prev[campo]
    }));
  };

  const handleTesteIntegracao = async (tipo, dados) => {
    setTestando(prev => ({ ...prev, [tipo]: true }));
    
    try {
      const resultado = await onTestar(tipo, dados);
      setResultadosTeste(prev => ({
        ...prev,
        [tipo]: { sucesso: true, mensagem: resultado.mensagem }
      }));
    } catch (error) {
      setResultadosTeste(prev => ({
        ...prev,
        [tipo]: { sucesso: false, mensagem: error.message }
      }));
    } finally {
      setTestando(prev => ({ ...prev, [tipo]: false }));
    }
  };

  const getStatusIcon = (tipo) => {
    const resultado = resultadosTeste[tipo];
    if (!resultado) return null;
    
    return resultado.sucesso ? (
      <CheckIcon color="success" />
    ) : (
      <ErrorIcon color="error" />
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'conectado': return 'success';
      case 'conectando': return 'warning';
      case 'erro': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Integrações Externas
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure as integrações com serviços externos para automação e funcionalidades avançadas.
      </Typography>

      <Grid container spacing={3}>
        {/* WhatsApp Integration */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              avatar={<WhatsAppIcon sx={{ color: '#25D366' }} />}
              title="WhatsApp Business API"
              subheader="Automação de mensagens e atendimento via WhatsApp"
              action={
                <Chip
                  label={configuracoes.integracoes?.whatsapp?.status || 'Desconectado'}
                  color={getStatusColor(configuracoes.integracoes?.whatsapp?.status)}
                  size="small"
                />
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Token de Acesso"
                    type={senhasVisiveis.whatsapp_token ? 'text' : 'password'}
                    value={configuracoes.integracoes?.whatsapp?.token || ''}
                    onChange={(e) => {
                      // Implementar atualização
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => toggleSenhaVisivel('whatsapp_token')}
                            edge="end"
                          >
                            {senhasVisiveis.whatsapp_token ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number ID"
                    value={configuracoes.integracoes?.whatsapp?.phone_number_id || ''}
                    onChange={(e) => {
                      // Implementar atualização
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Webhook Verify Token"
                    type={senhasVisiveis.webhook_token ? 'text' : 'password'}
                    value={configuracoes.integracoes?.whatsapp?.webhook_verify_token || ''}
                    onChange={(e) => {
                      // Implementar atualização
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => toggleSenhaVisivel('webhook_token')}
                            edge="end"
                          >
                            {senhasVisiveis.webhook_token ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      startIcon={<QrCodeIcon />}
                      onClick={() => setQrModalOpen(true)}
                      fullWidth
                    >
                      Gerar QR Code
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={testando.whatsapp ? <CircularProgress size={16} /> : <TestIcon />}
                      onClick={() => handleTesteIntegracao('whatsapp', configuracoes.integracoes?.whatsapp)}
                      disabled={testando.whatsapp}
                    >
                      {getStatusIcon('whatsapp')}
                      Testar
                    </Button>
                  </Box>
                </Grid>
                {resultadosTeste.whatsapp && (
                  <Grid item xs={12}>
                    <Alert severity={resultadosTeste.whatsapp.sucesso ? 'success' : 'error'}>
                      {resultadosTeste.whatsapp.mensagem}
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* PIX Integration */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              avatar={<PixIcon sx={{ color: '#00D4AA' }} />}
              title="PIX - Pagamentos"
              subheader="Configure chaves PIX para recebimento de pagamentos"
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Chave PIX</InputLabel>
                    <Select
                      value={configuracoes.integracoes?.pix?.tipo_chave || 'email'}
                      onChange={(e) => {
                        // Implementar atualização
                      }}
                    >
                      <MenuItem value="email">Email</MenuItem>
                      <MenuItem value="telefone">Telefone</MenuItem>
                      <MenuItem value="cpf">CPF</MenuItem>
                      <MenuItem value="cnpj">CNPJ</MenuItem>
                      <MenuItem value="aleatoria">Chave Aleatória</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Chave PIX"
                    value={configuracoes.integracoes?.pix?.chave || ''}
                    onChange={(e) => {
                      // Implementar atualização
                    }}
                    placeholder="Insira sua chave PIX"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Nome do Titular"
                    value={configuracoes.integracoes?.pix?.titular || ''}
                    onChange={(e) => {
                      // Implementar atualização
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Banco"
                    value={configuracoes.integracoes?.pix?.banco || ''}
                    onChange={(e) => {
                      // Implementar atualização
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box display="flex" gap={1}>
                    <TextField
                      label="Agência"
                      value={configuracoes.integracoes?.pix?.agencia || ''}
                      onChange={(e) => {
                        // Implementar atualização
                      }}
                    />
                    <TextField
                      label="Conta"
                      value={configuracoes.integracoes?.pix?.conta || ''}
                      onChange={(e) => {
                        // Implementar atualização
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    startIcon={testando.pix ? <CircularProgress size={16} /> : <TestIcon />}
                    onClick={() => handleTesteIntegracao('pix', configuracoes.integracoes?.pix)}
                    disabled={testando.pix}
                  >
                    {getStatusIcon('pix')}
                    Gerar PIX de Teste
                  </Button>
                </Grid>
                {resultadosTeste.pix && (
                  <Grid item xs={12}>
                    <Alert severity={resultadosTeste.pix.sucesso ? 'success' : 'error'}>
                      {resultadosTeste.pix.mensagem}
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* AI APIs */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<AIIcon sx={{ color: '#4285F4' }} />}
              title="Google Gemini"
              subheader="IA para sugestões e automações"
              action={
                <FormControlLabel
                  control={
                    <Switch
                      checked={configuracoes.integracoes?.gemini?.ativo || false}
                      onChange={(e) => {
                        // Implementar atualização
                      }}
                    />
                  }
                  label="Ativo"
                />
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="API Key"
                    type={senhasVisiveis.gemini_key ? 'text' : 'password'}
                    value={configuracoes.integracoes?.gemini?.api_key || ''}
                    onChange={(e) => {
                      // Implementar atualização
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => toggleSenhaVisivel('gemini_key')}
                            edge="end"
                          >
                            {senhasVisiveis.gemini_key ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Modelo</InputLabel>
                    <Select
                      value={configuracoes.integracoes?.gemini?.modelo || 'gemini-pro'}
                      onChange={(e) => {
                        // Implementar atualização
                      }}
                    >
                      <MenuItem value="gemini-pro">Gemini Pro</MenuItem>
                      <MenuItem value="gemini-pro-vision">Gemini Pro Vision</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    startIcon={testando.gemini ? <CircularProgress size={16} /> : <TestIcon />}
                    onClick={() => handleTesteIntegracao('gemini', configuracoes.integracoes?.gemini)}
                    disabled={testando.gemini}
                    fullWidth
                  >
                    {getStatusIcon('gemini')}
                    Testar IA
                  </Button>
                </Grid>
                {resultadosTeste.gemini && (
                  <Grid item xs={12}>
                    <Alert severity={resultadosTeste.gemini.sucesso ? 'success' : 'error'}>
                      {resultadosTeste.gemini.mensagem}
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Mailchimp */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<EmailIcon sx={{ color: '#FFE01B' }} />}
              title="Email Marketing"
              subheader="Mailchimp e SMTP para emails"
              action={
                <FormControlLabel
                  control={
                    <Switch
                      checked={configuracoes.integracoes?.mailchimp?.ativo || false}
                      onChange={(e) => {
                        // Implementar atualização
                      }}
                    />
                  }
                  label="Ativo"
                />
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Mailchimp API Key"
                    type={senhasVisiveis.mailchimp_key ? 'text' : 'password'}
                    value={configuracoes.integracoes?.mailchimp?.api_key || ''}
                    onChange={(e) => {
                      // Implementar atualização
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => toggleSenhaVisivel('mailchimp_key')}
                            edge="end"
                          >
                            {senhasVisiveis.mailchimp_key ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email Remetente"
                    type="email"
                    value={configuracoes.integracoes?.mailchimp?.from_email || ''}
                    onChange={(e) => {
                      // Implementar atualização
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nome Remetente"
                    value={configuracoes.integracoes?.mailchimp?.from_name || ''}
                    onChange={(e) => {
                      // Implementar atualização
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="Servidor SMTP"
                    value={configuracoes.integracoes?.mailchimp?.smtp_server || ''}
                    onChange={(e) => {
                      // Implementar atualização
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Porta SMTP"
                    type="number"
                    value={configuracoes.integracoes?.mailchimp?.smtp_port || 587}
                    onChange={(e) => {
                      // Implementar atualização
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    startIcon={testando.email ? <CircularProgress size={16} /> : <TestIcon />}
                    onClick={() => handleTesteIntegracao('email', configuracoes.integracoes?.mailchimp)}
                    disabled={testando.email}
                    fullWidth
                  >
                    {getStatusIcon('email')}
                    Testar Email
                  </Button>
                </Grid>
                {resultadosTeste.email && (
                  <Grid item xs={12}>
                    <Alert severity={resultadosTeste.email.sucesso ? 'success' : 'error'}>
                      {resultadosTeste.email.mensagem}
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Modal QR Code WhatsApp */}
      <Dialog open={qrModalOpen} onClose={() => setQrModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <QrCodeIcon />
            QR Code WhatsApp
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box textAlign="center" p={3}>
            {configuracoes.integracoes?.whatsapp?.qrCode ? (
              <Box>
                <img 
                  src={configuracoes.integracoes.whatsapp.qrCode} 
                  alt="QR Code WhatsApp"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
                <Typography variant="body2" color="text.secondary" mt={2}>
                  Escaneie este QR Code com o WhatsApp Business do seu celular
                </Typography>
              </Box>
            ) : (
              <Box>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary" mt={2}>
                  Gerando QR Code...
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default IntegracoesExternas;
