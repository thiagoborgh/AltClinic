import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AutoAwesome as AIIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EvolucaoMedidasTab({ prontuario, onAdicionarEvolucao }) {
  const [evolucoes, setEvolucoes] = useState(prontuario?.evolucoes || []);
  const [modalAberto, setModalAberto] = useState(false);
  const [novaEvolucao, setNovaEvolucao] = useState({
    data: new Date().toISOString().split('T')[0],
    medidas: {},
    observacoes: ''
  });
  const [analisandoIA, setAnalisandoIA] = useState(false);
  const [analiseIA, setAnaliseIA] = useState(null);

  // Tipos de medidas configuráveis por especialidade
  const tiposMedidas = {
    estetica: ['peso', 'altura', 'imc', 'cintura', 'quadril', 'bracos', 'coxas', 'percentual_gordura'],
    fisioterapia: ['amplitude_movimento', 'forca_muscular', 'dor_escala', 'flexibilidade'],
    odontologia: ['indice_placa', 'profundidade_sondagem', 'mobilidade_dental'],
    geral: ['peso', 'altura', 'pressao_sistolica', 'pressao_diastolica', 'temperatura']
  };

  const especialidade = prontuario?.configuracoes?.especialidade || 'estetica';
  const medidasDisponiveis = tiposMedidas[especialidade] || tiposMedidas.geral;

  const unidadesMedidas = {
    peso: 'kg',
    altura: 'cm',
    imc: 'kg/m²',
    cintura: 'cm',
    quadril: 'cm',
    bracos: 'cm',
    coxas: 'cm',
    percentual_gordura: '%',
    amplitude_movimento: 'graus',
    forca_muscular: 'kg',
    dor_escala: '0-10',
    flexibilidade: 'cm',
    indice_placa: '%',
    profundidade_sondagem: 'mm',
    mobilidade_dental: 'graus',
    pressao_sistolica: 'mmHg',
    pressao_diastolica: 'mmHg',
    temperatura: '°C'
  };

  useEffect(() => {
    setEvolucoes(prontuario?.evolucoes || []);
  }, [prontuario]);

  const calcularVariacao = (medida, valorAtual) => {
    if (evolucoes.length < 2) return null;
    
    const penultimaEvolucao = evolucoes[evolucoes.length - 2];
    
    const valorAnterior = penultimaEvolucao.medidas[medida];
    if (!valorAnterior || !valorAtual) return null;
    
    const variacao = ((valorAtual - valorAnterior) / valorAnterior) * 100;
    return variacao;
  };

  const analisarTendenciasIA = async () => {
    setAnalisandoIA(true);
    try {
      // Simular análise de IA das tendências
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const analise = {
        tendencias: [
          { medida: 'peso', tendencia: 'down', variacao: -5.2, status: 'positivo' },
          { medida: 'cintura', tendencia: 'down', variacao: -8.1, status: 'positivo' },
          { medida: 'quadril', tendencia: 'stable', variacao: -1.2, status: 'neutro' }
        ],
        recomendacoes: [
          'Parabéns! Evolução consistente na redução de peso',
          'Circunferência da cintura mostra excelente progresso',
          'Considere manter o protocolo atual por mais 2 semanas'
        ],
        proximaAvaliacao: '2025-09-15',
        score: 8.5
      };
      
      setAnaliseIA(analise);
    } catch (error) {
      console.error('Erro na análise de IA:', error);
    } finally {
      setAnalisandoIA(false);
    }
  };

  const adicionarEvolucao = () => {
    // Calcular IMC automaticamente se peso e altura estiverem disponíveis
    if (novaEvolucao.medidas.peso && novaEvolucao.medidas.altura) {
      const peso = parseFloat(novaEvolucao.medidas.peso);
      const altura = parseFloat(novaEvolucao.medidas.altura) / 100; // converter cm para m
      const imc = peso / (altura * altura);
      novaEvolucao.medidas.imc = imc.toFixed(1);
    }

    const evolucaoCompleta = {
      ...novaEvolucao,
      id: Date.now(),
      timestamp: new Date().toISOString()
    };

    const novasEvolucoes = [...evolucoes, evolucaoCompleta];
    setEvolucoes(novasEvolucoes);
    onAdicionarEvolucao(evolucaoCompleta);
    
    setModalAberto(false);
    setNovaEvolucao({
      data: new Date().toISOString().split('T')[0],
      medidas: {},
      observacoes: ''
    });
  };

  const prepararDadosGrafico = (medida) => {
    return evolucoes
      .filter(ev => ev.medidas[medida])
      .map(ev => ({
        data: format(parseISO(ev.data), 'dd/MM', { locale: ptBR }),
        valor: parseFloat(ev.medidas[medida])
      }));
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Header com ações */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">Evolução de Medidas</Typography>
            <Box>
              <Button
                startIcon={<AIIcon />}
                onClick={analisarTendenciasIA}
                disabled={analisandoIA || evolucoes.length < 2}
                sx={{ mr: 1 }}
              >
                Analisar Tendências
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setModalAberto(true)}
              >
                Nova Medição
              </Button>
            </Box>
          </Box>

          {analisandoIA && <LinearProgress sx={{ mb: 2 }} />}
        </Grid>

        {/* Análise de IA */}
        {analiseIA && (
          <Grid item xs={12}>
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Análise de Tendências - Score: {analiseIA.score}/10
              </Typography>
              {analiseIA.recomendacoes.map((rec, index) => (
                <Typography key={index} variant="body2">
                  • {rec}
                </Typography>
              ))}
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                Próxima avaliação sugerida: {format(parseISO(analiseIA.proximaAvaliacao), 'dd/MM/yyyy', { locale: ptBR })}
              </Typography>
            </Alert>
          </Grid>
        )}

        {/* Gráficos de Evolução */}
        {medidasDisponiveis.slice(0, 3).map(medida => {
          const dados = prepararDadosGrafico(medida);
          if (dados.length === 0) return null;

          return (
            <Grid item xs={12} md={4} key={medida}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {medida.replace('_', ' ').toUpperCase()} ({unidadesMedidas[medida]})
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dados}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="valor"
                      stroke="#2196f3"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          );
        })}

        {/* Tabela de Evoluções */}
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  {medidasDisponiveis.map(medida => (
                    <TableCell key={medida} align="center">
                      {medida.replace('_', ' ').toUpperCase()}
                      <br />
                      <Typography variant="caption">
                        ({unidadesMedidas[medida]})
                      </Typography>
                    </TableCell>
                  ))}
                  <TableCell>Observações</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {evolucoes.map((evolucao, index) => (
                  <TableRow key={evolucao.id || index}>
                    <TableCell>
                      {format(parseISO(evolucao.data), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    {medidasDisponiveis.map(medida => {
                      const valor = evolucao.medidas[medida];
                      const variacao = calcularVariacao(medida, valor);
                      
                      return (
                        <TableCell key={medida} align="center">
                          {valor || '-'}
                          {variacao !== null && (
                            <Box display="flex" alignItems="center" justifyContent="center" mt={0.5}>
                              {variacao > 0 ? (
                                <TrendingUpIcon color="error" fontSize="small" />
                              ) : variacao < 0 ? (
                                <TrendingDownIcon color="success" fontSize="small" />
                              ) : null}
                              <Typography
                                variant="caption"
                                color={variacao > 0 ? 'error' : variacao < 0 ? 'success' : 'text.secondary'}
                                sx={{ ml: 0.5 }}
                              >
                                {variacao > 0 ? '+' : ''}{variacao.toFixed(1)}%
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      {evolucao.observacoes || '-'}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Modal de Nova Medição */}
      <Dialog open={modalAberto} onClose={() => setModalAberto(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nova Medição</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Data da Medição"
                value={novaEvolucao.data}
                onChange={(e) => setNovaEvolucao(prev => ({ ...prev, data: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            {medidasDisponiveis.map(medida => (
              <Grid item xs={12} md={6} key={medida}>
                <TextField
                  fullWidth
                  type="number"
                  label={`${medida.replace('_', ' ').toUpperCase()} (${unidadesMedidas[medida]})`}
                  value={novaEvolucao.medidas[medida] || ''}
                  onChange={(e) => setNovaEvolucao(prev => ({
                    ...prev,
                    medidas: { ...prev.medidas, [medida]: e.target.value }
                  }))}
                />
              </Grid>
            ))}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observações"
                value={novaEvolucao.observacoes}
                onChange={(e) => setNovaEvolucao(prev => ({ ...prev, observacoes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalAberto(false)}>Cancelar</Button>
          <Button variant="contained" onClick={adicionarEvolucao}>
            Salvar Medição
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
