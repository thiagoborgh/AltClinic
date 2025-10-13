import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
  Grid
} from '@mui/material';
import {
  Delete as DeleteIcon,
  History as HistoryIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { professionalService } from '../../services/api';

const ProfessionalSchedule = ({ professionalId, professionalName }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleStats, setScheduleStats] = useState(null);

  // Carregar horários do profissional
  const loadSchedules = useCallback(async () => {
    if (!professionalId) return;
    
    setLoading(true);
    setError('');
    
    try {
      console.log('🔍 Carregando grades para professional:', professionalId);
      const response = await professionalService.getSchedules(professionalId);
      
      console.log('📋 Response do API:', response.data);
      
      if (response.data?.schedules) {
        setSchedules(response.data.schedules);
        calculateStats(response.data.schedules);
      } else {
        setSchedules([]);
        setScheduleStats(null);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar grades:', err);
      setError('Erro ao carregar horários do profissional');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  // Calcular estatísticas dos horários
  const calculateStats = (scheduleData) => {
    if (!scheduleData || scheduleData.length === 0) {
      setScheduleStats(null);
      return;
    }

    // Agrupar por dia da semana
    const groupedByDay = scheduleData.reduce((acc, schedule) => {
      const day = schedule.day_of_week;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(schedule);
      return acc;
    }, {});

    // Encontrar data de criação mais antiga e mais recente
    const dates = scheduleData
      .map(s => new Date(s.created_at))
      .filter(date => !isNaN(date.getTime()));
    
    const oldestDate = dates.length > 0 ? new Date(Math.min(...dates)) : null;
    const newestDate = dates.length > 0 ? new Date(Math.max(...dates)) : null;

    setScheduleStats({
      totalSchedules: scheduleData.length,
      daysWithSchedules: Object.keys(groupedByDay).length,
      groupedByDay,
      oldestDate,
      newestDate
    });
  };

  // Deletar todas as grades
  const handleDeleteAllGrades = async () => {
    try {
      setLoading(true);
      
      console.log('🗑️ Deletando todas as grades do professional:', professionalId);
      
      // Usar a nova API para deletar todos os horários
      const response = await professionalService.deleteAllSchedules(professionalId);
      
      console.log('✅ Response da deleção:', response.data);
      
      // Recarregar os dados
      await loadSchedules();
      
      setDeleteDialogOpen(false);
      
    } catch (err) {
      console.error('❌ Erro ao deletar grades:', err);
      setError('Erro ao deletar horários');
    } finally {
      setLoading(false);
    }
  };

  // Mapear números dos dias para nomes
  const getDayName = (dayNumber) => {
    const days = {
      0: 'Domingo',
      1: 'Segunda-feira', 
      2: 'Terça-feira',
      3: 'Quarta-feira',
      4: 'Quinta-feira',
      5: 'Sexta-feira',
      6: 'Sábado'
    };
    return days[dayNumber] || `Dia ${dayNumber}`;
  };

  // Carregar dados quando o componente montar ou professionalId mudar
  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Carregando histórico de grades...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Cabeçalho */}
      <Box display="flex" alignItems="center" mb={3}>
        <HistoryIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">
          Histórico de Grades Criadas - {professionalName}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Estatísticas das grades */}
      {scheduleStats && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon />
              Resumo das Grades
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary.main">
                    {scheduleStats.totalSchedules}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de Horários
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="secondary.main">
                    {scheduleStats.daysWithSchedules}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dias Configurados
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    Primeira Grade
                  </Typography>
                  <Typography variant="body1">
                    {scheduleStats.oldestDate ? scheduleStats.oldestDate.toLocaleDateString('pt-BR') : '-'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    Última Grade
                  </Typography>
                  <Typography variant="body1">
                    {scheduleStats.newestDate ? scheduleStats.newestDate.toLocaleDateString('pt-BR') : '-'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Lista de horários */}
      {schedules.length > 0 ? (
        <>
          {/* Botão de deletar todas as grades */}
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
              disabled={loading}
            >
              Deletar Todas as Grades
            </Button>
          </Box>

          {/* Tabela de horários */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Dia da Semana</TableCell>
                  <TableCell>Horário</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Criado em</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schedules.map((schedule, index) => (
                  <TableRow key={schedule.id || index}>
                    <TableCell>
                      <Chip 
                        label={getDayName(schedule.day_of_week)}
                        variant="outlined"
                        icon={<CalendarIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {schedule.start_time} - {schedule.end_time}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={schedule.is_available ? 'Disponível' : 'Indisponível'}
                        color={schedule.is_available ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {schedule.created_at ? new Date(schedule.created_at).toLocaleString('pt-BR') : '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <ScheduleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhuma Grade Encontrada
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Este profissional ainda não possui grades de horários configuradas.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmação para deletar */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          Confirmar Exclusão
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja deletar <strong>todas as grades de horários</strong> do profissional <strong>{professionalName}</strong>?
          </DialogContentText>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta ação irá remover todos os {scheduleStats?.totalSchedules || 0} horários configurados, mas os agendamentos existentes serão preservados.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteAllGrades} 
            color="error" 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {loading ? 'Deletando...' : 'Deletar Todas'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfessionalSchedule;