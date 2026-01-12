# 🚀 Deploy AltClinic no Railway

**Repositório:** https://github.com/thiagoborgh/AltClinic ✅

---

## 🎯 PASSO 1: Deploy do Backend

1. **Acesse:** https://railway.app/new
2. **Clique:** "Deploy from GitHub repo"
3. **Selecione:** `thiagoborgh/AltClinic`
4. Railway cria o projeto automaticamente

### Configurar Backend (Service 1)

**1.1 Variáveis de Ambiente**
- Clique no service → **Variables** → **+ New Variable**
- Adicione cada uma:

```
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
NODE_ENV=production
PORT=3000
DATABASE_PATH=./clinica-saas.db
```

**1.2 Configurações de Build**
- Clique em **Settings**
- **Root Directory:** `Backend`
- **Start Command:** `node server-saas.js`
- Salve

**1.3 Deploy**
- Clique em **Deploy** (ou aguarde deploy automático)
- Aguarde 1-2 minutos
- Copie a URL gerada: `https://altclinic-backend.up.railway.app`

✅ **Teste:** Acesse `https://altclinic-backend.up.railway.app/health` (deve retornar `{"status":"ok"}`)

---

## 🎯 PASSO 2: Deploy do Frontend

**2.1 Adicionar Novo Service**
- No mesmo projeto Railway
- Clique **+ New** → **GitHub Repo**
- Selecione `thiagoborgh/AltClinic` novamente
- Railway cria segundo service

**2.2 Variáveis de Ambiente**
- Clique no novo service → **Variables**
- Adicione:

```
VITE_API_URL=https://altclinic-backend.up.railway.app
```

⚠️ **IMPORTANTE:** Use a URL EXATA do backend (do passo 1.3)

**2.3 Configurações de Build**
- Clique em **Settings**
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run preview -- --host 0.0.0.0 --port $PORT`
- Salve

**2.4 Deploy**
- Clique em **Deploy**
- Aguarde 2-3 minutos
- Copie a URL: `https://altclinic.up.railway.app`

✅ **Teste:** Abra no navegador - deve aparecer tela de login!

---

## 🧪 PASSO 3: Testar Sistema

### 3.1 Criar Conta
1. Acesse sua URL do frontend
2. Clique em **"Criar Nova Conta"**
3. Preencha:
   - Nome Clínica: **AltClinic Teste**
   - Email: **admin@altclinic.com**
   - Senha: **admin123**
4. **Criar Conta**

### 3.2 Login
- Use email/senha cadastrados
- Deve redirecionar para `/configuracoes`

### 3.3 Configurar WhatsApp
1. Vá em **Configurações** → aba **WhatsApp**
2. Configure:
   - Telefone: **5511999999999**
   - Integração: **Manual (wa.me)**
3. Salve

### 3.4 Criar Agendamento
1. Vá em **Agenda** → **Novo Agendamento**
2. Preencha dados de teste
3. Confirme
4. Teste link do WhatsApp

---

## ✅ Sistema no Ar!

**URLs Finais:**
- 🔧 Backend: `https://altclinic-backend.up.railway.app`
- 🌐 Frontend: `https://altclinic.up.railway.app`
- 📦 GitHub: https://github.com/thiagoborgh/AltClinic

---

## 💰 Custos Railway

- **Grátis:** 500 horas/mês (suficiente para testes)
- **Pago:** ~$5-10/mês (~R$25-50) quando ultrapassar

---

## 🔄 Próximas Atualizações

Quando fizer mudanças:

```powershell
git add .
git commit -m "descrição"
git push
```

Railway faz deploy automático! 🚀

---

## 🆘 Problemas?

**Backend não conecta:**
- Verifique variáveis (JWT_SECRET, PORT)
- Logs: Railway → Backend Service → Logs

**Frontend erro na API:**
- Confirme VITE_API_URL correto
- Teste `/health` do backend manualmente

**CORS:**
- Já configurado no server-saas.js ✅
