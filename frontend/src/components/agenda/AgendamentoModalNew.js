import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';

const AgendamentoModal = ({ open, onClose, event, onSave, equipamentos = [] }) => {
  const [formData, setFormData] = useState({
    paciente: { nome: '', telefone: '', email: '' },
    procedimento: '',
    profissional: '',
    equipamento: '',
    start: new Date(),
    end: new Date(),
    observacoes: '',
    valor: 0
  });

  React.useEffect(() => {
    if (event && !event.isNew) {
      setFormData({
        ...event,
        start: event.start || new Date(),
        end: event.end || new Date()
      });
    } else {
      setFormData({
        paciente: { nome: '', telefone: '', email: '' },
        procedimento: '',
        profissional: '',
        equipamento: '',
        start: event?.start || new Date(),
        end: event?.end || new Date(),
        observacoes: '',
        valor: 0
      });
    }
  }, [event]);

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="pt-br">
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {event?.isNew ? 'Novo Agendamento' : 'Editar Agendamento'}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome do Paciente"
                value={formData.paciente?.nome || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  paciente: { ...prev.paciente, nome: e.target.value }
                }))}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={formData.paciente?.telefone || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  paciente: { ...prev.paciente, telefone: e.target.value }
                }))}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Procedimento</InputLabel>
                <Select
                  value={formData.procedimento}
                  label="Procedimento"
                  onChange={(e) => setFormData(prev => ({ ...prev, procedimento: e.target.value }))}
                >
                  <MenuItem value="Limpeza Facial">Limpeza Facial</MenuItem>
                  <MenuItem value="Massagem Relaxante">Massagem Relaxante</MenuItem>
                  <MenuItem value="Consulta Dermatológica">Consulta Dermatológica</MenuItem>
                  <MenuItem value="Fisioterapia">Fisioterapia</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Profissional</InputLabel>
                <Select
                  value={formData.profissional}
                  label="Profissional"
                  onChange={(e) => setFormData(prev => ({ ...prev, profissional: e.target.value }))}
                >
                  <MenuItem value="Dra. Ana Costa">Dra. Ana Costa</MenuItem>
                  <MenuItem value="Dr. Carlos Lima">Dr. Carlos Lima</MenuItem>
                  <MenuItem value="Dra. Marina Rocha">Dra. Marina Rocha</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="Data e Hora de Início"
                value={moment(formData.start)}
                onChange={(newValue) => setFormData(prev => ({ 
                  ...prev, 
                  start: newValue?.toDate() || new Date() 
                }))}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="Data e Hora de Fim"
                value={moment(formData.end)}
                onChange={(newValue) => setFormData(prev => ({ 
                  ...prev, 
                  end: newValue?.toDate() || new Date() 
                }))}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={3}
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AgendamentoModal;
