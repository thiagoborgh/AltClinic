import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Alert,
  CircularProgress, Container, Grid, Card, CardContent
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const TrialFlow = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    clinica: '',
    especialidade: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [trialData, setTrialData] = useState(null);
  const navigate = useNavigate();

  // Verificar se já existe uma licença/trial no localStorage
  useEffect(() => {
    const existingTenant = localStorage.getItem('tenantSlug');
    const existingToken = localStorage.getItem('authToken');

    if (existingTenant && !existingToken) {
      // Já tem tenant mas não está logado, redirecionar para login
      navigate('/login');
    } else if (existingToken) {
      // Já está logado, redirecionar para agenda
      navigate('/agenda');
    }
  }, [navigate]);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simular processamento inicial
      setTimeout(() => {
        if (!loading) return; // Já terminou
        // Feedback intermediário poderia ser adicionado aqui
      }, 1000);

      const response = await api.post('/tenants/trial', formData);

      if (response.data.success) {
        setTrialData(response.data);
        setSuccess(true);

        // Armazenar informações da trial
        localStorage.setItem('tenantSlug', response.data.tenant.slug);
        localStorage.setItem('trialEmail', response.data.credentials.email);

        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao criar trial:', error);
      setError(
        error.response?.data?.message ||
        'Erro ao criar conta trial. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success && trialData) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom color="primary">
              🎉 Conta Trial Criada com Sucesso!
            </Typography>

            <Typography variant="h6" gutterBottom>
              Bem-vindo ao Alt Clinic, {trialData.tenant.nome}!
            </Typography>

            <Alert severity="success" sx={{ my: 3 }}>
              Sua conta trial de 15 dias foi criada! Você receberá um email com as instruções de acesso.
            </Alert>

            <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: 2, my: 3 }}>
              <Typography variant="h6" gutterBottom>
                📋 Dados de Acesso:
              </Typography>
              <Typography><strong>Email:</strong> {trialData.credentials.email}</Typography>
              <Typography><strong>Senha Temporária:</strong> {trialData.credentials.temp_password}</Typography>
              <Typography><strong>URL de Login:</strong> {trialData.credentials.login_url}</Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
              Redirecionando para a tela de login em alguns segundos...
            </Typography>

            <CircularProgress sx={{ mt: 2 }} />
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" gutterBottom align="center" color="primary">
            🚀 Comece seu Trial Gratuito
          </Typography>

          <Typography variant="h6" gutterBottom align="center">
            15 dias grátis para testar o Alt Clinic
          </Typography>

          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
            Sistema completo de gestão para clínicas estéticas
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Seu Nome"
                  value={formData.nome}
                  onChange={handleInputChange('nome')}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Nome da Clínica"
                  value={formData.clinica}
                  onChange={handleInputChange('clinica')}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Telefone"
                  value={formData.telefone}
                  onChange={handleInputChange('telefone')}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Especialidade (Opcional)"
                  value={formData.especialidade}
                  onChange={handleInputChange('especialidade')}
                  disabled={loading}
                  placeholder="Ex: Dermatologia, Estética, etc."
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Criando sua conta...
                </>
              ) : (
                '🚀 Criar Conta Trial Gratuita'
              )}
            </Button>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom align="center">
              ✨ O que você ganha com o trial:
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" color="primary">📅 Agendamento</Typography>
                    <Typography variant="body2">
                      Sistema completo de agendamento online e offline
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" color="primary">👥 Gestão de Pacientes</Typography>
                    <Typography variant="body2">
                      Cadastro completo e histórico médico
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" color="primary">📱 WhatsApp</Typography>
                    <Typography variant="body2">
                      Integração automática para lembretes e confirmações
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" color="primary">📊 Relatórios</Typography>
                    <Typography variant="body2">
                      Dashboards e relatórios completos de performance
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default TrialFlow;