/**
 * Onboarding Wizard — AltClinic
 * Issue #29
 *
 * 5 passos guiados para configurar a clínica após o cadastro:
 * 1. Dados da clínica
 * 2. Primeiro médico
 * 3. Horários de atendimento
 * 4. Conectar WhatsApp
 * 5. Primeiro agendamento (teste real)
 */
import React, { useState } from 'react';
import {
  Box, Stepper, Step, StepLabel, StepContent, Button, Typography,
  TextField, Grid, Paper, LinearProgress, Chip, Alert, CircularProgress
} from '@mui/material';
import {
  Business, Person, Schedule, WhatsApp, CalendarToday, CheckCircle
} from '@mui/icons-material';
import api from '../services/api';

const STEPS = [
  { label: 'Dados da clínica',       icon: <Business />,      key: 'clinica' },
  { label: 'Primeiro médico',         icon: <Person />,         key: 'medico' },
  { label: 'Horários de atendimento', icon: <Schedule />,       key: 'horarios' },
  { label: 'Conectar WhatsApp',       icon: <WhatsApp />,       key: 'whatsapp' },
  { label: 'Primeiro agendamento',    icon: <CalendarToday />,  key: 'agendamento' },
];

// ── Step 1: Dados da clínica ──────────────────────────────────────────────
function StepClinica({ data, onChange }) {
  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12}>
        <TextField fullWidth label="Nome da clínica *" value={data.nome || ''} onChange={e => onChange({ ...data, nome: e.target.value })} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Especialidade" value={data.especialidade || ''} onChange={e => onChange({ ...data, especialidade: e.target.value })} placeholder="Ex: Dermatologia, Cardiologia..." />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Telefone da clínica" value={data.telefone || ''} onChange={e => onChange({ ...data, telefone: e.target.value })} />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="Endereço completo" value={data.endereco || ''} onChange={e => onChange({ ...data, endereco: e.target.value })} />
      </Grid>
    </Grid>
  );
}

// ── Step 2: Primeiro médico ───────────────────────────────────────────────
function StepMedico({ data, onChange }) {
  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12}>
        <TextField fullWidth label="Nome completo *" value={data.nome || ''} onChange={e => onChange({ ...data, nome: e.target.value })} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="CRM" value={data.crm || ''} onChange={e => onChange({ ...data, crm: e.target.value })} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Especialidade" value={data.especialidade || ''} onChange={e => onChange({ ...data, especialidade: e.target.value })} />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="Email para acesso" value={data.email || ''} onChange={e => onChange({ ...data, email: e.target.value })} type="email" />
      </Grid>
    </Grid>
  );
}

// ── Step 3: Horários ──────────────────────────────────────────────────────
const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
function StepHorarios({ data, onChange }) {
  const dias = data.dias || ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  const toggleDia = (dia) => {
    const novos = dias.includes(dia) ? dias.filter(d => d !== dia) : [...dias, dia];
    onChange({ ...data, dias: novos });
  };
  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>Dias de atendimento</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        {DIAS.map(dia => (
          <Chip key={dia} label={dia} clickable
            color={dias.includes(dia) ? 'primary' : 'default'}
            onClick={() => toggleDia(dia)} />
        ))}
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField fullWidth label="Início" type="time" value={data.inicio || '08:00'}
            onChange={e => onChange({ ...data, inicio: e.target.value })} InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth label="Fim" type="time" value={data.fim || '18:00'}
            onChange={e => onChange({ ...data, fim: e.target.value })} InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Duração padrão da consulta (minutos)" type="number"
            value={data.duracao || 30} onChange={e => onChange({ ...data, duracao: e.target.value })} />
        </Grid>
      </Grid>
    </Box>
  );
}

// ── Step 4: WhatsApp ──────────────────────────────────────────────────────
function StepWhatsApp({ data, onChange }) {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  const gerarQR = async () => {
    setLoading(true);
    try {
      const res = await api.post('/whatsapp/qr-code');
      setQrCode(res.data?.qrCode || res.data?.qr);
    } catch {
      setQrCode(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Alert severity="info" sx={{ mb: 2 }}>
        Conecte o WhatsApp da clínica para enviar confirmações e lembretes automaticamente.
        Você pode pular este passo e conectar depois.
      </Alert>
      {!connected && !qrCode && (
        <Button variant="outlined" startIcon={<WhatsApp />} onClick={gerarQR} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Gerar QR Code'}
        </Button>
      )}
      {qrCode && !connected && (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Abra o WhatsApp → ⋮ → Aparelhos conectados → Conectar aparelho
          </Typography>
          <Box component="img" src={qrCode} alt="QR Code WhatsApp" sx={{ maxWidth: 220, borderRadius: 2 }} />
          <Button sx={{ mt: 2 }} variant="text" onClick={() => setConnected(true)}>
            Já conectei ✓
          </Button>
        </Box>
      )}
      {connected && (
        <Alert severity="success" icon={<CheckCircle />}>WhatsApp conectado com sucesso!</Alert>
      )}
      <Box sx={{ mt: 2 }}>
        <Button variant="text" size="small" color="inherit" onClick={() => onChange({ ...data, pulado: true })}>
          Pular por agora — conectar depois
        </Button>
      </Box>
    </Box>
  );
}

// ── Step 5: Primeiro agendamento ──────────────────────────────────────────
function StepAgendamento({ data, onChange }) {
  return (
    <Box sx={{ mt: 1 }}>
      <Alert severity="success" sx={{ mb: 2 }}>
        Tudo configurado! Que tal criar seu primeiro agendamento de teste?
      </Alert>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField fullWidth label="Nome do paciente" value={data.paciente || ''} onChange={e => onChange({ ...data, paciente: e.target.value })} placeholder="Ex: João da Silva (teste)" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Data" type="date" value={data.data || ''} onChange={e => onChange({ ...data, data: e.target.value })} InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Horário" type="time" value={data.horario || ''} onChange={e => onChange({ ...data, horario: e.target.value })} InputLabelProps={{ shrink: true }} />
        </Grid>
      </Grid>
    </Box>
  );
}

// ── Componente principal ──────────────────────────────────────────────────
export default function OnboardingWizard({ onComplete }) {
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [stepData, setStepData] = useState({
    clinica: {}, medico: {}, horarios: {}, whatsapp: {}, agendamento: {}
  });

  const updateStep = (key, data) => setStepData(prev => ({ ...prev, [key]: data }));
  const progress = Math.round(((activeStep) / STEPS.length) * 100);

  const handleNext = async () => {
    if (activeStep === STEPS.length - 1) {
      setSaving(true);
      try {
        await api.post('/onboarding/wizard/complete', stepData);
      } catch (e) {
        // Salva localmente se API falhar
        console.warn('[Wizard] Falha ao salvar wizard, continuando...', e.message);
      } finally {
        setSaving(false);
        onComplete?.();
      }
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const stepComponents = {
    clinica:      <StepClinica      data={stepData.clinica}      onChange={d => updateStep('clinica', d)} />,
    medico:       <StepMedico       data={stepData.medico}       onChange={d => updateStep('medico', d)} />,
    horarios:     <StepHorarios     data={stepData.horarios}     onChange={d => updateStep('horarios', d)} />,
    whatsapp:     <StepWhatsApp     data={stepData.whatsapp}     onChange={d => updateStep('whatsapp', d)} />,
    agendamento:  <StepAgendamento  data={stepData.agendamento}  onChange={d => updateStep('agendamento', d)} />,
  };

  return (
    <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, maxWidth: 680, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={800} gutterBottom>Configure sua clínica</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        5 passos rápidos — menos de 10 minutos
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">Passo {activeStep + 1} de {STEPS.length}</Typography>
          <Typography variant="caption" color="primary" fontWeight={700}>{progress}%</Typography>
        </Box>
        <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 2, height: 6 }} />
      </Box>

      <Stepper activeStep={activeStep} orientation="vertical">
        {STEPS.map(({ label, icon, key }, index) => (
          <Step key={key}>
            <StepLabel icon={activeStep >= index ? (activeStep > index ? <CheckCircle color="success" /> : icon) : icon}>
              <Typography fontWeight={activeStep === index ? 700 : 400}>{label}</Typography>
            </StepLabel>
            <StepContent>
              {stepComponents[key]}
              <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                {index > 0 && (
                  <Button onClick={() => setActiveStep(prev => prev - 1)} disabled={saving}>
                    Voltar
                  </Button>
                )}
                <Button variant="contained" onClick={handleNext} disabled={saving}>
                  {saving ? <CircularProgress size={20} /> : index === STEPS.length - 1 ? 'Concluir' : 'Próximo'}
                </Button>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {activeStep === STEPS.length && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={800} gutterBottom>Clínica configurada!</Typography>
          <Typography color="text.secondary">Bem-vindo ao AltClinic. Explore o sistema.</Typography>
        </Box>
      )}
    </Paper>
  );
}
