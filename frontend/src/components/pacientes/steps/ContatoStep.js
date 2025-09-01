import React, { useState } from 'react';
import {
  Grid,
  TextField,
  Box,
  Typography,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  WhatsApp,
  LocationOn,
  Email,
  Phone,
  Search
} from '@mui/icons-material';
import { IMaskInput } from 'react-imask';
import { usePacientes } from '../../../hooks/usePacientes';

// Componente de máscara para telefone
const TelefoneMask = React.forwardRef((props, ref) => (
  <IMaskInput
    {...props}
    mask="+55 (00) 00000-0000"
    definitions={{
      '#': /[1-9]/,
    }}
    inputRef={ref}
    onAccept={(value) => props.onChange({ target: { name: props.name, value } })}
    overwrite
  />
));
TelefoneMask.displayName = 'TelefoneMask';

// Componente de máscara para CEP
const CEPMask = React.forwardRef((props, ref) => (
  <IMaskInput
    {...props}
    mask="00000-000"
    inputRef={ref}
    onAccept={(value) => props.onChange({ target: { name: props.name, value } })}
    overwrite
  />
));
CEPMask.displayName = 'CEPMask';

const ContatoStep = ({ 
  data, 
  errors, 
  onUpdateField 
}) => {
  const { buscarCEP } = usePacientes();
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  const [whatsappVerified, setWhatsappVerified] = useState(false);

  // Buscar endereço por CEP
  const handleBuscarCEP = async () => {
    if (!data.endereco?.cep) return;
    
    setBuscandoCEP(true);
    try {
      const endereco = await buscarCEP(data.endereco.cep);
      if (endereco) {
        onUpdateField('endereco', {
          ...data.endereco,
          ...endereco
        });
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
    } finally {
      setBuscandoCEP(false);
    }
  };

  // Verificar WhatsApp (simulado)
  const handleVerificarWhatsApp = () => {
    setWhatsappVerified(true);
    // Aqui integraria com API do WhatsApp para verificar se número é válido
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        📞 Informações de Contato
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        O telefone é obrigatório para comunicação e lembretes automáticos.
      </Alert>

      <Grid container spacing={3}>
        {/* Telefone Principal */}
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            label="Telefone (WhatsApp) *"
            value={data.telefone || ''}
            onChange={(e) => onUpdateField('telefone', e.target.value)}
            error={!!errors.telefone}
            helperText={errors.telefone || 'Número principal para contato e automações'}
            InputProps={{
              inputComponent: TelefoneMask,
              startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box display="flex" alignItems="center" gap={1} height="100%">
            <Tooltip title="Verificar se número existe no WhatsApp">
              <IconButton 
                onClick={handleVerificarWhatsApp}
                color="success"
                disabled={!data.telefone}
              >
                <WhatsApp />
              </IconButton>
            </Tooltip>
            {whatsappVerified && (
              <Chip 
                label="WhatsApp ✓" 
                color="success" 
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Grid>

        {/* Email */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            type="email"
            label="Email"
            value={data.email || ''}
            onChange={(e) => onUpdateField('email', e.target.value)}
            error={!!errors.email}
            helperText={errors.email || 'Email para comunicação e confirmações (opcional)'}
            InputProps={{
              startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Grid>

        {/* Seção de Endereço */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'center' }}>
            <LocationOn sx={{ mr: 1 }} />
            Endereço (Opcional)
          </Typography>
        </Grid>

        {/* CEP com busca automática */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="CEP"
            value={data.endereco?.cep || ''}
            onChange={(e) => onUpdateField('endereco', {
              ...data.endereco,
              cep: e.target.value
            })}
            onBlur={handleBuscarCEP}
            helperText="Digite o CEP para preenchimento automático"
            InputProps={{
              inputComponent: CEPMask,
              endAdornment: buscandoCEP ? (
                <CircularProgress size={20} />
              ) : (
                <Tooltip title="Buscar endereço automaticamente">
                  <IconButton onClick={handleBuscarCEP} size="small">
                    <Search />
                  </IconButton>
                </Tooltip>
              ),
            }}
          />
        </Grid>

        {/* Rua */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Rua/Logradouro"
            value={data.endereco?.rua || ''}
            onChange={(e) => onUpdateField('endereco', {
              ...data.endereco,
              rua: e.target.value
            })}
          />
        </Grid>

        {/* Número e Complemento */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Número"
            value={data.endereco?.numero || ''}
            onChange={(e) => onUpdateField('endereco', {
              ...data.endereco,
              numero: e.target.value
            })}
          />
        </Grid>
        
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            label="Complemento"
            value={data.endereco?.complemento || ''}
            onChange={(e) => onUpdateField('endereco', {
              ...data.endereco,
              complemento: e.target.value
            })}
            placeholder="Apartamento, bloco, sala..."
          />
        </Grid>

        {/* Bairro */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Bairro"
            value={data.endereco?.bairro || ''}
            onChange={(e) => onUpdateField('endereco', {
              ...data.endereco,
              bairro: e.target.value
            })}
          />
        </Grid>

        {/* Cidade e Estado */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Cidade"
            value={data.endereco?.cidade || ''}
            onChange={(e) => onUpdateField('endereco', {
              ...data.endereco,
              cidade: e.target.value
            })}
          />
        </Grid>
        
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            label="UF"
            value={data.endereco?.estado || ''}
            onChange={(e) => onUpdateField('endereco', {
              ...data.endereco,
              estado: e.target.value.toUpperCase()
            })}
            inputProps={{ maxLength: 2 }}
          />
        </Grid>

        {/* Validação visual */}
        {data.telefone && (
          <Grid item xs={12}>
            <Alert severity="success">
              ✅ Telefone informado! O paciente poderá receber lembretes automáticos 
              {data.email && ' e comunicações por email'}.
            </Alert>
          </Grid>
        )}

        {/* Resumo do endereço */}
        {data.endereco?.rua && data.endereco?.cidade && (
          <Grid item xs={12}>
            <Alert severity="info" icon="📍">
              <Typography variant="body2">
                <strong>Endereço:</strong> {data.endereco.rua}
                {data.endereco.numero && `, ${data.endereco.numero}`}
                {data.endereco.bairro && `, ${data.endereco.bairro}`}
                {data.endereco.cidade && ` - ${data.endereco.cidade}`}
                {data.endereco.estado && `/${data.endereco.estado}`}
                {data.endereco.cep && ` - CEP: ${data.endereco.cep}`}
              </Typography>
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ContatoStep;
