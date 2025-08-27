import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid } from '@mui/material';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pt-br';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAgenda } from '../hooks/useAgendaSimple';

// Configurar moment para português
moment.locale('pt-br');
const localizer = momentLocalizer(moment);

const AgendaFuncional = () => {
  // Hook para dados da agenda
  const { agendamentos, loading, error, criarAgendamento } = useAgenda();
  
  // Estados do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [novoAgendamento, setNovoAgendamento] = useState({
    title: '',
    start: new Date(),
    end: new Date(),
    paciente: ''
  });

  const handleSelectEvent = (event) => {
    alert(`📅 Agendamento: ${event.title}\n⏰ Horário: ${moment(event.start).format('DD/MM/YYYY HH:mm')}`);
  };

  const handleSelectSlot = (slotInfo) => {
    setNovoAgendamento({
      title: '',
      start: slotInfo.start,
      end: slotInfo.end,
      paciente: ''
    });
    setModalOpen(true);
  };

  const handleSalvarAgendamento = async () => {
    if (!novoAgendamento.title || !novoAgendamento.paciente) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const agendamento = {
      id: Date.now(),
      title: `${novoAgendamento.paciente} - ${novoAgendamento.title}`,
      start: novoAgendamento.start,
      end: novoAgendamento.end,
      paciente: { nome: novoAgendamento.paciente },
      procedimento: novoAgendamento.title,
      status: 'confirmado'
    };

    try {
      await criarAgendamento(agendamento);
      setModalOpen(false);
      setNovoAgendamento({ title: '', start: new Date(), end: new Date(), paciente: '' });
      alert('✅ Agendamento criado com sucesso!');
    } catch (err) {
      alert('❌ Erro ao criar agendamento');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">⏳ Carregando agenda...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">❌ Erro: {error}</Typography>
        <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
          🔄 Tentar Novamente
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        📅 Agenda ALTclinic
      </Typography>
      
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Clique em um horário vazio para criar um novo agendamento ou clique em um evento existente para ver detalhes.
      </Typography>
      
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Calendário de Agendamentos
            </Typography>
            <Typography variant="body2" color="primary">
              📊 Total: {agendamentos?.length || 0} agendamentos
            </Typography>
          </Box>
          
          <Box sx={{ height: 600, mt: 2 }}>
            <Calendar
              localizer={localizer}
              events={agendamentos || []}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable={true}
              style={{ height: '100%' }}
              messages={{
                next: 'Próximo',
                previous: 'Anterior',
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana',
                day: 'Dia',
                agenda: 'Lista',
                date: 'Data',
                time: 'Hora',
                event: 'Evento',
                noEventsInRange: 'Não há eventos neste período.',
                showMore: total => `+ Ver mais (${total})`
              }}
              formats={{
                dayFormat: 'DD',
                dayHeaderFormat: 'dddd, DD/MM',
                dayRangeHeaderFormat: ({ start, end }) => 
                  `${moment(start).format('DD/MM')} - ${moment(end).format('DD/MM')}`,
                monthHeaderFormat: 'MMMM YYYY',
                weekdayFormat: 'dddd'
              }}
              views={['month', 'week', 'day', 'agenda']}
              defaultView="week"
              popup={true}
              step={30}
              timeslots={2}
              min={moment().hour(7).minute(0).toDate()}
              max={moment().hour(19).minute(0).toDate()}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Modal de Novo Agendamento */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          📅 Novo Agendamento
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome do Paciente *"
                value={novoAgendamento.paciente}
                onChange={(e) => setNovoAgendamento(prev => ({ ...prev, paciente: e.target.value }))}
                placeholder="Ex: Maria Silva"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Procedimento *"
                value={novoAgendamento.title}
                onChange={(e) => setNovoAgendamento(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Limpeza Facial"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data e Hora de Início"
                type="datetime-local"
                value={moment(novoAgendamento.start).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => setNovoAgendamento(prev => ({ 
                  ...prev, 
                  start: new Date(e.target.value) 
                }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data e Hora de Fim"
                type="datetime-local"
                value={moment(novoAgendamento.end).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => setNovoAgendamento(prev => ({ 
                  ...prev, 
                  end: new Date(e.target.value) 
                }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>
            ❌ Cancelar
          </Button>
          <Button onClick={handleSalvarAgendamento} variant="contained">
            ✅ Criar Agendamento
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgendaFuncional;
