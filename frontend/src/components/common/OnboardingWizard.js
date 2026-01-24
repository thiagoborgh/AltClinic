import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Avatar,
  Chip,
  Grid,
  Paper,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PersonAdd,
  Schedule,
  WhatsApp,
  Send,
  Event,
  Notifications,
  CheckCircle,
  Close,
  ArrowForward,
  ArrowBack
} from '@mui/icons-material';
import { useToast } from '../../hooks/useToast';
import { useAnalytics, ANALYTICS_EVENTS } from '../../hooks/useAnalytics';
import { crmService } from '../../services/api';

const OnboardingWizard = ({ open, onClose, onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [formData, setFormData] = useState({
    profissional: {
      nome: '',
      especialidade: ''
    },
    horarios: {
      segunda: { ativo: false, inicio: '09:00', fim: '18:00' },
      terca: { ativo: false, inicio: '09:00', fim: '18:00' },
      quarta: { ativo: false, inicio: '09:00', fim: '18:00' },
      quinta: { ativo: false, inicio: '09:00', fim: '18:00' },
      sexta: { ativo: false, inicio: '09:00', fim: '18:00' },
      sabado: { ativo: false, inicio: '09:00', fim: '18:00' },
      domingo: { ativo: false, inicio: '09:00', fim: '18:00' }
    },
    whatsapp: {
      numeroTeste: '',
      mensagemEnviada: false
    },
    agendamento: {
      pacienteNome: '',
      data: '',
      hora: '',
      servico: ''
    },
    lembretes: {
      ativado: false
    }
  });

  const { showToast } = useToast();
  const { trackEvent } = useAnalytics();

  const steps = [
    {
      label: 'Criar Profissional',
      icon: PersonAdd,
      description: 'Adicione o primeiro profissional da clínica'
    },
    {
      label: 'Definir Horários',
      icon: Schedule,
      description: 'Configure os horários de atendimento'
    },
    {
      label: 'Conectar WhatsApp',
      icon: WhatsApp,
      description: 'Conecte seu WhatsApp para lembretes'
    },
    {
      label: 'Testar Mensagem',
      icon: Send,
      description: 'Envie uma mensagem de teste'
    },
    {
      label: 'Primeiro Agendamento',
      icon: Event,
      description: 'Crie seu primeiro agendamento'
    },
    {
      label: 'Ativar Lembretes',
      icon: Notifications,
      description: 'Configure lembretes automáticos'
    }
  ];

  // Carregar progresso do onboarding
  useEffect(() => {
    if (open) {
      loadProgress();
      // Track onboarding iniciado
      trackEvent(ANALYTICS_EVENTS.ONBOARDING_STARTED, {
        step: 'modal_opened'
      });
    }
  }, [open]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const response = await crmService.getOnboardingStatus();
      if (response.success) {
        setProgress(response.data);

        // Se já completou alguma etapa, pular para a próxima
        const stepsOrder = ['profissionalCriado', 'horariosDefinidos', 'whatsappConectado', 'mensagemTestada', 'primeiroAgendamento', 'lembreteAtivado'];
        const nextStepIndex = stepsOrder.findIndex(step => !response.data[step]);
        if (nextStepIndex !== -1) {
          setActiveStep(nextStepIndex);
        } else {
          // Todas as etapas concluídas
          setActiveStep(steps.length - 1);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
      showToast('Erro ao carregar progresso do onboarding', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateStep = async (stepName, completed) => {
    try {
      const response = await crmService.updateOnboardingStep(stepName, completed);
      if (response.success) {
        setProgress(response.data);

        // Track conclusão de etapa
        if (completed) {
          trackEvent(ANALYTICS_EVENTS.ONBOARDING_STEP_COMPLETED, {
            step: stepName,
            stepIndex: activeStep
          });
        }

        return response.data;
      }
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error);
      showToast('Erro ao salvar progresso', 'error');
      throw error;
    }
  };

  const handleNext = async () => {
    const currentStepName = getCurrentStepName();

    try {
      setLoading(true);

      // Validar e executar ação da etapa atual
      await executeStepAction(currentStepName);

      // Marcar etapa como concluída
      await updateStep(currentStepName, true);

      // Avançar para próxima etapa
      if (activeStep < steps.length - 1) {
        setActiveStep(activeStep + 1);
      } else {
        // Onboarding completo
        showToast('🎉 Parabéns! Você completou o onboarding!', 'success');

        // Track onboarding concluído
        trackEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, {
          totalSteps: steps.length,
          completionTime: Date.now() // Pode ser usado para calcular tempo total
        });

        onComplete && onComplete();
        onClose();
      }
    } catch (error) {
      // Erro já tratado na executeStepAction
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => Math.max(0, prev - 1));
  };

  const getCurrentStepName = () => {
    const stepNames = ['profissionalCriado', 'horariosDefinidos', 'whatsappConectado', 'mensagemTestada', 'primeiroAgendamento', 'lembreteAtivado'];
    return stepNames[activeStep];
  };

  const executeStepAction = async (stepName) => {
    switch (stepName) {
      case 'profissionalCriado':
        await createProfissional();
        break;
      case 'horariosDefinidos':
        await saveHorarios();
        break;
      case 'whatsappConectado':
        await checkWhatsAppConnection();
        break;
      case 'mensagemTestada':
        await sendTestMessage();
        break;
      case 'primeiroAgendamento':
        await createFirstAgendamento();
        break;
      case 'lembreteAtivado':
        await activateLembretes();
        break;
    }
  };

  const createProfissional = async () => {
    const { nome, especialidade } = formData.profissional;

    if (!nome.trim() || !especialidade.trim()) {
      showToast('Preencha nome e especialidade do profissional', 'warning');
      throw new Error('Dados incompletos');
    }

    try {
      // Por enquanto, apenas simulamos a criação
      // TODO: Implementar API real quando disponível
      showToast('Profissional criado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao criar profissional:', error);
      showToast('Erro ao criar profissional', 'error');
      throw error;
    }
  };

  const saveHorarios = async () => {
    // Validar se pelo menos um dia está ativo
    const diasAtivos = Object.values(formData.horarios).filter(dia => dia.ativo);
    if (diasAtivos.length === 0) {
      showToast('Selecione pelo menos um dia de atendimento', 'warning');
      throw new Error('Nenhum dia selecionado');
    }

    try {
      // Aqui seria chamada a API para salvar horários
      // Por enquanto, apenas simulamos
      showToast('Horários salvos com sucesso!', 'success');
    } catch (error) {
      showToast('Erro ao salvar horários', 'error');
      throw error;
    }
  };

  const checkWhatsAppConnection = async () => {
    try {
      const response = await crmService.getWhatsAppStatus();
      if (!response.success || !response.data.connected) {
        showToast('Conecte seu WhatsApp primeiro nas configurações', 'warning');
        throw new Error('WhatsApp não conectado');
      }

      // Track WhatsApp conectado
      trackEvent(ANALYTICS_EVENTS.WHATSAPP_CONNECTED, {
        context: 'onboarding'
      });

      showToast('WhatsApp conectado!', 'success');
    } catch (error) {
      showToast('WhatsApp não está conectado', 'error');
      throw error;
    }
  };

  const sendTestMessage = async () => {
    const { numeroTeste } = formData.whatsapp;

    if (!numeroTeste.trim()) {
      showToast('Digite um número para enviar a mensagem de teste', 'warning');
      throw new Error('Número não informado');
    }

    try {
      // Por enquanto, apenas simulamos o envio
      // TODO: Implementar API real quando disponível
      setFormData(prev => ({
        ...prev,
        whatsapp: { ...prev.whatsapp, mensagemEnviada: true }
      }));

      // Track mensagem de teste enviada
      trackEvent(ANALYTICS_EVENTS.FIRST_MESSAGE_SENT, {
        context: 'onboarding',
        testMessage: true
      });

      showToast('Mensagem de teste enviada!', 'success');
    } catch (error) {
      showToast('Erro ao enviar mensagem de teste', 'error');
      throw error;
    }
  };

  const createFirstAgendamento = async () => {
    const { pacienteNome, data, hora, servico } = formData.agendamento;

    if (!pacienteNome.trim() || !data || !hora || !servico.trim()) {
      showToast('Preencha todos os campos do agendamento', 'warning');
      throw new Error('Dados incompletos');
    }

    try {
      // Por enquanto, apenas simulamos a criação
      // TODO: Implementar API real quando disponível

      // Track primeiro agendamento criado
      trackEvent(ANALYTICS_EVENTS.FIRST_APPOINTMENT_CREATED, {
        context: 'onboarding',
        service: servico
      });

      showToast('Primeiro agendamento criado!', 'success');
    } catch (error) {
      showToast('Erro ao criar agendamento', 'error');
      throw error;
    }
  };

  const activateLembretes = async () => {
    const { ativado } = formData.lembretes;

    if (!ativado) {
      showToast('Ative os lembretes para concluir', 'warning');
      throw new Error('Lembretes não ativados');
    }

    try {
      // Por enquanto, apenas simulamos a ativação
      // TODO: Implementar API real quando disponível

      // Track lembretes ativados
      trackEvent(ANALYTICS_EVENTS.REMINDERS_ACTIVATED, {
        context: 'onboarding'
      });

      showToast('Lembretes ativados!', 'success');
    } catch (error) {
      showToast('Erro ao ativar lembretes', 'error');
      throw error;
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Profissional
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Adicione o primeiro profissional da clínica
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Este será o profissional responsável pelos atendimentos.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nome do Profissional"
                  value={formData.profissional.nome}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    profissional: { ...prev.profissional, nome: e.target.value }
                  }))}
                  placeholder="Ex: Dra. Maria Silva"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Especialidade"
                  value={formData.profissional.especialidade}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    profissional: { ...prev.profissional, especialidade: e.target.value }
                  }))}
                  placeholder="Ex: Dermatologista"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1: // Horários
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Configure os horários de atendimento
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Defina os dias e horários que a clínica atende.
            </Typography>

            {Object.entries(formData.horarios).map(([dia, config]) => (
              <Paper key={dia} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth>
                      <InputLabel>Dia</InputLabel>
                      <Select
                        value={dia}
                        disabled
                        label="Dia"
                      >
                        <MenuItem value="segunda">Segunda</MenuItem>
                        <MenuItem value="terca">Terça</MenuItem>
                        <MenuItem value="quarta">Quarta</MenuItem>
                        <MenuItem value="quinta">Quinta</MenuItem>
                        <MenuItem value="sexta">Sexta</MenuItem>
                        <MenuItem value="sabado">Sábado</MenuItem>
                        <MenuItem value="domingo">Domingo</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      type="time"
                      label="Início"
                      value={config.inicio}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        horarios: {
                          ...prev.horarios,
                          [dia]: { ...config, inicio: e.target.value }
                        }
                      }))}
                      disabled={!config.ativo}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      type="time"
                      label="Fim"
                      value={config.fim}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        horarios: {
                          ...prev.horarios,
                          [dia]: { ...config, fim: e.target.value }
                        }
                      }))}
                      disabled={!config.ativo}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Button
                      variant={config.ativo ? "contained" : "outlined"}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        horarios: {
                          ...prev.horarios,
                          [dia]: { ...config, ativo: !config.ativo }
                        }
                      }))}
                      fullWidth
                    >
                      {config.ativo ? 'Ativo' : 'Inativo'}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Box>
        );

      case 2: // WhatsApp
        return (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Conecte seu WhatsApp
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Para enviar lembretes automáticos, conecte seu WhatsApp nas configurações.
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              Vá em Configurações → WhatsApp para conectar sua conta
            </Alert>

            <Button
              variant="contained"
              color="primary"
              onClick={() => window.open('/configuracoes', '_blank')}
            >
              Ir para Configurações
            </Button>
          </Box>
        );

      case 3: // Mensagem Teste
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Envie uma mensagem de teste
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Teste o envio de mensagens pelo seu WhatsApp conectado.
            </Typography>

            <TextField
              fullWidth
              label="Número do WhatsApp (com DDD)"
              value={formData.whatsapp.numeroTeste}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                whatsapp: { ...prev.whatsapp, numeroTeste: e.target.value }
              }))}
              placeholder="Ex: 11999999999"
              sx={{ mb: 2 }}
            />

            {formData.whatsapp.mensagemEnviada && (
              <Alert severity="success" sx={{ mb: 2 }}>
                ✅ Mensagem de teste enviada com sucesso!
              </Alert>
            )}
          </Box>
        );

      case 4: // Primeiro Agendamento
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Crie seu primeiro agendamento
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Teste a criação de agendamentos no sistema.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nome do Paciente"
                  value={formData.agendamento.pacienteNome}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    agendamento: { ...prev.agendamento, pacienteNome: e.target.value }
                  }))}
                  placeholder="Ex: João Silva"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Serviço"
                  value={formData.agendamento.servico}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    agendamento: { ...prev.agendamento, servico: e.target.value }
                  }))}
                  placeholder="Ex: Consulta Dermatológica"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data"
                  value={formData.agendamento.data}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    agendamento: { ...prev.agendamento, data: e.target.value }
                  }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Horário"
                  value={formData.agendamento.hora}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    agendamento: { ...prev.agendamento, hora: e.target.value }
                  }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 5: // Lembretes
        return (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Ative os lembretes automáticos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure lembretes automáticos para reduzir faltas.
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                📱 Lembretes automáticos por WhatsApp
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                • 24 horas antes do agendamento
                • Confirmação de presença
                • Lembrete 1 hora antes
              </Typography>

              <Button
                variant={formData.lembretes.ativado ? "contained" : "outlined"}
                color="primary"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  lembretes: { ativado: !prev.lembretes.ativado }
                }))}
                size="large"
              >
                {formData.lembretes.ativado ? '✅ Lembretes Ativados' : '🔄 Ativar Lembretes'}
              </Button>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading && !progress) {
    return (
      <Dialog open={open} maxWidth="md" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Carregando onboarding...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
      onClose={() => {}} // Impede fechamento por ESC
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5">
            🚀 Bem-vindo ao SAEE!
          </Typography>
          <Tooltip title="Este assistente é obrigatório para começar a usar o sistema">
            <Chip label="Obrigatório" color="warning" size="small" />
          </Tooltip>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Vamos configurar sua clínica em poucos minutos
        </Typography>
      </DialogTitle>

      <Divider />

      <Box sx={{ px: 3, py: 2 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((step, index) => (
            <Step key={step.label} completed={progress && progress[getCurrentStepName(index)]}>
              <StepLabel
                StepIconComponent={() => (
                  <Avatar sx={{
                    bgcolor: index < activeStep ? 'success.main' :
                             index === activeStep ? 'primary.main' : 'grey.300',
                    width: 32,
                    height: 32
                  }}>
                    {index < activeStep ? <CheckCircle sx={{ fontSize: 16 }} /> :
                     <step.icon sx={{ fontSize: 16 }} />}
                  </Avatar>
                )}
              >
                <Typography variant="caption" fontWeight="bold">
                  {step.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {step.description}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent sx={{ minHeight: 300 }}>
        {renderStepContent()}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Button
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
            startIcon={<ArrowBack />}
          >
            Voltar
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {progress && (
              <Typography variant="body2" color="text.secondary">
                {progress.progressPercentage}% concluído
              </Typography>
            )}

            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
              endIcon={loading ? <CircularProgress size={16} /> : <ArrowForward />}
            >
              {activeStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default OnboardingWizard;