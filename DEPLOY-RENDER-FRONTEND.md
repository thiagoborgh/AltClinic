# 🚀 Deploy Frontend no Render

**Repositório:** https://github.com/thiagoborgh/AltClinic

---

## 📝 Criar Web Service para Frontend

### 1. Acesse o Dashboard

- https://dashboard.render.com
- Clique em **"New +"** → **"Web Service"**

### 2. Conectar Repositório

- Selecione: **thiagoborgh/AltClinic**
- Clique em **"Connect"**

### 3. Configurações Básicas

**Name:** `altclinic-frontend`

**Region:** `Oregon (US West)` (mesmo do backend)

**Branch:** `main`

**Root Directory:** `frontend`

**Runtime:** `Node`

### 4. Build & Start Commands

**Build Command:**

```bash
npm install && npm run build
```

**Start Command:**

```bash
npm run preview -- --host 0.0.0.0 --port $PORT
```

### 5. Variáveis de Ambiente

Clique em **"Add Environment Variable"**:

**Key:** `VITE_API_URL`  
**Value:** `https://altclinic-1.onrender.com`

### 6. Plano

Selecione: **Free** (0$/mês)

### 7. Deploy

Clique em **"Create Web Service"**

Aguarde **2-3 minutos** para o build terminar

---

## ✅ URLs Finais

- **Backend:** https://altclinic-1.onrender.com
- **Frontend:** https://altclinic-frontend.onrender.com

---

## 🧪 Testar

1. Acesse o frontend: `https://altclinic-frontend.onrender.com`
2. Clique em **"Criar Nova Conta"**
3. Use conta ADMIN:
   ```
   Email: admin@altclinic.com.br
   Senha: Admin@2026
   Nome: AltClinic Master
   ```

---

## ⚠️ Limitações (Plano Free)

- Backend dorme após **15 minutos** inativo
- Frontend dorme após **15 minutos** inativo
- Primeira requisição demora **~30s** para acordar
- **750 horas/mês** de uso total

---

## 💡 Dica

Para manter serviços acordados, use **UptimeRobot** (gratuito):

- Ping a cada 5 minutos em `/health`
- Evita sleep durante horário comercial
