import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  IconButton,
  Paper,
  Divider,
  Alert,
  TextField,
  FormControlLabel,
  Switch,
  Rating
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  LocalHospital as HospitalIcon,
  Medication as MedicationIcon,
  Warning as WarningIcon,
  Healing as HealingIcon,
  Psychology as PsychologyIcon,
  RestaurantMenu as FoodIcon,
  FitnessCenter as FitnessIcon,
  SmokingRooms as SmokingIcon,
  LocalBar as DrinkIcon,
  Hotel as SleepIcon,
  CheckCircle as CheckIcon,
  Cancel as NoIcon
} from '@mui/icons-material';
import { useProntuario } from '../../hooks/useProntuario';

// Visualizador e editor de Anamnese
const AnamneseViewer = ({ anamnese, pacienteId, readonly = false }) => {
  const { atualizarAnamnese, loading } = useProntuario(pacienteId);
  const [editando, setEditando] = useState(false);
  const [dadosEditados, setDadosEditados] = useState(anamnese || {});
  const [erro, setErro] = useState('');

  // Seções da anamnese
  const secoes = [
    {
      id: 'alergias',
      titulo: 'Alergias',
      icon: <WarningIcon />,
      color: 'error'
    },
    {
      id: 'medicamentos',
      titulo: 'Medicamentos Atuais',
      icon: <MedicationIcon />,
      color: 'primary'
    },
    {
      id: 'condicoes',
      titulo: 'Condições Médicas',
      icon: <HospitalIcon />,
      color: 'warning'
    },
    {
      id: 'cirurgias',
      titulo: 'Cirurgias Anteriores',
      icon: <HealingIcon />,
      color: 'info'
    },
    {
      id: 'habitos',
      titulo: 'Hábitos de Vida',
      icon: <PsychologyIcon />,
      color: 'success'
    }
  ];

  const handleEditar = () => {
    setEditando(true);
    setDadosEditados(anamnese || {});
  };

  const handleCancelar = () => {
    setEditando(false);
    setDadosEditados(anamnese || {});
    setErro('');
  };

  const handleSalvar = async () => {
    try {
      setErro('');
      await atualizarAnamnese(dadosEditados);
      setEditando(false);
    } catch (error) {
      setErro(error.message);
    }
  };

  const handleChange = (campo, valor) => {
    const campos = campo.split('.');
    setDadosEditados(prev => {
      const novo = { ...prev };
      let atual = novo;
      
      for (let i = 0; i < campos.length - 1; i++) {
        if (!atual[campos[i]]) atual[campos[i]] = {};
        atual = atual[campos[i]];
      }
      
      atual[campos[campos.length - 1]] = valor;
      return novo;
    });
  };

  const renderAlergias = (alergias) => {
    if (!alergias) return <Typography color="text.secondary">Nenhuma alergia informada</Typography>;

    const tiposAlergia = [
      { key: 'medicamentosas', label: 'Medicamentosas', color: 'error' },
      { key: 'alimentares', label: 'Alimentares', color: 'warning' },
      { key: 'ambientais', label: 'Ambientais', color: 'info' },
      { key: 'outras', label: 'Outras', color: 'default' }
    ];

    return (
      <Grid container spacing={2}>
        {tiposAlergia.map(tipo => {
          const items = alergias[tipo.key] || [];
          return (
            <Grid item xs={12} sm={6} key={tipo.key}>
              <Typography variant="subtitle2" gutterBottom>
                {tipo.label}
              </Typography>
              {items.length > 0 ? (
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {items.map((item, index) => (
                    <Chip
                      key={index}
                      label={typeof item === 'string' ? item : item.nome}
                      color={tipo.color}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma
                </Typography>
              )}
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const renderMedicamentos = (medicamentos) => {
    if (!medicamentos || medicamentos.length === 0) {
      return <Typography color="text.secondary">Nenhum medicamento em uso</Typography>;
    }

    return (
      <List dense>
        {medicamentos.map((med, index) => (
          <ListItem key={index} divider>
            <ListItemIcon>
              <MedicationIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={typeof med === 'string' ? med : med.nome}
              secondary={
                typeof med === 'object' && (
                  <Box>
                    {med.dosagem && <Typography variant="body2">Dosagem: {med.dosagem}</Typography>}
                    {med.frequencia && <Typography variant="body2">Frequência: {med.frequencia}</Typography>}
                    {med.observacoes && <Typography variant="body2">Obs: {med.observacoes}</Typography>}
                  </Box>
                )
              }
            />
          </ListItem>
        ))}
      </List>
    );
  };

  const renderCondicoesMedicas = (condicoes) => {
    if (!condicoes) return <Typography color="text.secondary">Nenhuma condição médica informada</Typography>;

    const categorias = [
      { key: 'cardiovasculares', label: 'Cardiovasculares' },
      { key: 'endocrinas', label: 'Endócrinas' },
      { key: 'neurologicas', label: 'Neurológicas' },
      { key: 'dermatologicas', label: 'Dermatológicas' },
      { key: 'respiratorias', label: 'Respiratórias' },
      { key: 'gastrointestinais', label: 'Gastrointestinais' },
      { key: 'geniturinarias', label: 'Geniturinárias' },
      { key: 'outras', label: 'Outras' }
    ];

    return (
      <Grid container spacing={2}>
        {categorias.map(categoria => {
          const items = condicoes[categoria.key] || [];
          if (items.length === 0) return null;
          
          return (
            <Grid item xs={12} sm={6} key={categoria.key}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                {categoria.label}
              </Typography>
              <List dense>
                {items.map((item, index) => (
                  <ListItem key={index} dense>
                    <ListItemIcon>
                      <CheckIcon color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={typeof item === 'string' ? item : item.nome}
                      secondary={typeof item === 'object' && item.observacoes}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const renderCirurgias = (cirurgias) => {
    if (!cirurgias || cirurgias.length === 0) {
      return <Typography color="text.secondary">Nenhuma cirurgia anterior</Typography>;
    }

    return (
      <List>
        {cirurgias.map((cirurgia, index) => (
          <ListItem key={index} divider>
            <ListItemIcon>
              <HealingIcon color="info" />
            </ListItemIcon>
            <ListItemText
              primary={typeof cirurgia === 'string' ? cirurgia : cirurgia.procedimento}
              secondary={
                typeof cirurgia === 'object' && (
                  <Box>
                    {cirurgia.data && <Typography variant="body2">Data: {cirurgia.data}</Typography>}
                    {cirurgia.hospital && <Typography variant="body2">Local: {cirurgia.hospital}</Typography>}
                    {cirurgia.complicacoes && <Typography variant="body2">Complicações: {cirurgia.complicacoes}</Typography>}
                  </Box>
                )
              }
            />
          </ListItem>
        ))}
      </List>
    );
  };

  const renderHabitosVida = (habitos) => {
    if (!habitos) return <Typography color="text.secondary">Informações não disponíveis</Typography>;

    const iconesHabitos = {
      tabagismo: <SmokingIcon />,
      etilismo: <DrinkIcon />,
      atividade_fisica: <FitnessIcon />,
      alimentacao: <FoodIcon />,
      sono: <SleepIcon />
    };

    return (
      <Grid container spacing={3}>
        {Object.entries(habitos).map(([tipo, dados]) => {
          if (!dados) return null;
          
          return (
            <Grid item xs={12} sm={6} md={4} key={tipo}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    {iconesHabitos[tipo]}
                    <Typography variant="subtitle2" textTransform="capitalize">
                      {tipo.replace('_', ' ')}
                    </Typography>
                  </Box>
                  
                  {tipo === 'tabagismo' && (
                    <Box>
                      <Typography variant="body2">
                        Status: {dados.status || 'Não informado'}
                      </Typography>
                      {dados.quantidadeDiaria && (
                        <Typography variant="body2">
                          Quantidade: {dados.quantidadeDiaria}/dia
                        </Typography>
                      )}
                      {dados.tempoUso && (
                        <Typography variant="body2">
                          Tempo de uso: {dados.tempoUso}
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  {tipo === 'etilismo' && (
                    <Box>
                      <Typography variant="body2">
                        Status: {dados.status || 'Não informado'}
                      </Typography>
                      {dados.frequencia && (
                        <Typography variant="body2">
                          Frequência: {dados.frequencia}
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  {tipo === 'atividade_fisica' && (
                    <Box>
                      <Typography variant="body2">
                        Pratica: {dados.pratica ? 'Sim' : 'Não'}
                      </Typography>
                      {dados.tipo && (
                        <Typography variant="body2">
                          Tipo: {dados.tipo}
                        </Typography>
                      )}
                      {dados.frequencia && (
                        <Typography variant="body2">
                          Frequência: {dados.frequencia}
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  {tipo === 'alimentacao' && (
                    <Box>
                      {dados.tipo && (
                        <Typography variant="body2">
                          Tipo: {dados.tipo}
                        </Typography>
                      )}
                      {dados.restricoes && dados.restricoes.length > 0 && (
                        <Box mt={1}>
                          <Typography variant="body2" gutterBottom>Restrições:</Typography>
                          {dados.restricoes.map((restricao, index) => (
                            <Chip
                              key={index}
                              label={restricao}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}
                  
                  {tipo === 'sono' && (
                    <Box>
                      <Typography variant="body2">
                        Horas diárias: {dados.horasDiarias || 'Não informado'}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mt={1}>
                        <Typography variant="body2">Qualidade:</Typography>
                        <Rating
                          value={
                            dados.qualidade === 'Excelente' ? 5 :
                            dados.qualidade === 'Boa' ? 4 :
                            dados.qualidade === 'Regular' ? 3 :
                            dados.qualidade === 'Ruim' ? 2 :
                            dados.qualidade === 'Péssima' ? 1 : 0
                          }
                          readOnly
                          size="small"
                        />
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  if (!anamnese) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Anamnese não disponível
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Esta funcionalidade permite visualizar e editar a anamnese completa do paciente.
        </Typography>
        {!readonly && (
          <Button variant="contained" onClick={handleEditar}>
            Criar Anamnese
          </Button>
        )}
      </Paper>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Anamnese
        </Typography>
        {!readonly && (
          <Box display="flex" gap={1}>
            {editando ? (
              <>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancelar}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSalvar}
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditar}
              >
                Editar
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Mensagem de Erro */}
      {erro && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErro('')}>
          {erro}
        </Alert>
      )}

      {/* Seções da Anamnese */}
      {secoes.map(secao => {
        let conteudo;
        
        switch (secao.id) {
          case 'alergias':
            conteudo = renderAlergias(anamnese.historicoMedico?.alergias);
            break;
          case 'medicamentos':
            conteudo = renderMedicamentos(anamnese.historicoMedico?.medicamentosAtuais);
            break;
          case 'condicoes':
            conteudo = renderCondicoesMedicas(anamnese.historicoMedico?.condicoesMedicas);
            break;
          case 'cirurgias':
            conteudo = renderCirurgias(anamnese.historicoMedico?.cirurgiasAnteriores);
            break;
          case 'habitos':
            conteudo = renderHabitosVida(anamnese.historicoMedico?.habitosVida);
            break;
          default:
            conteudo = <Typography>Seção não implementada</Typography>;
        }

        return (
          <Accordion key={secao.id} defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ backgroundColor: 'action.hover' }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                {React.cloneElement(secao.icon, { color: secao.color })}
                <Typography variant="h6">{secao.titulo}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {conteudo}
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* Assinatura do Paciente */}
      {anamnese.assinatura && (
        <Card sx={{ mt: 3 }}>
          <CardHeader
            title="Consentimento e Assinatura"
            avatar={
              anamnese.assinatura.pacienteAssinou ? (
                <CheckIcon color="success" />
              ) : (
                <NoIcon color="error" />
              )
            }
          />
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Paciente {anamnese.assinatura.pacienteAssinou ? 'assinou' : 'não assinou'} a anamnese
            </Typography>
            {anamnese.assinatura.dataAssinatura && (
              <Typography variant="body2" color="text.secondary">
                Data da assinatura: {new Date(anamnese.assinatura.dataAssinatura).toLocaleDateString('pt-BR')}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AnamneseViewer;
