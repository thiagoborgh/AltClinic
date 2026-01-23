import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

// Hooks
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useTrialManager } from './hooks/useTrialManager';
import { crmService } from './services/api';

// Components
import LoadingSpinner from './components/common/LoadingSpinner';
import LicenseSelector from './components/Auth/LicenseSelector';
import TrialExpiredModal from './components/TrialExpiredModal';
import OnboardingWizard from './components/common/OnboardingWizard';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayoutNew';

// Lazy loaded pages
const Login = lazy(() => import('./pages/Login'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const DashboardNew = lazy(() => import('./pages/DashboardNew'));
const AgendaNova = lazy(() => import('./pages/AgendaNova'));
const AgendaLite = lazy(() => import('./pages/AgendaLite'));
const ListaPacientesNova = lazy(() => import('./pages/ListaPacientesNova'));
const CadastroPacienteNovo = lazy(() => import('./pages/CadastroPacienteNovo'));
const ProfissionaisMedicosNovo = lazy(() => import('./pages/ProfissionaisMedicosNovo'));
const CadastroProfissionalNovo = lazy(() => import('./pages/CadastroProfissionalNovo'));
const SalaEspera = lazy(() => import('./pages/SalaEspera'));
const FinanceiroDashboard = lazy(() => import('./pages/financeiro/FinanceiroDashboard'));
const CRMDashboard = lazy(() => import('./pages/crm/CRMDashboard'));
const Relatorios = lazy(() => import('./pages/Relatorios'));
const Configuracoes = lazy(() => import('./pages/Configuracoes.js'));
const WhatsApp = lazy(() => import('./pages/WhatsApp'));
const BillingPage = lazy(() => import('./pages/billing/BillingPage'));
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
  } = useAuth();

  // Hook para gerenciar trial
  const {
    showTrialExpiredModal,
    closeTrialExpiredModal,
    handleUpgrade
  } = useTrialManager();

  // Estado para onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Verificar status do onboarding quando usuário está autenticado
  useEffect(() => {
    if (isAuthenticated && !onboardingCompleted) {
      checkOnboardingStatus();
    }
  }, [isAuthenticated, onboardingCompleted]);

  const checkOnboardingStatus = async () => {
    try {
      const response = await crmService.getOnboardingStatus();
      if (response.success) {
        const { isCompleted } = response.data;
        if (!isCompleted) {
          setShowOnboarding(true);
        } else {
          setOnboardingCompleted(true);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status do onboarding:', error);
      // Em caso de erro, não bloquear o usuário
      setOnboardingCompleted(true);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setOnboardingCompleted(true);
  };  if (loading) {
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
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
        {/* Landing Page - rota pública - temporariamente desabilitada */}
        {/* <Route path="/landing" element={<LandingPage />} /> */}
        
        {/* Rota raiz - redireciona baseado na autenticação */}
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/agenda-lite" replace /> : 
          <Navigate to="/login" replace />
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
        
        {/* Rota removida - não é mais necessário especificar slug na URL */}
        {/* O backend detecta automaticamente o tenant pelo email */}
        
        <Route path="/reset-password" element={
          <AuthLayout><ResetPassword /></AuthLayout>
        } />
        
        {/* Layout protegido com rotas aninhadas */}
        {isAuthenticated && (
          <Route path="/" element={<DashboardLayout />}>
            <Route path="dashboard" element={<DashboardNew />} />
            <Route path="agendamentos" element={<AgendaNova />} />
            <Route path="agenda-lite" element={<AgendaLite />} />
            <Route path="pacientes" element={<ListaPacientesNova />} />
            <Route path="cadastro-paciente" element={<CadastroPacienteNovo />} />
            <Route path="profissionais" element={<ProfissionaisMedicosNovo />} />
            <Route path="cadastro-profissional" element={<CadastroProfissionalNovo />} />
            <Route path="espera" element={<SalaEspera />} />
            <Route path="financeiro" element={<FinanceiroDashboard />} />
            <Route path="crm" element={<CRMDashboard />} />
            <Route path="whatsapp" element={<WhatsApp />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="configuracoes" element={<Configuracoes />} />
            <Route path="billing" element={<BillingPage />} />
            {/* <Route path="billing" element={<BillingPage />} /> */}
          </Route>
        )}

        {/* Rota 404 */}
        <Route path="*" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } />
      </Routes>
      </Suspense>

      {/* Modal de Seleção de Licença */}
      <LicenseSelector
        open={showLicenseSelector}
        onClose={() => setShowLicenseSelector(false)}
        licenses={licenses}
        user={user}
        onSelectLicense={selectLicense}
        loading={loginLoading}
      />

      {/* Modal de Trial Expirado */}
      <TrialExpiredModal
        open={showTrialExpiredModal}
        onClose={closeTrialExpiredModal}
        onUpgrade={handleUpgrade}
      />

      {/* Onboarding Wizard */}
      <OnboardingWizard
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
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
