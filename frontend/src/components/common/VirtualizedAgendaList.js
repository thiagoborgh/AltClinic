import React from 'react';
import { Box, Card, Typography, Chip, Stack, IconButton, Tooltip } from '@mui/material';
import { Edit, CheckCircle, AccessTime } from '@mui/icons-material';
import moment from 'moment';

// Componente principal com lista otimizada
const VirtualizedAgendaList = ({
  agendamentos = [],
  height = 600,
  onEditAgendamento,
  onSelectAgendamento
}) => {
  if (agendamentos.length === 0) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 200,
        flexDirection: 'column'
      }}>
        <Typography variant="h6" color="text.secondary">
          Nenhum agendamento encontrado
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Selecione outra data ou crie um novo agendamento
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height, overflow: 'auto', width: '100%' }}>
      {agendamentos.map((agendamento, index) => (
        <Card
          key={index}
          sx={{
            mb: 1,
            cursor: 'pointer',
            '&:hover': { boxShadow: 3 },
            transition: 'box-shadow 0.2s ease-in-out'
          }}
          onClick={() => onSelectAgendamento(agendamento)}
        >
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {moment(agendamento.data).format('HH:mm')} - {agendamento.paciente}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {agendamento.procedimento} • {agendamento.profissional}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  icon={agendamento.status === 'confirmado' ? <CheckCircle /> : <AccessTime />}
                  label={agendamento.status}
                  size="small"
                  color={agendamento.status === 'confirmado' ? 'success' : 'warning'}
                />
                <Tooltip title="Editar">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditAgendamento(agendamento);
                    }}
                  >
                    <Edit />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>

            {agendamento.observacoes && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {agendamento.observacoes}
              </Typography>
            )}
          </Box>
        </Card>
      ))}
    </Box>
  );
};

export default VirtualizedAgendaList;