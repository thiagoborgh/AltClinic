# Stack — AltClinic

## Backend (src/)
- **Runtime**: Node.js 20 + Express 4.x
- **Banco**: PostgreSQL via `pg` (Supabase) — schema por tenant
- **Auth**: JWT via `jsonwebtoken` + cookie httpOnly
- **Real-time**: socket.io
- **Jobs**: node-cron + BullMQ
- **Testes**: Jest + Supertest

## Frontend (web/)
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Design system**: shadcn/ui + Tailwind CSS
- **Estado servidor**: TanStack Query v5 (`useQuery`, `useMutation`)
- **Estado global**: Zustand (criar stores em `web/store/` quando necessario)
- **Auth**: Cookie httpOnly `altclinic_token` + `jose` no `middleware.ts`
- **HTTP client**: axios (`lib/api.ts` — baseURL `/api` -> BFF proxy -> Express)
- **Real-time**: socket.io-client (`lib/socket.ts`)
- **Testes**: Vitest + @testing-library/react + jsdom
- **Porta dev**: 3001 (Next.js dev) / 8080 (producao)

## Infraestrutura
- **Deploy**: Fly.io (regiao gru — Sao Paulo)
- **Container**: Docker multi-stage (node:20-alpine)
- **Processos**: entrypoint.sh — Express (3000) + Next.js (8080)
