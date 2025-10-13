# Guia: Refatoração do ModalListaEspera

## 🎯 Objetivo
Alinhar o ModalListaEspera com o padrão do ModalAgendamento para manter consistência no código.

## 📝 Mudanças Necessárias

### 1. Estrutura de Estados (Igual ao ModalAgendamento)

```javascript
const [formData, setFormData] = useState({
  // Dados do paciente - IGUAL ao ModalAgendamento
  paciente: '',              // Nome ou objeto do paciente
  pacienteNovo: false,       // Flag se é novo cadastro
  pacienteExistente: null,   // Objeto do paciente se existir
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
const [errors, setErrors] = useState({});
const [loading, setLoading] = useState(false);
```

### 2. Busca de Pacientes (Copiar do ModalAgendamento)

```javascript
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
  } finally {
    setPacienteLoading(false);
  }
};
```

### 3. Autocomplete (Exatamente como ModalAgendamento)

```javascript
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
      // Paciente selecionado
      setFormData(prev => ({
        ...prev,
        paciente: newValue.nome,
        pacienteExistente: newValue,
        cpf: newValue.cpf || '',
        telefone: newValue.telefone || '',
        email: newValue.email || '',
        pacienteNovo: false
      }));
    } else {
      // Texto digitado
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
      helperText={errors.paciente}
      InputProps={{
        ...params.InputProps,
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
    />
  )}
/>
```

### 4. Checkbox "Novo Paciente" (Como ModalAgendamento)

```javascript
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
```

### 5. Campos CPF e Telefone (Com mesmas máscaras)

```javascript
// CPF
<TextField
  label={`CPF ${formData.pacienteNovo ? '*' : ''}`}
  fullWidth
  size="small"
  value={formData.cpf}
  onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
  error={!!errors.cpf}
  helperText={errors.cpf}
  disabled={!!formData.pacienteExistente && !formData.pacienteNovo}
  InputProps={{
    inputComponent: TextMaskCPF
  }}
/>

// Telefone
<TextField
  label={`Telefone ${formData.pacienteNovo || !formData.pacienteExistente ? '*' : ''}`}
  fullWidth
  size="small"
  value={formData.telefone}
  onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
  error={!!errors.telefone}
  helperText={errors.telefone}
  disabled={!!formData.pacienteExistente && !formData.pacienteNovo}
  InputProps={{
    inputComponent: TextMaskPhone
  }}
/>
```

### 6. Validação (Similar ao ModalAgendamento)

```javascript
const validateForm = () => {
  const newErrors = {};

  // Validar paciente
  if (!formData.paciente && !formData.pacienteNovo) {
    newErrors.paciente = 'Selecione um paciente ou marque "Novo Paciente"';
  }

  // Se for novo paciente, validar campos obrigatórios
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
```

### 7. Função Salvar (Adaptada)

```javascript
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

    // TODO: Implementar chamada real da API
    console.log('📋 Salvando na lista de espera:', listaEsperaData);
    
    // Simulação de sucesso
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Paciente adicionado à lista de espera!');
    onSave && onSave(listaEsperaData);
    handleClose();
  } catch (error) {
    console.error('Erro ao salvar:', error);
    toast.error('Erro ao adicionar na lista de espera');
  } finally {
    setLoading(false);
  }
};
```

### 8. Layout do Modal (Estrutura)

```javascript
return (
  <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
    <DialogTitle>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HourglassEmpty color="primary" />
          <Typography variant="h6">Lista de Espera</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </Box>
    </DialogTitle>

    <DialogContent dividers>
      <Grid container spacing={2}>
        {/* Seção 1: Buscar/Cadastrar Paciente */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            <PersonIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            Paciente *
          </Typography>
        </Grid>

        <Grid item xs={12}>
          {/* Autocomplete aqui */}
        </Grid>

        <Grid item xs={12}>
          {/* Checkbox "Novo Paciente" */}
        </Grid>

        {/* Seção 2: Dados do Paciente (se novo ou não encontrado) */}
        {(formData.pacienteNovo || !formData.pacienteExistente) && (
          <>
            <Grid item xs={12} md={6}>
              {/* CPF */}
            </Grid>
            <Grid item xs={12} md={6}>
              {/* Telefone */}
            </Grid>
            <Grid item xs={12} md={6}>
              {/* Email */}
            </Grid>
          </>
        )}

        {/* Seção 3: Preferências (OPCIONAL) */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
            Preferências (Opcional)
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          {/* Procedimento */}
        </Grid>

        <Grid item xs={12} md={6}>
          {/* Convênio */}
        </Grid>

        <Grid item xs={12} md={6}>
          {/* Período */}
        </Grid>

        <Grid item xs={12} md={6}>
          {/* Dias da Semana */}
        </Grid>

        <Grid item xs={12}>
          {/* Observações */}
        </Grid>

        {/* Informativo */}
        <Grid item xs={12}>
          <Alert severity="info">
            O paciente será notificado quando houver disponibilidade conforme suas preferências.
          </Alert>
        </Grid>
      </Grid>
    </DialogContent>

    <DialogActions>
      <Button onClick={handleClose} disabled={loading}>
        Cancelar
      </Button>
      <Button
        variant="contained"
        onClick={handleSave}
        disabled={loading}
        startIcon={<HourglassEmpty />}
      >
        {loading ? 'Salvando...' : 'Adicionar à Lista'}
      </Button>
    </DialogActions>
  </Dialog>
);
```

## 🎨 Diferenças do ModalAgendamento

### O que mantém IGUAL:
✅ Estrutura de estados do paciente
✅ Autocomplete de busca
✅ Máscaras de telefone e CPF
✅ Checkbox "Novo Paciente"
✅ Validações de campos obrigatórios
✅ Layout geral do modal

### O que é DIFERENTE:
❌ Não tem campos de data/hora (lista de espera não agenda)
✅ Tem campos de preferência: período e dias da semana
✅ Status sempre "aguardando"
❌ Não tem status "confirmado/cancelado" etc
✅ Campos de preferências são TODOS opcionais
✅ Apenas nome e telefone são obrigatórios

## 📦 Imports Necessários

```javascript
import React, { useState, useEffect } from 'react';
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
  FormControlLabel
} from '@mui/material';
import {
  Close,
  HourglassEmpty,
  Person as PersonIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { IMaskInput } from 'react-imask';
```

## ✅ Checklist de Implementação

- [ ] Copiar estrutura de estados do ModalAgendamento
- [ ] Implementar função `handlePacienteSearch`
- [ ] Adicionar Autocomplete igual ao ModalAgendamento
- [ ] Adicionar checkbox "Novo Paciente"
- [ ] Implementar validações similares
- [ ] Adicionar campos de preferências (período, dias)
- [ ] Implementar função `handleSave` adaptada
- [ ] Testar fluxo: paciente existente
- [ ] Testar fluxo: novo paciente
- [ ] Testar validações

## 🚀 Próximos Passos

1. Usar este guia para recriar o ModalListaEspera
2. Copiar max código possível do ModalAgendamento
3. Adaptar apenas as partes específicas (preferências)
4. Manter mesma estrutura e fluxo de validação

---

*Guia criado em 13 de Outubro de 2025*
