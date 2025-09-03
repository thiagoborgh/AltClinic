# 🚂 Deploy no Railway - GRATUITO e SIMPLES!

## 🎯 **Railway é a opção MAIS FÁCIL para teste gratuito!**

### Por que Railway?

- ✅ **$5 GRÁTIS por mês** (suficiente para testes)
- ✅ **Sem cartão de crédito**
- ✅ Deploy automático com GitHub
- ✅ **Banco de dados incluído**
- ✅ HTTPS automático
- ✅ **Logs em tempo real**

---

## 🚀 **Como fazer o deploy (5 minutos):**

### 1️⃣ **Criar conta gratuita:**

1. Acesse: **https://railway.app**
2. Clique em **"Start a New Project"**
3. **Login com GitHub** (vai conectar automaticamente)

### 2️⃣ **Deploy do repositório:**

1. Clique em **"Deploy from GitHub repo"**
2. Selecione **"AltClinic"** (seu repositório)
3. Clique em **"Deploy Now"**

### 3️⃣ **Configurar variáveis de ambiente:**

1. No dashboard do projeto, clique em **"Variables"**
2. Adicione estas variáveis:
   ```
   NODE_ENV=production
   JWT_SECRET=AltClinic2024SuperSeguro!
   SESSION_SECRET=AltClinicSession2024!
   PORT=3000
   ```

### 4️⃣ **Adicionar domínio público:**

1. Clique em **"Settings"**
2. Clique em **"Generate Domain"**
3. **PRONTO!** Seu link público estará disponível! 🎉

---

## 🌐 **Alternativa: Render (Também gratuito)**

Se preferir o **Render**:

### 🚀 **Passos rápidos:**

1. **Acesse:** https://render.com
2. **Criar conta gratuita**
3. **New → Web Service**
4. **Conectar GitHub → AltClinic**
5. **Configurar:**
   - **Build Command:** `cd frontend && npm install && npm run build && cd .. && npm install`
   - **Start Command:** `node app.js`
6. **Environment Variables:**
   ```
   NODE_ENV=production
   JWT_SECRET=AltClinic2024SuperSeguro!
   SESSION_SECRET=AltClinicSession2024!
   ```
7. **Create Web Service**

---

## 📧 **Configuração de Email (Opcional mas recomendado):**

Para receber emails de trial, adicione também:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seuemail@gmail.com
SMTP_PASS=SuaSenhaDeApp
```

**Como obter senha de app do Gmail:**

1. Gmail → Configurações → Verificação em 2 etapas
2. https://myaccount.google.com/apppasswords
3. Criar senha para "Alt Clinic"
4. Usar a senha de 16 caracteres

---

## ✅ **Depois do deploy você terá:**

- 🌐 **URL pública do seu Alt Clinic**
- 📱 **Landing page funcionando**
- 🆓 **Sistema de trials automático**
- 📊 **Dashboard completo**
- 🔒 **HTTPS automático**
- 📧 **Emails funcionando** (se configurou)

---

## 🎯 **Teste completo funcionando em 5 minutos!**

**Recomendo começar com Railway** - é o mais simples e confiável para testes.

Quer que eu te guie passo a passo? 🚀
