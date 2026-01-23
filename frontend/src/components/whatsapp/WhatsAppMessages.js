import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Grid,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
  Image as ImageIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import whatsappService from '../../services/whatsappService';

export default function WhatsAppMessages({ connected, phoneNumber }) {
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  
  // Filtros
  const [filterPhone, setFilterPhone] = useState('');
  const [filterDirection, setFilterDirection] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Novo envio
  const [newMessage, setNewMessage] = useState({
    phoneNumber: '',
    message: '',
    mediaUrl: ''
  });

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {};
      if (filterPhone) filters.phoneNumber = filterPhone;
      if (filterDirection) filters.direction = filterDirection;
      if (filterStatus) filters.status = filterStatus;
      filters.limit = 50;

      const data = await whatsappService.getMessages(filters);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      setError(err.response?.data?.error || 'Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  }, [filterPhone, filterDirection, filterStatus]);

  const loadContacts = async () => {
    try {
      const data = await whatsappService.getContacts();
      setContacts(data.contacts || []);
    } catch (err) {
      console.error('Erro ao carregar contatos:', err);
    }
  };

  useEffect(() => {
    if (connected) {
      loadMessages();
      loadContacts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, filterPhone, filterDirection, filterStatus, loadMessages]);

  const handleSendMessage = async () => {
    try {
      setLoading(true);
      setError(null);

      if (newMessage.mediaUrl) {
        await whatsappService.sendMedia(
          newMessage.phoneNumber,
          newMessage.mediaUrl,
          newMessage.message
        );
      } else {
        await whatsappService.sendMessage(
          newMessage.phoneNumber,
          newMessage.message
        );
      }

      setSendDialogOpen(false);
      setNewMessage({ phoneNumber: '', message: '', mediaUrl: '' });
      
      setTimeout(loadMessages, 2000);
      
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError(err.response?.data?.error || 'Erro ao enviar mensagem');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'delivered':
        return <CheckCircleIcon fontSize="small" color="info" />;
      case 'read':
        return <CheckCircleIcon fontSize="small" color="primary" />;
      case 'error':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return <ScheduleIcon fontSize="small" color="disabled" />;
    }
  };

  const getDirectionLabel = (direction) => {
    return direction === 'incoming' ? 'Recebida' : 'Enviada';
  };

  const formatPhone = (phone) => {
    if (!phone) return 'N/A';
    // Remove @c.us do final
    return phone.replace('@c.us', '');
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!connected) {
    return (
      <Alert severity="warning">
        ⚠️ WhatsApp não está conectado. Conecte-se na aba "Conexão" para visualizar e enviar mensagens.
      </Alert>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Ações e Filtros */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Filtrar por Telefone"
                value={filterPhone}
                onChange={(e) => setFilterPhone(e.target.value)}
                placeholder="5511999999999"
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Direção</InputLabel>
                <Select
                  value={filterDirection}
                  onChange={(e) => setFilterDirection(e.target.value)}
                  label="Direção"
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="incoming">Recebidas</MenuItem>
                  <MenuItem value="outgoing">Enviadas</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="sent">Enviada</MenuItem>
                  <MenuItem value="delivered">Entregue</MenuItem>
                  <MenuItem value="read">Lida</MenuItem>
                  <MenuItem value="error">Erro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={() => setSendDialogOpen(true)}
                >
                  Nova Mensagem
                </Button>
                <IconButton onClick={loadMessages} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de Mensagens */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Mensagens ({messages.length})
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : messages.length === 0 ? (
            <Alert severity="info">
              Nenhuma mensagem encontrada. Envie sua primeira mensagem!
            </Alert>
          ) : (
            <List>
              {messages.map((message, index) => (
                <React.Fragment key={message.id || index}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar>
                        <PhoneIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">
                            {formatPhone(message.phoneNumber)}
                          </Typography>
                          <Chip 
                            label={getDirectionLabel(message.direction)} 
                            size="small" 
                            color={message.direction === 'incoming' ? 'primary' : 'default'}
                          />
                          {getStatusIcon(message.status)}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
                            {message.message || '(sem texto)'}
                          </Typography>
                          {message.mediaUrl && (
                            <Chip 
                              icon={<ImageIcon />} 
                              label="Contém mídia" 
                              size="small" 
                              sx={{ mt: 0.5 }}
                            />
                          )}
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                            {formatDate(message.timestamp)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < messages.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nova Mensagem */}
      <Dialog 
        open={sendDialogOpen} 
        onClose={() => setSendDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nova Mensagem WhatsApp</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {contacts.length > 0 && (
              <FormControl fullWidth>
                <InputLabel>Contato (ou digite abaixo)</InputLabel>
                <Select
                  value={newMessage.phoneNumber}
                  onChange={(e) => setNewMessage({ ...newMessage, phoneNumber: e.target.value })}
                  label="Contato (ou digite abaixo)"
                >
                  {contacts.map((contact) => (
                    <MenuItem key={contact.phoneNumber} value={formatPhone(contact.phoneNumber)}>
                      {contact.name || formatPhone(contact.phoneNumber)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              fullWidth
              label="Número (com DDI)"
              value={newMessage.phoneNumber}
              onChange={(e) => setNewMessage({ ...newMessage, phoneNumber: e.target.value })}
              placeholder="5511999999999"
              helperText="Formato: DDI + DDD + Número (sem espaços ou caracteres especiais)"
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Mensagem"
              value={newMessage.message}
              onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
              placeholder="Digite sua mensagem..."
            />

            <TextField
              fullWidth
              label="URL da Mídia (opcional)"
              value={newMessage.mediaUrl}
              onChange={(e) => setNewMessage({ ...newMessage, mediaUrl: e.target.value })}
              placeholder="https://exemplo.com/imagem.jpg"
              helperText="URL pública de imagem, vídeo ou áudio"
            />

            <Alert severity="info">
              <Typography variant="caption">
                <strong>Dica:</strong> Números devem ter DDI (55 para Brasil). 
                Exemplo: 5511999999999
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleSendMessage} 
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
            disabled={loading || !newMessage.phoneNumber || !newMessage.message}
          >
            Enviar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
