import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Toaster } from 'react-hot-toast';
import 'dayjs/locale/pt-br';

import App from './App';
import themeA from './themes/themeA';
import themeB from './themes/themeB';
import ThemeToggle from './components/ThemeToggle';

// Configuração do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

// Wrapper para suportar teste A/B de tema
const AppWithTheme = () => {
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem('altclinic_theme_ab') || 'A';
  });

  const theme = activeTheme === 'A' ? themeA : themeB;

  const toggleTheme = () => {
    const next = activeTheme === 'A' ? 'B' : 'A';
    setActiveTheme(next);
    localStorage.setItem('altclinic_theme_ab', next);
  };

  const toastBg = activeTheme === 'A' ? '#333' : '#0F172A';
  const toastSuccess = activeTheme === 'A' ? '#2e7d32' : '#059669';
  const toastError = activeTheme === 'A' ? '#d32f2f' : '#DC2626';

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
        <CssBaseline />
        <App />
        <ThemeToggle currentTheme={activeTheme} onToggle={toggleTheme} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: toastBg,
              color: '#fff',
            },
            success: {
              style: { background: toastSuccess },
            },
            error: {
              style: { background: toastError },
            },
          }}
        />
      </LocalizationProvider>
    </ThemeProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AppWithTheme />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
