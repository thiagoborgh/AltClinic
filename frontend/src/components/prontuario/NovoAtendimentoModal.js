import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Divider,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  MedicalServices as MedicalIcon,
  Assignment as AssignmentIcon,
  Healing as HealingIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { useProntuario } from '../../hooks/useProntuario';

// Modal para criar novo atendimento
const NovoAtendimentoModal = ({ open, onClose, pacienteId, paciente }) => {
  const { adicionarAtendimento, loading } = useProntuario(pacienteId);
  
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [erro, setErro] = useState('');
  const [dadosAtendimento, setDadosAtendimento] = useState({
    // Dados básicos
    data: new Date(),
    tipo: 'consulta',
    motivoConsulta: '',
    profissional: '',
    
    // História da doença atual
    historicoDoencaAtual: '',
    
    // Exame clínico
    exameClinico: {
      exameFisico: '',
      sinaisVitais: {
        pressaoArterial: '',
        frequenciaCardiaca: '',
        temperatura: '',
        peso: '',
        altura: ''
      }
    },
    
    // Avaliação e conduta
    hipoteseDiagnostica: '',
    conduta: '',
    procedimentosRealizados: [],
    
    // Observações
    observacoes: '',
    proximaConsulta: null
  });

  const etapas = [
    { label: 'Dados Básicos', icon: <AssignmentIcon /> },
    { label: 'Exame Clínico', icon: <MedicalIcon /> },
    { label: 'Avaliação e Conduta', icon: <HealingIcon /> }
  ];

  const tiposAtendimento = [
    { value: 'consulta', label: 'Consulta' },
    { value: 'procedimento', label: 'Procedimento' },
    { value: 'avaliacao', label: 'Avaliação' },
    { value: 'terapia', label: 'Terapia' },
    { value: 'emergencia', label: 'Emergência' },
    { value: 'medicacao', label: 'Medicação' },
    { value: 'exames', label: 'Exames' }
  ];

  const handleChange = (campo, valor) => {
    if (campo.includes('.')) {
      const [objeto, propriedade] = campo.split('.');
      setDadosAtendimento(prev => ({
        ...prev,
        [objeto]: {
          ...prev[objeto],
          [propriedade]: valor
        }
      }));
    } else if (campo.includes('sinaisVitais.')) {
      const propriedade = campo.replace('sinaisVitais.', '');
      setDadosAtendimento(prev => ({
        ...prev,
        exameClinico: {
          ...prev.exameClinico,
          sinaisVitais: {
            ...prev.exameClinico.sinaisVitais,
            [propriedade]: valor
          }
        }
      }));
    } else {
      setDadosAtendimento(prev => ({
        ...prev,
        [campo]: valor
      }));
    }
  };

  const validarEtapa = (etapa) => {
    switch (etapa) {
      case 0:
        return dadosAtendimento.tipo && dadosAtendimento.motivoConsulta && dadosAtendimento.profissional;
      case 1:
        return true; // Exame clínico é opcional
      case 2:
        return dadosAtendimento.hipoteseDiagnostica || dadosAtendimento.conduta;
      default:
        return false;
    }
  };

  const handleProximaEtapa = () => {
    if (validarEtapa(etapaAtual)) {
      setEtapaAtual(prev => prev + 1);
      setErro('');
    } else {
      setErro('Preencha todos os campos obrigatórios');
    }
  };

  const handleEtapaAnterior = () => {
    setEtapaAtual(prev => prev - 1);
    setErro('');
  };

  const calcularIMC = () => {
    const peso = parseFloat(dadosAtendimento.exameClinico.sinaisVitais.peso);
    const altura = parseFloat(dadosAtendimento.exameClinico.sinaisVitais.altura) / 100;
    
    if (peso && altura) {
      const imc = (peso / (altura * altura)).toFixed(2);
      handleChange('sinaisVitais.imc', imc);
    }
  };

  const handleSalvar = async () => {
    setErro('');
    
    try {
      await adicionarAtendimento(dadosAtendimento);
      onClose();
      // Reset do formulário
      setDadosAtendimento({
        data: new Date(),
        tipo: 'consulta',
        motivoConsulta: '',
        profissional: '',
        historicoDoencaAtual: '',
        exameClinico: {
          exameFisico: '',
          sinaisVitais: {
            pressaoArterial: '',
            frequenciaCardiaca: '',
            temperatura: '',
            peso: '',
            altura: ''
          }
        },
        hipoteseDiagnostica: '',
        conduta: '',
        procedimentosRealizados: [],
        observacoes: '',
        proximaConsulta: null
      });
      setEtapaAtual(0);
    } catch (error) {
      setErro(error.message);
    }
  };

  const renderEtapa0 = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Dados Básicos do Atendimento
        </Typography>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
          <DateTimePicker
            label="Data e Hora"
            value={dadosAtendimento.data}
            onChange={(novaData) => handleChange('data', novaData)}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </LocalizationProvider>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Tipo de Atendimento *</InputLabel>
          <Select
            value={dadosAtendimento.tipo}
            onChange={(e) => handleChange('tipo', e.target.value)}
            label="Tipo de Atendimento *"
          >
            {tiposAtendimento.map(tipo => (
              <MenuItem key={tipo.value} value={tipo.value}>
                {tipo.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Motivo da Consulta *"
          value={dadosAtendimento.motivoConsulta}
          onChange={(e) => handleChange('motivoConsulta', e.target.value)}
          multiline
          rows={2}
          placeholder="Descreva o motivo principal da consulta..."
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Profissional Responsável *"
          value={dadosAtendimento.profissional}
          onChange={(e) => handleChange('profissional', e.target.value)}
          placeholder="Nome do profissional que realizou o atendimento"
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="História da Doença Atual (HDA)"
          value={dadosAtendimento.historicoDoencaAtual}
          onChange={(e) => handleChange('historicoDoencaAtual', e.target.value)}
          multiline
          rows={3}
          placeholder="Relato detalhado da evolução dos sintomas..."
        />
      </Grid>
    </Grid>
  );

  const renderEtapa1 = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Exame Clínico
        </Typography>
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Exame Físico"
          value={dadosAtendimento.exameClinico.exameFisico}
          onChange={(e) => handleChange('exameClinico.exameFisico', e.target.value)}
          multiline
          rows={4}
          placeholder="Descrição do exame físico realizado..."
        />
      </Grid>
      
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Sinais Vitais
        </Typography>
        <Divider />
      </Grid>
      
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth
          label="Pressão Arterial"
          value={dadosAtendimento.exameClinico.sinaisVitais.pressaoArterial}
          onChange={(e) => handleChange('sinaisVitais.pressaoArterial', e.target.value)}
          placeholder="Ex: 120/80"
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth
          label="Frequência Cardíaca"
          value={dadosAtendimento.exameClinico.sinaisVitais.frequenciaCardiaca}
          onChange={(e) => handleChange('sinaisVitais.frequenciaCardiaca', e.target.value)}
          placeholder="Ex: 72"
          InputProps={{ endAdornment: 'bpm' }}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth
          label="Temperatura"
          value={dadosAtendimento.exameClinico.sinaisVitais.temperatura}
          onChange={(e) => handleChange('sinaisVitais.temperatura', e.target.value)}
          placeholder="Ex: 36.5"
          InputProps={{ endAdornment: '°C' }}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth
          label="Peso"
          value={dadosAtendimento.exameClinico.sinaisVitais.peso}
          onChange={(e) => {
            handleChange('sinaisVitais.peso', e.target.value);
            setTimeout(calcularIMC, 100);
          }}
          placeholder="Ex: 70"
          InputProps={{ endAdornment: 'kg' }}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth
          label="Altura"
          value={dadosAtendimento.exameClinico.sinaisVitais.altura}
          onChange={(e) => {
            handleChange('sinaisVitais.altura', e.target.value);
            setTimeout(calcularIMC, 100);
          }}
          placeholder="Ex: 175"
          InputProps={{ endAdornment: 'cm' }}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth
          label="IMC"
          value={dadosAtendimento.exameClinico.sinaisVitais.imc || ''}
          InputProps={{ readOnly: true }}
          placeholder="Calculado automaticamente"
        />
      </Grid>
    </Grid>
  );

  const renderEtapa2 = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Avaliação e Conduta
        </Typography>
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Hipótese Diagnóstica"
          value={dadosAtendimento.hipoteseDiagnostica}
          onChange={(e) => handleChange('hipoteseDiagnostica', e.target.value)}
          multiline
          rows={2}
          placeholder="Principal suspeita diagnóstica..."
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Conduta"
          value={dadosAtendimento.conduta}
          onChange={(e) => handleChange('conduta', e.target.value)}
          multiline
          rows={3}
          placeholder="Plano de tratamento, medicações prescritas, orientações..."
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Observações Gerais"
          value={dadosAtendimento.observacoes}
          onChange={(e) => handleChange('observacoes', e.target.value)}
          multiline
          rows={2}
          placeholder="Observações adicionais relevantes..."
        />
      </Grid>
      
      <Grid item xs={12}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
          <DateTimePicker
            label="Próxima Consulta (Opcional)"
            value={dadosAtendimento.proximaConsulta}
            onChange={(novaData) => handleChange('proximaConsulta', novaData)}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </LocalizationProvider>
      </Grid>
    </Grid>
  );

  const renderConteudoEtapa = () => {
    switch (etapaAtual) {
      case 0: return renderEtapa0();
      case 1: return renderEtapa1();
      case 2: return renderEtapa2();
      default: return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { minHeight: '600px' } }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">
            Novo Atendimento - {paciente?.nomeCompleto}
          </Typography>
          <IconButton onClick={onClose} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Stepper */}
        <Stepper activeStep={etapaAtual} sx={{ mb: 4 }}>
          {etapas.map((etapa, index) => (
            <Step key={index}>
              <StepLabel icon={etapa.icon}>
                {etapa.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Mensagem de Erro */}
        {erro && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErro('')}>
            {erro}
          </Alert>
        )}

        {/* Conteúdo da Etapa */}
        {renderConteudoEtapa()}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        
        {etapaAtual > 0 && (
          <Button
            onClick={handleEtapaAnterior}
            disabled={loading}
          >
            Anterior
          </Button>
        )}
        
        {etapaAtual < etapas.length - 1 ? (
          <Button
            onClick={handleProximaEtapa}
            variant="contained"
            disabled={loading}
          >
            Próximo
          </Button>
        ) : (
          <Button
            onClick={handleSalvar}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Atendimento'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default NovoAtendimentoModal;
