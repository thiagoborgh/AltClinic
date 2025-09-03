# ✅ CONFIGURAÇÃO NO RENDER - Próximos Passos

## 🎯 **Você criou a conta! Agora vamos configurar o deploy:**

---

## 📋 **PASSO A PASSO DETALHADO:**

### **1. Conectar seu repositório GitHub:**
- No dashboard do Render, clique em **"New +"**
- Selecione **"Web Service"**
- Clique em **"Connect a repository"**
- **Autorize o Render** a acessar seu GitHub
- Procure e selecione **"AltClinic"**

---

### **2. Configurações do Serviço:**

**Preencha exatamente assim:**

```
🏷️ Name: alt-clinic
🌿 Branch: main
🖥️ Runtime: Node
📁 Root Directory: (deixar vazio)
```

**Build Command (copie exato):**
```
cd frontend && npm install && npm run build && cd .. && npm install
```

**Start Command (copie exato):**
```
node app.js
```

---

### **3. Plano (IMPORTANTE!):**
- Selecione **"Free"** (não o Starter)
- ✅ **0 USD/month**

---

### **4. Environment Variables (ESSENCIAL!):**

Clique em **"Advanced"** e adicione estas variáveis:

```
NODE_ENV=production
JWT_SECRET=AltClinic2024SuperSeguro!
SESSION_SECRET=AltClinicSession2024!
```

**Como adicionar cada variável:**
1. Name: `NODE_ENV` | Value: `production`
2. Name: `JWT_SECRET` | Value: `AltClinic2024SuperSeguro!`
3. Name: `SESSION_SECRET` | Value: `AltClinicSession2024!`

---

### **5. Deploy:**
- Clique **"Create Web Service"**
- ⏳ **Aguarde 5-10 minutos** (primeira vez demora mais)
- 👀 **Acompanhe os logs** na tela

---

## 📊 **O que você verá durante o deploy:**

```
==> Building...
==> Installing dependencies...
==> Building frontend...
==> Starting server...
==> Deploy successful! 🎉
```

---

## 🌐 **Após o deploy:**

1. **URL estará disponível** no topo da página
2. **Teste a landing page**
3. **Verifique se carrega corretamente**

---

## 📧 **OPCIONAL - Configurar Email:**

Para emails de trial funcionarem, adicione mais variáveis:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seuemail@gmail.com
SMTP_PASS=SuaSenhaDeApp
```

**Como obter senha Gmail:**
1. Gmail → Configurações → Verificação em 2 etapas
2. https://myaccount.google.com/apppasswords
3. Criar senha para "Alt Clinic"
4. Usar a senha de 16 caracteres

---

## 🆘 **Se der algum erro:**

### **Erro de build:**
- Verifique se Build Command está correto
- Logs vão mostrar onde parou

### **Erro de start:**
- Verifique se Start Command é `node app.js`
- Verifique se NODE_ENV=production

### **Página não carrega:**
- Aguarde mais alguns minutos
- Verifique logs para erros

---

## 🎯 **Checklist final:**

- ✅ Repositório conectado
- ✅ Build Command: `cd frontend && npm install && npm run build && cd .. && npm install`
- ✅ Start Command: `node app.js`
- ✅ Environment Variables adicionadas
- ✅ Plano FREE selecionado
- ✅ Deploy iniciado

---

**🚀 Em qual etapa você está agora?**

**Me diga se:**
1. Já conectou o repositório?
2. Já preencheu as configurações?
3. Já adicionou as variáveis de ambiente?
4. O deploy já está rodando?

**Vou te ajudar com qualquer dúvida!** 💪
