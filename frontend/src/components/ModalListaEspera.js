import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Box,
  Autocomplete,
  Chip,
  Alert,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import {
  Close,
  HourglassEmpty,
  Person as PersonIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { IMaskInput } from 'react-imask';
import axios from 'axios';

// ============================================
// MÁSCARAS DE INPUT (igual ao ModalAgendamento)
// ============================================
const TextMaskCPF = React.forwardRef(function TextMaskCPF(props, ref) {
  const { onChange, ...other } = props;
  return (
    <IMaskInput
      {...other}
      mask="000.000.000-00"
      definitions={{
        '#': /[0-9]/,
      }}
      inputRef={ref}
      onAccept={(value) => onChange({ target: { name: props.name, value } })}
      overwrite
    />
  );
});

const TextMaskPhone = React.forwardRef(function TextMaskPhone(props, ref) {
  const { onChange, ...other } = props;
  return (
    <IMaskInput
      {...other}
      mask="(00) 00000-0000"
      definitions={{
        '#': /[0-9]/,
      }}
      inputRef={ref}
      onAccept={(value) => onChange({ target: { name: props.name, value } })}
      overwrite
    />
  );
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const ModalListaEspera = ({ open, onClose, professionalId }) => {
  // ============================================
  // ESTADOS (Estrutura igual ao ModalAgendamento)
  // ============================================
  const [formData, setFormData] = useState({
    // Dados do paciente - IGUAL ao ModalAgendamento
    paciente: '',
    pacienteNovo: false,
    pacienteExistente: null,
    cpf: '',
    telefone: '',
    email: '',
    
    // Específico da Lista de Espera
    profissionalId: professionalId || '',
    procedimento: '',
    convenio: 'particular',
    periodo: [],              // ['manha', 'tarde', 'noite']
    diasSemana: [],          // ['segunda', 'terca', etc]
    observacoes: ''
  });

  const [pacienteOptions, setPacienteOptions] = useState([]);
  const [pacienteLoading, setPacienteLoading] = useState(false);
  const [procedimentoOptions, setProcedimentoOptions] = useState([]);
  const [procedimentoLoading, setProcedimentoLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ============================================
  // FUNÇÕES DE BUSCA (Copiadas do ModalAgendamento)
  // ============================================
  const handlePacienteSearch = async (inputValue) => {
    if (inputValue.length < 2) {
      setPacienteOptions([]);
      return;
    }

    setPacienteLoading(true);
    try {
      const { mockPacientes } = await import('../data/mockAgendamento');
      const filtered = mockPacientes.filter(p => 
        p.nome.toLowerCase().includes(inputValue.toLowerCase()) ||
        (p.cpf && p.cpf.includes(inputValue))
      );
      setPacienteOptions(filtered);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      setPacienteOptions([]);
    } finally {
      setPacienteLoading(false);
    }
  };

  // Buscar procedimentos cadastrados
  const loadProcedimentos = useCallback(async () => {
    setProcedimentoLoading(true);
    try {
      const response = await axios.get('/api/models/procedimentos');
      if (response.data.success) {
        setProcedimentoOptions(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar procedimentos:', error);
      toast.error('Erro ao carregar procedimentos');
      setProcedimentoOptions([]);
    } finally {
      setProcedimentoLoading(false);
    }
  }, []);

  // Carregar procedimentos ao abrir o modal
  useEffect(() => {
    if (open) {
      loadProcedimentos();
    }
  }, [open, loadProcedimentos]);

  // ============================================
  // VALIDAÇÃO (Similar ao ModalAgendamento)
  // ============================================
  const validateForm = () => {
    const newErrors = {};

    // Validar paciente
    if (!formData.paciente && !formData.pacienteNovo) {
      newErrors.paciente = 'Selecione um paciente ou marque "Novo Paciente"';
    }

    // Se for novo paciente ou não existente, validar campos obrigatórios
    if (formData.pacienteNovo || !formData.pacienteExistente) {
      if (!formData.paciente || !formData.paciente.trim()) {
        newErrors.paciente = 'Nome é obrigatório';
      }
      
      if (!formData.telefone || formData.telefone.length < 14) {
        newErrors.telefone = 'Telefone é obrigatório';
      }
      
      // CPF obrigatório para novos cadastros
      if (formData.pacienteNovo && (!formData.cpf || formData.cpf.length < 14)) {
        newErrors.cpf = 'CPF é obrigatório para novo cadastro';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // FUNÇÃO SALVAR (Adaptada para Lista de Espera)
  // ============================================
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const listaEsperaData = {
        // Dados do paciente
        pacienteId: formData.pacienteExistente?.id || null,
        nome: formData.paciente,
        telefone: formData.telefone.replace(/\D/g, ''),
        cpf: formData.cpf.replace(/\D/g, ''),
        email: formData.email,
        criarPaciente: formData.pacienteNovo,
        
        // Preferências
        profissionalId: formData.profissionalId,
        procedimento: formData.procedimento,
        convenio: formData.convenio,
        periodo: formData.periodo,
        diasSemana: formData.diasSemana,
        observacoes: formData.observacoes,
        
        // Status
        status: 'aguardando',
        dataInclusao: new Date().toISOString()
      };

      // TODO: Implementar chamada real da API quando backend estiver pronto
      // await axios.post('/api/lista-espera', listaEsperaData);
      
      console.log('📋 Salvando na lista de espera:', listaEsperaData);
      
      // Simulação de sucesso (remover quando API estiver pronta)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Paciente adicionado à lista de espera!');
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error(error.response?.data?.message || 'Erro ao adicionar na lista de espera');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FUNÇÃO FECHAR
  // ============================================
  const handleClose = () => {
    if (!loading) {
      setFormData({
        paciente: '',
        pacienteNovo: false,
        pacienteExistente: null,
        cpf: '',
        telefone: '',
        email: '',
        profissionalId: professionalId || '',
        procedimento: '',
        convenio: 'particular',
        periodo: [],
        diasSemana: [],
        observacoes: ''
      });
      setErrors({});
      setPacienteOptions([]);
      onClose();
    }
  };

  // ============================================
  // RENDER - UI DO MODAL
  // ============================================
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HourglassEmpty color="primary" />
            <Typography variant="h6">Lista de Espera</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" disabled={loading}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* ========================================== */}
          {/* SEÇÃO 1: BUSCAR/CADASTRAR PACIENTE */}
          {/* ========================================== */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
              <PersonIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              Paciente *
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              freeSolo
              options={pacienteOptions}
              loading={pacienteLoading}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return `${option.nome}${option.cpf ? ` - ${option.cpf}` : ''}`;
              }}
              value={formData.paciente}
              onInputChange={(event, newInputValue) => {
                handlePacienteSearch(newInputValue);
              }}
              onChange={(event, newValue) => {
                if (typeof newValue === 'object' && newValue !== null) {
                  // Paciente selecionado da lista
                  setFormData(prev => ({
                    ...prev,
                    paciente: newValue.nome,
                    pacienteExistente: newValue,
                    cpf: newValue.cpf || '',
                    telefone: newValue.telefone || '',
                    email: newValue.email || '',
                    pacienteNovo: false
                  }));
                  setErrors(prev => ({ ...prev, paciente: '' }));
                } else {
                  // Texto digitado manualmente
                  setFormData(prev => ({
                    ...prev,
                    paciente: newValue || '',
                    pacienteExistente: null
                  }));
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar Paciente"
                  placeholder="Digite o nome ou CPF..."
                  error={!!errors.paciente}
                  helperText={errors.paciente || 'Digite pelo menos 2 caracteres para buscar'}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {pacienteLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body2">{option.nome}</Typography>
                    {option.cpf && (
                      <Typography variant="caption" color="text.secondary">
                        CPF: {option.cpf}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.pacienteNovo}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      pacienteNovo: e.target.checked,
                      pacienteExistente: null
                    }));
                  }}
                  disabled={!!formData.pacienteExistente}
                />
              }
              label="Cadastrar como novo paciente"
            />
          </Grid>

          {/* ========================================== */}
          {/* SEÇÃO 2: DADOS DO PACIENTE (Condicional) */}
          {/* ========================================== */}
          {(formData.pacienteNovo || !formData.pacienteExistente) && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  label={`CPF ${formData.pacienteNovo ? '*' : ''}`}
                  fullWidth
                  size="small"
                  value={formData.cpf}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, cpf: e.target.value }));
                    setErrors(prev => ({ ...prev, cpf: '' }));
                  }}
                  error={!!errors.cpf}
                  helperText={errors.cpf}
                  disabled={!!formData.pacienteExistente && !formData.pacienteNovo}
                  InputProps={{
                    inputComponent: TextMaskCPF
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Telefone *"
                  fullWidth
                  size="small"
                  value={formData.telefone}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, telefone: e.target.value }));
                    setErrors(prev => ({ ...prev, telefone: '' }));
                  }}
                  error={!!errors.telefone}
                  helperText={errors.telefone}
                  disabled={!!formData.pacienteExistente && !formData.pacienteNovo}
                  InputProps={{
                    inputComponent: TextMaskPhone
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  fullWidth
                  size="small"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!!formData.pacienteExistente && !formData.pacienteNovo}
                />
              </Grid>
            </>
          )}

          {/* ========================================== */}
          {/* SEÇÃO 3: PREFERÊNCIAS (OPCIONAL) */}
          {/* ========================================== */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
              Preferências (Opcional)
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              options={procedimentoOptions}
              loading={procedimentoLoading}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return option.nome || '';
              }}
              value={formData.procedimento ? 
                procedimentoOptions.find(p => p.nome === formData.procedimento || p.id === formData.procedimento) || null 
                : null
              }
              onChange={(event, newValue) => {
                if (newValue) {
                  setFormData(prev => ({
                    ...prev,
                    procedimento: typeof newValue === 'string' ? newValue : newValue.nome
                  }));
                } else {
                  setFormData(prev => ({ ...prev, procedimento: '' }));
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Procedimento"
                  placeholder="Selecione o procedimento..."
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {procedimentoLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body2">{option.nome}</Typography>
                    {option.duracao_minutos && (
                      <Typography variant="caption" color="text.secondary">
                        Duração: {option.duracao_minutos} min
                        {option.preco && ` • R$ ${parseFloat(option.preco).toFixed(2)}`}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Convênio</InputLabel>
              <Select
                value={formData.convenio}
                onChange={(e) => setFormData(prev => ({ ...prev, convenio: e.target.value }))}
                label="Convênio"
              >
                <MenuItem value="particular">Particular</MenuItem>
                <MenuItem value="unimed">Unimed</MenuItem>
                <MenuItem value="amil">Amil</MenuItem>
                <MenuItem value="sulamerica">SulAmérica</MenuItem>
                <MenuItem value="bradesco">Bradesco Saúde</MenuItem>
                <MenuItem value="outro">Outro</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Período Preferido</InputLabel>
              <Select
                multiple
                value={formData.periodo}
                onChange={(e) => setFormData(prev => ({ ...prev, periodo: e.target.value }))}
                label="Período Preferido"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip 
                        key={value} 
                        label={value === 'manha' ? 'Manhã' : value === 'tarde' ? 'Tarde' : 'Noite'} 
                        size="small" 
                      />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="manha">Manhã</MenuItem>
                <MenuItem value="tarde">Tarde</MenuItem>
                <MenuItem value="noite">Noite</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Dias da Semana</InputLabel>
              <Select
                multiple
                value={formData.diasSemana}
                onChange={(e) => setFormData(prev => ({ ...prev, diasSemana: e.target.value }))}
                label="Dias da Semana"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="Segunda">Segunda</MenuItem>
                <MenuItem value="Terça">Terça</MenuItem>
                <MenuItem value="Quarta">Quarta</MenuItem>
                <MenuItem value="Quinta">Quinta</MenuItem>
                <MenuItem value="Sexta">Sexta</MenuItem>
                <MenuItem value="Sábado">Sábado</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Observações"
              fullWidth
              size="small"
              multiline
              rows={3}
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Informações adicionais sobre as preferências do paciente..."
            />
          </Grid>

          {/* ========================================== */}
          {/* INFORMATIVO */}
          {/* ========================================== */}
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="body2">
                O paciente será notificado quando houver disponibilidade conforme suas preferências.
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <HourglassEmpty />}
        >
          {loading ? 'Salvando...' : 'Adicionar à Lista'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalListaEspera;
