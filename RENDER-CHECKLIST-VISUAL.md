# ✅ CHECKLIST: Configurações Render

**Execute este checklist no Dashboard do Render**  
**URL:** https://dashboard.render.com → altclinic

---

## 📍 1. BUILD & DEPLOY

**Vá em:** Settings → Build & Deploy

### ✅ Build Command
```bash
npm run build:linux
```

**Status atual:**
- [ ] Verificado
- [ ] Correto: `npm run build:linux`
- [ ] Incorreto: `______________________`

---

### ✅ Start Command
```bash
node src/app.js
```

**Status atual:**
- [ ] Verificado
- [ ] Correto: `node src/app.js`
- [ ] Incorreto: `______________________`

---

### ✅ Auto-Deploy
- [ ] Habilitado
- [ ] Branch: `main`

---

## 📍 2. ENVIRONMENT VARIABLES

**Vá em:** Environment

### ✅ Variáveis Obrigatórias:

| Variável | Valor | Status |
|----------|-------|--------|
| `NODE_ENV` | `production` | [ ] OK |
| `PORT` | `10000` (auto) | [ ] OK |
| `JWT_SECRET` | [64 chars] | [ ] OK |
| `CORS_ORIGIN` | `https://altclinic.onrender.com` | [ ] OK |
| `MASTER_DB_PATH` | `./data/master.db` | [ ] OK |

### ✅ Verificações:

- [ ] NODE_ENV está como `production`
- [ ] JWT_SECRET tem pelo menos 32 caracteres
- [ ] CORS_ORIGIN é a URL do serviço Render
- [ ] Não há variáveis duplicadas

---

## 📍 3. DISK STORAGE

**Vá em:** Disks

### ✅ Configuração do Disco:

- [ ] Disk existe
- [ ] **Name:** `altclinic-data` (ou similar)
- [ ] **Mount Path:** `/opt/render/project/src/data`
- [ ] **Size:** 1 GB ou mais

### ⚠️ Se não existir:
1. Clique em "Add Disk"
2. Name: `altclinic-data`
3. Mount Path: `/opt/render/project/src/data`
4. Size: 1 GB
5. Salvar

---

## 📍 4. HEALTH CHECK

**Vá em:** Settings → Health & Alerts

### ✅ Health Check Path:
```
/api/health
```

**Status atual:**
- [ ] Configurado
- [ ] Path: `/api/health`
- [ ] Timeout: 30s (padrão)

---

## 📍 5. DEPLOY LOGS

**Vá em:** Logs

### ✅ Verificar últimos logs:

**Build logs (procure por):**
- [ ] ✅ `Installing dependencies...`
- [ ] ✅ `Running build command: npm run build:linux`
- [ ] ✅ `> cd frontend && npm install && npm run build`
- [ ] ✅ `> cd admin/frontend && npm install && npm run build`
- [ ] ✅ `> mkdir -p public && mkdir -p public/admin`
- [ ] ✅ `> cp -r frontend/build/* public/`
- [ ] ✅ `Build completed successfully`

**Deploy logs (procure por):**
- [ ] ✅ `Starting service with 'node src/app.js'`
- [ ] ✅ `Server running on port 10000`
- [ ] ✅ `Database initialized`
- [ ] ✅ `Your service is live`

**Erros (NÃO deve aparecer):**
- [ ] ❌ `npm ERR!`
- [ ] ❌ `Error: Cannot find module`
- [ ] ❌ `ENOENT: no such file or directory`
- [ ] ❌ `Port already in use`

---

## 📍 6. ENDPOINTS TEST

**Teste os endpoints principais:**

### ✅ Health Check
```bash
curl https://altclinic.onrender.com/api/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-13T...",
  "uptime": 123.456,
  "environment": "production"
}
```

- [ ] Testado
- [ ] Resposta OK

---

### ✅ Init Status
```bash
curl https://altclinic.onrender.com/api/auth/init-status
```

**Resposta esperada:**
```json
{
  "success": true,
  "initialized": true,
  "tenants": 36,
  "users": 26
}
```

- [ ] Testado
- [ ] Sistema inicializado

---

### ✅ Frontend
```
https://altclinic.onrender.com/
```

**Deve mostrar:**
- [ ] Página de login
- [ ] Logo e estilo corretos
- [ ] Console sem erros críticos

---

## 📍 7. SHELL ACCESS

**Vá em:** Shell

### ✅ Comandos de verificação:

```bash
# Verificar diretório atual
pwd

# Ver arquivos
ls -la

# Verificar package.json
cat package.json | grep "build:linux"

# Verificar banco de dados
ls -la data/

# Verificar public/
ls -la public/
```

**Resultados esperados:**
- [ ] `/opt/render/project/src` (ou similar)
- [ ] `package.json` existe
- [ ] `data/` existe
- [ ] `public/` existe com arquivos HTML/CSS/JS

---

## 📍 8. CONFIGURAÇÕES AVANÇADAS

**Vá em:** Settings → Advanced

### ✅ Verificar:

- [ ] **Docker Command:** (vazio/padrão)
- [ ] **Pre-Deploy Command:** (vazio/padrão)
- [ ] **Root Directory:** (vazio ou ".")
- [ ] **Build Filter:** (vazio/padrão)

---

## 🚨 PROBLEMAS ENCONTRADOS?

### ❌ Build Command errado

**Se está:**
- `npm install && npm run build` ❌
- `npm start` ❌
- Outro comando ❌

**Corrija para:**
```bash
npm run build:linux
```

---

### ❌ JWT_SECRET não configurado

**Gere um novo:**
```bash
# No seu terminal local
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Copie o resultado e cole em Environment Variables**

---

### ❌ Disk não configurado

**Sintomas:**
- Banco de dados perdido após deploy
- Erro "ENOENT: no such file or directory"
- Dados não persistem

**Solução:**
1. Vá em Disks
2. Add Disk
3. Configure conforme Passo 3 acima

---

### ❌ Build falhando

**Logs mostram:**
```
npm ERR! missing script: build
```

**Solução:**
```bash
# Corrija o Build Command para:
npm run build:linux
```

---

## 📊 RESUMO DAS CONFIGURAÇÕES

### Configuração Completa:

```yaml
# BUILD & DEPLOY
Build Command: npm run build:linux
Start Command: node src/app.js
Auto-Deploy: Yes (branch: main)

# ENVIRONMENT
NODE_ENV=production
JWT_SECRET=[64 caracteres aleatórios]
CORS_ORIGIN=https://altclinic.onrender.com
MASTER_DB_PATH=./data/master.db

# DISK
Name: altclinic-data
Mount: /opt/render/project/src/data
Size: 1 GB

# HEALTH CHECK
Path: /api/health
```

---

## ✅ VALIDAÇÃO FINAL

Após configurar tudo:

1. **Manual Deploy**
   - [ ] Settings → Manual Deploy → Deploy latest commit
   - [ ] Aguardar conclusão (3-5 min)

2. **Verificar Logs**
   - [ ] Build: SUCCESS
   - [ ] Deploy: SUCCESS
   - [ ] No errors

3. **Testar Endpoints**
   - [ ] /api/health → OK
   - [ ] /api/auth/init-status → OK
   - [ ] / (root) → Frontend carrega

4. **Testar Login**
   - [ ] https://altclinic.onrender.com/diagnostic-login.html
   - [ ] Clicar em "Testar Login (auto-detect)"
   - [ ] Verificar resultado

---

## 🎯 PRÓXIMO PASSO

**Se TUDO estiver ✅:**
- Acesse: https://altclinic.onrender.com/diagnostic-login.html
- Teste o login
- Se funcionar: Sistema pronto! 🎉

**Se ALGO estiver ❌:**
- Anote o que está errado
- Corrija seguindo as soluções acima
- Execute Manual Deploy novamente
- Verifique logs

---

**Me avise quando terminar o checklist!** 📋
