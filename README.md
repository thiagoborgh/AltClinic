# AltClinic

Sistema SaaS de gestao de clinicas — multi-tenant com PostgreSQL.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| API | Node.js + Express 4.x |
| Banco | PostgreSQL (Supabase) — schema por tenant |
| Frontend | Next.js 14 (App Router) + TypeScript + shadcn/ui |
| Deploy | Fly.io (Sao Paulo) |

## Estrutura

```
AltClinic/
├── src/          # Express API
├── web/          # Next.js 14 App Router
├── admin/        # Admin master (React CRA)
└── docs/         # PRDs, PDDs, TDDs, specs
```

## Rodar em desenvolvimento

```bash
# Instalar dependencias
npm install
cd web && npm install && cd ..

# Configurar variaveis
cp .env.example .env               # Express
cp web/.env.local.example web/.env.local  # Next.js

# Iniciar ambos os processos
npm run dev:all
```

API Express: `http://localhost:3000`
Next.js: `http://localhost:3001`

## Variaveis de ambiente

### Express (`.env`)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
PORT=3000
```

### Next.js (`web/.env.local`)
```
EXPRESS_API_URL=http://localhost:3000
JWT_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## Deploy (Fly.io)

```bash
fly deploy
```

O `entrypoint.sh` inicia Express (porta 3000) e Next.js (porta 8080) na mesma VM.

## Modulos

| Sprint | Modulo | Status |
|--------|--------|--------|
| 0 | Fundacao + Limpeza | Done |
| 1 | Dashboard IA | Em breve |
| 2 | Check-in | Em breve |
| 3 | Agenda | Em breve |
| 4 | Pacientes | Em breve |
| 5 | Financeiro | Em breve |
| 6 | Relatorios | Em breve |
| 7 | WhatsApp Central | Em breve |
| 8 | Prontuario | Em breve |
| 9 | Profissionais | Em breve |
| 10 | Configuracoes | Em breve |
| 11 | CRM | Em breve |
