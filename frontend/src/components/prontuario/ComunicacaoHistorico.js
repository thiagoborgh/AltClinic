import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { Share as ShareIcon, Email, Phone, WhatsApp } from '@mui/icons-material';

const ComunicacaoHistorico = ({ comunicacao, pacienteId }) => {
  const comunicacaoDisponivel = comunicacao || {};
  const historico = comunicacaoDisponivel.historico || [];
  const preferencias = comunicacaoDisponivel.preferencias || {};

  const getIconCanal = (canal) => {
    switch (canal?.toLowerCase()) {
      case 'whatsapp':
        return <WhatsApp color="success" />;
      case 'email':
        return <Email color="primary" />;
      case 'telefone':
        return <Phone color="secondary" />;
      default:
        return <ShareIcon />;
    }
  };

  const getTipoConteudoLabel = (tipo) => {
    const labels = {
      lembretes: 'Lembretes',
      resultados: 'Resultados',
      agendamentos: 'Agendamentos',
      campanhas: 'Campanhas'
    };
    return labels[tipo] || tipo;
  };

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" mb={3}>
        <ShareIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight="bold">
          Histórico de Comunicação
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Preferências de Comunicação
              </Typography>
              <Box mb={2}>
                <Typography variant="body2" gutterBottom>
                  <strong>Canal Preferido:</strong>
                </Typography>
                <Box display="flex" alignItems="center">
                  {getIconCanal(preferencias.canalPreferido)}
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {preferencias.canalPreferido || 'Não definido'}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" gutterBottom>
                  <strong>Tipos de Conteúdo:</strong>
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {preferencias.tipoConteudo && preferencias.tipoConteudo.length > 0 ? (
                    preferencias.tipoConteudo.map((tipo, index) => (
                      <Chip
                        key={index}
                        label={getTipoConteudoLabel(tipo)}
                        size="small"
                        variant="outlined"
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Nenhum tipo definido
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estatísticas de Comunicação
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Total de Contatos:</strong> {historico.length}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Último Contato:</strong> {
                  historico.length > 0 && historico[0].data
                    ? new Date(historico[0].data).toLocaleDateString('pt-BR')
                    : 'Nunca'
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Histórico de Contatos
              </Typography>
              {historico.length > 0 ? (
                <List>
                  {historico.map((contato, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center">
                            {getIconCanal(contato.canal)}
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {contato.tipo || 'Contato'} - {contato.canal || 'Canal não informado'}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Data: {contato.data ? new Date(contato.data).toLocaleDateString('pt-BR') : 'Data não informada'}
                            </Typography>
                            <Typography variant="body2">
                              Status: {contato.status || 'Enviado'}
                            </Typography>
                            {contato.mensagem && (
                              <Typography variant="body2" color="text.secondary">
                                Mensagem: {contato.mensagem}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <Chip
                        label={contato.status || 'Enviado'}
                        color={
                          contato.status === 'Entregue' ? 'success' :
                          contato.status === 'Pendente' ? 'warning' :
                          contato.status === 'Falhou' ? 'error' : 'default'
                        }
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhum contato registrado
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ComunicacaoHistorico;