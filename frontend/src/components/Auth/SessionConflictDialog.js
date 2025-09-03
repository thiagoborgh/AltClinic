import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  Checkbox,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Devices,
  Computer,
  Smartphone,
  Warning,
  Security
} from '@mui/icons-material';

const SessionConflictDialog = ({ 
  open, 
  onClose, 
  conflictData, 
  onResolve,
  loading = false 
}) => {
  const [selectedSessions, setSelectedSessions] = useState([]);

  const { message, otherSessions = [], currentIP } = conflictData || {};

  const handleSessionToggle = (sessionId) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleResolve = (action) => {
    const resolveData = {
      action,
      selectedSessions: action === 'logout_selected' ? selectedSessions : []
    };
    
    onResolve(resolveData);
  };

  const getDeviceIcon = (userAgent) => {
    if (userAgent?.toLowerCase().includes('mobile') || 
        userAgent?.toLowerCase().includes('android') || 
        userAgent?.toLowerCase().includes('iphone')) {
      return <Smartphone color="primary" />;
    }
    return <Computer color="primary" />;
  };

  if (!open || !conflictData) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Security color="warning" />
          <Typography variant="h6">
            Sessão Ativa Detectada
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            {message}
          </Typography>
        </Alert>

        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            📱 Seu Dispositivo Atual
          </Typography>
          <Card variant="outlined" sx={{ bgcolor: 'success.light', borderColor: 'success.main' }}>
            <CardContent sx={{ py: 2 }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Computer color="success" />
                <Box>
                  <Typography variant="body2" color="success.dark" sx={{ fontWeight: 600 }}>
                    Dispositivo Atual
                  </Typography>
                  <Typography variant="caption" color="success.dark">
                    IP: {currentIP}
                  </Typography>
                </Box>
                <Chip 
                  label="Atual" 
                  size="small" 
                  color="success" 
                  variant="filled"
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {otherSessions.length > 0 && (
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
              🔒 Sessões Ativas em Outros Dispositivos
            </Typography>
            
            <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
              {otherSessions.map((session, index) => (
                <React.Fragment key={session.sessionId}>
                  <ListItem 
                    sx={{ 
                      py: 2,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => handleSessionToggle(session.sessionId)}
                  >
                    <ListItemIcon>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedSessions.includes(session.sessionId)}
                            onChange={() => handleSessionToggle(session.sessionId)}
                          />
                        }
                        label=""
                        sx={{ m: 0 }}
                      />
                    </ListItemIcon>
                    
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getDeviceIcon(session.userAgent)}
                    </ListItemIcon>

                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {session.userAgent}
                          </Typography>
                          {session.isActive && (
                            <Chip 
                              label="Ativo" 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            IP: {session.ip}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            Última atividade: {session.lastActivity}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < otherSessions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>

            {selectedSessions.length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  {selectedSessions.length} sessão(ões) selecionada(s) para encerramento
                </Typography>
              </Alert>
            )}
          </Box>
        )}

        <Box>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            🎯 Como deseja proceder?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Escolha uma das opções abaixo para continuar:
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0, flexDirection: 'column', gap: 2 }}>
        <Box width="100%" display="flex" flexDirection="column" gap={2}>
          {/* Opção 1: Entrar normalmente */}
          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            onClick={() => handleResolve('force_login')}
            disabled={loading}
            startIcon={<Devices />}
            sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
          >
            <Box>
              <Typography variant="button" display="block">
                Entrar no sistema
              </Typography>
              <Typography variant="caption" display="block" color="primary.light">
                Manter todas as sessões ativas
              </Typography>
            </Box>
          </Button>

          {/* Opção 2: Encerrar sessões selecionadas */}
          {selectedSessions.length > 0 && (
            <Button
              variant="contained"
              color="warning"
              fullWidth
              size="large"
              onClick={() => handleResolve('logout_selected')}
              disabled={loading}
              startIcon={<Security />}
              sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
            >
              <Box>
                <Typography variant="button" display="block">
                  Encerrar {selectedSessions.length} sessão(ões) selecionada(s)
                </Typography>
                <Typography variant="caption" display="block" color="warning.light">
                  E entrar no sistema
                </Typography>
              </Box>
            </Button>
          )}

          {/* Opção 3: Encerrar todas as outras sessões */}
          <Button
            variant="contained"
            color="error"
            fullWidth
            size="large"
            onClick={() => handleResolve('logout_all_others')}
            disabled={loading}
            startIcon={<Warning />}
            sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
          >
            <Box>
              <Typography variant="button" display="block">
                Encerrar todas as outras sessões
              </Typography>
              <Typography variant="caption" display="block" color="error.light">
                E entrar no sistema (mais seguro)
              </Typography>
            </Box>
          </Button>

          <Divider sx={{ my: 1 }} />

          {/* Cancelar */}
          <Button
            variant="outlined"
            color="inherit"
            fullWidth
            onClick={onClose}
            disabled={loading}
            sx={{ mt: 1 }}
          >
            Cancelar
          </Button>
        </Box>

        <Alert severity="info" sx={{ width: '100%', mt: 2 }}>
          <Typography variant="body2">
            <strong>💡 Dica:</strong> Para máxima segurança, recomendamos encerrar as outras sessões. 
            Do mesmo IP, você sempre terá acesso ilimitado.
          </Typography>
        </Alert>
      </DialogActions>
    </Dialog>
  );
};

export default SessionConflictDialog;
