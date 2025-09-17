import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Licencas from './pages/Licencas';
import CadastroLicenca from './pages/CadastroLicenca';
import Financeiro from './pages/Financeiro';
import ConfiguracoesFinanceiras from './pages/ConfiguracoesFinanceiras';
import CRM from './pages/CRM';
import Automacao from './pages/Automacao';
import Configuracoes from './pages/Configuracoes';
import Relatorios from './pages/Relatorios';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/licencas" element={<Licencas />} />
        <Route path="/nova-licenca" element={<CadastroLicenca />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/configuracoes-financeiras" element={<ConfiguracoesFinanceiras />} />
        <Route path="/crm" element={<CRM />} />
        <Route path="/automacao" element={<Automacao />} />
        <Route path="/configuracoes/:licencaId" element={<Configuracoes />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
