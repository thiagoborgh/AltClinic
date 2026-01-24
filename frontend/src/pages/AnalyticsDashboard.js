import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  People,
  WhatsApp,
  CalendarToday,
  Assessment,
  Download
} from '@mui/icons-material';
import { useAnalytics, ANALYTICS_EVENTS } from '../hooks/useAnalytics';

const AnalyticsDashboard = () => {
  const { getStoredEvents, clearStoredEvents } = useAnalytics();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filterEvent, setFilterEvent] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showClearDialog, setShowClearDialog] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, filterEvent, filterDate]);

  const loadEvents = () => {
    const storedEvents = getStoredEvents();
    setEvents(storedEvents);
  };

  const applyFilters = () => {
    let filtered = events;

    if (filterEvent) {
      filtered = filtered.filter(event => event.event === filterEvent);
    }

    if (filterDate) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.timestamp).toISOString().split('T')[0];
        return eventDate === filterDate;
      });
    }

    // Ordenar por data decrescente
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setFilteredEvents(filtered);
  };

  const handleClearEvents = () => {
    clearStoredEvents();
    setEvents([]);
    setFilteredEvents([]);
    setShowClearDialog(false);
  };

  const exportEvents = () => {
    const dataStr = JSON.stringify(filteredEvents, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `analytics-events-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Calcular métricas
  const calculateMetrics = () => {
    const totalEvents = events.length;
    const uniqueUsers = new Set(events.map(e => e.userId || 'anonymous')).size;

    const onboardingStarted = events.filter(e => e.event === ANALYTICS_EVENTS.ONBOARDING_STARTED).length;
    const onboardingCompleted = events.filter(e => e.event === ANALYTICS_EVENTS.ONBOARDING_COMPLETED).length;
    const completionRate = onboardingStarted > 0 ? (onboardingCompleted / onboardingStarted * 100).toFixed(1) : 0;

    const firstAppointments = events.filter(e => e.event === ANALYTICS_EVENTS.FIRST_APPOINTMENT_CREATED).length;
    const whatsappConnected = events.filter(e => e.event === ANALYTICS_EVENTS.WHATSAPP_CONNECTED).length;
    const remindersActivated = events.filter(e => e.event === ANALYTICS_EVENTS.REMINDERS_ACTIVATED).length;

    const cancellations = events.filter(e => e.event === ANALYTICS_EVENTS.ACCOUNT_CANCELLED).length;

    return {
      totalEvents,
      uniqueUsers,
      completionRate,
      firstAppointments,
      whatsappConnected,
      remindersActivated,
      cancellations
    };
  };

  const metrics = calculateMetrics();

  const eventOptions = Object.values(ANALYTICS_EVENTS);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        📊 Dashboard de Analytics
      </Typography>

      {/* Métricas Principais */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Assessment color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total de Eventos</Typography>
              </Box>
              <Typography variant="h3" color="primary" fontWeight="bold">
                {metrics.totalEvents}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <People color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Usuários Únicos</Typography>
              </Box>
              <Typography variant="h3" color="secondary" fontWeight="bold">
                {metrics.uniqueUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Taxa Onboarding</Typography>
              </Box>
              <Typography variant="h3" color="success" fontWeight="bold">
                {metrics.completionRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CalendarToday color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Primeiros Agend.</Typography>
              </Box>
              <Typography variant="h3" color="warning" fontWeight="bold">
                {metrics.firstAppointments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Métricas de Conversão */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <WhatsApp color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">WhatsApp Conectado</Typography>
              </Box>
              <Typography variant="h4" color="success" fontWeight="bold">
                {metrics.whatsappConnected}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CalendarToday color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Lembretes Ativados</Typography>
              </Box>
              <Typography variant="h4" color="info" fontWeight="bold">
                {metrics.remindersActivated}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Cancelamentos</Typography>
              </Box>
              <Typography variant="h4" color="error" fontWeight="bold">
                {metrics.cancellations}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros e Ações */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          select
          label="Filtrar por Evento"
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Todos os eventos</MenuItem>
          {eventOptions.map((event) => (
            <MenuItem key={event} value={event}>
              {event}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          type="date"
          label="Filtrar por Data"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={exportEvents}
          disabled={filteredEvents.length === 0}
        >
          Exportar
        </Button>

        <Button
          variant="outlined"
          color="error"
          onClick={() => setShowClearDialog(true)}
          disabled={events.length === 0}
        >
          Limpar Dados
        </Button>
      </Box>

      {/* Tabela de Eventos */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Eventos Recentes ({filteredEvents.length})
          </Typography>

          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Data/Hora</TableCell>
                  <TableCell>Evento</TableCell>
                  <TableCell>Detalhes</TableCell>
                  <TableCell>Página</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEvents.slice(0, 100).map((event, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {new Date(event.timestamp).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={event.event}
                        size="small"
                        color={getEventColor(event.event)}
                      />
                    </TableCell>
                    <TableCell>
                      {Object.keys(event).filter(key =>
                        !['event', 'timestamp', 'userAgent', 'url'].includes(key)
                      ).map(key => (
                        <Typography key={key} variant="body2" color="text.secondary">
                          {key}: {JSON.stringify(event[key])}
                        </Typography>
                      ))}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography variant="body2" noWrap>
                        {event.url}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredEvents.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Nenhum evento encontrado com os filtros aplicados.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação para Limpar */}
      <Dialog open={showClearDialog} onClose={() => setShowClearDialog(false)}>
        <DialogTitle>Limpar Dados de Analytics</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja limpar todos os dados de analytics armazenados?
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowClearDialog(false)}>Cancelar</Button>
          <Button onClick={handleClearEvents} color="error" variant="contained">
            Limpar Dados
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

// Função auxiliar para definir cores dos eventos
const getEventColor = (event) => {
  const colorMap = {
    [ANALYTICS_EVENTS.ONBOARDING_STARTED]: 'info',
    [ANALYTICS_EVENTS.ONBOARDING_COMPLETED]: 'success',
    [ANALYTICS_EVENTS.FIRST_APPOINTMENT_CREATED]: 'primary',
    [ANALYTICS_EVENTS.WHATSAPP_CONNECTED]: 'success',
    [ANALYTICS_EVENTS.REMINDERS_ACTIVATED]: 'warning',
    [ANALYTICS_EVENTS.ACCOUNT_CANCELLED]: 'error'
  };

  return colorMap[event] || 'default';
};

export default AnalyticsDashboard;