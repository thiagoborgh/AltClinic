const FEATURE_FLAGS_PADRAO = {
  trial: {
    whatsapp_ativo: false, crm_ativo: false, ia_basica: false, ia_completa: false,
    qr_billing: false, relatorios_avancados: false, max_profissionais: 2, api_access: false,
  },
  starter: {
    whatsapp_ativo: true, crm_ativo: false, ia_basica: false, ia_completa: false,
    qr_billing: true, relatorios_avancados: false, max_profissionais: 5, api_access: false,
  },
  pro: {
    whatsapp_ativo: true, crm_ativo: true, ia_basica: true, ia_completa: false,
    qr_billing: true, relatorios_avancados: true, max_profissionais: 15, api_access: false,
  },
  enterprise: {
    whatsapp_ativo: true, crm_ativo: true, ia_basica: true, ia_completa: true,
    qr_billing: true, relatorios_avancados: true, max_profissionais: null, api_access: true,
  }
};

module.exports = { FEATURE_FLAGS_PADRAO };
