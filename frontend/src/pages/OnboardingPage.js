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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Phone,
  CheckCircle 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const OnboardingPage = () => {
  const navigate = useNavigate();
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
    confirmarSenha: '',
    
    // Etapa 3: Plano
    plano: 'trial'
  });

  const steps = [
    'Dados da Clínica',
    'Proprietário',
    'Confirmação'
  ];

  const planos = [
    {
      id: 'trial',
      nome: 'Trial (15 dias)',
      preco: 'Grátis',
      descricao: 'Teste todas as funcionalidades',
      recursos: ['3 usuários', '500 pacientes', 'WhatsApp incluído']
    },
    {
      id: 'starter',
      nome: 'Starter',
      preco: 'R$ 199/mês',
      descricao: 'Ideal para clínicas pequenas',
      recursos: ['3 usuários', '500 pacientes', 'WhatsApp incluído']
    },
    {
      id: 'professional',
      nome: 'Professional',
      preco: 'R$ 399/mês',
      descricao: 'Completo para clínicas médias',
      recursos: ['10 usuários', '2.000 pacientes', 'WhatsApp + Telemedicina']
    }
  ];

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
      const response = await fetch('/api/tenants/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clinicaNome: formData.clinicaNome,
          slug: formData.slug,
          ownerNome: formData.ownerNome,
          ownerEmail: formData.ownerEmail,
          ownerSenha: formData.ownerSenha,
          telefone: formData.telefone,
          plano: formData.plano
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Erro ao criar clínica');
      }

      // Salvar token no localStorage
      localStorage.setItem('authToken', data.auth.token);
      localStorage.setItem('tenantSlug', data.tenant.slug);
      localStorage.setItem('user', JSON.stringify(data.owner));

      // Redirecionar para dashboard
      window.location.href = `https://${data.tenant.slug}.altclinic.com.br/dashboard`;
      
    } catch (error) {
      console.error('Erro no registro:', error);
      setError(error.message || 'Erro ao criar clínica. Tente novamente.');
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
                Escolha seu Plano
              </Typography>
            </Grid>
            
            {planos.map((plano) => (
              <Grid item xs={12} md={4} key={plano.id}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    cursor: 'pointer',
                    border: formData.plano === plano.id ? 2 : 1,
                    borderColor: formData.plano === plano.id ? 'primary.main' : 'grey.300'
                  }}
                  onClick={() => setFormData(prev => ({ ...prev, plano: plano.id }))}
                >
                  <Typography variant="h6" gutterBottom>
                    {plano.nome}
                  </Typography>
                  <Typography variant="h5" color="primary" gutterBottom>
                    {plano.preco}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {plano.descricao}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {plano.recursos.map((recurso, index) => (
                      <Typography key={index} variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <CheckCircle sx={{ fontSize: 16, mr: 1, color: 'success.main' }} />
                        {recurso}
                      </Typography>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            ))}
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
