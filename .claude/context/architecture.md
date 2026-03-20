# Arquitetura — AltClinic

## Visao Geral

Monorepo com Express API (`src/`) e Next.js frontend (`web/`) rodando na mesma VM Fly.io.

## Arquitetura de Processos

### Producao (Fly.io)
- **Porta 8080 (publica)**: Next.js — serve UI e BFF proxy
- **Porta 3000 (interna)**: Express API — dados, auth, jobs
- **Deploy**: `entrypoint.sh` inicia Express (&) depois Next.js
- **Dockerfile**: multi-stage (deps-api -> build-web -> final)

### Desenvolvimento local
- `npm run dev:all` — inicia Express (3000) e Next.js dev (3001) em paralelo

### Fluxo de requisicao
Browser -> `/api/*` (Next.js 8080) -> `web/app/api/[...proxy]/route.ts` -> Express porta 3000

## Multi-tenancy
- Cada tenant tem seu proprio schema no PostgreSQL
- Tenant ID extraido do JWT e injetado via middleware em cada request

## Admin
- `admin/` — painel master separado (React CRA, porta 3002)
- Acesso restrito a equipe Altclinic
