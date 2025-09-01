import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Paper,
  Grid,
  Button
} from '@mui/material';
import {
  Message as MessageIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Sms as SmsIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componente para histórico de comunicação
const ComunicacaoHistorico = ({ comunicacao, pacienteId }) => {
  if (!comunicacao || !comunicacao.historico || comunicacao.historico.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <MessageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Nenhuma comunicação registrada
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          O histórico de comunicações aparecerá aqui conforme forem enviadas mensagens, e-mails ou feitas ligações.
        </Typography>
        <Button variant="contained">
          Enviar Primeira Mensagem
        </Button>
      </Paper>
    );
  }

  const iconMap = {
    whatsapp: <WhatsAppIcon color="success" />,
    email: <EmailIcon color="primary" />,
    telefone: <PhoneIcon color="info" />,
    sms: <SmsIcon color="warning" />
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'enviado': return 'success';
      case 'entregue': return 'info';
      case 'lido': return 'primary';
      case 'erro': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Histórico de Comunicação
      </Typography>

      {/* Preferências de Comunicação */}
      {comunicacao.preferencias && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Preferências do Paciente
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Canal Preferido:</strong> {comunicacao.preferencias.canalPreferido}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Tipos de Conteúdo:</strong>
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                  {comunicacao.preferencias.tipoConteudo?.map((tipo, index) => (
                    <Chip
                      key={index}
                      label={tipo}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Comunicações */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <HistoryIcon />
            <Typography variant="h6">
              Histórico de Comunicações
            </Typography>
          </Box>
          
          <List>
            {comunicacao.historico.map((item, index) => (
              <ListItem key={index} divider>
                <ListItemIcon>
                  {iconMap[item.canal] || <MessageIcon />}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="body1">
                        {item.assunto || item.titulo || 'Comunicação'}
                      </Typography>
                      <Box display="flex" gap={1}>
                        <Chip
                          label={item.canal.toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={item.status}
                          size="small"
                          color={getStatusColor(item.status)}
                        />
                      </Box>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {item.mensagem || item.conteudo}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(item.dataEnvio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </Typography>
                      {item.dataLeitura && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Lido em: {format(new Date(item.dataLeitura), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </Typography>
                      )}
                      {item.profissionalResponsavel && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Enviado por: {item.profissionalResponsavel}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ComunicacaoHistorico;
