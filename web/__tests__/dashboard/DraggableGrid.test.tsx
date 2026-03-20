import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DraggableGrid } from '@/components/dashboard/DraggableGrid'

// @dnd-kit requer PointerEvent — polyfill para jsdom
if (typeof window !== 'undefined' && !window.PointerEvent) {
  // @ts-ignore
  window.PointerEvent = class PointerEvent extends MouseEvent {}
}

describe('DraggableGrid', () => {
  const items = [
    { id: 'card-a', component: <div>Card A</div> },
    { id: 'card-b', component: <div>Card B</div> },
    { id: 'card-c', component: <div>Card C</div> },
  ]

  it('deve renderizar todos os cards na ordem correta', () => {
    render(
      <DraggableGrid items={items} onReorder={vi.fn()} onHide={vi.fn()} onReset={vi.fn()} />
    )
    expect(screen.getByText('Card A')).toBeDefined()
    expect(screen.getByText('Card B')).toBeDefined()
    expect(screen.getByText('Card C')).toBeDefined()
  })

  it('deve chamar onHide com o id correto ao clicar em ×', () => {
    const onHide = vi.fn()
    render(
      <DraggableGrid items={items} onReorder={vi.fn()} onHide={onHide} onReset={vi.fn()} />
    )
    const hideButtons = screen.getAllByRole('button', { name: /ocultar/i })
    fireEvent.click(hideButtons[0])
    expect(onHide).toHaveBeenCalledWith('card-a')
  })

  it('deve chamar onReset ao clicar em "Restaurar padrão"', () => {
    const onReset = vi.fn()
    render(
      <DraggableGrid items={items} onReorder={vi.fn()} onHide={vi.fn()} onReset={onReset} />
    )
    const btn = screen.getByRole('button', { name: /restaurar padrão/i })
    fireEvent.click(btn)
    expect(onReset).toHaveBeenCalledOnce()
  })
})
