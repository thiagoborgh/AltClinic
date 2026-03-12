import { createTheme } from '@mui/material/styles';

// Tema B — AltClinic Rebrand
// Derivado do logo: Azul marinho (#1A3A6B) + Roxo (#8B2FC4)
const themeB = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#8B2FC4',
      light: '#B56FD8',
      dark: '#6B1FA0',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#1A3A6B',
      light: '#2D5A9E',
      dark: '#0F2347',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F6FA',
      paper: '#FFFFFF',
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
    },
    warning: {
      main: '#F59E0B',
      light: '#FCD34D',
      dark: '#D97706',
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
    },
    info: {
      main: '#3B82F6',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
      disabled: '#94A3B8',
    },
    divider: '#E2E8F0',
    action: {
      hover: 'rgba(139, 47, 196, 0.07)',
      selected: 'rgba(139, 47, 196, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
    button: { fontWeight: 500 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        },
      },
    },
    // Sidebar com fundo do logo (azul marinho escuro)
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1A3A6B',
          color: '#CBD5E1',
          borderRight: 'none',
          boxShadow: '2px 0 8px rgba(0,0,0,0.12)',
        },
      },
    },
    // Divisor adaptado para fundo escuro na sidebar
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255,255,255,0.1)',
        },
      },
    },
    // AppBar branca com sombra sutil (mais profissional)
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#0F172A',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          borderBottom: '1px solid #E2E8F0',
        },
      },
    },
    // Cabeçalho de tabelas
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: '#64748B',
            backgroundColor: '#F8FAFC',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
        },
      },
    },
    // Chips / badges de status
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    // Input fields com borda mais visível
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#8B2FC4',
          },
        },
      },
    },
  },
});

export default themeB;
