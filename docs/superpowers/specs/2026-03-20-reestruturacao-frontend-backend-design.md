# Design: Reestruturação Frontend + Limpeza Backend
**Data:** 2026-03-20
**Status:** Aprovado
**Autor:** Claude Code (AltClinic Dev System)

---

## Resumo Executivo

Substituição completa do frontend React CRA por Next.js 14 (App Router) com TypeScript + shadcn/ui, execução em dois processos no mesmo deploy Fly.io. Limpeza simultânea do backend: remoção de ~15 arquivos legados SQLite/Firestore/backup, swap das rotas Firestore para as rotas PostgreSQL dos TDDs, e remoção de ~110 arquivos .md obsoletos. Entrega módulo a módulo em 12 sprints.

---

## Decisões de Design

| Decisão | Escolha | Motivo |
|---|---|---|
| Abordagem | Backend cleanup + frontend novo por módulo | Sem produção ativa, riscos baixos |
| Frontend stack | Next.js 14 App Router + TypeScript | SSR completo, escalável para área do paciente |
| Design system | shadcn/ui + Tailwind | Remove mistura MUI/Tailwind atual |
| Admin frontend | Mantém React CRA intocado | Fora do escopo desta fase |
| URL tenant | JWT no contexto, `/app/[módulo]` | Já é o padrão atual |
| Deploy | 2 processos no Fly.io (api + web) | Um repo, um deploy |
| Transição frontend | Substituição total (delete frontend/) | Sem período de convivência |
| Backend migration | Auditoria → swap direto Firestore→PG | Sem feature flags, direto ao ponto |

---

## Seção 1 — Estrutura do Repositório

```
AltClinic/
├── src/                          # API Express (limpo)
│   ├── routes/                   # Apenas rotas PostgreSQL
│   ├── services/
│   ├── jobs/
│   ├── migrations/
│   ├── middleware/
│   ├── admin/                    # Admin master (TDD 22)
│   ├── websocket/
│   └── server.js
│
├── web/                          # NOVO: Next.js 14 App Router
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   └── (app)/
│   │       ├── layout.tsx        # AppShell: verifica sessão + TenantContext
│   │       ├── dashboard/page.tsx
│   │       ├── checkin/page.tsx
│   │       ├── agenda/page.tsx
│   │       ├── pacientes/page.tsx
│   │       ├── financeiro/page.tsx
│   │       ├── relatorios/page.tsx
│   │       ├── whatsapp/page.tsx
│   │       ├── prontuario/page.tsx
│   │       ├── profissionais/page.tsx
│   │       ├── configuracoes/page.tsx
│   │       └── crm/page.tsx
│   ├── components/
│   │   ├── ui/                   # shadcn/ui gerado pelo CLI
│   │   ├── layout/               # AppShell, Sidebar, Topbar
│   │   └── [modulo]/             # componentes por módulo
│   ├── lib/
│   │   ├── api.ts                # axios + interceptor 401→refresh
│   │   ├── auth.ts               # helpers JWT
│   │   ├── permissions.ts        # espelho de src/config/permissions.js
│   │   └── socket.ts             # socket.io singleton
│   ├── hooks/
│   ├── contexts/
│   │   └── TenantContext.tsx
│   ├── middleware.ts             # next-auth: protege /(app)/*
│   └── package.json
│
├── admin/                        # INTOCADO
│   ├── frontend/                 # React CRA admin master
│   └── backend/
│
├── docs/
│   ├── prd/                      # 22 PRDs
│   ├── pdd/                      # 22 PDDs
│   ├── tdd/                      # 22 TDDs
│   ├── superpowers/              # specs e planos
│   ├── api/                      # NOVO: documentação de endpoints
│   ├── EMPRESA.md
│   ├── PLANOS.md
│   └── PRODUTO.md
│
├── .claude/                      # agentes, comandos, contexto (atualizar)
├── .github/workflows/deploy.yml
├── fly.toml                      # 2 processos: api + web
├── README.md                     # REESCREVER
└── CHANGELOG.md
```

**Removidos:**
- `frontend/` — deletado completamente
- `public/` — Next.js tem seu próprio `public/`
- `copy-build.ps1` — desnecessário

---

## Seção 2 — Limpeza de Documentação

### Manter
- `docs/prd/`, `docs/pdd/`, `docs/tdd/` — 66 arquivos de especificação
- `docs/superpowers/` — specs e planos gerados
- `docs/EMPRESA.md`, `docs/PLANOS.md`, `docs/PRODUTO.md`
- `README.md` (reescrever), `CHANGELOG.md` (atualizar)
- `.claude/` — contexto, agentes e comandos

### Deletar (~110 arquivos)

**Root level:**
- `FIX-*.md` — notas de bug fix (30+ arquivos)
- `RENDER-*.md` — guias plataforma antiga (10+ arquivos)
- `RELATORIO_*.md`, `RELATORIO_DIARIO_*.md` — relatórios diários
- `SISTEMA_*.md` — documentação de sistema obsoleta
- `DOCUMENTACAO_*.md` — documentação gerada
- `ARQUITETURA_*.md` — arquiteturas antigas
- `DEBUG-*.md`, `CORRECAO_*.md` — debugging
- `DEPLOY-*.md`, `RAILWAY-*.md`, `ONRENDER-CONFIG.md` — plataformas antigas
- `WHATSAPP-*.md`, `GUIA_*.md`, `ZAPI_*.md`, `META_API_*.md` — guias de integração velhos
- `CHANGELOG-2025-*.md`, `tasks.md`, `diario-*.md`
- Misc: `analise-custos-*.md`, `estrategia-saas-completa.md`, `LIMPEZA-SEM-SHELL.md`, etc.

**docs/ legados:**
- `docs/ARQUITETURA.md`, `docs/CHECKLIST_*.md`, `docs/DEPLOY.md`
- `docs/diario-desenvolvimento-*.md`, `docs/como-funciona-licenca-teste.md`
- `docs/MANUAL_CONFIGURACOES.md`, `docs/CONFIGURACOES_RESPONSABILIDADES.md`
- `docs/WHATSAPP_META_SETUP.md`

**frontend/ docs (deletados junto com frontend/):**
- `frontend/*.md`, `frontend/docs/`

**admin/docs/ legados:**
- `admin/docs/DEPLOY.md`, `admin/docs/INSTALLATION.md`

---

## Seção 3 — Limpeza do Backend

### Arquivos a deletar

```
src/routes/agendamentos.js        # SQLite, marcado "não usar"
src/routes/crm.js                 # SQLite, supersedido
src/routes/financeiro.js          # SQLite, supersedido
src/routes/professional.js        # SQLite, supersedido
src/routes/professional-backup.js # backup
src/routes/auth-sqlite-backup.js  # backup
src/routes/auth-firestore.js      # Firestore backup

src/components/ConfiguracaoGrade_backup.js
src/components/configuracoes/ConfiguracoesManager_old.js

list-tenants-firestore.js
popular-firestore-teste.js
cleanup-duplicates.sh
cleanup-orphans-production.sh
copy-build.ps1

admin/admin.sqlite
admin/backend/database/admin.sqlite
backend/clinica-saas.db
firestore.indexes.json
firestore.rules
```

### Swap Firestore → PostgreSQL em src/app.js

| Desmontar | Montar |
|---|---|
| `crm-firestore.js` | `crm-pipeline.js` |
| `financeiro-firestore.js` | `financeiro-faturas.js` |
| `professional-firestore.js` | `profissionais.js` (existente) |
| `dashboard-firestore.js` | `dashboard-ia.js` |
| `pacientes-firestore.js` | `pacientes.js` |
| `trial-firestore.js` | `trial.js` |
| `tenants-admin-firestore.js` | `tenants-admin.js` |

### Endpoints temporários a remover de app.js
```js
/api/cleanup-orphans
/api/cleanup-user/:email
```

### Atualizar
- `.claude/context/stack.md` — Next.js 14, TypeScript, shadcn/ui
- `.claude/context/architecture.md` — 2 processos, web/ + src/
- `.claude/context/conventions.md` — TypeScript, App Router, TanStack Query

---

## Seção 4 — Arquitetura Next.js

### Stack
```
Next.js 14 (App Router) + TypeScript
Tailwind CSS + shadcn/ui (Radix UI)
TanStack Query v5        — cache e estado de servidor
Zustand                  — estado global (user, tenant, alertas)
socket.io-client         — alertas em tempo real
axios                    — cliente HTTP para API Express
next-auth v5 (Auth.js)   — sessão JWT + refresh automático
Recharts                 — gráficos (dashboard, relatórios)
```

### Fluxo de Autenticação
```
/login → POST /api/auth/login (Express)
       → JWT salvo na sessão next-auth (httpOnly cookie)
       → middleware.ts verifica sessão em toda rota /(app)/
       → TenantContext: perfil + permissões extraídos do JWT
       → Sidebar renderiza itens por RBAC
       → lib/api.ts: interceptor 401 → refresh automático
```

### RBAC no Frontend
- `lib/permissions.ts` espelha `src/config/permissions.js`
- `<RequirePermission module="financeiro" action="read">` — componente guard
- Sidebar filtra itens conforme perfil do usuário
- Páginas redirecionam para `/app/dashboard` se sem permissão

### Proxy BFF
```
web/app/api/[...proxy]/route.ts
  → Repassa todas as chamadas para Express em NEXT_PUBLIC_API_URL
  → Preserva cookie de sessão (httpOnly)
  → Evita CORS no cliente
```

### Deploy (Fly.io — 2 processos)
```toml
# fly.toml
[[services]]
  internal_port = 3000   # Express API

[[services]]
  internal_port = 3001   # Next.js
```

---

## Seção 5 — Plano de Entrega

### Sprint 0 — Fundação (Semana 1)
- [ ] Limpeza backend (delete legados, swap Firestore→PG, remove endpoints temp)
- [ ] Limpeza docs (delete ~110 .md)
- [ ] Criar `web/` com Next.js 14 + TypeScript + shadcn/ui + next-auth
- [ ] AppShell, Sidebar RBAC, Topbar, TenantContext
- [ ] `lib/api.ts`, `lib/socket.ts`, `lib/permissions.ts`
- [ ] `fly.toml` 2 processos, Procfile, scripts dev
- [ ] Atualizar `.claude/context/`, README.md, CHANGELOG.md
- [ ] Deletar `frontend/`, `public/`, `copy-build.ps1`

### Sprints 1–11 — Módulos (por ordem de prioridade)

| Sprint | Módulo | Páginas | APIs consumidas |
|---|---|---|---|
| 1 | Dashboard IA | dashboard/page.tsx | /api/dashboard-ia |
| 2 | Check-in | checkin/page.tsx | /api/checkins, /api/fila |
| 3 | Agenda | agenda/page.tsx | /api/agenda-agendamentos, /api/confirmacoes |
| 4 | Pacientes | pacientes/page.tsx, [id]/page.tsx | /api/pacientes |
| 5 | Financeiro | financeiro/page.tsx, faturas/[id]/page.tsx | /api/financeiro |
| 6 | Relatórios | relatorios/page.tsx | /api/relatorios/no-show, /receita |
| 7 | WhatsApp Central | whatsapp/page.tsx | /api/whatsapp |
| 8 | Prontuário | prontuario/[pacienteId]/page.tsx | /api/prontuarios |
| 9 | Profissionais | profissionais/page.tsx | /api/profissionais |
| 10 | Configurações | configuracoes/page.tsx | /api/configuracoes |
| 11 | CRM | crm/page.tsx | /api/crm |

### Padrão por sprint
1. Auditar rota backend — confirmar endpoints, parâmetros, RBAC
2. Criar página Next.js com TanStack Query (loading, error, empty states)
3. Implementar componentes do módulo em `web/components/[modulo]/`
4. Integrar socket.io onde aplicável (dashboard, checkin, whatsapp)
5. Commit + PR + merge

---

## Documentação Viva

Ao final do Sprint 0, criar `docs/api/README.md` com índice de todos os endpoints por módulo. Cada sprint atualiza a seção correspondente.

O `README.md` da raiz será reescrito com:
- Stack atual (Next.js + Express + PostgreSQL)
- Como rodar em desenvolvimento (`npm run dev` inicia ambos os processos)
- Variáveis de ambiente necessárias
- Como fazer deploy no Fly.io
