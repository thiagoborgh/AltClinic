import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  QrCode2 as QrCodeIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import whatsappService from '../../services/whatsappService';

export default function WhatsAppConnection({ status, onStatusUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrImage, setQrImage] = useState(null);
  const [connecting, setConnecting] = useState(false);

  // Atualizar QR code quando disponível
  useEffect(() => {
    if (status?.qrCode?.qrDataUrl && !status?.connected) {
      setQrImage(status.qrCode.qrDataUrl);
      setQrDialogOpen(true);
    } else if (status?.connected) {
      setQrDialogOpen(false);
      setQrImage(null);
    }
  }, [status]);

  const handleConnect = async () => {
    try {
      setLoading(true);
      setConnecting(true);
      setError(null);
      
      await whatsappService.connect();
      
      // Aguardar alguns segundos para QR code ser gerado
      setTimeout(() => {
        onStatusUpdate();
      }, 3000);
      
    } catch (err) {
      console.error('Erro ao conectar:', err);
      setError(err.response?.data?.error || 'Erro ao iniciar conexão');
      setConnecting(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      setError(null);
      await whatsappService.disconnect();
      setTimeout(onStatusUpdate, 1000);
    } catch (err) {
      console.error('Erro ao desconectar:', err);
      setError(err.response?.data?.error || 'Erro ao desconectar');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSession = async () => {
    try {
      setLoading(true);
      setError(null);
      await whatsappService.clearSession();
      setQrDialogOpen(false);
      setQrImage(null);
      setTimeout(onStatusUpdate, 1000);
    } catch (err) {
      console.error('Erro ao limpar sessão:', err);
      setError(err.response?.data?.error || 'Erro ao limpar sessão');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshQR = () => {
    setConnecting(false);
    onStatusUpdate();
  };

  const getStatusChip = () => {
    if (!status) return null;

    if (status.connected) {
      return <Chip icon={<CheckIcon />} label="Conectado" color="success" />;
    } else if (status.qrCode?.qrDataUrl) {
      return <Chip icon={<QrCodeIcon />} label="Aguardando QR Code" color="warning" />;
    } else {
      return <Chip icon={<CancelIcon />} label="Desconectado" color="error" />;
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Status Card */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status da Conexão
              </Typography>
              
              <Box sx={{ my: 2 }}>
                {getStatusChip()}
              </Box>

              {status?.connected && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Número:</strong> {status.phoneNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Cliente:</strong> {status.clientName || 'N/A'}
                  </Typography>
                </Box>
              )}

              <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {!status?.connected ? (
                  <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <QrCodeIcon />}
                    onClick={handleConnect}
                    disabled={loading || connecting}
                  >
                    {connecting ? 'Conectando...' : 'Conectar WhatsApp'}
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDisconnect}
                    disabled={loading}
                  >
                    Desconectar
                  </Button>
                )}

                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={onStatusUpdate}
                  disabled={loading}
                >
                  Atualizar
                </Button>

                {!status?.connected && (
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={handleClearSession}
                    disabled={loading}
                  >
                    Limpar Sessão
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Info Card */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ℹ️ Como Conectar
              </Typography>
              <Typography variant="body2" component="div">
                <ol style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Clique em "Conectar WhatsApp"</li>
                  <li>Aguarde o QR Code aparecer (5-10 segundos)</li>
                  <li>Abra o WhatsApp no seu celular</li>
                  <li>Toque em "Aparelhos conectados"</li>
                  <li>Escaneie o QR Code exibido</li>
                  <li>Aguarde a confirmação de conexão</li>
                </ol>
              </Typography>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  <strong>Importante:</strong> O QR Code expira em 1 minuto. 
                  Se expirar, clique em "Atualizar" para gerar um novo.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* QR Code Dialog */}
      <Dialog 
        open={qrDialogOpen} 
        onClose={() => setQrDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Escaneie o QR Code
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {qrImage ? (
              <>
                <img 
                  src={qrImage} 
                  alt="QR Code WhatsApp" 
                  style={{ 
                    maxWidth: '100%', 
                    height: 'auto',
                    border: '2px solid #ddd',
                    borderRadius: 8,
                    padding: 16
                  }} 
                />
                <Alert severity="info" sx={{ mt: 2 }}>
                  Abra o WhatsApp no seu celular e escaneie este QR Code em 
                  "Aparelhos conectados" → "Conectar um aparelho"
                </Alert>
              </>
            ) : (
              <CircularProgress />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRefreshQR} startIcon={<RefreshIcon />}>
            Atualizar QR Code
          </Button>
          <Button onClick={() => setQrDialogOpen(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
