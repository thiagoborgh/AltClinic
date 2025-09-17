import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Card,
  CardContent,
  Divider,
  Alert
} from '@mui/material';
import {
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  Schedule as ScheduleIcon,
  Notes as NotesIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';

const AtendimentoModal = ({
  open,
  onClose,
  pacienteEspera,
  onAtendimentoIniciado
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    observacoes: '',
    prioridade: 'normal',
    tipoAtendimento: 'consulta',
    sintomas: '',
    pressaoArterial: '',
    temperatura: '',
    peso: '',
    altura: '',
    queixaPrincipal: ''
  });

  const [erros, setErros] = useState({});

  // Reset form quando modal abre
  useEffect(() => {
    if (open && pacienteEspera) {
      setFormData({
        observacoes: pacienteEspera.observacoes || '',
        prioridade: pacienteEspera.prioridade || 'normal',
        tipoAtendimento: 'consulta',
        sintomas: '',
        pressaoArterial: '',
        temperatura: '',
        peso: '',
        altura: '',
        queixaPrincipal: ''
      });
      setErros({});
    }
  }, [open, pacienteEspera]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpar erro do campo
    if (erros[field]) {
      setErros(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validarFormulario = () => {
    const novosErros = {};

    if (!formData.queixaPrincipal.trim()) {
      novosErros.queixaPrincipal = 'Queixa principal é obrigatória';
    }

    if (!formData.tipoAtendimento) {
      novosErros.tipoAtendimento = 'Tipo de atendimento é obrigatório';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleIniciarAtendimento = async () => {
    if (!validarFormulario()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);

      // Dados do atendimento
      const dadosAtendimento = {
        pacienteId: pacienteEspera.paciente.id,
        profissionalId: pacienteEspera.profissional.id,
        agendamentoId: pacienteEspera.id,
        tipoAtendimento: formData.tipoAtendimento,
        prioridade: formData.prioridade,
        queixaPrincipal: formData.queixaPrincipal,
        sintomas: formData.sintomas,
        sinaisVitais: {
          pressaoArterial: formData.pressaoArterial,
          temperatura: formData.temperatura,
          peso: formData.peso,
          altura: formData.altura
        },
        observacoes: formData.observacoes,
        dataInicio: dayjs().toISOString(),
        status: 'em-andamento'
      };

      // Simulação da API - em produção seria uma chamada real
      console.log('Iniciando atendimento:', dadosAtendimento);

      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Chamar callback de sucesso
      if (onAtendimentoIniciado) {
        onAtendimentoIniciado(pacienteEspera.id, dadosAtendimento);
      }

      toast.success(`Atendimento de ${pacienteEspera.paciente.nome} iniciado com sucesso!`);

      // Fechar modal
      onClose();

    } catch (error) {
      console.error('Erro ao iniciar atendimento:', error);
      toast.error('Erro ao iniciar atendimento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade) {
      case 'alta': return 'error';
      case 'normal': return 'default';
      case 'baixa': return 'success';
      default: return 'default';
    }
  };

  if (!pacienteEspera) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: 'primary.main',
        color: 'white'
      }}>
        <Box display="flex" alignItems="center">
          <MedicalIcon sx={{ mr: 2 }} />
          <Typography variant="h6">
            Iniciar Atendimento
          </Typography>
        </Box>
        <Button
          onClick={onClose}
          sx={{ color: 'white', minWidth: 'auto', p: 1 }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Informações do Paciente */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                {pacienteEspera.paciente.nome.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {pacienteEspera.paciente.nome}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {pacienteEspera.paciente.telefone} • {pacienteEspera.paciente.email}
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center">
                  <PersonIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
                  <Typography variant="body2">
                    <strong>Profissional:</strong> {pacienteEspera.profissional.nome}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center">
                  <MedicalIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
                  <Typography variant="body2">
                    <strong>Procedimento:</strong> {pacienteEspera.procedimento}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center">
                  <ScheduleIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
                  <Typography variant="body2">
                    <strong>Horário:</strong> {dayjs(pacienteEspera.horarioAgendado).format('DD/MM/YYYY HH:mm')}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Chip
                  label={`Prioridade ${pacienteEspera.prioridade === 'alta' ? 'Alta' : 'Normal'}`}
                  color={getPrioridadeColor(pacienteEspera.prioridade)}
                  size="small"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Formulário de Atendimento */}
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <NotesIcon sx={{ mr: 1 }} />
          Dados do Atendimento
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!erros.tipoAtendimento}>
              <InputLabel>Tipo de Atendimento *</InputLabel>
              <Select
                value={formData.tipoAtendimento}
                label="Tipo de Atendimento *"
                onChange={(e) => handleInputChange('tipoAtendimento', e.target.value)}
              >
                <MenuItem value="consulta">Consulta</MenuItem>
                <MenuItem value="retorno">Retorno</MenuItem>
                <MenuItem value="urgencia">Urgência</MenuItem>
                <MenuItem value="procedimento">Procedimento</MenuItem>
              </Select>
              {erros.tipoAtendimento && (
                <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1 }}>
                  {erros.tipoAtendimento}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Prioridade</InputLabel>
              <Select
                value={formData.prioridade}
                label="Prioridade"
                onChange={(e) => handleInputChange('prioridade', e.target.value)}
              >
                <MenuItem value="baixa">Baixa</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="alta">Alta</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Queixa Principal *"
              multiline
              rows={2}
              value={formData.queixaPrincipal}
              onChange={(e) => handleInputChange('queixaPrincipal', e.target.value)}
              error={!!erros.queixaPrincipal}
              helperText={erros.queixaPrincipal}
              placeholder="Descreva a queixa principal do paciente..."
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Sintomas"
              multiline
              rows={2}
              value={formData.sintomas}
              onChange={(e) => handleInputChange('sintomas', e.target.value)}
              placeholder="Descreva os sintomas apresentados..."
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Sinais Vitais (Opcional)
            </Typography>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Pressão Arterial"
              value={formData.pressaoArterial}
              onChange={(e) => handleInputChange('pressaoArterial', e.target.value)}
              placeholder="120/80"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Temperatura"
              value={formData.temperatura}
              onChange={(e) => handleInputChange('temperatura', e.target.value)}
              placeholder="36.5°C"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Peso"
              value={formData.peso}
              onChange={(e) => handleInputChange('peso', e.target.value)}
              placeholder="70kg"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Altura"
              value={formData.altura}
              onChange={(e) => handleInputChange('altura', e.target.value)}
              placeholder="1.70m"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Observações"
              multiline
              rows={3}
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Observações adicionais sobre o atendimento..."
            />
          </Grid>
        </Grid>

        {Object.keys(erros).length > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Preencha todos os campos obrigatórios marcados com *
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleIniciarAtendimento}
          disabled={loading}
          variant="contained"
          startIcon={<SaveIcon />}
          sx={{ minWidth: 150 }}
        >
          {loading ? 'Iniciando...' : 'Iniciar Atendimento'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AtendimentoModal;
