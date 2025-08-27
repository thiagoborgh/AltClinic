import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip
} from '@mui/material';
import moment from 'moment';

const LembretesModal = ({ open, onClose, lembretes = [], onEnviarLembrete }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Sistema de Lembretes</DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Lembretes Programados
          </Typography>
          
          {lembretes.map((lembrete) => (
            <Box key={lembrete.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Typography variant="subtitle1">{lembrete.paciente}</Typography>
              <Typography variant="body2" color="text.secondary">
                {lembrete.procedimento}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Data: {moment(lembrete.dataAgendamento).format('DD/MM/YYYY HH:mm')}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip 
                  label={lembrete.tipo} 
                  size="small" 
                  color={lembrete.enviado ? 'success' : 'warning'} 
                />
                <Chip 
                  label={lembrete.status} 
                  size="small" 
                  variant="outlined" 
                  sx={{ ml: 1 }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LembretesModal;
