// Configuração de features do sistema
// Controla quais funcionalidades estão habilitadas para simplificar a experiência MVP

// Função helper para ler variável de ambiente com fallback
const getEnvFeature = (envVar, defaultValue = false) => {
  const value = process.env[envVar];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
};

export const FEATURES_ENABLED = {
  // Funcionalidades principais (sempre visíveis por padrão)
  agenda: getEnvFeature('REACT_APP_FEATURE_AGENDA', true),
  pacientes: getEnvFeature('REACT_APP_FEATURE_PACIENTES', true),
  profissionais: getEnvFeature('REACT_APP_FEATURE_PROFISSIONAIS', true),
  whatsapp: getEnvFeature('REACT_APP_FEATURE_WHATSAPP', true),
  configuracoes: getEnvFeature('REACT_APP_FEATURE_CONFIGURACOES', true),

  // Funcionalidades avançadas (ocultas por padrão no MVP)
  dashboard: getEnvFeature('REACT_APP_FEATURE_DASHBOARD', false),
  financeiro: getEnvFeature('REACT_APP_FEATURE_FINANCEIRO', false),
  crm_avancado: getEnvFeature('REACT_APP_FEATURE_CRM_AVANCADO', false),
  relatorios: getEnvFeature('REACT_APP_FEATURE_RELATORIOS', false),
  sala_espera: getEnvFeature('REACT_APP_FEATURE_SALA_ESPERA', false),
  licencas: getEnvFeature('REACT_APP_FEATURE_LICENCAS', false),

  // Funcionalidades experimentais
  automacoes_avancadas: getEnvFeature('REACT_APP_FEATURE_AUTOMACOES_AVANCADAS', false),
  integracoes_externas: getEnvFeature('REACT_APP_FEATURE_INTEGRACOES_EXTERNAS', false),
  multi_clinica: getEnvFeature('REACT_APP_FEATURE_MULTI_CLINICA', false),
};

// Função helper para verificar se uma feature está habilitada
export const isFeatureEnabled = (featureName) => {
  return FEATURES_ENABLED[featureName] === true;
};

// Função para habilitar uma feature (útil para desenvolvimento/debugging)
export const enableFeature = (featureName) => {
  if (FEATURES_ENABLED.hasOwnProperty(featureName)) {
    FEATURES_ENABLED[featureName] = true;
  }
};

// Função para desabilitar uma feature
export const disableFeature = (featureName) => {
  if (FEATURES_ENABLED.hasOwnProperty(featureName)) {
    FEATURES_ENABLED[featureName] = false;
  }
};