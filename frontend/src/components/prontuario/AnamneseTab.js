import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  AutoAwesome as AIIcon,
  Save as SaveIcon
} from '@mui/icons-material';

export default function AnamneseTab({ prontuario, onAtualizarAnamnese }) {
  const [anamneses, setAnamneses] = useState(prontuario?.anamneses || [{
    id: Date.now(),
    data: new Date().toISOString().split('T')[0],
    especialidade: 'clinicaGeral',
    titulo: 'Anamnese Inicial',
    dados: {
      dadosPessoais: {},
      historico: {},
      alergias: [],
      medicamentos: [],
      habitosVida: {},
      observacoes: ''
    }
  }]);
  const [anamneseAtiva, setAnamneseAtiva] = useState(0);
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [sugestoesIA, setSugestoesIA] = useState([]);

  const handleInputChange = (categoria, campo, valor) => {
    setAnamneses(prev => prev.map((a, index) =>
      index === anamneseAtiva ? {
        ...a,
        dados: {
          ...a.dados,
          [categoria]: {
            ...a.dados[categoria],
            [campo]: valor
          }
        }
      } : a
    ));
  };

  const handleArrayAdd = (campo, item) => {
    if (item.trim()) {
      setAnamneses(prev => prev.map((a, index) =>
        index === anamneseAtiva ? {
          ...a,
          dados: {
            ...a.dados,
            [campo]: [...(a.dados[campo] || []), item.trim()]
          }
        } : a
      ));
    }
  };

  const handleArrayRemove = (campo, index) => {
    setAnamneses(prev => prev.map((a, idx) =>
      idx === anamneseAtiva ? {
        ...a,
        dados: {
          ...a.dados,
          [campo]: a.dados[campo].filter((_, i) => i !== index)
        }
      } : a
    ));
  };

  const solicitarSugestoesIA = async () => {
    setCarregandoIA(true);
    try {
      // Simular chamada para IA (Gemini)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const sugestoes = [
        'Adicionar pergunta sobre histórico de cirurgias estéticas',
        'Incluir questão sobre uso de suplementos alimentares',
        'Verificar histórico familiar de doenças cardiovasculares',
        'Avaliar frequência de atividades físicas'
      ];
      
      setSugestoesIA(sugestoes);
    } catch (error) {
      console.error('Erro ao obter sugestões da IA:', error);
    } finally {
      setCarregandoIA(false);
    }
  };

  const salvarAnamnese = () => {
    onAtualizarAnamnese(anamneses);
  };

  const adicionarNovaAnamnese = () => {
    const novaAnamnese = {
      id: Date.now(),
      data: new Date().toISOString().split('T')[0],
      especialidade: 'clinicaGeral',
      titulo: `Anamnese ${anamneses.length + 1}`,
      dados: {
        dadosPessoais: {},
        historico: {},
        alergias: [],
        medicamentos: [],
        habitosVida: {},
        observacoes: ''
      }
    };
    setAnamneses(prev => [...prev, novaAnamnese]);
    setAnamneseAtiva(anamneses.length);
  };

  const removerAnamnese = (index) => {
    if (anamneses.length > 1) {
      setAnamneses(prev => prev.filter((_, i) => i !== index));
      if (anamneseAtiva >= index && anamneseAtiva > 0) {
        setAnamneseAtiva(anamneseAtiva - 1);
      }
    }
  };

  const anamneseAtual = anamneses[anamneseAtiva];

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Header com ações e seleção de anamnese */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h5">Anamneses</Typography>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Selecionar Anamnese</InputLabel>
                <Select
                  value={anamneseAtiva}
                  onChange={(e) => setAnamneseAtiva(e.target.value)}
                  label="Selecionar Anamnese"
                >
                  {anamneses.map((anamnese, index) => (
                    <MenuItem key={anamnese.id} value={index}>
                      {anamnese.titulo} - {new Date(anamnese.data).toLocaleDateString('pt-BR')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <Button
                startIcon={<AddIcon />}
                onClick={adicionarNovaAnamnese}
                sx={{ mr: 1 }}
              >
                Nova Anamnese
              </Button>
              <Button
                startIcon={<AIIcon />}
                onClick={solicitarSugestoesIA}
                disabled={carregandoIA}
                sx={{ mr: 1 }}
              >
                Sugestões IA
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={salvarAnamnese}
              >
                Salvar
              </Button>
            </Box>
          </Box>

          {/* Informações da anamnese ativa */}
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" gutterBottom>
              {anamneseAtual.titulo}
            </Typography>
            <Box display="flex" gap={2}>
              <Chip
                label={`Data: ${new Date(anamneseAtual.data).toLocaleDateString('pt-BR')}`}
                size="small"
              />
              <Chip
                label={`Especialidade: ${anamneseAtual.especialidade}`}
                size="small"
                color="primary"
              />
            </Box>
          </Paper>

          {carregandoIA && <LinearProgress sx={{ mb: 2 }} />}

          {sugestoesIA.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Sugestões da IA para melhorar a anamnese:
              </Typography>
              {sugestoesIA.map((sugestao, index) => (
                <Typography key={index} variant="body2">
                  • {sugestao}
                </Typography>
              ))}
            </Alert>
          )}
        </Grid>

        {/* Dados Pessoais */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Dados Pessoais</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Estado Civil"
                    value={anamneseAtual.dados.dadosPessoais?.estadoCivil || ''}
                    onChange={(e) => handleInputChange('dadosPessoais', 'estadoCivil', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Profissão"
                    value={anamneseAtual.dados.dadosPessoais?.profissao || ''}
                    onChange={(e) => handleInputChange('dadosPessoais', 'profissao', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Motivo da Consulta"
                    value={anamneseAtual.dados.dadosPessoais?.motivoConsulta || ''}
                    onChange={(e) => handleInputChange('dadosPessoais', 'motivoConsulta', e.target.value)}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Histórico Médico */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Histórico Médico</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Doenças Prévias</FormLabel>
                    <FormGroup row>
                      {['Diabetes', 'Hipertensão', 'Cardiopatia', 'Epilepsia', 'Outras'].map((doenca) => (
                        <FormControlLabel
                          key={doenca}
                          control={
                            <Checkbox
                              checked={anamneseAtual.dados.historico?.doencas?.includes(doenca) || false}
                              onChange={(e) => {
                                const doencas = anamneseAtual.dados.historico?.doencas || [];
                                if (e.target.checked) {
                                  handleInputChange('historico', 'doencas', [...doencas, doenca]);
                                } else {
                                  handleInputChange('historico', 'doencas', doencas.filter(d => d !== doenca));
                                }
                              }}
                            />
                          }
                          label={doenca}
                        />
                      ))}
                    </FormGroup>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <FormLabel>Histórico de Cirurgias</FormLabel>
                    <RadioGroup
                      value={anamneseAtual.dados.historico?.cirurgias || 'nao'}
                      onChange={(e) => handleInputChange('historico', 'cirurgias', e.target.value)}
                    >
                      <FormControlLabel value="nao" control={<Radio />} label="Não" />
                      <FormControlLabel value="sim" control={<Radio />} label="Sim" />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                {anamneseAtual.dados.historico?.cirurgias === 'sim' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Descreva as cirurgias realizadas"
                      value={anamneseAtual.dados.historico?.descricaoCirurgias || ''}
                      onChange={(e) => handleInputChange('historico', 'descricaoCirurgias', e.target.value)}
                    />
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Alergias */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Alergias 
                {anamneseAtual.dados.alergias?.length > 0 && (
                  <Chip 
                    size="small" 
                    label={anamneseAtual.dados.alergias.length} 
                    color="warning" 
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                <AlergiaInput onAdd={(alergia) => handleArrayAdd('alergias', alergia)} />
                <Box mt={2}>
                  {anamneseAtual.dados.alergias?.map((alergia, index) => (
                    <Chip
                      key={index}
                      label={alergia}
                      onDelete={() => handleArrayRemove('alergias', index)}
                      color="warning"
                      variant="outlined"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Medicamentos */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Medicamentos em Uso
                {anamneseAtual.dados.medicamentos?.length > 0 && (
                  <Chip 
                    size="small" 
                    label={anamneseAtual.dados.medicamentos.length} 
                    color="info" 
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                <MedicamentoInput onAdd={(medicamento) => handleArrayAdd('medicamentos', medicamento)} />
                <Box mt={2}>
                  {anamneseAtual.dados.medicamentos?.map((medicamento, index) => (
                    <Chip
                      key={index}
                      label={medicamento}
                      onDelete={() => handleArrayRemove('medicamentos', index)}
                      color="info"
                      variant="outlined"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Hábitos de Vida */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Hábitos de Vida</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Tabagismo</InputLabel>
                    <Select
                      value={anamneseAtual.dados.habitosVida?.tabagismo || ''}
                      onChange={(e) => handleInputChange('habitosVida', 'tabagismo', e.target.value)}
                    >
                      <MenuItem value="nunca">Nunca fumou</MenuItem>
                      <MenuItem value="ex-fumante">Ex-fumante</MenuItem>
                      <MenuItem value="fumante">Fumante atual</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Álcool</InputLabel>
                    <Select
                      value={anamneseAtual.dados.habitosVida?.alcool || ''}
                      onChange={(e) => handleInputChange('habitosVida', 'alcool', e.target.value)}
                    >
                      <MenuItem value="nao">Não bebe</MenuItem>
                      <MenuItem value="social">Social</MenuItem>
                      <MenuItem value="regular">Regular</MenuItem>
                      <MenuItem value="excessivo">Excessivo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Atividade Física</InputLabel>
                    <Select
                      value={anamneseAtual.dados.habitosVida?.atividadeFisica || ''}
                      onChange={(e) => handleInputChange('habitosVida', 'atividadeFisica', e.target.value)}
                    >
                      <MenuItem value="sedentario">Sedentário</MenuItem>
                      <MenuItem value="leve">Leve (1-2x/semana)</MenuItem>
                      <MenuItem value="moderado">Moderado (3-4x/semana)</MenuItem>
                      <MenuItem value="intenso">Intenso (5+x/semana)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Observações */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Observações Gerais
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Adicione observações importantes sobre o paciente..."
              value={anamneseAtual.dados.observacoes || ''}
              onChange={(e) => handleInputChange('observacoes', '', e.target.value)}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// Componente auxiliar para adicionar alergias
function AlergiaInput({ onAdd }) {
  const [alergia, setAlergia] = useState('');

  const handleAdd = () => {
    onAdd(alergia);
    setAlergia('');
  };

  return (
    <Box display="flex" gap={1}>
      <TextField
        fullWidth
        size="small"
        label="Nova alergia"
        value={alergia}
        onChange={(e) => setAlergia(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
      />
      <IconButton onClick={handleAdd} color="primary">
        <AddIcon />
      </IconButton>
    </Box>
  );
}

// Componente auxiliar para adicionar medicamentos
function MedicamentoInput({ onAdd }) {
  const [medicamento, setMedicamento] = useState('');

  const handleAdd = () => {
    onAdd(medicamento);
    setMedicamento('');
  };

  return (
    <Box display="flex" gap={1}>
      <TextField
        fullWidth
        size="small"
        label="Novo medicamento"
        value={medicamento}
        onChange={(e) => setMedicamento(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
      />
      <IconButton onClick={handleAdd} color="primary">
        <AddIcon />
      </IconButton>
    </Box>
  );
}
