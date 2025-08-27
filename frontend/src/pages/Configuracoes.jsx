import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  Divider
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Business,
  Security,
  Notifications,
  Integration,
  Save
} from '@mui/icons-material';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Configuracoes() {
  const [tabValue, setTabValue] = useState(0);
  const [clinicaData, setClinicaData] = useState({
    nome: 'Clínica Estética Exemplo',
    email: 'contato@clinica.com',
    telefone: '(11) 99999-9999',
    endereco: 'Rua das Flores, 123',
    horarioFuncionamento: '08:00 às 18:00'
  });

  const [configIA, setConfigIA] = useState({
    geminiApiKey: '',
    huggingfaceApiKey: '',
    enableAutoResponse: true,
    enableImageAnalysis: true
  });

  const [configNotif, setConfigNotif] = useState({
    emailLembretes: true,
    whatsappLembretes: true,
    relatorioDiario: true,
    alertasInativos: true
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSave = (section) => {
    // Aqui você implementaria a lógica de salvar
    console.log('Salvando configurações:', section);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <SettingsIcon sx={{ mr: 2, verticalAlign: 'bottom' }} />
          Configurações
        </Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<Business />} label="Clínica" />
            <Tab icon={<Integration />} label="Integrações" />
            <Tab icon={<Notifications />} label="Notificações" />
            <Tab icon={<Security />} label="Segurança" />
          </Tabs>
        </Box>

        {/* Configurações da Clínica */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Informações da Clínica
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome da Clínica"
                value={clinicaData.nome}
                onChange={(e) => setClinicaData({...clinicaData, nome: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="E-mail"
                value={clinicaData.email}
                onChange={(e) => setClinicaData({...clinicaData, email: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={clinicaData.telefone}
                onChange={(e) => setClinicaData({...clinicaData, telefone: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Horário de Funcionamento"
                value={clinicaData.horarioFuncionamento}
                onChange={(e) => setClinicaData({...clinicaData, horarioFuncionamento: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Endereço"
                value={clinicaData.endereco}
                onChange={(e) => setClinicaData({...clinicaData, endereco: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={() => handleSave('clinica')}
              >
                Salvar Configurações
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Integrações */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            APIs e Integrações
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Configure suas chaves de API para habilitar recursos avançados
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Inteligência Artificial
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Google Gemini API Key"
                type="password"
                value={configIA.geminiApiKey}
                onChange={(e) => setConfigIA({...configIA, geminiApiKey: e.target.value})}
                helperText="Para respostas inteligentes do bot"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hugging Face API Key"
                type="password"
                value={configIA.huggingfaceApiKey}
                onChange={(e) => setConfigIA({...configIA, huggingfaceApiKey: e.target.value})}
                helperText="Para análise de sentimentos"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={configIA.enableAutoResponse}
                    onChange={(e) => setConfigIA({...configIA, enableAutoResponse: e.target.checked})}
                  />
                }
                label="Respostas Automáticas"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={configIA.enableImageAnalysis}
                    onChange={(e) => setConfigIA({...configIA, enableImageAnalysis: e.target.checked})}
                  />
                }
                label="Análise de Imagens"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={() => handleSave('integracoes')}
              >
                Salvar Configurações
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notificações */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Configurações de Notificação
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={configNotif.emailLembretes}
                    onChange={(e) => setConfigNotif({...configNotif, emailLembretes: e.target.checked})}
                  />
                }
                label="Lembretes por E-mail"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={configNotif.whatsappLembretes}
                    onChange={(e) => setConfigNotif({...configNotif, whatsappLembretes: e.target.checked})}
                  />
                }
                label="Lembretes por WhatsApp"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={configNotif.relatorioDiario}
                    onChange={(e) => setConfigNotif({...configNotif, relatorioDiario: e.target.checked})}
                  />
                }
                label="Relatório Diário"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={configNotif.alertasInativos}
                    onChange={(e) => setConfigNotif({...configNotif, alertasInativos: e.target.checked})}
                  />
                }
                label="Alertas de Pacientes Inativos"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={() => handleSave('notificacoes')}
              >
                Salvar Configurações
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Segurança */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Segurança e Acesso
          </Typography>
          
          <Alert severity="warning" sx={{ mb: 3 }}>
            Configurações de segurança devem ser alteradas com cuidado
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nova Senha"
                type="password"
                helperText="Alterar senha do usuário atual"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confirmar Nova Senha"
                type="password"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                color="warning"
                startIcon={<Security />}
                onClick={() => handleSave('seguranca')}
              >
                Alterar Senha
              </Button>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
}
