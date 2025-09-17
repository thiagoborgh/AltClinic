import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  MedicalServices as MedicalIcon,
  SmartToy as AIIcon
} from '@mui/icons-material';
import { useAtendimento } from '../../hooks/useAtendimento';
import { toast } from 'react-hot-toast';

// Configuração de campos por especialidade
const camposPorEspecialidade = {
  cardiologia: {
    titulo: 'Início de Atendimento - Cardiologia',
    icone: '❤️',
    campos: [
      {
        id: 'pressaoArterial',
        label: 'Pressão Arterial',
        tipo: 'text',
        placeholder: '120/80 mmHg',
        obrigatorio: true,
        validacao: (valor) => /^\d{2,3}\/\d{2,3}$/.test(valor) || 'Formato inválido (ex: 120/80)'
      },
      {
        id: 'frequenciaCardiaca',
        label: 'Frequência Cardíaca',
        tipo: 'number',
        placeholder: '72',
        unidade: 'bpm',
        obrigatorio: true
      },
      {
        id: 'historicoCardiaco',
        label: 'Histórico Cardíaco',
        tipo: 'textarea',
        placeholder: 'Infartos, arritmias, cirurgias cardíacas...',
        obrigatorio: false
      },
      {
        id: 'sintomasAtuais',
        label: 'Sintomas Atuais',
        tipo: 'multiselect',
        opcoes: ['Dor no peito', 'Falta de ar', 'Palpitações', 'Tontura', 'Fadiga'],
        obrigatorio: true
      },
      {
        id: 'medicamentosAtuais',
        label: 'Medicamentos Atuais',
        tipo: 'textarea',
        placeholder: 'Liste os medicamentos em uso...',
        obrigatorio: false
      }
    ],
    sugestoesIA: [
      'Considerar solicitação de ECG se sintomas sugestivos',
      'Avaliar fatores de risco cardiovascular',
      'Verificar histórico familiar de doenças cardíacas'
    ]
  },

  dermatologia: {
    titulo: 'Início de Atendimento - Dermatologia',
    icone: '🩹',
    campos: [
      {
        id: 'localizacaoLesao',
        label: 'Localização da Lesão',
        tipo: 'text',
        placeholder: 'Braço direito, face, etc.',
        obrigatorio: true
      },
      {
        id: 'tipoLesao',
        label: 'Tipo de Lesão',
        tipo: 'select',
        opcoes: ['Mancha', 'Pápula', 'Placa', 'Nódulo', 'Vesícula', 'Pústula', 'Úlcera', 'Cicatriz'],
        obrigatorio: true
      },
      {
        id: 'tamanhoLesao',
        label: 'Tamanho da Lesão',
        tipo: 'text',
        placeholder: '2x3 cm',
        obrigatorio: true
      },
      {
        id: 'caracteristicasLesao',
        label: 'Características',
        tipo: 'multiselect',
        opcoes: ['Pruriginosa', 'Dolorosa', 'Descamativa', 'Úmida', 'Seca', 'Eritematosa'],
        obrigatorio: false
      },
      {
        id: 'tempoEvolucao',
        label: 'Tempo de Evolução',
        tipo: 'text',
        placeholder: '3 dias, 2 semanas, etc.',
        obrigatorio: true
      },
      {
        id: 'historicoDermatologico',
        label: 'Histórico Dermatológico',
        tipo: 'textarea',
        placeholder: 'Alergias cutâneas, tratamentos anteriores...',
        obrigatorio: false
      }
    ],
    sugestoesIA: [
      'Fotografar lesão para documentação',
      'Considerar teste de contato se suspeita de alergia',
      'Avaliar exposição solar recente'
    ]
  },

  clinicaGeral: {
    titulo: 'Início de Atendimento - Clínica Geral',
    icone: '🏥',
    campos: [
      {
        id: 'sintomasPrincipais',
        label: 'Sintomas Principais',
        tipo: 'multiselect',
        opcoes: ['Febre', 'Dor de cabeça', 'Tosse', 'Fadiga', 'Náusea', 'Vômito', 'Diarreia', 'Dor abdominal', 'Dor muscular'],
        obrigatorio: true
      },
      {
        id: 'tempoSintomas',
        label: 'Tempo dos Sintomas',
        tipo: 'text',
        placeholder: '2 dias, 1 semana, etc.',
        obrigatorio: true
      },
      {
        id: 'intensidadeSintomas',
        label: 'Intensidade (0-10)',
        tipo: 'number',
        min: 0,
        max: 10,
        obrigatorio: true
      },
      {
        id: 'sinaisVitais',
        label: 'Sinais Vitais',
        tipo: 'group',
        campos: [
          { id: 'temperatura', label: 'Temperatura (°C)', tipo: 'number', step: 0.1 },
          { id: 'pressao', label: 'Pressão Arterial', tipo: 'text', placeholder: '120/80' },
          { id: 'frequencia', label: 'Frequência Cardíaca', tipo: 'number', unidade: 'bpm' }
        ]
      },
      {
        id: 'medicamentosUso',
        label: 'Medicamentos em Uso',
        tipo: 'textarea',
        placeholder: 'Liste todos os medicamentos...',
        obrigatorio: false
      },
      {
        id: 'historicoClinico',
        label: 'Histórico Clínico Relevante',
        tipo: 'textarea',
        placeholder: 'Doenças crônicas, cirurgias, alergias...',
        obrigatorio: false
      }
    ],
    sugestoesIA: [
      'Avaliar necessidade de exames laboratoriais',
      'Considerar fatores psicossociais',
      'Verificar sinais de alarme'
    ]
  }
};

const IniciarAtendimentoModal = ({
  open,
  onClose,
  paciente,
  especialidade,
  onAtendimentoIniciado
}) => {
  const { iniciarAtendimento, loading } = useAtendimento();
  const [formData, setFormData] = useState({});
  const [erros, setErros] = useState({});
  const [mostrarSugestoesIA, setMostrarSugestoesIA] = useState(false);

  // Reset form quando modal abre
  useEffect(() => {
    if (open && especialidade) {
      setFormData({});
      setErros({});
      setMostrarSugestoesIA(false);
    }
  }, [open, especialidade]);

  // Configuração da especialidade atual
  const configEspecialidade = camposPorEspecialidade[especialidade] || camposPorEspecialidade.clinicaGeral;

  const handleInputChange = (campoId, valor) => {
    setFormData(prev => ({
      ...prev,
      [campoId]: valor
    }));

    // Limpar erro do campo
    if (erros[campoId]) {
      setErros(prev => ({
        ...prev,
        [campoId]: null
      }));
    }
  };

  const validarCampo = (campo, valor) => {
    if (campo.obrigatorio && (!valor || valor === '')) {
      return `${campo.label} é obrigatório`;
    }

    if (campo.validacao) {
      return campo.validacao(valor);
    }

    return null;
  };

  const validarFormulario = () => {
    const novosErros = {};

    configEspecialidade.campos.forEach(campo => {
      const erro = validarCampo(campo, formData[campo.id]);
      if (erro) {
        novosErros[campo.id] = erro;
      }
    });

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async () => {
    if (!validarFormulario()) {
      toast.error('Preencha todos os campos obrigatórios corretamente');
      return;
    }

    try {
      const dadosAtendimento = {
        pacienteId: paciente?.id,
        especialidade,
        dadosClinicos: formData,
        dataInicio: new Date().toISOString(),
        status: 'em-andamento'
      };

      await iniciarAtendimento(dadosAtendimento);

      toast.success('Atendimento iniciado com sucesso!');
      onAtendimentoIniciado?.(dadosAtendimento);
      onClose();

    } catch (error) {
      console.error('Erro ao iniciar atendimento:', error);
      toast.error('Erro ao iniciar atendimento');
    }
  };

  const renderCampo = (campo) => {
    const valor = formData[campo.id] || '';
    const erro = erros[campo.id];

    switch (campo.tipo) {
      case 'text':
      case 'number':
        return (
          <TextField
            key={campo.id}
            fullWidth
            label={`${campo.label}${campo.obrigatorio ? ' *' : ''}`}
            type={campo.tipo}
            value={valor}
            onChange={(e) => handleInputChange(campo.id, e.target.value)}
            placeholder={campo.placeholder}
            error={!!erro}
            helperText={erro}
            inputProps={campo.tipo === 'number' ? {
              min: campo.min,
              max: campo.max,
              step: campo.step
            } : {}}
            InputProps={campo.unidade ? {
              endAdornment: <Typography variant="caption">{campo.unidade}</Typography>
            } : {}}
          />
        );

      case 'textarea':
        return (
          <TextField
            key={campo.id}
            fullWidth
            multiline
            rows={3}
            label={`${campo.label}${campo.obrigatorio ? ' *' : ''}`}
            value={valor}
            onChange={(e) => handleInputChange(campo.id, e.target.value)}
            placeholder={campo.placeholder}
            error={!!erro}
            helperText={erro}
          />
        );

      case 'select':
        return (
          <FormControl fullWidth error={!!erro}>
            <InputLabel>{`${campo.label}${campo.obrigatorio ? ' *' : ''}`}</InputLabel>
            <Select
              value={valor}
              onChange={(e) => handleInputChange(campo.id, e.target.value)}
              label={`${campo.label}${campo.obrigatorio ? ' *' : ''}`}
            >
              {campo.opcoes.map((opcao) => (
                <MenuItem key={opcao} value={opcao}>
                  {opcao}
                </MenuItem>
              ))}
            </Select>
            {erro && <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>{erro}</Typography>}
          </FormControl>
        );

      case 'multiselect':
        return (
          <Box key={campo.id}>
            <Typography variant="subtitle2" gutterBottom>
              {`${campo.label}${campo.obrigatorio ? ' *' : ''}`}
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {campo.opcoes.map((opcao) => (
                <FormControlLabel
                  key={opcao}
                  control={
                    <Checkbox
                      checked={(valor || []).includes(opcao)}
                      onChange={(e) => {
                        const atuais = valor || [];
                        const novos = e.target.checked
                          ? [...atuais, opcao]
                          : atuais.filter(item => item !== opcao);
                        handleInputChange(campo.id, novos);
                      }}
                    />
                  }
                  label={opcao}
                />
              ))}
            </Box>
            {erro && <Typography variant="caption" color="error">{erro}</Typography>}
          </Box>
        );

      case 'group':
        return (
          <Box key={campo.id} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {campo.label}
            </Typography>
            <Grid container spacing={2}>
              {campo.campos.map((subCampo) => (
                <Grid item xs={12} sm={4} key={subCampo.id}>
                  <TextField
                    fullWidth
                    size="small"
                    label={subCampo.label}
                    type={subCampo.tipo}
                    value={formData[subCampo.id] || ''}
                    onChange={(e) => handleInputChange(subCampo.id, e.target.value)}
                    placeholder={subCampo.placeholder}
                    inputProps={subCampo.tipo === 'number' ? {
                      step: subCampo.step
                    } : {}}
                    InputProps={subCampo.unidade ? {
                      endAdornment: <Typography variant="caption">{subCampo.unidade}</Typography>
                    } : {}}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  if (!configEspecialidade) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'primary.main',
        color: 'white'
      }}>
        <Box display="flex" alignItems="center">
          <MedicalIcon sx={{ mr: 1 }} />
          <Typography variant="h6">
            {configEspecialidade.titulo}
          </Typography>
          <Chip
            label={configEspecialidade.icone}
            sx={{ ml: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Informações do Paciente */}
        <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Paciente: {paciente?.nome || 'Não informado'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Especialidade: {especialidade || 'Clínica Geral'}
            </Typography>
          </CardContent>
        </Card>

        {/* Sugestões de IA */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<AIIcon />}
            onClick={() => setMostrarSugestoesIA(!mostrarSugestoesIA)}
            sx={{ mb: 1 }}
          >
            {mostrarSugestoesIA ? 'Ocultar' : 'Mostrar'} Sugestões de IA
          </Button>

          {mostrarSugestoesIA && (
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                💡 Sugestões baseadas em IA:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {configEspecialidade.sugestoesIA.map((sugestao, index) => (
                  <li key={index}>
                    <Typography variant="body2">{sugestao}</Typography>
                  </li>
                ))}
              </Box>
            </Alert>
          )}
        </Box>

        {/* Formulário */}
        <Grid container spacing={3}>
          {configEspecialidade.campos.map((campo) => (
            <Grid item xs={12} md={campo.tipo === 'group' ? 12 : 6} key={campo.id}>
              {renderCampo(campo)}
            </Grid>
          ))}
        </Grid>

        {/* Campos obrigatórios */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>* Campos obrigatórios</strong>
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Iniciar Atendimento'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IniciarAtendimentoModal;