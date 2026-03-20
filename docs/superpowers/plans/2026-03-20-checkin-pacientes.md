# Check-in de Pacientes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a tela `/checkin` com duas abas — lista de agendamentos do dia com ação de check-in e fila de espera em tempo real via socket.io — com ações por perfil (recepcionista, enfermeira, médico).

**Architecture:** Página única `'use client'` com tabs baseadas em estado; `useTenant().user.perfil` determina quais ações são visíveis em cada card. TanStack Query v5 gerencia cache; `useFila` conecta socket.io e invalida o cache ao receber `fila:update`. Backend ganha uma linha em cada handler de fila-espera para emitir o evento socket.io além do SSE já existente.

**Tech Stack:** Next.js 14 App Router, TypeScript, TanStack Query v5 (`invalidateQueries({ queryKey: [...] })`), socket.io-client (`getSocket()` de `@/lib/socket`), axios (`api` de `@/lib/api`), lucide-react (ícones), Tailwind CSS, `@base-ui/react` (Badge, Button já disponíveis)

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `src/routes/fila-espera.js` | Modificar | Adicionar emit socket.io após cada `emitFilaEvent()` |
| `web/types/checkin.ts` | Criar | Tipos TypeScript: Agendamento, FilaItem, payloads |
| `web/hooks/useCheckins.ts` | Criar | GET /api/checkins?data=hoje |
| `web/hooks/useCheckin.ts` | Criar | Mutation POST /api/checkins com optimistic update |
| `web/hooks/useFila.ts` | Criar | GET /api/fila + socket.io invalidação |
| `web/hooks/useFilaActions.ts` | Criar | POST fila/:id/triagem/chamar \| chamar \| finalizar |
| `web/hooks/useTriagem.ts` | Criar | Mutation POST /api/fila/triagens |
| `web/components/checkin/AlertaBadge.tsx` | Criar | Badge inline fatura/dias sem visita |
| `web/components/checkin/FilaCard.tsx` | Criar | Card de paciente na fila com ações por perfil |
| `web/components/checkin/TriagemModal.tsx` | Criar | Modal de sinais vitais (enfermeira) |
| `web/components/checkin/AgendamentosTab.tsx` | Criar | Aba 1: lista filtrada + CheckinButton |
| `web/components/checkin/FilaTab.tsx` | Criar | Aba 2: fila em tempo real |
| `web/app/(app)/checkin/page.tsx` | Criar | Página com tabs, conecta contexto |
| `web/__tests__/checkin/useCheckin.test.ts` | Criar | POST, optimistic update, rollback |
| `web/__tests__/checkin/FilaCard.test.tsx` | Criar | Ações por perfil, badge espera longa, queixa |
| `web/__tests__/checkin/TriagemModal.test.tsx` | Criar | Validação, submit, comportamentos de erro |
| `web/__tests__/checkin/AgendamentosTab.test.tsx` | Criar | Filtro, badge inline, botão some após check-in |

---

## Chunk 1: Backend + Types + Hooks

### Task 1: Backend — Emitir `fila:update` via socket.io

**Files:**
- Modify: `src/routes/fila-espera.js` (linhas 171, 264, 341, e na rota `/triagens`)

**Context:** O arquivo já importa `emitFilaEvent` e usa `const tenantId = req.tenantId || req.usuario?.tenant_slug` antes de cada chamada. A instância `io` fica em `req.app.get('io')`. Não há testes automáticos para backend neste sprint — verificar manualmente que o arquivo compila sem erros.

- [ ] **Step 1: Ler o arquivo para localizar as 4 chamadas emitFilaEvent**

  ```bash
  grep -n "emitFilaEvent" src/routes/fila-espera.js
  ```

  Expected: 4 linhas (triagem/chamar ~171, chamar ~264, finalizar ~341, triagens ~??)

- [ ] **Step 2: Adicionar emit socket.io após cada `emitFilaEvent()` — triagem/chamar**

  Localizar o bloco que começa com `emitFilaEvent(tenantId, {` no handler `POST /:id/triagem/chamar` (~linha 171). Após esse bloco (após o `});`), adicionar:

  ```javascript
  const io = req.app.get('io')
  if (io) io.to(tenantId).emit('fila:update', { tipo: 'status_alterado', fila_id: parseInt(id) })
  ```

- [ ] **Step 3: Adicionar emit socket.io após cada `emitFilaEvent()` — chamar**

  Localizar o bloco `emitFilaEvent(tenantId, {` no handler `POST /:id/chamar` (~linha 264). Adicionar o mesmo padrão após o fechamento do bloco:

  ```javascript
  const io = req.app.get('io')
  if (io) io.to(tenantId).emit('fila:update', { tipo: 'status_alterado', fila_id: parseInt(id) })
  ```

- [ ] **Step 4: Adicionar emit socket.io após cada `emitFilaEvent()` — finalizar**

  Localizar `emitFilaEvent(tenantId, {` no handler `POST /:id/finalizar` (~linha 341). Adicionar após o fechamento:

  ```javascript
  const io = req.app.get('io')
  if (io) io.to(tenantId).emit('fila:update', { tipo: 'atendimento_finalizado', fila_id: parseInt(id) })
  ```

- [ ] **Step 5: Adicionar emit socket.io no handler `/triagens`**

  Localizar o handler `router.post('/triagens', ...)` — encontrar onde `emitFilaEvent` é chamado (ou onde o `return res.json(...)` acontece). Adicionar antes do `return res.json`:

  ```javascript
  const io = req.app.get('io')
  if (io) io.to(tenantId).emit('fila:update', { tipo: 'triagem_registrada', fila_espera_id: parseInt(fila_espera_id) })
  ```

  Se não houver `emitFilaEvent` no handler de triagens, adicionar o emit socket.io onde `tenantId` já está disponível.

- [ ] **Step 6: Verificar que o Node.js não reporta erros de sintaxe**

  ```bash
  node --check src/routes/fila-espera.js
  ```

  Expected: nenhuma saída (sem erros)

- [ ] **Step 7: Adicionar `a.status AS agendamento_status` ao SELECT de GET /api/checkins**

  Em `src/routes/checkins.js` (~linha 54), o `SELECT` na query principal não inclui o status do agendamento. Localizar o SELECT e adicionar `a.status AS agendamento_status,` após `a.procedimento,`:

  ```sql
  a.procedimento,
  a.status           AS agendamento_status,
  ```

  Isso permite o filtro client-side por status de agendamento na `AgendamentosTab`.

- [ ] **Step 8: Verificar que `checkins.js` não tem erros de sintaxe**

  ```bash
  node --check src/routes/checkins.js
  ```

  Expected: sem saída

- [ ] **Step 9: Commit**

  ```bash
  git add src/routes/fila-espera.js src/routes/checkins.js
  git commit -m "feat(backend): socket.io fila:update + agendamento_status no GET checkins"
  ```

---

### Task 2: TypeScript Types

**Files:**
- Create: `web/types/checkin.ts`

- [ ] **Step 1: Criar o arquivo de tipos**

  ```typescript
  // web/types/checkin.ts

  /** Status do agendamento (tabela agendamentos) */
  export type StatusAgendamento =
    | 'agendado' | 'confirmado' | 'cancelado' | 'no_show' | 'finalizado'

  /**
   * Status do check-in — backend: COALESCE(c.status, 'aguardando')
   * 'aguardando' = sem check-in ainda (c.id IS NULL)
   * 'presente' = check-in criado (antes do atendimento começar)
   */
  export type CheckinStatus = 'aguardando' | 'presente'

  /** Item retornado pelo GET /api/checkins */
  export interface Agendamento {
    agendamento_id: number  // nota: backend retorna 'agendamento_id', não 'id'
    paciente_id: number
    paciente_nome: string
    profissional_id: number
    profissional_nome: string
    horario_marcado: string  // nota: backend retorna 'horario_marcado', não 'data_hora'
    agendamento_status: StatusAgendamento  // backend: a.status AS agendamento_status
    checkin_status: CheckinStatus          // 'aguardando' = botão check-in visível
    alertas?: {
      fatura_aberta: number
      ultimo_atendimento_dias: number
    }
  }

  /** Status do item na fila de espera */
  export type StatusFila =
    | 'aguardando_triagem' | 'em_triagem' | 'aguardando_atendimento'
    | 'em_atendimento' | 'finalizado' | 'cancelado'

  /** Item retornado pelo GET /api/fila */
  export interface FilaItem {
    fila_id: number
    checkin_id: number
    paciente_id: number
    paciente_nome: string
    profissional_id: number
    profissional_nome: string
    posicao: number
    status: StatusFila
    tempo_espera_minutos: number
    alerta_espera_longa: boolean
    triagem?: {
      pressao?: string
      peso?: number
      temperatura?: number
      saturacao?: number
      queixa_principal: string
      observacoes?: string
    } | null  // backend retorna null quando não há triagem (não undefined)
  }

  /** Payload do POST /api/checkins */
  export interface CheckinPayload {
    agendamento_id: number
    paciente_id: number
    profissional_id: number
    observacao?: string
  }

  /** Payload do POST /api/fila/triagens */
  export interface TriagemPayload {
    fila_espera_id: number
    checkin_id: number
    pressao?: string
    peso?: number
    temperatura?: number
    saturacao?: number
    queixa_principal: string
    observacoes?: string
  }
  ```

- [ ] **Step 2: Verificar que o TypeScript compila**

  ```bash
  cd web && npx tsc --noEmit --project tsconfig.json 2>&1 | head -20
  ```

  Expected: sem erros relativos a `types/checkin.ts`

- [ ] **Step 3: Commit**

  ```bash
  git add web/types/checkin.ts
  git commit -m "feat(types): adicionar tipos TypeScript para check-in"
  ```

---

### Task 3: Hook `useCheckins` — lista de agendamentos do dia

**Files:**
- Create: `web/hooks/useCheckins.ts`

- [ ] **Step 1: Criar o hook**

  ```typescript
  // web/hooks/useCheckins.ts
  import { useQuery } from '@tanstack/react-query'
  import api from '@/lib/api'
  import type { Agendamento } from '@/types/checkin'

  export function useCheckins() {
    return useQuery<Agendamento[]>({
      queryKey: ['checkins'],
      queryFn: async () => {
        const { data } = await api.get('/checkins', { params: { data: 'hoje' } })
        return data.data ?? []
      },
      staleTime: 2 * 60 * 1000, // 2 min
    })
  }
  ```

- [ ] **Step 2: Verificar TypeScript**

  ```bash
  cd web && npx tsc --noEmit 2>&1 | grep checkins
  ```

  Expected: sem saída (sem erros)

- [ ] **Step 3: Commit**

  ```bash
  git add web/hooks/useCheckins.ts
  git commit -m "feat(hooks): useCheckins — GET /api/checkins"
  ```

---

### Task 4: Hook `useCheckin` + teste

**Files:**
- Create: `web/hooks/useCheckin.ts`
- Create: `web/__tests__/checkin/useCheckin.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

  ```typescript
  // web/__tests__/checkin/useCheckin.test.ts
  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { renderHook, waitFor, act } from '@testing-library/react'
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
  import { createElement } from 'react'
  import type { Agendamento } from '@/types/checkin'

  vi.mock('@/lib/api', () => ({
    default: { get: vi.fn(), post: vi.fn() },
  }))

  function createWrapper() {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: qc }, children)
  }

  describe('useCheckin', () => {
    beforeEach(() => vi.clearAllMocks())

    it('deve chamar POST /api/checkins com o payload', async () => {
      const { default: api } = await import('@/lib/api')
      vi.mocked(api.post).mockResolvedValueOnce({
        data: { success: true, data: { checkin_id: 1, posicao_fila: 2, alertas: { fatura_aberta: 0, ultimo_atendimento_dias: null } } },
      })

      const { useCheckin } = await import('@/hooks/useCheckin')
      const { result } = renderHook(() => useCheckin(), { wrapper: createWrapper() })

      await act(async () => {
        result.current.mutate({
          agendamento_id: 10,
          paciente_id: 5,
          profissional_id: 3,
        })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(api.post).toHaveBeenCalledWith('/checkins', {
        agendamento_id: 10,
        paciente_id: 5,
        profissional_id: 3,
      })
    })

    it('deve aplicar optimistic update: checkin_status = aguardando', async () => {
      const agendamentos: Agendamento[] = [
        {
          agendamento_id: 10,
          paciente_id: 5,
          paciente_nome: 'Ana',
          profissional_id: 3,
          profissional_nome: 'Dr. Carlos',
          horario_marcado: '2026-03-20T09:00:00Z',
          agendamento_status: 'agendado',
          checkin_status: 'aguardando',
        },
      ]

      const { default: api } = await import('@/lib/api')
      vi.mocked(api.post).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: { success: true, data: { checkin_id: 1, posicao_fila: 1, alertas: {} } } }), 200)))

      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      qc.setQueryData(['checkins'], agendamentos)

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        createElement(QueryClientProvider, { client: qc }, children)

      const { useCheckin } = await import('@/hooks/useCheckin')
      const { result } = renderHook(() => useCheckin(), { wrapper })

      act(() => {
        result.current.mutate({ agendamento_id: 10, paciente_id: 5, profissional_id: 3 })
      })

      await waitFor(() => {
        const cached = qc.getQueryData<Agendamento[]>(['checkins'])
        // Optimistic update: deve mudar para 'presente' enquanto POST está pendente
        expect(cached?.find(a => a.agendamento_id === 10)?.checkin_status).toBe('presente')
      })
    })

    it('deve reverter optimistic update em caso de erro', async () => {
      const agendamentos: Agendamento[] = [
        {
          agendamento_id: 10,
          paciente_id: 5,
          paciente_nome: 'Ana',
          profissional_id: 3,
          profissional_nome: 'Dr. Carlos',
          horario_marcado: '2026-03-20T09:00:00Z',
          agendamento_status: 'agendado',
          checkin_status: 'aguardando',
        },
      ]

      const { default: api } = await import('@/lib/api')
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Network error'))

      const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
      qc.setQueryData(['checkins'], agendamentos)

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        createElement(QueryClientProvider, { client: qc }, children)

      const { useCheckin } = await import('@/hooks/useCheckin')
      const { result } = renderHook(() => useCheckin(), { wrapper })

      await act(async () => {
        result.current.mutate({ agendamento_id: 10, paciente_id: 5, profissional_id: 3 })
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      const cached = qc.getQueryData<Agendamento[]>(['checkins'])
      // Rollback: deve voltar para 'aguardando'
      expect(cached?.find(a => a.agendamento_id === 10)?.checkin_status).toBe('aguardando')
    })
  })
  ```

- [ ] **Step 2: Rodar o teste — deve falhar**

  ```bash
  cd web && node node_modules/vitest/vitest.mjs run __tests__/checkin/useCheckin.test.ts
  ```

  Expected: FAIL (módulo `@/hooks/useCheckin` não existe)

- [ ] **Step 3: Implementar o hook**

  ```typescript
  // web/hooks/useCheckin.ts
  import { useMutation, useQueryClient } from '@tanstack/react-query'
  import api from '@/lib/api'
  import type { Agendamento, CheckinPayload } from '@/types/checkin'

  export function useCheckin() {
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: async (payload: CheckinPayload) => {
        const { data } = await api.post('/checkins', payload)
        // Backend retorna posicao_fila (não posicao)
        return data.data as {
          checkin_id: number
          posicao_fila: number
          alertas: { fatura_aberta: number; ultimo_atendimento_dias: number | null }
        }
      },
      onMutate: async (payload) => {
        await queryClient.cancelQueries({ queryKey: ['checkins'] })
        const previous = queryClient.getQueryData<Agendamento[]>(['checkins'])
        queryClient.setQueryData<Agendamento[]>(['checkins'], (old) =>
          old?.map(a =>
            a.agendamento_id === payload.agendamento_id
              ? { ...a, checkin_status: 'presente' as const }
              : a
          ) ?? []
        )
        return { previous }
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) {
          queryClient.setQueryData(['checkins'], context.previous)
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['checkins'] })
      },
    })
  }
  ```

- [ ] **Step 4: Rodar o teste — deve passar**

  ```bash
  cd web && node node_modules/vitest/vitest.mjs run __tests__/checkin/useCheckin.test.ts
  ```

  Expected: 3/3 PASS

- [ ] **Step 5: Commit**

  ```bash
  git add web/hooks/useCheckin.ts web/__tests__/checkin/useCheckin.test.ts
  git commit -m "feat(hooks): useCheckin — POST /api/checkins com optimistic update"
  ```

---

### Task 5: Hooks de fila — `useFila`, `useFilaActions`, `useTriagem`

**Files:**
- Create: `web/hooks/useFila.ts`
- Create: `web/hooks/useFilaActions.ts`
- Create: `web/hooks/useTriagem.ts`

**Context:** `useFila` deve conectar socket.io no mount. `getSocket()` retorna o singleton (autoConnect: false), então é preciso chamar `.connect()` explicitamente. O room join é `socket.emit('join', tenantId)` onde `tenantId = user.tenant_slug`. O hook recebe `tenantId` como parâmetro para evitar depender do contexto diretamente.

- [ ] **Step 1: Criar `useFila`**

  ```typescript
  // web/hooks/useFila.ts
  import { useEffect } from 'react'
  import { useQuery, useQueryClient } from '@tanstack/react-query'
  import api from '@/lib/api'
  import { getSocket } from '@/lib/socket'
  import type { FilaItem } from '@/types/checkin'

  export function useFila(tenantId: string | undefined) {
    const queryClient = useQueryClient()

    const query = useQuery<FilaItem[]>({
      queryKey: ['fila'],
      queryFn: async () => {
        const { data } = await api.get('/fila')
        return data.data ?? []
      },
      staleTime: 30 * 1000, // 30s
      enabled: !!tenantId,
    })

    useEffect(() => {
      if (!tenantId) return

      const socket = getSocket()
      socket.connect()
      socket.emit('join', tenantId)

      const handleUpdate = () => {
        queryClient.invalidateQueries({ queryKey: ['fila'] })
      }

      socket.on('fila:update', handleUpdate)

      return () => {
        socket.off('fila:update', handleUpdate)
        socket.disconnect()
      }
    }, [tenantId, queryClient])

    return query
  }
  ```

- [ ] **Step 2: Criar `useFilaActions`**

  ```typescript
  // web/hooks/useFilaActions.ts
  import { useMutation, useQueryClient } from '@tanstack/react-query'
  import api from '@/lib/api'

  export function useFilaActions() {
    const queryClient = useQueryClient()

    const invalidateFila = () =>
      queryClient.invalidateQueries({ queryKey: ['fila'] })

    const encaminharTriagem = useMutation({
      mutationFn: async (filaId: number) => {
        const { data } = await api.post(`/fila/${filaId}/triagem/chamar`)
        return data.data
      },
      onSuccess: invalidateFila,
    })

    const chamarAtendimento = useMutation({
      mutationFn: async (filaId: number) => {
        const { data } = await api.post(`/fila/${filaId}/chamar`)
        return data.data
      },
      onSuccess: invalidateFila,
    })

    const finalizar = useMutation({
      mutationFn: async (filaId: number) => {
        const { data } = await api.post(`/fila/${filaId}/finalizar`)
        return data.data
      },
      onSuccess: invalidateFila,
    })

    return { encaminharTriagem, chamarAtendimento, finalizar }
  }
  ```

- [ ] **Step 3: Criar `useTriagem`**

  ```typescript
  // web/hooks/useTriagem.ts
  import { useMutation, useQueryClient } from '@tanstack/react-query'
  import api from '@/lib/api'
  import type { TriagemPayload } from '@/types/checkin'

  export function useTriagem(onClose: () => void) {
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: async (payload: TriagemPayload) => {
        const { data } = await api.post('/fila/triagens', payload)
        return data.data
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['fila'] })
        onClose()
      },
    })
  }
  ```

- [ ] **Step 4: Verificar TypeScript**

  ```bash
  cd web && npx tsc --noEmit 2>&1 | grep -E "useFila|useFilaActions|useTriagem"
  ```

  Expected: sem saída (sem erros)

- [ ] **Step 5: Commit**

  ```bash
  git add web/hooks/useFila.ts web/hooks/useFilaActions.ts web/hooks/useTriagem.ts
  git commit -m "feat(hooks): useFila + useFilaActions + useTriagem"
  ```

---

## Chunk 2: Components + Tests + Page

### Task 6: Componente `AlertaBadge`

**Files:**
- Create: `web/components/checkin/AlertaBadge.tsx`

**Context:** Badge inline discreto. Usa `lucide-react` para ícones (`AlertTriangle`, `Calendar`). Renderiza nada se ambos os props forem falsy.

- [ ] **Step 1: Criar o componente**

  ```tsx
  // web/components/checkin/AlertaBadge.tsx
  import { AlertTriangle, Calendar } from 'lucide-react'
  import { cn } from '@/lib/utils'

  interface AlertaBadgeProps {
    faturaAberta?: number   // valor em R$, ex: 250.50
    diasSemVisita?: number  // dias desde último atendimento
  }

  export function AlertaBadge({ faturaAberta, diasSemVisita }: AlertaBadgeProps) {
    const temFatura = faturaAberta != null && faturaAberta > 0
    const temDias = diasSemVisita != null && diasSemVisita > 90

    if (!temFatura && !temDias) return null

    return (
      <span className="inline-flex items-center gap-1">
        {temFatura && (
          <span
            className="inline-flex items-center gap-0.5 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-1.5 py-0.5"
            title={`Fatura em aberto: R$ ${faturaAberta!.toFixed(2)}`}
            data-testid="badge-fatura"
          >
            <AlertTriangle className="h-3 w-3" />
            R${faturaAberta!.toFixed(0)}
          </span>
        )}
        {temDias && (
          <span
            className="inline-flex items-center gap-0.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5"
            title={`${diasSemVisita} dias sem visita`}
            data-testid="badge-dias"
          >
            <Calendar className="h-3 w-3" />
            {diasSemVisita}d
          </span>
        )}
      </span>
    )
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add web/components/checkin/AlertaBadge.tsx
  git commit -m "feat(checkin): componente AlertaBadge"
  ```

---

### Task 7: Componente `FilaCard` + teste

**Files:**
- Create: `web/components/checkin/FilaCard.tsx`
- Create: `web/__tests__/checkin/FilaCard.test.tsx`

**Context:** Mostra posição, nome, tempo de espera, status pill, queixa (se triagem registrada) e ações condicionais por perfil × status. Ações:
- Recepcionista + `aguardando_triagem` → "Encaminhar para triagem"
- Enfermeira + `em_triagem` → "Registrar triagem"
- Médico + `aguardando_atendimento` → "Chamar paciente"
- Médico + `em_atendimento` → "Finalizar"

- [ ] **Step 1: Escrever o teste que falha**

  ```tsx
  // web/__tests__/checkin/FilaCard.test.tsx
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
  ```

- [ ] **Step 2: Rodar o teste — deve falhar**

  ```bash
  cd web && node node_modules/vitest/vitest.mjs run __tests__/checkin/FilaCard.test.tsx
  ```

  Expected: FAIL (módulo `@/components/checkin/FilaCard` não existe)

- [ ] **Step 3: Implementar `FilaCard`**

  ```tsx
  // web/components/checkin/FilaCard.tsx
  import { AlertTriangle } from 'lucide-react'
  import { cn } from '@/lib/utils'
  import type { FilaItem, StatusFila } from '@/types/checkin'

  const STATUS_LABEL: Record<StatusFila, string> = {
    aguardando_triagem: 'Aguardando triagem',
    em_triagem: 'Em triagem',
    aguardando_atendimento: 'Aguardando atendimento',
    em_atendimento: 'Em atendimento',
    finalizado: 'Finalizado',
    cancelado: 'Cancelado',
  }

  const STATUS_COLOR: Record<StatusFila, string> = {
    aguardando_triagem: 'bg-yellow-100 text-yellow-800',
    em_triagem: 'bg-blue-100 text-blue-800',
    aguardando_atendimento: 'bg-purple-100 text-purple-800',
    em_atendimento: 'bg-green-100 text-green-800',
    finalizado: 'bg-gray-100 text-gray-600',
    cancelado: 'bg-red-100 text-red-700',
  }

  interface FilaCardProps {
    item: FilaItem
    perfil: string
    onEncaminharTriagem: (filaId: number) => void
    onRegistrarTriagem: (filaId: number) => void
    onChamar: (filaId: number) => void
    onFinalizar: (filaId: number) => void
  }

  export function FilaCard({
    item,
    perfil,
    onEncaminharTriagem,
    onRegistrarTriagem,
    onChamar,
    onFinalizar,
  }: FilaCardProps) {
    const { fila_id, paciente_nome, profissional_nome, posicao, status,
            tempo_espera_minutos, alerta_espera_longa, triagem } = item

    return (
      <div className="rounded-xl border bg-card p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-muted-foreground">#{posicao}</span>
            <div>
              <p className="font-semibold text-sm">{paciente_nome}</p>
              <p className="text-xs text-muted-foreground">{profissional_nome}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs text-muted-foreground">{tempo_espera_minutos}min</span>
            {alerta_espera_longa && (
              <AlertTriangle
                className="h-4 w-4 text-orange-500"
                data-testid="alerta-espera"
              />
            )}
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLOR[status])}>
              {STATUS_LABEL[status]}
            </span>
          </div>
        </div>

        {triagem?.queixa_principal && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Queixa:</span> {triagem.queixa_principal}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          {perfil === 'recepcionista' && status === 'aguardando_triagem' && (
            <button
              className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              onClick={() => onEncaminharTriagem(fila_id)}
            >
              Encaminhar para triagem
            </button>
          )}
          {perfil === 'enfermeira' && status === 'em_triagem' && (
            <button
              className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              onClick={() => onRegistrarTriagem(fila_id)}
            >
              Registrar triagem
            </button>
          )}
          {perfil === 'medico' && status === 'aguardando_atendimento' && (
            <button
              className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              onClick={() => onChamar(fila_id)}
            >
              Chamar paciente
            </button>
          )}
          {perfil === 'medico' && status === 'em_atendimento' && (
            <button
              className="text-xs px-3 py-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
              onClick={() => onFinalizar(fila_id)}
            >
              Finalizar
            </button>
          )}
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 4: Rodar o teste — deve passar**

  ```bash
  cd web && node node_modules/vitest/vitest.mjs run __tests__/checkin/FilaCard.test.tsx
  ```

  Expected: 5/5 PASS

- [ ] **Step 5: Commit**

  ```bash
  git add web/components/checkin/FilaCard.tsx web/__tests__/checkin/FilaCard.test.tsx
  git commit -m "feat(checkin): FilaCard com ações por perfil"
  ```

---

### Task 8: Componente `TriagemModal` + teste

**Files:**
- Create: `web/components/checkin/TriagemModal.tsx`
- Create: `web/__tests__/checkin/TriagemModal.test.tsx`

**Context:** Modal implementado como overlay div (sem biblioteca externa — mais testável). Campo `queixa_principal` é obrigatório; submit chama `POST /api/fila/triagens`. Em erro: exibe mensagem inline e mantém o modal aberto. O hook `useTriagem` recebe `onClose` como parâmetro e chama após sucesso.

- [ ] **Step 1: Escrever o teste que falha**

  ```tsx
  // web/__tests__/checkin/TriagemModal.test.tsx
  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { render, screen, fireEvent, waitFor } from '@testing-library/react'
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
  import { createElement } from 'react'

  vi.mock('@/lib/api', () => ({
    default: { post: vi.fn() },
  }))

  function createWrapper() {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    return ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: qc }, children)
  }

  describe('TriagemModal', () => {
    beforeEach(() => vi.clearAllMocks())

    it('não deve renderizar quando open=false', async () => {
      const { TriagemModal } = await import('@/components/checkin/TriagemModal')
      render(
        createElement(QueryClientProvider, {
          client: new QueryClient(),
          children: createElement(TriagemModal, {
            filaId: 1,
            checkinId: 10,
            pacienteNome: 'Ana',
            open: false,
            onClose: vi.fn(),
          }),
        })
      )
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('deve bloquear submit sem queixa_principal', async () => {
      const { default: api } = await import('@/lib/api')
      const { TriagemModal } = await import('@/components/checkin/TriagemModal')
      render(
        <TriagemModal filaId={1} checkinId={10} pacienteNome="Ana" open={true} onClose={vi.fn()} />,
        { wrapper: createWrapper() }
      )

      fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
      expect(screen.getByText(/queixa principal/i)).toBeDefined()
      expect(api.post).not.toHaveBeenCalled()
    })

    it('deve chamar POST /fila/triagens com payload correto e fechar modal', async () => {
      const { default: api } = await import('@/lib/api')
      vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true, data: {} } })
      const onClose = vi.fn()

      const { TriagemModal } = await import('@/components/checkin/TriagemModal')
      render(
        <TriagemModal filaId={1} checkinId={10} pacienteNome="Ana" open={true} onClose={onClose} />,
        { wrapper: createWrapper() }
      )

      fireEvent.change(screen.getByLabelText(/queixa principal/i), {
        target: { value: 'Dor de cabeça' },
      })
      fireEvent.click(screen.getByRole('button', { name: /salvar/i }))

      await waitFor(() => expect(onClose).toHaveBeenCalled())
      expect(api.post).toHaveBeenCalledWith('/fila/triagens', expect.objectContaining({
        fila_espera_id: 1,
        checkin_id: 10,
        queixa_principal: 'Dor de cabeça',
      }))
    })

    it('deve manter modal aberto e mostrar erro em caso de falha', async () => {
      const { default: api } = await import('@/lib/api')
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Erro interno'))
      const onClose = vi.fn()

      const { TriagemModal } = await import('@/components/checkin/TriagemModal')
      render(
        <TriagemModal filaId={1} checkinId={10} pacienteNome="Ana" open={true} onClose={onClose} />,
        { wrapper: createWrapper() }
      )

      fireEvent.change(screen.getByLabelText(/queixa principal/i), {
        target: { value: 'Dor' },
      })
      fireEvent.click(screen.getByRole('button', { name: /salvar/i }))

      await waitFor(() => expect(screen.getByTestId('triagem-error')).toBeDefined())
      expect(onClose).not.toHaveBeenCalled()
    })
  })
  ```

- [ ] **Step 2: Rodar o teste — deve falhar**

  ```bash
  cd web && node node_modules/vitest/vitest.mjs run __tests__/checkin/TriagemModal.test.tsx
  ```

  Expected: FAIL

- [ ] **Step 3: Implementar `TriagemModal`**

  ```tsx
  // web/components/checkin/TriagemModal.tsx
  'use client'
  import { useState } from 'react'
  import { useTriagem } from '@/hooks/useTriagem'

  interface TriagemModalProps {
    filaId: number
    checkinId: number
    pacienteNome: string
    open: boolean
    onClose: () => void
  }

  export function TriagemModal({ filaId, checkinId, pacienteNome, open, onClose }: TriagemModalProps) {
    const [pressao, setPressao] = useState('')
    const [peso, setPeso] = useState('')
    const [temperatura, setTemperatura] = useState('')
    const [saturacao, setSaturacao] = useState('')
    const [queixa, setQueixa] = useState('')
    const [observacoes, setObservacoes] = useState('')
    const [queixaError, setQueixaError] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)

    const triagem = useTriagem(onClose)

    if (!open) return null

    function handleSubmit(e: React.FormEvent) {
      e.preventDefault()
      if (!queixa.trim()) {
        setQueixaError(true)
        return
      }
      setQueixaError(false)
      setServerError(null)

      triagem.mutate(
        {
          fila_espera_id: filaId,
          checkin_id: checkinId,
          queixa_principal: queixa.trim(),
          pressao: pressao || undefined,
          peso: peso ? parseFloat(peso) : undefined,
          temperatura: temperatura ? parseFloat(temperatura) : undefined,
          saturacao: saturacao ? parseInt(saturacao) : undefined,
          observacoes: observacoes || undefined,
        },
        {
          onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Erro ao salvar triagem'
            setServerError(msg)
          },
        }
      )
    }

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Triagem de ${pacienteNome}`}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      >
        <div className="bg-background rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Triagem — {pacienteNome}</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="pressao">
                  Pressão arterial
                </label>
                <input
                  id="pressao"
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  placeholder="120/80"
                  value={pressao}
                  onChange={e => setPressao(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="peso">
                  Peso (kg)
                </label>
                <input
                  id="peso"
                  type="number"
                  step="0.1"
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  value={peso}
                  onChange={e => setPeso(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="temperatura">
                  Temperatura (°C)
                </label>
                <input
                  id="temperatura"
                  type="number"
                  step="0.1"
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  value={temperatura}
                  onChange={e => setTemperatura(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="saturacao">
                  Saturação O₂ (%)
                </label>
                <input
                  id="saturacao"
                  type="number"
                  min="0"
                  max="100"
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  value={saturacao}
                  onChange={e => setSaturacao(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="queixa">
                Queixa principal <span className="text-destructive">*</span>
              </label>
              <textarea
                id="queixa"
                className="w-full rounded-md border px-3 py-1.5 text-sm min-h-[72px] resize-none"
                placeholder="Descreva a queixa principal do paciente"
                value={queixa}
                onChange={e => { setQueixa(e.target.value); setQueixaError(false) }}
              />
              {queixaError && (
                <p className="text-xs text-destructive">Queixa principal é obrigatória</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="observacoes">
                Observações
              </label>
              <textarea
                id="observacoes"
                className="w-full rounded-md border px-3 py-1.5 text-sm min-h-[56px] resize-none"
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
              />
            </div>

            {serverError && (
              <p className="text-xs text-destructive" data-testid="triagem-error">
                {serverError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-md border hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={triagem.isPending}
                className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {triagem.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 4: Rodar o teste — deve passar**

  ```bash
  cd web && node node_modules/vitest/vitest.mjs run __tests__/checkin/TriagemModal.test.tsx
  ```

  Expected: 4/4 PASS

- [ ] **Step 5: Commit**

  ```bash
  git add web/components/checkin/TriagemModal.tsx web/__tests__/checkin/TriagemModal.test.tsx
  git commit -m "feat(checkin): TriagemModal com validação de queixa obrigatória"
  ```

---

### Task 9: Componente `AgendamentosTab` + teste

**Files:**
- Create: `web/components/checkin/AgendamentosTab.tsx`
- Create: `web/__tests__/checkin/AgendamentosTab.test.tsx`

**Context:** Recebe `agendamentos: Agendamento[]`, `perfil: string`, e callbacks. Filtro por `agendamento_status` (chips multi-select; padrão: `['agendado', 'confirmado']`). Toast de sucesso após check-in: mostra posição na fila + alertas. O toast é implementado como um estado interno: barra na parte superior que desaparece após 5s.

- [ ] **Step 1: Escrever o teste que falha**

  ```tsx
  // web/__tests__/checkin/AgendamentosTab.test.tsx
  import { describe, it, expect, vi } from 'vitest'
  import { render, screen, fireEvent } from '@testing-library/react'
  import type { Agendamento } from '@/types/checkin'

  const agendamentos: Agendamento[] = [
    {
      agendamento_id: 1,
      paciente_id: 5,
      paciente_nome: 'João Santos',
      profissional_id: 3,
      profissional_nome: 'Dr. Ana',
      horario_marcado: '2026-03-20T09:00:00Z',
      agendamento_status: 'agendado',
      checkin_status: 'aguardando',
    },
    {
      agendamento_id: 2,
      paciente_id: 6,
      paciente_nome: 'Maria Lima',
      profissional_id: 3,
      profissional_nome: 'Dr. Ana',
      horario_marcado: '2026-03-20T10:00:00Z',
      agendamento_status: 'cancelado',
      checkin_status: 'aguardando',
    },
    {
      agendamento_id: 3,
      paciente_id: 7,
      paciente_nome: 'Pedro Costa',
      profissional_id: 3,
      profissional_nome: 'Dr. Ana',
      horario_marcado: '2026-03-20T11:00:00Z',
      agendamento_status: 'agendado',
      checkin_status: 'aguardando',
      alertas: { fatura_aberta: 350, ultimo_atendimento_dias: 120 },
    },
  ]

  describe('AgendamentosTab', () => {
    it('deve filtrar por status padrão (agendado + confirmado) — não mostra cancelado', async () => {
      const { AgendamentosTab } = await import('@/components/checkin/AgendamentosTab')
      render(<AgendamentosTab agendamentos={agendamentos} perfil="recepcionista" onCheckin={vi.fn()} />)
      expect(screen.getByText('João Santos')).toBeDefined()
      expect(screen.queryByText('Maria Lima')).toBeNull() // cancelado = não aparece
    })

    it('deve mostrar badge de fatura quando alertas.fatura_aberta > 0', async () => {
      const { AgendamentosTab } = await import('@/components/checkin/AgendamentosTab')
      render(<AgendamentosTab agendamentos={agendamentos} perfil="recepcionista" onCheckin={vi.fn()} />)
      expect(screen.getByTestId('badge-fatura')).toBeDefined()
    })

    it('deve esconder botão check-in quando checkin_status é "presente"', async () => {
      const comCheckin: Agendamento[] = [
        { ...agendamentos[0], checkin_status: 'presente' },
      ]
      const { AgendamentosTab } = await import('@/components/checkin/AgendamentosTab')
      render(<AgendamentosTab agendamentos={comCheckin} perfil="recepcionista" onCheckin={vi.fn()} />)
      expect(screen.queryByRole('button', { name: /check-in/i })).toBeNull()
    })

    it('deve chamar onCheckin ao clicar em Fazer Check-in', async () => {
      const onCheckin = vi.fn()
      const { AgendamentosTab } = await import('@/components/checkin/AgendamentosTab')
      render(<AgendamentosTab agendamentos={[agendamentos[0]]} perfil="recepcionista" onCheckin={onCheckin} />)
      fireEvent.click(screen.getByRole('button', { name: /check-in/i }))
      expect(onCheckin).toHaveBeenCalledWith(agendamentos[0])
    })

    it('deve filtrar por "Todos" ao clicar no chip correspondente', async () => {
      const { AgendamentosTab } = await import('@/components/checkin/AgendamentosTab')
      render(<AgendamentosTab agendamentos={agendamentos} perfil="recepcionista" onCheckin={vi.fn()} />)
      fireEvent.click(screen.getByRole('button', { name: /todos/i }))
      expect(screen.getByText('Maria Lima')).toBeDefined() // cancelado agora aparece
    })
  })
  ```

- [ ] **Step 2: Rodar o teste — deve falhar**

  ```bash
  cd web && node node_modules/vitest/vitest.mjs run __tests__/checkin/AgendamentosTab.test.tsx
  ```

  Expected: FAIL

- [ ] **Step 3: Implementar `AgendamentosTab`**

  ```tsx
  // web/components/checkin/AgendamentosTab.tsx
  'use client'
  import { useState } from 'react'
  import { cn } from '@/lib/utils'
  import { AlertaBadge } from './AlertaBadge'
  import type { Agendamento, StatusAgendamento } from '@/types/checkin'

  const STATUS_OPTS: Array<{ label: string; value: StatusAgendamento | 'todos' }> = [
    { label: 'Todos', value: 'todos' },
    { label: 'Agendado', value: 'agendado' },
    { label: 'Confirmado', value: 'confirmado' },
    { label: 'Cancelado', value: 'cancelado' },
    { label: 'No-show', value: 'no_show' },
  ]

  const STATUS_COLOR: Record<StatusAgendamento, string> = {
    agendado: 'bg-blue-100 text-blue-800',
    confirmado: 'bg-green-100 text-green-800',
    cancelado: 'bg-red-100 text-red-700',
    no_show: 'bg-gray-100 text-gray-600',
    finalizado: 'bg-gray-100 text-gray-500',
  }

  interface AgendamentosTabProps {
    agendamentos: Agendamento[]
    perfil: string
    onCheckin: (agendamento: Agendamento) => void
  }

  export function AgendamentosTab({ agendamentos, perfil, onCheckin }: AgendamentosTabProps) {
    const [filtro, setFiltro] = useState<'todos' | StatusAgendamento[]>(['agendado', 'confirmado'])

    const filtrado = agendamentos.filter(a => {
      if (filtro === 'todos') return true
      return filtro.includes(a.agendamento_status)
    })

    function toggleFiltro(val: StatusAgendamento | 'todos') {
      if (val === 'todos') {
        setFiltro('todos')
        return
      }
      if (filtro === 'todos') {
        setFiltro([val])
        return
      }
      const arr = filtro as StatusAgendamento[]
      setFiltro(arr.includes(val) ? arr.filter(s => s !== val) : [...arr, val])
    }

    function isActive(val: StatusAgendamento | 'todos') {
      if (val === 'todos') return filtro === 'todos'
      if (filtro === 'todos') return false
      return (filtro as StatusAgendamento[]).includes(val)
    }

    return (
      <div className="space-y-4">
        {/* Chips de filtro */}
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => toggleFiltro(value)}
              className={cn(
                'text-xs px-3 py-1 rounded-full border transition-colors',
                isActive(value)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="space-y-2">
          {filtrado.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum agendamento para os filtros selecionados.
            </p>
          )}
          {filtrado.map(agendamento => {
            const hora = new Date(agendamento.horario_marcado).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })
            // 'aguardando' = sem check-in ainda (backend: COALESCE(c.status, 'aguardando') quando c.id IS NULL)
            const podeCheckin = agendamento.checkin_status === 'aguardando'

            return (
              <div
                key={agendamento.agendamento_id}
                className="rounded-xl border bg-card p-3 flex items-center gap-3"
              >
                {/* Avatar placeholder */}
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground flex-shrink-0">
                  {agendamento.paciente_nome.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold truncate">{agendamento.paciente_nome}</p>
                    <AlertaBadge
                      faturaAberta={agendamento.alertas?.fatura_aberta}
                      diasSemVisita={agendamento.alertas?.ultimo_atendimento_dias}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {agendamento.profissional_nome} · {hora}
                  </p>
                </div>

                {/* Status + ação */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLOR[agendamento.agendamento_status])}>
                    {agendamento.agendamento_status}
                  </span>
                  {podeCheckin && (
                    <button
                      onClick={() => onCheckin(agendamento)}
                      className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
                    >
                      Fazer Check-in
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 4: Rodar o teste — deve passar**

  ```bash
  cd web && node node_modules/vitest/vitest.mjs run __tests__/checkin/AgendamentosTab.test.tsx
  ```

  Expected: 5/5 PASS

- [ ] **Step 5: Commit**

  ```bash
  git add web/components/checkin/AgendamentosTab.tsx web/__tests__/checkin/AgendamentosTab.test.tsx
  git commit -m "feat(checkin): AgendamentosTab com filtro de status e check-in"
  ```

---

### Task 10: Componente `FilaTab`

**Files:**
- Create: `web/components/checkin/FilaTab.tsx`

**Context:** Renderiza a lista de `FilaItem[]` usando `FilaCard`. Gerencia o estado local de qual modal de triagem está aberto (`triageOpenId`).

- [ ] **Step 1: Criar `FilaTab`**

  ```tsx
  // web/components/checkin/FilaTab.tsx
  'use client'
  import { useState } from 'react'
  import { FilaCard } from './FilaCard'
  import { TriagemModal } from './TriagemModal'
  import type { FilaItem } from '@/types/checkin'

  interface FilaTabProps {
    items: FilaItem[]
    perfil: string
    onEncaminharTriagem: (filaId: number) => void
    onChamar: (filaId: number) => void
    onFinalizar: (filaId: number) => void
  }

  export function FilaTab({ items, perfil, onEncaminharTriagem, onChamar, onFinalizar }: FilaTabProps) {
    const [triagemAberta, setTriagemAberta] = useState<FilaItem | null>(null)

    if (items.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-12">
          Fila de espera vazia no momento.
        </p>
      )
    }

    return (
      <>
        <div className="space-y-3">
          {items.map(item => (
            <FilaCard
              key={item.fila_id}
              item={item}
              perfil={perfil}
              onEncaminharTriagem={onEncaminharTriagem}
              onRegistrarTriagem={() => setTriagemAberta(item)}
              onChamar={onChamar}
              onFinalizar={onFinalizar}
            />
          ))}
        </div>

        {triagemAberta && (
          <TriagemModal
            filaId={triagemAberta.fila_id}
            checkinId={triagemAberta.checkin_id}
            pacienteNome={triagemAberta.paciente_nome}
            open={true}
            onClose={() => setTriagemAberta(null)}
          />
        )}
      </>
    )
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add web/components/checkin/FilaTab.tsx
  git commit -m "feat(checkin): FilaTab com lista e abertura de TriagemModal"
  ```

---

### Task 11: Página `/checkin`

**Files:**
- Create: `web/app/(app)/checkin/page.tsx`

**Context:** Página `'use client'`. Tabs simples baseadas em estado (`activeTab: 'agendamentos' | 'fila'`). Usa `useCheckins`, `useCheckin` (com callback de toast), `useFila`, `useFilaActions`. O toast após check-in é um banner de estado que exibe posição na fila e alertas, auto-descartado após 5s.

- [ ] **Step 1: Criar a página**

  ```tsx
  // web/app/(app)/checkin/page.tsx
  'use client'
  import { useState, useEffect } from 'react'
  import { useTenant } from '@/contexts/TenantContext'
  import { useCheckins } from '@/hooks/useCheckins'
  import { useCheckin } from '@/hooks/useCheckin'
  import { useFila } from '@/hooks/useFila'
  import { useFilaActions } from '@/hooks/useFilaActions'
  import { AgendamentosTab } from '@/components/checkin/AgendamentosTab'
  import { FilaTab } from '@/components/checkin/FilaTab'
  import { cn } from '@/lib/utils'
  import type { Agendamento } from '@/types/checkin'

  interface ToastInfo {
    posicao: number
    alertas?: { fatura_aberta: number; ultimo_atendimento_dias: number }
  }

  export default function CheckinPage() {
    const { user, isLoading: userLoading } = useTenant()
    const [activeTab, setActiveTab] = useState<'agendamentos' | 'fila'>('agendamentos')
    const [toast, setToast] = useState<ToastInfo | null>(null)

    const { data: agendamentos = [], isLoading: loadingAgendamentos } = useCheckins()
    const { data: filaItems = [], isLoading: loadingFila } = useFila(user?.tenant_slug)
    const { encaminharTriagem, chamarAtendimento, finalizar } = useFilaActions()

    const checkin = useCheckin()

    // Auto-dismiss toast após 5s
    useEffect(() => {
      if (!toast) return
      const t = setTimeout(() => setToast(null), 5000)
      return () => clearTimeout(t)
    }, [toast])

    function handleCheckin(agendamento: Agendamento) {
      checkin.mutate({
        agendamento_id: agendamento.agendamento_id,
        paciente_id: agendamento.paciente_id,
        profissional_id: agendamento.profissional_id,
      }, {
        onSuccess: (data) => {
          // data.posicao_fila vem do backend
          setToast({ posicao: data.posicao_fila, alertas: agendamento.alertas })
        },
      })
    }

    if (userLoading) {
      return (
        <div className="p-6 space-y-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-40 bg-muted rounded-xl animate-pulse" />
        </div>
      )
    }

    const perfil = user?.perfil ?? 'recepcionista'

    return (
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold">Check-in de Pacientes</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Toast pós check-in */}
        {toast && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">Check-in realizado! Posição na fila: #{toast.posicao}</p>
              {toast.alertas?.fatura_aberta && toast.alertas.fatura_aberta > 0 && (
                <p className="text-xs mt-0.5">⚠ Fatura em aberto: R$ {toast.alertas.fatura_aberta.toFixed(2)}</p>
              )}
              {toast.alertas?.ultimo_atendimento_dias && toast.alertas.ultimo_atendimento_dias > 90 && (
                <p className="text-xs mt-0.5">📅 {toast.alertas.ultimo_atendimento_dias} dias sem visita</p>
              )}
            </div>
            <button onClick={() => setToast(null)} className="text-green-600 hover:text-green-900">✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b flex gap-0">
          {(['agendamentos', 'fila'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab === 'agendamentos' ? 'Agendamentos do dia' : `Fila de espera${filaItems.length ? ` (${filaItems.length})` : ''}`}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        {activeTab === 'agendamentos' && (
          loadingAgendamentos ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <AgendamentosTab
              agendamentos={agendamentos}
              perfil={perfil}
              onCheckin={handleCheckin}
            />
          )
        )}

        {activeTab === 'fila' && (
          loadingFila ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <FilaTab
              items={filaItems}
              perfil={perfil}
              onEncaminharTriagem={(id) => encaminharTriagem.mutate(id)}
              onChamar={(id) => chamarAtendimento.mutate(id)}
              onFinalizar={(id) => finalizar.mutate(id)}
            />
          )
        )}
      </div>
    )
  }
  ```

- [ ] **Step 2: Verificar build do Next.js**

  ```bash
  cd web && npx next build 2>&1 | tail -20
  ```

  Expected: sem erros de compilação TypeScript na rota `/checkin`

- [ ] **Step 3: Commit**

  ```bash
  git add web/app/(app)/checkin/page.tsx
  git commit -m "feat(checkin): página principal com tabs agendamentos e fila"
  ```

---

### Task 12: Rodar todos os testes e verificar

- [ ] **Step 1: Rodar todos os testes do checkin**

  ```bash
  cd web && node node_modules/vitest/vitest.mjs run __tests__/checkin/
  ```

  Expected: 17+ PASS (useCheckin: 3, FilaCard: 5, TriagemModal: 4, AgendamentosTab: 5)

- [ ] **Step 2: Rodar toda a suíte**

  ```bash
  cd web && node node_modules/vitest/vitest.mjs run
  ```

  Expected: todos os testes passando (inclui dashboard do Sprint 1)

- [ ] **Step 3: Verificar build completo**

  ```bash
  cd web && npx next build 2>&1 | grep -E "(error|Error|✓|Route)" | head -30
  ```

  Expected: sem erros; rota `/checkin` listada

- [ ] **Step 4: Commit final**

  ```bash
  git add -A
  git commit -m "test(checkin): todos os 4 arquivos de teste passando — Sprint 2 completo"
  ```
