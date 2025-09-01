import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Close,
  AutoAwesome,
  Save,
  Person,
  ContactPhone,
  MedicalServices,
  VerifiedUser
} from '@mui/icons-material';
import { usePacientes } from '../../hooks/usePacientes';
import toast from 'react-hot-toast';

// Componentes das etapas
import DadosPessoaisStep from './steps/DadosPessoaisStep';
import ContatoStep from './steps/ContatoStep';
import ClinicosStep from './steps/ClinicosStep';
import ConsentimentosStep from './steps/ConsentimentosStep';

const CadastroPaciente = ({ 
  open, 
  onClose, 
  pacienteParaEdicao = null,
  onSalvar 
}) => {
  const { 
    criarPaciente, 
    atualizarPaciente, 
    verificarDuplicatas,
    loading, 
    error,
    validarDadosPaciente,
    clearError
  } = usePacientes();

  // Estados do formulário
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Dados Pessoais
    nomeCompleto: '',
    cpf: '',
    rg: '',
    dataNascimento: null,
    genero: '',
    
    // Contato
    telefone: '',
    email: '',
    endereco: {
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cep: '',
      cidade: '',
      estado: '',
      pais: 'Brasil'
    },
    
    // Clínicos
    anamneseBasica: {
      alergias: [],
      medicamentos: [],
      condicoesMedicas: [],
      cirurgiasAnteriores: [],
      observacoesGerais: ''
    },
    
    historicoProcedimentos: [],
    
    // Consentimentos
    consentimentos: {
      mensagensAutomatizadas: false,
      compartilhamentoDados: false,
      marketingPromocional: false
    },
    
    // Mídia e observações
    foto: null,
    observacoes: ''
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [duplicataAlert, setDuplicataAlert] = useState(null);
  const [saving, setSaving] = useState(false);

  // Configuração das etapas
  const steps = [
    {
      label: 'Dados Pessoais',
      icon: <Person />,
      description: 'Informações básicas de identificação',
      required: true
    },
    {
      label: 'Contato',
      icon: <ContactPhone />,
      description: 'Telefone, email e endereço',
      required: true
    },
    {
      label: 'Dados Clínicos',
      icon: <MedicalServices />,
      description: 'Anamnese e histórico médico',
      required: false
    },
    {
      label: 'Consentimentos',
      icon: <VerifiedUser />,
      description: 'Autorização LGPD e comunicação',
      required: true
    }
  ];

  // Carregar dados para edição
  useEffect(() => {
    if (pacienteParaEdicao) {
      setFormData(prev => ({
        ...prev,
        ...pacienteParaEdicao
      }));
    }
  }, [pacienteParaEdicao]);

  // Limpar erros quando dialog abre/fecha
  useEffect(() => {
    if (open) {
      clearError();
      setValidationErrors({});
      setDuplicataAlert(null);
    }
  }, [open, clearError]);

  // Atualizar dados do formulário
  const updateFormData = useCallback((section, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: typeof data === 'object' && data !== null
        ? { ...prev[section], ...data }
        : data
    }));
    
    // Limpar erros da seção atualizada
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(section)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  }, []);

  // Validar etapa atual
  const validateCurrentStep = () => {
    const errors = {};
    
    switch (activeStep) {
      case 0: // Dados Pessoais
        if (!formData.nomeCompleto || formData.nomeCompleto.length < 3) {
          errors.nomeCompleto = 'Nome deve ter pelo menos 3 caracteres';
        }
        if (!formData.cpf) {
          errors.cpf = 'CPF é obrigatório';
        }
        if (!formData.dataNascimento) {
          errors.dataNascimento = 'Data de nascimento é obrigatória';
        }
        if (!formData.genero) {
          errors.genero = 'Gênero é obrigatório';
        }
        break;
        
      case 1: // Contato
        if (!formData.telefone) {
          errors.telefone = 'Telefone é obrigatório';
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = 'Email inválido';
        }
        break;
        
      case 3: // Consentimentos
        if (formData.consentimentos.mensagensAutomatizadas === undefined) {
          errors.consentimentos = 'Consentimento para mensagens é obrigatório';
        }
        break;
        
      default:
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Verificar duplicatas ao sair da etapa de dados pessoais
  const checkDuplicates = async () => {
    if (activeStep === 0 && formData.cpf && formData.telefone && !pacienteParaEdicao) {
      try {
        const result = await verificarDuplicatas(formData.cpf, formData.telefone);
        if (result.exists) {
          setDuplicataAlert({
            type: 'warning',
            message: `Paciente já cadastrado: ${result.paciente.nomeCompleto}`,
            paciente: result.paciente
          });
          return false;
        }
      } catch (err) {
        console.error('Erro ao verificar duplicatas:', err);
      }
    }
    return true;
  };

  // Avançar para próxima etapa
  const handleNext = async () => {
    if (!validateCurrentStep()) {
      toast.error('Por favor, corrija os erros antes de continuar');
      return;
    }
    
    const canProceed = await checkDuplicates();
    if (!canProceed) return;
    
    setActiveStep(prev => prev + 1);
  };

  // Voltar para etapa anterior
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Salvar paciente
  const handleSave = async () => {
    // Validação final
    const errors = validarDadosPaciente(formData);
    if (errors.length > 0) {
      toast.error(`Erros de validação: ${errors.join(', ')}`);
      return;
    }
    
    setSaving(true);
    
    try {
      let resultado;
      
      if (pacienteParaEdicao) {
        resultado = await atualizarPaciente(pacienteParaEdicao.id, formData);
        toast.success('Paciente atualizado com sucesso!');
      } else {
        resultado = await criarPaciente(formData);
        toast.success('Paciente cadastrado com sucesso!');
      }
      
      if (onSalvar) {
        onSalvar(resultado);
      }
      
      handleClose();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar paciente');
    } finally {
      setSaving(false);
    }
  };

  // Fechar modal
  const handleClose = () => {
    setActiveStep(0);
    setFormData({
      nomeCompleto: '',
      cpf: '',
      rg: '',
      dataNascimento: null,
      genero: '',
      telefone: '',
      email: '',
      endereco: {
        rua: '',
        numero: '',
        complemento: '',
        bairro: '',
        cep: '',
        cidade: '',
        estado: '',
        pais: 'Brasil'
      },
      anamneseBasica: {
        alergias: [],
        medicamentos: [],
        condicoesMedicas: [],
        cirurgiasAnteriores: [],
        observacoesGerais: ''
      },
      historicoProcedimentos: [],
      consentimentos: {
        mensagensAutomatizadas: false,
        compartilhamentoDados: false,
        marketingPromocional: false
      },
      foto: null,
      observacoes: ''
    });
    setValidationErrors({});
    setDuplicataAlert(null);
    onClose();
  };

  // Renderizar conteúdo da etapa atual
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <DadosPessoaisStep
            data={formData}
            errors={validationErrors}
            onChange={(data) => updateFormData('dadosPessoais', data)}
            onUpdateField={(field, value) => updateFormData(field, value)}
          />
        );
      case 1:
        return (
          <ContatoStep
            data={formData}
            errors={validationErrors}
            onChange={(data) => updateFormData('contato', data)}
            onUpdateField={(field, value) => updateFormData(field, value)}
          />
        );
      case 2:
        return (
          <ClinicosStep
            data={formData}
            errors={validationErrors}
            onChange={(data) => updateFormData('clinicos', data)}
            onUpdateField={(field, value) => updateFormData(field, value)}
            genero={formData.genero}
            idade={formData.dataNascimento ? 
              new Date().getFullYear() - new Date(formData.dataNascimento).getFullYear() : null
            }
          />
        );
      case 3:
        return (
          <ConsentimentosStep
            data={formData.consentimentos}
            errors={validationErrors}
            onChange={(data) => updateFormData('consentimentos', data)}
          />
        );
      default:
        return null;
    }
  };

  const isLastStep = activeStep === steps.length - 1;
  const currentStep = steps[activeStep];

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
      {/* Cabeçalho */}
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {pacienteParaEdicao ? 'Editar Paciente' : 'Novo Paciente'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentStep.description}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {formData.consentimentos.mensagensAutomatizadas && (
              <Tooltip title="Mensagens automatizadas autorizadas">
                <Chip
                  icon={<AutoAwesome />}
                  label="Automação"
                  color="primary"
                  size="small"
                />
              </Tooltip>
            )}
            <IconButton onClick={handleClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      {/* Stepper */}
      <Box sx={{ px: 3, pb: 2 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                StepIconComponent={() => (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: index <= activeStep ? 'primary.main' : 'grey.300',
                      color: index <= activeStep ? 'white' : 'grey.600'
                    }}
                  >
                    {step.icon}
                  </Box>
                )}
              >
                <Typography variant="caption" fontWeight="medium">
                  {step.label}
                  {step.required && (
                    <Typography component="span" color="error"> *</Typography>
                  )}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Alertas */}
      <DialogContent sx={{ pt: 0 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {duplicataAlert && (
          <Alert 
            severity={duplicataAlert.type} 
            sx={{ mb: 2 }}
            action={
              <Button 
                color="inherit" 
                size="small"
                onClick={() => setDuplicataAlert(null)}
              >
                Ignorar
              </Button>
            }
          >
            {duplicataAlert.message}
          </Alert>
        )}

        {/* Conteúdo da etapa */}
        <Box sx={{ minHeight: '400px' }}>
          {renderStepContent()}
        </Box>
      </DialogContent>

      {/* Ações */}
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={handleClose}
          disabled={saving}
        >
          Cancelar
        </Button>
        
        <Box sx={{ flex: 1 }} />
        
        {activeStep > 0 && (
          <Button
            onClick={handleBack}
            disabled={saving}
          >
            Voltar
          </Button>
        )}
        
        {!isLastStep ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
            startIcon={loading && <CircularProgress size={16} />}
          >
            Próximo
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : <Save />}
            sx={{ minWidth: 120 }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CadastroPaciente;
