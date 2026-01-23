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
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Divider,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Chip,
  Paper,
  Tooltip
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Check,
  Person,
  Phone,
  Email,
  Badge,
  Home,
  Info,
  NavigateNext,
  NavigateBefore
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { usePacientes } from '../hooks/usePacientes';

dayjs.locale('pt-br');

const CadastroPacienteNovo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { criarPaciente, atualizarPaciente, buscarPacientePorId, verificarDuplicatas } = usePacientes();

  // Estados do formulário
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pacienteId, setPacienteId] = useState(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  const [formData, setFormData] = useState({
    // Dados Pessoais
    nome: '',
    cpf: '',
    dataNascimento: null,
    sexo: '',
    
    // Contato
    telefone: '',
    email: '',
    
    // Endereço
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    
    // Informações Adicionais
    observacoes: '',
    indicadoPor: '',
    
    // LGPD
    consentimentos: {
      mensagensAutomatizadas: false,
      compartilhamentoDados: false
    }
  });

  const [errors, setErrors] = useState({});
  const [duplicateInfo, setDuplicateInfo] = useState(null);

  const steps = ['Dados Pessoais', 'Contato', 'Endereço', 'Confirmação'];

  // Carregar paciente se estiver editando
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
      const paciente = await buscarPacientePorId(id);
      if (paciente) {
        setFormData({
          nome: paciente.nome || paciente.nomeCompleto || '',
          cpf: paciente.cpf || '',
          dataNascimento: paciente.dataNascimento ? dayjs(paciente.dataNascimento) : null,
          sexo: paciente.sexo || '',
          telefone: paciente.telefone || '',
          email: paciente.email || '',
          cep: paciente.cep || '',
          endereco: paciente.endereco || '',
          numero: paciente.numero || '',
          complemento: paciente.complemento || '',
          bairro: paciente.bairro || '',
          cidade: paciente.cidade || '',
          estado: paciente.estado || '',
          observacoes: paciente.observacoes || '',
          indicadoPor: paciente.indicadoPor || '',
          consentimentos: {
            mensagensAutomatizadas: paciente.consentimentos?.mensagensAutomatizadas?.value || false,
            compartilhamentoDados: paciente.consentimentos?.compartilhamentoDados || false
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar paciente:', error);
      toast.error('Erro ao carregar dados do paciente');
    } finally {
      setLoading(false);
    }
  };

  // Validações por etapa
  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Dados Pessoais
        if (!formData.nome || formData.nome.trim().length < 3) {
          newErrors.nome = 'Nome deve ter pelo menos 3 caracteres';
        }
        if (!formData.telefone || formData.telefone.replace(/\D/g, '').length < 10) {
          newErrors.telefone = 'Telefone inválido';
        }
        break;

      case 1: // Contato
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Email inválido';
        }
        if (formData.cpf && formData.cpf.replace(/\D/g, '').length !== 11) {
          newErrors.cpf = 'CPF deve ter 11 dígitos';
        }
        break;

      case 2: // Endereço
        // Endereço é opcional
        if (formData.cep && formData.cep.replace(/\D/g, '').length !== 8) {
          newErrors.cep = 'CEP inválido';
        }
        break;

      case 3: // Confirmação
        // Validação final - apenas consentimentos
        // Nome e telefone já foram validados no step 0
        // Sexo é OPCIONAL
        if (!formData.consentimentos.mensagensAutomatizadas && !isEditing) {
          newErrors.consentimentos = 'É necessário autorizar o envio de mensagens automatizadas (obrigatório)';
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Verificar duplicatas (CPF/Telefone)
  const checkDuplicates = async () => {
    if (!formData.cpf && !formData.telefone) return;

    setCheckingDuplicates(true);
    try {
      const result = await verificarDuplicatas(
        formData.cpf?.replace(/\D/g, ''),
        formData.telefone?.replace(/\D/g, '')
      );

      if (result.cpfDuplicado || result.telefoneDuplicado) {
        setDuplicateInfo({
          cpf: result.cpfDuplicado,
          telefone: result.telefoneDuplicado
        });
      } else {
        setDuplicateInfo(null);
      }
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
    } finally {
      setCheckingDuplicates(false);
    }
  };

  // Buscar CEP
  const buscarCEP = async (cep) => {
    const cepNumeros = cep.replace(/\D/g, '');
    if (cepNumeros.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepNumeros}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || ''
        }));
        toast.success('CEP encontrado!');
      } else {
        toast.error('CEP não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP');
    }
  };

  // Formatação de campos
  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .substring(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers
        .substring(0, 10)
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return numbers
      .substring(0, 11)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const formatCEP = (value) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.substring(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
  };

  // Handlers
  const handleChange = (field) => (event) => {
    let value = event.target.value;

    // Aplicar formatações
    if (field === 'cpf') value = formatCPF(value);
    if (field === 'telefone') value = formatPhone(value);
    if (field === 'cep') value = formatCEP(value);

    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleConsentimentoChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      consentimentos: {
        ...prev.consentimentos,
        [field]: event.target.checked
      }
    }));
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      if (activeStep === 1) {
        checkDuplicates(); // Verificar duplicatas ao sair da etapa de contato
      }
      setActiveStep(prev => prev + 1);
    } else {
      toast.error('Preencha os campos obrigatórios');
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    // Limpar erros anteriores
    setErrors({});
    
    // Validar apenas consentimentos (step 3)
    if (!validateStep(3)) {
      toast.error('Você precisa autorizar o envio de mensagens automatizadas');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nome: formData.nome.trim(),
        cpf: formData.cpf?.replace(/\D/g, '') || null,
        dataNascimento: formData.dataNascimento?.format('YYYY-MM-DD') || null,
        sexo: formData.sexo || null,
        telefone: formData.telefone.replace(/\D/g, ''),
        email: formData.email?.trim() || null,
        cep: formData.cep?.replace(/\D/g, '') || null,
        endereco: formData.endereco?.trim() || null,
        numero: formData.numero?.trim() || null,
        complemento: formData.complemento?.trim() || null,
        bairro: formData.bairro?.trim() || null,
        cidade: formData.cidade?.trim() || null,
        estado: formData.estado || null,
        observacoes: formData.observacoes?.trim() || null,
        indicadoPor: formData.indicadoPor?.trim() || null,
        consentimentos: formData.consentimentos
      };

      let result;
      if (isEditing && pacienteId) {
        result = await atualizarPaciente(pacienteId, payload);
        toast.success('Paciente atualizado com sucesso!');
      } else {
        result = await criarPaciente(payload);
        toast.success('Paciente cadastrado com sucesso!');
      }

      if (result) {
        setTimeout(() => navigate('/pacientes'), 1000);
      }
    } catch (error) {
      console.error('Erro ao salvar paciente:', error);
      toast.error(error.message || 'Erro ao salvar paciente');
    } finally {
      setLoading(false);
    }
  };

  // Renderização dos steps
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Nome Completo"
                value={formData.nome}
                onChange={handleChange('nome')}
                error={!!errors.nome}
                helperText={errors.nome}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Telefone"
                value={formData.telefone}
                onChange={handleChange('telefone')}
                error={!!errors.telefone}
                helperText={errors.telefone || '(DDD) 00000-0000'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                <DatePicker
                  label="Data de Nascimento"
                  value={formData.dataNascimento}
                  onChange={(newValue) => setFormData(prev => ({ ...prev, dataNascimento: newValue }))}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.dataNascimento,
                      helperText: errors.dataNascimento
                    }
                  }}
                  maxDate={dayjs()}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Sexo"
                value={formData.sexo}
                onChange={handleChange('sexo')}
                SelectProps={{ native: true }}
              >
                <option value="">Selecione...</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="Outro">Outro</option>
              </TextField>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CPF"
                value={formData.cpf}
                onChange={handleChange('cpf')}
                onBlur={checkDuplicates}
                error={!!errors.cpf}
                helperText={errors.cpf || '000.000.000-00'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Badge />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {duplicateInfo && (duplicateInfo.cpf || duplicateInfo.telefone) && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  <strong>Atenção:</strong> Já existe um paciente cadastrado com 
                  {duplicateInfo.cpf && ' este CPF'}
                  {duplicateInfo.cpf && duplicateInfo.telefone && ' e'}
                  {duplicateInfo.telefone && ' este telefone'}
                  . Verifique se não é um cadastro duplicado.
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Indicado por"
                value={formData.indicadoPor}
                onChange={handleChange('indicadoPor')}
                helperText="Nome de quem indicou o paciente (opcional)"
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="CEP"
                value={formData.cep}
                onChange={handleChange('cep')}
                onBlur={(e) => buscarCEP(e.target.value)}
                error={!!errors.cep}
                helperText={errors.cep || '00000-000'}
              />
            </Grid>

            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Endereço"
                value={formData.endereco}
                onChange={handleChange('endereco')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Home />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Número"
                value={formData.numero}
                onChange={handleChange('numero')}
              />
            </Grid>

            <Grid item xs={12} md={9}>
              <TextField
                fullWidth
                label="Complemento"
                value={formData.complemento}
                onChange={handleChange('complemento')}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Bairro"
                value={formData.bairro}
                onChange={handleChange('bairro')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cidade"
                value={formData.cidade}
                onChange={handleChange('cidade')}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="UF"
                value={formData.estado}
                onChange={handleChange('estado')}
                inputProps={{ maxLength: 2, style: { textTransform: 'uppercase' } }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observações"
                value={formData.observacoes}
                onChange={handleChange('observacoes')}
                helperText="Informações adicionais sobre o paciente"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Info />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box>
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default', mb: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Resumo do Cadastro
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Nome:</Typography>
                  <Typography variant="body1" gutterBottom>{formData.nome || '-'}</Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Telefone:</Typography>
                  <Typography variant="body1" gutterBottom>{formData.telefone || '-'}</Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">CPF:</Typography>
                  <Typography variant="body1" gutterBottom>{formData.cpf || '-'}</Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Email:</Typography>
                  <Typography variant="body1" gutterBottom>{formData.email || '-'}</Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Data de Nascimento:</Typography>
                  <Typography variant="body1" gutterBottom>
                    {formData.dataNascimento?.format('DD/MM/YYYY') || '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Sexo:</Typography>
                  <Typography variant="body1" gutterBottom>{formData.sexo || '-'}</Typography>
                </Grid>

                {formData.endereco && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Endereço:</Typography>
                    <Typography variant="body1">
                      {formData.endereco}
                      {formData.numero && `, ${formData.numero}`}
                      {formData.complemento && ` - ${formData.complemento}`}
                      {formData.bairro && ` - ${formData.bairro}`}
                      {formData.cidade && ` - ${formData.cidade}`}
                      {formData.estado && `/${formData.estado}`}
                      {formData.cep && ` - CEP: ${formData.cep}`}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>

            <Paper elevation={0} sx={{ p: 3, bgcolor: 'warning.lighter' }}>
              <Typography variant="h6" gutterBottom color="warning.dark">
                Consentimentos LGPD
              </Typography>
              <Divider sx={{ my: 2 }} />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.consentimentos.mensagensAutomatizadas}
                    onChange={handleConsentimentoChange('mensagensAutomatizadas')}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    <strong>Autorizo</strong> o envio de mensagens automatizadas (WhatsApp, SMS, Email) 
                    para agendamentos, lembretes e ofertas da clínica. (Obrigatório conforme LGPD Art. 9º)
                  </Typography>
                }
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.consentimentos.compartilhamentoDados}
                    onChange={handleConsentimentoChange('compartilhamentoDados')}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    Autorizo o compartilhamento de dados com laboratórios e fornecedores 
                    para melhoria dos serviços prestados. (Opcional)
                  </Typography>
                }
              />

              {errors.consentimentos && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {errors.consentimentos}
                </Alert>
              )}
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center">
            <IconButton onClick={() => navigate('/pacientes')} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" fontWeight="bold">
              {isEditing ? 'Editar Paciente' : 'Novo Paciente'}
            </Typography>
          </Box>

          {isEditing && (
            <Chip label="Editando" color="info" icon={<Person />} />
          )}
        </Box>

        {/* Stepper */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* Formulário */}
        <Card>
          <CardContent>
            {loading ? (
              <Box display="flex" justifyContent="center" py={5}>
                <Typography>Carregando...</Typography>
              </Box>
            ) : (
              <>
                {renderStepContent(activeStep)}

                {/* Botões de navegação */}
                <Box display="flex" justifyContent="space-between" mt={4}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    startIcon={<NavigateBefore />}
                  >
                    Voltar
                  </Button>

                  <Box>
                    {activeStep === steps.length - 1 ? (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                        disabled={loading}
                        startIcon={loading ? null : <Save />}
                      >
                        {loading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Cadastrar Paciente')}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        endIcon={<NavigateNext />}
                      >
                        Próximo
                      </Button>
                    )}
                  </Box>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default CadastroPacienteNovo;
