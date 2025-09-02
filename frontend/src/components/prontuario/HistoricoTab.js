import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  MedicalServices as MedicalIcon,
  Assignment as AssignmentIcon,
  PhotoLibrary as PhotoIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function HistoricoTab({ prontuario }) {
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [menuFiltro, setMenuFiltro] = useState(null);

  // Combinar todos os eventos do prontuário em uma timeline
  const construirTimeline = () => {
    const eventos = [];

    // Adicionar anamnese
    if (prontuario?.anamnese?.dataPreenchimento) {
      eventos.push({
        id: 'anamnese',
        tipo: 'anamnese',
        data: prontuario.anamnese.dataPreenchimento,
        titulo: 'Anamnese Inicial',
        descricao: 'Preenchimento da anamnese do paciente',
        detalhes: {
          alergias: prontuario.anamnese.alergias?.length || 0,
          medicamentos: prontuario.anamnese.medicamentos?.length || 0
        },
        icone: <AssignmentIcon />,
        cor: 'primary'
      });
    }

    // Adicionar evoluções
    if (prontuario?.evolucoes) {
      prontuario.evolucoes.forEach((evolucao, index) => {
        eventos.push({
          id: `evolucao-${index}`,
          tipo: 'evolucao',
          data: evolucao.data,
          titulo: 'Medição/Evolução',
          descricao: evolucao.observacoes || 'Registro de medidas corporais',
          detalhes: evolucao.medidas,
          icone: <TrendingUpIcon />,
          cor: 'success'
        });
      });
    }

    // Adicionar imagens
    if (prontuario?.imagens) {
      prontuario.imagens.forEach((imagem, index) => {
        eventos.push({
          id: `imagem-${index}`,
          tipo: 'imagem',
          data: imagem.dataUpload,
          titulo: `Foto - ${imagem.categoria}`,
          descricao: imagem.descricao || 'Upload de imagem',
          detalhes: {
            categoria: imagem.categoria,
            tags: imagem.tags
          },
          icone: <PhotoIcon />,
          cor: 'info',
          imagem: imagem.url
        });
      });
    }

    // Adicionar consultas/atendimentos
    if (prontuario?.atendimentos) {
      prontuario.atendimentos.forEach((atendimento, index) => {
        eventos.push({
          id: `atendimento-${index}`,
          tipo: 'atendimento',
          data: atendimento.data,
          titulo: `Consulta - ${atendimento.tipo}`,
          descricao: atendimento.observacoes || 'Atendimento realizado',
          detalhes: {
            profissional: atendimento.profissional,
            procedimentos: atendimento.procedimentos
          },
          icone: <MedicalIcon />,
          cor: 'warning'
        });
      });
    }

    // Ordenar por data (mais recente primeiro)
    return eventos.sort((a, b) => new Date(b.data) - new Date(a.data));
  };

  const timeline = construirTimeline();

  // Filtrar eventos
  const eventosFiltrados = timeline.filter(evento => {
    const textoMatch = filtroTexto === '' || 
      evento.titulo.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      evento.descricao.toLowerCase().includes(filtroTexto.toLowerCase());
    
    const tipoMatch = filtroTipo === 'todos' || evento.tipo === filtroTipo;
    
    return textoMatch && tipoMatch;
  });

  const tiposEventos = [
    { valor: 'todos', label: 'Todos os Eventos' },
    { valor: 'anamnese', label: 'Anamnese' },
    { valor: 'evolucao', label: 'Medições' },
    { valor: 'imagem', label: 'Imagens' },
    { valor: 'atendimento', label: 'Atendimentos' }
  ];

  const calcularTempoDecorrido = (data) => {
    const dias = differenceInDays(new Date(), parseISO(data));
    if (dias === 0) return 'Hoje';
    if (dias === 1) return 'Ontem';
    if (dias < 7) return `${dias} dias atrás`;
    if (dias < 30) return `${Math.floor(dias / 7)} semanas atrás`;
    if (dias < 365) return `${Math.floor(dias / 30)} meses atrás`;
    return `${Math.floor(dias / 365)} anos atrás`;
  };

  return (
    <Box>
      {/* Header com filtros */}
      <Box display="flex" alignItems="center" mb={3} gap={2}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Histórico Completo
        </Typography>
        
        <TextField
          size="small"
          placeholder="Buscar no histórico..."
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ minWidth: 250 }}
        />
        
        <IconButton
          onClick={(e) => setMenuFiltro(e.currentTarget)}
          color={filtroTipo !== 'todos' ? 'primary' : 'default'}
        >
          <FilterIcon />
        </IconButton>
        
        <Menu
          anchorEl={menuFiltro}
          open={Boolean(menuFiltro)}
          onClose={() => setMenuFiltro(null)}
        >
          {tiposEventos.map(tipo => (
            <MenuItem
              key={tipo.valor}
              onClick={() => {
                setFiltroTipo(tipo.valor);
                setMenuFiltro(null);
              }}
              selected={filtroTipo === tipo.valor}
            >
              {tipo.label}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* Estatísticas rápidas */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          Resumo do Histórico
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Chip 
            icon={<AssignmentIcon />}
            label={`${timeline.filter(e => e.tipo === 'anamnese').length} Anamnese`}
            color="primary"
            variant="outlined"
          />
          <Chip 
            icon={<TrendingUpIcon />}
            label={`${timeline.filter(e => e.tipo === 'evolucao').length} Medições`}
            color="success"
            variant="outlined"
          />
          <Chip 
            icon={<PhotoIcon />}
            label={`${timeline.filter(e => e.tipo === 'imagem').length} Imagens`}
            color="info"
            variant="outlined"
          />
          <Chip 
            icon={<MedicalIcon />}
            label={`${timeline.filter(e => e.tipo === 'atendimento').length} Atendimentos`}
            color="warning"
            variant="outlined"
          />
        </Box>
      </Paper>

      {/* Timeline */}
      {eventosFiltrados.length > 0 ? (
        <Box>
          {eventosFiltrados.map((evento, index) => (
            <Card key={evento.id} sx={{ mb: 2, border: `1px solid ${evento.cor}` }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Chip
                    icon={evento.icone}
                    label={format(parseISO(evento.data), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    color={evento.cor}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {calcularTempoDecorrido(evento.data)}
                  </Typography>
                </Box>
                
                <Typography variant="h6" component="div" gutterBottom>
                  {evento.titulo}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {evento.descricao}
                </Typography>

                {/* Imagem preview se disponível */}
                {evento.imagem && (
                  <Box sx={{ mb: 2 }}>
                    <img
                      src={evento.imagem}
                      alt="Preview"
                      style={{
                        width: '100%',
                        maxWidth: 200,
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: 4
                      }}
                    />
                  </Box>
                )}

                {/* Detalhes específicos por tipo */}
                <Accordion elevation={0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body2">
                      Ver detalhes
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                        {evento.tipo === 'anamnese' && (
                          <Box>
                            <Typography variant="body2">
                              • Alergias registradas: {evento.detalhes.alergias}
                            </Typography>
                            <Typography variant="body2">
                              • Medicamentos: {evento.detalhes.medicamentos}
                            </Typography>
                          </Box>
                        )}
                        
                        {evento.tipo === 'evolucao' && (
                          <Box>
                            {Object.entries(evento.detalhes).map(([medida, valor]) => (
                              <Typography key={medida} variant="body2">
                                • {medida.replace('_', ' ')}: {valor}
                              </Typography>
                            ))}
                          </Box>
                        )}
                        
                        {evento.tipo === 'imagem' && (
                          <Box>
                            <Typography variant="body2">
                              • Categoria: {evento.detalhes.categoria}
                            </Typography>
                            {evento.detalhes.tags && evento.detalhes.tags.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                {evento.detalhes.tags.map(tag => (
                                  <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5 }} />
                                ))}
                              </Box>
                            )}
                          </Box>
                        )}
                        
                        {evento.tipo === 'atendimento' && (
                          <Box>
                            <Typography variant="body2">
                              • Profissional: {evento.detalhes.profissional}
                            </Typography>
                            {evento.detalhes.procedimentos && (
                              <Typography variant="body2">
                                • Procedimentos: {evento.detalhes.procedimentos.join(', ')}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                </CardContent>
              </Card>
          ))}
        </Box>
      ) : (
        <Alert severity="info">
          {filtroTexto || filtroTipo !== 'todos' 
            ? 'Nenhum evento encontrado com os filtros aplicados.'
            : 'Nenhum evento registrado no histórico do paciente.'
          }
        </Alert>
      )}
    </Box>
  );
}
