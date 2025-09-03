# 🚀 Alt Clinic - Guia de Deploy para Produção

## ✅ Sistema Pronto para Deploy!

O Alt Clinic está **100% configurado** e pronto para ser colocado no ar! 🎉

### 📦 O que foi preparado:

- ✅ Build de produção do frontend React
- ✅ Servidor Express otimizado
- ✅ Arquivos estáticos na pasta `public/`
- ✅ Scripts de deploy automatizados
- ✅ Configurações para Docker, Heroku e Vercel
- ✅ Variáveis de ambiente documentadas

---

## 🌐 Opções de Deploy

### 1️⃣ **Heroku (Recomendado) - GRATUITO**

**Por que Heroku?**

- ✅ Deploy automático com Git
- ✅ Plano gratuito disponível
- ✅ Configuração de variáveis simples
- ✅ Logs em tempo real
- ✅ HTTPS automático

**Como fazer:**

1. **Instalar Heroku CLI:**

   ```
   https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login e criar app:**

   ```bash
   heroku login
   heroku create alt-clinic-sua-empresa
   ```

3. **Configurar variáveis essenciais:**

   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=SeuJWTSecretSuperSeguro123!
   heroku config:set SESSION_SECRET=SeuSessionSecretSuperSeguro456!
   heroku config:set SMTP_USER=seuemail@gmail.com
   heroku config:set SMTP_PASS=SuaSenhaDeApp
   ```

4. **Deploy:**

   ```bash
   git add .
   git commit -m "Deploy Alt Clinic"
   git push heroku main
   ```

5. **Abrir sistema:**
   ```bash
   heroku open
   ```

**💰 Custo:** GRATUITO (até 1000 horas/mês)

---

### 2️⃣ **Vercel - GRATUITO**

**Por que Vercel?**

- ✅ Deploy em segundos
- ✅ CDN global
- ✅ Plano gratuito generoso
- ✅ Interface web simples

**Como fazer:**

1. **Instalar Vercel CLI:**

   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel login
   vercel --prod
   ```

**💰 Custo:** GRATUITO (bandwidth ilimitado)

---

### 3️⃣ **VPS/Cloud (DigitalOcean, AWS, etc.)**

**Para maior controle:**

1. **Criar servidor Ubuntu**
2. **Instalar Node.js e Git**
3. **Clonar repositório**
4. **Configurar nginx**
5. **Usar PM2 para gerenciar processo**

**💰 Custo:** $5-20/mês

---

## ⚙️ Configuração de Email (Essencial)

Para o sistema funcionar 100%, configure o email:

### Gmail (Recomendado):

1. **Ativar verificação em 2 etapas**
2. **Gerar senha de app:**

   - Ir em: https://myaccount.google.com/apppasswords
   - Criar senha para "Alt Clinic"

3. **Configurar variáveis:**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=seuemail@gmail.com
   SMTP_PASS=SuaSenhaDeApp (16 caracteres)
   ```

---

## 🔑 Variáveis de Ambiente Essenciais

**Mínimas para funcionar:**

```env
NODE_ENV=production
JWT_SECRET=SeuJWTSecretSuperSeguro123!
SESSION_SECRET=SeuSessionSecretSuperSeguro456!
SMTP_USER=seuemail@gmail.com
SMTP_PASS=SuaSenhaDeApp
```

**Opcionais (para recursos extras):**

```env
GOOGLE_API_KEY=ChaveGoogleAI
TWILIO_ACCOUNT_SID=TwilioSID
TWILIO_AUTH_TOKEN=TwilioToken
```

---

## 🧪 Teste Local Final

Antes do deploy, teste localmente:

```bash
# 1. Build do frontend
cd frontend && npm run build && cd ..

# 2. Copiar para public
Copy-Item -Path "frontend/build/*" -Destination "public/" -Recurse -Force

# 3. Testar produção
$env:NODE_ENV="production"; node app.js
```

✅ **Se abrir em http://localhost:3000 = PRONTO!**

---

## 📱 Funcionalidades Disponíveis Após Deploy:

### 🌟 **Landing Page**

- Apresentação do Alt Clinic
- Planos e preços
- Formulário de trial gratuito
- FAQ e testemunhais

### 🆓 **Sistema de Trial**

- 30 dias gratuitos automáticos
- Email de boas-vindas
- Dashboard com contador

### 💰 **Sistema de Upgrade**

- Desconto de 30% (primeiros 30 dias)
- Interface de pagamento
- Notificações automáticas

### 🤖 **IA Integrada**

- Respostas automáticas
- Análise de conversas
- Sugestões inteligentes

### 📊 **Dashboard Completo**

- Agendamentos
- Pacientes
- Financeiro
- Relatórios

---

## 🆘 Precisa de Ajuda?

1. **Problemas com deploy?**

   - Verifique logs: `heroku logs --tail`
   - Teste local primeiro

2. **Email não funciona?**

   - Verifique senha de app do Gmail
   - Confirme variáveis de ambiente

3. **Erro de build?**
   - Execute: `npm run build` localmente
   - Verifique dependências

---

## 🎉 Próximos Passos Após Deploy:

1. ✅ **Testar criação de trial**
2. ✅ **Configurar email personalizado**
3. ✅ **Adicionar domínio customizado**
4. ✅ **Configurar IA (Google Gemini)**
5. ✅ **Integrar WhatsApp/Telegram**

---

**🚀 Alt Clinic está pronto para decolar!**

**⭐ Com este sistema você tem tudo para começar seu negócio de clínica digital hoje mesmo!**
