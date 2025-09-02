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
  const [anamnese, setAnamnese] = useState(prontuario?.anamnese || {
    dadosPessoais: {},
    historico: {},
    alergias: [],
    medicamentos: [],
    habitosVida: {},
    observacoes: ''
  });
  
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [sugestoesIA, setSugestoesIA] = useState([]);

  const handleInputChange = (categoria, campo, valor) => {
    setAnamnese(prev => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        [campo]: valor
      }
    }));
  };

  const handleArrayAdd = (campo, item) => {
    if (item.trim()) {
      setAnamnese(prev => ({
        ...prev,
        [campo]: [...(prev[campo] || []), item.trim()]
      }));
    }
  };

  const handleArrayRemove = (campo, index) => {
    setAnamnese(prev => ({
      ...prev,
      [campo]: prev[campo].filter((_, i) => i !== index)
    }));
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
    onAtualizarAnamnese(anamnese);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Header com ações */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
            <Typography variant="h5">Anamnese</Typography>
            <Box>
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
                    value={anamnese.dadosPessoais?.estadoCivil || ''}
                    onChange={(e) => handleInputChange('dadosPessoais', 'estadoCivil', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Profissão"
                    value={anamnese.dadosPessoais?.profissao || ''}
                    onChange={(e) => handleInputChange('dadosPessoais', 'profissao', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Motivo da Consulta"
                    value={anamnese.dadosPessoais?.motivoConsulta || ''}
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
                              checked={anamnese.historico?.doencas?.includes(doenca) || false}
                              onChange={(e) => {
                                const doencas = anamnese.historico?.doencas || [];
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
                      value={anamnese.historico?.cirurgias || 'nao'}
                      onChange={(e) => handleInputChange('historico', 'cirurgias', e.target.value)}
                    >
                      <FormControlLabel value="nao" control={<Radio />} label="Não" />
                      <FormControlLabel value="sim" control={<Radio />} label="Sim" />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                {anamnese.historico?.cirurgias === 'sim' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Descreva as cirurgias realizadas"
                      value={anamnese.historico?.descricaoCirurgias || ''}
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
                {anamnese.alergias?.length > 0 && (
                  <Chip 
                    size="small" 
                    label={anamnese.alergias.length} 
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
                  {anamnese.alergias?.map((alergia, index) => (
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
                {anamnese.medicamentos?.length > 0 && (
                  <Chip 
                    size="small" 
                    label={anamnese.medicamentos.length} 
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
                  {anamnese.medicamentos?.map((medicamento, index) => (
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
                      value={anamnese.habitosVida?.tabagismo || ''}
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
                      value={anamnese.habitosVida?.alcool || ''}
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
                      value={anamnese.habitosVida?.atividadeFisica || ''}
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
              value={anamnese.observacoes || ''}
              onChange={(e) => setAnamnese(prev => ({ ...prev, observacoes: e.target.value }))}
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
