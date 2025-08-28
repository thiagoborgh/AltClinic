import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

// Hooks
import { useAuthStore } from './store/authStore';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayoutNew';

// Pages
import Login from './pages/Login';
import OnboardingPage from './pages/OnboardingPage';
import MultiTenantLogin from './pages/MultiTenantLogin';
import Dashboard from './pages/DashboardNew';
import AgendaFuncional from './pages/AgendaFuncional';
import Pacientes from './pages/Pacientes';
import Propostas from './pages/Propostas';
import Prontuarios from './pages/Prontuarios';
import CRM from './pages/crm/CRMDashboard';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import FinanceiroDashboard from './pages/financeiro/FinanceiroDashboard';

// Components
import LoadingSpinner from './components/common/LoadingSpinner';
import ToastProvider from './components/common/ToastProvider';

function App() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : 
          <AuthLayout><Login /></AuthLayout>
        } />
        
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : 
          <AuthLayout><OnboardingPage /></AuthLayout>
        } />
        
        <Route path="/login/:slug" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : 
          <AuthLayout><MultiTenantLogin /></AuthLayout>
        } />

        {/* Rotas protegidas */}
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : 
          <Navigate to="/login" replace />
        } />
        
        {/* Layout protegido com rotas aninhadas */}
        <Route path="/" element={
          isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" replace />
        }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="agendamentos" element={<AgendaFuncional />} />
          <Route path="pacientes" element={<Pacientes />} />
          <Route path="financeiro" element={<FinanceiroDashboard />} />
          <Route path="propostas" element={<Propostas />} />
          <Route path="prontuarios" element={<Prontuarios />} />
          <Route path="crm" element={<CRM />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>

        {/* Rota 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      
      {/* Toast Provider Global */}
      <ToastProvider />
    </Box>
  );
}

export default App;
