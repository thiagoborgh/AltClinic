import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { IMaskInput } from 'react-imask';

// Componente de máscara para CPF
const CPFMask = React.forwardRef((props, ref) => (
  <IMaskInput
    {...props}
    mask="000.000.000-00"
    definitions={{
      '#': /[1-9]/,
    }}
    inputRef={ref}
    onAccept={(value) => props.onChange({ target: { name: props.name, value } })}
    overwrite
  />
));
CPFMask.displayName = 'CPFMask';

const DadosPessoaisStep = ({ 
  data, 
  errors, 
  onUpdateField 
}) => {
  // Calcular idade automaticamente
  const calcularIdade = (dataNascimento) => {
    if (!dataNascimento) return null;
    
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade;
  };

  const idade = calcularIdade(data.dataNascimento);

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        📋 Dados Pessoais
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Os campos marcados com * são obrigatórios para o cadastro.
      </Alert>

      <Grid container spacing={3}>
        {/* Nome Completo */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Nome Completo *"
            value={data.nomeCompleto || ''}
            onChange={(e) => {
              // Capitalizar automaticamente
              const capitalizedValue = e.target.value
                .toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              onUpdateField('nomeCompleto', capitalizedValue);
            }}
            error={!!errors.nomeCompleto}
            helperText={errors.nomeCompleto || 'Digite o nome completo do paciente'}
            inputProps={{ maxLength: 100 }}
          />
        </Grid>

        {/* CPF e RG */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="CPF *"
            value={data.cpf || ''}
            onChange={(e) => onUpdateField('cpf', e.target.value)}
            error={!!errors.cpf}
            helperText={errors.cpf || 'Documento de identificação único'}
            InputProps={{
              inputComponent: CPFMask,
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="RG"
            value={data.rg || ''}
            onChange={(e) => onUpdateField('rg', e.target.value)}
            helperText="Documento de identidade (opcional)"
            inputProps={{ maxLength: 20 }}
          />
        </Grid>

        {/* Data de Nascimento e Idade */}
        <Grid item xs={12} md={6}>
          <DatePicker
            label="Data de Nascimento *"
            value={data.dataNascimento}
            onChange={(newValue) => onUpdateField('dataNascimento', newValue)}
            maxDate={new Date()}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!errors.dataNascimento,
                helperText: errors.dataNascimento || 'Usado para calcular a idade automaticamente'
              }
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box display="flex" alignItems="center" height="100%">
            {idade !== null && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Idade Calculada
                </Typography>
                <Chip 
                  label={`${idade} anos`} 
                  color="primary" 
                  variant="outlined"
                  size="large"
                />
              </Box>
            )}
          </Box>
        </Grid>

        {/* Gênero */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.genero}>
            <InputLabel>Gênero *</InputLabel>
            <Select
              value={data.genero || ''}
              label="Gênero *"
              onChange={(e) => onUpdateField('genero', e.target.value)}
            >
              <MenuItem value="Masculino">Masculino</MenuItem>
              <MenuItem value="Feminino">Feminino</MenuItem>
              <MenuItem value="Outro">Outro</MenuItem>
              <MenuItem value="Não Informar">Prefiro não informar</MenuItem>
            </Select>
            {errors.genero && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                {errors.genero}
              </Typography>
            )}
          </FormControl>
        </Grid>

        {/* Informações calculadas */}
        {data.genero && idade !== null && (
          <Grid item xs={12}>
            <Alert severity="success" icon="🤖">
              <Typography variant="body2">
                <strong>Automação Ativa:</strong> Com base nos dados informados 
                (gênero: {data.genero}, idade: {idade} anos), o sistema poderá sugerir 
                perguntas personalizadas na anamnese na próxima etapa.
              </Typography>
            </Alert>
          </Grid>
        )}

        {/* Validações em tempo real */}
        {data.nomeCompleto && data.nomeCompleto.length >= 3 && data.cpf && data.dataNascimento && data.genero && (
          <Grid item xs={12}>
            <Alert severity="success" sx={{ mt: 2 }}>
              ✅ Dados pessoais básicos completos! Você pode prosseguir para a próxima etapa.
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default DadosPessoaisStep;
