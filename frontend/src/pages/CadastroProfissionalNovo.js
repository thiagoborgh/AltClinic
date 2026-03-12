import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Save,
  LocalHospital,
  Person,
  ContactPhone,
  Description,
  VpnKey,
  Send as SendIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import medicoService from '../services/medicoService';

// Lista de especialidades
const especialidades = [
  'Cardiologia',
  'Dermatologia',
  'Endocrinologia',
  'Estética',
  'Fisioterapia',
  'Gastroenterologia',
  'Ginecologia',
  'Neurologia',
  'Nutrição',
  'Oftalmologia',
  'Ortopedia',
  'Otorrinolaringologia',
  'Pediatria',
  'Psicologia',
  'Psiquiatria',
  'Radiologia',
  'Urologia',
  'Clínica Geral',
  'Cirurgia Geral',
  'Anestesiologia'
];

const steps = ['Dados Pessoais', 'Contato', 'Informações Adicionais', 'Acesso ao Sistema', 'Confirmação'];

const CadastroProfissionalNovo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const profissionalId = searchParams.get('id');
  const isEditMode = !!profissionalId;

  // Controle do stepper
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingProfissional, setLoadingProfissional] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    crm: '',
    especialidade: '',
    telefone: '',
    email: '',
    observacoes: '',
    habilitarAcesso: false
  });

  const [errors, setErrors] = useState({});

  // Carregar profissional se estiver editando
  useEffect(() => {
    if (isEditMode && profissionalId) {
      loadProfissional();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profissionalId, isEditMode]);

  const loadProfissional = async () => {
    setLoadingProfissional(true);
    try {
      const response = await medicoService.buscarPorId(profissionalId);
      const profissional = response.data;
      
      setFormData({
        nome: profissional.nome || '',
        crm: profissional.crm || '',
        especialidade: profissional.especialidade || '',
        telefone: profissional.telefone || '',
        email: profissional.email || '',
        observacoes: profissional.observacoes || '',
        habilitarAcesso: profissional.habilitarAcesso || false
      });
    } catch (error) {
      console.error('Erro ao carregar profissional:', error);
      toast.error('Erro ao carregar dados do profissional');
      navigate('/profissionais');
    } finally {
      setLoadingProfissional(false);
    }
  };

  // Navegação do stepper
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Validação por etapa
  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Dados Pessoais
        if (!formData.nome.trim()) {
          newErrors.nome = 'Nome é obrigatório';
        } else if (formData.nome.trim().length < 3) {
          newErrors.nome = 'Nome deve ter pelo menos 3 caracteres';
        }

        if (!formData.crm.trim()) {
          newErrors.crm = 'CRM é obrigatório';
        }

        if (!formData.especialidade) {
          newErrors.especialidade = 'Especialidade é obrigatória';
        }
        break;

      case 1: // Contato
        if (!formData.telefone) {
          newErrors.telefone = 'Telefone é obrigatório';
        } else if (formData.telefone.replace(/\D/g, '').length < 10) {
          newErrors.telefone = 'Telefone deve ter pelo menos 10 dígitos';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Email inválido';
        }
        break;

      case 2: // Informações Adicionais (opcional)
        // Nenhuma validação obrigatória
      case 3: // Acesso ao Sistema
        if (formData.habilitarAcesso && !formData.email) {
          newErrors.email = 'Email é obrigatório para enviar convite de acesso';
        }
        break;

        break;

      default:
        // Nenhuma validação
        break;
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      return false;
    }

    return true;
  };

  // Handlers de mudança
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Formatação de telefone
  const formatPhone = (value) => {
    if (!value) return '';
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  // Submissão do formulário
  const handleSubmit = async () => {
    if (!validateStep(3)) {
      return;
    }

    setLoading(true);
    try {
      const dadosProfissional = {
        nome: formData.nome.trim(),
        crm: formData.crm.trim(),
        especialidade: formData.especialidade,
        telefone: formData.telefone.replace(/\D/g, ''),
        email: formData.email.trim(),
        observacoes: formData.observacoes.trim(),
        habilitarAcesso: formData.habilitarAcesso
      };

      console.log('Dados a serem enviados:', dadosProfissional);

      if (isEditMode) {
        await medicoService.atualizarMedico(profissionalId, dadosProfissional);
        toast.success('Profissional atualizado com sucesso!');
      } else {
        const response = await medicoService.criarMedico(dadosProfissional);
        toast.success('Profissional cadastrado com sucesso!');
        
        // Se habilitou acesso e ainda não enviou convite, perguntar
        if (formData.habilitarAcesso && !inviteSent) {
          const medicoId = response.data?.id;
          if (medicoId && window.confirm('Deseja enviar o convite de acesso agora?')) {
            await handleSendInvite(medicoId);
          }
        }
      }

      navigate('/profissionais');
    } catch (error) {
      console.error('Erro completo:', error);
      console.error('Response:', error.response);
      const errorMessage = error.message || error.response?.data?.message || 'Erro ao salvar profissional';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Enviar convite de acesso
  const handleSendInvite = async (medicoId = profissionalId) => {
    if (!formData.email) {
      toast.error('Email é obrigatório para enviar convite');
      return;
    }

    setSendingInvite(true);
    try {
      await medicoService.enviarConviteAcesso(medicoId, formData.email);
      toast.success('Convite enviado com sucesso para ' + formData.email);
      setInviteSent(true);
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      const errorMessage = error.message || error.response?.data?.message || 'Erro ao enviar convite';
      toast.error(errorMessage);
    } finally {
      setSendingInvite(false);
    }
  };

  // Renderização do conteúdo de cada step
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome Completo *"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                error={!!errors.nome}
                helperText={errors.nome}
                placeholder="Ex: Dr. João Silva"
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CRM *"
                value={formData.crm}
                onChange={(e) => handleChange('crm', e.target.value)}
                error={!!errors.crm}
                helperText={errors.crm}
                placeholder="Ex: CRM/SP 123456"
                InputProps={{
                  startAdornment: <LocalHospital sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.especialidade}>
                <InputLabel>Especialidade *</InputLabel>
                <Select
                  value={formData.especialidade}
                  label="Especialidade *"
                  onChange={(e) => handleChange('especialidade', e.target.value)}
                >
                  {especialidades.map((esp) => (
                    <MenuItem key={esp} value={esp}>
                      {esp}
                    </MenuItem>
                  ))}
                </Select>
                {errors.especialidade && (
                  <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                    {errors.especialidade}
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Forneça as informações de contato do profissional.
                </Typography>
              </Alert>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone *"
                value={formatPhone(formData.telefone)}
                onChange={(e) => {
                  const numbers = e.target.value.replace(/\D/g, '');
                  if (numbers.length <= 11) {
                    handleChange('telefone', numbers);
                  }
                }}
                error={!!errors.telefone}
                helperText={errors.telefone}
                placeholder="(11) 99999-9999"
                InputProps={{
                  startAdornment: <ContactPhone sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                placeholder="profissional@clinic.com"
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Informações adicionais são opcionais e podem ser editadas posteriormente.
                </Typography>
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={6}
                value={formData.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                placeholder="Informações adicionais sobre o profissional, especialidades específicas, horários preferenciais, etc."
                InputProps={{
                  startAdornment: (
                    <Description 
                      sx={{ 
                        mr: 1, 
                        color: 'text.secondary',
                        alignSelf: 'flex-start',
                        mt: 1
                      }} 
                    />
                  )
                }}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  💰 Custo Adicional por Profissional
                </Typography>
                <Typography variant="body2">
                  Cada profissional ativo com acesso ao sistema tem um custo adicional de <strong>consulte o plano</strong>.
                </Typography>
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <VpnKey sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">
                      Acesso ao Sistema
                    </Typography>
                  </Box>

                  <FormControl component="fieldset">
                    <Box display="flex" alignItems="center" gap={2}>
                      <TextField
                        select
                        label="Habilitar Acesso"
                        value={formData.habilitarAcesso ? 'sim' : 'nao'}
                        onChange={(e) => handleChange('habilitarAcesso', e.target.value === 'sim')}
                        sx={{ minWidth: 200 }}
                      >
                        <MenuItem value="nao">Não</MenuItem>
                        <MenuItem value="sim">Sim</MenuItem>
                      </TextField>
                    </Box>
                  </FormControl>

                  {formData.habilitarAcesso && (
                    <Box mt={3}>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          Um convite será enviado para o email do profissional com instruções para criar a senha de acesso.
                        </Typography>
                      </Alert>

                      <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                          <TextField
                            fullWidth
                            label="Email do Profissional *"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            error={!!errors.email}
                            helperText={errors.email || 'Email usado para enviar o convite de acesso'}
                            placeholder="profissional@clinic.com"
                            disabled={!formData.habilitarAcesso}
                          />
                        </Grid>

                        {isEditMode && profissionalId && (
                          <Grid item xs={12} md={4}>
                            <Button
                              fullWidth
                              variant="outlined"
                              startIcon={sendingInvite ? <CircularProgress size={20} /> : <SendIcon />}
                              onClick={() => handleSendInvite()}
                              disabled={!formData.email || sendingInvite}
                              sx={{ height: '56px' }}
                            >
                              {sendingInvite ? 'Enviando...' : inviteSent ? 'Reenviar Convite' : 'Enviar Convite'}
                            </Button>
                          </Grid>
                        )}
                      </Grid>

                      {inviteSent && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            ✅ Convite enviado com sucesso!
                          </Typography>
                        </Alert>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 4:
        return (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body1" fontWeight="medium">
                Revise as informações antes de confirmar o cadastro
              </Typography>
            </Alert>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Dados Pessoais
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Nome"
                      secondary={formData.nome}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="CRM"
                      secondary={formData.crm}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Especialidade"
                      secondary={
                        <Chip 
                          label={formData.especialidade} 
                          color="primary" 
                          size="small" 
                          sx={{ mt: 0.5 }}
                        />
                      }
                    />
                  </ListItem>
                </List>

                <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 3 }}>
                  Contato
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Telefone"
                      secondary={formatPhone(formData.telefone)}
                    />
                  </ListItem>
                  {formData.email && (
                    <>
                      <Divider />
                      <ListItem>
                        <ListItemText
                          primary="Email"
                          secondary={formData.email}
                        />
                      </ListItem>
                    </>
                  )}
                </List>

                {formData.habilitarAcesso && (
                  <>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 3 }}>
                      Acesso ao Sistema
                    </Typography>
                    <Alert severity="warning" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        ⚠️ Este profissional terá acesso ao sistema e custará <strong>consulte o plano</strong> adicional.
                      </Typography>
                    </Alert>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Status do Acesso"
                          secondary={
                            <Chip 
                              label="Habilitado" 
                              color="success" 
                              size="small" 
                              sx={{ mt: 0.5 }}
                            />
                          }
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText
                          primary="Email para Acesso"
                          secondary={formData.email}
                        />
                      </ListItem>
                    </List>
                  </>
                )}

                {formData.observacoes && (
                  <>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 3 }}>
                      Observações
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                      {formData.observacoes}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  if (loadingProfissional) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {isEditMode ? 'Editar Profissional' : 'Cadastrar Novo Profissional'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isEditMode 
            ? 'Atualize as informações do profissional médico'
            : 'Preencha as informações para cadastrar um novo profissional médico'
          }
        </Typography>
      </Box>

      {/* Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Conteúdo do Step */}
      <Card>
        <CardContent sx={{ p: 4 }}>
          {renderStepContent(activeStep)}
        </CardContent>

        <Divider />

        {/* Botões de Navegação */}
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between">
            <Button
              disabled={activeStep === 0 || loading}
              onClick={handleBack}
              startIcon={<ArrowBack />}
              variant="outlined"
            >
              Voltar
            </Button>

            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                onClick={() => navigate('/profissionais')}
                disabled={loading}
              >
                Cancelar
              </Button>

              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                >
                  {loading ? 'Salvando...' : (isEditMode ? 'Atualizar' : 'Cadastrar')}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                >
                  Próximo
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CadastroProfissionalNovo;
