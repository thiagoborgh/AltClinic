import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Alert
} from '@mui/material';
import PacientesList from '../../components/crm/pacientes/PacientesList';
import PacienteFilters from '../../components/crm/pacientes/PacienteFilters';

const PacientesPage = () => {
  const [filters, setFilters] = useState({
    search: '',
    status: 'todos',
    segmento: '',
    orderBy: 'nome',
    order: 'asc'
  });

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleFiltersReset = () => {
    setFilters({
      search: '',
      status: 'todos',
      segmento: '',
      orderBy: 'nome',
      order: 'asc'
    });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Cabeçalho */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Gestão de Pacientes
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Gerencie e visualize informações detalhadas dos seus pacientes
        </Typography>
      </Box>

      {/* Informações úteis */}
      <Alert severity="info" sx={{ mb: 3 }}>
        💡 <strong>Dica:</strong> Use os filtros para encontrar rapidamente pacientes específicos. 
        Clique nas ações para enviar mensagens, visualizar perfis ou editar informações.
      </Alert>

      {/* Filtros */}
      <PacienteFilters 
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleFiltersReset}
      />

      {/* Lista de Pacientes */}
      <PacientesList 
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />
    </Container>
  );
};

export default PacientesPage;
