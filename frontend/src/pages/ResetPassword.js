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
  Paper,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Error,
  Security
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [successDialog, setSuccessDialog] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  const password = watch('password');

  // Validar token ao carregar a página
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await api.post('/auth/validate-reset-token', { token });
        setTokenValid(true);

        // Calcular tempo restante se disponível
        if (response.data.expiresAt) {
          const expiresAt = new Date(response.data.expiresAt);
          const now = new Date();
          const diff = expiresAt - now;

          if (diff > 0) {
            setTimeLeft(Math.floor(diff / 1000 / 60)); // minutos
          }
        }
      } catch (error) {
        setTokenValid(false);
      }
    };

    validateToken();
  }, [token]);

  // Validações de senha
  const validatePassword = (value) => {
    if (!value) return 'Senha é obrigatória';

    const minLength = value.length >= 8;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);

    if (!minLength) return 'A senha deve ter pelo menos 8 caracteres';
    if (!hasUpperCase) return 'A senha deve conter pelo menos uma letra maiúscula';
    if (!hasNumber) return 'A senha deve conter pelo menos um número';

    return true;
  };

  const validateConfirmPassword = (value) => {
    if (!value) return 'Confirmação de senha é obrigatória';
    if (value !== password) return 'As senhas não coincidem';
    return true;
  };

  // Calcular força da senha
  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    return strength;
  };

  const getPasswordStrengthColor = (strength) => {
    if (strength < 50) return 'error';
    if (strength < 75) return 'warning';
    return 'success';
  };

  const getPasswordStrengthText = (strength) => {
    if (strength < 50) return 'Fraca';
    if (strength < 75) return 'Média';
    return 'Forte';
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: data.password
      });

      setSuccessDialog(true);
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast.error(error.response?.data?.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessDialog(false);
    navigate('/login');
  };

  const handleRequestNewLink = () => {
    navigate('/login');
  };

  // Loading enquanto valida token
  if (tokenValid === null) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50'
      }}>
        <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            Validando link de redefinição...
          </Typography>
          <LinearProgress sx={{ mt: 2 }} />
        </Paper>
      </Box>
    );
  }

  // Token inválido
  if (!tokenValid) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50'
      }}>
        <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
          <Error color="error" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h6" color="error" gutterBottom>
            Link Inválido ou Expirado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Este link de redefinição de senha é inválido ou expirou.
            Os links de redefinição expiram em 1 hora por segurança.
          </Typography>
          <Button
            variant="contained"
            onClick={handleRequestNewLink}
            fullWidth
          >
            Ir para Login
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'grey.50',
      p: 2
    }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Security color="primary" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Redefinir Senha
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Digite sua nova senha abaixo
          </Typography>
          {timeLeft && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Link expira em {timeLeft} minutos
            </Alert>
          )}
        </Box>

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            <Controller
              name="password"
              control={control}
              rules={{ validate: validatePassword }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nova Senha"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  error={!!errors.password}
                  helperText={errors.password?.message}
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
                />
              )}
            />

            {password && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Força da senha: {getPasswordStrengthText(getPasswordStrength(password))}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={getPasswordStrength(password)}
                  color={getPasswordStrengthColor(getPasswordStrength(password))}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}

            <Controller
              name="confirmPassword"
              control={control}
              rules={{ validate: validateConfirmPassword }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Confirmar Nova Senha"
                  type={showConfirmPassword ? 'text' : 'password'}
                  fullWidth
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
              disabled={loading || !isValid}
              sx={{ mt: 2 }}
            >
              {loading ? 'Redefinindo...' : 'Redefinir Senha'}
            </Button>
          </Stack>
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Lembrou sua senha?{' '}
            <Button
              variant="text"
              size="small"
              onClick={() => navigate('/login')}
              sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}
            >
              Fazer login
            </Button>
          </Typography>
        </Box>
      </Paper>

      {/* Dialog de Sucesso */}
      <Dialog open={successDialog} onClose={handleSuccessClose}>
        <DialogTitle sx={{ textAlign: 'center' }}>
          <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
          Senha Redefinida com Sucesso!
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ textAlign: 'center' }}>
            Sua senha foi alterada com sucesso. Você será redirecionado para a tela de login.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <Button onClick={handleSuccessClose} variant="contained">
            Ir para Login
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResetPassword;