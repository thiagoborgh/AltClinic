import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import { FilterList, Clear } from '@mui/icons-material';

const FiltrosAgenda = ({ filtros = {}, onAplicarFiltros, onFiltrosChange }) => {
  const [open, setOpen] = useState(false);
  const [filtrosTemporarios, setFiltrosTemporarios] = useState(filtros);

  // Mapeamento de IDs para nomes
  const profissionaisMap = {
    '1': 'Dr. João Silva',
    '2': 'Dra. Maria Santos', 
    '3': 'Dr. Carlos Lima',
    '4': 'Dra. Ana Costa'
  };

  const handleFiltrosClick = () => {
    try {
      setFiltrosTemporarios(filtros);
      setOpen(true);
    } catch (error) {
      console.warn('Erro capturado ao abrir filtros:', error);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFiltrosTemporarios(filtros); // Reset para os filtros originais
  };

  const handleAplicar = () => {
    try {
      const callback = onFiltrosChange || onAplicarFiltros;
      if (callback) {
        callback(filtrosTemporarios);
      }
      setOpen(false);
    } catch (error) {
      console.warn('Erro capturado ao aplicar filtros:', error);
    }
  };

  const handleLimpar = () => {
    const filtrosLimpos = {
      especialidade: '',
      profissional: '',
      equipamento: '',
      status: ''
    };
    setFiltrosTemporarios(filtrosLimpos);
  };

  const handleChipDelete = (filtroKey, defaultValue = '') => {
    try {
      const callback = onFiltrosChange || onAplicarFiltros;
      if (callback) {
        callback({ ...filtros, [filtroKey]: defaultValue });
      }
    } catch (error) {
      console.warn('Erro capturado ao remover filtro:', error);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltrosTemporarios(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Contar filtros ativos
  const filtrosAtivos = Object.values(filtros).filter(valor => valor && valor !== '' && valor !== 'todos').length;

  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<FilterList />}
        onClick={handleFiltrosClick}
        sx={{
          borderColor: filtrosAtivos > 0 ? 'primary.main' : undefined,
          backgroundColor: filtrosAtivos > 0 ? 'primary.50' : undefined
        }}
      >
        Filtros {filtrosAtivos > 0 && `(${filtrosAtivos})`}
      </Button>
      
      {/* Chips dos filtros ativos */}
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
        {filtros.status && filtros.status !== '' && (
          <Chip
            label={`Status: ${filtros.status}`}
            size="small"
            onDelete={() => handleChipDelete('status')}
          />
        )}
        {filtros.profissional && filtros.profissional !== '' && (
          <Chip
            label={`Profissional: ${profissionaisMap[filtros.profissional] || filtros.profissional}`}
            size="small"
            onDelete={() => handleChipDelete('profissional')}
          />
        )}
        {filtros.especialidade && filtros.especialidade !== '' && (
          <Chip
            label={`Especialidade: ${filtros.especialidade}`}
            size="small"
            onDelete={() => handleChipDelete('especialidade')}
          />
        )}
        {filtros.equipamento && filtros.equipamento !== '' && (
          <Chip
            label={`Equipamento: ${filtros.equipamento}`}
            size="small"
            onDelete={() => handleChipDelete('equipamento')}
          />
        )}
      </Stack>

      {/* Modal de Filtros */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Filtros da Agenda
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Status */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filtrosTemporarios.status || ''}
                  label="Status"
                  onChange={(e) => handleFiltroChange('status', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="confirmado">Confirmado</MenuItem>
                  <MenuItem value="pendente">Pendente</MenuItem>
                  <MenuItem value="cancelado">Cancelado</MenuItem>
                  <MenuItem value="reagendado">Reagendado</MenuItem>
                  <MenuItem value="em-andamento">Em Andamento</MenuItem>
                  <MenuItem value="concluido">Concluído</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Especialidade */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Especialidade</InputLabel>
                <Select
                  value={filtrosTemporarios.especialidade || ''}
                  label="Especialidade"
                  onChange={(e) => handleFiltroChange('especialidade', e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="dermatologia">Dermatologia</MenuItem>
                  <MenuItem value="cardiologia">Cardiologia</MenuItem>
                  <MenuItem value="ortopedia">Ortopedia</MenuItem>
                  <MenuItem value="neurologia">Neurologia</MenuItem>
                  <MenuItem value="pediatria">Pediatria</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Profissional */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Profissional</InputLabel>
                <Select
                  value={filtrosTemporarios.profissional || ''}
                  label="Profissional"
                  onChange={(e) => handleFiltroChange('profissional', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="1">Dr. João Silva</MenuItem>
                  <MenuItem value="2">Dra. Maria Santos</MenuItem>
                  <MenuItem value="3">Dr. Carlos Lima</MenuItem>
                  <MenuItem value="4">Dra. Ana Costa</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Equipamento */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Equipamento</InputLabel>
                <Select
                  value={filtrosTemporarios.equipamento || ''}
                  label="Equipamento"
                  onChange={(e) => handleFiltroChange('equipamento', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="Laser CO2">Laser CO2</MenuItem>
                  <MenuItem value="Ultrassom">Ultrassom</MenuItem>
                  <MenuItem value="Radiofrequência">Radiofrequência</MenuItem>
                  <MenuItem value="Criolipólise">Criolipólise</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleLimpar}
            startIcon={<Clear />}
            color="secondary"
          >
            Limpar
          </Button>
          <Button onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAplicar}
            variant="contained"
          >
            Aplicar Filtros
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FiltrosAgenda;
