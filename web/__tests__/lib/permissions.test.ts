// web/__tests__/lib/permissions.test.ts
import { describe, it, expect } from 'vitest'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

describe('hasPermission', () => {
  it('admin pode ler financeiro', () => {
    expect(hasPermission('admin', 'financeiro', 'read')).toBe(true)
  })

  it('admin pode deletar pacientes', () => {
    expect(hasPermission('admin', 'pacientes', 'delete')).toBe(true)
  })

  it('recepcionista não pode deletar prontuário', () => {
    expect(hasPermission('recepcionista', 'prontuario', 'delete')).toBe(false)
  })

  it('recepcionista pode criar checkin', () => {
    expect(hasPermission('recepcionista', 'checkin', 'create')).toBe(true)
  })

  it('medico não pode acessar financeiro', () => {
    expect(hasPermission('medico', 'financeiro', 'read')).toBe(false)
  })

  it('enfermeira pode criar prontuário', () => {
    expect(hasPermission('enfermeira', 'prontuario', 'create')).toBe(true)
  })

  it('admin_master tem acesso irrestrito', () => {
    expect(hasPermission('admin_master', 'qualquer-modulo', 'delete')).toBe(true)
  })

  it('perfil inexistente retorna false', () => {
    expect(hasPermission('hacker', 'financeiro', 'read')).toBe(false)
  })
})
