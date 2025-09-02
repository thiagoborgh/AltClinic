import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Fab,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Card,
  CardHeader,
  CardContent
} from '@mui/material';
import {
  Settings as SettingsIcon,
  IntegrationInstructions as IntegrationIcon,
  Business as BusinessIcon,
  Article as TemplateIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
  Backup as BackupIcon,
  CloudDownload as DownloadIcon,
  CloudUpload as UploadIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';

// Importar componentes das seções (comentados temporariamente)
// import IntegracoesExternas from './sections/IntegracoesExternas';
// import ClinicaOperacoes from './sections/ClinicaOperacoes';
// import TemplatesCRM from './sections/TemplatesCRM';
// import SegurancaPrivacidade from './sections/SegurancaPrivacidade';

// Hook para gerenciar configurações
import { useConfiguracoes } from '../../hooks/useConfiguracoes';

// Componente específico para integração WhatsApp
const WhatsAppIntegration = ({ configuracoes, onGerarQR, onVerificarStatus }) => {
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [statusChecking, setStatusChecking] = useState(false);
  
  const whatsapp = configuracoes?.integracoes?.whatsapp || {};
  const isConnected = whatsapp.status === 'conectado';
  const isConnecting = whatsapp.status === 'conectando';
  
  const handleGerarQR = async () => {
    try {
      await onGerarQR();
      setQrModalOpen(true);
    } catch (error) {
      console.error('Erro ao gerar QR:', error);
    }
  };
  
  const handleVerificarStatus = async () => {
    setStatusChecking(true);
    try {
      await onVerificarStatus();
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setStatusChecking(false);
    }
  };
  
  React.useEffect(() => {
    // Verificar status automaticamente a cada 5 segundos se estiver conectando
    if (isConnecting) {
      const interval = setInterval(() => {
        onVerificarStatus();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnecting, onVerificarStatus]);
  
  return (
    <>
      <Card>
        <CardHeader 
          title="WhatsApp Business API" 
          subheader={
            isConnected 
              ? `✅ Conectado: ${whatsapp.numero || 'Número não disponível'}` 
              : '❌ Desconectado'
          }
        />
        <CardContent>
          {isConnected ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="success.main">
                ✅ WhatsApp Conectado!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Número: {whatsapp.numero}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Nome: {whatsapp.nome}
              </Typography>
              <Button 
                variant="outlined" 
                onClick={handleVerificarStatus} 
                disabled={statusChecking}
                sx={{ mt: 2 }}
              >
                {statusChecking ? 'Verificando...' : 'Verificar Status'}
              </Button>
            </Box>
          ) : (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Token da API"
                    value={whatsapp.token || ''}
                    placeholder="Digite o token do WhatsApp Business"
                    type="password"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone Number ID"
                    value={whatsapp.phone_number_id || ''}
                    placeholder="ID do número de telefone"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    variant="contained" 
                    onClick={handleGerarQR}
                    startIcon={<QrCodeIcon />}
                    fullWidth
                  >
                    Gerar QR Code para Conectar
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* Modal do QR Code */}
      <Dialog open={qrModalOpen} onClose={() => setQrModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          📱 Conectar WhatsApp
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {whatsapp.qrCode ? (
              <>
                <img 
                  src={whatsapp.qrCode} 
                  alt="QR Code WhatsApp" 
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  1. Abra o WhatsApp no seu celular
                </Typography>
                <Typography variant="body2">
                  2. Vá em Configurações → Aparelhos conectados
                </Typography>
                <Typography variant="body2">
                  3. Toque em "Conectar um aparelho"
                </Typography>
                <Typography variant="body2">
                  4. Aponte a câmera para este QR Code
                </Typography>
              </>
            ) : (
              <Typography>Gerando QR Code...</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrModalOpen(false)}>Fechar</Button>
          <Button onClick={handleGerarQR} variant="contained">
            Gerar Novo QR
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const ConfiguracoesManager = () => {
  const [tabAtiva, setTabAtiva] = useState(0); // Sempre começar na primeira aba
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const {
    configuracoes,
    loading,
    error,
    salvarConfiguracoes,
    exportarConfiguracoes,
    importarConfiguracoes,
    verificarStatusWhatsApp,
    gerarQRCodeWhatsApp,
    carregarConfiguracoes
  } = useConfiguracoes();

  // Debug: log das configurações
  console.log('🎛️ ConfiguracoesManager - Estado atual:', {
    loading,
    error,
    configuracoes: configuracoes ? Object.keys(configuracoes) : null
  });

  // Abas da configuração
  const abas = [
    {
      label: 'WhatsApp',
      icon: <IntegrationIcon />,
      component: 'whatsapp',
      description: 'Configurações do WhatsApp Business'
    },
    {
      label: 'Integrações',
      icon: <IntegrationIcon />,
      component: 'integracoes',
      description: 'Twilio, Telegram, Mailchimp, SMTP'
    },
    {
      label: 'Inteligência Artificial',
      icon: <TemplateIcon />,
      component: 'ai',
      description: 'Claude, Gemini, Hugging Face'
    },
    {
      label: 'PIX & Pagamentos',
      icon: <BusinessIcon />,
      component: 'pix',
      description: 'Configurações bancárias e PIX'
    },
    {
      label: 'Sistema & CRM',
      icon: <SettingsIcon />,
      component: 'sistema',
      description: 'Configurações gerais e CRM'
    },
    {
      label: 'LGPD & Privacidade',
      icon: <SecurityIcon />,
      component: 'lgpd',
      description: 'Consentimentos e privacidade'
    },
    {
      label: 'E-mail',
      icon: <TemplateIcon />,
      component: 'email',
      description: 'SMTP e Mailchimp'
    }
  ];

  // Carregar configurações na inicialização
  useEffect(() => {
    carregarConfiguracoes();
  }, [carregarConfiguracoes]);

  // Função para salvar todas as configurações
  const handleSalvarConfiguracoes = async () => {
    try {
      await salvarConfiguracoes();
      setSnackbar({
        open: true,
        message: '✅ Configurações salvas com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `❌ Erro ao salvar: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Função para exportar configurações
  const handleExportarConfiguracoes = async () => {
    try {
      const dadosExportacao = await exportarConfiguracoes();
      
      // Criar e baixar arquivo JSON
      const blob = new Blob([JSON.stringify(dadosExportacao, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `configuracoes-saee-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: '📁 Configurações exportadas com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `❌ Erro ao exportar: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Função para importar configurações
  const handleImportarConfiguracoes = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const fileContent = await file.text();
      const configuracaoImportada = JSON.parse(fileContent);
      
      await importarConfiguracoes(configuracaoImportada);
      
      setSnackbar({
        open: true,
        message: '📂 Configurações importadas com sucesso!',
        severity: 'success'
      });
      
      // Recarregar configurações
      carregarConfiguracoes();
    } catch (error) {
      setSnackbar({
        open: true,
        message: `❌ Erro ao importar: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleTabChange = (event, novaTab) => {
    setTabAtiva(novaTab);
  };

  // Renderizar conteúdo da aba ativa
  const renderConteudoAba = () => {
    const componente = abas[tabAtiva]?.component;

    switch (componente) {
      case 'whatsapp':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
              📱 WhatsApp Business
            </Typography>
            <Grid container spacing={3}>
              {/* WhatsApp Business API com QR Code */}
              <Grid item xs={12}>
                <WhatsAppIntegration 
                  configuracoes={configuracoes}
                  onGerarQR={gerarQRCodeWhatsApp}
                  onVerificarStatus={verificarStatusWhatsApp}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Configurações Avançadas" />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="API Token"
                          value={configuracoes?.whatsapp?.api_token || ''}
                          placeholder="Token da API WhatsApp"
                          type="password"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Webhook URL"
                          value={configuracoes?.whatsapp?.webhook_url || ''}
                          placeholder="URL do webhook"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="QR Timeout (segundos)"
                          value={configuracoes?.whatsapp?.qr_timeout || ''}
                          placeholder="120"
                          type="number"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Session Path"
                          value={configuracoes?.whatsapp?.session_path || ''}
                          placeholder="Caminho da sessão"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 'integracoes':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
              🔗 Integrações Externas
            </Typography>
            <Grid container spacing={3}>
              {/* Twilio */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Twilio SMS/Voice" />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Account SID"
                          value={configuracoes?.integracoes?.twilio_account_sid || ''}
                          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          type="password"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Auth Token"
                          value={configuracoes?.integracoes?.twilio_auth_token || ''}
                          placeholder="Token de autenticação"
                          type="password"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="WhatsApp Number"
                          value={configuracoes?.integracoes?.twilio_whatsapp_number || ''}
                          placeholder="+14155238886"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Telegram */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Telegram Bot" />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Bot Token"
                          value={configuracoes?.integracoes?.telegram_bot_token || ''}
                          placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxyz"
                          type="password"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Chat ID"
                          value={configuracoes?.integracoes?.telegram_chat_id || ''}
                          placeholder="-1001234567890"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Status"
                          value={configuracoes?.integracoes?.telegram_ativo ? 'Ativo' : 'Inativo'}
                          disabled
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Mailchimp */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Mailchimp Marketing" />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="API Key"
                          value={configuracoes?.integracoes?.mailchimp_api_key || ''}
                          placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us1"
                          type="password"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Server Prefix"
                          value={configuracoes?.integracoes?.mailchimp_server_prefix || ''}
                          placeholder="us1"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="List ID"
                          value={configuracoes?.integracoes?.mailchimp_list_id || ''}
                          placeholder="xxxxxxxxxx"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="From Name"
                          value={configuracoes?.integracoes?.mailchimp_from_name || ''}
                          placeholder="Sua Clínica"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="From Email"
                          value={configuracoes?.integracoes?.mailchimp_from_email || ''}
                          placeholder="contato@clinica.com"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* SMTP */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="SMTP Email" />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={8}>
                        <TextField
                          fullWidth
                          label="Host SMTP"
                          value={configuracoes?.integracoes?.smtp_host || ''}
                          placeholder="smtp.gmail.com"
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          label="Porta"
                          value={configuracoes?.integracoes?.smtp_port || ''}
                          placeholder="587"
                          type="number"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Usuário"
                          value={configuracoes?.integracoes?.smtp_user || ''}
                          placeholder="seu-email@gmail.com"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Senha"
                          value={configuracoes?.integracoes?.smtp_password || ''}
                          placeholder="sua-senha-de-app"
                          type="password"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Conexão Segura"
                          value={configuracoes?.integracoes?.smtp_secure ? 'TLS' : 'Não'}
                          disabled
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 'ai':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
              🤖 Inteligência Artificial
            </Typography>
            <Grid container spacing={3}>
              {/* Claude AI */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Claude AI (Anthropic)" />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="API Key"
                          value={configuracoes?.ai?.claude_api_key || ''}
                          placeholder="sk-ant-api03-..."
                          type="password"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Modelo"
                          value={configuracoes?.ai?.claude_model || ''}
                          placeholder="claude-3-sonnet-20240229"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Max Tokens"
                          value={configuracoes?.ai?.claude_max_tokens || ''}
                          placeholder="4096"
                          type="number"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Status"
                          value={configuracoes?.ai?.claude_ativo ? 'Ativo' : 'Inativo'}
                          disabled
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Google Gemini */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Google Gemini AI" />
                  <CardContent>
                    <TextField
                      fullWidth
                      label="API Key"
                      value={configuracoes?.ai?.gemini_api_key || ''}
                      placeholder="AIzaSy..."
                      type="password"
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Hugging Face */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Hugging Face AI" />
                  <CardContent>
                    <TextField
                      fullWidth
                      label="API Key"
                      value={configuracoes?.ai?.huggingface_api_key || ''}
                      placeholder="hf_..."
                      type="password"
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 'pix':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
              💰 PIX e Configurações Bancárias
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardHeader title="Configurações PIX" />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Chave PIX"
                          value={configuracoes?.pix?.chave_pix || ''}
                          placeholder="email@exemplo.com ou CPF/CNPJ"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Nome do Titular"
                          value={configuracoes?.pix?.nome_titular || ''}
                          placeholder="Nome completo do titular da conta"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Banco"
                          value={configuracoes?.pix?.banco || ''}
                          placeholder="Nome do banco (ex: Itaú, Bradesco)"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 'sistema':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
              ⚙️ Configurações do Sistema
            </Typography>
            <Grid container spacing={3}>
              {/* Configurações Gerais */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Configurações Gerais" />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Ambiente"
                          value={configuracoes?.sistema?.ambiente || ''}
                          placeholder="production, development"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Debug Mode"
                          value={configuracoes?.sistema?.debug_mode ? 'Ativo' : 'Inativo'}
                          disabled
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Log Level"
                          value={configuracoes?.sistema?.log_level || ''}
                          placeholder="info, debug, error"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Max Upload Size (MB)"
                          value={configuracoes?.sistema?.max_upload_size || ''}
                          placeholder="10"
                          type="number"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Configurações CRM */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="CRM e Automação" />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Período de Inatividade (dias)"
                          value={configuracoes?.crm?.periodo_inatividade || ''}
                          placeholder="30"
                          type="number"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Cron Confirmação"
                          value={configuracoes?.sistema?.cron_confirmacao || ''}
                          placeholder="0 9 * * *"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Cron Lembretes"
                          value={configuracoes?.sistema?.cron_lembretes || ''}
                          placeholder="0 18 * * *"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Cron Relatórios"
                          value={configuracoes?.sistema?.cron_relatorios || ''}
                          placeholder="0 6 * * 1"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 'lgpd':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
              🔒 LGPD e Privacidade
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Texto de Consentimento LGPD" />
                  <CardContent>
                    <TextField
                      fullWidth
                      label="Texto do Consentimento"
                      value={configuracoes?.lgpd?.texto_consentimento || ''}
                      placeholder="Autorizo o uso dos meus dados pessoais conforme a Lei Geral de Proteção de Dados..."
                      multiline
                      rows={6}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 'email':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
              📧 Configurações de E-mail
            </Typography>
            <Grid container spacing={3}>
              {/* SMTP */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Servidor SMTP" />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={8}>
                        <TextField
                          fullWidth
                          label="Host SMTP"
                          value={configuracoes?.email?.smtp_host || ''}
                          placeholder="smtp.gmail.com"
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          label="Porta"
                          value={configuracoes?.email?.smtp_port || ''}
                          placeholder="587"
                          type="number"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Mailchimp */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Mailchimp" />
                  <CardContent>
                    <TextField
                      fullWidth
                      label="API Key"
                      value={configuracoes?.email?.mailchimp_api_key || ''}
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us1"
                      type="password"
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return <Typography>Seção não encontrada</Typography>;
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 2 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <SettingsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" gutterBottom>
              Configurações do Sistema
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Hub administrativo para personalizar integrações, operações e segurança
            </Typography>
          </Box>
        </Box>

        {/* Indicador de carregamento */}
        {loading && <LinearProgress sx={{ mt: 2 }} />}

        {/* Alertas de erro */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Navegação por abas */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabAtiva}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {abas.map((aba, index) => (
            <Tab
              key={index}
              icon={aba.icon}
              label={
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {aba.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {aba.description}
                  </Typography>
                </Box>
              }
              iconPosition="start"
              sx={{ 
                minHeight: 80,
                alignItems: 'flex-start',
                textAlign: 'left'
              }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Conteúdo principal */}
      <Box sx={{ flex: 1, overflow: 'auto', pb: 10 }}>
        {renderConteudoAba()}
      </Box>

      {/* FAB para salvar */}
      <Fab
        color="primary"
        aria-label="salvar configurações"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        onClick={handleSalvarConfiguracoes}
        disabled={loading}
      >
        <SaveIcon />
      </Fab>

      {/* FAB para backup */}
      <Fab
        color="secondary"
        aria-label="backup configurações"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setBackupModalOpen(true)}
      >
        <BackupIcon />
      </Fab>

      {/* Modal de Backup */}
      <Dialog open={backupModalOpen} onClose={() => setBackupModalOpen(false)}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <BackupIcon />
            Backup das Configurações
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Gerencie seus backups de configuração para garantir a segurança dos dados.
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={2} mt={3}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportarConfiguracoes}
              fullWidth
            >
              Exportar Configurações Atuais
            </Button>
            
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              fullWidth
            >
              Importar Configurações
              <input
                type="file"
                accept=".json"
                hidden
                onChange={handleImportarConfiguracoes}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupModalOpen(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificações */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ConfiguracoesManager;
