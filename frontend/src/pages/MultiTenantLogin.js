import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  Link as MuiLink,
  Divider
} from '@mui/material';
import { 
  Email, 
  Lock, 
  Visibility, 
  VisibilityOff,
  Business
} from '@mui/icons-material';
import Logo from '../components/common/Logo';
import { Link, useNavigate, useParams } from 'react-router-dom';

const MultiTenantLogin = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams(); // Para URL /login/:tenantSlug
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
    tenantSlug: tenantSlug || ''
  });

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validações básicas
    if (!formData.email || !formData.senha || !formData.tenantSlug) {
      setError('Todos os campos são obrigatórios');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/tenants/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          senha: formData.senha,
          tenantSlug: formData.tenantSlug
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Erro no login');
      }

      // Salvar dados no localStorage
      localStorage.setItem('authToken', data.auth.token);
      localStorage.setItem('tenantSlug', data.tenant.slug);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('tenant', JSON.stringify(data.tenant));

      // Redirecionar para dashboard
      if (window.location.hostname.includes(data.tenant.slug)) {
        // Já está no subdomínio correto
        navigate('/dashboard');
      } else {
        // Redirecionar para subdomínio
        window.location.href = `https://${data.tenant.slug}.altclinic.com.br/dashboard`;
      }
      
    } catch (error) {
      console.error('Erro no login:', error);
      
      // Tratar erros específicos
      if (error.message.includes('não encontrada')) {
        setError('Clínica não encontrada. Verifique o nome da clínica.');
      } else if (error.message.includes('Trial expirado')) {
        setError('Período de teste expirado. Faça upgrade do seu plano.');
      } else if (error.message.includes('suspensa')) {
        setError('Clínica suspensa. Entre em contato com o suporte.');
      } else {
        setError(error.message || 'Email ou senha incorretos');
      }
    } finally {
      setLoading(false);
    }
  };

  // Detectar tenant slug do subdomínio
  React.useEffect(() => {
    if (!formData.tenantSlug) {
      const hostname = window.location.hostname;
      const subdomain = hostname.split('.')[0];
      
      if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
        setFormData(prev => ({
          ...prev,
          tenantSlug: subdomain
        }));
      }
    }
  }, [formData.tenantSlug]);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
            <Logo 
              variant="complete" 
              size="large"
              sx={{ 
                height: '60px'
              }} 
            />
          </Box>
          <Typography variant="h4" gutterBottom>
            Entrar na Clínica
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Acesse sua conta para gerenciar sua clínica
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="Nome da Clínica"
            value={formData.tenantSlug}
            onChange={handleInputChange('tenantSlug')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Business />
                </InputAdornment>
              ),
            }}
            placeholder="clinica-abc"
            helperText="O mesmo nome usado no cadastro da clínica"
            disabled={!!tenantSlug} // Desabilitar se veio da URL
          />

          <TextField
            fullWidth
            margin="normal"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email />
                </InputAdornment>
              ),
            }}
            placeholder="seu@email.com"
          />

          <TextField
            fullWidth
            margin="normal"
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            value={formData.senha}
            onChange={handleInputChange('senha')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
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
            placeholder="Sua senha"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <Box sx={{ textAlign: 'center' }}>
          <MuiLink component={Link} to="/forgot-password" variant="body2">
            Esqueceu sua senha?
          </MuiLink>
        </Box>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            ou
          </Typography>
        </Divider>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Ainda não tem uma clínica?
          </Typography>
          <Button
            component={Link}
            to="/register"
            variant="outlined"
            fullWidth
            size="large"
          >
            Criar Nova Clínica
          </Button>
        </Box>

        {/* Informações de suporte */}
        <Box sx={{ mt: 4, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            💡 <strong>Dica:</strong> Se você foi convidado para uma clínica, 
            use o link enviado por email ou peça ao administrador o nome da clínica.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default MultiTenantLogin;
