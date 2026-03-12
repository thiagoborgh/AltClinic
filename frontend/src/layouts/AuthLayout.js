import React from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  Avatar,
  Stack 
} from '@mui/material';
import Logo from '../components/common/Logo';

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
                width: 80, 
                height: 80, 
                bgcolor: 'transparent',
                background: 'transparent',
              }}
            >
              <Logo 
                variant="only" 
                size="large"
                sx={{ 
                  width: '100%', 
                  height: '100%'
                }} 
              />
            </Avatar>            <Box textAlign="center">
              <Logo 
                variant="text" 
                size="large"
                sx={{ 
                  mb: 1,
                  maxWidth: 200
                }} 
              />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ maxWidth: 300 }}
              >
                Gestão completa para sua clínica
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
              © 2026 AltClinic SaaS. Todos os direitos reservados.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthLayout;
