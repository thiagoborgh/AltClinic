# ⚠️ PROBLEMAS CRÍTICOS - Variáveis de Ambiente Render

**Data:** 2025-10-13  
**Análise:** Variáveis de ambiente da produção (Render)

---

## ❌ PROBLEMA 1: DATABASE_PATH e DB_PATH Incorretos

### Variáveis Atuais (ERRADAS):

```env
DATABASE_PATH=./data/saee.db          ❌ ERRADO
DB_PATH=./saee.db                     ❌ ERRADO
```

### ⚠️ Problemas:

1. **`DATABASE_PATH`** aponta para `saee.db` (banco antigo monolítico)
2. **`DB_PATH`** aponta para raiz sem `/data/`
3. Sistema é **MULTI-TENANT**, não usa mais banco único!

### ✅ Solução:

**REMOVER** essas variáveis ou **CORRIGIR** para:

```env
MASTER_DB_PATH=./data/master.db       ✅ CORRETO
```

**OU simplesmente DELETAR** se não estiverem sendo usadas.

---

## ❌ PROBLEMA 2: FALTA MASTER_DB_PATH

### Variável Ausente:

```env
MASTER_DB_PATH=./data/master.db       ❌ NÃO CONFIGURADA
```

### ⚠️ Impacto:

O código em `MultiTenantDatabase.js` pode estar usando caminho hardcoded:

```javascript
const masterDbPath = process.env.MASTER_DB_PATH || 
                     path.join(__dirname, '../../data/master.db');
```

Se não estiver configurado, usa fallback. Mas é **CRÍTICO** para produção!

### ✅ Solução:

**ADICIONAR** a variável:

```env
MASTER_DB_PATH=./data/master.db
```

---

## ❌ PROBLEMA 3: CORS_ORIGIN Faltando

### Variável Ausente:

```env
CORS_ORIGIN=https://altclinic.onrender.com   ❌ NÃO CONFIGURADA
```

### Variável Existente (Relacionada):

```env
FRONTEND_URL=https://alt-clinic.onrender.com  ✅ Existe
```

### ⚠️ Problemas:

1. **URL diferente:** `alt-clinic` vs `altclinic` (hífen!)
2. CORS pode estar bloqueando requisições do frontend

### ✅ Solução:

**DECIDIR** qual URL é a correta e configurar:

```env
# Se a URL é com hífen:
CORS_ORIGIN=https://alt-clinic.onrender.com
FRONTEND_URL=https://alt-clinic.onrender.com

# OU se é sem hífen:
CORS_ORIGIN=https://altclinic.onrender.com
FRONTEND_URL=https://altclinic.onrender.com
```

---

## ⚠️ PROBLEMA 4: JWT_SECRET Fraco

### Variável Atual:

```env
JWT_SECRET=AltClinic2024SuperSeguro!         ⚠️ FRACO (31 chars)
```

### ⚠️ Problema:

- Apenas **31 caracteres**
- Não é hash criptográfico
- Previsível (nome do projeto + ano)

### ✅ Solução:

**GERAR** um novo JWT_SECRET forte (64+ caracteres):

```bash
# No seu terminal local:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Resultado exemplo:**
```
a1f3e8b9c7d2456789abcdef0123456789fedcba9876543210abcdef01234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678
```

---

## ✅ VARIÁVEIS CORRETAS

Estas estão OK:

```env
NODE_ENV=production                   ✅ OK
PORT=10000                            ✅ OK
JWT_EXPIRATION=24h                    ✅ OK
SESSION_SECRET=AltClinicSession2024!  ✅ OK (mas poderia ser mais forte)
ENCRYPTION_KEY=a1b2c3d4...            ✅ OK (64 chars)

# Email
EMAIL_FROM=AltClinic SaaS <thiagoborgh@gmail.com>  ✅ OK
SMTP_HOST=smtp.gmail.com              ✅ OK
SMTP_PORT=587                         ✅ OK
SMTP_SECURE=false                     ✅ OK
SMTP_USER=thiagoborgh@gmail.com       ✅ OK
SMTP_PASS=mxdzvyiftxucoipc            ✅ OK (App Password)

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...    ✅ OK (test mode)
STRIPE_SECRET_KEY=sk_test_...         ✅ OK (test mode)
STRIPE_WEBHOOK_SECRET=whsec_...       ✅ OK
```

---

## 🎯 AÇÕES OBRIGATÓRIAS

### 1. REMOVER/CORRIGIR Variáveis Antigas

**No Render Dashboard → Environment:**

```
❌ DELETAR: DATABASE_PATH
❌ DELETAR: DB_PATH
```

Essas variáveis são do sistema monolítico antigo e **NÃO** devem existir no sistema multi-tenant!

---

### 2. ADICIONAR Variáveis Faltando

**No Render Dashboard → Environment → Add Environment Variable:**

```env
MASTER_DB_PATH=./data/master.db
```

---

### 3. CORRIGIR CORS_ORIGIN

**Verificar qual URL está correta:**

1. Acesse: https://dashboard.render.com → altclinic
2. Veja a URL no topo (Settings)
3. Se for `https://altclinic.onrender.com` (SEM hífen):

```env
CORS_ORIGIN=https://altclinic.onrender.com
FRONTEND_URL=https://altclinic.onrender.com
```

4. Se for `https://alt-clinic.onrender.com` (COM hífen):

```env
CORS_ORIGIN=https://alt-clinic.onrender.com
FRONTEND_URL=https://alt-clinic.onrender.com
```

---

### 4. (OPCIONAL) Fortalecer JWT_SECRET

**Gerar novo:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Substituir:**

```env
JWT_SECRET=[novo_hash_gerado_128_caracteres]
```

⚠️ **ATENÇÃO:** Isso invalidará todos os tokens existentes! Usuários precisarão fazer login novamente.

---

## 📊 RESUMO DAS MUDANÇAS

| Ação | Variável | Valor Atual | Valor Novo |
|------|----------|-------------|------------|
| ❌ DELETAR | `DATABASE_PATH` | `./data/saee.db` | (remover) |
| ❌ DELETAR | `DB_PATH` | `./saee.db` | (remover) |
| ✅ ADICIONAR | `MASTER_DB_PATH` | (não existe) | `./data/master.db` |
| ✅ ADICIONAR | `CORS_ORIGIN` | (não existe) | `https://altclinic.onrender.com` |
| ⚠️ OPCIONAL | `JWT_SECRET` | (31 chars) | (128 chars hash) |

---

## 🔍 POR QUE ISSO ESTÁ CAUSANDO O ERRO DE LOGIN?

### Conexão com o Erro:

Logs mostraram:

```
🔗 Opening database: /opt/render/project/src/databases/tenant_teste.db
🔧 getTenantDb error: Database do tenant não encontrado
```

### Causa Raiz (MÚLTIPLA):

1. **Código usava caminho errado** (`databases/` em vez de `data/`)
   - ✅ **CORRIGIDO** no commit `eb47351`

2. **Variáveis apontam para banco antigo** (`DATABASE_PATH=./data/saee.db`)
   - ❌ **AINDA NÃO CORRIGIDO**
   - Pode estar confundindo o sistema

3. **MASTER_DB_PATH não configurado**
   - ❌ **AINDA NÃO CORRIGIDO**
   - Sistema pode estar usando fallback incorreto

### Solução Completa:

1. ✅ Código corrigido (commit eb47351) → Deploy em andamento
2. ❌ **Variáveis precisam ser corrigidas** → FAZER AGORA
3. ⏳ Rate limiter expira → Aguardar ou usar Shell

---

## 📋 PASSO A PASSO PARA CORRIGIR

### No Render Dashboard:

1. **Acesse:** https://dashboard.render.com
2. **Clique em:** altclinic
3. **Vá em:** Environment (menu lateral)

---

### Deletar Variáveis Antigas:

4. **Encontre:** `DATABASE_PATH`
5. **Clique em:** ⚙️ (engrenagem) → Delete
6. **Confirme:** Yes

7. **Encontre:** `DB_PATH`
8. **Clique em:** ⚙️ (engrenagem) → Delete
9. **Confirme:** Yes

---

### Adicionar Variáveis Novas:

10. **Clique em:** Add Environment Variable (botão azul)
11. **Key:** `MASTER_DB_PATH`
12. **Value:** `./data/master.db`
13. **Save**

14. **Clique em:** Add Environment Variable
15. **Key:** `CORS_ORIGIN`
16. **Value:** `https://altclinic.onrender.com` (ou com hífen, conforme sua URL)
17. **Save**

---

### Trigger Manual Deploy:

18. **Vá em:** Settings (menu lateral)
19. **Vá em:** Build & Deploy
20. **Clique em:** Manual Deploy → Deploy latest commit
21. **Aguarde:** 3-5 minutos

---

## ⚠️ IMPACTO DO DEPLOY

**O que acontece:**

- Servidor será reiniciado
- Variáveis novas serão carregadas
- Código novo (commit eb47351) será aplicado
- **TUDO deve funcionar depois disso!**

**Tempo de indisponibilidade:**

- ~2-3 minutos durante restart

**Usuários afetados:**

- Temporariamente não conseguem acessar
- Retorna automaticamente após deploy

---

## ✅ VALIDAÇÃO PÓS-CORREÇÃO

### 1. Verificar Logs do Deploy

Procure por:

```
✅ Loading environment variables...
✅ MASTER_DB_PATH: ./data/master.db
✅ CORS_ORIGIN: https://altclinic.onrender.com
✅ Starting service with 'node src/app.js'
✅ Multi-tenant database manager iniciado
✅ Your service is live 🚀
```

---

### 2. Testar Health Check

```powershell
Invoke-WebRequest -Uri "https://altclinic.onrender.com/api/health"
```

**Esperado:**

```json
{
  "success": true,
  "status": "ok"
}
```

---

### 3. Aguardar Rate Limiter + Testar Login

Após 15 minutos do último teste:

```
https://altclinic.onrender.com/diagnostic-login.html
```

**Esperado:**

```json
{
  "success": true,
  "token": "...",
  "user": {...}
}
```

---

## 🎯 RESULTADO ESPERADO

Após corrigir as variáveis + deploy:

```
✅ Variáveis antigas removidas (DATABASE_PATH, DB_PATH)
✅ Variáveis novas adicionadas (MASTER_DB_PATH, CORS_ORIGIN)
✅ Código corrigido aplicado (databases/ → data/)
✅ Sistema multi-tenant funcionando
✅ Login funcionando
✅ Produção estável
```

---

## 📝 CHECKLIST DE CORREÇÃO

- [ ] Acessar Render Dashboard
- [ ] Deletar `DATABASE_PATH`
- [ ] Deletar `DB_PATH`
- [ ] Adicionar `MASTER_DB_PATH=./data/master.db`
- [ ] Adicionar `CORS_ORIGIN=https://altclinic.onrender.com`
- [ ] (Opcional) Atualizar `JWT_SECRET`
- [ ] Trigger Manual Deploy
- [ ] Aguardar deploy concluir (3-5 min)
- [ ] Verificar logs do deploy
- [ ] Testar health check
- [ ] Aguardar rate limiter (15 min)
- [ ] Testar login

---

**Status:** ⚠️ CORREÇÃO URGENTE NECESSÁRIA  
**Prioridade:** 🔴 ALTA  
**Tempo Estimado:** 5 minutos para corrigir + 5 min deploy + 15 min rate limiter
