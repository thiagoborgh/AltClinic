import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Security as SecurityIcon,
  Backup as BackupIcon,
  Policy as PolicyIcon,
  Visibility as AuditoriaIcon,
  CloudDownload as DownloadIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

const SegurancaPrivacidade = ({ configuracoes, onSalvar, onExportar, onImportar }) => {
  const [confirmDialog, setConfirmDialog] = useState({ open: false, tipo: '', callback: null });

  const handleConfirmacao = (tipo, callback) => {
    setConfirmDialog({ open: true, tipo, callback });
  };

  const executeCallback = () => {
    if (confirmDialog.callback) {
      confirmDialog.callback();
    }
    setConfirmDialog({ open: false, tipo: '', callback: null });
  };

  const getStatusBackup = () => {
    // Lógica para verificar status do backup
    return {
      ultimo: '2024-01-15 23:00',
      proximo: '2024-01-16 23:00',
      status: 'ok' // ok, warning, error
    };
  };

  const statusBackup = getStatusBackup();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Segurança & Privacidade
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configurações de LGPD, backups automáticos e auditoria do sistema.
      </Typography>

      <Grid container spacing={3}>
        {/* LGPD e Consentimentos */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              avatar={<PolicyIcon />}
              title="LGPD - Lei Geral de Proteção de Dados"
              subheader="Configurações de privacidade e consentimentos"
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Texto de Consentimento Padrão"
                    multiline
                    rows={4}
                    value={configuracoes.seguranca?.lgpd?.consentimento_padrao || ''}
                    onChange={(e) => {
                      // Implementar atualização
                    }}
                    placeholder="Autorizo o uso dos meus dados pessoais conforme a Lei Geral de Proteção de Dados..."
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Responsável pelos Dados (DPO)"
                    value={configuracoes.seguranca?.lgpd?.responsavel_dados || ''}
                    onChange={(e) => {
                      // Implementar atualização
                    }}
                    placeholder="Nome completo do responsável"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email do DPO"
                    type="email"
                    value={configuracoes.seguranca?.lgpd?.dpo_email || ''}
                    onChange={(e) => {
                      // Implementar atualização
                    }}
                    placeholder="dpo@suaclinica.com"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Política de Privacidade"
                    multiline
                    rows={6}
                    value={configuracoes.seguranca?.lgpd?.politica_privacidade || ''}
                    onChange={(e) => {
                      // Implementar atualização
                    }}
                    placeholder="Nossa política de privacidade..."
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Termos de Uso"
                    multiline
                    rows={4}
                    value={configuracoes.seguranca?.lgpd?.termos_uso || ''}
                    onChange={(e) => {
                      // Implementar atualização
                    }}
                    placeholder="Termos e condições de uso..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Backup Automático */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<BackupIcon />}
              title="Backup Automático"
              subheader="Configurações de backup e restauração"
              action={
                <Chip
                  icon={statusBackup.status === 'ok' ? <CheckIcon /> : <WarningIcon />}
                  label={statusBackup.status === 'ok' ? 'OK' : 'Atenção'}
                  color={statusBackup.status === 'ok' ? 'success' : 'warning'}
                  size="small"
                />
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configuracoes.seguranca?.backup?.automatico || false}
                        onChange={(e) => {
                          // Implementar atualização
                        }}
                      />
                    }
                    label="Backup Automático Ativo"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Frequência do Backup</InputLabel>
                    <Select
                      value={configuracoes.seguranca?.backup?.frequencia || 'diaria'}
                      onChange={(e) => {
                        // Implementar atualização
                      }}
                    >
                      <MenuItem value="diaria">Diária</MenuItem>
                      <MenuItem value="semanal">Semanal</MenuItem>
                      <MenuItem value="mensal">Mensal</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Retenção (dias)"
                    type="number"
                    value={configuracoes.seguranca?.backup?.retencao || 30}
                    onChange={(e) => {
                      // Implementar atualização
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Local do Backup</InputLabel>
                    <Select
                      value={configuracoes.seguranca?.backup?.local || 'local'}
                      onChange={(e) => {
                        // Implementar atualização
                      }}
                    >
                      <MenuItem value="local">Local</MenuItem>
                      <MenuItem value="nuvem">Nuvem</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Status do Backup:</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <ScheduleIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Último backup: {statusBackup.ultimo}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <ScheduleIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Próximo backup: {statusBackup.proximo}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleConfirmacao('backup', () => console.log('Backup manual iniciado'))}
                  >
                    Executar Backup Manual
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Auditoria e Logs */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<AuditoriaIcon />}
              title="Auditoria e Logs"
              subheader="Monitoramento de atividades do sistema"
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configuracoes.seguranca?.auditoria?.log_acessos || false}
                        onChange={(e) => {
                          // Implementar atualização
                        }}
                      />
                    }
                    label="Log de Acessos"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configuracoes.seguranca?.auditoria?.log_modificacoes || false}
                        onChange={(e) => {
                          // Implementar atualização
                        }}
                      />
                    }
                    label="Log de Modificações"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Retenção de Logs (dias)"
                    type="number"
                    value={configuracoes.seguranca?.auditoria?.retencao_logs || 365}
                    onChange={(e) => {
                      // Implementar atualização
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      Os logs de auditoria são essenciais para compliance e segurança. 
                      Mantenha ativados em ambientes de produção.
                    </Typography>
                  </Alert>
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => console.log('Visualizar logs')}
                  >
                    Visualizar Logs de Auditoria
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Export/Import Configurações */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              avatar={<SecurityIcon />}
              title="Gerenciamento de Configurações"
              subheader="Export/Import seguro das configurações"
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Importante:</strong> As chaves de API e senhas são mascaradas durante a exportação por segurança. 
                      Você precisará reconfigurá-las após importar em outro sistema.
                    </Typography>
                  </Alert>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleConfirmacao('exportar', onExportar)}
                    size="large"
                  >
                    Exportar Configurações
                  </Button>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Baixa um arquivo JSON com todas as configurações (exceto dados sensíveis)
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    size="large"
                  >
                    Importar Configurações
                    <input
                      type="file"
                      accept=".json"
                      hidden
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          handleConfirmacao('importar', () => onImportar(e));
                        }
                      }}
                    />
                  </Button>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Carrega configurações de um arquivo JSON exportado
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Configurações de clínica e operações"
                        secondary="Horários, procedimentos, equipamentos"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Templates e configurações de CRM"
                        secondary="Mensagens, anamnese, períodos"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Chaves de API (mascaradas)"
                        secondary="WhatsApp, PIX, IA - precisam ser reconfiguradas"
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog de Confirmação */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, tipo: '', callback: null })}>
        <DialogTitle>
          Confirmar Ação
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDialog.tipo === 'backup' && 'Deseja executar um backup manual agora? Esta operação pode levar alguns minutos.'}
            {confirmDialog.tipo === 'exportar' && 'Deseja exportar as configurações atuais? As chaves de API serão mascaradas por segurança.'}
            {confirmDialog.tipo === 'importar' && 'Deseja importar as configurações do arquivo selecionado? As configurações atuais serão mescladas.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, tipo: '', callback: null })}>
            Cancelar
          </Button>
          <Button onClick={executeCallback} variant="contained">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SegurancaPrivacidade;
