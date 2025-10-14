# 🚨 BLOQUEIO: Rate Limiter Ativo

**Data:** 13 de Outubro de 2025  
**Problema:** Muitas tentativas de login  
**Status:** 🔴 BLOQUEADO por 15 minutos

---

## ❌ ERRO ATUAL

```json
{
  "success": false,
  "message": "Muitas tentativas de login. Tente novamente em 15 minutos."
}
```

**Causa:** Rate limiter configurado para máximo 5 tentativas de login a cada 15 minutos.

---

## ⏱️ AGUARDAR

**Tempo de bloqueio:** 15 minutos  
**Ação:** Aguarde até poder testar novamente

**Enquanto isso, você pode:**

1. ☕ Tomar um café
2. 📖 Revisar a documentação
3. 🔍 Verificar outras configurações do Render

---

## 🔧 ALTERNATIVAS (SEM ESPERAR)

### Opção 1: Usar Shell do Render

**O Shell do Render não passa pelo rate limiter!**

1. **Acesse:** https://dashboard.render.com → altclinic → Shell

2. **Execute:**

   ```bash
   node -e "const UsuarioModel = require('./src/models/UsuarioMultiTenant'); const multiTenantDb = require('./src/models/MultiTenantDatabase'); const db = multiTenantDb.getMasterDb(); const tenants = db.prepare('SELECT id, slug, nome FROM tenants LIMIT 5').all(); console.log('Primeiros 5 tenants:', tenants);"
   ```

3. **Isso mostrará os tenants disponíveis**

---

### Opção 2: Testar após 15 minutos

**Aguarde 15 minutos e depois:**

1. Acesse: https://altclinic.onrender.com/diagnostic-login.html
2. Clique: "🔄 Testar Login (auto-detect)"
3. Veja qual tenant funciona

---

### Opção 3: Verificar Tenants no Shell

**Para descobrir qual tenant usar:**

```bash
# No Shell do Render
node -e "
const db = require('better-sqlite3')('./data/master.db');
const tenants = db.prepare('SELECT id, slug, nome FROM tenants').all();
console.log('Tenants disponíveis:');
tenants.forEach(t => console.log('- Slug:', t.slug, '| Nome:', t.nome));
"
```

---

### Opção 4: Criar Usuário Agora (Sem Rate Limit)

**Via Shell do Render:**

```bash
node create-first-user-production.js
```

**Isso criará:**

- ✅ Tenant "teste" (se não existir)
- ✅ Usuário com email: thiagoborgh@gmail.com
- ✅ Senha: Altclinic123

---

## 🔍 VERIFICAR RATE LIMITER

### Configuração Atual (src/app.js):

```javascript
// Rate limiting mais restritivo para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de login por IP
  message: {
    success: false,
    message: "Muitas tentativas de login. Tente novamente em 15 minutos.",
  },
});
this.app.use("/api/auth/login", authLimiter);
```

**Motivo:** Segurança contra ataques de força bruta.

---

## ⏰ TIMELINE

1. **Agora:** Bloqueado por rate limiter
2. **+15 min:** Bloqueio liberado
3. **Depois:** 5 novas tentativas disponíveis

**Horário atual:** 13 de Outubro, ~17:30  
**Liberação:** 13 de Outubro, ~17:45

---

## 📝 AÇÃO RECOMENDADA

### Melhor opção agora:

**Via Shell do Render:**

1. **Acesse Shell**

   ```
   https://dashboard.render.com → altclinic → Shell
   ```

2. **Liste tenants:**

   ```bash
   node -e "const db = require('better-sqlite3')('./data/master.db'); db.prepare('SELECT slug, nome FROM tenants').all().forEach(t => console.log(t.slug, '-', t.nome));"
   ```

3. **Veja qual tenant existe**

4. **Ou crie usuário:**
   ```bash
   node create-first-user-production.js
   ```

---

## 🎯 PRÓXIMOS PASSOS

### Opção A: Aguardar 15 minutos ⏱️

- [ ] Aguardar até ~17:45
- [ ] Testar login novamente
- [ ] Usar auto-detect
- [ ] ✅ Funcionará!

### Opção B: Usar Shell agora 🔧

- [ ] Acessar Shell do Render
- [ ] Listar tenants disponíveis
- [ ] Ou criar usuário
- [ ] ✅ Sem rate limit!

---

## 📊 RESUMO

**Problema:** Rate limiter bloqueou após várias tentativas  
**Tempo de bloqueio:** 15 minutos  
**Solução 1:** Aguardar 15 minutos  
**Solução 2:** Usar Shell do Render (sem rate limit)

**Status do sistema:** ✅ Funcionando (apenas rate limit ativo)

---

## 🔐 CONFIGURAÇÃO DE SEGURANÇA

**Rate limits configurados:**

- ✅ API geral: 100 requests / 15 min
- ✅ Login: 5 tentativas / 15 min
- ✅ Proteção contra força bruta

**Isso é BOM!** Significa que a segurança está funcionando. 🛡️

---

**ESCOLHA:**

1. ⏱️ Aguardar 15 minutos
2. 🔧 Usar Shell do Render agora

**Qual você prefere?** 🤔
