# Confirmação de Agendamentos — Design Spec (Sprint 3)

**Data**: 2026-03-20
**Status**: Aprovado
**Sprint**: 3

---

## Objetivo

Implementar a UI de Confirmação de Agendamentos: página `/agenda` que permite à recepcionista visualizar os agendamentos de um dia selecionado (padrão: amanhã), acompanhar o status de confirmação de cada um, confirmar/cancelar manualmente ou enviar mensagem WhatsApp individual, com atualização em tempo real via SSE quando pacientes respondem.

---

## Escopo do Sprint 3

**Inclui:**
- KPI cards de resumo (confirmados, pendentes, cancelados, taxa)
- Tabela de agendamentos com filtro por status
- Ações por linha: confirmar, cancelar, enviar WhatsApp (recepcionista)
- Seletor de data com padrão amanhã
- Atualização em tempo real via SSE (`/api/confirmacoes/events`)
- RBAC: médico e enfermeira têm acesso somente leitura

**Fora do escopo:**
- Disparo em massa de WhatsApp
- Criação/edição de agendamentos
- Histórico de confirmações

---

## Arquitetura

### Abordagem: Tabela com ações inline

`/agenda` — uma rota, sem abas. `useTenant().user.perfil` determina quais ações ficam visíveis. Dados via TanStack Query + SSE para invalidação em tempo real.

### Estrutura de arquivos

```
web/
├── app/(app)/agenda/
│   └── page.tsx                        # Página com date picker, KpiResumo, ConfirmacoesTable
│
├── components/confirmacoes/
│   ├── KpiResumo.tsx                   # 4 KpiCards com resumo
│   ├── ConfirmacoesTable.tsx           # Tabela com filtro de status e ações por linha
│   └── StatusPill.tsx                  # Pill colorido por status de confirmação
│
├── hooks/
│   ├── useConfirmacoes.ts              # GET /api/confirmacoes?data=YYYY-MM-DD
│   ├── useConfirmacaoActions.ts        # POST confirmar | cancelar | enviar-whatsapp
│   └── useConfirmacoesSSE.ts          # EventSource /events → invalidateQueries
│
├── types/
│   └── confirmacoes.ts                 # Tipos TypeScript
│
└── __tests__/confirmacoes/
    ├── KpiResumo.test.tsx
    ├── ConfirmacoesTable.test.tsx
    └── useConfirmacaoActions.test.ts
```

---

## Tipos TypeScript (`web/types/confirmacoes.ts`)

```typescript
export type StatusConfirmacao =
  | 'pendente'
  | 'confirmado'
  | 'cancelado'
  | 'whatsapp_enviado'
  | 'sem_resposta'

export interface Confirmacao {
  agendamento_id: number
  horario: string              // ISO string ex: "2026-03-21T09:00:00"
  procedimento: string
  paciente_id: number
  paciente_nome: string
  paciente_telefone: string
  profissional_id: number
  profissional_nome: string
  confirmacao_id: number | null
  status: StatusConfirmacao
  canal: string | null
  enviado_em: string | null
  respondido_em: string | null
}

export interface ResumoConfirmacoes {
  total: number
  confirmados: number
  cancelados: number
  pendentes: number
  whatsapp_enviado: number
  sem_resposta: number
  taxa_confirmacao: string    // ex: "72.5%"
}
```

---

## Hooks

### `useConfirmacoes(data: string)`
- `GET /api/confirmacoes?data=YYYY-MM-DD`
- `queryKey: ['confirmacoes', data]`
- `staleTime: 60 * 1000` (60s)
- Retorna `{ data: Confirmacao[], resumo: ResumoConfirmacoes, isLoading, error }`

### `useConfirmacaoActions()`
Três mutations — cada `onSuccess` chama `invalidateQueries({ queryKey: ['confirmacoes'] })`:

- `confirmar(agendamento_id)` → `POST /api/confirmacoes/:id/confirmar` com `{ canal: 'presencial' }`
- `cancelar(agendamento_id, motivo?)` → `POST /api/confirmacoes/:id/cancelar` com `{ motivo }`
- `enviarWhatsApp(agendamento_id)` → `POST /api/confirmacoes/:id/enviar-whatsapp`

### `useConfirmacoesSSE(tenantId: string | undefined)`
- Cria `EventSource('/api/confirmacoes/events')` no mount quando `tenantId` presente
- Escuta eventos: `confirmacao_atualizada` → `queryClient.invalidateQueries({ queryKey: ['confirmacoes'] })`
- Fecha `EventSource` no unmount (`source.close()`)
- Não conecta se `tenantId` for `undefined`

---

## Componentes

### `StatusPill`

Pill inline com cor por status:

| Status | Cor | Label |
|--------|-----|-------|
| `pendente` | cinza | Pendente |
| `confirmado` | verde | Confirmado |
| `cancelado` | vermelho | Cancelado |
| `whatsapp_enviado` | azul | WhatsApp enviado |
| `sem_resposta` | amarelo | Sem resposta |

**Props:**
```typescript
interface StatusPillProps {
  status: StatusConfirmacao
}
```

---

### `KpiResumo`

4 `KpiCard` em grid 2×2 (mobile) / 4×1 (desktop):

| Card | Valor | Variant |
|------|-------|---------|
| Confirmados | `resumo.confirmados` | `success` |
| Pendentes | `resumo.pendentes` | `warning` |
| Cancelados | `resumo.cancelados` | `danger` |
| Taxa | `resumo.taxa_confirmacao` | `default` |

**Props:**
```typescript
interface KpiResumoProps {
  resumo?: ResumoConfirmacoes   // undefined = skeleton
}
```

- Quando `resumo` é `undefined`: `KpiCard` já renderiza skeleton interno (`value={undefined}`)

---

### `ConfirmacoesTable`

**Props:**
```typescript
interface ConfirmacoesTableProps {
  confirmacoes: Confirmacao[]
  perfil: string
}
```

**Filtro por status** (chips multi-select, padrão: `['pendente', 'whatsapp_enviado']`):
- Chips: Todos / Pendente / Confirmado / Cancelado / WhatsApp enviado / Sem resposta
- `data-testid="chip-{status}"` e `data-testid="chip-todos"`

**Cada linha:**
```
HH:mm | Paciente | Profissional | Procedimento | [StatusPill] | [Ações]
```

**Ações por perfil e status:**

| Status | Recepcionista | Médico / Enfermeira |
|--------|--------------|---------------------|
| `pendente` | Confirmar + Enviar WhatsApp + Cancelar | — |
| `whatsapp_enviado` | Confirmar + Cancelar | — |
| `confirmado` / `cancelado` / `sem_resposta` | — | — |

- Botões: `data-testid="btn-confirmar-{id}"`, `data-testid="btn-whatsapp-{id}"`, `data-testid="btn-cancelar-{id}"`
- Chama `useConfirmacaoActions()` internamente

---

### `page.tsx` (`/agenda`)

```typescript
'use client'

// Estado: data selecionada (default: amanhã em YYYY-MM-DD)
// useConfirmacoes(data) → { data: confirmacoes, resumo, isLoading }
// useConfirmacoesSSE(tenantId) — conecta SSE no mount
// useTenant().user.perfil — para passar ao ConfirmacoesTable

// Layout:
// <h1>Confirmação de Agendamentos</h1>
// <input type="date" value={data} onChange={setData} />
// <KpiResumo resumo={resumo} />
// <ConfirmacoesTable confirmacoes={confirmacoes} perfil={perfil} />
```

---

## Fluxo de dados

```
page.tsx
  ├─ useConfirmacoes(data)        → GET /api/confirmacoes?data=...
  ├─ useConfirmacoesSSE(tenantId) → SSE → invalidateQueries(['confirmacoes'])
  ├─ KpiResumo(resumo)
  └─ ConfirmacoesTable(confirmacoes, perfil)
       └─ useConfirmacaoActions()
            ├─ confirmar(id)    → POST /api/confirmacoes/:id/confirmar
            ├─ cancelar(id)     → POST /api/confirmacoes/:id/cancelar
            └─ enviarWhatsApp(id) → POST /api/confirmacoes/:id/enviar-whatsapp
```

---

## Endpoints do backend (já implementados)

| Método | Rota | Uso |
|--------|------|-----|
| GET | `/api/confirmacoes` | Lista agendamentos com status de confirmação |
| GET | `/api/confirmacoes/events` | SSE — emite `confirmacao_atualizada` |
| POST | `/api/confirmacoes/:id/confirmar` | Confirmar agendamento |
| POST | `/api/confirmacoes/:id/cancelar` | Cancelar agendamento |
| POST | `/api/confirmacoes/:id/enviar-whatsapp` | Enviar WhatsApp individual |

**Parâmetros do GET:**
- `data` (YYYY-MM-DD) — obrigatório (default no backend: amanhã)
- `profissional_id` — opcional
- `status` — opcional

---

## Estratégia de testes

| Arquivo | Cobertura |
|---------|-----------|
| `KpiResumo.test.tsx` | Renderiza 4 cards com valores corretos; skeleton quando resumo undefined |
| `ConfirmacoesTable.test.tsx` | Filtro padrão (pendente + whatsapp_enviado); ações corretas para recepcionista; médico não vê ações; linha confirmada sem ações |
| `useConfirmacaoActions.test.ts` | POST para endpoint correto em cada mutação; invalida queryKey no sucesso |

---

## Critérios de aceite

- Recepcionista vê agendamentos do dia seguinte com status de confirmação
- Seletor de data funciona (pode ver qualquer dia)
- KPI cards mostram resumo correto
- Filtro de status por chips funciona (padrão: pendente + whatsapp_enviado)
- Confirmar/cancelar/enviar WhatsApp funcionam por linha
- Lista atualiza automaticamente via SSE quando paciente responde
- Médico e enfermeira veem a lista sem botões de ação
- 3 arquivos de teste passando
