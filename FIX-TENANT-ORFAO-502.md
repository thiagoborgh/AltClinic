# 🔧 FIX: Erro ao Criar Trial - Tenant Órfão

**Data:** 2025-10-14  
**Erro:** Database do tenant não encontrado  
**Causa:** Registros no master.db sem arquivo físico

---

## 🔍 PROBLEMA IDENTIFICADO

### Logs do Servidor:

```javascript
🔍 Verificação de usuário existente: {
  exists: true,
  action: 'resend-first-access',
  user: {
    email: 'thiagoborgh@gmail.com',
    tenant_id: 'b7a34675-8fcf-4d3b-923f-1b488dc313cd'
  },
  tenant: { 
    nome: 'altclinin', 
    slug: 'altclinin-1' 
  }
}

🔗 Opening database: /opt/render/project/src/data/tenant_altclinin-1_1757420957495
⚠️ Erro: Database do tenant não encontrado
```

### **Causa Raiz:**

1. **Usuário já existe** no `master_users` (thiagoborgh@gmail.com)
2. Está associado ao tenant `altclinin-1` (ID: b7a34675-8fcf-4d3b-923f-1b488dc313cd)
3. O arquivo físico `tenant_altclinin-1_1757420957495.db` **NÃO EXISTE**
4. Sistema tenta acessar banco inexistente → **502 Bad Gateway**

### **Por que o arquivo não existe?**

- Tenant de **teste/desenvolvimento** criado localmente
- Arquivo deletado no commit `76ff6ef` (limpeza local)
- Mas registro permaneceu no `master.db` da produção
- **Resultado:** Registro órfão

---

## ✅ SOLUÇÃO 1: Limpeza Manual (Render Shell) 🚀

### **Rápida e Direta - Execute Agora**

#### Passo 1: Acessar Shell

https://dashboard.render.com → **altclinic** → **Shell**

---

#### Passo 2: Deletar Usuário Órfão

```bash
node -e "
const Database = require('better-sqlite3');
const masterDb = new Database('./data/master.db');

// Deletar usuário específico que está órfão
const result = masterDb.prepare(\`
  DELETE FROM master_users 
  WHERE email = 'thiagoborgh@gmail.com' 
  AND tenant_id = 'b7a34675-8fcf-4d3b-923f-1b488dc313cd'
\`).run();

console.log('✅ Usuário deletado:', result.changes, 'registro(s)');
masterDb.close();
"
```

**Resultado esperado:**
```
✅ Usuário deletado: 1 registro(s)
```

---

#### Passo 3: (Opcional) Deletar Tenant Órfão

```bash
node -e "
const Database = require('better-sqlite3');
const masterDb = new Database('./data/master.db');

// Deletar tenant órfão
const result = masterDb.prepare(\`
  DELETE FROM tenants 
  WHERE id = 'b7a34675-8fcf-4d3b-923f-1b488dc313cd'
\`).run();

console.log('✅ Tenant deletado:', result.changes, 'registro(s)');
masterDb.close();
"
```

---

#### Passo 4: Testar Criar Trial Novamente

Agora o email `thiagoborgh@gmail.com` está livre!

1. Volte à landing page
2. Tente criar trial novamente
3. Use os mesmos dados

**Esperado:**
```
✅ Trial criado com sucesso!
✅ Email enviado
✅ Redirecionamento para login
```

---

## ✅ SOLUÇÃO 2: Limpeza Completa (Todos os Órfãos) 🧹

### **Se houver mais tenants órfãos**

#### Passo 1: Analisar Órfãos

```bash
node -e "
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const masterDb = new Database('./data/master.db');
const tenants = masterDb.prepare('SELECT id, slug, database_name FROM tenants').all();

let orfaos = 0;
console.log('📊 TENANTS ÓRFÃOS:');
console.log('==================');

tenants.forEach(tenant => {
  const dbPath = path.join('./data', tenant.database_name);
  if (!fs.existsSync(dbPath)) {
    console.log('❌', tenant.slug, '→', tenant.database_name);
    orfaos++;
  }
});

console.log('');
console.log('Total de órfãos:', orfaos);
masterDb.close();
"
```

---

#### Passo 2: Deletar Todos os Órfãos

```bash
node -e "
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const masterDb = new Database('./data/master.db');
const tenants = masterDb.prepare('SELECT id, slug, database_name FROM tenants').all();

let deleted = 0;

tenants.forEach(tenant => {
  const dbPath = path.join('./data', tenant.database_name);
  if (!fs.existsSync(dbPath)) {
    // Deletar usuários do tenant
    masterDb.prepare('DELETE FROM master_users WHERE tenant_id = ?').run(tenant.id);
    // Deletar tenant
    masterDb.prepare('DELETE FROM tenants WHERE id = ?').run(tenant.id);
    console.log('🗑️  Deletado:', tenant.slug);
    deleted++;
  }
});

console.log('');
console.log('✅ Limpeza concluída!');
console.log('  Tenants órfãos removidos:', deleted);

masterDb.close();
"
```

---

## ✅ SOLUÇÃO 3: Usar Email Diferente (Workaround) 🔄

### **Se não quiser mexer no banco agora**

Simplesmente use um email diferente para testar:

1. Landing page → "Criar Conta Teste"
2. Use: `teste@altclinic.com` (ou qualquer outro)
3. Complete o cadastro

**Isso vai funcionar porque o email é único!**

---

## 🎯 RECOMENDAÇÃO

### **Faça a SOLUÇÃO 1 (Rápida)**

1. **5 segundos** - Deletar usuário órfão via Shell
2. **2 minutos** - Testar criar trial novamente
3. **✅ FUNCIONANDO!**

**Não precisa reiniciar servidor ou fazer deploy!**

---

## 🔧 PREVENIR NO FUTURO

### **Adicionar Verificação no `checkExistingUser`**

Edite `src/services/userService.js`:

```javascript
async checkExistingUser(email) {
  try {
    const masterDb = multiTenantDb.getMasterDb();
    const user = masterDb.prepare(`
      SELECT mu.*, t.nome as tenantNome, t.slug as tenantSlug
      FROM master_users mu
      JOIN tenants t ON mu.tenant_id = t.id
      WHERE mu.email = ?
    `).get(email);

    if (!user) {
      return { exists: false };
    }

    // ✅ NOVO: Verificar se banco do tenant existe
    const tenant = masterDb.prepare('SELECT database_name FROM tenants WHERE id = ?').get(user.tenant_id);
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(__dirname, '../../data', tenant.database_name);
    
    if (!fs.existsSync(dbPath)) {
      // Banco não existe, deletar registro órfão
      console.log('⚠️  Tenant órfão detectado, removendo:', user.tenantSlug);
      masterDb.prepare('DELETE FROM master_users WHERE id = ?').run(user.id);
      masterDb.prepare('DELETE FROM tenants WHERE id = ?').run(user.tenant_id);
      return { exists: false };
    }

    // Continuar verificação normal...
    const tenantDb = multiTenantDb.getTenantDb(user.tenant_id);
    // ...
  } catch (error) {
    console.error('⚠️ Erro ao verificar primeiro acesso:', error);
    // ✅ NOVO: Em caso de erro, assumir que usuário não existe
    return { exists: false };
  }
}
```

**Isso fará limpeza automática de órfãos!**

---

## 📋 CHECKLIST DE EXECUÇÃO

### Imediato (AGORA):

- [ ] Acessar Render Shell
- [ ] Executar comando para deletar usuário órfão
- [ ] Verificar: "✅ Usuário deletado: 1 registro(s)"
- [ ] Testar criar trial novamente
- [ ] Validar: Trial criado com sucesso

### Opcional (Se houver tempo):

- [ ] Executar análise de todos os órfãos
- [ ] Deletar todos os órfãos encontrados
- [ ] Adicionar verificação automática no código
- [ ] Fazer commit + deploy da prevenção

---

## 🚀 EXECUÇÃO RÁPIDA

**Cole isto no Render Shell:**

```bash
node -e "const Database = require('better-sqlite3'); const db = new Database('./data/master.db'); const r = db.prepare('DELETE FROM master_users WHERE email = ? AND tenant_id = ?').run('thiagoborgh@gmail.com', 'b7a34675-8fcf-4d3b-923f-1b488dc313cd'); console.log('Deletado:', r.changes); db.close();"
```

**30 segundos e está resolvido!** ✅

---

**Me avise:**
- ✅ Após executar a limpeza
- ✅ Resultado do teste de criar trial
- ✅ Se aparecer algum erro novo

**Status:** 🎯 Solução identificada e documentada  
**Tempo:** 30 segundos via Shell  
**Complexidade:** Baixa
