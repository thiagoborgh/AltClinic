import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  QRCodeCanvas
} from '@mui/material';
import {
  QrCode,
  ContentCopy,
  Send,
  CheckCircle,
  Timer
} from '@mui/icons-material';
import { useFinanceiro } from '../../hooks/financeiro/useFinanceiro';
import moment from 'moment';

const PIXGenerator = () => {
  const { gerarPIX } = useFinanceiro();
  const [modalOpen, setModalOpen] = useState(false);
  const [dadosPIX, setDadosPIX] = useState(null);
  const [formData, setFormData] = useState({
    valor: '',
    descricao: '',
    vencimento: moment().add(1, 'day').format('YYYY-MM-DD'),
    chave: 'contato@altclinic.com.br'
  });

  const handleGerarPIX = () => {
    try {
      const pix = gerarPIX(parseFloat(formData.valor), formData.descricao);
      setDadosPIX(pix);
      setModalOpen(true);
    } catch (error) {
      alert('❌ Erro ao gerar PIX: ' + error.message);
    }
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(dadosPIX.codigo);
    alert('✅ Código PIX copiado para a área de transferência!');
  };

  const enviarWhatsApp = () => {
    const mensagem = `🎯 *PIX Gerado - ALTclinic*

💰 *Valor:* R$ ${dadosPIX.valor.toFixed(2)}
📝 *Descrição:* ${formData.descricao}
⏰ *Válido até:* ${moment(dadosPIX.vencimento).format('DD/MM/YYYY HH:mm')}

📱 *Código PIX (Copia e Cola):*
${dadosPIX.codigo}

_Pagamento instantâneo e seguro!_ ✅`;

    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        🎯 Gerador de PIX
      </Typography>

      <Grid container spacing={3}>
        {/* Formulário */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                💳 Dados do PIX
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Valor (R$) *"
                    type="number"
                    value={formData.valor}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                    inputProps={{ step: '0.01', min: '0' }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descrição do Pagamento *"
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Ex: Consulta Dermatológica - João Silva"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Válido até"
                    type="date"
                    value={formData.vencimento}
                    onChange={(e) => setFormData(prev => ({ ...prev, vencimento: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Chave PIX"
                    value={formData.chave}
                    onChange={(e) => setFormData(prev => ({ ...prev, chave: e.target.value }))}
                    disabled
                    helperText="Chave PIX da clínica"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<QrCode />}
                    onClick={handleGerarPIX}
                    disabled={!formData.valor || !formData.descricao}
                  >
                    Gerar PIX
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Informações */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ℹ️ Como Funciona o PIX
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" paragraph>
                  O PIX é o sistema de pagamentos instantâneos brasileiro, disponível 24h por dia, 7 dias por semana.
                </Typography>

                <Typography variant="subtitle2" gutterBottom>
                  ✅ Vantagens:
                </Typography>
                <ul>
                  <li>Transferência instantânea</li>
                  <li>Disponível 24/7</li>
                  <li>Sem taxa para pessoa física</li>
                  <li>Maior segurança</li>
                </ul>

                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  📱 Como usar:
                </Typography>
                <ol>
                  <li>Abra o app do seu banco</li>
                  <li>Escolha "PIX" ou "Transferir"</li>
                  <li>Selecione "Pix Copia e Cola"</li>
                  <li>Cole o código gerado</li>
                  <li>Confirme o pagamento</li>
                </ol>
              </Box>

              <Alert severity="info">
                💡 O código PIX tem validade limitada. Após o vencimento, será necessário gerar um novo código.
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Histórico de PIX recentes */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📋 PIX Gerados Recentemente
              </Typography>

              <Alert severity="warning" sx={{ mb: 2 }}>
                🔄 Esta funcionalidade será implementada para mostrar o histórico de PIX gerados.
              </Alert>

              <Box display="flex" gap={2}>
                <Button variant="outlined" size="small">
                  Ver Histórico Completo
                </Button>
                <Button variant="outlined" size="small">
                  Exportar Relatório
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Modal PIX Gerado */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircle color="success" />
            PIX Gerado com Sucesso!
          </Box>
        </DialogTitle>
        <DialogContent>
          {dadosPIX && (
            <Grid container spacing={3}>
              {/* Informações do PIX */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      💰 Detalhes do Pagamento
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Valor:
                      </Typography>
                      <Typography variant="h4" color="primary" fontWeight="bold">
                        R$ {dadosPIX.valor.toFixed(2)}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Descrição:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formData.descricao}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Válido até:
                      </Typography>
                      <Typography variant="body1" color="warning.main" fontWeight="bold">
                        <Timer fontSize="small" sx={{ mr: 1 }} />
                        {moment(dadosPIX.vencimento).format('DD/MM/YYYY HH:mm')}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Código PIX (Copia e Cola):
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={dadosPIX.codigo}
                        InputProps={{ 
                          readOnly: true,
                          style: { fontSize: '0.8rem' }
                        }}
                        variant="outlined"
                        size="small"
                        sx={{ mb: 2 }}
                      />
                      
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<ContentCopy />}
                        onClick={copiarCodigo}
                        sx={{ mb: 1 }}
                      >
                        Copiar Código
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* QR Code */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      📱 QR Code
                    </Typography>
                    
                    <Box 
                      display="flex" 
                      justifyContent="center" 
                      sx={{ 
                        mb: 2,
                        p: 2,
                        backgroundColor: 'grey.50',
                        borderRadius: 2
                      }}
                    >
                      {/* Simulação de QR Code */}
                      <Box
                        sx={{
                          width: 200,
                          height: 200,
                          backgroundColor: 'white',
                          border: '2px solid #ccc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 1
                        }}
                      >
                        <QrCode sx={{ fontSize: 100, color: 'grey.600' }} />
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Aponte a câmera do seu celular para ler o QR Code
                    </Typography>

                    <Alert severity="info" sx={{ mt: 2 }}>
                      💡 Use o app do seu banco para escanear o QR Code ou copie o código acima
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>
            Fechar
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Send />}
            onClick={enviarWhatsApp}
          >
            Enviar WhatsApp
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PIXGenerator;
