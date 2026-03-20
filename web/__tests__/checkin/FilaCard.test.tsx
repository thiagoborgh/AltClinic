import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { FilaItem } from '@/types/checkin'

const baseItem: FilaItem = {
  fila_id: 1,
  checkin_id: 10,
  paciente_id: 5,
  paciente_nome: 'Maria Silva',
  profissional_id: 3,
  profissional_nome: 'Dr. Carlos',
  posicao: 2,
  status: 'aguardando_triagem',
  tempo_espera_minutos: 15,
  alerta_espera_longa: false,
  triagem: null,
}

describe('FilaCard', () => {
  it('deve renderizar nome e posição do paciente', async () => {
    const { FilaCard } = await import('@/components/checkin/FilaCard')
    render(
      <FilaCard
        item={baseItem}
        perfil="recepcionista"
        onEncaminharTriagem={vi.fn()}
        onRegistrarTriagem={vi.fn()}
        onChamar={vi.fn()}
        onFinalizar={vi.fn()}
      />
    )
    expect(screen.getByText('Maria Silva')).toBeDefined()
    expect(screen.getByText(/#2/)).toBeDefined()
  })

  it('deve mostrar botão "Encaminhar para triagem" para recepcionista em aguardando_triagem', async () => {
    const onEncaminhar = vi.fn()
    const { FilaCard } = await import('@/components/checkin/FilaCard')
    render(
      <FilaCard
        item={baseItem}
        perfil="recepcionista"
        onEncaminharTriagem={onEncaminhar}
        onRegistrarTriagem={vi.fn()}
        onChamar={vi.fn()}
        onFinalizar={vi.fn()}
      />
    )
    const btn = screen.getByRole('button', { name: /encaminhar/i })
    expect(btn).toBeDefined()
    fireEvent.click(btn)
    expect(onEncaminhar).toHaveBeenCalledWith(1)
  })

  it('deve mostrar botão "Registrar triagem" para enfermeira em em_triagem', async () => {
    const onRegistrar = vi.fn()
    const { FilaCard } = await import('@/components/checkin/FilaCard')
    render(
      <FilaCard
        item={{ ...baseItem, status: 'em_triagem' }}
        perfil="enfermeira"
        onEncaminharTriagem={vi.fn()}
        onRegistrarTriagem={onRegistrar}
        onChamar={vi.fn()}
        onFinalizar={vi.fn()}
      />
    )
    const btn = screen.getByRole('button', { name: /registrar triagem/i })
    expect(btn).toBeDefined()
    fireEvent.click(btn)
    expect(onRegistrar).toHaveBeenCalledWith(1)
  })

  it('deve mostrar botão "Chamar paciente" para médico em aguardando_atendimento', async () => {
    const onChamar = vi.fn()
    const { FilaCard } = await import('@/components/checkin/FilaCard')
    render(
      <FilaCard
        item={{ ...baseItem, status: 'aguardando_atendimento' }}
        perfil="medico"
        onEncaminharTriagem={vi.fn()}
        onRegistrarTriagem={vi.fn()}
        onChamar={onChamar}
        onFinalizar={vi.fn()}
      />
    )
    const btn = screen.getByRole('button', { name: /chamar/i })
    fireEvent.click(btn)
    expect(onChamar).toHaveBeenCalledWith(1)
  })

  it('deve mostrar badge de espera longa quando alerta_espera_longa=true', async () => {
    const { FilaCard } = await import('@/components/checkin/FilaCard')
    render(
      <FilaCard
        item={{ ...baseItem, tempo_espera_minutos: 35, alerta_espera_longa: true }}
        perfil="recepcionista"
        onEncaminharTriagem={vi.fn()}
        onRegistrarTriagem={vi.fn()}
        onChamar={vi.fn()}
        onFinalizar={vi.fn()}
      />
    )
    expect(screen.getByTestId('alerta-espera')).toBeDefined()
  })

  it('deve exibir queixa quando triagem está registrada', async () => {
    const { FilaCard } = await import('@/components/checkin/FilaCard')
    render(
      <FilaCard
        item={{
          ...baseItem,
          status: 'aguardando_atendimento',
          triagem: { queixa_principal: 'Dor de cabeça intensa', pressao: '120/80' },
        }}
        perfil="medico"
        onEncaminharTriagem={vi.fn()}
        onRegistrarTriagem={vi.fn()}
        onChamar={vi.fn()}
        onFinalizar={vi.fn()}
      />
    )
    expect(screen.getByText(/Dor de cabeça intensa/)).toBeDefined()
  })
})
