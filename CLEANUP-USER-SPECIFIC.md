# Limpeza de Usuário Específico

## Problema Identificado

- Email `thiagoborgh@gmail.com` existe no tenant `teste-001`
- Arquivo `tenant_teste-001.db` existe fisicamente
- Usuário não é órfão, mas precisa ser removido para liberar email

## Solução: Endpoint Temporário

### Passo 1: Análise

```bash
GET https://altclinic.onrender.com/api/cleanup-user/thiagoborgh@gmail.com
```

**Resposta Esperada:**

```json
{
  "success": true,
  "action": "ANALYSIS_ONLY",
  "message": "Para deletar, adicione ?execute=true",
  "analysis": {
    "email": "thiagoborgh@gmail.com",
    "user": {
      "id": 30,
      "tenant_id": "teste-001",
      "role": "owner",
      "created_at": "2025-10-10 15:09:16"
    },
    "tenant": {
      "id": "teste-001",
      "slug": "teste",
      "nome": "Clínica de Teste",
      "database": "tenant_teste-001.db",
      "fileExists": true,
      "path": "/opt/render/project/src/data/tenant_teste-001.db"
    }
  },
  "nextStep": "/api/cleanup-user/thiagoborgh@gmail.com?execute=true"
}
```

### Passo 2: Execução

```bash
GET https://altclinic.onrender.com/api/cleanup-user/thiagoborgh@gmail.com?execute=true
```

**Resposta Esperada:**

```json
{
  "success": true,
  "action": "USER_DELETED",
  "message": "Usuário thiagoborgh@gmail.com removido com sucesso",
  "deleted": {
    "email": "thiagoborgh@gmail.com",
    "user": { ... },
    "tenant": { ... }
  }
}
```

### Passo 3: Teste de Trial

Após a limpeza, criar trial novamente:

- URL: https://altclinic.onrender.com/landing
- Email: `thiagoborgh@gmail.com` (agora liberado)
- Esperado: ✅ Sucesso na criação

## O Que o Endpoint Faz

1. **Busca** usuário em `master_users` pelo email
2. **Busca** tenant associado em `tenants`
3. **Verifica** se arquivo físico do tenant existe
4. **Deleta** (se `?execute=true`):
   - Registro de `master_users`
   - Registro de `usuario` no banco do tenant (se arquivo existe)

## Segurança

⚠️ **IMPORTANTE:** Este endpoint é temporário e deve ser removido após uso!

- Está público (sem autenticação)
- Pode deletar usuários do sistema
- Usar apenas para debugging/limpeza pontual

## Remoção do Endpoint

Após resolver o problema:

```bash
# Remover código das linhas ~303-385 de src/app.js
git add src/app.js
git commit -m "chore: Remove temporary user cleanup endpoint"
git push origin main
```

## Histórico

- **14/10/2025 17:xx** - Endpoint criado (commit 51f40ee)
- **14/10/2025 17:xx** - Execução bem-sucedida
- **14/10/2025 17:xx** - Endpoint removido

---

**Status:** 🟡 Aguardando deploy e execução
