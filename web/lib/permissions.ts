// web/lib/permissions.ts
export type Perfil = 'admin_master' | 'admin' | 'recepcionista' | 'enfermeira' | 'medico' | 'financeiro'
export type Modulo = 'dashboard' | 'agenda' | 'checkin' | 'pacientes' | 'prontuario' | 'profissionais' | 'crm' | 'whatsapp' | 'financeiro' | 'relatorios' | 'configuracoes' | 'usuarios'
export type Acao = 'read' | 'create' | 'update' | 'delete'

type PerfilPermissions = Partial<Record<Modulo, Acao[]>> & { '*'?: Acao[] }

export const PERMISSIONS: Record<Perfil, PerfilPermissions> = {
  admin_master: {
    '*': ['read', 'create', 'update', 'delete'],
  },
  admin: {
    dashboard:     ['read'],
    agenda:        ['read', 'create', 'update', 'delete'],
    checkin:       ['read', 'create', 'update', 'delete'],
    pacientes:     ['read', 'create', 'update', 'delete'],
    prontuario:    ['read', 'create', 'update', 'delete'],
    profissionais: ['read', 'create', 'update', 'delete'],
    crm:           ['read', 'create', 'update', 'delete'],
    whatsapp:      ['read', 'create', 'update', 'delete'],
    financeiro:    ['read', 'create', 'update', 'delete'],
    relatorios:    ['read'],
    configuracoes: ['read', 'create', 'update', 'delete'],
    usuarios:      ['read', 'create', 'update', 'delete'],
  },
  recepcionista: {
    dashboard:  ['read'],
    agenda:     ['read', 'create', 'update'],
    checkin:    ['read', 'create', 'update', 'delete'],
    pacientes:  ['read', 'create', 'update'],
    whatsapp:   ['read', 'create'],
    financeiro: ['read', 'create'],
    crm:        ['read'],
  },
  enfermeira: {
    dashboard:  ['read'],
    checkin:    ['read', 'create', 'update', 'delete'],
    pacientes:  ['read', 'create'],
    prontuario: ['read', 'create'],
    agenda:     ['read'],
  },
  medico: {
    dashboard:  ['read'],
    agenda:     ['read'],
    pacientes:  ['read'],
    prontuario: ['read', 'create', 'update', 'delete'],
    checkin:    ['read'],
    relatorios: ['read'],
  },
  financeiro: {
    dashboard:  ['read'],
    financeiro: ['read', 'create', 'update', 'delete'],
    relatorios: ['read'],
    pacientes:  ['read'],
    whatsapp:   ['read', 'create'],
    crm:        ['read'],
  },
}

export function hasPermission(perfil: string, modulo: string, acao: Acao): boolean {
  const perfilPerms = PERMISSIONS[perfil as Perfil]
  if (!perfilPerms) return false
  if (perfilPerms['*']) return true
  const moduloPerms = perfilPerms[modulo as Modulo]
  if (!moduloPerms) return false
  return moduloPerms.includes(acao)
}
