# /implementar — Orquestrador de Implementação

Você é o **orquestrador principal** do AltClinic Dev System.
Seu papel é ler uma issue do GitHub, planejar o trabalho e coordenar subagentes
para implementar a feature com controle de contexto e gate de staging.

---

## Como usar
```
/implementar #8
/implementar #17 --batch-size 3
/implementar #21 --only-plan
```

---

## Passo 1 — Leitura de contexto (SEMPRE)
Leia antes de qualquer coisa:
- @context/stack.md
- @context/architecture.md
- @context/conventions.md
- @CLAUDE.md

## Passo 2 — Leitura da issue
Leia a issue do GitHub via `gh` CLI:
```bash
gh issue view [NUMBER] --repo thiagoborgh/AltClinic --json title,body,labels,milestone
```
Extraia:
- O que precisa ser feito
- Fase (label)
- Critérios de aceite (checklist no body)

## Passo 3 — Mapeamento de arquivos
Liste todos os arquivos que precisam ser criados ou modificados.
Agrupe em **lotes de 5 arquivos** (máximo 8) por subagente.

Apresente o plano completo:
```
## Plano de Implementação — Issue #N: [título]

### Lotes de trabalho
Lote 1 (Subagente Backend-A):
  - src/routes/auth.js          [MODIFICAR]
  - src/routes/pacientes.js     [MODIFICAR]
  - src/routes/agendamentos.js  [MODIFICAR]

Lote 2 (Subagente Backend-B):
  - src/routes/dashboard.js     [MODIFICAR]
  - src/routes/financeiro.js    [MODIFICAR]
  - src/routes/whatsapp.js      [MODIFICAR]

Lote 3 (Subagente Frontend):
  - frontend/src/services/api.js [MODIFICAR]

### Branch de trabalho
  feature/issue-[N]-[descricao-kebab]

### Testes necessários
  [listar arquivos de teste]

### Estimativa
  [N] lotes × ~10min = ~[N×10]min total
```

**PARE aqui e aguarde confirmação do usuário.**

## Passo 4 — Criar branch e executar lotes

Após confirmação:

```bash
git checkout -b feature/issue-[N]-[descricao]
```

Para cada lote, use o Agent tool com este prompt para o subagente:

```
Você é o Subagente Backend do AltClinic — Lote [X] da Issue #[N].

CONTEXTO DO PROJETO:
- Stack: Node.js + Express + PostgreSQL (pg) — NÃO mais SQLite
- Multi-tenant: schema por tenant via TenantDb (src/database/TenantDb.js)
- API assíncrona: await req.db.get/all/run/query — NUNCA .prepare().get()
- Parâmetros PostgreSQL: $1, $2, $3 — NUNCA ?
- Auth: src/middleware/auth.js

ARQUIVOS DO SEU LOTE:
[lista dos arquivos]

TAREFA:
[descrição específica do que fazer nesses arquivos]

REGRAS:
1. Leia cada arquivo antes de editar
2. Migre APENAS os arquivos do seu lote
3. Não toque em arquivos fora do lote
4. Faça commit ao final: git commit -m "feat(issue-[N]): [descrição] — lote [X]"
5. Reporte: arquivos modificados, linhas alteradas, problemas encontrados
```

Aguarde cada subagente terminar antes de iniciar o próximo.

## Passo 5 — Testes

Após todos os lotes:
```bash
npm test -- --forceExit --passWithNoTests
```

Se falhar, corrija na mesma branch antes de continuar.

## Passo 6 — Push e deploy no Staging

```bash
git push origin feature/issue-[N]-[descricao]
```

O GitHub Actions irá automaticamente:
1. Rodar os testes
2. Deploy no Fly.io Staging: `https://altclinic-api-staging.fly.dev`

Informe o usuário:
```
✅ Lotes concluídos. Testes passando.
🚀 Deploy no staging: https://altclinic-api-staging.fly.dev
📋 Teste os endpoints e me avise quando quiser aprovar para produção.
```

## Passo 7 — Aprovação e produção

Quando o usuário disser "aprovado" ou "ok para produção":

```bash
gh pr create \
  --title "feat: [título da issue] (#[N])" \
  --body "Closes #[N]\n\n## O que foi feito\n[resumo]\n\n## Testado em\nhttps://altclinic-api-staging.fly.dev" \
  --base main

# Após merge automático ou manual, o CI faz deploy em produção
```

## Passo 8 — Fechar issue

```bash
gh issue close [N] \
  --repo thiagoborgh/AltClinic \
  --comment "✅ Implementado e em produção. PR: [link]"
```

---

## Controle de contexto (anti-overflow)

- Máximo de **5 arquivos por subagente** (8 em casos simples)
- Cada subagente opera de forma **completamente isolada**
- O orquestrador **não lê o código** — apenas coordena e valida commits
- Se um subagente travar, pule e marque o arquivo para revisão manual

## Regras de qualidade (sempre verificar)

- [ ] Nenhuma query usando `.prepare()` — deve ser `await req.db.get/all/run`
- [ ] Parâmetros com `$1, $2` — não `?`
- [ ] `tenant_id` presente em toda query de dados
- [ ] `try/catch` em todo handler de rota
- [ ] Testes passando
