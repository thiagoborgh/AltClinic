import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';

const EquipamentosModal = ({ open, onClose, equipamentos = [] }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Gestão de Equipamentos</DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Equipamentos Disponíveis
          </Typography>
          
          {equipamentos.map((equipamento) => (
            <Box key={equipamento.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Typography variant="subtitle1">{equipamento.nome}</Typography>
              <Typography variant="body2" color="text.secondary">
                Tipo: {equipamento.tipo}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Status: {equipamento.status}
              </Typography>
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

export default EquipamentosModal;
