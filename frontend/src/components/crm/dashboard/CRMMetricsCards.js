import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Skeleton
} from '@mui/material';
import {
  People,
  TrendingUp,
  Message,
  PersonOff,
  Refresh
} from '@mui/icons-material';

const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon, 
  color = 'primary', 
  loading = false,
  onClick
}) => {
  const getChangeColor = (change) => {
    if (change > 0) return 'success.main';
    if (change < 0) return 'error.main';
    return 'text.secondary';
  };

  const getChangeIcon = (change) => {
    if (change > 0) return '↗';
    if (change < 0) return '↘';
    return '→';
  };

  const formatChange = (change) => {
    if (change === undefined || change === null) return '';
    return `${getChangeIcon(change)} ${Math.abs(change)}`;
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: 3
        } : {}
      }}
      onClick={onClick}
      className="crm-metric-card"
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box flex={1}>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            
            {loading ? (
              <Skeleton variant="text" width="60%" height={40} />
            ) : (
              <Typography variant="h4" component="div" fontWeight="bold">
                {value}
              </Typography>
            )}
            
            {change !== undefined && !loading && (
              <Box sx={{ mt: 1 }}>
                <Chip
                  size="small"
                  label={`${formatChange(change)} vs mês anterior`}
                  sx={{
                    backgroundColor: getChangeColor(change),
                    color: 'white',
                    fontSize: '0.75rem',
                    height: 20
                  }}
                />
              </Box>
            )}
          </Box>
          
          <Box
            sx={{
              backgroundColor: loading ? 'grey.200' : `${color}.light`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ml: 2
            }}
          >
            {loading ? (
              <Skeleton variant="circular" width={32} height={32} />
            ) : (
              React.cloneElement(icon, { 
                sx: { color: `${color}.main`, fontSize: 32 } 
              })
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const CRMMetricsCards = ({ metrics = {}, loading = false, onRefresh }) => {
  const metricsData = [
    {
      title: 'Pacientes Ativos',
      value: metrics.pacientes_ativos || 0,
      change: metrics.change_pacientes_ativos,
      icon: <People />,
      color: 'primary',
      key: 'ativos'
    },
    {
      title: 'Taxa de Engajamento',
      value: loading ? '...' : `${metrics.taxa_engajamento || 0}%`,
      change: metrics.change_engajamento,
      icon: <TrendingUp />,
      color: 'success',
      key: 'engajamento'
    },
    {
      title: 'Mensagens Este Mês',
      value: metrics.mensagens_mes || 0,
      change: metrics.change_mensagens,
      icon: <Message />,
      color: 'info',
      key: 'mensagens'
    },
    {
      title: 'Pacientes Inativos',
      value: metrics.pacientes_inativos || 0,
      change: metrics.change_inativos,
      icon: <PersonOff />,
      color: 'warning',
      key: 'inativos'
    }
  ];

  const handleCardClick = (key) => {
    console.log(`Clicou no card: ${key}`);
    // Aqui implementaremos navegação ou modais específicos
  };

  return (
    <Box>
      <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          Métricas Principais
        </Typography>
        {onRefresh && (
          <IconButton onClick={onRefresh} disabled={loading} size="small">
            <Refresh />
          </IconButton>
        )}
      </Box>
      
      <Grid container spacing={3}>
        {metricsData.map((metric) => (
          <Grid item xs={12} sm={6} md={3} key={metric.key}>
            <MetricCard
              title={metric.title}
              value={metric.value}
              change={metric.change}
              icon={metric.icon}
              color={metric.color}
              loading={loading}
              onClick={() => handleCardClick(metric.key)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CRMMetricsCards;
