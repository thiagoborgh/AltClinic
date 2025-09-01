import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { useAuth } from '../hooks/useAuth';
import LicenseSelector from '../components/Auth/LicenseSelector';

const Login = () => {
  const navigate = useNavigate();
  const { 
    login, 
    selectLicense, 
    loginLoading, 
    user, 
    licenses, 
    showLicenseSelector, 
    setShowLicenseSelector 
  } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      senha: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      const result = await login(data.email, data.senha);
      
      if (result.success) {
        if (result.singleLicense) {
          toast.success('Login realizado com sucesso!');
          navigate('/dashboard');
        } else if (result.multipleLicenses) {
          toast.success('Selecione a clínica que deseja acessar');
        }
      } else {
        toast.error(result.message || 'Erro ao fazer login');
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.');
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
          Esqueceu sua senha?{' '}
          <Link 
            href="#" 
            color="primary" 
            sx={{ textDecoration: 'none' }}
            onClick={(e) => {
              e.preventDefault();
              toast.info('Entre em contato com o administrador');
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
    </Box>
  );
};

export default Login;
