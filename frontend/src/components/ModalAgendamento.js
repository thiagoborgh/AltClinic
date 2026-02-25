import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Autocomplete,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import 'moment/locale/pt-br';
import api from '../services/api';

moment.locale('pt-br');

const ModalAgendamento = ({ 
  open, 
  onClose, 
  slotData = null,
  onSave,
  profissionais = [],
  procedimentos = [],
  convenios = [],
  salas = []
}) => {
  // Estados do formulário
  const [formData, setFormData] = useState({
    paciente: '',
    pacienteNovo: false,
    cpf: '',
    telefone: '',
    email: '',
    horario: null,
    duracao: 30,
    procedimento: '',
    profissional: '',
    sala: '',
    convenio: 'particular',
    valor: '',
    observacoes: '',
    status: 'não confirmado'
  });

  const [pacienteOptions, setPacienteOptions] = useState([]);
  const [pacienteLoading, setPacienteLoading] = useState(false);
  const [pacienteInput, setPacienteInput] = useState('');
  const debounceRef = useRef(null);
  const [errors, setErrors] = useState({});

  // Opções de duração em minutos
  const duracaoOptions = [
    { value: 15, label: '15 minutos' },
    { value: 30, label: '30 minutos' },
    { value: 45, label: '45 minutos' },
    { value: 60, label: '1 hora' },
    { value: 90, label: '1h 30min' },
    { value: 120, label: '2 horas' }
  ];

  // Opções de status
  const statusOptions = [
    { value: 'não confirmado', label: 'Não confirmado', color: 'warning' },
    { value: 'confirmado', label: 'Confirmado', color: 'success' },
    { value: 'cancelado', label: 'Cancelado', color: 'error' },
    { value: 'em atendimento', label: 'Em atendimento', color: 'info' },
    { value: 'finalizado', label: 'Finalizado', color: 'default' }
  ];

  // Busca debounced de pacientes na API
  const handlePacienteInputChange = (value) => {
    setPacienteInput(value);
    setFormData(prev => ({ ...prev, paciente: value }));

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value || value.length < 2) {
      setPacienteOptions([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      setPacienteLoading(true);
      api.get(`/pacientes/buscar?q=${encodeURIComponent(value)}`)
        .then(res => {
          setPacienteOptions(res.data?.pacientes || []);
        })
        .catch(err => console.error('Erro na busca de pacientes:', err))
        .finally(() => setPacienteLoading(false));
    }, 300);
  };

  // Inicializar dados quando o slot é selecionado
  useEffect(() => {
    if (slotData && open) {
      console.log('🎯 ModalAgendamento - slotData recebido:', slotData);
      
      // Se é edição e tem agendamento, preencher com dados existentes
      if (slotData.isEdit && slotData.agendamento) {
        const agendamento = slotData.agendamento;
        console.log('📝 EDIÇÃO: Preenchendo modal com dados do agendamento:', agendamento);
        
        // Buscar procedimento ID pelo nome
        const procedimentoEncontrado = procedimentos.find(p => p.nome === agendamento.procedimento);
        
        // Buscar convênio ID pelo nome
        const convenioEncontrado = convenios.find(c => c.nome === agendamento.convenio);
        
        // Buscar sala ID pelo nome
        const salaEncontrada = salas.find(s => s.nome === agendamento.sala);
        
        // Buscar profissional por nome OU por ID (DB pode guardar ID ou nome)
        const profissionalEncontrado = profissionais.find(
          p => p.nome === agendamento.profissional || String(p.id) === String(agendamento.profissional)
        );
        
        setFormData(prev => ({
          ...prev,
          paciente: agendamento.paciente || '',
          pacienteNovo: false, // Não é novo se está editando
          cpf: agendamento.cpf || '',
          telefone: agendamento.telefone || '',
          email: agendamento.email || '',
          horario: moment(slotData.horario, 'HH:mm'),
          duracao: agendamento.duracao || 30,
          procedimento: procedimentoEncontrado ? procedimentoEncontrado.id : (agendamento.procedimento || ''),
          profissional: profissionalEncontrado ? profissionalEncontrado.id : (agendamento.profissional || slotData.professionalId || ''),
          sala: salaEncontrada ? salaEncontrada.id : '',
          convenio: convenioEncontrado ? convenioEncontrado.id : (agendamento.convenio || 'particular'),
          status: agendamento.status || 'não confirmado',
          valor: agendamento.valor ? agendamento.valor.toString() : '',
          observacoes: agendamento.observacoes || ''
        }));
        
        console.log('✅ EDIÇÃO: Formulário preenchido com sucesso');
        setPacienteInput(agendamento.paciente || '');
      } else {
        // Novo agendamento
        setFormData(prev => ({
          ...prev,
          horario: slotData.horario ? moment(slotData.horario, 'HH:mm') : null,
          profissional: slotData.professionalId || ''
        }));
      }
    }
  }, [slotData, open, procedimentos, convenios, salas, profissionais]);

  // Reset form quando fecha
  useEffect(() => {
    if (!open) {
      setFormData({
        paciente: '',
        pacienteNovo: false,
        cpf: '',
        telefone: '',
        email: '',
        horario: null,
        duracao: 30,
        procedimento: '',
        profissional: '',
        sala: '',
        convenio: 'particular',
        valor: '',
        observacoes: '',
        status: 'não confirmado'
      });
      setErrors({});
      setPacienteOptions([]);
      setPacienteInput('');
      if (debounceRef.current) clearTimeout(debounceRef.current);
    }
  }, [open]);

  // Busca é server-side; desabilitar filtragem client-side do MUI
  const pacienteFilterOptions = (options) => options;

  // Verificar duplicação de CPF consultando a API
  const checkCpfDuplication = (cpf) => {
    if (!cpf || cpf.length < 14) return;
    api.get(`/pacientes/buscar?q=${encodeURIComponent(cpf)}`)
      .then(res => {
        const cpfNum = cpf.replace(/\D/g, '');
        const exists = (res.data?.pacientes || []).some(
          p => (p.cpf || '').replace(/\D/g, '') === cpfNum
        );
        if (exists) {
          setErrors(prev => ({ ...prev, cpf: 'CPF já cadastrado no sistema' }));
        } else {
          setErrors(prev => { const e = { ...prev }; delete e.cpf; return e; });
        }
      })
      .catch(() => {});
  };

  // Verificar CPF quando alterar
  useEffect(() => {
    if (formData.pacienteNovo && formData.cpf && formData.cpf.length === 14) {
      checkCpfDuplication(formData.cpf);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.cpf, formData.pacienteNovo]);

  // Validação do formulário
  const validateForm = () => {
    const newErrors = {};

    if (!formData.paciente && !formData.pacienteNovo) {
      newErrors.paciente = 'Paciente é obrigatório';
    }

    // Validações para paciente novo
    if (formData.pacienteNovo) {
      if (!formData.paciente.trim()) {
        newErrors.paciente = 'Nome do paciente é obrigatório';
      }
      
      if (!formData.cpf || formData.cpf.length < 14) {
        newErrors.cpf = 'CPF é obrigatório e deve estar completo';
      }
      
      if (!formData.telefone || formData.telefone.length < 14) {
        newErrors.telefone = 'Telefone é obrigatório';
      }
      
      // Validação básica de email se fornecido
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email deve ter formato válido';
      }
    }

    if (!formData.horario || !formData.horario.isValid()) {
      newErrors.horario = 'Horário é obrigatório';
    }

    if (!formData.procedimento) {
      newErrors.procedimento = 'Procedimento é obrigatório';
    }

    if (!formData.profissional) {
      newErrors.profissional = 'Profissional é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Salvar agendamento
  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const agendamentoData = {
      ...formData,
      horario: formData.horario ? formData.horario.format('HH:mm') : null,
      data: slotData?.dia || moment().format('YYYY-MM-DD'),
      isEdit: slotData?.isEdit || false,
      agendamentoId: slotData?.agendamento?.id
    };

    console.log('💾 ModalAgendamento: Salvando agendamento:', agendamentoData);
    
    if (onSave) {
      console.log('🔄 ModalAgendamento: Chamando onSave...');
      onSave(agendamentoData);
      console.log('✅ ModalAgendamento: onSave chamado com sucesso');
    }
    
    // Remover o onClose() daqui - deixar o pai controlar o fechamento
    console.log('🔄 ModalAgendamento: onSave finalizado, aguardando fechamento pelo pai');
  };

  // Calcular valor sugerido baseado no procedimento
  useEffect(() => {
    const procedimentoSelecionado = procedimentos.find(p => p.id === formData.procedimento);
    if (procedimentoSelecionado && procedimentoSelecionado.valor) {
      setFormData(prev => ({
        ...prev,
        valor: procedimentoSelecionado.valor.toFixed(2)
      }));
    }
  }, [formData.procedimento, procedimentos]);

  return (
    <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="pt-br">
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 2,
            minHeight: '600px'
          }
        }}
      >
        {/* Header */}
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          pb: 2
        }}>
          <Typography variant="h5" fontWeight="bold">
            {slotData?.isEdit ? '✏️ Editar Agendamento' : '📅 Novo Agendamento'}
          </Typography>
          <IconButton onClick={onClose} size="large">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Content */}
        <DialogContent sx={{ pt: 3 }}>
          {slotData?.isEncaixe && !slotData?.isEdit && (
            <Box sx={{ mb: 2 }}>
              <Chip
                label="Encaixe — horário fora da grade configurada"
                color="warning"
                variant="outlined"
                size="small"
              />
            </Box>
          )}
          <Grid container spacing={4}>
            {/* Coluna Esquerda - Informações do Paciente */}
            <Grid item xs={12} md={6}>
              <Box sx={{ pr: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Informações do Paciente
                </Typography>

                {/* Campo Paciente */}
                <Autocomplete
                  freeSolo
                  options={pacienteOptions}
                  filterOptions={pacienteFilterOptions}
                  inputValue={pacienteInput}
                  getOptionLabel={(option) =>
                    typeof option === 'string' ? option : option.nome || ''
                  }
                  loading={pacienteLoading}
                  noOptionsText={pacienteInput.length < 2 ? 'Digite ao menos 2 caracteres' : 'Nenhum paciente encontrado'}
                  onInputChange={(event, value) => {
                    handlePacienteInputChange(value);
                  }}
                  onChange={(event, value) => {
                    if (value && typeof value === 'object') {
                      setPacienteInput(value.nome || '');
                      setFormData(prev => ({
                        ...prev,
                        paciente: value.nome || '',
                        cpf: value.cpf || prev.cpf,
                        telefone: value.telefone || prev.telefone,
                        email: value.email || prev.email,
                      }));
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Paciente *"
                      placeholder="Digite o nome do paciente ou CPF"
                      fullWidth
                      error={!!errors.paciente}
                      helperText={errors.paciente}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ mb: 3 }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.id || option.cpf || option.nome}>
                      <Box>
                        <Typography variant="body1">{option.nome}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {[option.cpf, option.telefone].filter(Boolean).join(' • ')}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />

                {/* Checkbox Paciente Novo */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.pacienteNovo}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        pacienteNovo: e.target.checked 
                      }))}
                      color="primary"
                    />
                  }
                  label="Paciente novo"
                  sx={{ mb: 2 }}
                />

                {formData.pacienteNovo && (
                  <Box sx={{ 
                    p: 3, 
                    border: 1, 
                    borderColor: 'primary.main', 
                    borderRadius: 2,
                    bgcolor: 'primary.50',
                    mb: 2
                  }}>
                    <Typography variant="h6" color="primary.main" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      � Dados do Novo Paciente
                    </Typography>
                    
                    <Grid container spacing={2}>
                      {/* CPF */}
                      <Grid item xs={12}>
                        <TextField
                          label="CPF *"
                          fullWidth
                          value={formData.cpf || ''}
                          onChange={(e) => {
                            const cpf = e.target.value.replace(/\D/g, '').slice(0, 11);
                            const cpfFormatted = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                            setFormData(prev => ({ ...prev, cpf: cpfFormatted }));
                          }}
                          placeholder="000.000.000-00"
                          error={!!errors.cpf}
                          helperText={errors.cpf || "Documento de validação para evitar duplicação"}
                          inputProps={{ maxLength: 14 }}
                        />
                      </Grid>

                      {/* Telefone */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Telefone *"
                          fullWidth
                          value={formData.telefone || ''}
                          onChange={(e) => {
                            const telefone = e.target.value.replace(/\D/g, '').slice(0, 11);
                            let telefoneFormatted = telefone;
                            if (telefone.length === 11) {
                              telefoneFormatted = telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                            } else if (telefone.length === 10) {
                              telefoneFormatted = telefone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
                            }
                            setFormData(prev => ({ ...prev, telefone: telefoneFormatted }));
                          }}
                          placeholder="(11) 99999-9999"
                          error={!!errors.telefone}
                          helperText={errors.telefone}
                          inputProps={{ maxLength: 15 }}
                        />
                      </Grid>

                      {/* Email */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Email"
                          fullWidth
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="paciente@email.com"
                          error={!!errors.email}
                          helperText={errors.email || "Campo opcional"}
                        />
                      </Grid>
                    </Grid>

                    <Typography variant="body2" color="primary.main" sx={{ mt: 2 }}>
                      💡 Estes dados serão validados para evitar cadastros duplicados.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Coluna Direita - Detalhes do Agendamento */}
            <Grid item xs={12} md={6}>
              <Box sx={{ pl: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <AccessTimeIcon sx={{ mr: 1, color: 'secondary.main' }} />
                  Detalhes do Agendamento
                </Typography>

                <Grid container spacing={2}>
                  {/* Horário */}
                  <Grid item xs={6}>
                    <TimePicker
                      label="Horário *"
                      value={formData.horario}
                      onChange={(newValue) => setFormData(prev => ({ ...prev, horario: newValue }))}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.horario,
                          helperText: errors.horario
                        }
                      }}
                      ampm={false}
                      minutesStep={15}
                    />
                  </Grid>

                  {/* Duração */}
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Duração</InputLabel>
                      <Select
                        value={formData.duracao}
                        label="Duração"
                        onChange={(e) => setFormData(prev => ({ ...prev, duracao: e.target.value }))}
                      >
                        {duracaoOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Procedimento */}
                  <Grid item xs={12}>
                    {procedimentos.length > 0 ? (
                      <FormControl fullWidth error={!!errors.procedimento}>
                        <InputLabel>Procedimento *</InputLabel>
                        <Select
                          value={formData.procedimento}
                          label="Procedimento *"
                          onChange={(e) => setFormData(prev => ({ ...prev, procedimento: e.target.value }))}
                        >
                          {procedimentos.map((proc) => (
                            <MenuItem key={proc.id} value={proc.id}>
                              {proc.nome} {proc.valor && `- R$ ${proc.valor.toFixed(2)}`}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.procedimento && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                            {errors.procedimento}
                          </Typography>
                        )}
                      </FormControl>
                    ) : (
                      <TextField
                        label="Procedimento *"
                        fullWidth
                        value={formData.procedimento}
                        onChange={(e) => setFormData(prev => ({ ...prev, procedimento: e.target.value }))}
                        placeholder="Ex: Consulta, Limpeza de pele, Botox..."
                        error={!!errors.procedimento}
                        helperText={errors.procedimento}
                      />
                    )}
                  </Grid>

                  {/* Profissional */}
                  <Grid item xs={12}>
                    <FormControl fullWidth error={!!errors.profissional}>
                      <InputLabel>Profissional *</InputLabel>
                      <Select
                        value={formData.profissional}
                        label="Profissional *"
                        onChange={(e) => setFormData(prev => ({ ...prev, profissional: e.target.value }))}
                      >
                        {profissionais.map((prof) => (
                          <MenuItem key={prof.id} value={prof.id}>
                            {prof.nome} - {prof.especialidade}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.profissional && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                          {errors.profissional}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Sala */}
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Sala</InputLabel>
                      <Select
                        value={formData.sala}
                        label="Sala"
                        onChange={(e) => setFormData(prev => ({ ...prev, sala: e.target.value }))}
                      >
                        {salas.map((sala) => (
                          <MenuItem key={sala.id} value={sala.id}>
                            {sala.nome}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Convênio */}
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Convênio</InputLabel>
                      <Select
                        value={formData.convenio}
                        label="Convênio"
                        onChange={(e) => setFormData(prev => ({ ...prev, convenio: e.target.value }))}
                      >
                        <MenuItem value="particular">Particular</MenuItem>
                        {convenios.map((conv) => (
                          <MenuItem key={conv.id} value={conv.id}>
                            {conv.nome}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Valor */}
                  <Grid item xs={6}>
                    <TextField
                      label="Valor"
                      fullWidth
                      value={formData.valor}
                      onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                      }}
                      placeholder="0,00"
                    />
                  </Grid>

                  {/* Status */}
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={formData.status}
                        label="Status"
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      >
                        {statusOptions.map((status) => (
                          <MenuItem key={status.value} value={status.value}>
                            {status.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Observações */}
                  <Grid item xs={12}>
                    <TextField
                      label="Observações"
                      fullWidth
                      multiline
                      rows={3}
                      value={formData.observacoes}
                      onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                      placeholder="Digite aqui observações sobre o agendamento..."
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        {/* Rodapé */}
        <DialogActions sx={{ 
          px: 3, 
          pb: 3, 
          borderTop: 1, 
          borderColor: 'divider',
          gap: 2 
        }}>
          <Button
            onClick={onClose}
            variant="outlined"
            size="large"
            sx={{ minWidth: 120 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            size="large"
            sx={{ minWidth: 120 }}
          >
            {slotData?.isEdit ? '✏️ Atualizar' : '💾 Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ModalAgendamento;