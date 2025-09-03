# 🏥 Alt Clinic - Sistema de Agendamento Automatizado

![Alt Clinic](https://img.shields.io/badge/Status-Ready%20for%20Deploy-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🚀 **Deploy GRATUITO em 5 minutos!**

### ⚡ **Opção 1: Railway (Recomendado)**

1. Acesse: https://railway.app
2. Login com GitHub
3. Deploy from GitHub repo → AltClinic
4. Adicionar variáveis: `NODE_ENV=production`
5. **PRONTO!** 🎉

### ⚡ **Opção 2: Render**

1. Acesse: https://render.com
2. New → Web Service → GitHub → AltClinic
3. Build: `cd frontend && npm run build && cd .. && npm install`
4. Start: `node app.js`
5. **ONLINE!** 🌐

---

## 🌟 **Funcionalidades**

### 📋 **Landing Page Completa**

- ✅ Apresentação profissional
- ✅ Planos e preços
- ✅ Sistema de trials gratuitos
- ✅ FAQ e testemunhais

### 🆓 **Sistema de Trial**

- ✅ 30 dias gratuitos automáticos
- ✅ Email de boas-vindas
- ✅ Dashboard com contador

### 💰 **Sistema de Upgrade**

- ✅ Desconto de 30% (primeiros 30 dias)
- ✅ Interface de pagamento
- ✅ Notificações automáticas

### 🤖 **IA Integrada**

- ✅ Google Gemini AI
- ✅ Respostas automáticas
- ✅ Análise inteligente

### 📱 **Multi-Canal**

- ✅ WhatsApp Web
- ✅ Telegram
- ✅ SMS (Twilio)
- ✅ Email automático

### 📊 **Dashboard Completo**

- ✅ Agendamentos
- ✅ Pacientes
- ✅ Financeiro
- ✅ Relatórios
- ✅ Analytics

---

## ⚙️ **Configuração Mínima**

### 🔑 **Variáveis Essenciais:**

```env
NODE_ENV=production
JWT_SECRET=SeuJWTSecretSuperSeguro123!
SESSION_SECRET=SeuSessionSecretSuperSeguro456!
```

### 📧 **Email (Opcional):**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seuemail@gmail.com
SMTP_PASS=SuaSenhaDeApp
```

**Como obter senha Gmail:**

1. Gmail → Verificação em 2 etapas
2. https://myaccount.google.com/apppasswords
3. Criar senha para "Alt Clinic"

---

## 🧪 **Desenvolvimento Local**

```bash
# 1. Clone
git clone https://github.com/thiagoborgh/AltClinic.git
cd AltClinic

# 2. Instalar dependências
npm install
cd frontend && npm install && cd ..

# 3. Build frontend
cd frontend && npm run build && cd ..

# 4. Copiar para public
# Windows:
Copy-Item -Path "frontend/build/*" -Destination "public/" -Recurse -Force

# Linux/Mac:
cp -r frontend/build/* public/

# 5. Executar
npm start
```

---

## 📁 **Estrutura do Projeto**

```
AltClinic/
├── 📄 app.js              # Servidor principal
├── 📁 src/               # Código backend
├── 📁 frontend/          # React frontend
├── 📁 public/            # Build de produção
├── 📄 vercel.json        # Config Vercel
├── 📄 Dockerfile         # Config Docker
└── 📚 docs/              # Documentação
```

---

## 🆘 **Suporte**

- **📧 Email:** suporte@altclinic.com
- **📚 Docs:** Veja os arquivos .md na raiz
- **🐛 Issues:** Abra uma issue no GitHub

---

## 📄 **Licença**

MIT License - Livre para uso comercial e pessoal.

---

**🚀 Feito com ❤️ para revolucionar o agendamento em clínicas!**

[![Deploy to Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/thiagoborgh/AltClinic)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/thiagoborgh/AltClinic)

**✨ Pronto para produção! ✨**
