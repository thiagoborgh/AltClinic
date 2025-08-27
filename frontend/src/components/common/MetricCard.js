import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const MetricCard = ({ title, value, variation, icon: Icon, color = 'primary' }) => {
  const isPositive = variation >= 0;
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" color="text.secondary" fontSize="0.875rem">
            {title}
          </Typography>
          {Icon && (
            <Box
              sx={{
                backgroundColor: `${color}.main`,
                borderRadius: '8px',
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon sx={{ color: 'white', fontSize: '1.25rem' }} />
            </Box>
          )}
        </Box>
        
        <Typography variant="h4" fontWeight="bold" mb={1}>
          {value}
        </Typography>
        
        {variation !== undefined && (
          <Box display="flex" alignItems="center">
            {isPositive ? (
              <TrendingUp sx={{ color: 'success.main', fontSize: '1rem', mr: 0.5 }} />
            ) : (
              <TrendingDown sx={{ color: 'error.main', fontSize: '1rem', mr: 0.5 }} />
            )}
            <Typography
              variant="body2"
              color={isPositive ? 'success.main' : 'error.main'}
              fontWeight="medium"
            >
              {isPositive ? '+' : ''}{variation}% vs. mês anterior
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
