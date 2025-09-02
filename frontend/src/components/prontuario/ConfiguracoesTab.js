import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Switch,
  FormControl,
  FormGroup,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  RestoreFromTrash as RestoreIcon,
  Security as SecurityIcon,
  AutoAwesome as AIIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

export default function ConfiguracoesTab({ prontuario }) {
  const [configuracoes, setConfiguracoes] = useState(prontuario?.configuracoes || {
    especialidade: 'estetica',
    medidasPersonalizadas: [],
    templateAnamnese: {},
    integracaoIA: {
      ativa: true,
      provedor: 'gemini',
      sugestoes: true,
      analiseImagens: true
    },
    privacidade: {
      criptografia: true,
      backupAutomatico: true,
      retencaoDados: 5,
      anonimizacao: false
    },
    alertas: {
      revisaoPeriodicaAtiva: true,
      diasRevisao: 30,
      alertasRisco: true,
      notificacaoEmail: true
    },
    exportacao: {
      formatoPadrao: 'pdf',
      incluirImagens: true,
      marca_dagua: true
    }
  });

  const [modalTemplate, setModalTemplate] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const especialidades = [
    { valor: 'estetica', label: 'Estética' },
    { valor: 'fisioterapia', label: 'Fisioterapia' },
    { valor: 'odontologia', label: 'Odontologia' },
    { valor: 'psicologia', label: 'Psicologia' },
    { valor: 'medicina', label: 'Medicina Geral' },
    { valor: 'nutricao', label: 'Nutrição' },
    { valor: 'custom', label: 'Personalizada' }
  ];

  const provedoresIA = [
    { valor: 'gemini', label: 'Google Gemini (Gratuito)' },
    { valor: 'huggingface', label: 'Hugging Face (Gratuito)' },
    { valor: 'openai', label: 'OpenAI GPT (Pago)' },
    { valor: 'disabled', label: 'Desabilitado' }
  ];

  const handleConfigChange = (categoria, campo, valor) => {
    setConfiguracoes(prev => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        [campo]: valor
      }
    }));
  };

  const salvarConfiguracoes = async () => {
    setSalvando(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Aqui faria a chamada para API para salvar
      console.log('Configurações salvas:', configuracoes);
      
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setSalvando(false);
    }
  };

  const restaurarPadroes = () => {
    const configPadrao = {
      especialidade: 'estetica',
      medidasPersonalizadas: [],
      templateAnamnese: {},
      integracaoIA: {
        ativa: true,
        provedor: 'gemini',
        sugestoes: true,
        analiseImagens: true
      },
      privacidade: {
        criptografia: true,
        backupAutomatico: true,
        retencaoDados: 5,
        anonimizacao: false
      },
      alertas: {
        revisaoPeriodicaAtiva: true,
        diasRevisao: 30,
        alertasRisco: true,
        notificacaoEmail: true
      },
      exportacao: {
        formatoPadrao: 'pdf',
        incluirImagens: true,
        marca_dagua: true
      }
    };
    
    setConfiguracoes(configPadrao);
  };

  const templatesAnamnese = {
    estetica: {
      nome: 'Template Estética',
      secoes: ['Dados Pessoais', 'Histórico Estético', 'Alergias', 'Medicamentos', 'Expectativas']
    },
    fisioterapia: {
      nome: 'Template Fisioterapia',
      secoes: ['Dados Pessoais', 'Histórico de Lesões', 'Dor', 'Atividades', 'Objetivos']
    },
    odontologia: {
      nome: 'Template Odontologia',
      secoes: ['Dados Pessoais', 'Histórico Dental', 'Alergias', 'Hábitos', 'Queixas']
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">
              Configurações do Prontuário
            </Typography>
            <Box>
              <Button
                startIcon={<RestoreIcon />}
                onClick={restaurarPadroes}
                sx={{ mr: 1 }}
              >
                Restaurar Padrões
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={salvarConfiguracoes}
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </Button>
            </Box>
          </Box>
        </Grid>

        {/* Configurações Gerais */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Configurações Gerais</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Especialidade da Clínica</InputLabel>
                    <Select
                      value={configuracoes.especialidade}
                      onChange={(e) => setConfiguracoes(prev => ({ ...prev, especialidade: e.target.value }))}
                    >
                      {especialidades.map(esp => (
                        <MenuItem key={esp.valor} value={esp.valor}>
                          {esp.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setModalTemplate(true)}
                    sx={{ height: 56 }}
                  >
                    Personalizar Template Anamnese
                  </Button>
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      A especialidade define quais medidas e campos estarão disponíveis por padrão no prontuário.
                      Você pode personalizar isso na seção "Template de Anamnese".
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Integração com IA */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <AIIcon />
                <Typography variant="h6">Integração com IA</Typography>
                <Chip 
                  size="small" 
                  label={configuracoes.integracaoIA?.ativa ? 'Ativa' : 'Inativa'}
                  color={configuracoes.integracaoIA?.ativa ? 'success' : 'default'}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configuracoes.integracaoIA?.ativa || false}
                        onChange={(e) => handleConfigChange('integracaoIA', 'ativa', e.target.checked)}
                      />
                    }
                    label="Ativar recursos de Inteligência Artificial"
                  />
                </Grid>

                {configuracoes.integracaoIA?.ativa && (
                  <>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Provedor de IA</InputLabel>
                        <Select
                          value={configuracoes.integracaoIA?.provedor || 'gemini'}
                          onChange={(e) => handleConfigChange('integracaoIA', 'provedor', e.target.value)}
                        >
                          {provedoresIA.map(prov => (
                            <MenuItem key={prov.valor} value={prov.valor}>
                              {prov.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={configuracoes.integracaoIA?.sugestoes || false}
                              onChange={(e) => handleConfigChange('integracaoIA', 'sugestoes', e.target.checked)}
                            />
                          }
                          label="Sugestões automáticas para anamnese"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={configuracoes.integracaoIA?.analiseImagens || false}
                              onChange={(e) => handleConfigChange('integracaoIA', 'analiseImagens', e.target.checked)}
                            />
                          }
                          label="Análise automática de imagens"
                        />
                      </FormGroup>
                    </Grid>
                  </>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Privacidade e Segurança */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <SecurityIcon />
                <Typography variant="h6">Privacidade e Segurança</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={configuracoes.privacidade?.criptografia || false}
                          onChange={(e) => handleConfigChange('privacidade', 'criptografia', e.target.checked)}
                        />
                      }
                      label="Criptografia AES-256 para dados sensíveis"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={configuracoes.privacidade?.backupAutomatico || false}
                          onChange={(e) => handleConfigChange('privacidade', 'backupAutomatico', e.target.checked)}
                        />
                      }
                      label="Backup automático diário"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={configuracoes.privacidade?.anonimizacao || false}
                          onChange={(e) => handleConfigChange('privacidade', 'anonimizacao', e.target.checked)}
                        />
                      }
                      label="Anonimização automática de dados antigos"
                    />
                  </FormGroup>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Retenção de dados (anos)"
                    value={configuracoes.privacidade?.retencaoDados || 5}
                    onChange={(e) => handleConfigChange('privacidade', 'retencaoDados', parseInt(e.target.value))}
                    helperText="Tempo para manter dados antes da anonimização"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Alertas e Notificações */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <NotificationsIcon />
                <Typography variant="h6">Alertas e Notificações</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={configuracoes.alertas?.revisaoPeriodicaAtiva || false}
                          onChange={(e) => handleConfigChange('alertas', 'revisaoPeriodicaAtiva', e.target.checked)}
                        />
                      }
                      label="Alertas de revisão periódica"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={configuracoes.alertas?.alertasRisco || false}
                          onChange={(e) => handleConfigChange('alertas', 'alertasRisco', e.target.checked)}
                        />
                      }
                      label="Alertas de risco (alergias, interações)"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={configuracoes.alertas?.notificacaoEmail || false}
                          onChange={(e) => handleConfigChange('alertas', 'notificacaoEmail', e.target.checked)}
                        />
                      }
                      label="Notificações por email"
                    />
                  </FormGroup>
                </Grid>

                {configuracoes.alertas?.revisaoPeriodicaAtiva && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Intervalo de revisão (dias)"
                      value={configuracoes.alertas?.diasRevisao || 30}
                      onChange={(e) => handleConfigChange('alertas', 'diasRevisao', parseInt(e.target.value))}
                    />
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Configurações de Exportação */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Configurações de Exportação</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Formato padrão</InputLabel>
                    <Select
                      value={configuracoes.exportacao?.formatoPadrao || 'pdf'}
                      onChange={(e) => handleConfigChange('exportacao', 'formatoPadrao', e.target.value)}
                    >
                      <MenuItem value="pdf">PDF</MenuItem>
                      <MenuItem value="csv">CSV</MenuItem>
                      <MenuItem value="json">JSON</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={configuracoes.exportacao?.incluirImagens || false}
                          onChange={(e) => handleConfigChange('exportacao', 'incluirImagens', e.target.checked)}
                        />
                      }
                      label="Incluir imagens nos relatórios por padrão"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={configuracoes.exportacao?.marca_dagua || false}
                          onChange={(e) => handleConfigChange('exportacao', 'marca_dagua', e.target.checked)}
                        />
                      }
                      label="Adicionar marca d'água da clínica"
                    />
                  </FormGroup>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {/* Modal de Template de Anamnese */}
      <Dialog open={modalTemplate} onClose={() => setModalTemplate(false)} maxWidth="md" fullWidth>
        <DialogTitle>Personalizar Template de Anamnese</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Template atual para {especialidades.find(e => e.valor === configuracoes.especialidade)?.label}:
          </Typography>
          
          {templatesAnamnese[configuracoes.especialidade] && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {templatesAnamnese[configuracoes.especialidade].nome}
              </Typography>
              {templatesAnamnese[configuracoes.especialidade].secoes.map((secao, index) => (
                <Chip key={index} label={secao} sx={{ mr: 1, mb: 1 }} />
              ))}
            </Box>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="body2" color="text.secondary">
            Funcionalidade de personalização completa será implementada em versão futura.
            Por enquanto, você pode solicitar modificações através do suporte.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalTemplate(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
