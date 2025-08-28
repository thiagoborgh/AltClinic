import React, { useState } from 'react';
import { Paper, List, ListItem, ListItemText, Chip, Typography, Box, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import { mockPacientes } from '../../data/crm/mockCRMData';

const canalLabel = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  sms: 'SMS'
};

const HistoricoMensagens = ({ mensagens }) => {
  const [filtroPaciente, setFiltroPaciente] = useState('');
  const [filtroCanal, setFiltroCanal] = useState('');

  const mensagensFiltradas = mensagens.filter(msg => {
    if (filtroPaciente && msg.pacienteId !== Number(filtroPaciente)) return false;
    if (filtroCanal && msg.canal !== filtroCanal) return false;
    return true;
  });

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Histórico de Mensagens</Typography>
      
      {/* Filtros */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Filtrar por Paciente</InputLabel>
            <Select
              value={filtroPaciente}
              label="Filtrar por Paciente"
              onChange={e => setFiltroPaciente(e.target.value)}
            >
              <MenuItem value="">Todos os Pacientes</MenuItem>
              {mockPacientes.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.nome}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Filtrar por Canal</InputLabel>
            <Select
              value={filtroCanal}
              label="Filtrar por Canal"
              onChange={e => setFiltroCanal(e.target.value)}
            >
              <MenuItem value="">Todos os Canais</MenuItem>
              <MenuItem value="whatsapp">WhatsApp</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="sms">SMS</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <List>
        {mensagensFiltradas.length === 0 && (
          <ListItem>
            <ListItemText primary="Nenhuma mensagem registrada." />
          </ListItem>
        )}
        {mensagensFiltradas.map(msg => {
          const paciente = mockPacientes.find(p => p.id === Number(msg.pacienteId));
          return (
            <ListItem key={msg.id} alignItems="flex-start">
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2">{paciente ? paciente.nome : 'Paciente'}</Typography>
                    <Chip label={canalLabel[msg.canal]} size="small" />
                    <Chip 
                      label={msg.modo === 'manual' ? 'Manual' : 'API'} 
                      size="small" 
                      color={msg.modo === 'manual' ? 'warning' : 'success'} 
                    />
                    <Chip 
                      label={msg.status === 'enviado_api' ? 'Enviado via API' : 'Enviado'} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="body2">{msg.mensagem}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(msg.data).toLocaleString('pt-BR')}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
};
export default HistoricoMensagens;
