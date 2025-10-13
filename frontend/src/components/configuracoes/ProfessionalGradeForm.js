import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Button,
  Grid,
  Typography,
  Card,
  CardContent,
  Alert,
  Chip,
  Tooltip
} from '@mui/material';
import {
  AccessTime,
  Preview,
  Save,
  ContentCopy,
  CalendarToday
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import 'moment/locale/pt-br';
import { toast } from 'react-hot-toast';

import { useProfessionalGrades } from '../../hooks/useProfessionalGrades';

moment.locale('pt-br');

const ProfessionalGradeForm = ({ professionalId, professionalName, onSave }) => {
  // Hook para gerenciar grades
  const { saveGradeWithDuplication, validateGradeConfig, loading } = useProfessionalGrades(professionalId);

  // Estados do formulário
  const [formData, setFormData] = useState({
    // Campos de Horário
    horaInicio: moment().hour(9).minute(0),
    horaFim: moment().hour(17).minute(0),
    intervaloMinutos: 30,
    local: '',
    
    // Limites
    maxRetornos: '5',
    maxEncaixes: '3',
    vigenteDesde: moment(),
    vigenteAte: moment().add(5, 'years'),
    sempreDesde: false,
    sempreAte: true,
    
    // Horários Personalizados
    horariosPersonalizados: false,
    horariosCustomizados: '',
    
    // Duplicação
    duplicarDias: false,
    diasSelecionados: {
      domingo: false,
      segunda: false,
      terca: false,
      quarta: false,
      quinta: false,
      sexta: false,
      sabado: false
    },
    
    selectedDay: 'segunda-feira'
  });

  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState({});

  // Dados mock para dropdowns
  const locais = [
    { id: 1, nome: 'Consultório 1' },
    { id: 2, nome: 'Consultório 2' },
    { id: 3, nome: 'Sala de Procedimentos' }
  ];

  // Mapear dias da semana
  const diasSemana = [
    { key: 'domingo', label: 'Domingo' },
    { key: 'segunda', label: 'Segunda-feira' },
    { key: 'terca', label: 'Terça-feira' },
    { key: 'quarta', label: 'Quarta-feira' },
    { key: 'quinta', label: 'Quinta-feira' },
    { key: 'sexta', label: 'Sexta-feira' },
    { key: 'sabado', label: 'Sábado' }
  ];

  // Validações
  const validateForm = () => {
    const validationErrors = validateGradeConfig(formData);
    const newErrors = {};
    
    // Validações do hook
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => {
        if (error.includes('Horários de início e fim')) {
          newErrors.horaInicio = error;
          newErrors.horaFim = error;
        } else if (error.includes('Hora de início')) {
          newErrors.horaFim = error;
        } else if (error.includes('Intervalo')) {
          newErrors.intervaloMinutos = error;
        } else if (error.includes('Local')) {
          newErrors.local = error;
        } else if (error.includes('Formato de horário')) {
          newErrors.horariosCustomizados = error;
        }
      });
    }
    
    // Validações de vigência personalizadas
    if (!formData.sempreDesde) {
      if (!formData.vigenteDesde) {
        newErrors.vigenteDesde = 'Data de início é obrigatória';
      }
      
      if (formData.vigenteDesde && formData.vigenteAte) {
        if (formData.vigenteAte.isBefore(formData.vigenteDesde)) {
          newErrors.vigenteAte = 'Data de fim deve ser posterior à data de início';
        }
      }
      
      if (formData.vigenteDesde && formData.vigenteDesde.isBefore(moment(), 'day')) {
        newErrors.vigenteDesde = 'Data de início não pode ser no passado';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gerar preview da grade
  const generatePreview = () => {
    if (!formData.horaInicio || !formData.horaFim || !formData.intervaloMinutos) {
      return [];
    }

    const slots = [];
    const inicio = moment(formData.horaInicio);
    const fim = moment(formData.horaFim);

    if (formData.horariosPersonalizados && formData.horariosCustomizados) {
      const horariosCustom = formData.horariosCustomizados.split(',');
      horariosCustom.forEach(horario => {
        const [hora, minuto] = horario.trim().split(':');
        const slot = moment().hour(parseInt(hora)).minute(parseInt(minuto));
        if (slot.isBetween(inicio, fim, null, '[]')) {
          slots.push(slot.format('HH:mm'));
        }
      });
    } else {
      let current = moment(inicio);
      while (current.isBefore(fim) || current.isSame(fim)) {
        slots.push(current.format('HH:mm'));
        current.add(formData.intervaloMinutos, 'minutes');
      }
    }

    return slots;
  };

  // Salvar configuração
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const gradeData = {
        ...formData,
        professionalId,
        preview: generatePreview()
      };

      if (formData.duplicarDias) {
        const diasSelecionados = Object.keys(formData.diasSelecionados)
          .filter(dia => formData.diasSelecionados[dia]);
        
        const result = await saveGradeWithDuplication(gradeData, diasSelecionados);
        
        if (result.success) {
          onSave && onSave(gradeData);
          toast.success('Grade criada com sucesso!');
          // Reset form
          setFormData({
            ...formData,
            horaInicio: moment().hour(9).minute(0),
            horaFim: moment().hour(17).minute(0),
            intervaloMinutos: 30,
            local: '',
            horariosPersonalizados: false,
            horariosCustomizados: '',
            duplicarDias: false,
            diasSelecionados: {
              domingo: false,
              segunda: false,
              terca: false,
              quarta: false,
              quinta: false,
              sexta: false,
              sabado: false
            }
          });
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        onSave && onSave(gradeData);
        toast.success('Grade criada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar grade:', error);
      toast.error('Erro ao salvar grade');
    }
  };

  // Duplicar para todos os dias úteis
  const handleDuplicarDiasUteis = () => {
    setFormData(prev => ({
      ...prev,
      duplicarDias: true,
      diasSelecionados: {
        ...prev.diasSelecionados,
        segunda: true,
        terca: true,
        quarta: true,
        quinta: true,
        sexta: true
      }
    }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="pt-br">
      <Box sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Criar Grade de Horários - {professionalName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure os horários de atendimento para este profissional
          </Typography>
        </Box>

        {/* Campos de Horário */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTime />
              Configuração de Horários
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <TimePicker
                  label="De *"
                  value={formData.horaInicio}
                  onChange={(newValue) => setFormData(prev => ({ ...prev, horaInicio: newValue }))}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      size="small"
                      error={!!errors.horaInicio}
                      helperText={errors.horaInicio}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <TimePicker
                  label="Até *"
                  value={formData.horaFim}
                  onChange={(newValue) => setFormData(prev => ({ ...prev, horaFim: newValue }))}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      size="small"
                      error={!!errors.horaFim}
                      helperText={errors.horaFim}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <TextField
                  label="Intervalo (min) *"
                  type="number"
                  value={formData.intervaloMinutos}
                  onChange={(e) => setFormData(prev => ({ ...prev, intervaloMinutos: parseInt(e.target.value) || 30 }))}
                  fullWidth
                  size="small"
                  error={!!errors.intervaloMinutos}
                  helperText={errors.intervaloMinutos}
                />
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Local</InputLabel>
                  <Select
                    value={formData.local}
                    label="Local"
                    onChange={(e) => setFormData(prev => ({ ...prev, local: e.target.value }))}
                  >
                    {locais.map((local) => (
                      <MenuItem key={local.id} value={local.nome}>
                        {local.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Dia da semana */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Dia da Semana</InputLabel>
                  <Select
                    value={formData.selectedDay}
                    label="Dia da Semana"
                    onChange={(e) => setFormData(prev => ({ ...prev, selectedDay: e.target.value }))}
                  >
                    {diasSemana.map((dia) => (
                      <MenuItem key={dia.key} value={dia.key}>
                        {dia.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Período de Vigência */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarToday />
              Período de Vigência
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={formData.sempreDesde}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        sempreDesde: e.target.checked,
                        sempreAte: e.target.checked 
                      }))}
                    />
                  }
                  label="Sempre ativo (sem data de início e fim)"
                />
              </Grid>
              
              {!formData.sempreDesde && (
                <>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Data de Início"
                      value={formData.vigenteDesde}
                      onChange={(newValue) => setFormData(prev => ({ ...prev, vigenteDesde: newValue }))}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          fullWidth 
                          size="small"
                          error={!!errors.vigenteDesde}
                          helperText={errors.vigenteDesde || "Data em que a grade passa a valer"}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Data de Fim"
                      value={formData.vigenteAte}
                      onChange={(newValue) => setFormData(prev => ({ ...prev, vigenteAte: newValue }))}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          fullWidth 
                          size="small"
                          error={!!errors.vigenteAte}
                          helperText={errors.vigenteAte || "Data em que a grade expira (opcional)"}
                        />
                      )}
                    />
                  </Grid>
                </>
              )}
              
              {!formData.sempreDesde && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    A grade será válida de {formData.vigenteDesde?.format('DD/MM/YYYY')} até {formData.vigenteAte?.format('DD/MM/YYYY')}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Duplicação para múltiplos dias */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Duplicar para Múltiplos Dias
            </Typography>
            
            <FormControlLabel
              control={
                <Checkbox 
                  checked={formData.duplicarDias}
                  onChange={(e) => setFormData(prev => ({ ...prev, duplicarDias: e.target.checked }))}
                />
              }
              label="Aplicar esta grade para múltiplos dias"
            />

            {formData.duplicarDias && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={1}>
                  {diasSemana.map((dia) => (
                    <Grid item key={dia.key}>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={formData.diasSelecionados[dia.key]}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              diasSelecionados: {
                                ...prev.diasSelecionados,
                                [dia.key]: e.target.checked
                              }
                            }))}
                          />
                        }
                        label={dia.label}
                      />
                    </Grid>
                  ))}
                </Grid>
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ContentCopy />}
                  onClick={handleDuplicarDiasUteis}
                  sx={{ mt: 2 }}
                >
                  Selecionar Dias Úteis
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        {showPreview && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Preview dos Horários
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {generatePreview().map((slot, index) => (
                  <Chip
                    key={index}
                    label={slot}
                    variant="outlined"
                    color="primary"
                    size="small"
                  />
                ))}
              </Box>
              {formData.duplicarDias && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Esta grade será aplicada aos dias: {
                    diasSemana
                      .filter(dia => formData.diasSelecionados[dia.key])
                      .map(dia => dia.label)
                      .join(', ')
                  }
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            startIcon={<Preview />}
            variant="outlined"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Ocultar' : 'Mostrar'} Preview
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Grade'}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default ProfessionalGradeForm;