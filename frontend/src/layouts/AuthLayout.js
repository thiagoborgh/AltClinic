import React from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  Avatar,
  Stack 
} from '@mui/material';
import { MedicalServices } from '@mui/icons-material';

const AuthLayout = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: 4,
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            background: 'rgba(255, 255, 255, 0.95)',
          }}
        >
          {/* Header */}
          <Stack spacing={3} alignItems="center" mb={4}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              }}
            >
              <MedicalServices sx={{ fontSize: 32 }} />
            </Avatar>
            
            <Box textAlign="center">
              <Typography 
                variant="h4" 
                fontWeight="bold" 
                color="primary.main"
                gutterBottom
              >
                SAAE
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ maxWidth: 300 }}
              >
                Sistema de Agendamento Automatizado para Clínicas Estéticas
              </Typography>
            </Box>
          </Stack>

          {/* Content */}
          {children}
          
          {/* Footer */}
          <Box mt={4} pt={3} borderTop="1px solid" borderColor="divider">
            <Typography 
              variant="caption" 
              color="text.secondary" 
              textAlign="center"
              display="block"
            >
              © 2025 SAAE. Todos os direitos reservados.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthLayout;
