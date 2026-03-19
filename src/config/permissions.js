/**
 * Matrix de permissões RBAC do AltClinic.
 *
 * Estrutura: PERMISSIONS[perfil][modulo] = ['acao1', 'acao2', ...]
 *
 * Ações disponíveis: 'read', 'create', 'update', 'delete'
 * Módulos mapeiam para prefixos de rota: /api/{modulo}/
 */
const PERMISSIONS = {
  admin_master: {
    // Acesso irrestrito — verificado no middleware com lógica especial
    '*': ['read', 'create', 'update', 'delete'],
  },

  admin: {
    dashboard:      ['read'],
    agenda:         ['read', 'create', 'update', 'delete'],
    checkin:        ['read', 'create', 'update', 'delete'],
    pacientes:      ['read', 'create', 'update', 'delete'],
    prontuario:     ['read', 'create', 'update', 'delete'],
    profissionais:  ['read', 'create', 'update', 'delete'],
    crm:            ['read', 'create', 'update', 'delete'],
    whatsapp:       ['read', 'create', 'update', 'delete'],
    financeiro:     ['read', 'create', 'update', 'delete'],
    relatorios:     ['read'],
    configuracoes:  ['read', 'create', 'update', 'delete'],
    usuarios:       ['read', 'create', 'update', 'delete'],
  },

  recepcionista: {
    dashboard:      ['read'],
    agenda:         ['read', 'create', 'update'],
    checkin:        ['read', 'create', 'update', 'delete'],
    pacientes:      ['read', 'create', 'update'],
    whatsapp:       ['read', 'create'],
    financeiro:     ['read', 'create'],
    crm:            ['read'],
    // prontuario, relatorios, configuracoes: sem acesso
  },

  enfermeira: {
    dashboard:      ['read'],
    checkin:        ['read', 'create', 'update', 'delete'],
    pacientes:      ['read', 'create'],
    prontuario:     ['read', 'create'],  // apenas anotações de triagem
    agenda:         ['read'],
    // whatsapp, financeiro, crm, relatorios, configuracoes: sem acesso
  },

  medico: {
    dashboard:      ['read'],
    agenda:         ['read'],       // apenas sua própria agenda
    pacientes:      ['read'],       // apenas seus pacientes
    prontuario:     ['read', 'create', 'update', 'delete'],
    checkin:        ['read'],       // apenas fila de espera
    relatorios:     ['read'],       // apenas próprios procedimentos
    // whatsapp, financeiro, crm, configuracoes: sem acesso
  },

  financeiro: {
    dashboard:      ['read'],
    financeiro:     ['read', 'create', 'update', 'delete'],
    relatorios:     ['read'],
    pacientes:      ['read'],       // apenas dados de cobrança
    whatsapp:       ['read', 'create'],  // apenas envio de cobranças
    crm:            ['read'],
    // agenda, prontuario, configuracoes: sem acesso
  },
};

/**
 * Verifica se um perfil tem permissão para uma ação em um módulo.
 *
 * @param {string} perfil - Perfil do usuário
 * @param {string} modulo - Módulo alvo
 * @param {string} acao   - Ação desejada: 'read' | 'create' | 'update' | 'delete'
 * @returns {boolean}
 */
function hasPermission(perfil, modulo, acao) {
  const perfilPerms = PERMISSIONS[perfil];
  if (!perfilPerms) return false;

  // admin_master tem acesso irrestrito
  if (perfilPerms['*']) return true;

  const moduloPerms = perfilPerms[modulo];
  if (!moduloPerms) return false;

  return moduloPerms.includes(acao);
}

module.exports = { PERMISSIONS, hasPermission };
