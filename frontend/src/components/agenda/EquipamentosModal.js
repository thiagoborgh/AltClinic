import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  Close,
  Settings,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { mockEquipamentos } from '../../data/mockAgenda';

const EquipamentosModal = ({ open, onClose }) => {
  const [equipamentos, setEquipamentos] = useState(mockEquipamentos);
  const [editando, setEditando] = useState(null);
  const [novoEquipamento, setNovoEquipamento] = useState({
    nome: '',
    tipo: '',
    capacidade: 1,
    especialidades: [],
    equipamentos: [],
    status: 'ativo',
    observacoes: ''
  });

  const tiposEquipamento = [
    'Sala de Procedimentos',
    'Sala de Massagem',
    'Sala de Fisioterapia',
    'Consultório Médico',
    'Área Comum',
    'Laboratório',
    'Sala de Cirurgia'
  ];

  const especialidadesDisponiveis = [
    'Estética',
    'Fisioterapia',
    'Dermatologia',
    'Clínica Geral',
    'Massoterapia',
    'Todas'
  ];

  const handleEdit = (equipamento) => {
    setEditando(equipamento.id);
    setNovoEquipamento({ ...equipamento });
  };

  const handleSave = () => {
    if (editando) {
      setEquipamentos(prev => prev.map(eq => 
        eq.id === editando ? { ...novoEquipamento, id: editando } : eq
      ));
      setEditando(null);
    } else {
      const novoId = Math.max(...equipamentos.map(eq => eq.id)) + 1;
      setEquipamentos(prev => [...prev, { ...novoEquipamento, id: novoId }]);
    }
    
    setNovoEquipamento({
      nome: '',
      tipo: '',
      capacidade: 1,
      especialidades: [],
      equipamentos: [],
      status: 'ativo',
      observacoes: ''
    });
  };

  const handleCancel = () => {
    setEditando(null);
    setNovoEquipamento({
      nome: '',
      tipo: '',
      capacidade: 1,
      especialidades: [],
      equipamentos: [],
      status: 'ativo',
      observacoes: ''
    });
  };

  const handleDelete = (id) => {
    setEquipamentos(prev => prev.filter(eq => eq.id !== id));
  };

  const handleChange = (field, value) => {
    setNovoEquipamento(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ativo': return 'success';
      case 'inativo': return 'error';
      case 'manutencao': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings />
          <Typography variant="h6">
            Gestão de Equipamentos e Salas
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Formulário de novo/edição */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {editando ? 'Editar Equipamento' : 'Novo Equipamento'}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome *"
                value={novoEquipamento.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo *</InputLabel>
                <Select
                  value={novoEquipamento.tipo}
                  label="Tipo *"
                  onChange={(e) => handleChange('tipo', e.target.value)}
                >
                  {tiposEquipamento.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>
                      {tipo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Capacidade"
                type="number"
                value={novoEquipamento.capacidade}
                onChange={(e) => handleChange('capacidade', parseInt(e.target.value))}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={novoEquipamento.status}
                  label="Status"
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <MenuItem value="ativo">Ativo</MenuItem>
                  <MenuItem value="inativo">Inativo</MenuItem>
                  <MenuItem value="manutencao">Manutenção</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Especialidades</InputLabel>
                <Select
                  multiple
                  value={novoEquipamento.especialidades}
                  label="Especialidades"
                  onChange={(e) => handleChange('especialidades', e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {especialidadesDisponiveis.map((esp) => (
                    <MenuItem key={esp} value={esp}>
                      {esp}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={2}
                value={novoEquipamento.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={!novoEquipamento.nome || !novoEquipamento.tipo}
                  startIcon={editando ? <Edit /> : <Add />}
                >
                  {editando ? 'Atualizar' : 'Adicionar'}
                </Button>
                {editando && (
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    startIcon={<Cancel />}
                  >
                    Cancelar
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Lista de equipamentos */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Capacidade</TableCell>
                <TableCell>Especialidades</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {equipamentos.map((equipamento) => (
                <TableRow key={equipamento.id}>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {equipamento.nome}
                    </Typography>
                    {equipamento.observacoes && (
                      <Typography variant="caption" color="text.secondary">
                        {equipamento.observacoes}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{equipamento.tipo}</TableCell>
                  <TableCell>{equipamento.capacidade}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {equipamento.especialidades.map((esp) => (
                        <Chip key={esp} label={esp} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={equipamento.status === 'ativo' ? <CheckCircle /> : <Cancel />}
                      label={equipamento.status}
                      color={getStatusColor(equipamento.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(equipamento)}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(equipamento.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EquipamentosModal;
