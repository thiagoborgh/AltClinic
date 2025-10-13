# 🚨 FIX: Erro 502 ao Criar Trial na Landing Page

**Data:** 2025-10-13  
**Erro:** `502 Bad Gateway` em `/api/tenants/register`  
**Ambiente:** Produção (Render)

---

## 🔍 ERRO REPORTADO

### Console do Navegador:

```
POST api/tenants/register:1  Failed to load resource: the server responded with a status of 502 ()
Erro ao criar trial: SyntaxError: Failed to execute 'json' on 'Response': Unexpected end of JSON input
```

### Informações Adicionais:

- **Endpoint:** `/api/tenants/register` (POST)
- **Método:** Criar novo tenant trial via landing page
- **Status HTTP:** 502 (Bad Gateway)
- **Erro JSON:** Resposta vazia (não é JSON válido)

---

## 🎯 CAUSA RAIZ PROVÁVEL

### 502 Bad Gateway significa:

1. **Servidor travou** processando a requisição
2. **Timeout** - operação demorou demais (>30s)
3. **Crash** durante execução
4. **Memória insuficiente**

### Possíveis causas específicas:

#### 1. **MultiTenantDatabase não inicializado** 🚨

```javascript
const multiTenantDb = require('../models/MultiTenantDatabase');
const masterDb = multiTenantDb.getMasterDb();
```

**Se `multiTenantDb` não foi inicializado corretamente:**
- `getMasterDb()` retorna `null`
- Operações no banco falham
- Servidor trava

**Relacionado com:** Variáveis de ambiente erradas (`DATABASE_PATH`, falta `MASTER_DB_PATH`)

---

#### 2. **Caminho errado dos bancos** 🚨

```javascript
// Em MultiTenantDatabase.js (CORRIGIDO no commit eb47351)
this.databasesPath = path.join(__dirname, '../../data');
```

**Se o deploy ainda não aplicou o fix:**
- Sistema tenta criar banco em `/databases/` (não existe)
- Falha ao criar `tenant_*.db`
- Operação trava

---

#### 3. **Função `seedTenantData` travando** ⚠️

```javascript
await seedTenantData(tenantDb, tenantId);
```

**Se `seedTenantData` tem muitas operações:**
- Pode ultrapassar timeout do Render (30s)
- Servidor retorna 502

---

#### 4. **Email service travando** ⚠️

```javascript
await emailService.sendEmail({
  to: ownerEmail,
  subject: `Bem-vindo à ${clinicaNome}...`,
  ...
});
```

**Se SMTP falhar ou demorar:**
- Timeout
- 502

---

## ✅ SOLUÇÕES

### SOLUÇÃO 1: Verificar Status do Deploy 🎯

**O fix do caminho (`eb47351`) já foi deployado?**

1. Acesse: https://dashboard.render.com → altclinic → Logs
2. Procure por:
   ```
   ✅ Build completed successfully
   ✅ Checked out commit: eb47351 (ou posterior)
   ✅ Your service is live
   ```

**Se NÃO foi deployado ainda:**
- Aguarde o auto-deploy concluir (~5 min)
- Ou force manual deploy

---

### SOLUÇÃO 2: Corrigir Variáveis de Ambiente 🚨

**CRÍTICO:** As variáveis erradas estão causando o problema!

#### Passo 1: Acessar Environment

https://dashboard.render.com → altclinic → Environment

#### Passo 2: Deletar variáveis antigas

- ❌ `DATABASE_PATH` → Delete
- ❌ `DB_PATH` → Delete

#### Passo 3: Adicionar variáveis corretas

- ✅ `MASTER_DB_PATH` = `./data/master.db`
- ✅ `CORS_ORIGIN` = `https://altclinic.onrender.com`

#### Passo 4: Manual Deploy

Settings → Build & Deploy → Manual Deploy → Deploy latest commit

---

### SOLUÇÃO 3: Adicionar Logging na Rota 🔍

**Para diagnosticar onde trava exatamente:**

Adicione logs detalhados em `src/routes/tenants.js`:

```javascript
router.post('/register', async (req, res) => {
  console.log('🚀 [REGISTER] Início da requisição');
  
  try {
    console.log('📝 [REGISTER] Body:', req.body);
    
    // ... validações ...
    console.log('✅ [REGISTER] Validações OK');
    
    const masterDb = multiTenantDb.getMasterDb();
    console.log('✅ [REGISTER] MasterDB obtido:', !!masterDb);
    
    // ... verificações ...
    console.log('✅ [REGISTER] Slug disponível');
    
    // Transação
    console.log('🔄 [REGISTER] Iniciando transação...');
    transaction();
    console.log('✅ [REGISTER] Transação concluída');
    
    // Criar database
    console.log('🔄 [REGISTER] Criando database do tenant...');
    await multiTenantDb.createTenantDatabase(tenantId, databaseName);
    console.log('✅ [REGISTER] Database criado');
    
    // Seed data
    console.log('🔄 [REGISTER] Inserindo dados iniciais...');
    await seedTenantData(tenantDb, tenantId);
    console.log('✅ [REGISTER] Dados iniciais inseridos');
    
    // Email
    console.log('🔄 [REGISTER] Enviando email...');
    await emailService.sendEmail(...);
    console.log('✅ [REGISTER] Email enviado');
    
    console.log('✅ [REGISTER] Sucesso total!');
    res.status(201).json({...});
    
  } catch (error) {
    console.error('❌ [REGISTER] ERRO:', error);
    console.error('❌ [REGISTER] Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});
```

**Deploy e teste novamente** para ver onde trava nos logs.

---

### SOLUÇÃO 4: Timeout do Email (Fallback) ⚠️

**Se o email está causando timeout:**

```javascript
// Enviar email de forma assíncrona (não aguardar)
// Em vez de: await emailService.sendEmail(...)

// Fazer:
emailService.sendEmail({
  to: ownerEmail,
  subject: `Bem-vindo à ${clinicaNome}`,
  template: 'first-access',
  data: templateData
}).catch(error => {
  console.error('⚠️ Erro ao enviar email (assíncrono):', error);
});

// NÃO aguardar o envio, responder imediatamente
res.status(201).json({...});
```

---

### SOLUÇÃO 5: Verificar Inicialização do Sistema 🔧

**No `src/app.js`, garantir que MultiTenantDatabase está inicializado:**

```javascript
const multiTenantDb = require('./models/MultiTenantDatabase');

// Aguardar inicialização antes de aceitar requisições
class App {
  constructor() {
    this.app = express();
    this.init();
  }

  async init() {
    // Configurações...
    
    // Garantir que banco está pronto
    try {
      const masterDb = multiTenantDb.getMasterDb();
      if (!masterDb) {
        throw new Error('Master DB não inicializado');
      }
      console.log('✅ MultiTenantDatabase pronto');
    } catch (error) {
      console.error('❌ Erro ao inicializar MultiTenantDatabase:', error);
      process.exit(1);
    }
    
    // Rotas...
    this.setupRoutes();
    
    // Iniciar servidor
    this.start();
  }
}
```

---

## 🧪 TESTE MANUAL VIA SHELL

**Para isolar o problema, teste diretamente no Render Shell:**

### Passo 1: Acessar Shell

https://dashboard.render.com → altclinic → Shell

### Passo 2: Testar criação de tenant

```bash
node -e "
const multiTenantDb = require('./src/models/MultiTenantDatabase');
const { v4: uuidv4 } = require('uuid');
const bcryptjs = require('bcryptjs');

async function testCreateTenant() {
  try {
    console.log('1. Obtendo masterDb...');
    const masterDb = multiTenantDb.getMasterDb();
    console.log('✅ MasterDb:', !!masterDb);
    
    console.log('2. Testando insert...');
    const tenantId = uuidv4();
    const slug = 'test-trial-' + Date.now();
    const databaseName = 'tenant_' + slug + '_' + Date.now();
    
    const insertTenant = masterDb.prepare(\`
      INSERT INTO tenants (
        id, slug, nome, email, telefone, plano, status, 
        trial_expire_at, database_name, config, billing, theme
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    \`);
    
    insertTenant.run(
      tenantId,
      slug,
      'Teste Trial',
      'teste@teste.com',
      '11999999999',
      'trial',
      'trial',
      new Date(Date.now() + 30*24*60*60*1000).toISOString(),
      databaseName,
      '{}',
      '{}',
      '{}'
    );
    
    console.log('✅ Tenant inserido:', tenantId);
    
    console.log('3. Criando database...');
    await multiTenantDb.createTenantDatabase(tenantId, databaseName);
    console.log('✅ Database criado');
    
    console.log('4. Limpando teste...');
    masterDb.prepare('DELETE FROM tenants WHERE id = ?').run(tenantId);
    console.log('✅ Teste completo com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  }
}

testCreateTenant();
"
```

---

## 📊 CHECKLIST DE DIAGNÓSTICO

- [ ] Deploy do commit `eb47351` (fix caminho) concluído
- [ ] Variáveis de ambiente corrigidas:
  - [ ] `DATABASE_PATH` deletada
  - [ ] `DB_PATH` deletada
  - [ ] `MASTER_DB_PATH` adicionada
  - [ ] `CORS_ORIGIN` adicionada
- [ ] Manual deploy executado após correção
- [ ] Logs do servidor verificados (Render → Logs)
- [ ] Teste manual via Shell executado
- [ ] Rota `/register` testada novamente
- [ ] Email service funcionando

---

## 🎯 PRIORIDADE DE AÇÕES

### 1. **URGENTE** - Corrigir Variáveis (5 min)

Deletar `DATABASE_PATH` e `DB_PATH`, adicionar `MASTER_DB_PATH`

### 2. **URGENTE** - Manual Deploy (5 min)

Garantir que código corrigido está rodando

### 3. **IMPORTANTE** - Verificar Logs (2 min)

Ver onde está travando exatamente

### 4. **DIAGNÓSTICO** - Teste via Shell (3 min)

Isolar o problema (banco vs rota vs email)

### 5. **FIX** - Aplicar solução específica

Baseado no resultado do diagnóstico

---

## 📝 PRÓXIMOS PASSOS

1. **Corrija as variáveis de ambiente** (seguir `FIX-ENVIRONMENT-VARIABLES-RENDER.md`)
2. **Execute manual deploy**
3. **Monitore os logs** durante novo teste de criação de trial
4. **Reporte** o que aparece nos logs (compartilhe aqui)
5. **Aplique fix específico** baseado no diagnóstico

---

**Status:** 🚨 CRÍTICO - Variáveis erradas causando 502  
**Solução:** Corrigir variáveis + deploy + monitorar logs  
**Tempo Estimado:** 10-15 minutos para corrigir
