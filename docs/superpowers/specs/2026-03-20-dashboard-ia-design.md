# Dashboard IA — Design Spec (Sprint 1)

**Data**: 2026-03-20
**Status**: Aprovado
**Sprint**: 1

---

## Objetivo

Implementar a UI do Dashboard IA para os 4 perfis de usuário (admin/financeiro, recepcionista, médico, enfermeira) com KPIs reais do backend, briefing diário gerado pela Claude API, e personalização de layout via drag-and-drop.

---

## Escopo do Sprint 1

**Inclui:**
- Dashboard para 4 perfis: admin, financeiro, recepcionista, médico, enfermeira
- KPIs em tempo real via TanStack Query (TTL 5 min)
- Briefing diário Claude API (TTL 1h — backend já cacheia)
- Drag-and-drop para reordenar e ocultar cards (persiste via `PUT /api/dashboard-ia/config`)
- Barra de progresso de metas (admin/financeiro)

**Fora do escopo (Sprint 2):**
- Alertas proativos em tempo real via socket.io
- Gestão de perfis de permissionamento customizados

---

## Arquitetura

### Abordagem: Single page com componentes por perfil

`/dashboard` — uma rota. `useTenant()` retorna `user.perfil` e a página despacha para o componente correto. Dados via TanStack Query (client-side), BFF proxy → Express.

### Estrutura de arquivos

```
web/
├── app/(app)/dashboard/
│   └── page.tsx                     # Despacha por user.perfil
│
├── components/dashboard/
│   ├── AdminDashboard.tsx            # Perfis admin + financeiro
│   ├── RecepcionistaDashboard.tsx
│   ├── MedicoDashboard.tsx
│   ├── EnfermeiraDashboard.tsx
│   ├── BriefingCard.tsx              # Texto Claude API, colapsável
│   ├── KpiCard.tsx                   # Card genérico de KPI
│   ├── MetaProgressBar.tsx           # Barra de progresso de meta
│   └── DraggableGrid.tsx             # Wrapper @dnd-kit/sortable
│
├── hooks/
│   ├── useDashboard.ts               # GET /api/dashboard-ia
│   ├── useBriefing.ts                # GET /api/dashboard-ia/briefing
│   ├── useDashboardConfig.ts         # GET + PUT /api/dashboard-ia/config
│   └── useMetas.ts                   # GET /api/dashboard-ia/metas
│
├── types/
│   └── dashboard.ts                  # Interfaces TypeScript
│
└── __tests__/dashboard/
    ├── KpiCard.test.tsx
    ├── BriefingCard.test.tsx
    ├── MetaProgressBar.test.tsx
    ├── DraggableGrid.test.tsx
    └── useDashboard.test.ts
```

---

## Tipos TypeScript (`web/types/dashboard.ts`)

Tipos espelham exatamente os campos retornados pelo backend (`src/routes/dashboard-ia.js`).

```typescript
// Perfis admin e admin_master — calcularKpisAdmin()
export interface KpisAdmin {
  perfil: 'admin'
  agendamentos_hoje: number
  confirmados: number
  no_shows: number
  receita_mes: number
  meta_receita: number
  inadimplencia_valor: number
  faturas_vencidas: number
  taxa_no_show_mes: number       // percentual, ex: 12
  metas: Record<string, number>  // { receita: 60000, atendimentos: 40, ... }
  calculado_em: string
}

// Perfil financeiro — calcularKpisFinanceiro()
export interface KpisFinanceiro {
  perfil: 'financeiro'
  receita_mes: number
  meta_receita: number
  faturas_vencidas: number
  valor_vencido: number
  cobradas_hoje: number
  calculado_em: string
}

// Perfil recepcionista — calcularKpisRecepcionista()
export interface KpisRecepcionista {
  perfil: 'recepcionista'
  agendamentos_hoje: number
  aguardando_confirmacao: number  // status agendado/pendente
  checkins_pendentes: number      // status check_in
  fila_atual: number              // fila_espera.status = 'aguardando'
  calculado_em: string
}

// Perfil medico — calcularKpisMedico()
// Nota: NÃO inclui próximo paciente — backend retorna apenas agregados do dia
export interface KpisMedico {
  perfil: 'medico'
  pacientes_hoje: number
  primeira_consulta: number
  retornos: number
  duracao_media_min: number
  calculado_em: string
}

// Perfil enfermeira — backend usa calcularKpisAdmin() como fallback (default case)
export type KpisEnfermeira = KpisAdmin

export type KpisQualquer = KpisAdmin | KpisFinanceiro | KpisRecepcionista | KpisMedico | KpisEnfermeira

export interface Briefing {
  briefing: string
  kpis: Record<string, unknown>
  gerado_em: string
}

export interface DashboardConfig {
  layout_json: { cards: string[]; hidden: string[] }
  alertas_config_json: Record<string, boolean>
  horario_briefing: string
}

export interface Meta {
  id: number
  tipo: 'receita' | 'atendimentos' | 'no_show_max' | 'inadimplencia_max'
  valor_meta: number
  mes: string
}
```

---

## Componentes

### `KpiCard`

Componente genérico de KPI.

**Props:**
```typescript
interface KpiCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subtext?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}
```

**Comportamento:**
- `variant` mapeia para cores: default=neutro, success=verde, warning=amarelo, danger=vermelho
- `subtext` renderiza abaixo do valor em tamanho menor (ex: "+12% vs. mês anterior")
- Skeleton quando `value` é `undefined`

---

### `BriefingCard`

Exibe o briefing diário gerado pela Claude API.

**Comportamento:**
- Loading: skeleton de 3 linhas
- Erro: `"Briefing indisponível hoje"` com ícone de alerta, sem quebrar o dashboard
- Sucesso: texto + timestamp formatado (`"Gerado hoje às HH:mm"`)
- Colapsável: máximo 3 linhas visíveis por padrão, botão "Ver mais / Ver menos"
- Não bloqueia outros cards — renderiza de forma independente

---

### `MetaProgressBar`

Exibe progresso de uma meta configurada pelo admin.

**Props:**
```typescript
interface MetaProgressBarProps {
  tipo: string           // 'receita' | 'atendimentos' | etc.
  valor_meta: number
  valor_atual: number
}
```

**Comportamento:**
- Calcula `pct = (valor_atual / valor_meta) * 100`
- Barra verde se pct ≥ 80%, amarela se 50–79%, vermelha se < 50%
- Exibe `"R$ 44.200 / R$ 60.000 (74%)"` para metas financeiras
- Exibe `"28 / 40 atendimentos (70%)"` para metas de volume

---

### `DraggableGrid`

Wrapper de drag-and-drop usando `@dnd-kit/sortable`.

**Props:**
```typescript
interface DraggableGridProps {
  items: CardConfig[]           // { id: string; component: React.ReactNode }
  onReorder: (ids: string[]) => void
  onHide: (id: string) => void
  onReset: () => void
}
```

**Comportamento:**
- Arrastar reordena os cards; `onReorder` é chamado após o drop
- Botão "×" em cada card chama `onHide(id)`
- Botão "Restaurar padrão" chama `onReset()`
- Animação de transição suave durante o drag

---

### Dashboards por perfil

**`AdminDashboard`** (mesma UI para `admin` e `financeiro`):
- Grid 2×2: Agendamentos hoje / Confirmados / Receita do mês / Inadimplência %
- `BriefingCard` abaixo do grid
- `MetaProgressBar` para cada meta configurada (se houver)
- Todo o grid envolto em `DraggableGrid`

**`RecepcionistaDashboard`**:
- Grid 2×2: Agenda hoje (`agendamentos_hoje`) / Aguardando confirmação (`aguardando_confirmacao`) / Check-ins pendentes (`checkins_pendentes`) / Fila de espera (`fila_atual`)
- `BriefingCard` compacto (colapsado por padrão)

**`MedicoDashboard`**:
- Grid 2×2: Pacientes hoje (`pacientes_hoje`) / Primeiras consultas (`primeira_consulta`) / Retornos (`retornos`) / Duração média (`duracao_media_min` min)
- `BriefingCard`
- Nota: "Próximo paciente" com dados de prontuário está fora do escopo — o backend não retorna esse dado no endpoint de KPIs (Sprint 2+).

**`EnfermeiraDashboard`**:
- Usa `KpisAdmin` (backend aplica `calcularKpisAdmin()` como fallback para o perfil enfermeira)
- Grid 2×2: Agendamentos hoje / Confirmados / Receita do mês / No-show %
- `BriefingCard` compacto

---

## Hooks

### `useDashboard(perfil: string)`
- `GET /api/dashboard-ia?perfil=<perfil>` — `perfil` vem de `useTenant().user.perfil`
- `staleTime: 5 * 60 * 1000` (5 min)
- Retorna `{ data: KpisQualquer, isLoading, error }`

### `useBriefing()`
- `GET /api/dashboard-ia/briefing`
- `staleTime: 60 * 60 * 1000` (1h — alinhado com cache do backend)
- Retorna `{ data: Briefing, isLoading, error }`

### `useDashboardConfig()`
- `GET /api/dashboard-ia/config`
- `useMutation` para `PUT /api/dashboard-ia/config`
- Atualização otimista do cache local após mutação

### `useMetas(mes?: string)`
- `GET /api/dashboard-ia/metas?mes=<mes>`
- Usado apenas nos perfis admin/financeiro

---

## Fluxo de dados

```
page.tsx
  └─ useTenant() → user.perfil
       └─ AdminDashboard / RecepcionistaDashboard / MedicoDashboard / EnfermeiraDashboard
            ├─ useDashboard(perfil) → GET /api/dashboard-ia
            ├─ useBriefing()        → GET /api/dashboard-ia/briefing
            ├─ useDashboardConfig() → GET /api/dashboard-ia/config (+ PUT on change)
            └─ useMetas()           → GET /api/dashboard-ia/metas (admin only)
```

Cada hook chama `api` de `lib/api.ts` → BFF proxy `web/app/api/[...proxy]/route.ts` → Express porta 3000.

---

## Estratégia de testes

| Arquivo | Cobertura |
|---------|-----------|
| `KpiCard.test.tsx` | Renderiza valor, label, variantes (warning/danger), subtext, skeleton |
| `BriefingCard.test.tsx` | Skeleton loading, estado de erro, colapso de texto, timestamp formatado |
| `MetaProgressBar.test.tsx` | Cálculo de % correto, cor da barra (verde ≥80%, amarela 50-79%, vermelha <50%) |
| `DraggableGrid.test.tsx` | Renderiza cards na ordem correta, botão × chama onHide, Restaurar chama onReset |
| `useDashboard.test.ts` | Mock axios, verifica URL `/api/dashboard-ia` com parâmetro perfil |

Componentes de dashboard por perfil (`AdminDashboard` etc.) não têm testes próprios — são composições dos componentes já testados.

---

## Dependências a instalar

```bash
cd web && npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Nenhuma outra dependência nova — TanStack Query, axios e lucide-react já estão instalados.

---

## Endpoints do backend (já implementados)

| Método | Rota | Uso |
|--------|------|-----|
| GET | `/api/dashboard-ia` | KPIs por perfil |
| GET | `/api/dashboard-ia/briefing` | Briefing Claude API do dia |
| GET | `/api/dashboard-ia/config` | Layout e config do usuário |
| PUT | `/api/dashboard-ia/config` | Salvar layout drag-and-drop |
| GET | `/api/dashboard-ia/metas` | Metas mensais (admin) |

Todos os endpoints já estão registrados em `src/app.js` e têm autenticação.

---

## Critérios de aceite

- Dashboard carrega em < 2s (KPIs do cache backend, 5min stale)
- Briefing exibe texto real da Claude API ou mensagem de fallback
- Drag-and-drop persiste entre sessões (salvo no backend)
- Cards ocultos não aparecem e podem ser restaurados
- Todos os 4 perfis têm dashboard funcional com dados reais
- 5 arquivos de teste passando
