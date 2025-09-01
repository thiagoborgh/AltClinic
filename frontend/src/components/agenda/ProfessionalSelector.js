import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
  Stack,
  Button,
  Collapse,
  IconButton
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { mockAgendaData, profissionais } from '../../data/mockAgendaData';

const ProfessionalSelector = ({ 
  selectedProfessionals, 
  onSelectionChange,
  sx = {}
}) => {
  const [expanded, setExpanded] = useState(false);
  const [professionals, setProfessionals] = useState([]);

  // Cores para cada tipo de profissional
  const professionalColors = {
    'médico': '#2196f3',
    'enfermeira': '#4caf50', 
    'esteticista': '#ff9800',
    'recepcionista': '#9c27b0',
    'fisioterapeuta': '#00bcd4',
    'nutricionista': '#8bc34a',
    'psicólogo': '#e91e63',
    'dentista': '#607d8b'
  };

  useEffect(() => {
    // Extrair profissionais únicos dos dados mock
    const appointments = mockAgendaData.agendamentos || [];
    const uniqueProfessionals = appointments.reduce((acc, appointment) => {
      if (!acc.find(p => p.nome === appointment.profissional)) {
        // Buscar dados do profissional no mapeamento
        const professionalData = Object.values(profissionais).find(p => p.nome === appointment.profissional);
        
        acc.push({
          nome: appointment.profissional,
          tipo: professionalData?.categoria || 'médico',
          especialidade: appointment.procedimento || 'Geral',
          cor: professionalData?.cor || '#757575'
        });
      }
      return acc;
    }, []);

    setProfessionals(uniqueProfessionals);
  }, []);

  const handleToggleProfessional = (professionalName) => {
    const isSelected = selectedProfessionals.includes(professionalName);
    let newSelection;
    
    if (isSelected) {
      newSelection = selectedProfessionals.filter(name => name !== professionalName);
    } else {
      newSelection = [...selectedProfessionals, professionalName];
    }
    
    onSelectionChange(newSelection);
    
    // Salvar no localStorage
    localStorage.setItem('selectedProfessionals', JSON.stringify(newSelection));
  };

  const handleSelectAll = () => {
    const allNames = professionals.map(p => p.nome);
    onSelectionChange(allNames);
    localStorage.setItem('selectedProfessionals', JSON.stringify(allNames));
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
    localStorage.setItem('selectedProfessionals', JSON.stringify([]));
  };

  const getChipColor = (professional) => {
    return professional.cor || professionalColors[professional.tipo] || '#757575';
  };

  return (
    <Card sx={{ mb: 2, ...sx }}>
      <CardContent>
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center"
          sx={{ cursor: 'pointer' }}
          onClick={() => setExpanded(!expanded)}
        >
          <Typography variant="h6" component="h2">
            Filtrar por Profissional ({selectedProfessionals.length} selecionados)
          </Typography>
          <IconButton>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        {/* Chips dos profissionais selecionados */}
        {selectedProfessionals.length > 0 && (
          <Box sx={{ mt: 1, mb: 2 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {selectedProfessionals.map((name) => {
                const professional = professionals.find(p => p.nome === name);
                return (
                  <Chip
                    key={name}
                    label={name}
                    size="small"
                    onDelete={() => handleToggleProfessional(name)}
                    sx={{
                      backgroundColor: professional ? getChipColor(professional) : '#757575',
                      color: 'white',
                      '& .MuiChip-deleteIcon': {
                        color: 'white'
                      }
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        )}

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            {/* Botões de controle */}
            <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
              <Button 
                size="small" 
                variant="outlined" 
                onClick={handleSelectAll}
              >
                Selecionar Todos
              </Button>
              <Button 
                size="small" 
                variant="outlined" 
                onClick={handleDeselectAll}
              >
                Limpar Seleção
              </Button>
            </Box>

            {/* Lista de profissionais */}
            <FormGroup>
              {professionals.map((professional) => (
                <FormControlLabel
                  key={professional.nome}
                  control={
                    <Checkbox
                      checked={selectedProfessionals.includes(professional.nome)}
                      onChange={() => handleToggleProfessional(professional.nome)}
                      sx={{
                        color: getChipColor(professional),
                        '&.Mui-checked': {
                          color: getChipColor(professional),
                        },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {professional.nome}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {professional.tipo} • {professional.especialidade}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default ProfessionalSelector;
