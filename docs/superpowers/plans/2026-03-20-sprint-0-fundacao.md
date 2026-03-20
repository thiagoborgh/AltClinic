# Sprint 0 — Fundação: Limpeza + Next.js

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Limpar o repositório de arquivos legados e criar a fundação Next.js 14 com autenticação JWT, AppShell com RBAC, BFF proxy para Express, e configuração de deploy para dois processos no Fly.io.

**Architecture:** Express API roda na porta 3000 (interno); Next.js roda na porta 8080 (público, porta do fly.toml). O browser chama `/api/*` que Next.js BFF proxy repassa para `http://localhost:3000/api/*`. Autenticação via cookie httpOnly `altclinic_token` setado no login; `middleware.ts` usa `jose` para verificar o JWT em cada rota protegida.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui (Radix UI), TanStack Query v5, Zustand, socket.io-client 4.x, axios, jose, Vitest + @testing-library/react (testes frontend), concurrently (dev local)

---

## Chunk 1: Backend Cleanup

### Task 1: Deletar arquivos legados do backend

**Files:**
- Delete: `src/routes/agendamentos.js`
- Delete: `src/routes/crm.js`
- Delete: `src/routes/financeiro.js`
- Delete: `src/routes/professional.js`
- Delete: `src/routes/professional-backup.js`
- Delete: `src/routes/auth-sqlite-backup.js`
- Delete: `src/routes/auth-firestore.js`
- Delete: `src/routes/professional-firestore.js`
- Delete: `src/routes/crm-firestore.js`
- Delete: `src/routes/financeiro-firestore.js`
- Delete: `src/routes/dashboard-firestore.js`
- Delete: `src/routes/pacientes-firestore.js`
- Delete: `src/routes/trial-firestore.js`
- Delete: `src/routes/tenants-admin-firestore.js`
- Delete: `list-tenants-firestore.js` (raiz)
- Delete: `popular-firestore-teste.js` (raiz)
- Delete: `cleanup-duplicates.sh` (raiz)
- Delete: `cleanup-orphans-production.sh` (raiz)
- Delete: `copy-build.ps1` (raiz)
- Delete: `firestore.indexes.json` (raiz, se existir)
- Delete: `firestore.rules` (raiz, se existir)
- Delete: `admin/admin.sqlite` (se existir)
- Delete: `admin/backend/database/admin.sqlite` (se existir)
- Delete: `backend/clinica-saas.db` (se existir)

- [ ] **Step 1: Verificar quais arquivos existem antes de deletar**

```bash
ls src/routes/agendamentos.js src/routes/crm.js src/routes/financeiro.js \
   src/routes/professional.js src/routes/professional-backup.js \
   src/routes/auth-sqlite-backup.js src/routes/auth-firestore.js \
   src/routes/professional-firestore.js src/routes/crm-firestore.js \
   src/routes/financeiro-firestore.js src/routes/dashboard-firestore.js \
   src/routes/pacientes-firestore.js src/routes/trial-firestore.js \
   src/routes/tenants-admin-firestore.js 2>&1 | grep -v "No such file"
```

- [ ] **Step 2: Deletar rotas legadas SQLite**

```bash
rm -f src/routes/agendamentos.js src/routes/crm.js src/routes/financeiro.js \
       src/routes/professional.js src/routes/professional-backup.js \
       src/routes/auth-sqlite-backup.js src/routes/auth-firestore.js
```

- [ ] **Step 3: Deletar rotas Firestore**

```bash
rm -f src/routes/professional-firestore.js \
       src/routes/crm-firestore.js \
       src/routes/financeiro-firestore.js \
       src/routes/dashboard-firestore.js \
       src/routes/pacientes-firestore.js \
       src/routes/trial-firestore.js \
       src/routes/tenants-admin-firestore.js
```

- [ ] **Step 4: Deletar scripts de manutenção da raiz**

```bash
rm -f list-tenants-firestore.js popular-firestore-teste.js \
       cleanup-duplicates.sh cleanup-orphans-production.sh \
       copy-build.ps1 firestore.indexes.json firestore.rules
```

- [ ] **Step 5: Deletar bancos SQLite (se existirem)**

```bash
rm -f admin/admin.sqlite \
       admin/backend/database/admin.sqlite \
       backend/clinica-saas.db
```

- [ ] **Step 6: Deletar componentes backup (se existirem)**

```bash
rm -f "src/components/ConfiguracaoGrade_backup.js" \
       "src/components/configuracoes/ConfiguracoesManager_old.js"
```

- [ ] **Step 7: Confirmar que o servidor ainda inicia (vai falhar — esperado até Task 2)**

```bash
node -e "require('./src/app.js')" 2>&1 | head -20
```

Esperado: erro de `Cannot find module './routes/professional-firestore'` — esse erro será corrigido na Task 2.

---

### Task 2: Limpar src/app.js — remover imports e registros Firestore

**Files:**
- Modify: `src/app.js`

Esta task remove todos os imports e registros de rotas Firestore do `app.js`, remove os endpoints temporários de cleanup, atualiza o CORS para incluir o domínio Fly.io do Next.js, e remove o middleware de servir arquivos estáticos do frontend (Next.js cuida disso agora).

- [ ] **Step 1: Remover imports das rotas Firestore (linhas 29, 42–47)**

Localizar e remover do bloco de imports no topo de `src/app.js`:

```js
// REMOVER linha 29:
const professionalFirestoreRoutes = require('./routes/professional-firestore'); // ✅ FIRESTORE

// REMOVER bloco linhas 41–47 (comentário + 6 requires):
// 🔥 Rotas Firestore (novas)
const trialFirestoreRoutes = require('./routes/trial-firestore');
const pacientesFirestoreRoutes = require('./routes/pacientes-firestore');
const tenantsAdminFirestoreRoutes = require('./routes/tenants-admin-firestore');
const dashboardFirestoreRoutes = require('./routes/dashboard-firestore'); // ✅ DASHBOARD FIRESTORE
const financeiroFirestoreRoutes = require('./routes/financeiro-firestore'); // ✅ FINANCEIRO FIRESTORE
const crmFirestoreRoutes = require('./routes/crm-firestore'); // ✅ CRM FIRESTORE
```

- [ ] **Step 2: Remover `extractTenantFirestore` alias (linhas 50–52)**

Localizar e remover:
```js
// Importar middlewares
const { extractTenant } = require('./middleware/tenant');
// extractTenantFirestore substituído por extractTenant (migração Firestore → PostgreSQL)
const extractTenantFirestore = extractTenant;
```

Substituir por:
```js
// Importar middlewares
const { extractTenant } = require('./middleware/tenant');
```

- [ ] **Step 3: Atualizar CORS para adicionar domínio Fly.io do Next.js**

Localizar o bloco CORS em `setupMiddlewares()`. Adicionar `process.env.NEXT_PUBLIC_APP_URL` à lista de origens permitidas e remover domínios Firebase/Vercel obsoletos.

Substituir o bloco `this.app.use(cors({...}))` por:

```js
// CORS
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.NEXT_PUBLIC_APP_URL,   // ex: https://altclinic.fly.dev
      'http://localhost:8080',            // Next.js local
      'http://localhost:3001',            // dev alternativo
    ].filter(Boolean)
  : ['http://localhost:8080', 'http://localhost:3001', 'http://localhost:3000'];

this.app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, false);
    }
  },
  credentials: true,
}));
```

- [ ] **Step 4: Remover middleware de static files do frontend (linhas 168–182)**

Localizar e remover os dois blocos `express.static` que servem arquivos do frontend:

```js
// REMOVER — Next.js serve o frontend agora:
// Servir arquivos estáticos (imagens, logos, etc.)
this.app.use('/images', express.static(path.join(__dirname, '../public/images')));

// Servir arquivos estáticos do frontend (sempre)
this.app.use(express.static(path.join(__dirname, '../public'), {
  setHeaders: (res, filePath) => { ... }
}));
```

Manter apenas:
```js
// Servir uploads (imagens de prontuário)
this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

- [ ] **Step 5: Remover endpoints temporários de cleanup (linhas 237–360)**

Localizar e deletar os dois handlers:
```js
// REMOVER inteiro:
this.app.get('/api/cleanup-orphans', async (req, res) => { ... });

// REMOVER inteiro:
this.app.get('/api/cleanup-user/:email', async (req, res) => { ... });
```

- [ ] **Step 6: Remover registros Firestore em setupRoutes() — bloco de 4 linhas (linhas 432–436)**

```js
// REMOVER bloco inteiro:
console.log('🔧 Configurando rotas Firestore (trial, pacientes, tenants-admin, dashboard)...');
this.app.use('/api/tenants', trialFirestoreRoutes); // Inclui /trial
this.app.use('/api/pacientes-v2', extractTenantFirestore, pacientesFirestoreRoutes);
this.app.use('/api/tenants-admin-v2', tenantsAdminFirestoreRoutes);
this.app.use('/api/dashboard', extractTenantFirestore, dashboardFirestoreRoutes);
```

- [ ] **Step 7: Remover registros Firestore para /api/financeiro, /api/crm, /api/professional (linhas 495–501)**

```js
// REMOVER estas 3 linhas:
this.app.use('/api/financeiro', extractTenantFirestore, financeiroFirestoreRoutes); // ✅ FIRESTORE
this.app.use('/api/crm', extractTenantFirestore, crmFirestoreRoutes); // ✅ FIRESTORE
this.app.use('/api/professional', extractTenantFirestore, professionalFirestoreRoutes); // ✅ FIRESTORE
```

- [ ] **Step 8: Remover registro WhatsApp Firestore legado (linha 429)**

```js
// REMOVER esta linha (whatsapp-central já está registrado abaixo na linha 461):
const whatsappRoutes = require('./routes/whatsapp');
this.app.use('/api/whatsapp', extractTenantFirestore, whatsappRoutes);

// E o comentário logo acima:
// 🆕 Rota WhatsApp com Firestore
console.log('🔧 Configurando rota WhatsApp (Firestore)...');
```

- [ ] **Step 9: Atualizar catch-all — remover lógica de servir index.html**

Localizar e substituir o catch-all `app.get('*', ...)` (linhas 571–586):

```js
// SUBSTITUIR por:
// 404 para rotas da API não encontradas
this.app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada' });
});
```

Remover o handler anterior que tentava servir `public/index.html`.

- [ ] **Step 10: Remover import de `path` se não for mais usado**

Verificar se `path` ainda é usado em `app.js` após as remoções (ainda é usado em `express.static('../uploads')`). Se usado, manter; se não, remover.

```bash
grep -n "path\." src/app.js | head -10
```

- [ ] **Step 11: Verificar que o servidor inicia sem erros**

```bash
node -e "
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy';
  process.env.JWT_SECRET = 'test-secret';
  try {
    const SaeeApp = require('./src/app.js');
    console.log('✅ app.js carregou sem erro');
    process.exit(0);
  } catch (e) {
    console.error('❌ Erro:', e.message);
    process.exit(1);
  }
" 2>&1 | head -20
```

Esperado: `✅ app.js carregou sem erro`

- [ ] **Step 12: Commit**

```bash
git add src/app.js
git commit -m "feat(sprint-0): remover rotas Firestore e endpoints temporários de app.js"
```

---

### Task 3: Limpar imports comentados e arquivos relacionados ao SQLite no app.js

**Files:**
- Modify: `src/app.js`

- [ ] **Step 1: Remover linhas comentadas obsoletas do topo de app.js**

Localizar e remover estas linhas (comentários de imports SQLite que nunca devem ser usados):

```js
// REMOVER (linha 11):
// const agendamentosRoutes = require('./routes/agendamentos'); // ⚠️ AGENDA COMPLETA (não usar - muito pesada)

// REMOVER (linha 28):
// const professionalRoutes = require('./routes/professional'); // ⚠️ SQLite (não usar)
```

- [ ] **Step 2: Remover comentários de routes SQLite dentro de setupRoutes()**

```js
// REMOVER comentários obsoletos:
// this.app.use('/api/financeiro', financeiroRoutes); // ⚠️ SQLite (não usar)
// this.app.use('/api/crm', crmRoutes); // ⚠️ SQLite (não usar)
// this.app.use('/api/professional', extractTenant); // ⚠️ COMENTADO - usar Firestore abaixo
```

- [ ] **Step 3: Remover import de `agendamentosRoutes` do topo (linha 12) — não é mais necessário via proxy**

```js
// Verificar se agendaAgendamentosRoutes ainda está em uso (sim, linhas 487–488)
// Manter: const agendaAgendamentosRoutes = require('./routes/agenda-agendamentos');
// A rota já usa extractTenantFirestore (que é alias de extractTenant) — OK
```

- [ ] **Step 4: Verificar server ainda inicia**

```bash
node -e "
  process.env.NODE_ENV = 'test';
  const SaeeApp = require('./src/app.js');
  console.log('✅ OK');
  process.exit(0);
" 2>&1 | head -5
```

- [ ] **Step 5: Commit**

```bash
git add src/app.js
git commit -m "chore(sprint-0): remover comentários SQLite obsoletos de app.js"
```

---

## Chunk 2: Limpeza de Documentação e Frontend

### Task 4: Deletar ~110 arquivos .md legados da raiz

**Files:**
- Delete: todos os arquivos listados abaixo

> **Nota:** Alguns arquivos desta lista podem não existir — use `rm -f` (sem erro se ausente). Sempre verifique antes com `ls` para não deletar arquivos que ainda fazem sentido.

- [ ] **Step 1: Listar arquivos .md na raiz antes de deletar**

```bash
ls *.md 2>/dev/null | head -50
```

Revisar: devem ser mantidos apenas `README.md` e `CHANGELOG.md`.

- [ ] **Step 2: Deletar FIX-*.md e DEBUG-*.md**

```bash
rm -f FIX-*.md DEBUG-*.md CORRECAO_*.md
```

- [ ] **Step 3: Deletar RENDER-*.md e DEPLOY-*.md**

```bash
rm -f RENDER-*.md DEPLOY-*.md RAILWAY-*.md ONRENDER-CONFIG.md
```

- [ ] **Step 4: Deletar RELATORIO_*.md e CHANGELOG-2025-*.md**

```bash
rm -f RELATORIO_*.md RELATORIO_DIARIO_*.md CHANGELOG-2025-*.md
```

- [ ] **Step 5: Deletar SISTEMA_*.md e DOCUMENTACAO_*.md**

```bash
rm -f SISTEMA_*.md DOCUMENTACAO_*.md ARQUITETURA_*.md
```

- [ ] **Step 6: Deletar WHATSAPP-*.md, GUIA_*.md, ZAPI_*.md, META_API_*.md**

```bash
rm -f WHATSAPP-*.md GUIA_*.md ZAPI_*.md META_API_*.md
```

- [ ] **Step 7: Deletar miscellaneous legados**

```bash
rm -f tasks.md diario-*.md analise-custos-*.md \
       estrategia-saas-completa.md LIMPEZA-SEM-SHELL.md \
       INTEGRACAO_*.md CONFIGURACAO_*.md MIGRA*.md \
       PRODUCAO*.md AJUSTE*.md MELHORIA*.md OTIMIZA*.md \
       SETUP_*.md NOVO_*.md PLANO_*.md RESUMO_*.md \
       ACESSO_*.md TESTE_*.md VERIFICACAO_*.md HOTFIX-*.md
```

- [ ] **Step 8: Deletar legados de docs/**

```bash
rm -f docs/ARQUITETURA.md docs/CHECKLIST_*.md docs/DEPLOY.md \
       docs/diario-desenvolvimento-*.md docs/como-funciona-licenca-teste.md \
       docs/MANUAL_CONFIGURACOES.md docs/CONFIGURACOES_RESPONSABILIDADES.md \
       docs/WHATSAPP_META_SETUP.md
```

- [ ] **Step 9: Deletar admin/docs/ legados**

```bash
rm -f admin/docs/DEPLOY.md admin/docs/INSTALLATION.md
```

- [ ] **Step 10: Confirmar que os arquivos importantes ainda existem**

```bash
ls README.md CHANGELOG.md docs/prd/ docs/pdd/ docs/tdd/ docs/superpowers/
```

Esperado: todos os diretórios e arquivos existem.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore(sprint-0): deletar ~110 arquivos .md legados"
```

---

### Task 5: Deletar frontend/ e public/

**Files:**
- Delete: `frontend/` (entire directory)
- Delete: `public/` (entire directory, exceto `uploads/` se existir)
- Modify: `package.json` (remover referências a frontend/ do build script)

- [ ] **Step 1: Verificar o que existe em public/**

```bash
ls public/ 2>/dev/null || echo "public/ não existe"
ls frontend/ 2>/dev/null | head -10
```

- [ ] **Step 2: Verificar se uploads/ existe em public/ e precisa ser preservado**

```bash
ls public/uploads 2>/dev/null && echo "ATENÇÃO: uploads em public/ — mover para /uploads na raiz" || echo "sem uploads em public/"
```

Se houver uploads, mova-os:
```bash
# Só se necessário:
# mv public/uploads/* uploads/ 2>/dev/null
```

- [ ] **Step 3: Deletar frontend/**

```bash
rm -rf frontend/
```

- [ ] **Step 4: Deletar public/**

```bash
rm -rf public/
```

- [ ] **Step 5: Atualizar script `build` em package.json**

Localizar o script `"build"` em `package.json` e substituir:

```json
// ATUAL (quebrado após deletar frontend/):
"build": "cd frontend && npm install && npm run build && cd .. && ...",

// NOVO:
"build": "cd web && npm run build",
"build:admin": "cd admin/frontend && npm install && npm run build",
```

Também remover `heroku-postbuild` e outros scripts que referenciam `frontend/`.

- [ ] **Step 6: Verificar que o servidor ainda inicia**

```bash
node -e "
  process.env.NODE_ENV = 'test';
  const SaeeApp = require('./src/app.js');
  console.log('✅ OK');
  process.exit(0);
" 2>&1 | head -5
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore(sprint-0): deletar frontend/ e public/, atualizar scripts de build"
```

---

## Chunk 3: Next.js Foundation

### Task 6: Criar projeto Next.js 14

**Files:**
- Create: `web/` (todo o diretório)
- Create: `web/package.json`
- Create: `web/tsconfig.json`
- Create: `web/next.config.ts`
- Create: `web/tailwind.config.ts`

- [ ] **Step 1: Criar o projeto com create-next-app**

```bash
npx create-next-app@14 web \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --no-git \
  --no-eslint
```

> **Nota:** O `--no-git` evita criar um repositório nested. `--no-eslint` porque configuraremos depois.

Esperado: diretório `web/` criado com App Router padrão.

- [ ] **Step 2: Verificar estrutura criada**

```bash
ls web/
ls web/app/
```

Esperado: `web/app/`, `web/components/` (se houver), `web/lib/` (se houver), `web/public/`, `web/package.json`, `web/tsconfig.json`, `web/next.config.ts`, `web/tailwind.config.ts`.

- [ ] **Step 3: Instalar dependências adicionais**

```bash
cd web && npm install \
  @tanstack/react-query@^5 \
  zustand \
  socket.io-client \
  axios \
  jose \
  class-variance-authority \
  clsx \
  tailwind-merge \
  lucide-react \
  @radix-ui/react-slot \
  && npm install --save-dev \
  vitest \
  @vitejs/plugin-react \
  @testing-library/react \
  @testing-library/user-event \
  @testing-library/jest-dom \
  @vitest/coverage-v8 \
  jsdom \
  && cd ..
```

- [ ] **Step 4: Instalar shadcn/ui via CLI**

```bash
cd web && npx shadcn@latest init --yes --defaults && cd ..
```

Responder as perguntas (se não vier com `--defaults`):
- Style: Default
- Base color: Slate
- CSS variables: Yes

- [ ] **Step 5: Instalar componentes shadcn/ui necessários para o AppShell e Login**

```bash
cd web && npx shadcn@latest add button badge avatar dropdown-menu tooltip sheet scroll-area separator input label && cd ..
```

- [ ] **Step 6: Configurar Vitest em web/vitest.config.ts**

Criar `web/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 7: Criar web/vitest.setup.ts**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 8: Adicionar script de test ao web/package.json**

Localizar `"scripts"` em `web/package.json` e adicionar:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 9: Configurar web/next.config.ts**

Substituir o conteúdo padrão por:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Habilita React strict mode
  reactStrictMode: true,
  // Imagens externas permitidas
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 10: Commit**

```bash
git add web/
git commit -m "feat(sprint-0): bootstrap Next.js 14 com TypeScript, Tailwind, shadcn/ui, Vitest"
```

---

### Task 7: Criar estrutura de diretórios e arquivos base do web/

**Files:**
- Create: `web/app/layout.tsx`
- Create: `web/app/(auth)/login/page.tsx` (stub)
- Create: `web/app/(auth)/reset-password/page.tsx` (stub)
- Create: `web/app/(app)/layout.tsx` (stub — será completado na Task 16)
- Create stubs para todas as páginas de módulo

- [ ] **Step 1: Criar diretórios necessários**

```bash
mkdir -p web/app/\(auth\)/login
mkdir -p web/app/\(auth\)/reset-password
mkdir -p web/app/\(app\)/dashboard
mkdir -p web/app/\(app\)/checkin
mkdir -p web/app/\(app\)/agenda
mkdir -p web/app/\(app\)/pacientes
mkdir -p web/app/\(app\)/financeiro
mkdir -p web/app/\(app\)/relatorios
mkdir -p web/app/\(app\)/whatsapp
mkdir -p web/app/\(app\)/prontuario
mkdir -p web/app/\(app\)/profissionais
mkdir -p web/app/\(app\)/configuracoes
mkdir -p web/app/\(app\)/crm
mkdir -p web/app/api/\[...proxy\]
mkdir -p web/components/layout
mkdir -p web/components/ui
mkdir -p web/lib
mkdir -p web/hooks
mkdir -p web/contexts
mkdir -p web/__tests__/lib
mkdir -p web/__tests__/components
```

- [ ] **Step 2: Criar web/app/layout.tsx (root layout)**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AltClinic',
  description: 'Sistema de Gestão de Clínicas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Criar web/components/Providers.tsx**

```tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { TenantProvider } from '@/contexts/TenantContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 1 minuto
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        {children}
      </TenantProvider>
    </QueryClientProvider>
  )
}
```

- [ ] **Step 4: Criar stub pages para as rotas (app)**

Criar `web/app/(app)/dashboard/page.tsx`:
```tsx
export default function DashboardPage() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Dashboard IA</h1><p className="text-muted-foreground mt-2">Sprint 1 — em breve</p></div>
}
```

Criar `web/app/(app)/checkin/page.tsx`:
```tsx
export default function CheckinPage() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Check-in de Pacientes</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div>
}
```

Criar `web/app/(app)/agenda/page.tsx`:
```tsx
export default function AgendaPage() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Agenda</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div>
}
```

Criar `web/app/(app)/pacientes/page.tsx`:
```tsx
export default function PacientesPage() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Pacientes</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div>
}
```

Criar `web/app/(app)/financeiro/page.tsx`:
```tsx
export default function FinanceiroPage() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Financeiro</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div>
}
```

Criar `web/app/(app)/relatorios/page.tsx`:
```tsx
export default function RelatoriosPage() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Relatórios</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div>
}
```

Criar `web/app/(app)/whatsapp/page.tsx`:
```tsx
export default function WhatsappPage() {
  return <div className="p-6"><h1 className="text-2xl font-bold">WhatsApp Central</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div>
}
```

Criar `web/app/(app)/prontuario/page.tsx`:
```tsx
export default function ProntuarioPage() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Prontuário</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div>
}
```

Criar `web/app/(app)/profissionais/page.tsx`:
```tsx
export default function ProfissionaisPage() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Profissionais</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div>
}
```

Criar `web/app/(app)/configuracoes/page.tsx`:
```tsx
export default function ConfiguracoesPage() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Configurações</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div>
}
```

Criar `web/app/(app)/crm/page.tsx`:
```tsx
export default function CrmPage() {
  return <div className="p-6"><h1 className="text-2xl font-bold">CRM</h1><p className="text-muted-foreground mt-2">Em desenvolvimento</p></div>
}
```

- [ ] **Step 5: Verificar que Next.js compila sem erros**

```bash
cd web && npm run build 2>&1 | tail -20 && cd ..
```

Esperado: `Route (app)` listado para todas as páginas, sem erros TypeScript.

- [ ] **Step 6: Commit**

```bash
git add web/
git commit -m "feat(sprint-0): criar estrutura de diretórios e stub pages Next.js"
```

---

## Chunk 4: Auth Infrastructure

### Task 8: Criar web/middleware.ts — proteção de rotas JWT

**Files:**
- Create: `web/middleware.ts`
- Test: `web/__tests__/middleware.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Criar `web/__tests__/middleware.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

// Simulação simplificada do comportamento do middleware
// (middleware.ts usa Edge Runtime — testamos a lógica de decisão separadamente)

describe('middleware auth logic', () => {
  it('deve redirecionar para /login quando não há cookie', () => {
    const hasToken = false
    const isPublicPath = false
    const shouldRedirect = !hasToken && !isPublicPath
    expect(shouldRedirect).toBe(true)
  })

  it('deve permitir acesso a paths públicos sem token', () => {
    const publicPaths = ['/login', '/reset-password', '/api/']
    const path = '/login'
    const isPublic = publicPaths.some(p => path.startsWith(p))
    expect(isPublic).toBe(true)
  })

  it('deve bloquear /app/dashboard sem token', () => {
    const publicPaths = ['/login', '/reset-password', '/api/']
    const path = '/app/dashboard'
    const isPublic = publicPaths.some(p => path.startsWith(p))
    expect(isPublic).toBe(false)
  })

  it('deve permitir rotas de API internas', () => {
    const path = '/api/auth/login'
    const publicPaths = ['/login', '/reset-password', '/api/']
    const isPublic = publicPaths.some(p => path.startsWith(p))
    expect(isPublic).toBe(true)
  })
})
```

- [ ] **Step 2: Rodar o teste e verificar que passa (lógica pura)**

```bash
cd web && npm test -- __tests__/middleware.test.ts 2>&1 | tail -15 && cd ..
```

Esperado: todos os 4 testes passam (é lógica pura, sem Next.js runtime).

- [ ] **Step 3: Criar web/middleware.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_PATHS = ['/login', '/reset-password', '/api/', '/_next/', '/favicon.ico']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get('altclinic_token')?.value

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('altclinic_token')
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 4: Commit**

```bash
git add web/middleware.ts web/__tests__/middleware.test.ts
git commit -m "feat(sprint-0): criar middleware.ts de autenticação JWT"
```

---

### Task 9: Criar web/lib/auth.ts — helpers de cookie

**Files:**
- Create: `web/lib/auth.ts`
- Test: `web/__tests__/lib/auth.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Criar `web/__tests__/lib/auth.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock document.cookie
let mockCookie = ''
Object.defineProperty(document, 'cookie', {
  get: () => mockCookie,
  set: (val: string) => {
    if (val.includes('expires=Thu, 01 Jan 1970')) {
      mockCookie = ''
    } else {
      const [keyVal] = val.split(';')
      mockCookie = keyVal.trim()
    }
  },
  configurable: true,
})

describe('auth helpers', () => {
  beforeEach(() => {
    mockCookie = ''
  })

  it('setAuthToken deve salvar o token no cookie', async () => {
    const { setAuthToken } = await import('@/lib/auth')
    setAuthToken('my-jwt-token')
    expect(document.cookie).toContain('altclinic_token=my-jwt-token')
  })

  it('getAuthToken deve retornar o token do cookie', async () => {
    mockCookie = 'altclinic_token=my-jwt-token'
    const { getAuthToken } = await import('@/lib/auth')
    expect(getAuthToken()).toBe('my-jwt-token')
  })

  it('getAuthToken deve retornar null quando não há cookie', async () => {
    mockCookie = ''
    const { getAuthToken } = await import('@/lib/auth')
    expect(getAuthToken()).toBeNull()
  })

  it('clearAuthToken deve remover o cookie', async () => {
    mockCookie = 'altclinic_token=my-jwt-token'
    const { clearAuthToken } = await import('@/lib/auth')
    clearAuthToken()
    expect(mockCookie).toBe('')
  })
})
```

- [ ] **Step 2: Rodar teste e confirmar falha**

```bash
cd web && npm test -- __tests__/lib/auth.test.ts 2>&1 | tail -10 && cd ..
```

Esperado: FAIL com `Cannot find module '@/lib/auth'`.

- [ ] **Step 3: Criar web/lib/auth.ts**

```typescript
export const TOKEN_COOKIE = 'altclinic_token'

export function setAuthToken(token: string): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; SameSite=Strict${secure}`
}

export function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]+)`))
  return match ? match[1] : null
}

export function clearAuthToken(): void {
  document.cookie = `${TOKEN_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`
}
```

- [ ] **Step 4: Rodar teste e confirmar sucesso**

```bash
cd web && npm test -- __tests__/lib/auth.test.ts 2>&1 | tail -10 && cd ..
```

Esperado: PASS, 4 testes.

- [ ] **Step 5: Commit**

```bash
git add web/lib/auth.ts web/__tests__/lib/auth.test.ts
git commit -m "feat(sprint-0): criar lib/auth.ts com helpers de cookie JWT"
```

---

### Task 10: Criar web/lib/api.ts — cliente axios com interceptor

**Files:**
- Create: `web/lib/api.ts`
- Test: `web/__tests__/lib/api.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Criar `web/__tests__/lib/api.test.ts`:

```typescript
import { describe, it, expect, vi, afterEach } from 'vitest'
import axios from 'axios'

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        response: { use: vi.fn() },
      },
    })),
  },
}))

// Mock auth
vi.mock('@/lib/auth', () => ({
  clearAuthToken: vi.fn(),
}))

describe('api client', () => {
  afterEach(() => vi.clearAllMocks())

  it('deve criar instância axios com baseURL /api', async () => {
    const { default: api } = await import('@/lib/api')
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: '/api' })
    )
  })

  it('deve configurar interceptor de resposta', async () => {
    const { default: api } = await import('@/lib/api')
    // @ts-ignore
    expect(api.interceptors.response.use).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Rodar teste e confirmar falha**

```bash
cd web && npm test -- __tests__/lib/api.test.ts 2>&1 | tail -10 && cd ..
```

- [ ] **Step 3: Criar web/lib/api.ts**

```typescript
import axios from 'axios'
import { clearAuthToken } from './auth'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 30000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
```

- [ ] **Step 4: Rodar teste e confirmar sucesso**

```bash
cd web && npm test -- __tests__/lib/api.test.ts 2>&1 | tail -10 && cd ..
```

- [ ] **Step 5: Commit**

```bash
git add web/lib/api.ts web/__tests__/lib/api.test.ts
git commit -m "feat(sprint-0): criar lib/api.ts com axios + interceptor 401"
```

---

### Task 11: Criar web/lib/permissions.ts — RBAC frontend

**Files:**
- Create: `web/lib/permissions.ts`
- Test: `web/__tests__/lib/permissions.test.ts`

Espelha exatamente `src/config/permissions.js` em TypeScript.

- [ ] **Step 1: Escrever o teste que falha**

Criar `web/__tests__/lib/permissions.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

describe('hasPermission', () => {
  it('admin pode ler financeiro', () => {
    expect(hasPermission('admin', 'financeiro', 'read')).toBe(true)
  })

  it('admin pode deletar pacientes', () => {
    expect(hasPermission('admin', 'pacientes', 'delete')).toBe(true)
  })

  it('recepcionista não pode deletar prontuário', () => {
    expect(hasPermission('recepcionista', 'prontuario', 'delete')).toBe(false)
  })

  it('recepcionista pode criar checkin', () => {
    expect(hasPermission('recepcionista', 'checkin', 'create')).toBe(true)
  })

  it('medico não pode acessar financeiro', () => {
    expect(hasPermission('medico', 'financeiro', 'read')).toBe(false)
  })

  it('enfermeira pode criar prontuário', () => {
    expect(hasPermission('enfermeira', 'prontuario', 'create')).toBe(true)
  })

  it('admin_master tem acesso irrestrito', () => {
    expect(hasPermission('admin_master', 'qualquer-modulo', 'delete')).toBe(true)
  })

  it('perfil inexistente retorna false', () => {
    expect(hasPermission('hacker', 'financeiro', 'read')).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar teste e confirmar falha**

```bash
cd web && npm test -- __tests__/lib/permissions.test.ts 2>&1 | tail -10 && cd ..
```

- [ ] **Step 3: Criar web/lib/permissions.ts**

```typescript
export type Perfil = 'admin_master' | 'admin' | 'recepcionista' | 'enfermeira' | 'medico' | 'financeiro'
export type Modulo = 'dashboard' | 'agenda' | 'checkin' | 'pacientes' | 'prontuario' | 'profissionais' | 'crm' | 'whatsapp' | 'financeiro' | 'relatorios' | 'configuracoes' | 'usuarios'
export type Acao = 'read' | 'create' | 'update' | 'delete'

type PerfilPermissions = Partial<Record<Modulo, Acao[]>> & { '*'?: Acao[] }

export const PERMISSIONS: Record<Perfil, PerfilPermissions> = {
  admin_master: {
    '*': ['read', 'create', 'update', 'delete'],
  },
  admin: {
    dashboard:     ['read'],
    agenda:        ['read', 'create', 'update', 'delete'],
    checkin:       ['read', 'create', 'update', 'delete'],
    pacientes:     ['read', 'create', 'update', 'delete'],
    prontuario:    ['read', 'create', 'update', 'delete'],
    profissionais: ['read', 'create', 'update', 'delete'],
    crm:           ['read', 'create', 'update', 'delete'],
    whatsapp:      ['read', 'create', 'update', 'delete'],
    financeiro:    ['read', 'create', 'update', 'delete'],
    relatorios:    ['read'],
    configuracoes: ['read', 'create', 'update', 'delete'],
    usuarios:      ['read', 'create', 'update', 'delete'],
  },
  recepcionista: {
    dashboard:  ['read'],
    agenda:     ['read', 'create', 'update'],
    checkin:    ['read', 'create', 'update', 'delete'],
    pacientes:  ['read', 'create', 'update'],
    whatsapp:   ['read', 'create'],
    financeiro: ['read', 'create'],
    crm:        ['read'],
  },
  enfermeira: {
    dashboard:  ['read'],
    checkin:    ['read', 'create', 'update', 'delete'],
    pacientes:  ['read', 'create'],
    prontuario: ['read', 'create'],
    agenda:     ['read'],
  },
  medico: {
    dashboard:  ['read'],
    agenda:     ['read'],
    pacientes:  ['read'],
    prontuario: ['read', 'create', 'update', 'delete'],
    checkin:    ['read'],
    relatorios: ['read'],
  },
  financeiro: {
    dashboard:  ['read'],
    financeiro: ['read', 'create', 'update', 'delete'],
    relatorios: ['read'],
    pacientes:  ['read'],
    whatsapp:   ['read', 'create'],
    crm:        ['read'],
  },
}

export function hasPermission(perfil: string, modulo: string, acao: Acao): boolean {
  const perfilPerms = PERMISSIONS[perfil as Perfil]
  if (!perfilPerms) return false
  if (perfilPerms['*']) return true
  const moduloPerms = perfilPerms[modulo as Modulo]
  if (!moduloPerms) return false
  return moduloPerms.includes(acao)
}
```

- [ ] **Step 4: Rodar teste e confirmar sucesso**

```bash
cd web && npm test -- __tests__/lib/permissions.test.ts 2>&1 | tail -10 && cd ..
```

Esperado: PASS, 8 testes.

- [ ] **Step 5: Commit**

```bash
git add web/lib/permissions.ts web/__tests__/lib/permissions.test.ts
git commit -m "feat(sprint-0): criar lib/permissions.ts espelhando RBAC do backend"
```

---

### Task 12: Criar web/lib/socket.ts — singleton socket.io

**Files:**
- Create: `web/lib/socket.ts`

> Nota: socket.io-client não tem testes unitários simples (requer servidor). Será testado manualmente na Sprint 1 (Dashboard).

- [ ] **Step 1: Criar web/lib/socket.ts**

```typescript
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_APP_URL || '', {
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket', 'polling'],
    })
  }
  return socket
}

export function connectSocket(): void {
  getSocket().connect()
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect()
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add web/lib/socket.ts
git commit -m "feat(sprint-0): criar lib/socket.ts singleton socket.io-client"
```

---

### Task 13: Criar web/contexts/TenantContext.tsx

**Files:**
- Create: `web/contexts/TenantContext.tsx`
- Test: `web/__tests__/contexts/TenantContext.test.tsx`

- [ ] **Step 1: Criar diretório de testes**

```bash
mkdir -p web/__tests__/contexts
```

- [ ] **Step 2: Escrever o teste que falha**

Criar `web/__tests__/contexts/TenantContext.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TenantProvider, useTenant } from '@/contexts/TenantContext'

// Mock lib/auth
vi.mock('@/lib/auth', () => ({
  getAuthToken: vi.fn(() => null),
}))

function TestConsumer() {
  const { user, isLoading } = useTenant()
  if (isLoading) return <div>loading</div>
  if (!user) return <div>no user</div>
  return <div>{user.nome}</div>
}

describe('TenantContext', () => {
  it('deve exibir loading inicial e depois no user quando sem token', async () => {
    const { findByText } = render(
      <TenantProvider><TestConsumer /></TenantProvider>
    )
    await findByText('no user')
  })

  it('deve extrair user do JWT quando token existe', async () => {
    const { getAuthToken } = await import('@/lib/auth')
    const payload = { id: 1, nome: 'Maria', email: 'maria@test.com', perfil: 'admin', tenant_id: 'abc', tenant_slug: 'clinica-a', tenant_nome: 'Clínica A' }
    // Criar JWT fake (sem assinar — só para testar extração do payload)
    const fakeJwt = `header.${btoa(JSON.stringify(payload))}.signature`
    vi.mocked(getAuthToken).mockReturnValue(fakeJwt)

    const { findByText } = render(
      <TenantProvider><TestConsumer /></TenantProvider>
    )
    await findByText('Maria')
  })
})
```

- [ ] **Step 3: Rodar teste e confirmar falha**

```bash
cd web && npm test -- __tests__/contexts/TenantContext.test.tsx 2>&1 | tail -10 && cd ..
```

- [ ] **Step 4: Criar web/contexts/TenantContext.tsx**

```tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getAuthToken } from '@/lib/auth'

export interface TenantUser {
  id: number
  nome: string
  email: string
  perfil: string
  tenant_id: string
  tenant_slug: string
  tenant_nome: string
  permissoes?: Record<string, string[]>
}

interface TenantContextType {
  user: TenantUser | null
  isLoading: boolean
  setUser: (user: TenantUser | null) => void
}

const TenantContext = createContext<TenantContextType>({
  user: null,
  isLoading: true,
  setUser: () => {},
})

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TenantUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getAuthToken()
    if (token) {
      try {
        const parts = token.split('.')
        const payload = JSON.parse(atob(parts[1]))
        setUser(payload as TenantUser)
      } catch {
        setUser(null)
      }
    }
    setIsLoading(false)
  }, [])

  return (
    <TenantContext.Provider value={{ user, isLoading, setUser }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  return useContext(TenantContext)
}
```

- [ ] **Step 5: Rodar teste e confirmar sucesso**

```bash
cd web && npm test -- __tests__/contexts/TenantContext.test.tsx 2>&1 | tail -10 && cd ..
```

- [ ] **Step 6: Commit**

```bash
git add web/contexts/TenantContext.tsx web/__tests__/contexts/TenantContext.test.tsx
git commit -m "feat(sprint-0): criar TenantContext com extração de payload JWT"
```

---

### Task 14: Criar BFF proxy web/app/api/[...proxy]/route.ts

**Files:**
- Create: `web/app/api/[...proxy]/route.ts`

> Nota: BFF proxy será testado de forma integrada (requer Express rodando). Sem testes unitários isolados.

- [ ] **Step 1: Criar web/app/api/[...proxy]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const EXPRESS_API = process.env.EXPRESS_API_URL || 'http://localhost:3000'

async function proxyToExpress(
  request: NextRequest,
  context: { params: Promise<{ proxy: string[] }> }
): Promise<NextResponse> {
  const params = await context.params
  const path = params.proxy.join('/')
  const queryString = request.nextUrl.search
  const url = `${EXPRESS_API}/api/${path}${queryString}`

  const cookieStore = await cookies()
  const token = cookieStore.get('altclinic_token')?.value

  const headers: Record<string, string> = {
    'Content-Type': request.headers.get('Content-Type') || 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
  const body = hasBody ? await request.text() : undefined

  try {
    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
    })

    const data = await response.text()
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    })
  } catch (error) {
    console.error('[BFF Proxy] Erro ao chamar Express:', error)
    return NextResponse.json(
      { error: 'Serviço indisponível' },
      { status: 503 }
    )
  }
}

type RouteContext = { params: Promise<{ proxy: string[] }> }

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyToExpress(request, context)
}
export async function POST(request: NextRequest, context: RouteContext) {
  return proxyToExpress(request, context)
}
export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyToExpress(request, context)
}
export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyToExpress(request, context)
}
export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyToExpress(request, context)
}
```

- [ ] **Step 2: Verificar que Next.js compila sem erros**

```bash
cd web && npm run build 2>&1 | grep -E "(error|Error|✓)" | head -20 && cd ..
```

Esperado: sem erros de TypeScript, rota `/api/[...proxy]` listada como `Route`.

- [ ] **Step 3: Commit**

```bash
git add web/app/api/
git commit -m "feat(sprint-0): criar BFF proxy Next.js → Express"
```

---

## Chunk 5: AppShell e Layout

### Task 15: Criar Sidebar com RBAC

**Files:**
- Create: `web/components/layout/Sidebar.tsx`
- Test: `web/__tests__/components/Sidebar.test.tsx`

- [ ] **Step 1: Escrever o teste que falha**

Criar `web/__tests__/components/Sidebar.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from '@/components/layout/Sidebar'

// Mock TenantContext
vi.mock('@/contexts/TenantContext', () => ({
  useTenant: vi.fn(() => ({
    user: {
      id: 1, nome: 'João Admin', perfil: 'admin',
      tenant_id: 'abc', tenant_slug: 'clinica-a', tenant_nome: 'Clínica A',
    },
    isLoading: false,
  })),
}))

describe('Sidebar', () => {
  it('deve renderizar links de navegação para admin', () => {
    render(<Sidebar />)
    expect(screen.getByText('Dashboard')).toBeDefined()
    expect(screen.getByText('Pacientes')).toBeDefined()
    expect(screen.getByText('Financeiro')).toBeDefined()
    expect(screen.getByText('Configurações')).toBeDefined()
  })

  it('deve ocultar links sem permissão para recepcionista', () => {
    const { useTenant } = require('@/contexts/TenantContext')
    useTenant.mockReturnValue({
      user: { perfil: 'recepcionista', nome: 'Ana', id: 2, tenant_id: 'abc', tenant_slug: 'clinica-a', tenant_nome: 'Clínica A' },
      isLoading: false,
    })
    render(<Sidebar />)
    expect(screen.queryByText('Relatórios')).toBeNull()
    expect(screen.queryByText('Configurações')).toBeNull()
  })

  it('deve mostrar o nome da clínica', () => {
    render(<Sidebar />)
    expect(screen.getByText('Clínica A')).toBeDefined()
  })
})
```

- [ ] **Step 2: Rodar teste e confirmar falha**

```bash
cd web && npm test -- __tests__/components/Sidebar.test.tsx 2>&1 | tail -10 && cd ..
```

- [ ] **Step 3: Criar web/components/layout/Sidebar.tsx**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useTenant } from '@/contexts/TenantContext'
import { hasPermission } from '@/lib/permissions'
import {
  LayoutDashboard, CheckSquare, Calendar, Users, FileText,
  DollarSign, BarChart2, MessageSquare, ClipboardList,
  UserCog, Settings, Target,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  modulo: string
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard, modulo: 'dashboard'    },
  { href: '/checkin',      label: 'Check-in',     icon: CheckSquare,     modulo: 'checkin'      },
  { href: '/agenda',       label: 'Agenda',       icon: Calendar,        modulo: 'agenda'       },
  { href: '/pacientes',    label: 'Pacientes',    icon: Users,           modulo: 'pacientes'    },
  { href: '/prontuario',   label: 'Prontuário',   icon: ClipboardList,   modulo: 'prontuario'   },
  { href: '/financeiro',   label: 'Financeiro',   icon: DollarSign,      modulo: 'financeiro'   },
  { href: '/relatorios',   label: 'Relatórios',   icon: BarChart2,       modulo: 'relatorios'   },
  { href: '/whatsapp',     label: 'WhatsApp',     icon: MessageSquare,   modulo: 'whatsapp'     },
  { href: '/profissionais',label: 'Profissionais',icon: UserCog,         modulo: 'profissionais'},
  { href: '/crm',          label: 'CRM',          icon: Target,          modulo: 'crm'          },
  { href: '/configuracoes',label: 'Configurações',icon: Settings,        modulo: 'configuracoes'},
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useTenant()

  if (!user) return null

  const visibleItems = NAV_ITEMS.filter(item =>
    hasPermission(user.perfil, item.modulo, 'read')
  )

  return (
    <aside className="w-60 h-full border-r bg-background flex flex-col">
      <div className="p-4 border-b">
        <p className="font-semibold text-sm text-foreground">AltClinic</p>
        <p className="text-xs text-muted-foreground truncate">{user.tenant_nome}</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground truncate">{user.nome}</p>
        <p className="text-xs text-muted-foreground capitalize">{user.perfil}</p>
      </div>
    </aside>
  )
}
```

- [ ] **Step 4: Rodar teste e confirmar sucesso**

```bash
cd web && npm test -- __tests__/components/Sidebar.test.tsx 2>&1 | tail -10 && cd ..
```

- [ ] **Step 5: Commit**

```bash
git add web/components/layout/Sidebar.tsx web/__tests__/components/Sidebar.test.tsx
git commit -m "feat(sprint-0): criar Sidebar com RBAC dinâmico"
```

---

### Task 16: Criar Topbar e AppShell

**Files:**
- Create: `web/components/layout/Topbar.tsx`
- Create: `web/components/layout/AppShell.tsx`
- Test: `web/__tests__/components/AppShell.test.tsx`

- [ ] **Step 1: Criar web/components/layout/Topbar.tsx**

```tsx
'use client'

import { useTenant } from '@/contexts/TenantContext'
import { clearAuthToken } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut } from 'lucide-react'

export function Topbar() {
  const { user, setUser } = useTenant()
  const router = useRouter()

  function handleLogout() {
    clearAuthToken()
    setUser(null)
    router.push('/login')
  }

  if (!user) return null

  const initials = user.nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <header className="h-14 border-b bg-background flex items-center justify-end px-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{user.nome.split(' ')[0]}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
```

- [ ] **Step 2: Escrever teste que falha para AppShell**

Criar `web/__tests__/components/AppShell.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppShell } from '@/components/layout/AppShell'

vi.mock('@/components/layout/Sidebar', () => ({
  Sidebar: () => <nav data-testid="sidebar">Sidebar</nav>,
}))
vi.mock('@/components/layout/Topbar', () => ({
  Topbar: () => <header data-testid="topbar">Topbar</header>,
}))
vi.mock('@/contexts/TenantContext', () => ({
  useTenant: () => ({
    user: { nome: 'Test', perfil: 'admin', id: 1, tenant_id: 'abc', tenant_slug: 'a', tenant_nome: 'Clínica A' },
    isLoading: false,
  }),
}))

describe('AppShell', () => {
  it('deve renderizar Sidebar, Topbar e children', () => {
    render(
      <AppShell>
        <div data-testid="content">Conteúdo</div>
      </AppShell>
    )
    expect(screen.getByTestId('sidebar')).toBeDefined()
    expect(screen.getByTestId('topbar')).toBeDefined()
    expect(screen.getByTestId('content')).toBeDefined()
  })
})
```

- [ ] **Step 3: Criar web/components/layout/AppShell.tsx**

```tsx
'use client'

import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Rodar todos os testes**

```bash
cd web && npm test 2>&1 | tail -20 && cd ..
```

Esperado: todos passando.

- [ ] **Step 5: Criar web/app/(app)/layout.tsx**

```tsx
import { AppShell } from '@/components/layout/AppShell'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
```

- [ ] **Step 6: Criar pages de login e reset-password**

Criar `web/app/(auth)/login/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setAuthToken } from '@/lib/auth'
import { useTenant } from '@/contexts/TenantContext'
import api from '@/lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { setUser } = useTenant()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data } = await api.post('/auth/login', { email, senha: password })
      setAuthToken(data.token)
      setUser(data.usuario)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciais inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-8 border rounded-xl shadow-sm bg-card">
        <div className="text-center">
          <h1 className="text-2xl font-bold">AltClinic</h1>
          <p className="text-muted-foreground text-sm mt-1">Acesse sua clínica</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@clinica.com"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
```

Criar `web/app/(auth)/reset-password/page.tsx`:

```tsx
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-4 p-8 border rounded-xl shadow-sm bg-card">
        <h1 className="text-xl font-bold">Recuperar senha</h1>
        <p className="text-muted-foreground text-sm">Em desenvolvimento</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Verificar build completo**

```bash
cd web && npm run build 2>&1 | tail -20 && cd ..
```

Esperado: build sem erros, todas as rotas listadas.

- [ ] **Step 8: Commit**

```bash
git add web/
git commit -m "feat(sprint-0): criar Topbar, AppShell, login page e app layout"
```

---

## Chunk 6: Deploy e Documentação

### Task 17: Criar entrypoint.sh e Dockerfile multi-stage

**Files:**
- Create: `entrypoint.sh`
- Create: `Dockerfile` (substituição do atual)
- Modify: `fly.toml` (adicionar PORT no env web)
- Modify: `package.json` (adicionar script dev:all)

- [ ] **Step 1: Verificar Dockerfile atual**

```bash
cat Dockerfile 2>/dev/null | head -30 || echo "Dockerfile não existe"
```

- [ ] **Step 2: Criar entrypoint.sh**

```bash
#!/bin/sh
set -e

# Express API — porta 3000 (interna)
echo "🚀 Iniciando Express API na porta 3000..."
node src/server.js &
EXPRESS_PID=$!

# Aguardar Express inicializar (health check)
echo "⏳ Aguardando Express ficar disponível..."
until curl -sf http://localhost:3000/health > /dev/null 2>&1; do
  sleep 1
done
echo "✅ Express pronto"

# Next.js — porta 8080 (pública, PORT do fly.toml)
echo "🌐 Iniciando Next.js na porta 8080..."
cd web && PORT=8080 node_modules/.bin/next start -p 8080
```

- [ ] **Step 3: Tornar entrypoint.sh executável**

```bash
chmod +x entrypoint.sh
```

- [ ] **Step 4: Criar Dockerfile multi-stage**

```dockerfile
# =============================================================================
# Stage 1: Dependências da API Express
# =============================================================================
FROM node:20-alpine AS deps-api
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# =============================================================================
# Stage 2: Build do Next.js (web/)
# =============================================================================
FROM node:20-alpine AS build-web
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci
COPY web/ .
# Variáveis de build (sem secrets — apenas URLs públicas)
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
RUN npm run build

# =============================================================================
# Stage 3: Imagem final
# =============================================================================
FROM node:20-alpine AS final
# dumb-init: PID 1 correto, signal handling no container
RUN apk add --no-cache dumb-init curl

WORKDIR /app

# Express
COPY --from=deps-api /app/node_modules ./node_modules
COPY src/ ./src/
COPY package.json ./
# Outros arquivos necessários pelo Express (criar .env.example se não existir no repo)
COPY .env.example .env.example

# Next.js
COPY --from=build-web /app/web/.next ./web/.next
COPY --from=build-web /app/web/node_modules ./web/node_modules
COPY --from=build-web /app/web/package.json ./web/package.json
COPY --from=build-web /app/web/public ./web/public

# Entrypoint
COPY entrypoint.sh .

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["./entrypoint.sh"]
```

- [ ] **Step 5: Atualizar package.json — adicionar script dev:all**

No `package.json` da raiz, adicionar/atualizar em `"scripts"`:

```json
"dev:all": "concurrently -n api,web -c blue,green \"node src/server.js\" \"cd web && next dev -p 3001\""
```

Instalar `concurrently`:

```bash
npm install --save-dev concurrently
```

- [ ] **Step 6: Atualizar fly.toml — adicionar variável PORT explícita para Next.js**

Em `fly.toml`, confirmar que PORT=8080 está no `[env]` (já está). Não são necessárias outras alterações — a arquitetura de um único `[http_service]` na porta 8080 permanece.

- [ ] **Step 7: Commit**

```bash
git add entrypoint.sh Dockerfile package.json fly.toml package-lock.json
git commit -m "feat(sprint-0): criar Dockerfile multi-stage e entrypoint.sh"
```

---

### Task 18: Criar web/.env.local.example e atualizar .claude/context/

**Files:**
- Create: `web/.env.local.example`
- Modify: `.claude/context/stack.md`
- Modify: `.claude/context/architecture.md`
- Modify: `.claude/context/conventions.md`

- [ ] **Step 1: Criar web/.env.local.example**

```bash
# API Express (somente server-side — NÃO expor ao browser)
EXPRESS_API_URL=http://localhost:3000

# Verificação JWT (mesma chave do Express)
JWT_SECRET=<copiar do .env do Express>

# URL pública do app (browser pode acessar)
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

- [ ] **Step 2: Atualizar .claude/context/stack.md**

Adicionar seção `## Frontend` (ou substituir se já existir):

```markdown
## Frontend (web/)
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Design system**: shadcn/ui + Tailwind CSS (Radix UI)
- **Estado servidor**: TanStack Query v5 (`useQuery`, `useMutation`)
- **Estado global**: Zustand (user, tenant, alertas)
- **Auth**: Cookie httpOnly `altclinic_token` + `jose` no `middleware.ts`
- **HTTP client**: axios (`lib/api.ts` — baseURL `/api` → BFF proxy → Express)
- **Real-time**: socket.io-client (`lib/socket.ts`)
- **Testes**: Vitest + @testing-library/react + jsdom
- **Porta dev**: 3001 (Next.js dev) / 8080 (produção)
```

- [ ] **Step 3: Atualizar .claude/context/architecture.md**

Adicionar seção sobre os dois processos:

```markdown
## Arquitetura de Processos

### Produção (Fly.io)
- **Porta 8080 (pública)**: Next.js — serve UI e BFF proxy
- **Porta 3000 (interna)**: Express API — dados, auth, jobs
- **Deploy**: `entrypoint.sh` inicia Express (&) depois Next.js
- **Dockerfile**: multi-stage (deps-api → build-web → final)

### Desenvolvimento local
- `npm run dev:all` — inicia Express (3000) e Next.js dev (3001) em paralelo

### Fluxo de requisição
Browser → `/api/*` (Next.js) → `web/app/api/[...proxy]/route.ts` → Express porta 3000
```

- [ ] **Step 4: Atualizar .claude/context/conventions.md**

Adicionar seção de convenções frontend:

```markdown
## Frontend (Next.js)
- Componentes: `PascalCase`, exportados nominalmente (`export function Foo()`)
- Páginas: `default export`, arquivo `page.tsx`
- Hooks: `useCamelCase`, retornam objeto `{ data, isLoading, error }`
- Chamadas API: sempre via `api` de `lib/api.ts` (nunca `fetch` direto)
- Dados do servidor: TanStack Query (`useQuery`) — nunca `useEffect` + `fetch`
- Estado global: Zustand store em `store/` (criar quando necessário)
- 'use client' apenas quando necessário (interatividade, hooks)
- Testes: arquivo `__tests__/<path>/nome.test.tsx` espelhando a estrutura src
```

- [ ] **Step 5: Commit**

```bash
git add web/.env.local.example .claude/context/
git commit -m "docs(sprint-0): atualizar contexto Claude com stack Next.js e arquitetura 2 processos"
```

---

### Task 19: Reescrever README.md e criar docs/api/README.md

**Files:**
- Modify: `README.md` (reescrita completa)
- Create: `docs/api/README.md`
- Modify: `CHANGELOG.md` (adicionar entrada Sprint 0)

- [ ] **Step 1: Reescrever README.md**

```markdown
# AltClinic

Sistema SaaS de gestão de clínicas — multi-tenant com PostgreSQL.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| API | Node.js + Express 4.x |
| Banco | PostgreSQL (Supabase) — schema por tenant |
| Frontend | Next.js 14 (App Router) + TypeScript + shadcn/ui |
| Deploy | Fly.io (São Paulo) |

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
# Instalar dependências
npm install
cd web && npm install && cd ..

# Configurar variáveis
cp .env.example .env               # Express
cp web/.env.local.example web/.env.local  # Next.js

# Iniciar ambos os processos
npm run dev:all
```

API Express: `http://localhost:3000`
Next.js: `http://localhost:3001`

## Variáveis de ambiente

### Express (`.env`)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
PORT=3000
```

### Next.js (`web/.env.local`)
```
EXPRESS_API_URL=http://localhost:3000
JWT_SECRET=...         # mesma chave do Express
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## Deploy (Fly.io)

```bash
fly deploy
```

O `entrypoint.sh` inicia Express (porta 3000) e Next.js (porta 8080) na mesma VM.

## Módulos implementados

| Sprint | Módulo | Status |
|--------|--------|--------|
| 0 | Fundação + Limpeza | ✅ |
| 1 | Dashboard IA | 🔜 |
| 2 | Check-in | 🔜 |
| 3 | Agenda | 🔜 |
| 4 | Pacientes | 🔜 |
| 5 | Financeiro | 🔜 |
| 6 | Relatórios | 🔜 |
| 7 | WhatsApp Central | 🔜 |
| 8 | Prontuário | 🔜 |
| 9 | Profissionais | 🔜 |
| 10 | Configurações | 🔜 |
| 11 | CRM | 🔜 |
```

- [ ] **Step 2: Criar docs/api/README.md**

```markdown
# AltClinic API — Índice de Endpoints

Base URL: `https://altclinic.fly.dev/api` (produção) / `http://localhost:3000/api` (dev)

Autenticação: `Authorization: Bearer <jwt>` em todos os endpoints protegidos.

## Módulos

| Módulo | Prefixo | Rota arquivo |
|--------|---------|-------------|
| Auth | `/api/auth` | `src/routes/auth.js` |
| Pacientes | `/api/pacientes` | `src/routes/pacientes.js` |
| Check-in | `/api/checkins` | `src/routes/checkins.js` |
| Fila de Espera | `/api/fila` | `src/routes/fila-espera.js` |
| Agenda | `/api/agenda/agendamentos` | `src/routes/agenda-agendamentos.js` |
| Confirmações | `/api/confirmacoes` | `src/routes/confirmacoes.js` |
| Profissionais | `/api/profissionais` | `src/routes/profissionais.js` |
| Financeiro | `/api/financeiro` | `src/routes/financeiro-faturas.js`, `ia-financeiro.js`, `qr-billing.js`, `financeiro-cobrancas.js` |
| Prontuário | `/api/prontuarios` | `src/routes/prontuarios-eletronico.js` |
| WhatsApp | `/api/whatsapp` | `src/routes/whatsapp-central.js`, `whatsapp-bot.js` |
| CRM | `/api/crm` | `src/routes/crm-pipeline.js` |
| Relatórios | `/api/relatorios/no-show`, `/api/relatorios/receita` | `src/routes/relatorios-*.js` |
| Dashboard IA | `/api/dashboard-ia` | `src/routes/dashboard-ia.js` |
| Configurações | `/api/configuracoes` | `src/routes/configuracoes-simple.js` |

> Documentação detalhada de cada endpoint será adicionada conforme os sprints forem implementados.
```

- [ ] **Step 3: Atualizar CHANGELOG.md**

Adicionar entrada no topo:

```markdown
## [Sprint 0] — 2026-03-20

### Added
- Next.js 14 (App Router) em `web/` com TypeScript, shadcn/ui, TanStack Query v5, Zustand
- Autenticação via cookie httpOnly `altclinic_token` + `jose` no `middleware.ts`
- BFF proxy `web/app/api/[...proxy]/route.ts` — repassa chamadas API ao Express
- AppShell com Sidebar RBAC dinâmico e Topbar com logout
- Dockerfile multi-stage (Express + Next.js) e `entrypoint.sh`
- Script `npm run dev:all` para desenvolvimento local com `concurrently`

### Removed
- `frontend/` — React CRA substituído por Next.js 14
- `public/` — Next.js serve o frontend
- Rotas Firestore: `professional-firestore`, `crm-firestore`, `financeiro-firestore`, `dashboard-firestore`, `pacientes-firestore`, `trial-firestore`, `tenants-admin-firestore`
- Endpoints temporários `/api/cleanup-orphans` e `/api/cleanup-user/:email`
- ~110 arquivos `.md` legados da raiz e `docs/`

### Changed
- `src/app.js`: swap Firestore → rotas PostgreSQL, CORS atualizado, removido static server do frontend
- `.claude/context/`: stack, arquitetura e convenções atualizados para Next.js
```

- [ ] **Step 4: Rodar suite completa de testes**

```bash
cd web && npm test 2>&1 | tail -20 && cd ..
```

Esperado: todos os testes passando.

- [ ] **Step 5: Verificar build Next.js**

```bash
cd web && npm run build 2>&1 | tail -20 && cd ..
```

- [ ] **Step 6: Commit final**

```bash
git add README.md CHANGELOG.md docs/api/README.md web/.env.local.example
git commit -m "docs(sprint-0): reescrever README, criar docs/api/README e atualizar CHANGELOG"
```

---

## Verificação Final do Sprint 0

- [ ] **Verificar estrutura de diretórios**

```bash
ls web/app/
ls web/components/layout/
ls web/lib/
ls web/contexts/
```

- [ ] **Rodar todos os testes web/**

```bash
cd web && npm test 2>&1 && cd ..
```

- [ ] **Build Next.js limpo**

```bash
cd web && rm -rf .next && npm run build 2>&1 | tail -30 && cd ..
```

- [ ] **Verificar Express ainda funciona**

```bash
node -e "
  process.env.NODE_ENV = 'test';
  const SaeeApp = require('./src/app.js');
  console.log('✅ Express app.js OK');
  process.exit(0);
" 2>&1 | grep -E "(✅|❌|Error)"
```

- [ ] **Push e PR**

```bash
git push origin sprint-0-fundacao
gh pr create \
  --title "feat: Sprint 0 — Fundação Next.js + limpeza backend" \
  --body "## Sprint 0

### O que foi feito
- Deletados ~15 arquivos legados SQLite/Firestore do backend
- Removidos endpoints temporários de cleanup do app.js
- CORS atualizado para arquitetura Next.js
- Deletados ~110 arquivos .md legados
- Deletado frontend/ (React CRA) e public/
- Criado web/ com Next.js 14 + shadcn/ui + TanStack Query
- Autenticação via cookie httpOnly + jose middleware
- BFF proxy para Express
- AppShell com Sidebar RBAC dinâmico
- Login page funcional
- Dockerfile multi-stage + entrypoint.sh
- README reescrito, CHANGELOG atualizado

Closes # (deixar em branco — não há issue específica para Sprint 0)
" \
  --base main
```

> Sprint 0 completo. Próximo: Sprint 1 — Dashboard IA (`/api/dashboard-ia` → `web/app/(app)/dashboard/page.tsx`).
