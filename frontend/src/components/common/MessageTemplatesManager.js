import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
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
  IconButton,
  Tooltip,
  CircularProgress,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Message,
  CheckCircle,
  Cancel,
  Schedule,
  Refresh,
  Save,
  Preview
} from '@mui/icons-material';
import { useToast } from '../../hooks/useToast';
import { crmService } from '../../services/api';

const MessageTemplatesManager = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [activeTab, setActiveTab] = useState('confirmacao');
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'confirmacao',
    mensagem: '',
    ativo: true
  });
  const [previewData] = useState({
    nome: 'Maria Silva',
    hora: '14:30',
    data: '15/01/2026',
    clinica: 'Clínica Bella',
    profissional: 'Dra. Ana'
  });

  const { showToast } = useToast();

  const templateTypes = [
    { value: 'confirmacao', label: 'Confirmação', icon: CheckCircle, color: 'success' },
    { value: 'lembrete', label: 'Lembrete', icon: Schedule, color: 'warning' },
    { value: 'cancelamento', label: 'Cancelamento', icon: Cancel, color: 'error' },
    { value: 'reagendamento', label: 'Reagendamento', icon: Refresh, color: 'info' }
  ];

  const availableVariables = [
    { key: '{{nome}}', description: 'Nome do paciente' },
    { key: '{{hora}}', description: 'Horário do agendamento' },
    { key: '{{data}}', description: 'Data do agendamento' },
    { key: '{{clinica}}', description: 'Nome da clínica' },
    { key: '{{profissional}}', description: 'Nome do profissional' }
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await crmService.getTemplates();
      if (response.success) {
        setTemplates(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      showToast('Erro ao carregar templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getTemplatesByType = (tipo) => {
    return templates.filter(template => template.tipo === tipo);
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      nome: '',
      tipo: activeTab,
      mensagem: '',
      ativo: true
    });
    setDialogOpen(true);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setFormData({
      nome: template.nome,
      tipo: template.tipo,
      mensagem: template.mensagem,
      ativo: template.ativo
    });
    setDialogOpen(true);
  };

  const handleDeleteTemplate = async (template) => {
    if (template.padrao) {
      showToast('Não é possível deletar templates padrão', 'warning');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja deletar o template "${template.nome}"?`)) {
      return;
    }

    try {
      const response = await crmService.deleteTemplate(template.id);
      if (response.success) {
        showToast('Template deletado com sucesso', 'success');
        loadTemplates();
      }
    } catch (error) {
      console.error('Erro ao deletar template:', error);
      showToast('Erro ao deletar template', 'error');
    }
  };

  const handleSaveTemplate = async () => {
    try {
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

      let response;
      if (editingTemplate) {
        response = await crmService.updateTemplate(editingTemplate.id, formData);
      } else {
        response = await crmService.createTemplate(formData);
      }

      if (response.success) {
        showToast(`Template ${editingTemplate ? 'atualizado' : 'criado'} com sucesso`, 'success');
        setDialogOpen(false);
        loadTemplates();
      }
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      showToast('Erro ao salvar template', 'error');
    }
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById('mensagem-textarea');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.mensagem;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    setFormData(prev => ({
      ...prev,
      mensagem: before + variable + after
    }));

    // Focar novamente no textarea após inserir variável
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const renderPreview = (mensagem) => {
    if (!mensagem) return '';

    let preview = mensagem;
    Object.entries(previewData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return preview;
  };

  const getTypeInfo = (tipo) => {
    return templateTypes.find(t => t.value === tipo) || templateTypes[0];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          📝 Templates de Mensagens
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateTemplate}
        >
          Novo Template
        </Button>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Personalize as mensagens enviadas automaticamente pelo WhatsApp para seus pacientes.
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {templateTypes.map((type) => (
            <Tab
              key={type.value}
              value={type.value}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <type.icon sx={{ fontSize: 18 }} />
                  {type.label}
                  <Chip
                    size="small"
                    label={getTemplatesByType(type.value).length}
                    color={type.color}
                    variant="outlined"
                  />
                </Box>
              }
            />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          <Grid container spacing={2}>
            {getTemplatesByType(activeTab).map((template) => {
              const typeInfo = getTypeInfo(template.tipo);
              return (
                <Grid item xs={12} md={6} lg={4} key={template.id}>
                  <Card sx={{
                    height: '100%',
                    border: template.padrao ? '2px solid' : '1px solid',
                    borderColor: template.padrao ? 'primary.main' : 'divider',
                    position: 'relative'
                  }}>
                    {template.padrao && (
                      <Chip
                        label="Padrão"
                        size="small"
                        color="primary"
                        sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                      />
                    )}

                    <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <typeInfo.icon sx={{ mr: 1, color: `${typeInfo.color}.main` }} />
                        <Typography variant="h6" component="h3" sx={{ flex: 1 }}>
                          {template.nome}
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={template.ativo}
                              size="small"
                              disabled={template.padrao}
                            />
                          }
                          label=""
                        />
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          flex: 1,
                          mb: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {template.mensagem}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>

                        {!template.padrao && (
                          <Tooltip title="Deletar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteTemplate(template)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="Preview">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setPreviewTemplate(template);
                              setPreviewDialogOpen(true);
                            }}
                          >
                            <Preview />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {getTemplatesByType(activeTab).length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Message sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Nenhum template encontrado
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Crie seu primeiro template para este tipo de mensagem.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Dialog para criar/editar template */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingTemplate ? 'Editar Template' : 'Novo Template'}
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome do Template"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Confirmação Personalizada"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.tipo}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                  label="Tipo"
                >
                  {templateTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <type.icon sx={{ fontSize: 18, color: `${type.color}.main` }} />
                        {type.label}
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
                {availableVariables.map((variable) => (
                  <Chip
                    key={variable.key}
                    label={`${variable.key} - ${variable.description}`}
                    size="small"
                    onClick={() => insertVariable(variable.key)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>

              <TextField
                id="mensagem-textarea"
                fullWidth
                multiline
                rows={4}
                label="Mensagem"
                value={formData.mensagem}
                onChange={(e) => setFormData(prev => ({ ...prev, mensagem: e.target.value }))}
                placeholder="Digite sua mensagem..."
                helperText={`${formData.mensagem.length}/300 caracteres`}
                inputProps={{ maxLength: 300 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Preview da Mensagem
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50', minHeight: 80 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {renderPreview(formData.mensagem) || 'Digite uma mensagem para ver o preview...'}
                </Typography>
              </Paper>
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
          <Button onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveTemplate}
            variant="contained"
            startIcon={<Save />}
          >
            {editingTemplate ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Preview */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Preview: {previewTemplate?.nome}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {previewTemplate ? renderPreview(previewTemplate.mensagem) : ''}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            * Este é um exemplo com dados fictícios para preview
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessageTemplatesManager;