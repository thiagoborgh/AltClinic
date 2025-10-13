# 🚨 CORREÇÃO URGENTE: Build Command Render

**Data:** 13 de Outubro de 2025  
**Problema:** Build Command com comandos Windows em ambiente Linux  
**Gravidade:** 🔴 CRÍTICO

---

## ❌ PROBLEMA IDENTIFICADO

### Build Command ATUAL (ERRADO):
```bash
cd frontend && npm install && npm run build && cd .. && cd admin/frontend && npm install && npm run build && cd ../.. && mkdir -p public && mkdir -p public/admin && cp -r frontend/build/* public/ && cp -r admin/frontend/build/* public/admin/ && npm install
```

**Problema:** Comando muito longo e pode falhar em alguns casos.

---

## ✅ SOLUÇÃO IMEDIATA

### 1. Acesse as Configurações

1. **Dashboard Render:** https://dashboard.render.com
2. **Selecione:** altclinic
3. **Vá em:** Settings → Build & Deploy
4. **Encontre:** Build Command

---

### 2. Altere o Build Command

**CLIQUE EM "Edit"** ao lado de "Build Command"

**SUBSTITUA por este comando:**
```bash
npm run build:linux
```

**Ou se preferir o comando completo:**
```bash
cd frontend && npm install && npm run build && cd .. && cd admin/frontend && npm install && npm run build && cd ../.. && mkdir -p public && mkdir -p public/admin && cp -r frontend/build/* public/ && cp -r admin/frontend/build/* public/admin/ && npm install && npm rebuild
```

⚠️ **IMPORTANTE:** Adicione `npm rebuild` no final!

---

### 3. Verificar Start Command

**Start Command ATUAL:**
```bash
node src/app.js
```

✅ **Correto!** Não precisa alterar.

---

### 4. Habilitar Auto-Deploy

**Auto-Deploy ATUAL:**
```
Off
```

❌ **Desabilitado!** 

**AÇÃO:**
1. Clique em "Edit" ao lado de "Auto-Deploy"
2. Mude para: **On**
3. Confirme que Branch é: **main**

---

### 5. Salvar e Deploy

1. **Clique em "Save Changes"**
2. **Vá em:** Manual Deploy
3. **Clique em:** "Deploy latest commit"
4. **Aguarde:** 3-5 minutos

---

## 📋 CONFIGURAÇÕES CORRETAS

### ✅ Build Command (Opção Recomendada):
```bash
npm run build:linux
```

**Por que usar `npm run build:linux`?**
- ✅ Mais limpo e organizado
- ✅ Definido no package.json
- ✅ Inclui `npm rebuild` automaticamente
- ✅ Fácil de manter

---

### ✅ Build Command (Opção Alternativa):
```bash
cd frontend && npm install && npm run build && cd .. && cd admin/frontend && npm install && npm run build && cd ../.. && mkdir -p public && mkdir -p public/admin && cp -r frontend/build/* public/ && cp -r admin/frontend/build/* public/admin/ && npm install && npm rebuild
```

**Diferença:** Adicionado `npm rebuild` no final!

---

### ✅ Start Command:
```bash
node src/app.js
```

✅ **Já está correto!**

---

### ✅ Auto-Deploy:
```yaml
Auto-Deploy: On
Branch: main
```

⚠️ **PRECISA HABILITAR!**

---

## 🔍 VERIFICAÇÃO NO package.json

O script `build:linux` está definido assim:

```json
{
  "scripts": {
    "build:linux": "cd frontend && npm install && npm run build && cd .. && cd admin/frontend && npm install && npm run build && cd ../.. && mkdir -p public && mkdir -p public/admin && cp -r frontend/build/* public/ && cp -r admin/frontend/build/* public/admin/ && npm install && npm rebuild"
  }
}
```

✅ **Inclui `npm rebuild` para módulos nativos (better-sqlite3, sharp)**

---

## 🚀 PASSO A PASSO COMPLETO

### Passo 1: Editar Build Command

1. Settings → Build & Deploy
2. Build Command → **Edit**
3. **Cole:** `npm run build:linux`
4. **Clique:** Save

### Passo 2: Habilitar Auto-Deploy

1. Auto-Deploy → **Edit**
2. Mude para: **On**
3. Branch: **main**
4. **Clique:** Save

### Passo 3: Manual Deploy

1. Vá para: **Manual Deploy**
2. Clique: **Deploy latest commit**
3. Aguarde conclusão

### Passo 4: Verificar Logs

1. Vá para: **Logs**
2. Procure por:
   - ✅ `Running build command: npm run build:linux`
   - ✅ `> cd frontend && npm install && npm run build`
   - ✅ `> cd admin/frontend && npm install && npm run build`
   - ✅ `> mkdir -p public && mkdir -p public/admin`
   - ✅ `> cp -r frontend/build/* public/`
   - ✅ `> npm rebuild`
   - ✅ `Build completed successfully`
   - ✅ `Starting service with 'node src/app.js'`
   - ✅ `Your service is live`

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS

### ❌ ANTES (Errado/Incompleto):

```yaml
Build Command: [comando longo sem npm rebuild]
Start Command: node src/app.js ✅
Auto-Deploy: Off ❌
```

### ✅ DEPOIS (Correto):

```yaml
Build Command: npm run build:linux ✅
Start Command: node src/app.js ✅
Auto-Deploy: On ✅
```

---

## 🐛 PROBLEMAS QUE ISSO RESOLVE

### Problema 1: Módulos Nativos
❌ **Antes:** `better-sqlite3` não era recompilado  
✅ **Depois:** `npm rebuild` recompila automaticamente

### Problema 2: Deploy Manual
❌ **Antes:** Auto-Deploy desabilitado  
✅ **Depois:** Deploy automático no push

### Problema 3: Build Inconsistente
❌ **Antes:** Comando longo e propenso a erros  
✅ **Depois:** Script organizado no package.json

---

## ✅ CHECKLIST DE CORREÇÃO

- [ ] **Acessei Dashboard Render**
- [ ] **Selecionei serviço "altclinic"**
- [ ] **Fui em Settings → Build & Deploy**
- [ ] **Editei Build Command**
- [ ] **Colei:** `npm run build:linux`
- [ ] **Salvei alteração**
- [ ] **Habilitei Auto-Deploy**
- [ ] **Configurei Branch: main**
- [ ] **Salvei alteração**
- [ ] **Executei Manual Deploy**
- [ ] **Aguardei conclusão (3-5 min)**
- [ ] **Verifiquei Logs** → Sem erros
- [ ] **Testei:** https://altclinic.onrender.com/api/health
- [ ] **Testei:** https://altclinic.onrender.com/
- [ ] ✅ **FUNCIONOU!**

---

## 🎯 APÓS A CORREÇÃO

### 1. Testar Endpoints

```bash
# Health Check
curl https://altclinic.onrender.com/api/health

# Init Status
curl https://altclinic.onrender.com/api/auth/init-status

# Frontend
curl https://altclinic.onrender.com/
```

### 2. Testar Login

```
https://altclinic.onrender.com/diagnostic-login.html
```

### 3. Verificar Funcionalidades

- [ ] Login funciona
- [ ] AgendaLite carrega
- [ ] ModalListaEspera abre
- [ ] ConfiguracaoGrade funciona

---

## 📝 CONFIGURAÇÕES FINAIS COMPLETAS

```yaml
# BUILD & DEPLOY
Build Command: npm run build:linux
Start Command: node src/app.js
Auto-Deploy: On
Branch: main

# ENVIRONMENT (já configurado)
NODE_ENV: production
JWT_SECRET: [seu secret]
CORS_ORIGIN: https://altclinic.onrender.com
MASTER_DB_PATH: ./data/master.db

# DISK STORAGE (verificar se existe)
Name: altclinic-data
Mount: /opt/render/project/src/data
Size: 1 GB

# HEALTH CHECK (verificar se existe)
Path: /api/health
```

---

## 🆘 SE DER ERRO NO BUILD

### Erro: "npm ERR! missing script: build:linux"

**Solução:**
Use o comando completo:
```bash
cd frontend && npm install && npm run build && cd .. && cd admin/frontend && npm install && npm run build && cd ../.. && mkdir -p public && mkdir -p public/admin && cp -r frontend/build/* public/ && cp -r admin/frontend/build/* public/admin/ && npm install && npm rebuild
```

### Erro: "Error: Cannot find module 'better-sqlite3'"

**Solução:**
Verifique se `npm rebuild` está no final do Build Command.

### Erro: "ENOENT: no such file or directory"

**Solução:**
1. Vá em **Disks**
2. Adicione disco em `/opt/render/project/src/data`
3. Size: 1 GB

---

## 🎉 RESUMO

**3 Mudanças Necessárias:**

1. ✅ **Build Command:** `npm run build:linux`
2. ✅ **Auto-Deploy:** Habilitar (On)
3. ✅ **Verificar:** npm rebuild está incluído

**Tempo estimado:** 5 minutos  
**Impacto:** 🔴 CRÍTICO (resolve problemas de módulos nativos)

---

**AÇÃO IMEDIATA:**
1. Acesse agora: https://dashboard.render.com
2. Altere o Build Command
3. Habilite Auto-Deploy
4. Execute Manual Deploy
5. Aguarde e teste!

---

**Me avise quando concluir!** 🚀
