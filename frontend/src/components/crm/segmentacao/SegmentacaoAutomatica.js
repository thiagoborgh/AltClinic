import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Box,
  Chip,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  AutoAwesome,
  Group,
  TrendingUp,
  Warning,
  Refresh,
  Edit,
  Visibility,
  Add,
  Settings
} from '@mui/icons-material';
import { useSegmentos } from '../../../hooks/crm/useSegmentos';
import { usePacientes } from '../../../hooks/crm/usePacientes';

const SegmentacaoAutomatica = () => {
  const { criarSegmento, atualizarSegmento } = useSegmentos();
  const { pacientes } = usePacientes();
  const [segmentacaoAtiva, setSegmentacaoAtiva] = useState(true);
  const [processandoSegmentacao, setProcessandoSegmentacao] = useState(false);
  const [dialogEditarSegmento, setDialogEditarSegmento] = useState(false);
  const [segmentoSelecionado, setSegmentoSelecionado] = useState(null);
  const [novoSegmento, setNovoSegmento] = useState({
    nome: '',
    descricao: '',
    criterios: '',
    cor: '#1976d2'
  });

  // Segmentação automática baseada em regras
  const segmentosAutomaticos = [
    {
      id: 'novos_pacientes',
      nome: 'Novos Pacientes',
      descricao: 'Pacientes cadastrados nos últimos 30 dias',
      criterio: 'Cadastro recente',
      cor: '#4caf50',
      icone: <Add />,
      count: pacientes.filter(p => {
        const cadastro = new Date(p.dataCadastro);
        const trinta_dias = new Date();
        trinta_dias.setDate(trinta_dias.getDate() - 30);
        return cadastro >= trinta_dias;
      }).length,
      ativo: true
    },
    {
      id: 'pacientes_ativos',
      nome: 'Pacientes Ativos',
      descricao: 'Pacientes com consultas nos últimos 60 dias',
      criterio: 'Atividade recente',
      cor: '#2196f3',
      icone: <TrendingUp />,
      count: pacientes.filter(p => p.status === 'ativo').length,
      ativo: true
    },
    {
      id: 'pacientes_inativos',
      nome: 'Pacientes Inativos',
      descricao: 'Pacientes sem consultas há mais de 90 dias',
      criterio: 'Inatividade prolongada',
      cor: '#ff9800',
      icone: <Warning />,
      count: pacientes.filter(p => p.status === 'inativo').length,
      ativo: true
    },
    {
      id: 'alto_valor',
      nome: 'Alto Valor',
      descricao: 'Pacientes com gastos acima de R$ 5.000',
      criterio: 'Valor monetário elevado',
      cor: '#9c27b0',
      icone: <TrendingUp />,
      count: pacientes.filter(p => 
        p.valorTotal && parseFloat(p.valorTotal.replace(/[R$\s.,]/g, '')) > 500000
      ).length,
      ativo: true
    },
    {
      id: 'risco_abandono',
      nome: 'Risco de Abandono',
      descricao: 'Pacientes com indicadores de possível abandono',
      criterio: 'Padrão de comportamento',
      cor: '#f44336',
      icone: <Warning />,
      count: pacientes.filter(p => 
        p.ultimaConsulta && 
        new Date(p.ultimaConsulta) < new Date(Date.now() - 120 * 24 * 60 * 60 * 1000)
      ).length,
      ativo: true
    }
  ];

  const executarSegmentacaoAutomatica = async () => {
    setProcessandoSegmentacao(true);
    
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Criar/atualizar segmentos automáticos
    for (const segmento of segmentosAutomaticos) {
      if (segmento.ativo) {
        await criarSegmento({
          nome: segmento.nome,
          descricao: segmento.descricao,
          tipo: 'automatico',
          criterios: segmento.criterio,
          cor: segmento.cor,
          pacientesCount: segmento.count
        });
      }
    }
    
    setProcessandoSegmentacao(false);
  };

  const abrirEditarSegmento = (segmento) => {
    setSegmentoSelecionado(segmento);
    setNovoSegmento({
      nome: segmento.nome,
      descricao: segmento.descricao,
      criterios: segmento.criterios || segmento.criterio,
      cor: segmento.cor
    });
    setDialogEditarSegmento(true);
  };

  const salvarSegmento = async () => {
    if (segmentoSelecionado) {
      await atualizarSegmento(segmentoSelecionado.id, novoSegmento);
    } else {
      await criarSegmento({
        ...novoSegmento,
        tipo: 'personalizado'
      });
    }
    
    setDialogEditarSegmento(false);
    setSegmentoSelecionado(null);
    setNovoSegmento({
      nome: '',
      descricao: '',
      criterios: '',
      cor: '#1976d2'
    });
  };

  return (
    <Box>
      {/* Header da Segmentação */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          avatar={<AutoAwesome color="primary" />}
          title="Segmentação Automática de Pacientes"
          subheader="Sistema inteligente de categorização e análise de pacientes"
          action={
            <Box display="flex" alignItems="center" gap={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={segmentacaoAtiva}
                    onChange={(e) => setSegmentacaoAtiva(e.target.checked)}
                    color="primary"
                  />
                }
                label="Ativa"
              />
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={executarSegmentacaoAutomatica}
                disabled={processandoSegmentacao || !segmentacaoAtiva}
              >
                Executar Segmentação
              </Button>
            </Box>
          }
        />
        {processandoSegmentacao && (
          <CardContent sx={{ pt: 0 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Processando segmentação automática...
            </Typography>
          </CardContent>
        )}
      </Card>

      {/* Segmentos Automáticos */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardHeader
              title="Segmentos Automáticos"
              subheader="Segmentação baseada em regras predefinidas"
              action={
                <Button
                  startIcon={<Add />}
                  onClick={() => setDialogEditarSegmento(true)}
                >
                  Novo Segmento
                </Button>
              }
            />
            <CardContent>
              <List>
                {segmentosAutomaticos.map((segmento, index) => (
                  <React.Fragment key={segmento.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: segmento.cor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}
                        >
                          {segmento.icone}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="h6">
                              {segmento.nome}
                            </Typography>
                            <Chip
                              label={`${segmento.count} pacientes`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {segmento.descricao}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Critério: {segmento.criterio}
                            </Typography>
                          </Box>
                        }
                      />
                      <Box display="flex" gap={1}>
                        <Tooltip title="Visualizar pacientes">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar segmento">
                          <IconButton 
                            size="small"
                            onClick={() => abrirEditarSegmento(segmento)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Configurações">
                          <IconButton size="small">
                            <Settings />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItem>
                    {index < segmentosAutomaticos.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Estatísticas e Insights */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardHeader
              title="Insights de Segmentação"
              avatar={<Group color="primary" />}
            />
            <CardContent>
              <Box mb={3}>
                <Typography variant="h4" color="primary" gutterBottom>
                  {pacientes.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de pacientes
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="h4" color="success.main" gutterBottom>
                  {segmentosAutomaticos.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Segmentos ativos
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="h4" color="warning.main" gutterBottom>
                  {segmentosAutomaticos.find(s => s.id === 'risco_abandono')?.count || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pacientes em risco
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Distribuição por Segmento
              </Typography>
              
              {segmentosAutomaticos.map(segmento => (
                <Box key={segmento.id} mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">
                      {segmento.nome}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {Math.round((segmento.count / pacientes.length) * 100)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(segmento.count / pacientes.length) * 100}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: segmento.cor
                      }
                    }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog para Criar/Editar Segmento */}
      <Dialog
        open={dialogEditarSegmento}
        onClose={() => setDialogEditarSegmento(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {segmentoSelecionado ? 'Editar Segmento' : 'Novo Segmento Personalizado'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Nome do Segmento"
              value={novoSegmento.nome}
              onChange={(e) => setNovoSegmento(prev => ({
                ...prev,
                nome: e.target.value
              }))}
              fullWidth
            />
            
            <TextField
              label="Descrição"
              value={novoSegmento.descricao}
              onChange={(e) => setNovoSegmento(prev => ({
                ...prev,
                descricao: e.target.value
              }))}
              fullWidth
              multiline
              rows={2}
            />
            
            <TextField
              label="Critérios de Segmentação"
              value={novoSegmento.criterios}
              onChange={(e) => setNovoSegmento(prev => ({
                ...prev,
                criterios: e.target.value
              }))}
              fullWidth
              multiline
              rows={3}
              placeholder="Ex: Pacientes com mais de 65 anos e histórico de diabetes"
            />
            
            <Box>
              <Typography variant="body2" gutterBottom>
                Cor do Segmento
              </Typography>
              <input
                type="color"
                value={novoSegmento.cor}
                onChange={(e) => setNovoSegmento(prev => ({
                  ...prev,
                  cor: e.target.value
                }))}
                style={{
                  width: '100%',
                  height: 40,
                  border: '1px solid #ccc',
                  borderRadius: 4
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogEditarSegmento(false)}>
            Cancelar
          </Button>
          <Button
            onClick={salvarSegmento}
            variant="contained"
            disabled={!novoSegmento.nome.trim()}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SegmentacaoAutomatica;
