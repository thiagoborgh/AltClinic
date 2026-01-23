import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Divider,
  Avatar
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Message,
  CheckCircle,
  Cancel,
  Preview,
  Save,
  Refresh
} from '@mui/icons-material';
import { useToast } from '../../hooks/useToast';
import { crmService } from '../../services/api';

const MessageTemplatesManager = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'confirmacao',
    mensagem: '',
    ativo: true
  });
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  const tiposTemplates = [
    { value: 'confirmacao', label: 'Confirmação', icon: '✅', color: 'success' },
    { value: 'lembrete', label: 'Lembrete', icon: '⏰', color: 'warning' },
    { value: 'cancelamento', label: 'Cancelamento', icon: '❌', color: 'error' },
    { value: 'reagendamento', label: 'Reagendamento', icon: '🔄', color: 'info' }
  ];

  const variaveisDisponiveis = [
    { chave: '{{nome}}', descricao: 'Nome do paciente' },
    { chave: '{{hora}}', descricao: 'Horário do agendamento' },
    { chave: '{{clinica}}', descricao: 'Nome da clínica' },
    { chave: '{{profissional}}', descricao: 'Nome do profissional' }
  ];

  // Carregar templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await crmService.getTemplates();
      if (response.success) {
        setTemplates(response.data);
      } else {
        showToast('Erro ao carregar templates', 'error');
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      showToast('Erro ao carregar templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultTemplates = async () => {
    try {
      setLoading(true);
      const response = await crmService.seedTemplates();
      if (response.success) {
        showToast(`${response.data.length} templates padrão criados!`, 'success');
        loadTemplates();
      } else {
        showToast('Erro ao criar templates padrão', 'error');
      }
    } catch (error) {
      console.error('Erro ao criar templates padrão:', error);
      showToast('Erro ao criar templates padrão', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        nome: template.nome,
        tipo: template.tipo,
        mensagem: template.mensagem,
        ativo: template.ativo
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        nome: '',
        tipo: 'confirmacao',
        mensagem: '',
        ativo: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setFormData({
      nome: '',
      tipo: 'confirmacao',
      mensagem: '',
      ativo: true
    });
  };

  const handleSave = async () => {
    // Validações
    if (!formData.nome.trim()) {
      showToast('Nome do template é obrigatório', 'warning');
      return;
    }

    if (!formData.mensagem.trim()) {
      showToast('Mensagem é obrigatória', 'warning');
      return;
    }

    if (formData.mensagem.length > 300) {
      showToast('Mensagem deve ter no máximo 300 caracteres', 'warning');
      return;
    }

    try {
      setSaving(true);

      let response;
      if (editingTemplate) {
        response = await crmService.updateTemplate(editingTemplate.id, formData);
      } else {
        response = await crmService.createTemplate(formData);
      }

      if (response.success) {
        showToast(
          editingTemplate ? 'Template atualizado!' : 'Template criado!',
          'success'
        );
        handleCloseDialog();
        loadTemplates();
      } else {
        showToast(response.message || 'Erro ao salvar template', 'error');
      }
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      showToast('Erro ao salvar template', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (template) => {
    if (!window.confirm(`Tem certeza que deseja deletar o template "${template.nome}"?`)) {
      return;
    }

    try {
      const response = await crmService.deleteTemplate(template.id);
      if (response.success) {
        showToast('Template deletado!', 'success');
        loadTemplates();
      } else {
        showToast('Erro ao deletar template', 'error');
      }
    } catch (error) {
      console.error('Erro ao deletar template:', error);
      showToast('Erro ao deletar template', 'error');
    }
  };

  const handleToggleActive = async (template) => {
    try {
      const response = await crmService.updateTemplate(template.id, {
        ativo: !template.ativo
      });

      if (response.success) {
        showToast(
          `Template ${!template.ativo ? 'ativado' : 'desativado'}!`,
          'success'
        );
        loadTemplates();
      } else {
        showToast('Erro ao alterar status', 'error');
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      showToast('Erro ao alterar status', 'error');
    }
  };

  const handlePreview = (template) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const renderPreviewMessage = (template) => {
    if (!template) return '';

    let message = template.mensagem;
    message = message.replace(/\{\{nome\}\}/g, 'Maria Silva');
    message = message.replace(/\{\{hora\}\}/g, '14:30');
    message = message.replace(/\{\{clinica\}\}/g, 'Clínica Bella');
    message = message.replace(/\{\{profissional\}\}/g, 'Dra. Ana');

    return message;
  };

  const getTipoInfo = (tipo) => {
    return tiposTemplates.find(t => t.value === tipo) || tiposTemplates[0];
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById('mensagem-textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.mensagem;
      const newText = text.substring(0, start) + variable + text.substring(end);
      setFormData(prev => ({ ...prev, mensagem: newText }));

      // Restaurar foco e seleção
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            📝 Templates de Mensagens
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Crie e personalize mensagens automáticas para WhatsApp
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadTemplates}
            disabled={loading}
          >
            Atualizar
          </Button>

          {templates.length === 0 && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={createDefaultTemplates}
              disabled={loading}
            >
              Criar Templates Padrão
            </Button>
          )}

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Novo Template
          </Button>
        </Box>
      </Box>

      {loading && templates.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {templates.map((template) => {
            const tipoInfo = getTipoInfo(template.tipo);
            return (
              <Grid item xs={12} md={6} lg={4} key={template.id}>
                <Card sx={{
                  height: '100%',
                  opacity: template.ativo ? 1 : 0.6,
                  border: template.ativo ? 'none' : '1px solid',
                  borderColor: 'divider'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{
                          bgcolor: `${tipoInfo.color}.main`,
                          width: 32,
                          height: 32
                        }}>
                          {tipoInfo.icon}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                            {template.nome}
                          </Typography>
                          <Chip
                            label={tipoInfo.label}
                            size="small"
                            color={tipoInfo.color}
                            variant="outlined"
                          />
                        </Box>
                      </Box>

                      <FormControlLabel
                        control={
                          <Switch
                            checked={template.ativo}
                            onChange={() => handleToggleActive(template)}
                            size="small"
                          />
                        }
                        label=""
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.4
                      }}
                    >
                      {template.mensagem}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title="Visualizar">
                        <IconButton
                          size="small"
                          onClick={() => handlePreview(template)}
                        >
                          <Preview fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(template)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Deletar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(template)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {templates.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
          <Message sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Nenhum template criado ainda
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Crie templates personalizados para suas mensagens automáticas
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Criar Primeiro Template
          </Button>
        </Paper>
      )}

      {/* Dialog de Edição/Criação */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingTemplate ? 'Editar Template' : 'Novo Template'}
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Nome do Template"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Confirmação Padrão"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.tipo}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                  label="Tipo"
                >
                  {tiposTemplates.map((tipo) => (
                    <MenuItem key={tipo.value} value={tipo.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{tipo.icon}</span>
                        {tipo.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Variáveis Disponíveis
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {variaveisDisponiveis.map((variavel) => (
                  <Chip
                    key={variavel.chave}
                    label={`${variavel.chave} - ${variavel.descricao}`}
                    size="small"
                    onClick={() => insertVariable(variavel.chave)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>

              <TextField
                id="mensagem-textarea"
                fullWidth
                multiline
                rows={6}
                label="Mensagem"
                value={formData.mensagem}
                onChange={(e) => setFormData(prev => ({ ...prev, mensagem: e.target.value }))}
                placeholder="Digite sua mensagem aqui..."
                helperText={`${formData.mensagem.length}/300 caracteres`}
                error={formData.mensagem.length > 300}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.ativo}
                    onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                  />
                }
                label="Template ativo"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : <Save />}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Preview */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          📱 Preview da Mensagem
        </DialogTitle>

        <DialogContent>
          {previewTemplate && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {previewTemplate.nome} ({getTipoInfo(previewTemplate.tipo).label})
              </Typography>

              <Paper
                sx={{
                  p: 2,
                  bgcolor: '#e3f2fd',
                  borderRadius: 2,
                  border: '1px solid #2196f3'
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-line',
                    fontFamily: 'Roboto, sans-serif'
                  }}
                >
                  {renderPreviewMessage(previewTemplate)}
                </Typography>
              </Paper>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Variáveis substituídas:</strong><br />
                  • &#123;&#123;nome&#125;&#125; → Maria Silva<br />
                  • &#123;&#123;hora&#125;&#125; → 14:30<br />
                  • &#123;&#123;clinica&#125;&#125; → Clínica Bella<br />
                  • &#123;&#123;profissional&#125;&#125; → Dra. Ana
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessageTemplatesManager;