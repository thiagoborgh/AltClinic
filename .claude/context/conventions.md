# Convencoes — AltClinic

## Backend (Express)
- Rotas: arquivos em `src/routes/`, exportam `router`
- Nomes de arquivos: `kebab-case.js`
- Middleware de auth: `src/middleware/auth.js`
- Erros: sempre retornar `{ error: "mensagem" }` com status HTTP correto

## Frontend (Next.js)
- Componentes: `PascalCase`, exportados nominalmente (`export function Foo()`)
- Paginas: `default export`, arquivo `page.tsx`
- Hooks: `useCamelCase`, retornam objeto `{ data, isLoading, error }`
- Chamadas API: sempre via `api` de `lib/api.ts` (nunca `fetch` direto)
- Dados do servidor: TanStack Query (`useQuery`) — nunca `useEffect` + `fetch`
- Estado global: Zustand store em `store/` (criar quando necessario)
- 'use client' apenas quando necessario (interatividade, hooks)
- Testes: arquivo `__tests__/<path>/nome.test.tsx` espelhando a estrutura src

## Geral
- Idioma: portugues brasileiro nos comentarios e mensagens de usuario
- Commits: `feat|fix|docs|chore|refactor(escopo): descricao`
- Sem emojis em arquivos de codigo ou sh
