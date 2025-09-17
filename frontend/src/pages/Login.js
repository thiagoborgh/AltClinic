import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  InputAdornment,
  IconButton,
  Alert,
  Divider,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  HelpOutline
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { useAuth } from '../hooks/useAuth';
import LicenseSelector from '../components/Auth/LicenseSelector';
import SessionConflictDialog from '../components/Auth/SessionConflictDialog';

const Login = () => {
  const navigate = useNavigate();
  const { 
    login, 
    selectLicense, 
    loginLoading, 
    user, 
    licenses, 
    showLicenseSelector, 
    setShowLicenseSelector,
    isAuthenticated
  } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [sessionConflict, setSessionConflict] = useState(null);
  const [pendingLoginData, setPendingLoginData] = useState(null);
  const [searchParams] = useSearchParams();
  const [trialEmail, setTrialEmail] = useState('');
  const [isFirstAccess, setIsFirstAccess] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [recoveryType, setRecoveryType] = useState('forgot-password');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm({
    defaultValues: {
      email: '',
      senha: '',
    },
  });

  // Redirecionar automaticamente quando o usuário for autenticado
  useEffect(() => {
    console.log('🔐 LOGIN useEffect: isAuthenticated:', isAuthenticated, 'user:', !!user);
    if (isAuthenticated && user) {
      console.log('🔐 LOGIN useEffect: Redirecionando para /dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (data) => {
    try {
      console.log('🔐 LOGIN: Iniciando login para:', data.email);
      const result = await login(data.email, data.senha);
      console.log('🔐 LOGIN: Resultado do login:', result);
      
      if (result.success) {
        if (result.singleLicense) {
          toast.success(`Login realizado com sucesso! ${result.sessionInfo?.message || ''}`);
          // O redirecionamento será feito automaticamente pelo useEffect quando isAuthenticated mudar
        } else if (result.multipleLicenses) {
          toast.success('Selecione a clínica que deseja acessar');
        }
      } else if (result.requireConfirmation) {
        // Conflito de sessão detectado
        setSessionConflict({
          message: result.message,
          otherSessions: result.otherSessions,
          currentIP: result.currentIP,
          options: result.options
        });
        setPendingLoginData(data);
      } else {
        toast.error(result.message || 'Erro ao fazer login');
      }
    } catch (error) {
      console.error('🔐 LOGIN: Erro no onSubmit:', error);
      toast.error('Erro inesperado. Tente novamente.');
    }
  };

  const handleSessionConflictResolve = async (resolveData) => {
    if (!pendingLoginData) return;

    try {
      let forceLogin = true;
      let sessionsToRemove = [];

      switch (resolveData.action) {
        case 'force_login':
          // Entrar normalmente, manter outras sessões
          forceLogin = true;
          sessionsToRemove = [];
          break;
        
        case 'logout_selected':
          // Encerrar sessões selecionadas
          forceLogin = true;
          sessionsToRemove = resolveData.selectedSessions;
          break;
        
        case 'logout_all_others':
          // Encerrar todas as outras sessões (será tratado no backend)
          forceLogin = true;
          sessionsToRemove = ['all_others'];
          break;
        
        default:
          return;
      }

      const result = await login(
        pendingLoginData.email, 
        pendingLoginData.senha, 
        forceLogin, 
        sessionsToRemove
      );

      if (result.success) {
        setSessionConflict(null);
        setPendingLoginData(null);
        
        let message = 'Login realizado com sucesso!';
        if (sessionsToRemove.length > 0) {
          message += ` ${sessionsToRemove.length} sessão(ões) encerrada(s).`;
        }
        
        toast.success(message);
        navigate('/dashboard');
      } else {
        toast.error(result.message || 'Erro ao fazer login');
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.');
    }
  };

  const handleSessionConflictClose = () => {
    setSessionConflict(null);
    setPendingLoginData(null);
  };

  const handleRecoverySubmit = async () => {
    if (!recoveryEmail) {
      toast.error('Por favor, informe seu email');
      return;
    }

    setRecoveryLoading(true);
    try {
      const response = await fetch('/api/auth/recovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: recoveryEmail,
          type: recoveryType
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Email enviado com sucesso!');
        setShowRecoveryDialog(false);
        setRecoveryEmail('');
      } else {
        toast.error(data.message || 'Erro ao enviar email');
      }
    } catch (error) {
      toast.error('Erro ao processar solicitação');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleSelectLicense = async (selectedLicense) => {
    try {
      const result = await selectLicense(selectedLicense);
      
      if (result.success) {
        toast.success(`Bem-vindo à ${selectedLicense.tenant.nome}!`);
        navigate('/dashboard');
      } else {
        toast.error(result.message || 'Erro ao acessar clínica');
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box>
      <Typography 
        variant="h5" 
        fontWeight="bold" 
        textAlign="center" 
        mb={3}
        color="text.primary"
      >
        Entrar no Sistema
      </Typography>

      {/* Mensagem de primeiro acesso */}
      {isFirstAccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            🎉 <strong>Conta criada com sucesso!</strong><br />
            Verifique seu email ({trialEmail}) para obter suas credenciais de acesso.<br />
            Use a senha temporária enviada para fazer login pela primeira vez.
          </Typography>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={3}>
          <Controller
            name="email"
            control={control}
            rules={{
              required: 'Email é obrigatório',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email inválido',
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email"
                type="email"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          <Controller
            name="senha"
            control={control}
            rules={{
              required: 'Senha é obrigatória',
              minLength: {
                value: 6,
                message: 'Senha deve ter pelo menos 6 caracteres',
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                error={!!errors.senha}
                helperText={errors.senha?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={togglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loginLoading}
            startIcon={<LoginIcon />}
            sx={{
              py: 1.5,
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
              },
            }}
          >
            {loginLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </Stack>
      </form>

      <Divider sx={{ my: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Primeiro acesso?
        </Typography>
      </Divider>

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Usuário padrão:</strong><br />
          Email: admin@clinica.com<br />
          Senha: 123456
        </Typography>
      </Alert>

      <Box mt={3} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          Esqueceu sua senha ou é seu primeiro acesso?{' '}
          <Link 
            href="#" 
            color="primary" 
            sx={{ textDecoration: 'none', cursor: 'pointer' }}
            onClick={(e) => {
              e.preventDefault();
              setShowRecoveryDialog(true);
            }}
          >
            Clique aqui
          </Link>
        </Typography>
      </Box>

      {/* Modal de Seleção de Licença */}
      <LicenseSelector
        open={showLicenseSelector}
        onClose={() => setShowLicenseSelector(false)}
        licenses={licenses}
        user={user}
        onSelectLicense={handleSelectLicense}
        loading={loginLoading}
      />

      {/* Diálogo de Conflito de Sessão */}
      <SessionConflictDialog
        open={!!sessionConflict}
        onClose={handleSessionConflictClose}
        conflictData={sessionConflict}
        onResolve={handleSessionConflictResolve}
        loading={loginLoading}
      />

      {/* Modal de Recuperação de Senha/Primeiro Acesso */}
      <Dialog 
        open={showRecoveryDialog} 
        onClose={() => setShowRecoveryDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <HelpOutline sx={{ mr: 1, verticalAlign: 'middle' }} />
          Recuperação de Acesso
        </DialogTitle>
        <DialogContent>
          <Typography paragraph color="text.secondary">
            Escolha a opção que melhor descreve sua situação:
          </Typography>
          
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend">Tipo de solicitação</FormLabel>
            <RadioGroup
              value={recoveryType}
              onChange={(e) => setRecoveryType(e.target.value)}
            >
              <FormControlLabel 
                value="forgot-password" 
                control={<Radio />} 
                label="Esqueci minha senha" 
              />
              <FormControlLabel 
                value="first-access" 
                control={<Radio />} 
                label="Primeiro acesso (nova conta)" 
              />
            </RadioGroup>
          </FormControl>

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={recoveryEmail}
            onChange={(e) => setRecoveryEmail(e.target.value)}
            placeholder="Digite seu email cadastrado"
            margin="normal"
            required
          />
          
          <Alert severity="info" sx={{ mt: 2 }}>
            {recoveryType === 'forgot-password' 
              ? 'Você receberá um email com instruções para redefinir sua senha.'
              : 'Você receberá um email com suas credenciais de acesso.'
            }
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowRecoveryDialog(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleRecoverySubmit}
            disabled={!recoveryEmail || recoveryLoading}
          >
            {recoveryLoading ? 'Enviando...' : 'Enviar Email'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Login;
