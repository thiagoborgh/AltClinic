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
│   ├── middleware.ts             # JWT cookie check: protege /(app)/*
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

| Desmontar | Montar | Rota pública |
|---|---|---|
| `crm-firestore.js` | `crm-pipeline.js` | `/api/crm` |
| `financeiro-firestore.js` | `financeiro-faturas.js` | `/api/financeiro` |
| `professional-firestore.js` | **DELETE apenas** — não há swap | `/api/professional` era o path antigo; o path correto `/api/profissionais` já usa `profissionais.js` que continua registrado |
| `dashboard-firestore.js` | `dashboard-ia.js` | `/api/dashboard-ia` |
| `pacientes-firestore.js` | `pacientes.js` | `/api/pacientes` |
| `trial-firestore.js` | `trial.js` | `/api/trial` |
| `tenants-admin-firestore.js` | `tenants-admin.js` | `/api/tenants/admin` |

> **Atenção:** `professional-firestore.js` expunha `/api/professional` (singular, legado SQLite/Firestore). O arquivo `profissionais.js` que usa PostgreSQL já está registrado em `app.js` em `/api/profissionais`. São rotas diferentes — basta:
> 1. Deletar o arquivo `src/routes/professional-firestore.js`
> 2. Remover de `src/app.js` a linha `app.use('/api/professional', extractTenantFirestore, professionalFirestoreRoutes)` e o `require` correspondente
>
> Não há swap — `profissionais.js` já está no ar.

### Linhas a remover de src/app.js
```js
// Firestore routes — substituir pelos PostgreSQL acima
app.use('/api/professional', extractTenantFirestore, professionalFirestoreRoutes)  // DELETE: arquivo deletado, path legado
app.use('/api/crm', extractTenantFirestore, crmFirestoreRoutes)                    // SWAP: registrar crm-pipeline.js
app.use('/api/financeiro', extractTenantFirestore, financeiroFirestoreRoutes)       // SWAP: registrar financeiro-faturas.js
app.use('/api/dashboard', extractTenantFirestore, dashboardFirestoreRoutes)        // SWAP: registrar dashboard-ia.js
app.use('/api/pacientes', extractTenantFirestore, pacientesFirestoreRoutes)        // SWAP: registrar pacientes.js
app.use('/api/trial', extractTenantFirestore, trialFirestoreRoutes)                // SWAP: registrar trial.js
app.use('/api/tenants/admin', extractTenantFirestore, tenantsAdminFirestoreRoutes) // SWAP: registrar tenants-admin.js

// Endpoints temporários de manutenção
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
jose                     — verificação JWT no middleware.ts (edge runtime)
Recharts                 — gráficos (dashboard, relatórios)
```

> **Sem next-auth.** O Express já emite e valida JWT; duplicar isso no next-auth geraria dois sistemas de sessão. Em vez disso, o Next.js usa um cookie httpOnly (`altclinic_token`) setado pelo próprio Express no login, e o `middleware.ts` usa a lib `jose` (compatível com Edge Runtime) para verificar a assinatura localmente.

### Fluxo de Autenticação
```
/login → POST /api/auth/login (Express via BFF proxy)
       → Express retorna { token, user }
       → Next.js action: document.cookie = "altclinic_token=<jwt>; HttpOnly; SameSite=Strict; Secure"
           (ou Express seta o cookie diretamente na resposta se CORS permitir)
       → middleware.ts: lê cookie "altclinic_token", verifica JWT com jose/jwtVerify
           → sem cookie válido → redirect para /login
           → com cookie válido → request passa, payload disponível via header x-user
       → TenantContext: perfil + permissões extraídos do payload JWT
       → Sidebar renderiza itens por RBAC
       → lib/api.ts: interceptor 401 → limpa cookie → redirect /login
```

**Variáveis de ambiente necessárias (web/):**
```
# Server-side only (usada pelo BFF proxy — não expor ao cliente)
EXPRESS_API_URL=http://localhost:3000       # URL interna do Express (porta 3000)

# Verificação JWT no middleware.ts (edge runtime)
JWT_SECRET=<igual ao JWT_SECRET do Express>

# Opcional: URL pública do app (client-side, se necessário)
NEXT_PUBLIC_APP_URL=http://localhost:8080
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

### Deploy (Fly.io — 2 processos via entrypoint)

O `fly.toml` atual mantém **um único `[http_service]` na porta 8080** (sem alteração de infraestrutura). Por dentro da VM, dois processos rodam em paralelo:

- **Next.js** na porta 8080 — recebe todo o tráfego público
- **Express API** na porta 3000 — interno, não exposto diretamente

O tráfego de API chega ao Next.js via Browser → `web/app/api/[...proxy]/route.ts` (BFF proxy) → Express em `localhost:3000`. Isso evita CORS, mantém o cookie httpOnly e não requer reverse proxy externo.

```toml
# fly.toml — sem alterações estruturais
[http_service]
  internal_port = 8080   # Next.js escuta aqui
  force_https = true
```

```dockerfile
# Dockerfile — multi-stage
FROM node:20-alpine AS deps-api
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS build-web
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci
COPY web/ .
RUN npm run build          # next build

FROM node:20-alpine AS final
WORKDIR /app
# Express
COPY --from=deps-api /app/node_modules ./node_modules
COPY src/ ./src/
COPY package.json .
# Next.js
COPY --from=build-web /app/web/.next ./web/.next
COPY --from=build-web /app/web/node_modules ./web/node_modules
COPY --from=build-web /app/web/package.json ./web/package.json
COPY --from=build-web /app/web/public ./web/public
# Entrypoint
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh
EXPOSE 8080
CMD ["./entrypoint.sh"]
```

```bash
# entrypoint.sh
#!/bin/sh
# Express na porta 3000 (interno)
node src/server.js &
# Next.js na porta 8080 (público)
cd web && PORT=8080 node_modules/.bin/next start -p 8080
```

**Desenvolvimento local (`npm run dev` na raiz):**
```json
"dev": "concurrently \"node src/server.js\" \"cd web && next dev -p 3001\""
```

---

## Seção 5 — Plano de Entrega

### Sprint 0 — Fundação (Semana 1)
- [ ] Limpeza backend (delete legados, swap Firestore→PG, remove endpoints temp)
- [ ] Limpeza docs (delete ~110 .md)
- [ ] Criar `web/` com Next.js 14 + TypeScript + shadcn/ui + jose (sem next-auth)
- [ ] AppShell, Sidebar RBAC, Topbar, TenantContext
- [ ] `lib/api.ts`, `lib/socket.ts`, `lib/permissions.ts`
- [ ] `entrypoint.sh`, `Dockerfile` multi-stage, `fly.toml` (manter port 8080), scripts dev com `concurrently`
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
