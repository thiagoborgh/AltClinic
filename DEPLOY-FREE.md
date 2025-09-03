# 🆓 Alt Clinic - Deploy GRATUITO para Testes

## 🎯 **Objetivo: Colocar o Alt Clinic no ar GRATUITAMENTE!**

Você tem **3 opções 100% GRATUITAS** para testar seu sistema:

---

## 1️⃣ **Railway (MAIS RECOMENDADO) 🚂**

**Por que Railway?**
- ✅ **$5 GRÁTIS por mês** (suficiente para testes)
- ✅ Deploy automático com GitHub
- ✅ Banco de dados incluído
- ✅ HTTPS automático
- ✅ Sem cartão de crédito necessário

### 🚀 **Como fazer (5 minutos):**

1. **Acesse:** https://railway.app
2. **Login com GitHub**
3. **Criar novo projeto:**
   - "Deploy from GitHub repo"
   - Conectar seu repositório Alt Clinic
4. **Adicionar variáveis:**
   ```
   NODE_ENV=production
   JWT_SECRET=AltClinic2024SuperSeguro!
   SESSION_SECRET=AltClinicSession2024!
   ```
5. **Deploy automático!** 🎉

**💰 Custo:** GRATUITO ($5/mês de crédito)

---

## 2️⃣ **Render (ALTERNATIVA SÓLIDA) 🔄**

**Por que Render?**
- ✅ **750 horas GRÁTIS por mês**
- ✅ SSL automático
- ✅ Deploy contínuo
- ✅ Sem cartão necessário

### 🚀 **Como fazer (3 minutos):**

1. **Acesse:** https://render.com
2. **Criar conta gratuita**
3. **New > Web Service**
4. **Conectar GitHub repository**
5. **Configurar:**
   ```
   Build Command: cd frontend && npm install && npm run build && cd .. && npm install
   Start Command: node app.js
   ```
6. **Adicionar Environment Variables:**
   ```
   NODE_ENV=production
   JWT_SECRET=AltClinic2024SuperSeguro!
   SESSION_SECRET=AltClinicSession2024!
   ```

**💰 Custo:** GRATUITO (750h/mês)

---

## 3️⃣ **Vercel (SUPER RÁPIDO) ⚡**

**Por que Vercel?**
- ✅ **Deploy em 30 segundos**
- ✅ CDN global GRATUITO
- ✅ Bandwidth ilimitado
- ✅ Perfeito para frontends

### 🚀 **Como fazer (2 minutos):**

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod
```

**💰 Custo:** GRATUITO (bandwidth ilimitado)

---

## 4️⃣ **Cyclic (SIMPLES) 🔄**

**Por que Cyclic?**
- ✅ **100% GRATUITO para sempre**
- ✅ Deploy com 1 clique
- ✅ Sem limites de tempo

### 🚀 **Como fazer:**

1. **Acesse:** https://cyclic.sh
2. **Login com GitHub**
3. **Deploy Repository**
4. **Pronto!**

---

## 🎯 **RECOMENDAÇÃO: Use Railway!**

**Por que Railway é o melhor para teste:**
1. ✅ Mais fácil de configurar
2. ✅ Funciona perfeitamente com Node.js
3. ✅ $5 gratuitos são suficientes para 1 mês de testes
4. ✅ Upgrade fácil quando quiser

---

## ⚡ **Opção SUPER RÁPIDA (Agora mesmo!):**

Se você quer testar **AGORA**, vou te mostrar como usar **Vercel**:

### 🚀 **Deploy em 60 segundos:**

1. **Execute estes comandos:**
   ```bash
   npm i -g vercel
   vercel login
   vercel --prod
   ```

2. **Responda as perguntas:**
   - Set up and deploy? **Y**
   - Which scope? **Sua conta**
   - Link to existing project? **N**
   - Project name? **alt-clinic**
   - Directory? **./ (Enter)**
   - Override settings? **Y**
   - Build Command? **cd frontend && npm run build**
   - Output Directory? **frontend/build**
   - Development Command? **npm start**

3. **PRONTO!** Seu link estará no terminal! 🎉

---

## 📧 **Configuração de Email GRATUITA (Gmail):**

Para o sistema funcionar 100%, configure email:

### 🔧 **Passos:**

1. **Gmail > Configurações > Verificação em 2 etapas**
2. **Gerar senha de app:**
   - https://myaccount.google.com/apppasswords
   - Nome: "Alt Clinic"
   - Copiar a senha (16 caracteres)

3. **Adicionar variáveis na plataforma:**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=seuemail@gmail.com
   SMTP_PASS=SuaSenhaDeApp16Chars
   ```

---

## 🧪 **Teste Completo Gratuito:**

Com qualquer plataforma, você terá:

- ✅ **Landing page funcionando**
- ✅ **Sistema de trials automático**
- ✅ **Dashboard completo**
- ✅ **Email de boas-vindas**
- ✅ **Sistema de upgrade**
- ✅ **HTTPS automático**

---

## 💡 **Qual escolher?**

**Para teste rápido agora:** Vercel (2 min)
**Para teste completo:** Railway (5 min)
**Para alternativa:** Render (3 min)

---

**Quer que eu ajude você a fazer o deploy agora mesmo?** 🚀

Qual plataforma você prefere: **Railway**, **Vercel** ou **Render**?
