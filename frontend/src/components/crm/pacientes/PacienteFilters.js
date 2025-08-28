import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Typography,
  Grid,
  Collapse,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { useSegmentos } from '../../../hooks/crm/useCRM';

const PacienteFilters = ({ filters = {}, onChange, onReset }) => {
  const [expanded, setExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    search: '',
    status: 'todos',
    segmento: '',
    orderBy: 'nome',
    order: 'asc',
    ...filters
  });

  const { segmentos, loading: segmentosLoading } = useSegmentos();

  // Sincronizar com filtros externos
  useEffect(() => {
    setLocalFilters(prev => ({
      ...prev,
      ...filters
    }));
  }, [filters]);

  const handleFilterChange = (field, value) => {
    const newFilters = {
      ...localFilters,
      [field]: value
    };
    setLocalFilters(newFilters);
    
    if (onChange) {
      onChange(newFilters);
    }
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      status: 'todos',
      segmento: '',
      orderBy: 'nome',
      order: 'asc'
    };
    setLocalFilters(resetFilters);
    
    if (onReset) {
      onReset();
    }
    
    if (onChange) {
      onChange(resetFilters);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.search) count++;
    if (localFilters.status !== 'todos') count++;
    if (localFilters.segmento) count++;
    if (localFilters.orderBy !== 'nome') count++;
    return count;
  };

  const statusOptions = [
    { value: 'todos', label: 'Todos os Status' },
    { value: 'ativo', label: 'Ativos' },
    { value: 'inativo', label: 'Inativos' },
    { value: 'perdido', label: 'Perdidos' }
  ];

  const orderOptions = [
    { value: 'nome', label: 'Nome' },
    { value: 'ultima_consulta', label: 'Última Consulta' },
    { value: 'valor_total_gasto', label: 'Valor Gasto' },
    { value: 'numero_consultas', label: 'Nº Consultas' }
  ];

  return (
    <Paper sx={{ mb: 3 }}>
      {/* Filtros Básicos - Sempre Visíveis */}
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Busca */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nome, email ou telefone..."
              value={localFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>

          {/* Status */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={localFilters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Ordenação */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Ordenar por</InputLabel>
              <Select
                value={localFilters.orderBy}
                label="Ordenar por"
                onChange={(e) => handleFilterChange('orderBy', e.target.value)}
              >
                {orderOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Controles */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Tooltip title="Filtros Avançados">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setExpanded(!expanded)}
                  startIcon={<FilterList />}
                  endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                >
                  Filtros
                  {getActiveFiltersCount() > 0 && (
                    <Chip
                      label={getActiveFiltersCount()}
                      size="small"
                      color="primary"
                      sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
                    />
                  )}
                </Button>
              </Tooltip>

              <Tooltip title="Limpar Filtros">
                <IconButton
                  size="small"
                  onClick={handleReset}
                  disabled={getActiveFiltersCount() === 0}
                >
                  <Clear />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Filtros Avançados - Expansível */}
      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2, borderTop: 1, borderColor: 'divider', pt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Filtros Avançados
          </Typography>
          
          <Grid container spacing={2}>
            {/* Segmento */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Segmento</InputLabel>
                <Select
                  value={localFilters.segmento}
                  label="Segmento"
                  onChange={(e) => handleFilterChange('segmento', e.target.value)}
                  disabled={segmentosLoading}
                >
                  <MenuItem value="">Todos os Segmentos</MenuItem>
                  {segmentos.map((segmento) => (
                    <MenuItem key={segmento.id} value={segmento.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: segmento.cor
                          }}
                        />
                        {segmento.nome}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Direção da Ordenação */}
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Direção</InputLabel>
                <Select
                  value={localFilters.order}
                  label="Direção"
                  onChange={(e) => handleFilterChange('order', e.target.value)}
                >
                  <MenuItem value="asc">Crescente</MenuItem>
                  <MenuItem value="desc">Decrescente</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Filtro por Valor Gasto */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Valor Mínimo Gasto"
                type="number"
                value={localFilters.valorMinimo || ''}
                onChange={(e) => handleFilterChange('valorMinimo', e.target.value)}
                placeholder="Ex: 1000"
              />
            </Grid>

            {/* Filtro por Número de Consultas */}
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Min. Consultas"
                type="number"
                value={localFilters.consultasMinimas || ''}
                onChange={(e) => handleFilterChange('consultasMinimas', e.target.value)}
                placeholder="Ex: 5"
              />
            </Grid>

            {/* Ações dos Filtros Avançados */}
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    if (onChange) {
                      onChange(localFilters);
                    }
                  }}
                >
                  Aplicar
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleReset}
                >
                  Limpar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Collapse>

      {/* Tags dos Filtros Ativos */}
      {getActiveFiltersCount() > 0 && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Typography variant="caption" color="textSecondary" gutterBottom>
            Filtros ativos:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
            {localFilters.search && (
              <Chip
                label={`Busca: "${localFilters.search}"`}
                size="small"
                onDelete={() => handleFilterChange('search', '')}
                color="primary"
                variant="outlined"
              />
            )}
            
            {localFilters.status !== 'todos' && (
              <Chip
                label={`Status: ${statusOptions.find(s => s.value === localFilters.status)?.label}`}
                size="small"
                onDelete={() => handleFilterChange('status', 'todos')}
                color="secondary"
                variant="outlined"
              />
            )}
            
            {localFilters.segmento && (
              <Chip
                label={`Segmento: ${segmentos.find(s => s.id === parseInt(localFilters.segmento))?.nome}`}
                size="small"
                onDelete={() => handleFilterChange('segmento', '')}
                color="info"
                variant="outlined"
              />
            )}
            
            {localFilters.orderBy !== 'nome' && (
              <Chip
                label={`Ordem: ${orderOptions.find(o => o.value === localFilters.orderBy)?.label}`}
                size="small"
                onDelete={() => handleFilterChange('orderBy', 'nome')}
                color="warning"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default PacienteFilters;
