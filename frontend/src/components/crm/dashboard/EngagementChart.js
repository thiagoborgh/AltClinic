import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Skeleton,
  Paper,
  LinearProgress
} from '@mui/material';

const EngagementChart = ({ data = [], loading = false }) => {
  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Engajamento por Canal
        </Typography>
        <Box sx={{ mt: 3 }}>
          {[1, 2, 3].map((index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Skeleton variant="text" width="30%" height={24} />
              <Box sx={{ mt: 1, mb: 1 }}>
                <Skeleton variant="rectangular" width="100%" height={8} />
              </Box>
              <Box display="flex" gap={1}>
                <Skeleton variant="rectangular" width={80} height={24} />
                <Skeleton variant="rectangular" width={80} height={24} />
                <Skeleton variant="rectangular" width={80} height={24} />
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Engajamento por Canal
        </Typography>
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 4,
            color: 'text.secondary'
          }}
        >
          <Typography variant="body1">
            Nenhum dado de engajamento disponível
          </Typography>
        </Box>
      </Paper>
    );
  }

  const getChannelColor = (canal) => {
    const colors = {
      'WhatsApp': '#25D366',
      'Email': '#EA4335', 
      'SMS': '#1976d2'
    };
    return colors[canal] || '#9e9e9e';
  };

  const getMetricColor = (type) => {
    const colors = {
      'abertura': 'primary',
      'resposta': 'secondary', 
      'conversao': 'success'
    };
    return colors[type] || 'default';
  };

  return (
    <Paper sx={{ p: 3 }} className="crm-chart-container">
      <Typography variant="h6" gutterBottom>
        Engajamento por Canal
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        {data.map((canal, index) => (
          <Box key={canal.canal} sx={{ mb: 3 }}>
            {/* Cabeçalho do Canal */}
            <Box 
              display="flex" 
              justifyContent="space-between" 
              alignItems="center" 
              mb={1}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: getChannelColor(canal.canal)
                  }}
                />
                <Typography variant="body1" fontWeight="medium">
                  {canal.canal}
                </Typography>
              </Box>
              
              <Typography variant="body2" color="textSecondary">
                {canal.enviadas} enviadas
              </Typography>
            </Box>
            
            {/* Métricas em Chips */}
            <Box display="flex" gap={1} mb={1.5} flexWrap="wrap">
              <Chip 
                size="small" 
                label={`${canal.abertura}% abertura`}
                color={getMetricColor('abertura')}
                variant="outlined"
              />
              <Chip 
                size="small" 
                label={`${canal.resposta}% resposta`}
                color={getMetricColor('resposta')}
                variant="outlined"
              />
              <Chip 
                size="small" 
                label={`${canal.conversao}% conversão`}
                color={getMetricColor('conversao')}
                variant="outlined"
              />
            </Box>
            
            {/* Barra de Progresso Visual */}
            <Box sx={{ position: 'relative' }}>
              <LinearProgress
                variant="determinate"
                value={canal.abertura}
                sx={{
                  height: 8,
                  borderRadius: 1,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getChannelColor(canal.canal),
                    borderRadius: 1
                  }
                }}
                className="crm-engagement-bar"
              />
              
              {/* Indicadores de resposta e conversão */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: `${canal.resposta}%`,
                  width: 2,
                  height: 8,
                  backgroundColor: 'white',
                  border: '1px solid #666',
                  zIndex: 1
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: `${canal.conversao}%`,
                  width: 2,
                  height: 8,
                  backgroundColor: 'success.main',
                  zIndex: 1
                }}
              />
            </Box>
            
            {/* Legenda das barras */}
            <Box display="flex" justifyContent="space-between" sx={{ mt: 0.5 }}>
              <Typography variant="caption" color="textSecondary">
                0%
              </Typography>
              <Typography variant="caption" color="textSecondary">
                100%
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
      
      {/* Legenda */}
      <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="caption" color="textSecondary">
          💡 Linha branca: taxa de resposta | Linha verde: taxa de conversão
        </Typography>
      </Box>
    </Paper>
  );
};

export default EngagementChart;
