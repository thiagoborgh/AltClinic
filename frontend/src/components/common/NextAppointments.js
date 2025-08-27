import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
  Chip,
  Avatar,
  Divider
} from '@mui/material';
import {
  AccessTime,
  MedicalServices
} from '@mui/icons-material';

const StatusChip = ({ status }) => {
  const statusConfig = {
    confirmado: { color: 'success', label: 'Confirmado' },
    pendente: { color: 'warning', label: 'Pendente' },
    reagendado: { color: 'error', label: 'Reagendado' }
  };
  
  const config = statusConfig[status] || statusConfig.pendente;
  
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="outlined"
    />
  );
};

const NextAppointments = ({ appointments = [] }) => {
  const defaultAppointments = [
    {
      id: 1,
      paciente: 'Maria Silva',
      procedimento: 'Limpeza de Pele',
      horario: '09:00',
      status: 'confirmado',
      avatar: 'MS'
    },
    {
      id: 2,
      paciente: 'João Santos',
      procedimento: 'Botox',
      horario: '10:30',
      status: 'pendente',
      avatar: 'JS'
    },
    {
      id: 3,
      paciente: 'Ana Costa',
      procedimento: 'Preenchimento',
      horario: '14:00',
      status: 'confirmado',
      avatar: 'AC'
    },
    {
      id: 4,
      paciente: 'Carlos Lima',
      procedimento: 'Peeling',
      horario: '15:30',
      status: 'reagendado',
      avatar: 'CL'
    }
  ];

  const displayAppointments = appointments.length > 0 ? appointments : defaultAppointments;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Próximos Agendamentos
        </Typography>
        
        <List disablePadding>
          {displayAppointments.map((appointment, index) => (
            <React.Fragment key={appointment.id}>
              <ListItem sx={{ px: 0, py: 1.5 }}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    mr: 2,
                    width: 40,
                    height: 40
                  }}
                >
                  {appointment.avatar}
                </Avatar>
                
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body1" fontWeight="medium">
                        {appointment.paciente}
                      </Typography>
                      <StatusChip status={appointment.status} />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <MedicalServices sx={{ fontSize: '0.875rem', mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {appointment.procedimento}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        <AccessTime sx={{ fontSize: '0.875rem', mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {appointment.horario}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
              {index < displayAppointments.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default NextAppointments;
