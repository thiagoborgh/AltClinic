import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Card,
  CardContent,
  Collapse,
  IconButton,
  Typography
} from '@mui/material';
import { ExpandMore, FilterList } from '@mui/icons-material';
import { mockProfissionais, mockEquipamentos, mockProcedimentos } from '../../data/mockAgenda';

const FiltrosAgenda = ({ filtros, onFiltrosChange, expanded = false }) => {
  const [isExpanded, setIsExpanded] = React.useState(expanded);

  const handleFiltroChange = (campo, valor) => {
    onFiltrosChange({
      ...filtros,
      [campo]: valor
    });
  };

  const especialidades = [...new Set(mockProcedimentos.map(p => p.especialidade))];
  const statusOptions = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'confirmado', label: 'Confirmado' },
    { value: 'em-andamento', label: 'Em Andamento' },
    { value: 'concluido', label: 'Concluído' },
    { value: 'cancelado', label: 'Cancelado' },
    { value: 'reagendado', label: 'Reagendado' }
  ];

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ pb: isExpanded ? 2 : 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList color="primary" />
            <Typography variant="h6">
              Filtros
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setIsExpanded(!isExpanded)}
            sx={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s'
            }}
          >
            <ExpandMore />
          </IconButton>
        </Box>

        <Collapse in={isExpanded}>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Especialidade</InputLabel>
                  <Select
                    value={filtros.especialidade || ''}
                    label="Especialidade"
                    onChange={(e) => handleFiltroChange('especialidade', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Todas</em>
                    </MenuItem>
                    {especialidades.map((especialidade) => (
                      <MenuItem key={especialidade} value={especialidade}>
                        {especialidade}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Profissional</InputLabel>
                  <Select
                    value={filtros.profissional || ''}
                    label="Profissional"
                    onChange={(e) => handleFiltroChange('profissional', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Todos</em>
                    </MenuItem>
                    {mockProfissionais.map((profissional) => (
                      <MenuItem key={profissional.id} value={profissional.nome}>
                        {profissional.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Equipamento/Sala</InputLabel>
                  <Select
                    value={filtros.equipamento || ''}
                    label="Equipamento/Sala"
                    onChange={(e) => handleFiltroChange('equipamento', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Todos</em>
                    </MenuItem>
                    {mockEquipamentos.map((equipamento) => (
                      <MenuItem key={equipamento.id} value={equipamento.nome}>
                        {equipamento.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filtros.status || ''}
                    label="Status"
                    onChange={(e) => handleFiltroChange('status', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Todos</em>
                    </MenuItem>
                    {statusOptions.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Buscar paciente"
                  value={filtros.paciente || ''}
                  onChange={(e) => handleFiltroChange('paciente', e.target.value)}
                  placeholder="Nome do paciente..."
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Data inicial"
                  value={filtros.dataInicial || ''}
                  onChange={(e) => handleFiltroChange('dataInicial', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Data final"
                  value={filtros.dataFinal || ''}
                  onChange={(e) => handleFiltroChange('dataFinal', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Procedimento</InputLabel>
                  <Select
                    value={filtros.procedimento || ''}
                    label="Procedimento"
                    onChange={(e) => handleFiltroChange('procedimento', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Todos</em>
                    </MenuItem>
                    {mockProcedimentos.map((procedimento) => (
                      <MenuItem key={procedimento.id} value={procedimento.nome}>
                        {procedimento.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default FiltrosAgenda;
