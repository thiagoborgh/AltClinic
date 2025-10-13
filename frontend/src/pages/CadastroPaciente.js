import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  CircularProgress,
  Alert,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  Person,
  Search,
  Save,
  PersonAdd,
  Phone,
  Email,
  Badge,
  LocalHospital,
  Edit
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import dayjs from 'dayjs';

const CadastroPaciente = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    dataNascimento: null,
    telefone: '',
    email: '',
    medicoResponsavel: '',
    optinMensagens: false
  });
  
  // Estados de controle
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pacienteId, setPacienteId] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [pacienteExistente, setPacienteExistente] = useState(null);
  const [medicos, setMedicos] = useState([]);
  const [errors, setErrors] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [confirmacaoEnviada, setConfirmacaoEnviada] = useState(false);

  // Carregar médicos ao montar o componente
  useEffect(() => {
    loadMedicos();
  }, []);

  // Carregar dados do paciente se estiver editando
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setPacienteId(id);
      setIsEditing(true);
      loadPaciente(id);
    }
  }, [searchParams]);

  const loadPaciente = async (id) => {
    setLoading(true);
    try {
      const response = await api.get(`/pacientes/${id}`);
      if (response.data.success && response.data.paciente) {
        const paciente = response.data.paciente;
        setFormData({
          nome: paciente.nomeCompleto || '',
          cpf: paciente.cpf || '',
          dataNascimento: paciente.dataNascimento ? dayjs(paciente.dataNascimento) : null,
          telefone: paciente.telefone || '',
          email: paciente.email || '',
          medicoResponsavel: paciente.medicoResponsavel || '',
          optinMensagens: paciente.optinMensagens || false
        });
      }
    } catch (error) {
      console.error('Erro ao carregar paciente:', error);
      toast.error('Erro ao carregar dados do paciente');
    } finally {
      setLoading(false);
    }
  };

  const loadMedicos = async () => {
    try {
      const response = await api.get('/medicos');
      if (response.data.success) {
        setMedicos(response.data.medicos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
      // Mock data para desenvolvimento
      setMedicos([
        { id: 1, nome: 'Dr. João Silva', especialidade: 'Cardiologia', crm: '12345' },
        { id: 2, nome: 'Dra. Maria Santos', especialidade: 'Dermatologia', crm: '67890' },
        { id: 3, nome: 'Dr. Carlos Lima', especialidade: 'Ortopedia', crm: '54321' }
      ]);
    }
  };

  // Buscar pacientes existentes
  const searchPacientes = async (query) => {
    if (!query || query.length < 3) return [];
    
    setSearchLoading(true);
    try {
      const response = await api.get(`/pacientes/search?q=${encodeURIComponent(query)}`);
      if (response.data.success) {
        return response.data.pacientes || [];
      }
      return [];
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      return [];
    } finally {
      setSearchLoading(false);
    }
  };

  // Verificar duplicatas por CPF/telefone
  const checkDuplicates = async (cpf, telefone) => {
    try {
      const response = await api.get(`/pacientes/check-duplicates?cpf=${cpf}&telefone=${telefone}`);
      if (response.data.duplicateFound) {
        setDuplicateWarning({
          type: 'warning',
          message: `${response.data.message}. Paciente: ${response.data.existingPatient.nome}`,
          existingPatient: response.data.existingPatient
        });
        return true;
      }
      setDuplicateWarning(null);
      return false;
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
      return false;
    }
  };

  // Handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }

    // Verificar duplicatas para CPF e telefone
    if (field === 'cpf' && value.length === 11) {
      checkDuplicates(value, formData.telefone);
    } else if (field === 'telefone' && value.length >= 10) {
      checkDuplicates(formData.cpf, value);
    }
  };

  const handlePacienteSelect = (paciente) => {
    if (paciente) {
      setPacienteExistente(paciente);
      setFormData({
        nome: paciente.nome,
        cpf: paciente.cpf,
        dataNascimento: paciente.dataNascimento ? dayjs(paciente.dataNascimento) : null,
        telefone: paciente.telefone,
        email: paciente.email || '',
        medicoResponsavel: paciente.medicoResponsavel || '',
        optinMensagens: paciente.optinMensagens || false
      });
      setDuplicateWarning({
        type: 'info',
        message: `Paciente encontrado! Você pode editar os dados abaixo.`,
        existingPatient: paciente
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.cpf || formData.cpf.length !== 11) {
      newErrors.cpf = 'CPF válido é obrigatório';
    }

    if (!formData.telefone || formData.telefone.length < 10) {
      newErrors.telefone = 'Telefone válido é obrigatório';
    }

    // Removido: médico responsável não é mais obrigatório

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Autorização de mensagens é obrigatória
    if (!formData.optinMensagens) {
      newErrors.optinMensagens = 'A autorização para envio de mensagens é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar confirmação de opt-in via WhatsApp ou email
  const enviarConfirmacaoOptin = async (paciente) => {
    try {
      // Tentar enviar via WhatsApp primeiro, depois email como fallback
      const telefoneFormatado = paciente.telefone.replace(/\D/g, '');
      
      // Simular envio de confirmação (implementar integração real depois)
      console.log(`Enviando confirmação para paciente ${paciente.nome}:`);
      console.log(`WhatsApp: ${telefoneFormatado}`);
      if (paciente.email) {
        console.log(`Email: ${paciente.email}`);
      }
      
      // Aqui seria implementada a integração real com WhatsApp API e serviço de email
      // Por enquanto, apenas log para desenvolvimento
      
      setConfirmacaoEnviada(true);
      
    } catch (error) {
      console.error('Erro ao enviar confirmação:', error);
      // Não bloquear o cadastro se falhar o envio da confirmação
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Corrija os erros antes de continuar');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        dataNascimento: formData.dataNascimento?.format('YYYY-MM-DD') || null,
        cpf: formData.cpf.replace(/\D/g, ''), // Remover caracteres não numéricos
        telefone: formData.telefone.replace(/\D/g, ''),
        isUpdate: isEditing,
        // Marcar que precisa de confirmação se optou por mensagens
        statusOptin: formData.optinMensagens ? 'pendente_confirmacao' : 'nao_autorizado'
      };

      const endpoint = isEditing && pacienteId
        ? `/pacientes/${pacienteId}`
        : '/pacientes';

      const method = (isEditing && pacienteId) ? 'put' : 'post';
      const response = await api[method](endpoint, payload);

      if (response.data.success) {
        const action = isEditing ? 'atualizado' : 'cadastrado';
        
        // Se autorizou mensagens, enviar confirmação (apenas para novos cadastros)
        if (formData.optinMensagens && !isEditing) {
          await enviarConfirmacaoOptin(response.data.paciente);
        }
        
        toast.success(`Paciente ${action} com sucesso!${formData.optinMensagens && !isEditing ? ' Verifique seu WhatsApp/email para confirmar o recebimento de mensagens.' : ''}`);
        
        // Redirecionar para agenda ou lista de pacientes
        navigate('/pacientes');
      } else {
        throw new Error(response.data.message || 'Erro ao salvar paciente');
      }
    } catch (error) {
      console.error('Erro ao salvar paciente:', error);
      toast.error(error.message || 'Erro ao salvar paciente');
    } finally {
      setSaving(false);
    }
  };

  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <PersonAdd sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" fontWeight="bold">
          {pacienteExistente ? 'Editar Paciente' : 'Cadastro de Paciente'}
        </Typography>
      </Box>

      {/* Busca de Paciente Existente */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center">
            <Search sx={{ mr: 1 }} />
            Buscar Paciente Existente
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Digite o nome ou CPF para verificar se o paciente já está cadastrado
          </Typography>
          
          <Autocomplete
            options={[]}
            getOptionLabel={(option) => `${option.nome} - ${formatCPF(option.cpf)}`}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box display="flex" alignItems="center" width="100%">
                  <Person sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body1">{option.nome}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      CPF: {formatCPF(option.cpf)} | Tel: {formatPhone(option.telefone)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
            onInputChange={async (event, value) => {
              if (value.length >= 3) {
                await searchPacientes(value);
                // Atualizar opções do Autocomplete
              }
            }}
            onChange={(event, value) => handlePacienteSelect(value)}
            loading={searchLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                placeholder="Digite nome ou CPF do paciente..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <>
                      {searchLoading ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </CardContent>
      </Card>

      {/* Alerta de Duplicata */}
      {duplicateWarning && (
        <Alert 
          severity={duplicateWarning.type} 
          sx={{ mb: 3 }}
          action={
            duplicateWarning.existingPatient && (
              <Button
                color="inherit"
                size="small"
                startIcon={<Edit />}
                onClick={() => handlePacienteSelect(duplicateWarning.existingPatient)}
              >
                Editar
              </Button>
            )
          }
        >
          {duplicateWarning.message}
        </Alert>
      )}

      {/* Formulário de Cadastro */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center">
            <Badge sx={{ mr: 1 }} />
            Dados do Paciente
          </Typography>
          
          <Grid container spacing={3}>
            {/* Dados Pessoais */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Dados Pessoais
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Nome Completo *"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                error={!!errors.nome}
                helperText={errors.nome}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="CPF *"
                value={formatCPF(formData.cpf)}
                onChange={(e) => {
                  const numbers = e.target.value.replace(/\D/g, '');
                  if (numbers.length <= 11) {
                    handleInputChange('cpf', numbers);
                  }
                }}
                error={!!errors.cpf}
                helperText={errors.cpf}
                placeholder="000.000.000-00"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <DatePicker
                label="Data de Nascimento"
                value={formData.dataNascimento}
                onChange={(date) => handleInputChange('dataNascimento', date)}
                maxDate={dayjs()}
                renderInput={(params) => (
                  <TextField {...params} fullWidth />
                )}
              />
            </Grid>

            {/* Contato */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" color="primary" gutterBottom sx={{ mt: 2 }}>
                Contato
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone *"
                value={formatPhone(formData.telefone)}
                onChange={(e) => {
                  const numbers = e.target.value.replace(/\D/g, '');
                  if (numbers.length <= 11) {
                    handleInputChange('telefone', numbers);
                  }
                }}
                error={!!errors.telefone}
                helperText={errors.telefone}
                placeholder="(11) 99999-9999"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                placeholder="paciente@email.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Vinculação Médica */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" color="primary" gutterBottom sx={{ mt: 2 }}>
                Vinculação Médica
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Médico Responsável"
                value={formData.medicoResponsavel}
                onChange={(e) => handleInputChange('medicoResponsavel', e.target.value)}
                error={!!errors.medicoResponsavel}
                helperText={errors.medicoResponsavel}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocalHospital />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="">
                  <em>Selecionar médico...</em>
                </MenuItem>
                {medicos.map((medico) => (
                  <MenuItem key={medico.id} value={medico.id}>
                    <Box>
                      <Typography variant="body1">{medico.nome}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {medico.especialidade} - CRM: {medico.crm}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Consentimentos */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" color="primary" gutterBottom sx={{ mt: 2 }}>
                Consentimentos (LGPD)
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.optinMensagens}
                    onChange={(e) => handleInputChange('optinMensagens', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">
                      Autorizo o recebimento de mensagens automáticas *
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Includes lembretes de consulta, confirmações e comunicações importantes. 
                      Você receberá um link de confirmação via WhatsApp ou email para autorizar explicitamente.
                    </Typography>
                    {errors.optinMensagens && (
                      <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        {errors.optinMensagens}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </Grid>
          </Grid>

          {/* Ações */}
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/pacientes')}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Salvando...' : (isEditing ? 'Salvar' : 'Cadastrar')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CadastroPaciente;