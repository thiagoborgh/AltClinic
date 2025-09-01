import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { usePacientes } from '../../hooks/usePacientes';

const CadastroPacienteSimples = ({ open, onClose, pacienteParaEdicao = null }) => {
  const { criarPaciente, atualizarPaciente, loading, error } = usePacientes();
  
  const [formData, setFormData] = useState({
    nome: pacienteParaEdicao?.nome || '',
    email: pacienteParaEdicao?.email || '',
    telefone: pacienteParaEdicao?.telefone || '',
    cpf: pacienteParaEdicao?.cpf || '',
    dataNascimento: pacienteParaEdicao?.dataNascimento ? new Date(pacienteParaEdicao.dataNascimento) : null,
    endereco: {
      logradouro: pacienteParaEdicao?.endereco?.logradouro || '',
      cidade: pacienteParaEdicao?.endereco?.cidade || '',
      estado: pacienteParaEdicao?.endereco?.estado || '',
      cep: pacienteParaEdicao?.endereco?.cep || ''
    },
    estadoCivil: pacienteParaEdicao?.estadoCivil || '',
    profissao: pacienteParaEdicao?.profissao || '',
    convenio: {
      nome: pacienteParaEdicao?.convenio?.nome || '',
      numero: pacienteParaEdicao?.convenio?.numero || ''
    },
    observacoes: pacienteParaEdicao?.observacoes || ''
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Limpar erro de validação
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Campos obrigatórios
    if (!formData.nome.trim()) errors.nome = 'Nome é obrigatório';
    if (!formData.email.trim()) errors.email = 'E-mail é obrigatório';
    if (!formData.telefone.trim()) errors.telefone = 'Telefone é obrigatório';

    // Validações de formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = 'E-mail inválido';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    try {
      let resultado;
      
      if (pacienteParaEdicao) {
        resultado = await atualizarPaciente(pacienteParaEdicao.id, formData);
      } else {
        resultado = await criarPaciente(formData);
      }
      
      if (resultado.success) {
        setSuccessMessage(pacienteParaEdicao ? 'Paciente atualizado com sucesso!' : 'Paciente cadastrado com sucesso!');
        
        // Fechar modal após 1.5 segundos
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setSubmitError(resultado.message || 'Erro ao processar solicitação');
      }
    } catch (err) {
      setSubmitError('Erro inesperado. Tente novamente.');
      console.error('Erro no cadastro:', err);
    }
  };

  const handleClose = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      cpf: '',
      dataNascimento: null,
      endereco: {
        logradouro: '',
        cidade: '',
        estado: '',
        cep: ''
      },
      estadoCivil: '',
      profissao: '',
      convenio: {
        nome: '',
        numero: ''
      },
      observacoes: ''
    });
    setValidationErrors({});
    setSubmitError('');
    setSuccessMessage('');
    onClose();
  };

  const formatTelefone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      if (numbers.length <= 10) {
        return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      } else {
        return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      }
    }
    return value;
  };

  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const formatCEP = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return value;
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {pacienteParaEdicao ? 'Editar Paciente' : 'Cadastrar Novo Paciente'}
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {(submitError || error) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError || error}
          </Alert>
        )}

        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Dados Básicos */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome Completo *"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  error={!!validationErrors.nome}
                  helperText={validationErrors.nome}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="E-mail *"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={!!validationErrors.email}
                  helperText={validationErrors.email}
                  required
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Telefone *"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', formatTelefone(e.target.value))}
                  error={!!validationErrors.telefone}
                  helperText={validationErrors.telefone}
                  placeholder="(11) 99999-9999"
                  required
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="CPF"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <DatePicker
                  label="Data de Nascimento"
                  value={formData.dataNascimento}
                  onChange={(value) => handleInputChange('dataNascimento', value)}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth />
                  )}
                  maxDate={new Date()}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Estado Civil</InputLabel>
                  <Select
                    value={formData.estadoCivil}
                    onChange={(e) => handleInputChange('estadoCivil', e.target.value)}
                    label="Estado Civil"
                  >
                    <MenuItem value="Solteiro(a)">Solteiro(a)</MenuItem>
                    <MenuItem value="Casado(a)">Casado(a)</MenuItem>
                    <MenuItem value="Divorciado(a)">Divorciado(a)</MenuItem>
                    <MenuItem value="Viúvo(a)">Viúvo(a)</MenuItem>
                    <MenuItem value="União Estável">União Estável</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Profissão"
                  value={formData.profissao}
                  onChange={(e) => handleInputChange('profissao', e.target.value)}
                />
              </Grid>

              {/* Endereço */}
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Endereço"
                  value={formData.endereco.logradouro}
                  onChange={(e) => handleInputChange('endereco.logradouro', e.target.value)}
                  placeholder="Rua, Avenida, etc."
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="CEP"
                  value={formData.endereco.cep}
                  onChange={(e) => handleInputChange('endereco.cep', formatCEP(e.target.value))}
                  placeholder="00000-000"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cidade"
                  value={formData.endereco.cidade}
                  onChange={(e) => handleInputChange('endereco.cidade', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={formData.endereco.estado}
                    onChange={(e) => handleInputChange('endereco.estado', e.target.value)}
                    label="Estado"
                  >
                    <MenuItem value="SP">São Paulo</MenuItem>
                    <MenuItem value="RJ">Rio de Janeiro</MenuItem>
                    <MenuItem value="MG">Minas Gerais</MenuItem>
                    <MenuItem value="RS">Rio Grande do Sul</MenuItem>
                    <MenuItem value="PR">Paraná</MenuItem>
                    <MenuItem value="SC">Santa Catarina</MenuItem>
                    {/* Adicione mais estados conforme necessário */}
                  </Select>
                </FormControl>
              </Grid>

              {/* Convênio */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Convênio"
                  value={formData.convenio.nome}
                  onChange={(e) => handleInputChange('convenio.nome', e.target.value)}
                  placeholder="Ex: Unimed, SulAmérica, etc."
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Número da Carteirinha"
                  value={formData.convenio.numero}
                  onChange={(e) => handleInputChange('convenio.numero', e.target.value)}
                />
              </Grid>

              {/* Observações */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observações"
                  multiline
                  rows={3}
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Informações adicionais sobre o paciente..."
                />
              </Grid>
            </Grid>
          </Box>
        </LocalizationProvider>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Salvando...' : (pacienteParaEdicao ? 'Atualizar' : 'Cadastrar')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CadastroPacienteSimples;
