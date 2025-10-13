import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  WhatsApp,
  QrCode,
  CheckCircle,
  Error,
  Upgrade,
  Message,
  Settings,
  BarChart,
  History,
  TrendingUp,
  Schedule
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import useWhatsAppMetaAPI from '../../hooks/whatsapp/useWhatsAppMetaAPI';

const WhatsAppIntegration = () => {
  const { user } = useAuth();
  const {
    loading,
    activateWhatsApp,
    getUsage,
    upgradePlan,
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    previewTemplate
  } = useWhatsAppMetaAPI();
  const [usage, setUsage] = useState(null);
  const [activationStatus, setActivationStatus] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [upgradeDialog, setUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [usageHistory, setUsageHistory] = useState([]);

  // Estados para configuração da Meta API
  const [metaConfig, setMetaConfig] = useState({
    waAppId: '',
    waSystemUserToken: '',
    waWebhookVerifyToken: '',
    waBusinessAccountId: ''
  });
  const [currentConfig, setCurrentConfig] = useState(null);

  // Estados para templates
  const [templates, setTemplates] = useState([]);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    nome: '',
    tipo: 'lembrete',
    titulo: '',
    conteudo: ''
  });
  const [previewData, setPreviewData] = useState({
    nome_paciente: 'João Silva',
    data_agendamento: '25/09/2025 14:30',
    procedimento: 'Limpeza de Pele',
    preparo: 'Jejum de 8 horas',
    dias_inativos: '30'
  });
  const [previewResult, setPreviewResult] = useState(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({ open: false, templateId: null });

  // Planos disponíveis
  const plans = {
    trial: { name: 'Trial', messages: 100, price: 0 },
    starter: { name: 'Starter', messages: 500, price: 29.90 },
    professional: { name: 'Professional', messages: 2500, price: 99.90 },
    enterprise: { name: 'Enterprise', messages: 10000, price: 299.90 }
  };

  // Carregar status do WhatsApp
  const loadWhatsAppStatus = useCallback(async () => {
    try {
      const usageData = await getUsage();
      setUsage(usageData);

      // Carregar configuração da Meta API
      const configResponse = await fetch('/api/whatsapp/configuration', {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'X-Tenant-Slug': user?.tenantSlug
        }
      });

      if (configResponse.ok) {
        const configData = await configResponse.json();
        setCurrentConfig(configData);
      }

      setActivationStatus(usageData ? 'active' : 'not_activated');
    } catch (error) {
      console.error('Erro ao carregar status WhatsApp:', error);
      setActivationStatus('not_activated');
    }
  }, [getUsage, user]);

  // Configurar credenciais da Meta API
  const handleConfigureMeta = async () => {
    try {
      const response = await fetch('/api/whatsapp/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
          'X-Tenant-Slug': user?.tenantSlug
        },
        body: JSON.stringify({
          waAppId: metaConfig.waAppId,
          waSystemUserToken: metaConfig.waSystemUserToken,
          waWebhookVerifyToken: metaConfig.waWebhookVerifyToken,
          waBusinessAccountId: metaConfig.waBusinessAccountId,
          phoneNumber: phoneNumber
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Credenciais configuradas com sucesso!');
        loadWhatsAppStatus(); // Recarregar status
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      console.error('Erro ao configurar Meta API:', error);
      alert('Erro ao configurar credenciais. Tente novamente.');
    }
  };

  // ==================== FUNÇÕES DE TEMPLATES ====================

  // Carregar templates
  const loadTemplates = useCallback(async () => {
    try {
      const templatesData = await getTemplates();
      setTemplates(templatesData || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      setTemplates([]);
    }
  }, [getTemplates]);

  // Abrir dialog para criar template
  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      nome: '',
      tipo: 'lembrete',
      titulo: '',
      conteudo: ''
    });
    setTemplateDialog(true);
  };

  // Abrir dialog para editar template
  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      nome: template.nome,
      tipo: template.tipo,
      titulo: template.titulo,
      conteudo: template.conteudo
    });
    setTemplateDialog(true);
  };

  // Salvar template
  const handleSaveTemplate = async () => {
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, templateForm);
      } else {
        await createTemplate(templateForm);
      }
      setTemplateDialog(false);
      loadTemplates();
    } catch (error) {
      alert('Erro ao salvar template: ' + error.message);
    }
  };

  // Abrir dialog de confirmação para deletar
  const handleDeleteTemplate = (templateId) => {
    setDeleteConfirmDialog({ open: true, templateId });
  };

  // Confirmar exclusão
  const confirmDeleteTemplate = async () => {
    try {
      await deleteTemplate(deleteConfirmDialog.templateId);
      setDeleteConfirmDialog({ open: false, templateId: null });
      loadTemplates();
    } catch (error) {
      alert('Erro ao deletar template: ' + error.message);
    }
  };

  // Gerar preview
  const handlePreviewTemplate = async (template) => {
    try {
      const result = await previewTemplate(template.id, previewData);
      setPreviewResult(result);
    } catch (error) {
      alert('Erro ao gerar preview: ' + error.message);
    }
  };

  // Carregar templates quando a aba for ativada
  useEffect(() => {
    if (activeTab === 2) {
      loadTemplates();
    }
  }, [activeTab, loadTemplates]);

  useEffect(() => {
    loadWhatsAppStatus();
  }, [loadWhatsAppStatus]);

  const handleActivate = async () => {
    if (!phoneNumber.match(/^\+55\d{10,11}$/)) {
      alert('Número inválido. Use o formato +55DDDXXXX.');
      return;
    }

    try {
      const data = await activateWhatsApp(phoneNumber);
      setActivationStatus('pending_qr');
      setQrCode(data.qrUrl);
      alert('Número registrado! Escaneie o QR Code no WhatsApp Business para completar a ativação.');
    } catch (error) {
      console.error('Erro ao ativar WhatsApp:', error);
      alert(error.message || 'Erro interno do servidor');
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    try {
      await upgradePlan(selectedPlan);
      alert('Plano atualizado com sucesso!');
      setUpgradeDialog(false);
      loadWhatsAppStatus();
    } catch (error) {
      console.error('Erro ao fazer upgrade:', error);
      alert(error.message || 'Erro interno do servidor');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending_qr': return 'warning';
      case 'blocked': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending_qr': return 'Aguardando QR Code';
      case 'blocked': return 'Bloqueado - Limite excedido';
      case 'not_activated': return 'Não ativado';
      default: return 'Desconhecido';
    }
  };

  const usagePercentage = usage ? (usage.used / usage.limit) * 100 : 0;
  const isNearLimit = usagePercentage > 80;
  const isBlocked = usage && usage.used >= usage.limit;

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <WhatsApp color="success" sx={{ fontSize: 32 }} />
          <Typography variant="h5">WhatsApp Business API</Typography>
          {activationStatus && (
            <Chip
              label={getStatusText(activationStatus)}
              color={getStatusColor(activationStatus)}
              icon={activationStatus === 'active' ? <CheckCircle /> : <Error />}
            />
          )}
        </Box>

        {activationStatus === 'active' && !isBlocked && (
          <Button
            variant="contained"
            startIcon={<Upgrade />}
            onClick={() => setUpgradeDialog(true)}
          >
            Upgrade Plano
          </Button>
        )}
      </Box>

      {/* Alertas */}
      {isBlocked && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>Limite de mensagens excedido!</strong> Faça upgrade do plano para continuar enviando mensagens.
        </Alert>
      )}

      {isNearLimit && !isBlocked && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Você está próximo do limite mensal. Considere fazer upgrade.
        </Alert>
      )}

      {/* Status e Uso */}
      {usage && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Uso Mensal - {plans[usage.planType]?.name || usage.planType}
            </Typography>

            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">
                  {usage.used} / {usage.limit} mensagens
                </Typography>
                <Typography variant="body2">
                  {usagePercentage.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(usagePercentage, 100)}
                color={isBlocked ? 'error' : isNearLimit ? 'warning' : 'success'}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            <Typography variant="body2" color="textSecondary">
              Próximo reset: {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('pt-BR')}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Ativação */}
      {activationStatus === 'not_activated' && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Configuração da Meta API
          </Typography>

          <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 3 }}>
            Primeiro, configure suas credenciais da Meta WhatsApp Business API. Cada clínica precisa de sua própria conta.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="WA_APP_ID"
                placeholder="1234567890123456"
                value={metaConfig.waAppId}
                onChange={(e) => setMetaConfig(prev => ({ ...prev, waAppId: e.target.value }))}
                helperText="App ID do Facebook Developers"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="WA_WEBHOOK_VERIFY_TOKEN"
                placeholder="altclinic_webhook_verify_2025"
                value={metaConfig.waWebhookVerifyToken}
                onChange={(e) => setMetaConfig(prev => ({ ...prev, waWebhookVerifyToken: e.target.value }))}
                helperText="Token personalizado para webhooks"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="WA_SYSTEM_USER_TOKEN"
                placeholder="EAAKk8xYZ...[token completo]"
                value={metaConfig.waSystemUserToken}
                onChange={(e) => setMetaConfig(prev => ({ ...prev, waSystemUserToken: e.target.value }))}
                helperText="System User Access Token (será criptografado)"
                type="password"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="WA_BUSINESS_ACCOUNT_ID (Opcional)"
                placeholder="123456789012345"
                value={metaConfig.waBusinessAccountId}
                onChange={(e) => setMetaConfig(prev => ({ ...prev, waBusinessAccountId: e.target.value }))}
                helperText="ID da conta business (opcional)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Número do WhatsApp"
                placeholder="+5511999999999"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                helperText="Número que será usado no WhatsApp Business"
              />
            </Grid>
          </Grid>

          <Box mt={3} display="flex" gap={2}>
            <Button
              variant="outlined"
              onClick={handleConfigureMeta}
              disabled={loading || !metaConfig.waAppId || !metaConfig.waSystemUserToken || !metaConfig.waWebhookVerifyToken || !phoneNumber}
              startIcon={loading ? <CircularProgress size={20} /> : <Settings />}
            >
              {loading ? 'Configurando...' : 'Salvar Credenciais'}
            </Button>
            <Button
              variant="contained"
              onClick={handleActivate}
              disabled={loading || !phoneNumber || !currentConfig?.configured}
              startIcon={loading ? <CircularProgress size={20} /> : <QrCode />}
            >
              {loading ? 'Ativando...' : 'Ativar WhatsApp'}
            </Button>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Como obter essas credenciais:</strong>
              <br />
              1. Crie um app no Facebook Developers
              <br />
              2. Adicione o produto WhatsApp
              <br />
              3. Configure webhook e obtenha tokens
              <br />
              4. Adicione e verifique seu número
              <br />
              <a href="/WHATSAPP_META_SETUP.md" target="_blank" rel="noopener noreferrer">
                Ver guia completo →
              </a>
            </Typography>
          </Alert>
        </Paper>
      )}

      {/* QR Code */}
      {activationStatus === 'pending_qr' && qrCode && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Escaneie o QR Code
          </Typography>

          <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 3 }}>
            Abra o WhatsApp Business no seu celular e escaneie o código abaixo para completar a ativação.
          </Typography>

          <Box
            component="img"
            src={qrCode}
            alt="QR Code WhatsApp"
            sx={{ maxWidth: 200, maxHeight: 200, border: '1px solid #ccc', borderRadius: 1 }}
          />

          <Button
            variant="outlined"
            onClick={loadWhatsAppStatus}
            sx={{ mt: 2 }}
            startIcon={<CheckCircle />}
          >
            Verificar Status
          </Button>
        </Paper>
      )}

      {/* Dashboard com Tabs */}
      {activationStatus === 'active' && (
        <Paper sx={{ mt: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab icon={<BarChart />} label="Visão Geral" />
            <Tab icon={<History />} label="Histórico" />
            <Tab icon={<Message />} label="Templates" />
            <Tab icon={<Settings />} label="Configurações" />
          </Tabs>

          {/* Tab Visão Geral */}
          {activeTab === 0 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Visão Geral do WhatsApp
              </Typography>

              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Message color="primary" />
                        <Typography variant="h6">Mensagens Enviadas</Typography>
                      </Box>
                      <Typography variant="h3" color="primary">
                        {usage?.used || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        de {usage?.limit || 0} mensagens
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1}>
                        <TrendingUp color="success" />
                        <Typography variant="h6">Taxa de Sucesso</Typography>
                      </Box>
                      <Typography variant="h3" color="success.main">
                        98.5%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        mensagens entregues
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Schedule color="warning" />
                        <Typography variant="h6">Próximo Reset</Typography>
                      </Box>
                      <Typography variant="h5">
                        {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('pt-BR')}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {Math.ceil((new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1) - new Date()) / (1000 * 60 * 60 * 24))} dias restantes
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                Funcionalidades Disponíveis
              </Typography>

              <List>
                <ListItem>
                  <ListItemIcon><Message /></ListItemIcon>
                  <ListItemText
                    primary="Mensagens Automáticas"
                    secondary="Lembretes de consulta, confirmações e follow-ups"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Settings /></ListItemIcon>
                  <ListItemText
                    primary="Integração com CRM"
                    secondary="Sincronização automática com o sistema de pacientes"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle /></ListItemIcon>
                  <ListItemText
                    primary="Relatórios de Entrega"
                    secondary="Acompanhe o status de todas as mensagens enviadas"
                  />
                </ListItem>
              </List>
            </Box>
          )}

          {/* Tab Histórico */}
          {activeTab === 1 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Histórico de Uso
              </Typography>

              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Mês/Ano</TableCell>
                      <TableCell align="right">Mensagens Enviadas</TableCell>
                      <TableCell align="right">Limite</TableCell>
                      <TableCell align="right">Taxa de Uso</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Dados mockados - implementar busca real depois */}
                    <TableRow>
                      <TableCell>Agosto 2025</TableCell>
                      <TableCell align="right">0</TableCell>
                      <TableCell align="right">100</TableCell>
                      <TableCell align="right">0%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Setembro 2025</TableCell>
                      <TableCell align="right">{usage?.used || 0}</TableCell>
                      <TableCell align="right">{usage?.limit || 100}</TableCell>
                      <TableCell align="right">
                        {usage ? Math.round((usage.used / usage.limit) * 100) : 0}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Tab Templates */}
          {activeTab === 2 && (
            <Box sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <div>
                  <Typography variant="h6" gutterBottom>
                    Templates de Mensagens
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Personalize as mensagens automáticas enviadas pelo sistema
                  </Typography>
                </div>
                <Button
                  variant="contained"
                  startIcon={<Message />}
                  onClick={handleCreateTemplate}
                >
                  Novo Template
                </Button>
              </Box>

              <Alert severity="info" sx={{ mb: 3 }}>
                Templates permitem personalizar lembretes, confirmações e mensagens automáticas.
                Use placeholders como <code>{'{nome_paciente}'}</code>, <code>{'{data_agendamento}'}</code>, etc.
              </Alert>

              {/* Lista de Templates */}
              <Grid container spacing={2}>
                {templates.map((template) => (
                  <Grid item xs={12} md={6} key={template.id}>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <div>
                            <Typography variant="h6">{template.nome}</Typography>
                            <Chip
                              label={template.tipo}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </div>
                          <Box>
                            <Button
                              size="small"
                              onClick={() => handlePreviewTemplate(template)}
                              sx={{ mr: 1 }}
                            >
                              Preview
                            </Button>
                            <Button
                              size="small"
                              onClick={() => handleEditTemplate(template)}
                              sx={{ mr: 1 }}
                            >
                              Editar
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              Excluir
                            </Button>
                          </Box>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Título:</strong> {template.titulo}
                        </Typography>

                        <Typography variant="body2" sx={{
                          backgroundColor: 'grey.50',
                          p: 1,
                          borderRadius: 1,
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                          maxHeight: 100,
                          overflow: 'hidden'
                        }}>
                          {template.conteudo.length > 150
                            ? template.conteudo.substring(0, 150) + '...'
                            : template.conteudo
                          }
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {templates.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Message sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Nenhum template encontrado
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Crie seu primeiro template para personalizar as mensagens automáticas
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Message />}
                    onClick={handleCreateTemplate}
                  >
                    Criar Primeiro Template
                  </Button>
                </Box>
              )}

              {/* Preview Dialog */}
              <Dialog
                open={!!previewResult}
                onClose={() => setPreviewResult(null)}
                maxWidth="sm"
                fullWidth
              >
                <DialogTitle>Preview do Template</DialogTitle>
                <DialogContent>
                  <Typography variant="h6" gutterBottom>
                    {previewResult?.titulo}
                  </Typography>
                  <Typography
                    sx={{
                      backgroundColor: 'grey.50',
                      p: 2,
                      borderRadius: 1,
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace'
                    }}
                  >
                    {previewResult?.conteudo}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    <strong>Dados usados no preview:</strong>
                  </Typography>
                  <Box component="pre" sx={{ fontSize: '0.75rem', mt: 1 }}>
                    {JSON.stringify(previewData, null, 2)}
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setPreviewResult(null)}>Fechar</Button>
                </DialogActions>
              </Dialog>
            </Box>
          )}

          {/* Tab Configurações */}
          {activeTab === 3 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Configurações do WhatsApp
              </Typography>

              <List>
                <ListItem>
                  <ListItemText
                    primary="Plano Atual"
                    secondary={`${plans[usage?.planType || 'trial']?.name} - ${plans[usage?.planType || 'trial']?.messages} mensagens/mês`}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<Upgrade />}
                    onClick={() => setUpgradeDialog(true)}
                  >
                    Fazer Upgrade
                  </Button>
                </ListItem>
              </List>
            </Box>
          )}
        </Paper>
      )}

      {/* Dialog de Upgrade */}
      <Dialog open={upgradeDialog} onClose={() => setUpgradeDialog(false)} maxWidth="md">
        <DialogTitle>Fazer Upgrade do Plano WhatsApp</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Escolha o plano que melhor atende suas necessidades:
          </Typography>

          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={2} mt={2}>
            {Object.entries(plans).map(([key, plan]) => (
              <Card
                key={key}
                sx={{
                  cursor: 'pointer',
                  border: selectedPlan === key ? '2px solid #1976d2' : '1px solid #e0e0e0',
                  transition: 'all 0.2s'
                }}
                onClick={() => setSelectedPlan(key)}
              >
                <CardContent>
                  <Typography variant="h6">{plan.name}</Typography>
                  <Typography variant="h4" color="primary">
                    R$ {plan.price.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {plan.messages.toLocaleString()} mensagens/mês
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleUpgrade}
            variant="contained"
            disabled={!selectedPlan || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Upgrade />}
          >
            {loading ? 'Processando...' : 'Fazer Upgrade'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Template */}
      <Dialog
        open={templateDialog}
        onClose={() => setTemplateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingTemplate ? 'Editar Template' : 'Novo Template'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome do Template"
                value={templateForm.nome}
                onChange={(e) => setTemplateForm({...templateForm, nome: e.target.value})}
                placeholder="Ex: Lembrete de Consulta"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={templateForm.tipo}
                  onChange={(e) => setTemplateForm({...templateForm, tipo: e.target.value})}
                  label="Tipo"
                >
                  <MenuItem value="lembrete">Lembrete</MenuItem>
                  <MenuItem value="confirmacao">Confirmação</MenuItem>
                  <MenuItem value="inativo">Reativação</MenuItem>
                  <MenuItem value="proposta">Proposta</MenuItem>
                  <MenuItem value="pos_atendimento">Pós-Atendimento</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título da Mensagem"
                value={templateForm.titulo}
                onChange={(e) => setTemplateForm({...templateForm, titulo: e.target.value})}
                placeholder="Ex: Lembrete de Consulta"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Conteúdo da Mensagem"
                value={templateForm.conteudo}
                onChange={(e) => setTemplateForm({...templateForm, conteudo: e.target.value})}
                placeholder={`Ex: ⏰ *Lembrete de Consulta*

Olá {nome_paciente}!

Lembrando seu agendamento:
📅 Data: {data_agendamento}
💆‍♀️ Procedimento: {procedimento}

Nos vemos em breve! 😊`}
                helperText="Use placeholders como {nome_paciente}, {data_agendamento}, {procedimento}, etc."
              />
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Placeholders disponíveis:</strong><br />
            <code>{'{nome_paciente}'}</code> - Nome do paciente<br />
            <code>{'{data_agendamento}'}</code> - Data e hora do agendamento<br />
            <code>{'{procedimento}'}</code> - Nome do procedimento<br />
            <code>{'{preparo}'}</code> - Instruções de preparo<br />
            <code>{'{dias_inativos}'}</code> - Dias sem atendimento
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleSaveTemplate}
            variant="contained"
            disabled={loading || !templateForm.nome || !templateForm.conteudo}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Salvando...' : 'Salvar Template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog
        open={deleteConfirmDialog.open}
        onClose={() => setDeleteConfirmDialog({ open: false, templateId: null })}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialog({ open: false, templateId: null })}>
            Cancelar
          </Button>
          <Button
            onClick={confirmDeleteTemplate}
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WhatsAppIntegration;