# 🆓 WhatsApp com whatsapp-web.js (100% GRATUITO + OPENSOURCE)

## ✅ Migração Completa - Sem Custos com APIs

### 🎯 O Que Foi Implementado

Migração completa do WhatsApp para usar **whatsapp-web.js**, uma solução:

- ✅ **100% Gratuita** - Sem custos de API
- ✅ **Opensource** - Código aberto no GitHub
- ✅ **Sem Limites** - Ilimitado de mensagens
- ✅ **Autenticação QR Code** - Como WhatsApp Web
- ✅ **Funcionalidades Completas** - Texto, mídia, grupos

---

## 📁 Arquivos Criados/Modificados

### **Backend**

- ✅ `src/services/whatsappWebService.js` - Gerencia whatsapp-web.js
- ✅ `src/services/firestoreWhatsappService.js` - Armazena dados no Firestore
- ✅ `src/routes/whatsapp.js` - API REST atualizada
- ✅ `package.json` - Adicionado `whatsapp-web.js: ^1.23.0`

### **Firebase**

- ✅ `functions/index.js` - Functions simplificadas (sem Twilio)
- ✅ `functions/package.json` - Removido Twilio, adicionado qrcode
- ✅ `firebase.json` - Mantido
- ✅ `storage.rules` - Mantido

---

## 🚀 Como Funciona

### **1. whatsapp-web.js**

Usa o protocolo oficial do WhatsApp Web:

- Conecta via QR Code (como escanear no celular)
- Mantém sessão ativa
- Envia/recebe mensagens em tempo real
- Suporta textos, imagens, vídeos, áudios, documentos

### **2. Arquitetura**

```
┌─────────────────┐
│  WhatsApp App   │ (Celular)
│  Escaneia QR    │
└────────┬────────┘
         │
         ↓
┌─────────────────────┐
│ whatsapp-web.js     │ (Backend Node.js)
│ Gerencia Conexão    │
└────────┬────────────┘
         │
         ↓
┌─────────────────────┐
│ Firestore Database  │ (Persistência)
│ Mensagens/Contatos  │
└─────────────────────┘
         │
         ↓
┌─────────────────────┐
│ Cloud Storage       │ (Mídia)
│ Imagens/Vídeos/Docs │
└─────────────────────┘
```

---

## 📋 Endpoints Disponíveis

### **Sessão**

```http
GET  /api/whatsapp/session/status      # Verifica status + obtém QR Code
POST /api/whatsapp/session/connect     # Inicia conexão (gera QR)
POST /api/whatsapp/session/disconnect  # Desconecta
POST /api/whatsapp/session/clear       # Limpa sessão (para reconectar)
```

### **Mensagens**

```http
POST /api/whatsapp/send           # Envia mensagem de texto
POST /api/whatsapp/send-media     # Envia imagem/vídeo/áudio
GET  /api/whatsapp/messages       # Lista mensagens
PATCH /api/whatsapp/messages/:id/read  # Marca como lida
```

### **Contatos**

```http
GET /api/whatsapp/contacts        # Lista contatos
```

### **Config & Stats**

```http
GET  /api/whatsapp/config         # Busca configuração
POST /api/whatsapp/config         # Salva configuração
GET  /api/whatsapp/stats          # Estatísticas
```

---

## 🔧 Instalação e Configuração

### **1. Instalar Dependências**

```powershell
# Backend
npm install

# Functions
cd functions
npm install
cd ..
```

### **2. Variáveis de Ambiente (.env)**

```env
# Firebase (já configurado)
USE_FIRESTORE=true
FIREBASE_PROJECT_ID=meu-app-de-clinica

# WhatsApp (opcional - configurações customizadas)
WHATSAPP_SESSION_PATH=./.wwebjs_auth
```

**Não precisa de TWILIO\_\* - foi removido!**

### **3. Iniciar Backend**

```powershell
npm run dev
```

Backend iniciará em `http://localhost:3000`

---

## 📱 Fluxo de Conexão

### **Passo 1: Conectar WhatsApp**

```bash
curl -X POST http://localhost:3000/api/whatsapp/session/connect \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta:**

```json
{
  "success": true,
  "message": "Cliente iniciado. Aguarde o QR Code...",
  "instructions": "Use GET /session/status para obter o QR Code"
}
```

### **Passo 2: Obter QR Code**

```bash
curl http://localhost:3000/api/whatsapp/session/status \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta:**

```json
{
  "success": true,
  "connected": false,
  "qrCode": {
    "qrDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
    "timestamp": 1737329250000
  },
  "provider": "whatsapp-web.js (opensource)"
}
```

### **Passo 3: Escanear QR Code**

1. Abra WhatsApp no celular
2. Vá em **Dispositivos Vinculados**
3. Toque em **Vincular Dispositivo**
4. Escaneie o QR Code retornado no `qrDataUrl`

### **Passo 4: Aguardar Conexão**

Após escanear, aguarde ~5-10 segundos e verifique status:

```bash
curl http://localhost:3000/api/whatsapp/session/status \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta (conectado):**

```json
{
  "success": true,
  "connected": true,
  "clientInfo": {
    "phone": "5511999999999",
    "pushname": "Meu Nome",
    "platform": "android",
    "connected": true
  },
  "qrCode": null
}
```

---

## 💬 Enviando Mensagens

### **Texto Simples**

```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "message": "Olá! Sua consulta está confirmada.",
    "contactName": "Maria Silva"
  }'
```

### **Com Mídia (Imagem)**

```bash
curl -X POST http://localhost:3000/api/whatsapp/send-media \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "mediaUrl": "https://example.com/image.jpg",
    "caption": "Seu comprovante de agendamento",
    "contactName": "Maria Silva"
  }'
```

---

## ⚙️ Opções de Deploy

### **Opção 1: Cloud Run (Docker) ⭐ RECOMENDADO**

whatsapp-web.js precisa de Chrome/Chromium. Use Docker:

**Dockerfile:**

```dockerfile
FROM node:18-slim

# Instalar Chrome
RUN apt-get update && apt-get install -y \
    chromium \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Variável de ambiente para Puppeteer usar o Chrome instalado
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
```

**Deploy:**

```powershell
# Build imagem
docker build -t altclinic-whatsapp .

# Tag para GCR
docker tag altclinic-whatsapp gcr.io/meu-app-de-clinica/altclinic-whatsapp

# Push
docker push gcr.io/meu-app-de-clinica/altclinic-whatsapp

# Deploy no Cloud Run
gcloud run deploy altclinic-whatsapp \
  --image gcr.io/meu-app-de-clinica/altclinic-whatsapp \
  --platform managed \
  --region us-central1 \
  --memory 1Gi \
  --min-instances 1 \
  --allow-unauthenticated
```

**Custo:** ~R$ 30-50/mês (manter 1 instância sempre ativa)

---

### **Opção 2: Compute Engine (VM) 🆓**

VM gratuita do GCP:

**Specs:**

- e2-micro (sempre gratuito em us-central1, us-west1, us-east1)
- 30 GB HDD
- Ubuntu 22.04

**Setup:**

```bash
# Criar VM
gcloud compute instances create altclinic-whatsapp \
  --zone=us-central1-a \
  --machine-type=e2-micro \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud

# Conectar SSH
gcloud compute ssh altclinic-whatsapp --zone=us-central1-a

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt install ./google-chrome-stable_current_amd64.deb -y

# Clone projeto
git clone https://github.com/seu-usuario/seu-repo.git
cd seu-repo

# Instalar deps
npm install

# Rodar com PM2
npm install -g pm2
pm2 start src/app.js --name altclinic
pm2 startup
pm2 save
```

**Custo:** R$ 0,00 (free tier)

---

### **Opção 3: Local com ngrok/Cloudflare Tunnel**

Para testes ou pequena escala:

**Com ngrok:**

```powershell
# Instalar ngrok
choco install ngrok

# Configurar token (grátis em ngrok.com)
ngrok authtoken SEU_TOKEN

# Expor porta 3000
ngrok http 3000
```

**Com Cloudflare Tunnel (gratuito):**

```powershell
# Instalar cloudflared
choco install cloudflared

# Login
cloudflared tunnel login

# Criar tunnel
cloudflared tunnel create altclinic-whatsapp

# Configurar (criar config.yml)
# credential-file: C:\Users\...\cloudflared\UUID.json
# ingress:
#   - hostname: whatsapp.seudominio.com
#     service: http://localhost:3000
#   - service: http_status:404

# Rodar
cloudflared tunnel run altclinic-whatsapp
```

**Custo:** R$ 0,00

---

## 💾 Persistência de Dados

### **Sessões WhatsApp**

- Salvas em: `.wwebjs_auth/session-{tenantId}/`
- Persistem entre restarts
- Backup: incluir na imagem Docker ou volume persistente

### **Mensagens**

- Firestore: `tenants/{tenantId}/whatsapp_messages/`
- Cleanup automático: 90 dias

### **Mídia**

- Cloud Storage: `whatsapp_media/{tenantId}/`
- Backup automático do Firebase

---

## 🔒 Segurança

### **Sessões**

- Cada tenant tem sessão isolada
- Auth do WhatsApp protegida localmente
- Não expor pasta `.wwebjs_auth`

### **API**

- Autenticação JWT obrigatória
- Rate limiting aplicado
- CORS configurado

---

## 📊 Custos Totais

| Item                      | Custo                    |
| ------------------------- | ------------------------ |
| whatsapp-web.js           | **R$ 0,00** (opensource) |
| Firestore                 | **R$ 0,00** (free tier)  |
| Cloud Storage             | **R$ 0,00** (free tier)  |
| Cloud Run (1 instância)   | ~R$ 30-50/mês            |
| Compute Engine (e2-micro) | **R$ 0,00** (free tier)  |
| Local + ngrok/cloudflare  | **R$ 0,00**              |

**Recomendado:** Compute Engine = **R$ 0,00/mês** ✅

---

## 🎉 Conclusão

Sistema completo de WhatsApp implementado **100% GRÁTIS** usando:

- ✅ whatsapp-web.js (opensource)
- ✅ Firebase Firestore (free tier)
- ✅ Cloud Storage (free tier)
- ✅ Compute Engine VM (free tier)

**Sem custos de APIs, sem limites de mensagens!**

---

## 📚 Links Úteis

- [whatsapp-web.js GitHub](https://github.com/pedroslopez/whatsapp-web.js)
- [Documentação whatsapp-web.js](https://wwebjs.dev/)
- [Firebase Free Tier](https://firebase.google.com/pricing)
- [GCP Free Tier](https://cloud.google.com/free)

---

**🎯 Próximo passo:** Instalar dependências e testar conexão!

```powershell
npm install
npm run dev
# Então testar POST /api/whatsapp/session/connect
```
