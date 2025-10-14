# 🔧 FIX: Corrigir Caminho dos Bancos de Dados dos Tenants

**Data:** 2025-10-13  
**Problema:** Login retornando "Usuário não encontrado"  
**Causa:** Bancos de dados dos tenants sendo procurados no caminho errado

---

## 🔍 Diagnóstico do Problema

### Logs do Servidor (Render)

```
🔐 LOGIN: tenant found: { id: 'test-tenant-1', nome: 'Clínica de Teste', slug: 'teste' }
🔗 Tenant query result for test-tenant-1: { database_name: 'tenant_teste.db' }
🔗 Opening database: /opt/render/project/src/databases/tenant_teste.db
🔧 getTenantDb error: Database do tenant não encontrado: /opt/render/project/src/databases/tenant_teste.db
```

### ❌ Problema Identificado

O sistema estava procurando os bancos dos tenants em:

```
/opt/render/project/src/databases/tenant_teste.db
```

Mas o **Disk Storage** do Render está montado em:

```
/opt/render/project/src/data/
```

**Resultado:** "Database do tenant não encontrado"

---

## ✅ Solução Implementada

### 1. Corrigido `MultiTenantDatabase.js`

**Arquivo:** `src/models/MultiTenantDatabase.js`  
**Linha 24:**

```javascript
// ❌ ANTES:
this.databasesPath = path.join(__dirname, "../../databases");

// ✅ DEPOIS:
this.databasesPath = path.join(__dirname, "../../data");
```

---

### 2. Corrigido `Tenant.js`

**Arquivo:** `src/models/Tenant.js`  
**Linha 210:**

```javascript
// ❌ ANTES:
const dbPath = path.join(__dirname, "../../databases/", `${databaseName}.db`);

// ✅ DEPOIS:
const dbPath = path.join(__dirname, "../../data/", `${databaseName}.db`);
```

---

## 📊 Configuração do Render

### Disk Storage

```yaml
Name: altclinic-data
Mount Path: /opt/render/project/src/data
Size: 1 GB
```

### Estrutura de Diretórios (Produção)

```
/opt/render/project/src/
├── data/                          ✅ Disk Storage (persistente)
│   ├── master.db                 ✅ Banco master
│   ├── tenant_teste.db           ✅ Tenant "teste"
│   ├── tenant_demo-clinic_*.db   ✅ Outros tenants (36 total)
│   └── ...
└── databases/                     ❌ Não usado (caminho errado)
```

---

## 🧪 Validação

### Antes do Fix

```
❌ GET /api/auth/login
Response: 401
{
  "success": false,
  "error": "USER_NOT_FOUND",
  "message": "Usuário não encontrado"
}

Logs:
🔧 getTenantDb error: Database do tenant não encontrado: /opt/render/project/src/databases/tenant_teste.db
```

### Depois do Fix (Esperado)

```
✅ GET /api/auth/login
Response: 200
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "thiagoborgh@gmail.com",
    ...
  }
}

Logs:
🔗 Opening database: /opt/render/project/src/data/tenant_teste.db
✅ User authenticated successfully
```

---

## 🚀 Deploy

### 1. Commit das Alterações

```powershell
git add src/models/MultiTenantDatabase.js src/models/Tenant.js FIX-DATABASE-PATH-PRODUCTION.md
git commit -m "fix: Corrigir caminho dos bancos de dados dos tenants

- Alterado de 'databases/' para 'data/'
- Corrigido MultiTenantDatabase.js (linha 24)
- Corrigido Tenant.js (linha 210)
- Alinha com Disk Storage do Render (/opt/render/project/src/data)

Fixes: Login erro 'Usuário não encontrado'"
git push origin main
```

### 2. Aguardar Auto-Deploy

O Render detectará o commit e fará o deploy automaticamente (3-5 min).

### 3. Verificar Logs do Deploy

```bash
# No Dashboard do Render → Logs
# Procure por:
✅ Build completed successfully
✅ Starting service with 'node src/app.js'
✅ Server running on port 10000
✅ Multi-tenant database manager iniciado
```

---

## ✅ Teste Pós-Deploy

### 1. Aguardar 15 Minutos (Rate Limiter Reset)

O rate limiter ainda está ativo. Aguarde até que o bloqueio expire.

### 2. Testar Login

Acesse: https://altclinic.onrender.com/diagnostic-login.html

**Opção 1 - Auto-detect:**

- Email: `thiagoborgh@gmail.com`
- Senha: `Altclinic123`
- Clique em **"Testar Login (auto-detect tenant)"**

**Resultado esperado:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "thiagoborgh@gmail.com",
    "tenant_id": "test-tenant-1",
    "tenant_slug": "teste"
  }
}
```

---

## 📝 Arquivos Modificados

| Arquivo                             | Linha | Alteração            |
| ----------------------------------- | ----- | -------------------- |
| `src/models/MultiTenantDatabase.js` | 24    | `databases` → `data` |
| `src/models/Tenant.js`              | 210   | `databases` → `data` |

---

## 🎯 Impacto

### ✅ Corrige

- ✅ Login de usuários (erro "Usuário não encontrado")
- ✅ Acesso aos bancos de dados dos tenants
- ✅ Persistência de dados no Disk Storage
- ✅ Todas as operações multi-tenant

### ⚠️ Requer

- ✅ Deploy no Render (auto-deploy habilitado)
- ✅ Rate limiter reset (15 min após último teste)
- ✅ Bancos de dados já existem em `/data/` (36 tenants confirmados)

---

## 📊 Timeline

| Etapa              | Status          | Tempo   |
| ------------------ | --------------- | ------- |
| Commit local       | ✅ Feito        | -       |
| Push para GitHub   | ⏳ Em andamento | -       |
| Auto-deploy Render | ⏳ Aguardando   | 3-5 min |
| Rate limiter reset | ⏳ Aguardando   | ~15 min |
| Teste de login     | ⏳ Pendente     | -       |

---

## 🔗 Referências

- Issue: Login não funcionando em produção
- Root cause: Caminho de databases incorreto
- Solution: Alinhar com Disk Storage mount path
- Documentation: Este arquivo

---

**Status:** Fix implementado, aguardando deploy + rate limiter reset para validação 🚀
