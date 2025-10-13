import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Button,
  Grid,
  Typography,
  Card,
  CardContent,
  Alert,
  Tooltip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import { Save, Preview, Close } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

const ConfiguracaoGrade = ({ 
  open = false,
  onClose = () => {},
  selectedDay = 'quinta-feira', 
  professionalId, 
  onSave,
  isEmbedded = false 
}) => {
  const [formData, setFormData] = useState({
    horaInicio: '09:00',
    horaFim: '17:00',
    intervaloMinutos: 30,
    local: '',
    maxRetornos: '5',
    maxEncaixes: '3',
    duplicarDias: false,
    diasSelecionados: {
      domingo: false,
      segunda: false,
      terca: false,
      quarta: false,
      quinta: false,
      sexta: false,
      sabado: false
    }
  });

  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const locais = [
    { id: 1, nome: 'Consultório 1' },
    { id: 2, nome: 'Consultório 2' },
    { id: 3, nome: 'Sala de Procedimentos' }
  ];

  const diasSemana = [
    { key: 'domingo', label: 'Domingo' },
    { key: 'segunda', label: 'Segunda-feira' },
    { key: 'terca', label: 'Terça-feira' },
    { key: 'quarta', label: 'Quarta-feira' },
    { key: 'quinta', label: 'Quinta-feira' },
    { key: 'sexta', label: 'Sexta-feira' },
    { key: 'sabado', label: 'Sábado' }
  ];

  const generatePreview = () => {
    // Lógica simples de preview
    return ['09:00', '09:30', '10:00', '10:30'];
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const gradeData = { ...formData, professionalId, selectedDay };
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSave && onSave(gradeData);
      toast.success('Grade criada com sucesso!');
      if (!isEmbedded && onClose) {
        onClose();
      }
    } catch (error) {
      toast.error('Erro ao salvar grade');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicarDiasUteis = () => {
    setFormData(prev => ({
      ...prev,
      duplicarDias: true,
      diasSelecionados: {
        ...prev.diasSelecionados,
        segunda: true,
        terca: true,
        quarta: true,
        quinta: true,
        sexta: true
      }
    }));
  };

  // Conteúdo do formulário (reutilizável para embedded e modal)
  const renderContent = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
        Criar Grade de Horários - {selectedDay}
      </Typography>

      {/* Configuração de Horários */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Configuração de Horários
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <TextField
                label='De *'
                type='time'
                value={formData.horaInicio}
                onChange={(e) => setFormData(prev => ({ ...prev, horaInicio: e.target.value }))}
                fullWidth
                size='small'
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <TextField
                label='Até *'
                type='time'
                value={formData.horaFim}
                onChange={(e) => setFormData(prev => ({ ...prev, horaFim: e.target.value }))}
                fullWidth
                size='small'
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <TextField
                label='Intervalo (min) *'
                type='number'
                value={formData.intervaloMinutos}
                onChange={(e) => setFormData(prev => ({ ...prev, intervaloMinutos: parseInt(e.target.value) || 30 }))}
                fullWidth
                size='small'
                inputProps={{ min: 5, max: 120 }}
              />
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size='small'>
                <InputLabel>Local</InputLabel>
                <Select
                  value={formData.local}
                  label='Local'
                  onChange={(e) => setFormData(prev => ({ ...prev, local: e.target.value }))}
                >
                  {locais.map((local) => (
                    <MenuItem key={local.id} value={local.nome}>
                      {local.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Limites */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Limites
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Tooltip 
                title='Número máximo de agendamentos que podem ser marcados como retorno' 
                arrow
              >
                <TextField
                  label='Máx. Retornos *'
                  type='number'
                  value={formData.maxRetornos}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxRetornos: e.target.value }))}
                  fullWidth
                  size='small'
                  inputProps={{ min: 0 }}
                />
              </Tooltip>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Tooltip 
                title='Número máximo de agendamentos que podem ser encaixados fora dos horários programados' 
                arrow
              >
                <TextField
                  label='Máx. Encaixes *'
                  type='number'
                  value={formData.maxEncaixes}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxEncaixes: e.target.value }))}
                  fullWidth
                  size='small'
                  inputProps={{ min: 0 }}
                />
              </Tooltip>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Duplicar para Múltiplos Dias */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Duplicar para Múltiplos Dias
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.duplicarDias}
                onChange={(e) => setFormData(prev => ({ ...prev, duplicarDias: e.target.checked }))}
                color='primary'
              />
            }
            label='Duplicar para outros dias da semana'
          />
          
          {formData.duplicarDias && (
            <Box sx={{ mt: 2 }}>
              <Typography variant='subtitle2' gutterBottom>
                Selecione os dias:
              </Typography>
              <Grid container spacing={1}>
                {diasSemana.map((dia) => (
                  <Grid item key={dia.key} xs={6} sm={4} md={3}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.diasSelecionados[dia.key]}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            diasSelecionados: {
                              ...prev.diasSelecionados,
                              [dia.key]: e.target.checked
                            }
                          }))}
                          size='small'
                        />
                      }
                      label={dia.label}
                    />
                  </Grid>
                ))}
              </Grid>
              
              <Button
                variant='outlined'
                size='small'
                onClick={handleDuplicarDiasUteis}
                sx={{ mt: 1 }}
              >
                Selecionar Dias Úteis
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Preview dos Horários
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {generatePreview().map((slot, index) => (
                <Box
                  key={index}
                  sx={{
                    px: 1,
                    py: 0.5,
                    border: '1px solid #ddd',
                    borderRadius: 1,
                    fontSize: '0.875rem',
                    bgcolor: '#f5f5f5'
                  }}
                >
                  {slot}
                </Box>
              ))}
            </Box>
            
            {formData.duplicarDias && (
              <Alert severity='info' sx={{ mt: 2 }}>
                Esta grade será aplicada aos dias: {
                  diasSemana
                    .filter(dia => formData.diasSelecionados[dia.key])
                    .map(dia => dia.label)
                    .join(', ')
                }
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Botões de ação */}
      <Box sx={{ mt: 3 }}>
        <Stack direction='row' spacing={2} sx={{ width: '100%', justifyContent: 'space-between' }}>
          <Button
            startIcon={<Preview />}
            variant='outlined'
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Ocultar' : 'Mostrar'} Preview
          </Button>
          
          <Button
            variant='contained'
            startIcon={<Save />}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'SALVAR'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );

  // Se for modo embedded, retorna apenas o conteúdo
  if (isEmbedded) {
    return renderContent();
  }

  // Se for modo modal, retorna dentro de um Dialog
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
          Configurar Grade - {selectedDay}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {renderContent()}
      </DialogContent>

      <DialogActions sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          startIcon={<Save />}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'SALVAR'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfiguracaoGrade;
