# Check-in de Pacientes — Design Spec (Sprint 2)

**Data**: 2026-03-20
**Status**: Aprovado
**Sprint**: 2

---

## Objetivo

Implementar a UI de Check-in de Pacientes: tela única `/checkin` com duas abas — lista de agendamentos do dia (recepcionista faz check-in) e fila de espera em tempo real (enfermeira registra triagem, médico chama e finaliza atendimento).

---

## Escopo do Sprint 2

**Inclui:**
- Aba "Agendamentos do dia" com filtro por status e ação de check-in
- Aba "Fila de espera" com atualização em tempo real via socket.io
- Ações por perfil: recepcionista (encaminhar triagem), enfermeira (modal de triagem), médico (chamar/finalizar)
- Badges de alerta inline (fatura em aberto, dias desde última visita) + toast após check-in
- Pequena adição no backend: emitir `fila:update` via socket.io junto com SSE existente

**Fora do escopo:**
- Check-in avulso (sem agendamento)
- Histórico de atendimentos
- Relatórios de tempo de espera

---

## Arquitetura

### Abordagem: Duas abas, tela única

`/checkin` — uma rota. `useTenant().user.perfil` determina quais ações ficam visíveis. Dados via TanStack Query + socket.io para invalidação de cache em tempo real.

### Estrutura de arquivos

```
web/
├── app/(app)/checkin/
│   └── page.tsx                      # Página com tabs, conecta socket.io
│
├── components/checkin/
│   ├── AgendamentosTab.tsx           # Aba 1: lista do dia com filtro de status
│   ├── FilaTab.tsx                   # Aba 2: fila em tempo real
│   ├── CheckinButton.tsx             # Botão + lógica de criar check-in
│   ├── AlertaBadge.tsx               # Badge fatura aberta / dias sem visita
│   ├── FilaCard.tsx                  # Card de paciente na fila (ações por perfil)
│   └── TriagemModal.tsx              # Modal de sinais vitais (enfermeira)
│
├── hooks/
│   ├── useAgendamentos.ts            # GET /api/agendamentos?data=hoje
│   ├── useCheckin.ts                 # POST /api/checkins (mutation)
│   ├── useFila.ts                    # GET /api/fila + socket.io invalidação
│   ├── useFilaActions.ts             # POST fila/:id/triagem/chamar, chamar, finalizar
│   └── useTriagem.ts                 # POST /api/triagens
│
└── __tests__/checkin/
    ├── AgendamentosTab.test.tsx
    ├── FilaCard.test.tsx
    ├── TriagemModal.test.tsx
    └── useCheckin.test.ts
```

---

## Backend — Adição necessária

Em `src/routes/fila-espera.js`, nos handlers que já chamam `emitFilaEvent()`, adicionar:

```javascript
// Após emitFilaEvent(tenantId, payload):
const io = req.app.get('io')
if (io) io.to(tenantId).emit('fila:update', payload)
```

Isso habilita o frontend a escutar `fila:update` via socket.io sem remover o SSE existente.

---

## Componentes

### `AgendamentosTab`

Lista de agendamentos do dia para o profissional logado (recepcionista vê todos).

**Filtro de status** (chips multi-select, padrão: `agendado` + `confirmado`):
- Todos / Agendado / Confirmado / Check-in feito / Cancelado / No-show

**Cada linha:**
```
[Avatar] Nome do paciente    [badge fatura]  [badge dias]
         Profissional · HH:mm   [status pill]
                                              [Fazer Check-in]
```

- Botão "Fazer Check-in" visível apenas se status for `agendado` ou `confirmado`
- Após check-in: linha atualiza status otimistamente para "check-in feito"; botão some
- Toast de confirmação exibe: posição na fila + alertas detalhados (fatura R$X, X dias sem visita)

---

### `AlertaBadge`

Badge discreto inline na linha do agendamento.

**Props:**
```typescript
interface AlertaBadgeProps {
  faturaAberta?: number   // valor em R$, ex: 250.50
  diasSemVisita?: number  // ex: 45
}
```

- Exibe ícone de alerta (⚠) + valor se `faturaAberta > 0`
- Exibe ícone de calendário + dias se `diasSemVisita > 90`
- Nada renderizado se ambos forem zero/undefined

---

### `FilaTab`

Lista em tempo real dos pacientes na fila, ordenada por posição.

Escuta socket.io `fila:update` → invalida `queryClient(['fila'])` → recarrega.

**Cada `FilaCard` mostra:**
```
#Pos  [Avatar] Nome          Xmin de espera  [⚠ se > 30min]
      Profissional           [status pill]
      Queixa: "..."          ← só após triagem registrada

      [ações por perfil — ver tabela abaixo]
```

**Ações por perfil e status:**

| Status | Recepcionista | Enfermeira | Médico |
|--------|--------------|------------|--------|
| `aguardando_triagem` | **Encaminhar para triagem** | — | — |
| `em_triagem` | — | **Registrar triagem** | — |
| `aguardando_atendimento` | — | — | **Chamar paciente** |
| `em_atendimento` | — | — | **Finalizar** |
| `finalizado` / `cancelado` | *(sem ação)* | *(sem ação)* | *(sem ação)* |

---

### `TriagemModal`

Modal aberto pela enfermeira ao clicar "Registrar triagem".

**Props:**
```typescript
interface TriagemModalProps {
  filaId: number
  pacienteNome: string
  open: boolean
  onClose: () => void
}
```

**Campos do formulário:**
- Pressão arterial (string, ex: "120/80") — opcional
- Peso em kg (número) — opcional
- Temperatura °C (número) — opcional
- Saturação O2 % (inteiro) — opcional
- **Queixa principal** (texto) — **obrigatório**
- Observações (texto) — opcional

**Comportamento:**
- Submit → `POST /api/triagens` → fecha modal → socket.io atualiza fila para todos
- Erro → exibe mensagem inline, modal permanece aberto
- Validação: queixa_principal não pode ser vazia

---

## Hooks

### `useAgendamentos()`
- `GET /api/agendamentos?data=hoje`
- `staleTime: 2 * 60 * 1000` (2 min)
- Retorna `{ data: Agendamento[], isLoading, error }`

### `useCheckin()`
- Mutation `POST /api/checkins`
- Atualização otimista: marca agendamento como "check-in feito" antes da resposta
- Rollback em erro
- `onSuccess`: invalida `['agendamentos']`, exibe toast com posição + alertas

### `useFila()`
- `GET /api/fila`
- `staleTime: 30 * 1000` (30s)
- Conecta socket.io no mount, escuta `fila:update` → `queryClient.invalidateQueries(['fila'])`
- Desconecta no unmount

### `useFilaActions()`
- `POST /api/fila/:id/triagem/chamar` — encaminhar para triagem (recepcionista)
- `POST /api/fila/:id/chamar` — chamar para atendimento (médico)
- `POST /api/fila/:id/finalizar` — finalizar atendimento (médico)
- Cada ação invalida `['fila']` no sucesso

### `useTriagem()`
- Mutation `POST /api/triagens`
- `onSuccess`: invalida `['fila']`, chama `onClose()`

---

## Tipos TypeScript (`web/types/checkin.ts`)

```typescript
export type StatusAgendamento =
  | 'agendado' | 'confirmado' | 'check_in' | 'cancelado' | 'no_show' | 'finalizado'

export interface Agendamento {
  id: number
  paciente_id: number
  paciente_nome: string
  profissional_id: number
  profissional_nome: string
  data_hora: string
  status: StatusAgendamento
  alertas?: {
    fatura_aberta: number
    ultimo_atendimento_dias: number
  }
}

export type StatusFila =
  | 'aguardando_triagem' | 'em_triagem' | 'aguardando_atendimento'
  | 'em_atendimento' | 'finalizado' | 'cancelado'

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
  }
}

export interface CheckinPayload {
  agendamento_id: number
  paciente_id: number
  profissional_id: number
  observacao?: string
}

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

---

## Estratégia de testes

| Arquivo | Cobertura |
|---------|-----------|
| `AgendamentosTab.test.tsx` | Filtro de status, badge de alerta inline, botão check-in desaparece após ação, toast com alertas |
| `FilaCard.test.tsx` | Renderiza ações corretas por perfil, badge de espera longa (> 30min), queixa exibida após triagem |
| `TriagemModal.test.tsx` | Validação de queixa obrigatória, submit chama POST correto, fecha no sucesso, mantém aberto no erro |
| `useCheckin.test.ts` | POST para `/api/checkins`, atualização otimista, rollback em erro |

---

## Fluxo de dados

```
page.tsx
  ├─ AgendamentosTab
  │    ├─ useAgendamentos() → GET /api/agendamentos?data=hoje
  │    └─ useCheckin()      → POST /api/checkins
  │
  └─ FilaTab
       ├─ useFila()          → GET /api/fila + socket.io fila:update
       ├─ useFilaActions()   → POST fila/:id/triagem/chamar | chamar | finalizar
       └─ useTriagem()       → POST /api/triagens
            └─ TriagemModal (enfermeira)
```

---

## Endpoints do backend (já implementados)

| Método | Rota | Uso |
|--------|------|-----|
| GET | `/api/agendamentos` | Lista agendamentos do dia |
| POST | `/api/checkins` | Criar check-in |
| DELETE | `/api/checkins/:id` | Cancelar check-in |
| GET | `/api/fila` | Lista fila de espera |
| POST | `/api/fila/:id/triagem/chamar` | Encaminhar para triagem |
| POST | `/api/fila/:id/chamar` | Chamar para atendimento |
| POST | `/api/fila/:id/finalizar` | Finalizar atendimento |
| POST | `/api/triagens` | Registrar triagem (sinais vitais) |

**Adição necessária:** emitir `fila:update` via socket.io em `src/routes/fila-espera.js`.

---

## Critérios de aceite

- Recepcionista vê agendamentos do dia filtrados por status (padrão: agendado + confirmado)
- Check-in cria entrada na fila e exibe toast com posição + alertas
- Fila atualiza em tempo real para todos os perfis via socket.io
- Enfermeira registra triagem via modal; queixa principal é obrigatória
- Médico chama e finaliza atendimento pela fila
- Alertas (fatura, dias sem visita) aparecem inline na lista e no toast pós-check-in
- 4 arquivos de teste passando
