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
  CardContent,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  IntegrationInstructions as IntegrationIcon,
  Article as TemplateIcon,
  Security as SecurityIcon,
  Backup as BackupIcon,
  CloudDownload as DownloadIcon,
  CloudUpload as UploadIcon,
  QrCode as QrCodeIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import MessageTemplatesManager from '../common/MessageTemplatesManager';
import api from '../../services/api';

// Hook para gerenciar configurações
const useConfiguracoes = () => {
  const [configuracoes, setConfiguracoes] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const salvarConfiguracoes = async (novasConfiguracoes) => {
    setLoading(true);
    try {
      // Implementar salvamento das configurações
      console.log('Salvando configurações:', novasConfiguracoes);
      setConfiguracoes(prev => ({ ...prev, ...novasConfiguracoes }));
    } catch (error) {
      setError('Erro ao salvar configurações');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    configuracoes,
    loading,
    error,
    salvarConfiguracoes
  };
};

// Gerenciador de WhatsApp com seletor de tipo
const WhatsAppManager = () => {
  const [tipoWhatsApp, setTipoWhatsApp] = useState('zapi'); // 'zapi' ou 'evolution'

  const handleTipoChange = (event) => {
    setTipoWhatsApp(event.target.value);
  };

  return (
    <Box>
      <Box mb={3}>
        <FormControl fullWidth>
          <InputLabel>Tipo de Integração WhatsApp</InputLabel>
          <Select
            value={tipoWhatsApp}
            label="Tipo de Integração WhatsApp"
            onChange={handleTipoChange}
          >
            <MenuItem value="zapi">Z-API (Recomendado)</MenuItem>
            <MenuItem value="evolution">Evolution/Meta API</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {tipoWhatsApp === 'zapi' && <WhatsAppZAPIManager />}
      {tipoWhatsApp === 'evolution' && <WhatsAppEvolutionManager />}
    </Box>
  );
};

// Gerenciador para Z-API
const WhatsAppZAPIManager = () => {
  const [mode, setMode] = useState('create'); // 'create' or 'configure'
  const [config, setConfig] = useState({
    phoneNumber: '',
    instanceId: '',
    apiToken: '',
    webhookUrl: '',
    status: 'desconectado'
  });
  const [qrCode, setQrCode] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateInstance = async () => {
    if (!config.phoneNumber) {
      alert('Por favor, preencha o número do telefone');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/whatsapp/zapi/activate', {
        phoneNumber: config.phoneNumber,
        webhookUrl: config.webhookUrl
      });

      alert(`Instância criada com sucesso! Instance ID: ${response.data.instanceId}`);
      setConfig(prev => ({ ...prev, instanceId: response.data.instanceId }));

      // Agora pode obter o QR
      await handleGetQR();
    } catch (error) {
      console.error('Erro ao criar instância:', error);
      alert(`Erro: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureInstance = async () => {
    if (!config.instanceId || !config.apiToken) {
      alert('Por favor, preencha Instance ID e API Token');
      return;
    }

    setLoading(true);
    try {
      await api.post('/whatsapp/zapi/activate', {
        instanceId: config.instanceId,
        apiToken: config.apiToken,
        webhookUrl: config.webhookUrl
      });

      alert('Instância configurada com sucesso!');
      await handleGetQR();
    } catch (error) {
      console.error('Erro ao configurar instância:', error);
      alert(`Erro: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateInstance = async () => {
    if (mode === 'create') {
      await handleCreateInstance();
    } else {
      await handleConfigureInstance();
    }
  };

  const handleGetQR = async () => {
    if (!config.instanceId) {
      alert('Por favor, preencha o Instance ID');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/whatsapp/zapi/qr/${config.instanceId}`);
      const data = response.data;
      
      if (data.qrCode) {
        setQrCode(data.qrCode);
        setQrModalOpen(true);
      } else {
        alert(`Erro: ${data.error || 'Não foi possível gerar QR Code'}`);
      }
    } catch (error) {
      console.error('Erro ao gerar QR:', error);
      alert(`Erro: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!config.instanceId) {
      alert('Por favor, preencha o Instance ID');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/whatsapp/zapi/status/${config.instanceId}`);
      const data = response.data;
      
      setConfig(prev => ({ ...prev, status: data.status }));
      alert(`Status: ${data.status}`);
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      alert(`Erro: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const phone = prompt('Digite o número do telefone (com código do país):');
    const message = prompt('Digite a mensagem:');
    
    if (!phone || !message || !config.instanceId) {
      alert('Dados incompletos');
      return;
    }

    setLoading(true);
    try {
      await api.post('/whatsapp/zapi/send', {
        instanceId: config.instanceId,
        phone,
        message
      });

      alert('Mensagem enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert(`Erro: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardHeader 
            title="Z-API WhatsApp Business" 
            subheader="Configuração da integração Z-API"
          />
          <CardContent>
            <Box mb={3}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Modo de Configuração</FormLabel>
                <RadioGroup
                  row
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <FormControlLabel value="create" control={<Radio />} label="Criar Nova Instância" />
                  <FormControlLabel value="configure" control={<Radio />} label="Configurar Instância Existente" />
                </RadioGroup>
              </FormControl>
            </Box>

            <Grid container spacing={2}>
              {mode === 'create' ? (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Número do Telefone"
                    value={config.phoneNumber}
                    onChange={(e) => setConfig(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="+5511999999999"
                    helperText="Número com código do país (ex: +5511999999999)"
                  />
                </Grid>
              ) : (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Instance ID"
                      value={config.instanceId}
                      onChange={(e) => setConfig(prev => ({ ...prev, instanceId: e.target.value }))}
                      placeholder="ID da instância Z-API existente"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="API Token"
                      type="password"
                      value={config.apiToken}
                      onChange={(e) => setConfig(prev => ({ ...prev, apiToken: e.target.value }))}
                      placeholder="Token da API Z-API"
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Webhook URL (opcional)"
                  value={config.webhookUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                  placeholder="https://seusistema.com/webhook/whatsapp"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <PhoneIcon color="primary" />
              <Typography variant="h6">Status da Conexão</Typography>
              <Chip
                label={config.status}
                color={config.status === 'conectado' ? 'success' : 'default'}
                size="small"
              />
            </Box>
            
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="contained"
                onClick={handleActivateInstance}
                disabled={loading}
              >
                {loading ? <CircularProgress size={16} /> : mode === 'create' ? 'Criar Instância' : 'Configurar Instância'}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<QrCodeIcon />}
                onClick={handleGetQR}
                disabled={loading}
              >
                Gerar QR Code
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleCheckStatus}
                disabled={loading}
              >
                Verificar Status
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleSendMessage}
                disabled={loading || config.status !== 'conectado'}
              >
                Testar Envio
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Modal do QR Code */}
      <Dialog 
        open={qrModalOpen} 
        onClose={() => setQrModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <QrCodeIcon />
            Conectar WhatsApp - Z-API
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box textAlign="center" py={2}>
            {qrCode ? (
              <>
                <Box mb={2}>
                  <img 
                    src={qrCode}
                    alt="QR Code WhatsApp Z-API"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </Box>
                <Typography variant="body2" color="textSecondary">
                  1. Abra o WhatsApp no seu celular<br/>
                  2. Vá em Configurações → Aparelhos conectados<br/>
                  3. Toque em "Conectar um aparelho"<br/>
                  4. Aponte a câmera para este QR Code
                </Typography>
              </>
            ) : (
              <Typography>Carregando QR Code...</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrModalOpen(false)}>Fechar</Button>
          <Button onClick={handleGetQR} variant="contained">
            Atualizar QR
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

// Gerenciador para Evolution/Meta API
const WhatsAppEvolutionManager = () => {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState('');
  const [status, setStatus] = useState(null);
  const [formData, setFormData] = useState({
    instanceName: '',
    apiUrl: '',
    apiKey: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Carregar configurações existentes
  const loadConfig = async () => {
    try {
      const response = await api.get('/whatsapp/evolution/config');
      if (response.data.success) {
        setInstances(response.data.instances);
      }
    } catch (error) {
      console.error('Erro ao carregar config Evolution:', error);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Ativar/configurar Evolution API
  const handleActivate = async () => {
    if (!formData.instanceName.trim()) {
      setSnackbar({ open: true, message: 'Nome da instância é obrigatório', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/whatsapp/evolution/activate', formData);
      if (response.data.success) {
        setSnackbar({ open: true, message: response.data.message, severity: 'success' });
        setFormData({ instanceName: '', apiUrl: '', apiKey: '' });
        loadConfig(); // Recarregar lista
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao configurar Evolution API';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Obter QR Code
  const handleGetQR = async () => {
    if (!selectedInstance) {
      setSnackbar({ open: true, message: 'Selecione uma instância', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/whatsapp/evolution/qr/${selectedInstance}`);
      if (response.data.success) {
        setQrCode(response.data.qrCode);
        setSnackbar({ open: true, message: 'QR Code gerado com sucesso', severity: 'success' });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao obter QR Code';
      setSnackbar({ open: true, message, severity: 'error' });
      setQrCode(null);
    } finally {
      setLoading(false);
    }
  };

  // Verificar Status
  const handleCheckStatus = async () => {
    if (!selectedInstance) {
      setSnackbar({ open: true, message: 'Selecione uma instância', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/whatsapp/evolution/status/${selectedInstance}`);
      if (response.data.success) {
        setStatus(response.data);
        setSnackbar({ open: true, message: `Status: ${response.data.status}`, severity: 'info' });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao verificar status';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Configuração */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Configurar Evolution API"
            subheader="Registre uma nova instância Evolution API"
          />
          <CardContent>
            <TextField
              fullWidth
              label="Nome da Instância"
              value={formData.instanceName}
              onChange={(e) => setFormData({...formData, instanceName: e.target.value})}
              margin="normal"
              placeholder="Ex: minha-clinica"
              helperText="Nome único para identificar sua instância"
            />
            <TextField
              fullWidth
              label="URL da API (Opcional)"
              value={formData.apiUrl}
              onChange={(e) => setFormData({...formData, apiUrl: e.target.value})}
              margin="normal"
              placeholder="https://api.evolution.com"
              helperText="URL da API Evolution (se não informado, será solicitado depois)"
            />
            <TextField
              fullWidth
              label="API Key (Opcional)"
              value={formData.apiKey}
              onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
              margin="normal"
              type="password"
              placeholder="Sua chave API Evolution"
              helperText="Chave de API do Evolution (se não informado, será solicitado depois)"
            />
            <Box mt={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleActivate}
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : 'Registrar Instância'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Gerenciamento */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Gerenciar Instâncias"
            subheader="Controle suas instâncias Evolution API"
          />
          <CardContent>
            {instances.length > 0 && (
              <FormControl fullWidth margin="normal">
                <InputLabel>Selecionar Instância</InputLabel>
                <Select
                  value={selectedInstance}
                  onChange={(e) => setSelectedInstance(e.target.value)}
                >
                  {instances.map((instance) => (
                    <MenuItem key={instance.instanceId} value={instance.instanceId}>
                      {instance.instanceName} - {instance.status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Box display="flex" gap={1} mt={2}>
              <Button
                variant="outlined"
                onClick={handleGetQR}
                disabled={loading || !selectedInstance}
                fullWidth
              >
                Obter QR Code
              </Button>
              <Button
                variant="outlined"
                onClick={handleCheckStatus}
                disabled={loading || !selectedInstance}
                fullWidth
              >
                Verificar Status
              </Button>
            </Box>

            {status && (
              <Box mt={2}>
                <Alert severity={status.status === 'connected' ? 'success' : 'warning'}>
                  Status: {status.status}
                  {status.phoneNumber && ` - ${status.phoneNumber}`}
                </Alert>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* QR Code */}
      {qrCode && (
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="QR Code para Conexão"
              subheader="Escaneie com o WhatsApp no seu celular"
            />
            <CardContent>
              <Box 
                display="flex" 
                flexDirection="column"
                alignItems="center"
                p={3}
                sx={{ 
                  minHeight: '450px',
                  justifyContent: 'center'
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: '450px',
                    minHeight: '350px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    p: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <img
                    src={`data:image/png;base64,${qrCode}`}
                    alt="QR Code WhatsApp"
                    style={{ 
                      width: '100%',
                      height: 'auto',
                      maxWidth: 'none',
                      maxHeight: 'none',
                      objectFit: 'contain'
                    }}
                  />
                </Box>
              </Box>
              <Box mt={2}>
                <Alert severity="info">
                  Abra o WhatsApp no seu celular, vá em Configurações {'>'} WhatsApp Web {'>'} Escanear QR Code
                </Alert>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Lista de Instâncias */}
      {instances.length > 0 && (
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Instâncias Configuradas" />
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>API URL</TableCell>
                      <TableCell>Telefone</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {instances.map((instance) => (
                      <TableRow key={instance.instanceId}>
                        <TableCell>{instance.instanceName}</TableCell>
                        <TableCell>
                          <Chip
                            label={instance.status}
                            color={instance.status === 'connected' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{instance.apiUrl}</TableCell>
                        <TableCell>{instance.phoneNumber || 'Não conectado'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({...snackbar, open: false})}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({...snackbar, open: false})}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

// Componente principal do gerenciador de configurações
const ConfiguracoesManager = () => {
  const [tabAtiva, setTabAtiva] = useState(0);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const { loading } = useConfiguracoes();

  const handleTabChange = (event, newValue) => {
    setTabAtiva(newValue);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const renderTabContent = () => {
    switch (tabAtiva) {
      case 0: // WhatsApp
        return <WhatsAppManager />;
      case 1: // Integrações Externas
        return (
          <Alert severity="info">
            Outras integrações externas serão implementadas em breve.
          </Alert>
        );
      case 2: // Horários Profissionais
        return (
          <Alert severity="info" sx={{ mb: 3 }}>
            Para configurar horários específicos de um profissional, acesse o menu "Profissionais Médicos" 
            e edite o profissional desejado.
          </Alert>
        );
      case 3: // Templates e CRM
        return <MessageTemplatesManager />;
      case 4: // Segurança e Privacidade
        return (
          <Alert severity="info">
            Configurações de segurança e privacidade em desenvolvimento.
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {loading && <LinearProgress />}
      
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabAtiva}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            icon={<PhoneIcon />} 
            label="WhatsApp" 
            id="tab-whatsapp"
          />
          <Tab 
            icon={<IntegrationIcon />} 
            label="Integrações Externas" 
            id="tab-integracoes"
          />
          <Tab 
            icon={<ScheduleIcon />} 
            label="Horários Profissionais" 
            id="tab-operacoes"
          />
          <Tab 
            icon={<TemplateIcon />} 
            label="Templates e CRM" 
            id="tab-templates"
          />
          <Tab 
            icon={<SecurityIcon />} 
            label="Segurança e Privacidade" 
            id="tab-seguranca"
          />
        </Tabs>
      </Paper>

      <Box sx={{ py: 2 }}>
        {renderTabContent()}
      </Box>

      {/* Snackbar para notificações */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Botão flutuante para backup */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setBackupModalOpen(true)}
      >
        <BackupIcon />
      </Fab>

      {/* Modal de backup */}
      <Dialog
        open={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Backup e Restauração</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Faça backup das suas configurações ou restaure de um backup anterior.
          </Typography>
          <Box display="flex" gap={2} flexDirection="column">
            <Button startIcon={<DownloadIcon />} variant="outlined">
              Fazer Backup
            </Button>
            <Button startIcon={<UploadIcon />} variant="outlined">
              Restaurar Backup
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupModalOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConfiguracoesManager;