# 🆓 Deploy GRATUITO - Vercel + Render

**Repositório:** https://github.com/thiagoborgh/AltClinic ✅

**Stack:**

- 🔧 **Backend:** Render (grátis, dorme após 15min inativo)
- 🌐 **Frontend:** Vercel (grátis, sempre ativo)

---

## 🎯 PARTE 1: Deploy do Backend no Render

### 1.1 Criar Conta no Render

1. Acesse: https://render.com
2. Clique em **"Get Started"**
3. Faça login com **GitHub**
4. Autorize o Render a acessar seus repositórios

### 1.2 Criar Web Service

1. No dashboard, clique em **"New +"**
2. Selecione **"Web Service"**
3. Conecte o repositório: **thiagoborgh/AltClinic**
4. Clique em **"Connect"**

### 1.3 Configurar o Service

**Configurações Básicas:**

- **Name:** `altclinic-backend`
- **Region:** `Oregon (US West)` ou mais próximo
- **Branch:** `main`
- **Root Directory:** `Backend`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `node server-saas.js`

**Plan:**

- Selecione: **Free** (0$/mês) ✅

### 1.4 Variáveis de Ambiente

Role até **"Environment Variables"** e clique **"Add Environment Variable"**

Adicione TODAS estas variáveis:

```
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
NODE_ENV=production
PORT=10000
DATABASE_PATH=./clinica-saas.db
```

⚠️ **IMPORTANTE:** No Render, use `PORT=10000` (porta padrão do Render)

### 1.5 Deploy

1. Role até o final e clique **"Create Web Service"**
2. Aguarde o build (2-5 minutos)
3. Quando aparecer **"Live"** em verde, está pronto!
4. Copie a URL: `https://altclinic-backend.onrender.com`

### ✅ Testar Backend

Abra no navegador:

```
https://altclinic-backend.onrender.com/health
```

Deve retornar: `{"status":"ok"}`

⚠️ **Primeira vez pode demorar ~30s** (serviço estava dormindo)

---

## 🎯 PARTE 2: Deploy do Frontend na Vercel

### 2.1 Criar Conta na Vercel

1. Acesse: https://vercel.com
2. Clique em **"Sign Up"**
3. Faça login com **GitHub**
4. Autorize a Vercel

### 2.2 Importar Projeto

1. No dashboard, clique em **"Add New..."** → **"Project"**
2. Selecione o repositório: **thiagoborgh/AltClinic**
3. Clique em **"Import"**

### 2.3 Configurar o Projeto

**Framework Preset:** `Vite`

**Build and Output Settings:**

- **Root Directory:** `frontend` ← **CLIQUE EM EDIT**
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 2.4 Variáveis de Ambiente

Clique em **"Environment Variables"**

Adicione:

**Key:** `VITE_API_URL`  
**Value:** `https://altclinic-backend.onrender.com`

⚠️ **IMPORTANTE:** Use a URL EXATA do Render (sem / no final)

### 2.5 Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (1-2 minutos)
3. Quando aparecer **"Congratulations!"**, está pronto!
4. Copie a URL: `https://altclinic-xxx.vercel.app`

### ✅ Testar Frontend

Abra a URL no navegador - deve aparecer tela de login!

---

## 🧪 PARTE 3: Testar Sistema Completo

### 3.1 Primeiro Acesso

⏳ **AGUARDE 30-60 SEGUNDOS** - Backend no Render está "acordando"

### 3.2 Criar Primeira Conta

1. Clique em **"Criar Nova Conta"**
2. Preencha:
   - Nome Clínica: **AltClinic MVP**
   - Email: **admin@altclinic.com.br**
   - Senha: **admin123**
3. Clique em **"Criar Conta"**

⚠️ Se der erro timeout, **aguarde mais 20s e tente novamente** (backend acordando)

### 3.3 Fazer Login

- Use email/senha cadastrados
- Deve redirecionar para `/configuracoes`

### 3.4 Configurar WhatsApp

1. Vá em **Configurações** → aba **WhatsApp**
2. Configure:
   - Telefone: **5511987654321** (seu número)
   - Integração: **Manual (wa.me)**
3. Salve

### 3.5 Criar Agendamento Teste

1. Navegue pela aplicação
2. Crie um agendamento
3. Teste funcionalidades

---

## ✅ Sistema no Ar - 100% GRATUITO!

**URLs Finais:**

- 🔧 **Backend:** https://altclinic-backend.onrender.com
- 🌐 **Frontend:** https://altclinic-xxx.vercel.app
- 📦 **GitHub:** https://github.com/thiagoborgh/AltClinic

---

## ⚠️ Limitações do Plano Gratuito

### Render (Backend)

- ✅ **Gratuito para sempre**
- ⏸️ **Dorme após 15 minutos** sem uso
- ⏳ **Acorda em ~30s** no primeiro acesso
- 💾 **750h/mês** de uso (suficiente para MVP)
- 📊 **Banco SQLite persiste** entre sleeps

**Impacto:** Primeira requisição após inatividade é lenta (~30s)

### Vercel (Frontend)

- ✅ **Gratuito para sempre**
- ✅ **Sempre ativo** (sem sleep)
- ✅ **CDN global** (rápido em todo mundo)
- 📦 **100GB bandwidth/mês**

---

## 💡 Dicas para Melhorar Performance

### 1. Manter Backend Acordado (Opcional)

Use serviço gratuito para "pingar" o backend a cada 10min:

**Opção A - Cron-job.org:**

1. Acesse: https://cron-job.org
2. Crie tarefa: GET `https://altclinic-backend.onrender.com/health`
3. Intervalo: A cada 10 minutos

**Opção B - UptimeRobot:**

1. Acesse: https://uptimerobot.com
2. Monitor HTTP: `https://altclinic-backend.onrender.com/health`
3. Intervalo: 5 minutos

⚠️ **Atenção:** Isso consome suas 750h/mês do Render mais rápido

### 2. Avisar Usuários

Adicione mensagem no frontend:

> "⏳ Primeira conexão pode demorar ~30s (servidor acordando)"

---

## 🔄 Atualizações Futuras

Quando fizer mudanças no código:

```powershell
git add .
git commit -m "descrição da mudança"
git push
```

**Vercel e Render fazem deploy automático!** 🚀

---

## 🆘 Problemas Comuns

### Backend não conecta

- ✅ Aguarde 30-60s (está acordando)
- ✅ Teste `/health` diretamente
- ✅ Verifique variáveis de ambiente (JWT_SECRET, PORT=10000)
- ✅ Veja logs: Render → seu service → Logs

### Frontend erro na API

- ✅ Confirme VITE_API_URL sem `/` no final
- ✅ Teste URL do backend manualmente
- ✅ Verifique CORS (já configurado em server-saas.js)

### Timeout na primeira requisição

- ⏳ Normal! Backend estava dormindo
- ✅ Aguarde e tente novamente

### Banco de dados sumiu

- ✅ SQLite persiste entre sleeps no Render
- ⚠️ Se excluir o service, banco é perdido
- 💡 Faça backup manual periodicamente

---

## 💰 Quando Migrar para Pago?

**Considere plano pago quando:**

- ❌ Sleep de 15min incomoda usuários
- ❌ 750h/mês não é suficiente
- ❌ Precisa de mais performance

**Opções de Upgrade:**

- **Render:** $7/mês (sempre ativo, 100h grátis)
- **Railway:** $5/mês (melhor custo-benefício)
- **VPS próprio:** R$20-30/mês (controle total)

---

## 🎉 Pronto! Sistema no Ar e 100% Gratuito!

**Custos Atuais:**

- Render: **R$ 0,00/mês** ✅
- Vercel: **R$ 0,00/mês** ✅
- GitHub: **R$ 0,00/mês** ✅
- **TOTAL: R$ 0,00/mês** 🎉

**Perfeito para:**

- ✅ Validar MVP
- ✅ Testar com primeiros clientes
- ✅ Desenvolvimento
- ✅ Demonstrações

Quando tiver receita, migra para plano pago! 💰
