import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

// Hooks
import { AuthProvider, useAuth } from './hooks/useAuth';

// Components
import LoadingSpinner from './components/common/LoadingSpinner';
import LicenseSelector from './components/Auth/LicenseSelector';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayoutNew';

// Pages
import Login from './pages/Login';
import OnboardingPage from './pages/OnboardingPage';
import MultiTenantLogin from './pages/MultiTenantLogin';
import LandingPage from './pages/LandingPage';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Agendamentos from './pages/Agendamentos';
import ListaPacientes from './pages/ListaPacientes';
import CadastroPaciente from './pages/CadastroPaciente';
import ProfissionaisMedicos from './pages/ProfissionaisMedicos';
import SalaEspera from './pages/SalaEspera';
import Financeiro from './pages/Financeiro';
import CRM from './pages/CRM';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';

// Componente interno que usa o contexto de auth
const AppContent = () => {
  const { 
    isAuthenticated, 
    loading, 
    showLicenseSelector, 
    setShowLicenseSelector, 
    licenses, 
    user, 
    selectLicense,
    loginLoading
  } = useAuth();  if (loading) {
    console.log('Mostrando tela de loading');
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner message="Verificando autenticação..." />
      </Box>
    );
  }

  console.log('Renderizando rotas principais');
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Routes>
        {/* Landing Page - rota pública */}
        <Route path="/landing" element={<LandingPage />} />
        
        {/* Rota raiz - redireciona baseado na autenticação */}
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : 
          <Navigate to="/landing" replace />
        } />

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
        
        <Route path="/reset-password" element={
          <AuthLayout><ResetPassword /></AuthLayout>
        } />
        
        {/* Layout protegido com rotas aninhadas */}
        {isAuthenticated && (
          <Route path="/" element={<DashboardLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="agendamentos" element={<Agendamentos />} />
            <Route path="pacientes" element={<ListaPacientes />} />
            <Route path="cadastro-paciente" element={<CadastroPaciente />} />
            <Route path="profissionais" element={<ProfissionaisMedicos />} />
            <Route path="espera" element={<SalaEspera />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="crm" element={<CRM />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="configuracoes" element={<Configuracoes />} />
            {/* <Route path="billing" element={<BillingPage />} /> */}
          </Route>
        )}

        {/* Rota 404 */}
        <Route path="*" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } />
      </Routes>

      {/* Modal de Seleção de Licença */}
      <LicenseSelector
        open={showLicenseSelector}
        onClose={() => setShowLicenseSelector(false)}
        licenses={licenses}
        user={user}
        onSelectLicense={selectLicense}
        loading={loginLoading}
      />
    </Box>
  );
};

// Componente principal
function App() {
  console.log('App com rotas completas renderizando...');
  
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
