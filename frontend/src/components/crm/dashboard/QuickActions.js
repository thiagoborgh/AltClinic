import React from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Message,
  People,
  Assessment,
  Settings,
  Send,
  PersonAdd,
  BarChart,
  Tune
} from '@mui/icons-material';

const QuickActions = ({ onAction }) => {
  const quickActions = [
    {
      id: 'new-message',
      title: 'Nova Mensagem',
      subtitle: 'Enviar para segmento',
      icon: <Message />,
      color: 'primary',
      tooltip: 'Criar e enviar nova mensagem para pacientes'
    },
    {
      id: 'view-patients',
      title: 'Ver Pacientes',
      subtitle: 'Gerenciar contatos',
      icon: <People />,
      color: 'secondary',
      tooltip: 'Visualizar e gerenciar lista de pacientes'
    },
    {
      id: 'activation-report',
      title: 'Relatório Ativação',
      subtitle: 'Pacientes inativos',
      icon: <Assessment />,
      color: 'warning',
      tooltip: 'Gerar relatório de pacientes para reativação'
    },
    {
      id: 'settings',
      title: 'Configurações',
      subtitle: 'Templates e automação',
      icon: <Settings />,
      color: 'info',
      tooltip: 'Configurar templates e automações'
    },
    {
      id: 'bulk-send',
      title: 'Envio em Massa',
      subtitle: 'Campanha rápida',
      icon: <Send />,
      color: 'success',
      tooltip: 'Enviar mensagem para múltiplos pacientes'
    },
    {
      id: 'add-segment',
      title: 'Novo Segmento',
      subtitle: 'Criar grupo',
      icon: <PersonAdd />,
      color: 'primary',
      tooltip: 'Criar novo segmento de pacientes'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      subtitle: 'Métricas detalhadas',
      icon: <BarChart />,
      color: 'secondary',
      tooltip: 'Visualizar métricas e gráficos detalhados'
    },
    {
      id: 'automation',
      title: 'Automação',
      subtitle: 'Configurar regras',
      icon: <Tune />,
      color: 'info',
      tooltip: 'Configurar automações e triggers'
    }
  ];

  const handleAction = (actionId) => {
    console.log(`Ação rápida: ${actionId}`);
    
    // Simular ações específicas
    switch (actionId) {
      case 'new-message':
        // Aqui abriria o modal de nova mensagem
        break;
      case 'view-patients':
        // Aqui navegaria para a página de pacientes
        break;
      case 'activation-report':
        // Aqui geraria o relatório de ativação
        break;
      case 'settings':
        // Aqui navegaria para configurações
        break;
      default:
        break;
    }
    
    // Callback para componente pai
    if (onAction) {
      onAction(actionId);
    }
  };

  return (
    <Paper sx={{ p: 3 }} className="crm-quick-actions">
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Ações Rápidas
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Acesse rapidamente as principais funcionalidades do CRM
      </Typography>
      
      <Grid container spacing={2}>
        {quickActions.map((action) => (
          <Grid item xs={6} sm={4} md={6} key={action.id}>
            <Tooltip title={action.tooltip} arrow>
              <Button
                fullWidth
                variant="outlined"
                color={action.color}
                onClick={() => handleAction(action.id)}
                sx={{ 
                  py: 2,
                  px: 1,
                  flexDirection: 'column',
                  gap: 1,
                  minHeight: 80,
                  borderRadius: 2,
                  textTransform: 'none',
                  '& .MuiButton-startIcon': {
                    margin: 0,
                    fontSize: '1.5rem'
                  },
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: 2
                  }
                }}
                startIcon={action.icon}
                className="crm-quick-action-btn"
              >
                <Box textAlign="center">
                  <Typography variant="body2" fontWeight="medium">
                    {action.title}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {action.subtitle}
                  </Typography>
                </Box>
              </Button>
            </Tooltip>
          </Grid>
        ))}
      </Grid>
      
      {/* Estatísticas rápidas */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="caption" color="textSecondary" display="block" mb={1}>
          Estatísticas Rápidas (Últimas 24h)
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Box textAlign="center">
              <Typography variant="h6" color="primary.main">
                12
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Mensagens
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={4}>
            <Box textAlign="center">
              <Typography variant="h6" color="success.main">
                8
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Respostas
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={4}>
            <Box textAlign="center">
              <Typography variant="h6" color="warning.main">
                3
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Agendados
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default QuickActions;
