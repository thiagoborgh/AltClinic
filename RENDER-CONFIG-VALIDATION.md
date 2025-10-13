# ⚙️ Validação de Configurações - Render (Build & Deploy)

**Data:** 13 de Outubro de 2025  
**Serviço:** AltClinic no Render  
**Status:** 🔄 Validação Necessária

---

## 📋 CHECKLIST DE CONFIGURAÇÕES

### ✅ 1. Build Settings

**Acesse:** Dashboard → altclinic → Settings → Build & Deploy

#### **Build Command**
```bash
npm install && npm run build
```

**O que faz:**
- ✅ Instala dependências do backend
- ✅ Instala dependências do frontend
- ✅ Instala dependências do admin
- ✅ Compila frontend (React)
- ✅ Compila admin frontend (React)
- ✅ Copia arquivos para `public/`
- ✅ Rebuild de módulos nativos (better-sqlite3, sharp)

#### **Verificar no package.json:**
```json
{
  "scripts": {
    "build": "cd frontend && npm install && npm run build && cd .. && cd admin/frontend && npm install && npm run build && cd ../.. && powershell -ExecutionPolicy Bypass -File copy-build.ps1 && npm install",
    "build:linux": "cd frontend && npm install && npm run build && cd .. && cd admin/frontend && npm install && npm run build && cd ../.. && mkdir -p public && mkdir -p public/admin && cp -r frontend/build/* public/ && cp -r admin/frontend/build/* public/admin/ && npm install && npm rebuild"
  }
}
```

⚠️ **IMPORTANTE:** Render usa Linux, então use `build:linux`!

**Comando correto para Render:**
```bash
npm run build:linux
```

---

### ✅ 2. Start Command

**Comando correto:**
```bash
node src/app.js
```

**O que faz:**
- ✅ Inicia o servidor Express
- ✅ Serve arquivos estáticos do `public/`
- ✅ Inicializa banco de dados SQLite
- ✅ Executa migrations automáticas
- ✅ Verifica e cria primeiro acesso se necessário

---

### ✅ 3. Environment Variables

**Variáveis OBRIGATÓRIAS:**

```bash
# Ambiente
NODE_ENV=production

# Porta (Render define automaticamente)
PORT=10000

# Segurança
JWT_SECRET=seu_jwt_secret_super_seguro_mude_isso

# CORS (URL do frontend)
CORS_ORIGIN=https://altclinic.onrender.com

# Banco de Dados
MASTER_DB_PATH=./data/master.db

# Admin
ADMIN_PORT=3002
```

**Variáveis OPCIONAIS (WhatsApp):**

```bash
# Evolution API
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua_chave_api

# Z-API
ZAPI_URL=https://api.z-api.io
ZAPI_INSTANCE=sua_instancia
ZAPI_TOKEN=seu_token

# Meta (WhatsApp Business)
META_PHONE_NUMBER_ID=seu_id
META_ACCESS_TOKEN=seu_token
META_VERIFY_TOKEN=seu_verify_token
META_WEBHOOK_SECRET=seu_webhook_secret
```

---

### ✅ 4. Root Directory

**Configuração:**
```
Root Directory: (deixe vazio ou ".")
```

**Estrutura esperada:**
```
/opt/render/project/src/
├── src/
│   ├── app.js
│   ├── routes/
│   ├── models/
│   └── utils/
├── frontend/
│   └── build/ (após npm run build)
├── admin/
│   └── frontend/build/ (após npm run build)
├── public/ (criado durante build)
├── data/ (criado em runtime)
├── package.json
└── node_modules/
```

---

### ✅ 5. Auto-Deploy

**Configuração recomendada:**

- ✅ **Auto-Deploy:** Habilitado
- ✅ **Branch:** main
- ✅ **Build Command:** `npm run build:linux`
- ✅ **Start Command:** `node src/app.js`

**Quando habilitar:**
- ✅ Após validar configurações
- ✅ Quando tiver testes funcionando
- ✅ Para deploys automáticos no push

---

### ✅ 6. Health Check Path

**Configure:**
```
Health Check Path: /api/health
```

**Verificar se existe no código:**
```javascript
// Em src/app.js
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});
```

---

### ✅ 7. Disk Storage

**Necessário para SQLite:**

- ✅ **Disk Path:** `/opt/render/project/src/data`
- ✅ **Disk Size:** 1 GB (mínimo)
- ✅ **Mount Path:** `/opt/render/project/src/data`

⚠️ **CRÍTICO:** Sem disk storage, o banco SQLite será perdido a cada deploy!

---

## 🔧 CONFIGURAÇÃO PASSO A PASSO

### Passo 1: Acesse as Configurações

1. Acesse: https://dashboard.render.com
2. Selecione o serviço: **altclinic**
3. Clique em: **Settings** (menu lateral)

---

### Passo 2: Build & Deploy

**Seção: Build Command**
```bash
npm run build:linux
```

**Seção: Start Command**
```bash
node src/app.js
```

**Seção: Auto-Deploy**
- ✅ Habilitar
- ✅ Branch: main

---

### Passo 3: Environment

Clique em **Environment** → **Add Environment Variable**

**Adicione uma por vez:**

1. `NODE_ENV` = `production`
2. `JWT_SECRET` = `[gere um secret seguro]`
3. `CORS_ORIGIN` = `https://altclinic.onrender.com`
4. `MASTER_DB_PATH` = `./data/master.db`

**Para gerar JWT_SECRET seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### Passo 4: Disk Storage

1. Clique em **Disks** (menu lateral)
2. Clique em **Add Disk**
3. Configure:
   - **Name:** altclinic-data
   - **Mount Path:** `/opt/render/project/src/data`
   - **Size:** 1 GB

---

### Passo 5: Salvar e Deploy

1. Clique em **Save Changes**
2. Aguarde o serviço reiniciar
3. Monitore os logs: **Logs** (menu lateral)

---

## 🔍 VALIDAÇÃO PÓS-DEPLOY

### 1. Verificar Build

**Nos logs, procure por:**
```
✅ Installing dependencies...
✅ Running build command...
✅ Build completed successfully
✅ Frontend build: success
✅ Admin build: success
✅ Files copied to public/
```

### 2. Verificar Start

**Nos logs, procure por:**
```
✅ Server running on port 10000
✅ Database initialized
✅ Migrations executed
✅ Health check: OK
```

### 3. Testar Endpoints

```bash
# Health check
curl https://altclinic.onrender.com/api/health

# Init status
curl https://altclinic.onrender.com/api/auth/init-status

# Frontend
curl https://altclinic.onrender.com/
```

---

## 🐛 PROBLEMAS COMUNS

### ❌ Build Failed

**Erro:** `npm ERR! missing script: build`

**Solução:**
```bash
# Use o comando correto
npm run build:linux
```

---

### ❌ Module not found: better-sqlite3

**Solução:**
```json
// package.json
{
  "scripts": {
    "postinstall": "npm rebuild better-sqlite3 sharp"
  }
}
```

---

### ❌ Port already in use

**Solução:**
Render define PORT automaticamente. Use:
```javascript
const PORT = process.env.PORT || 3000;
```

---

### ❌ Database locked

**Solução:**
- ✅ Adicione Disk Storage
- ✅ Verifique MASTER_DB_PATH
- ✅ Use WAL mode no SQLite

---

### ❌ CORS Error

**Solução:**
```bash
# Environment variable
CORS_ORIGIN=https://altclinic.onrender.com
```

```javascript
// src/app.js
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
```

---

## 📊 CONFIGURAÇÃO IDEAL

### Para Produção:

```yaml
Service Type: Web Service
Environment: Node
Region: Oregon (US West)

Build Command: npm run build:linux
Start Command: node src/app.js

Auto-Deploy: Yes
Branch: main

Environment Variables:
  NODE_ENV: production
  JWT_SECRET: [64 chars random]
  CORS_ORIGIN: https://altclinic.onrender.com
  MASTER_DB_PATH: ./data/master.db

Disk Storage:
  Name: altclinic-data
  Path: /opt/render/project/src/data
  Size: 1 GB

Health Check: /api/health
```

---

## 🎯 PRÓXIMOS PASSOS

Após configurar:

1. ✅ **Manual Deploy**
   - Settings → Manual Deploy → Deploy latest commit

2. ✅ **Monitorar Logs**
   - Logs → Ver logs em tempo real

3. ✅ **Testar Health Check**
   ```bash
   curl https://altclinic.onrender.com/api/health
   ```

4. ✅ **Inicializar Sistema**
   - Acesse: https://altclinic.onrender.com/diagnostic-login.html
   - Ou execute no Shell: `node quick-init-production.js`

5. ✅ **Testar Login**
   - https://altclinic.onrender.com/login

---

## 📝 CHECKLIST FINAL

- [ ] Build Command: `npm run build:linux`
- [ ] Start Command: `node src/app.js`
- [ ] NODE_ENV: `production`
- [ ] JWT_SECRET: configurado
- [ ] CORS_ORIGIN: configurado
- [ ] Disk Storage: adicionado (1 GB)
- [ ] Health Check: `/api/health`
- [ ] Auto-Deploy: habilitado
- [ ] Deploy manual: executado
- [ ] Logs: sem erros
- [ ] Health endpoint: respondendo
- [ ] Frontend: carregando
- [ ] Login: testado

---

## 🆘 SUPORTE

### Logs com Erro?

**Comando útil no Shell:**
```bash
# Ver estrutura de diretórios
ls -la

# Ver package.json
cat package.json

# Ver variáveis de ambiente
env | grep -E "(NODE_ENV|PORT|JWT)"

# Testar build local
npm run build:linux

# Testar start local
node src/app.js
```

### Ainda com problemas?

1. **Screenshots dos logs**
2. **Configurações atuais**
3. **Mensagens de erro específicas**

---

**Autor:** GitHub Copilot  
**Última atualização:** 13/10/2025  
**Commit:** 909bf36
