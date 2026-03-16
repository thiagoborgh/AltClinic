import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Alert,
  LinearProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Business, 
  Person, 
  Email, 
  Phone
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // Etapa 1: Dados da Clínica
    clinicaNome: '',
    slug: '',
    telefone: '',

    // Etapa 2: Dados do Proprietário
    ownerNome: '',
    ownerEmail: '',
    ownerSenha: '',
    confirmarSenha: ''
  });

  const PLANOS = {
    starter:    { id: 'starter',    nome: 'Starter',    preco: 'R$ 149', descricao: 'Para clínica solo ou autônomo', recursos: ['1 médico', 'Até 500 pacientes', 'WhatsApp + confirmações', 'CRM básico', 'Prontuário eletrônico', 'Suporte por email'] },
    pro:        { id: 'pro',        nome: 'Pro',        preco: 'R$ 349', descricao: 'Para clínicas em crescimento',  recursos: ['Até 5 médicos', 'Até 2.000 pacientes', 'WhatsApp multiagente', 'CRM completo + funil', 'NPS automático', 'Suporte prioritário'] },
    enterprise: { id: 'enterprise', nome: 'Enterprise', preco: 'R$ 799', descricao: 'Para redes e multi-unidades',   recursos: ['Médicos ilimitados', 'Pacientes ilimitados', 'Multi-unidade', 'API completa', 'White-label', 'Suporte dedicado'] },
  };

  const planParam = searchParams.get('plan') || 'starter';
  const planoSelecionado = PLANOS[planParam] || PLANOS.starter;

  const steps = ['Dados da Clínica', 'Proprietário', 'Confirmação'];

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-gerar slug baseado no nome da clínica
    if (field === 'clinicaNome') {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remover acentos
        .replace(/[^a-z0-9\s-]/g, '') // apenas letras, números, espaços e hífens
        .replace(/\s+/g, '-') // espaços para hífens
        .replace(/-+/g, '-') // múltiplos hífens para um
        .substring(0, 50); // limitar tamanho
      
      setFormData(prev => ({
        ...prev,
        slug: slug
      }));
    }

    setError('');
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        if (!formData.clinicaNome || !formData.slug) {
          setError('Nome da clínica e identificador são obrigatórios');
          return false;
        }
        if (formData.slug.length < 3) {
          setError('Identificador deve ter pelo menos 3 caracteres');
          return false;
        }
        break;
        
      case 1:
        if (!formData.ownerNome || !formData.ownerEmail || !formData.ownerSenha) {
          setError('Todos os dados do proprietário são obrigatórios');
          return false;
        }
        if (formData.ownerSenha !== formData.confirmarSenha) {
          setError('Senhas não conferem');
          return false;
        }
        if (formData.ownerSenha.length < 6) {
          setError('Senha deve ter pelo menos 6 caracteres');
          return false;
        }
        break;
        
      default:
        break;
    }
    
    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/onboarding/register', {
        clinicaNome: formData.clinicaNome,
        slug: formData.slug,
        ownerNome: formData.ownerNome,
        ownerEmail: formData.ownerEmail,
        ownerSenha: formData.ownerSenha,
        telefone: formData.telefone,
        plano: planoSelecionado.id
      });

      const data = response.data;

      if (data.success) {
        // Mostrar mensagem de sucesso
        toast.success(
          '🎉 Clínica criada com sucesso! Verifique seu email para acessar.',
          {
            duration: 5000,
            style: {
              background: '#4caf50',
              color: '#fff',
              fontSize: '16px',
              padding: '16px'
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#4caf50'
            }
          }
        );

        // Aguardar 2 segundos e redirecionar para login
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              email: formData.ownerEmail,
              message: 'Clínica criada! Verifique seu email para obter a senha temporária.'
            } 
          });
        }, 2000);
      } else {
        throw new Error(data.message || 'Erro ao criar clínica');
      }
      
    } catch (error) {
      console.error('Erro no registro:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao criar clínica. Tente novamente.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome da Clínica"
                value={formData.clinicaNome}
                onChange={handleInputChange('clinicaNome')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business />
                    </InputAdornment>
                  ),
                }}
                placeholder="Ex: Clínica ABC"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Identificador da Clínica"
                value={formData.slug}
                onChange={handleInputChange('slug')}
                helperText={`Sua URL será: https://${formData.slug || 'sua-clinica'}.altclinic.com.br`}
                placeholder="ex: clinica-abc"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Telefone (Opcional)"
                value={formData.telefone}
                onChange={handleInputChange('telefone')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone />
                    </InputAdornment>
                  ),
                }}
                placeholder="(11) 99999-9999"
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Seu Nome Completo"
                value={formData.ownerNome}
                onChange={handleInputChange('ownerNome')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
                placeholder="Dr. João Silva"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Seu Email"
                type="email"
                value={formData.ownerEmail}
                onChange={handleInputChange('ownerEmail')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
                placeholder="joao@clinica-abc.com"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                value={formData.ownerSenha}
                onChange={handleInputChange('ownerSenha')}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                placeholder="Mínimo 6 caracteres"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirmar Senha"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmarSenha}
                onChange={handleInputChange('confirmarSenha')}
                placeholder="Digite a senha novamente"
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Resumo da Configuração
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <Typography variant="subtitle1" gutterBottom>
                  <Business sx={{ mr: 1 }} />
                  Clínica: {formData.clinicaNome}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  URL: https://{formData.slug}.altclinic.com.br
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <Person sx={{ mr: 1 }} />
                  Proprietário: {formData.ownerNome}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Email: {formData.ownerEmail}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Seu Plano
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Paper 
                sx={{ 
                  p: 3, 
                  border: 2,
                  borderColor: 'primary.main',
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText'
                }}
              >
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  {planoSelecionado.nome}
                </Typography>
                <Typography variant="h3" color="primary.main" gutterBottom fontWeight="bold">
                  {planoSelecionado.preco}/mês
                </Typography>
                <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
                  {planoSelecionado.descricao}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {planoSelecionado.recursos.map((recurso, index) => (
                    <Typography key={index} variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      ✓ {recurso}
                    </Typography>
                  ))}
                </Box>
                <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                  💳 Aceita PIX e Cartão de Crédito
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        );

      default:
        return 'Etapa desconhecida';
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Criar sua Clínica Digital
        </Typography>
        
        <Typography variant="body1" align="center" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
          Configure sua clínica em poucos passos e comece a usar imediatamente
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
            variant="outlined"
          >
            Voltar
          </Button>
          
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                size="large"
              >
                {loading ? 'Criando Clínica...' : 'Criar Clínica'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
              >
                Próximo
              </Button>
            )}
          </Box>
        </Box>

        {activeStep === 0 && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Já tem uma conta?{' '}
              <Button variant="text" onClick={() => navigate('/login')}>
                Fazer Login
              </Button>
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default OnboardingPage;
