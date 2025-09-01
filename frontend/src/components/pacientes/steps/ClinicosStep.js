import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Chip,
  Autocomplete,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert
} from '@mui/material';
import {
  MedicalServices,
  LocalHospital,
  Healing,
  Psychology
} from '@mui/icons-material';

const ClinicosStep = ({ data, onChange, errors = {} }) => {

  // Opções pré-definidas
  const tiposAlergia = [
    'Penicilina', 'Dipirona', 'AAS', 'Iodo', 'Sulfa',
    'Amendoim', 'Leite', 'Ovo', 'Camarão',
    'Pólen', 'Ácaros', 'Pelos de animais'
  ];

  const medicamentosComuns = [
    'Paracetamol', 'Ibuprofeno', 'Omeprazol', 'Losartana',
    'Sinvastatina', 'Metformina', 'Captopril', 'Hidroclorotiazida'
  ];

  const condicoesMedicas = [
    { categoria: 'Cardiovasculares', opcoes: ['Hipertensão', 'Arritmia', 'Infarto', 'Insuficiência Cardíaca'] },
    { categoria: 'Endócrinas', opcoes: ['Diabetes', 'Hipotireoidismo', 'Hipertireoidismo', 'Obesidade'] },
    { categoria: 'Neurológicas', opcoes: ['Enxaqueca', 'Epilepsia', 'AVC', 'Alzheimer'] },
    { categoria: 'Respiratórias', opcoes: ['Asma', 'DPOC', 'Bronquite', 'Pneumonia'] }
  ];

  const handleAlergiaChange = (event, newValue) => {
    onChange({
      ...data,
      historicoMedico: {
        ...data.historicoMedico,
        alergias: newValue
      }
    });
  };

  const handleMedicamentoChange = (event, newValue) => {
    onChange({
      ...data,
      historicoMedico: {
        ...data.historicoMedico,
        medicamentosAtuais: newValue
      }
    });
  };

  const handleCondicaoChange = (categoria, condicao, checked) => {
    const categoriaKey = categoria.toLowerCase().replace('ê', 'e').replace('ó', 'o');
    const condicoesAtuais = data.historicoMedico?.condicoesMedicas?.[categoriaKey] || [];
    
    let novasCondicoes;
    if (checked) {
      novasCondicoes = [...condicoesAtuais, condicao];
    } else {
      novasCondicoes = condicoesAtuais.filter(c => c !== condicao);
    }

    onChange({
      ...data,
      historicoMedico: {
        ...data.historicoMedico,
        condicoesMedicas: {
          ...data.historicoMedico?.condicoesMedicas,
          [categoriaKey]: novasCondicoes
        }
      }
    });
  };

  const handleHabitoChange = (campo, valor) => {
    onChange({
      ...data,
      historicoMedico: {
        ...data.historicoMedico,
        habitosVida: {
          ...data.historicoMedico?.habitosVida,
          [campo]: valor
        }
      }
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        <MedicalServices sx={{ mr: 1, verticalAlign: 'middle' }} />
        Dados Clínicos
      </Typography>

      {/* Alergias */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom color="primary">
            <Healing sx={{ mr: 1, verticalAlign: 'middle' }} />
            Alergias
          </Typography>
          
          <Autocomplete
            multiple
            freeSolo
            options={tiposAlergia}
            value={data.historicoMedico?.alergias || []}
            onChange={handleAlergiaChange}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  color="warning"
                  {...getTagProps({ index })}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Alergias conhecidas"
                placeholder="Digite ou selecione alergias"
                error={!!errors.alergias}
                helperText={errors.alergias}
              />
            )}
          />
        </CardContent>
      </Card>

      {/* Medicamentos Atuais */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom color="primary">
            <LocalHospital sx={{ mr: 1, verticalAlign: 'middle' }} />
            Medicamentos em Uso
          </Typography>
          
          <Autocomplete
            multiple
            freeSolo
            options={medicamentosComuns}
            value={data.historicoMedico?.medicamentosAtuais || []}
            onChange={handleMedicamentoChange}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  color="info"
                  {...getTagProps({ index })}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Medicamentos atuais"
                placeholder="Digite ou selecione medicamentos"
                error={!!errors.medicamentos}
                helperText={errors.medicamentos}
              />
            )}
          />
        </CardContent>
      </Card>

      {/* Condições Médicas */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom color="primary">
            <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
            Condições Médicas
          </Typography>
          
          {condicoesMedicas.map((grupo, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {grupo.categoria}
              </Typography>
              <FormGroup>
                <Grid container spacing={1}>
                  {grupo.opcoes.map((condicao) => {
                    const categoriaKey = grupo.categoria.toLowerCase().replace('ê', 'e').replace('ó', 'o');
                    const isChecked = data.historicoMedico?.condicoesMedicas?.[categoriaKey]?.includes(condicao) || false;
                    
                    return (
                      <Grid item xs={6} sm={4} key={condicao}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isChecked}
                              onChange={(e) => handleCondicaoChange(grupo.categoria, condicao, e.target.checked)}
                              size="small"
                            />
                          }
                          label={condicao}
                        />
                      </Grid>
                    );
                  })}
                </Grid>
              </FormGroup>
              {index < condicoesMedicas.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Hábitos de Vida */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom color="primary">
            Hábitos de Vida
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Tabagismo"
                value={data.historicoMedico?.habitosVida?.tabagismo?.status || 'Não fumante'}
                onChange={(e) => handleHabitoChange('tabagismo', { status: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="Não fumante">Não fumante</option>
                <option value="Ex-fumante">Ex-fumante</option>
                <option value="Fumante">Fumante</option>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Etilismo"
                value={data.historicoMedico?.habitosVida?.etilismo?.status || 'Não bebe'}
                onChange={(e) => handleHabitoChange('etilismo', { status: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="Não bebe">Não bebe</option>
                <option value="Socialmente">Socialmente</option>
                <option value="Regularmente">Regularmente</option>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                type="number"
                fullWidth
                label="Horas de sono (diárias)"
                value={data.historicoMedico?.habitosVida?.sono?.horasDiarias || 8}
                onChange={(e) => handleHabitoChange('sono', { 
                  ...data.historicoMedico?.habitosVida?.sono,
                  horasDiarias: parseInt(e.target.value) 
                })}
                InputProps={{ inputProps: { min: 1, max: 24 } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Qualidade do sono"
                value={data.historicoMedico?.habitosVida?.sono?.qualidade || 'Boa'}
                onChange={(e) => handleHabitoChange('sono', { 
                  ...data.historicoMedico?.habitosVida?.sono,
                  qualidade: e.target.value 
                })}
                SelectProps={{ native: true }}
              >
                <option value="Excelente">Excelente</option>
                <option value="Boa">Boa</option>
                <option value="Regular">Regular</option>
                <option value="Ruim">Ruim</option>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {errors.historicoMedico && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errors.historicoMedico}
        </Alert>
      )}
    </Box>
  );
};

export default ClinicosStep;
