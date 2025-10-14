# 🔍 VALIDAR ESTADO DA PRODUÇÃO

**Objetivo:** Verificar se as migrações e limpezas locais afetaram a produção

---

## ❓ PERGUNTAS

### 1. Fizemos migrações locais?

**Resposta:** Sim, várias migrações foram executadas:

- `008_create_professional_schedules.js`
- `009_add_professional_id_to_schedules.js`
- `010_add_professional_schedules_to_tenants.js`
- `015_add_professional_id_to_schedules.js`
- `add-license-columns.js`

### 2. Excluímos tenants locais?

**Resposta:** Sim, commit `76ff6ef` removeu:

- `databases/tenant_teste.db`
- `databases/tenant_altclinic_*.db`
- Vários outros bancos de tenant de teste

### 3. Produção contemplou essas mudanças?

**Resposta:** ⚠️ **NÃO AUTOMATICAMENTE!**

---

## 🏗️ DIFERENÇA: LOCAL vs PRODUÇÃO

### LOCAL (Desenvolvimento)

```
c:\Users\thiag\saee\
├── databases/              ❌ LIMPO (commit 76ff6ef)
│   └── (vazio)
├── data/
│   └── master.db           ✅ Pode existir
└── src/
```

### PRODUÇÃO (Render)

```
/opt/render/project/src/
├── databases/              ⚠️ Caminho antigo (não usado mais)
├── data/                   ✅ Disk Storage (persistente)
│   ├── master.db          ✅ Existe
│   ├── tenant_teste.db    ❓ Precisa verificar
│   └── tenant_*.db        ❓ 36 tenants confirmados
└── src/
```

---

## 🔍 O QUE PRECISA SER VERIFICADO

### 1. Quantos tenants existem em produção?

Já sabemos: **36 tenants** (confirmado pelo `/api/auth/init-status`)

### 2. Quais são esses tenants?

**Precisamos listar:**

```sql
SELECT id, slug, nome, status, created_at
FROM tenants
ORDER BY created_at DESC;
```

### 3. Os bancos de dados existem fisicamente?

**Verificar em `/data/`:**

```bash
ls -la data/*.db
```

### 4. As migrações foram aplicadas em produção?

**Verificar estrutura das tabelas:**

```sql
-- Verificar se tabela professional_schedules existe
SELECT name FROM sqlite_master
WHERE type='table' AND name='professional_schedules';

-- Verificar colunas de licença
PRAGMA table_info(tenants);
```

---

## ✅ COMO VERIFICAR (2 Opções)

### OPÇÃO 1: Via Render Shell 🚀

1. Acesse: https://dashboard.render.com → altclinic → Shell

2. **Listar todos os tenants:**

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('./data/master.db', { readonly: true });
const tenants = db.prepare('SELECT id, slug, nome, status FROM tenants ORDER BY created_at').all();
console.log('Total:', tenants.length);
console.log(JSON.stringify(tenants, null, 2));
db.close();
"
```

3. **Verificar arquivos de banco:**

```bash
ls -lh data/*.db | awk '{print $9, $5}'
```

4. **Verificar estrutura de um tenant:**

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('./data/tenant_teste.db', { readonly: true });
const tables = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table'\").all();
console.log('Tables:', tables);
db.close();
"
```

---

### OPÇÃO 2: Via API (após rate limiter expirar)

1. **Criar endpoint de diagnóstico temporário**

Adicionar em `src/app.js`:

```javascript
// Diagnóstico de produção (remover após validação)
app.get("/api/diagnostic/tenants", async (req, res) => {
  try {
    const tenants = multiTenantDb.masterDb
      .prepare("SELECT id, slug, nome, status, database_name FROM tenants")
      .all();

    const tenantFiles = [];
    for (const tenant of tenants) {
      const dbPath = path.join(__dirname, "../data", tenant.database_name);
      const exists = fs.existsSync(dbPath);
      const size = exists ? fs.statSync(dbPath).size : 0;
      tenantFiles.push({
        slug: tenant.slug,
        database: tenant.database_name,
        exists,
        size,
      });
    }

    res.json({ tenants, tenantFiles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

2. **Testar endpoint:**

```powershell
Invoke-WebRequest -Uri "https://altclinic.onrender.com/api/diagnostic/tenants"
```

---

## ⚠️ CENÁRIOS POSSÍVEIS

### CENÁRIO 1: Produção está OK ✅

**Resultado esperado:**

- 36 tenants listados
- Todos os arquivos `.db` existem em `/data/`
- Estrutura das tabelas completa com migrações

**Ação:** Nenhuma necessária, produção independente do local!

---

### CENÁRIO 2: Produção tem tenants de teste 🧹

**Resultado:**

- Tenants com nomes de teste (testprimeiroacesso*, trialtest*, etc.)
- Criados durante desenvolvimento
- Não são necessários em produção

**Ação:** Criar script de limpeza para produção:

```javascript
// cleanup-test-tenants-production.js
const tenants = db
  .prepare(
    "SELECT id, slug FROM tenants WHERE slug LIKE 'test%' OR slug LIKE 'trial%'"
  )
  .all();

console.log("Tenants de teste encontrados:", tenants.length);
// Decidir se remove ou mantém
```

---

### CENÁRIO 3: Migrações não aplicadas ⚠️

**Resultado:**

- Tabelas faltando (ex: `professional_schedules`)
- Colunas faltando (ex: colunas de licença)

**Ação:** Executar migrações em produção:

```bash
# No Render Shell
node migrations/migrate.js
```

---

## 🎯 AÇÃO IMEDIATA RECOMENDADA

### Passo 1: Usar Render Shell AGORA

Não precisa esperar rate limiter! Vá direto ao Shell:

```bash
# 1. Listar tenants
node -e "const db=require('better-sqlite3')('./data/master.db');console.log(db.prepare('SELECT slug, nome FROM tenants').all());db.close();"

# 2. Ver arquivos
ls -lh data/*.db

# 3. Contar tenants vs arquivos
echo "Tenants no DB: $(node -e "const db=require('better-sqlite3')('./data/master.db');console.log(db.prepare('SELECT COUNT(*) as c FROM tenants').get().c);db.close();")"
echo "Arquivos .db: $(ls data/tenant_*.db | wc -l)"
```

---

## 📊 IMPACTO DAS MUDANÇAS LOCAIS

| Mudança Local                     | Afeta Produção? | Motivo                               |
| --------------------------------- | --------------- | ------------------------------------ |
| Deletar `databases/tenant_*.db`   | ❌ NÃO          | Produção usa `/data/` (Disk Storage) |
| Executar migrações locais         | ❌ NÃO          | Migrações só rodam onde executadas   |
| Limpar código de teste            | ✅ SIM          | Código é deployado via git           |
| Corrigir caminho (databases→data) | ✅ SIM          | Código deployado no commit eb47351   |

---

## ✅ CONCLUSÃO PRELIMINAR

**Resposta à sua pergunta:**

> "nós fizemos algumas migration, excluímos alguns tenants, produção contemplou as mudanças?"

### Não automaticamente! Aqui está o que aconteceu:

1. **Migrações locais:** ❌ NÃO foram aplicadas em produção (migrações são manuais)
2. **Exclusão de tenants locais:** ❌ NÃO afetou produção (ambientes separados)
3. **Limpeza de databases/ locais:** ❌ NÃO afetou produção (Disk Storage separado)
4. **Fix do caminho (eb47351):** ✅ SIM será aplicado após deploy

### Produção está preservada porque:

- ✅ Disk Storage é persistente e isolado
- ✅ Banco `master.db` está em `/data/` (não foi tocado)
- ✅ 36 tenants confirmados existentes
- ✅ 26 usuários confirmados existentes

### Próximos passos:

1. **Verificar estado real** via Render Shell (comandos acima)
2. **Decidir se limpa tenants de teste** em produção
3. **Aplicar migrações pendentes** se necessário
4. **Validar login** após fix do caminho (eb47351)

---

**Use o Render Shell AGORA para verificar!** 🚀

Não precisa esperar rate limiter para explorar o banco de dados.
