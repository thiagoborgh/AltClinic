import React from 'react';
import {
  Box,
  Button,
  Chip,
  Stack
} from '@mui/material';
import { FilterList } from '@mui/icons-material';

const FiltrosAgenda = ({ filtros = {}, onAplicarFiltros }) => {
  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<FilterList />}
        onClick={() => {
          // Simular aplicação de filtros
          if (onAplicarFiltros) {
            onAplicarFiltros({ ...filtros });
          }
        }}
      >
        Filtros
      </Button>
      
      {/* Chips dos filtros ativos */}
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        {filtros.status && filtros.status !== 'todos' && (
          <Chip
            label={`Status: ${filtros.status}`}
            size="small"
            onDelete={() => onAplicarFiltros?.({ ...filtros, status: 'todos' })}
          />
        )}
        {filtros.profissional && filtros.profissional !== 'todos' && (
          <Chip
            label={`Profissional: ${filtros.profissional}`}
            size="small"
            onDelete={() => onAplicarFiltros?.({ ...filtros, profissional: 'todos' })}
          />
        )}
      </Stack>
    </Box>
  );
};

export default FiltrosAgenda;
