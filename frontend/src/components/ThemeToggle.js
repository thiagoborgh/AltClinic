import React from 'react';
import { Box, Button, Tooltip } from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';

// Botão flutuante para teste A/B de tema
// Persiste escolha no localStorage entre reloads
const ThemeToggle = ({ currentTheme, onToggle }) => {
  const isA = currentTheme === 'A';

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
      }}
    >
      <Tooltip
        title={`Tema ${currentTheme === 'A' ? 'A — Original' : 'B — Rebrand'} ativo. Clique para alternar.`}
        placement="left"
      >
        <Button
          variant="contained"
          onClick={onToggle}
          startIcon={<PaletteIcon sx={{ fontSize: 16 }} />}
          sx={{
            borderRadius: 20,
            px: 2,
            py: 0.8,
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'none',
            letterSpacing: 0.3,
            background: isA
              ? 'linear-gradient(135deg, #1565c0, #9c27b0)'
              : 'linear-gradient(135deg, #1A3A6B, #8B2FC4)',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            border: '2px solid rgba(255,255,255,0.2)',
            '&:hover': {
              opacity: 0.92,
              boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
            },
          }}
        >
          Tema {currentTheme} → {isA ? 'B' : 'A'}
        </Button>
      </Tooltip>
    </Box>
  );
};

export default ThemeToggle;
