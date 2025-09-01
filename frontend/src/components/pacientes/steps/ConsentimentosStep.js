import React from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper
} from '@mui/material';
import {
  Security,
  VerifiedUser,
  Assignment,
  InfoOutlined,
  CheckCircle
} from '@mui/icons-material';

const ConsentimentosStep = ({ data, onChange, errors = {} }) => {
  const handleConsentimentoChange = (campo, valor) => {
    onChange({
      ...data,
      consentimentos: {
        ...data.consentimentos,
        [campo]: valor
      }
    });
  };

  const consentimentos = [
    {
      id: 'lgpd',
      titulo: 'Consentimento LGPD',
      descricao: 'Autorizo o tratamento dos meus dados pessoais de acordo com a Lei Geral de Proteção de Dados',
      obrigatorio: true,
      icone: <Security color="primary" />
    },
    {
      id: 'procedimentos',
      titulo: 'Consentimento para Procedimentos',
      descricao: 'Autorizo a realização de procedimentos médicos necessários conforme avaliação profissional',
      obrigatorio: true,
      icone: <Assignment color="primary" />
    },
    {
      id: 'comunicacao',
      titulo: 'Comunicação Eletrônica',
      descricao: 'Autorizo o envio de lembretes, resultados e comunicações via WhatsApp, email ou SMS',
      obrigatorio: false,
      icone: <InfoOutlined color="primary" />
    },
    {
      id: 'marketing',
      titulo: 'Comunicações de Marketing',
      descricao: 'Autorizo o recebimento de informações sobre novos serviços, promoções e conteúdo educativo',
      obrigatorio: false,
      icone: <VerifiedUser color="primary" />
    }
  ];

  const consentimentosObrigatorios = consentimentos.filter(c => c.obrigatorio);
  const todosObrigatoriosAceitos = consentimentosObrigatorios.every(c => 
    data.consentimentos?.[c.id] === true
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
        Consentimentos e Autorizações
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Para prosseguir com o cadastro, é necessário aceitar os consentimentos obrigatórios 
          relacionados à proteção de dados e procedimentos médicos.
        </Typography>
      </Alert>

      {/* Consentimentos Obrigatórios */}
      <Card sx={{ mb: 3, border: '2px solid', borderColor: 'error.light' }}>
        <CardContent>
          <Typography variant="subtitle1" color="error" gutterBottom>
            <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
            Consentimentos Obrigatórios
          </Typography>
          
          {consentimentosObrigatorios.map((consentimento) => (
            <Box key={consentimento.id} sx={{ mb: 2 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box display="flex" alignItems="flex-start" gap={2}>
                  {consentimento.icone}
                  <Box flex={1}>
                    <Typography variant="subtitle2" gutterBottom>
                      {consentimento.titulo}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {consentimento.descricao}
                    </Typography>
                    
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={data.consentimentos?.[consentimento.id] || false}
                          onChange={(e) => handleConsentimentoChange(consentimento.id, e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Typography variant="body2" fontWeight="medium">
                          Li e aceito este consentimento
                        </Typography>
                      }
                    />
                  </Box>
                  {data.consentimentos?.[consentimento.id] && (
                    <CheckCircle color="success" />
                  )}
                </Box>
              </Paper>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Consentimentos Opcionais */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" color="primary" gutterBottom>
            <InfoOutlined sx={{ mr: 1, verticalAlign: 'middle' }} />
            Consentimentos Opcionais
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Estes consentimentos são opcionais e podem melhorar sua experiência com nossos serviços.
          </Typography>
          
          {consentimentos.filter(c => !c.obrigatorio).map((consentimento) => (
            <Box key={consentimento.id} sx={{ mb: 2 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box display="flex" alignItems="flex-start" gap={2}>
                  {consentimento.icone}
                  <Box flex={1}>
                    <Typography variant="subtitle2" gutterBottom>
                      {consentimento.titulo}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {consentimento.descricao}
                    </Typography>
                    
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={data.consentimentos?.[consentimento.id] || false}
                          onChange={(e) => handleConsentimentoChange(consentimento.id, e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Typography variant="body2">
                          Aceito este consentimento
                        </Typography>
                      }
                    />
                  </Box>
                  {data.consentimentos?.[consentimento.id] && (
                    <CheckCircle color="success" />
                  )}
                </Box>
              </Paper>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Resumo */}
      <Card sx={{ mt: 3, bgcolor: todosObrigatoriosAceitos ? 'success.light' : 'warning.light' }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Status dos Consentimentos
          </Typography>
          
          <List dense>
            {consentimentos.map((consentimento) => (
              <ListItem key={consentimento.id} sx={{ py: 0.5 }}>
                <ListItemIcon>
                  <CheckCircle 
                    color={data.consentimentos?.[consentimento.id] ? 'success' : 'disabled'} 
                    fontSize="small"
                  />
                </ListItemIcon>
                <ListItemText 
                  primary={consentimento.titulo}
                  secondary={consentimento.obrigatorio ? 'Obrigatório' : 'Opcional'}
                />
              </ListItem>
            ))}
          </List>
          
          {!todosObrigatoriosAceitos && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              É necessário aceitar todos os consentimentos obrigatórios para continuar.
            </Alert>
          )}
        </CardContent>
      </Card>

      {errors.consentimentos && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errors.consentimentos}
        </Alert>
      )}
    </Box>
  );
};

export default ConsentimentosStep;
