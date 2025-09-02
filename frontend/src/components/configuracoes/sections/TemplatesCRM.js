import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Paper,
  Alert,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import {
  Message as MessageIcon,
  Assignment as AnamneseIcon,
  Email as EmailIcon,
  Schedule as CronIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
  SmartToy as AIIcon
} from '@mui/icons-material';

const TemplatesCRM = ({ configuracoes, onSalvar }) => {
  const [tabAtiva, setTabAtiva] = useState(0);
  const [previewModal, setPreviewModal] = useState({ open: false, tipo: '', conteudo: '' });
  const [gerandoIA, setGerandoIA] = useState(false);

  const abas = [
    { label: 'Mensagens WhatsApp', icon: <MessageIcon /> },
    { label: 'Anamnese', icon: <AnamneseIcon /> },
    { label: 'Email Templates', icon: <EmailIcon /> },
    { label: 'Períodos CRM', icon: <CronIcon /> }
  ];

  const handleTabChange = (event, novaTab) => {
    setTabAtiva(novaTab);
  };

  const handlePreview = (tipo, conteudo) => {
    setPreviewModal({ open: true, tipo, conteudo });
  };

  const gerarTemplateIA = async (tipo) => {
    setGerandoIA(true);
    try {
      // Simular chamada para IA
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Implementar geração real via Gemini
    } catch (error) {
      console.error('Erro ao gerar template:', error);
    } finally {
      setGerandoIA(false);
    }
  };

  const renderMensagensWhatsApp = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Use variáveis como {'{nome}'}, {'{data}'}, {'{hora}'} para personalização automática.
        </Alert>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader 
            title="Boas-vindas"
            subheader="Primeira mensagem enviada ao paciente"
            action={
              <Button
                size="small"
                startIcon={<PreviewIcon />}
                onClick={() => handlePreview('boas-vindas', configuracoes.templates?.mensagens?.boas_vindas)}
              >
                Preview
              </Button>
            }
          />
          <CardContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={configuracoes.templates?.mensagens?.boas_vindas || ''}
              onChange={(e) => {
                // Implementar atualização
              }}
              placeholder="Olá {nome}! Bem-vindo(a) à nossa clínica..."
            />
            <Button
              size="small"
              startIcon={<AIIcon />}
              onClick={() => gerarTemplateIA('boas-vindas')}
              disabled={gerandoIA}
              sx={{ mt: 1 }}
            >
              Gerar com IA
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader 
            title="Confirmação de Agendamento"
            subheader="Enviada após confirmar agendamento"
            action={
              <Button
                size="small"
                startIcon={<PreviewIcon />}
                onClick={() => handlePreview('confirmacao', configuracoes.templates?.mensagens?.confirmacao_agendamento)}
              >
                Preview
              </Button>
            }
          />
          <CardContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={configuracoes.templates?.mensagens?.confirmacao_agendamento || ''}
              onChange={(e) => {
                // Implementar atualização
              }}
              placeholder="Seu agendamento foi confirmado para {data} às {hora}..."
            />
            <Button
              size="small"
              startIcon={<AIIcon />}
              onClick={() => gerarTemplateIA('confirmacao')}
              disabled={gerandoIA}
              sx={{ mt: 1 }}
            >
              Gerar com IA
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader 
            title="Lembrete de Consulta"
            subheader="Enviada antes da consulta"
            action={
              <Button
                size="small"
                startIcon={<PreviewIcon />}
                onClick={() => handlePreview('lembrete', configuracoes.templates?.mensagens?.lembrete_consulta)}
              >
                Preview
              </Button>
            }
          />
          <CardContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={configuracoes.templates?.mensagens?.lembrete_consulta || ''}
              onChange={(e) => {
                // Implementar atualização
              }}
              placeholder="Lembrete: Você tem consulta amanhã às {hora}..."
            />
            <Button
              size="small"
              startIcon={<AIIcon />}
              onClick={() => gerarTemplateIA('lembrete')}
              disabled={gerandoIA}
              sx={{ mt: 1 }}
            >
              Gerar com IA
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader 
            title="Pós-consulta"
            subheader="Enviada após a consulta"
            action={
              <Button
                size="small"
                startIcon={<PreviewIcon />}
                onClick={() => handlePreview('pos-consulta', configuracoes.templates?.mensagens?.pos_consulta)}
              >
                Preview
              </Button>
            }
          />
          <CardContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={configuracoes.templates?.mensagens?.pos_consulta || ''}
              onChange={(e) => {
                // Implementar atualização
              }}
              placeholder="Obrigado por sua visita! Como foi sua experiência?..."
            />
            <Button
              size="small"
              startIcon={<AIIcon />}
              onClick={() => gerarTemplateIA('pos-consulta')}
              disabled={gerandoIA}
              sx={{ mt: 1 }}
            >
              Gerar com IA
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderAnamnese = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Campos Obrigatórios" />
          <CardContent>
            <List>
              {(configuracoes.templates?.anamnese?.campos_obrigatorios || []).map((campo, index) => (
                <ListItem key={index}>
                  <ListItemText primary={campo} />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
            <TextField
              fullWidth
              placeholder="Adicionar novo campo obrigatório"
              size="small"
              sx={{ mt: 2 }}
              InputProps={{
                endAdornment: (
                  <IconButton size="small">
                    <AddIcon />
                  </IconButton>
                )
              }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Campos Opcionais" />
          <CardContent>
            <List>
              {(configuracoes.templates?.anamnese?.campos_opcionais || []).map((campo, index) => (
                <ListItem key={index}>
                  <ListItemText primary={campo} />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
            <TextField
              fullWidth
              placeholder="Adicionar novo campo opcional"
              size="small"
              sx={{ mt: 2 }}
              InputProps={{
                endAdornment: (
                  <IconButton size="small">
                    <AddIcon />
                  </IconButton>
                )
              }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader 
            title="Perguntas Personalizadas"
            action={
              <Button startIcon={<AddIcon />} variant="contained">
                Nova Pergunta
              </Button>
            }
          />
          <CardContent>
            {(configuracoes.templates?.anamnese?.perguntas_personalizadas || []).length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                Nenhuma pergunta personalizada cadastrada
              </Typography>
            ) : (
              <List>
                {configuracoes.templates.anamnese.perguntas_personalizadas.map((pergunta, index) => (
                  <ListItem key={index}>
                    <ListItemText 
                      primary={pergunta.pergunta}
                      secondary={`Tipo: ${pergunta.tipo} • Categoria: ${pergunta.categoria}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderEmailTemplates = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Email de Confirmação" />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Assunto"
                  value={configuracoes.templates?.emails?.confirmacao?.assunto || ''}
                  onChange={(e) => {
                    // Implementar atualização
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Corpo do Email"
                  multiline
                  rows={6}
                  value={configuracoes.templates?.emails?.confirmacao?.corpo || ''}
                  onChange={(e) => {
                    // Implementar atualização
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  startIcon={<PreviewIcon />}
                  onClick={() => handlePreview('email-confirmacao', configuracoes.templates?.emails?.confirmacao?.corpo)}
                >
                  Preview
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Email de Lembrete" />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Assunto"
                  value={configuracoes.templates?.emails?.lembrete?.assunto || ''}
                  onChange={(e) => {
                    // Implementar atualização
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Corpo do Email"
                  multiline
                  rows={6}
                  value={configuracoes.templates?.emails?.lembrete?.corpo || ''}
                  onChange={(e) => {
                    // Implementar atualização
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  startIcon={<PreviewIcon />}
                  onClick={() => handlePreview('email-lembrete', configuracoes.templates?.emails?.lembrete?.corpo)}
                >
                  Preview
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderPeriodosCRM = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Período de Inatividade" />
          <CardContent>
            <Typography gutterBottom>
              Pacientes são considerados inativos após:
            </Typography>
            <Box sx={{ px: 2 }}>
              <Slider
                value={configuracoes.templates?.periodo_inatividade || 90}
                onChange={(e, value) => {
                  // Implementar atualização
                }}
                min={30}
                max={365}
                marks={[
                  { value: 30, label: '30 dias' },
                  { value: 90, label: '90 dias' },
                  { value: 180, label: '6 meses' },
                  { value: 365, label: '1 ano' }
                ]}
                valueLabelDisplay="on"
                valueLabelFormat={(value) => `${value} dias`}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Atualmente: <strong>{configuracoes.templates?.periodo_inatividade || 90} dias</strong>
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Configurações de Cron Jobs" />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Frequência de Verificação</InputLabel>
                  <Select defaultValue="diaria">
                    <MenuItem value="diaria">Diária</MenuItem>
                    <MenuItem value="semanal">Semanal</MenuItem>
                    <MenuItem value="mensal">Mensal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Próxima execução:</strong> Hoje às 21:00
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Última execução:</strong> Ontem às 21:00 (15 pacientes processados)
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="Histórico de Execuções" />
          <CardContent>
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              Histórico de execuções aparecerá aqui
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderConteudoAba = () => {
    switch (tabAtiva) {
      case 0: return renderMensagensWhatsApp();
      case 1: return renderAnamnese();
      case 2: return renderEmailTemplates();
      case 3: return renderPeriodosCRM();
      default: return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Templates & CRM
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure templates de mensagens, formulários e períodos para automação do CRM.
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabAtiva}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {abas.map((aba, index) => (
            <Tab
              key={index}
              icon={aba.icon}
              label={aba.label}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {renderConteudoAba()}

      {/* Modal de Preview */}
      <Dialog open={previewModal.open} onClose={() => setPreviewModal({ open: false, tipo: '', conteudo: '' })} maxWidth="md" fullWidth>
        <DialogTitle>
          Preview - {previewModal.tipo}
        </DialogTitle>
        <DialogContent>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {previewModal.conteudo}
            </Typography>
          </Paper>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Variáveis disponíveis:</strong><br />
              {'{nome}'} - Nome do paciente<br />
              {'{data}'} - Data do agendamento<br />
              {'{hora}'} - Hora do agendamento<br />
              {'{procedimento}'} - Nome do procedimento<br />
              {'{clinica}'} - Nome da clínica
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewModal({ open: false, tipo: '', conteudo: '' })}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplatesCRM;
