# 🚀 Deploy Frontend no Vercel

## 📋 Pré-requisitos

- ✅ Backend rodando no notebook (porta 3000)
- ✅ Ngrok expondo backend via HTTPS
- ✅ Conta na Vercel (gratuita)

## 🔧 Configuração

### 1. Instalar Vercel CLI (opcional)

```powershell
npm install -g vercel
```

### 2. Configurar variáveis de ambiente

O arquivo `frontend/.env.production` já está configurado com:

```env
REACT_APP_API_URL=https://fdef11b73864.ngrok-free.app/api
```

⚠️ **IMPORTANTE:** Sempre que o ngrok reiniciar, a URL muda. Você precisará:

1. Atualizar `frontend/.env.production` com a nova URL
2. Fazer redeploy no Vercel

## 📦 Opção 1: Deploy via Dashboard (Recomendado)

### Passo 1: Criar repositório no GitHub (se ainda não tiver)

```powershell
cd C:\Users\thiag\saee
git add .
git commit -m "Configuração para Vercel - frontend separado"
git push origin main
```

### Passo 2: Conectar no Vercel

1. Acesse https://vercel.com/new
2. Clique em "Import Git Repository"
3. Selecione seu repositório `AltClinic`
4. Configure o projeto:

**Framework Preset:** Create React App
**Root Directory:** `frontend`
**Build Command:** `npm run build`
**Output Directory:** `build`
**Install Command:** `npm install`

### Passo 3: Adicionar Variáveis de Ambiente

Na seção "Environment Variables", adicione:

```
REACT_APP_API_URL=https://fdef11b73864.ngrok-free.app/api
```

### Passo 4: Deploy

Clique em **Deploy** e aguarde!

---

## 📦 Opção 2: Deploy via CLI

```powershell
cd C:\Users\thiag\saee\frontend

# Login na Vercel
vercel login

# Deploy
vercel --prod
```

Quando perguntado:

- **Set up and deploy?** Yes
- **Which scope?** Selecione sua conta
- **Link to existing project?** No
- **Project name?** altclinic-frontend (ou outro nome)
- **Directory?** ./
- **Override settings?** No

---

## 🔄 Atualizar URL do Backend (Quando ngrok reiniciar)

### Via Dashboard:

1. Acesse https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Edite `REACT_APP_API_URL` com a nova URL do ngrok
5. Vá em **Deployments**
6. Clique nos 3 pontos do último deploy → **Redeploy**

### Via CLI:

```powershell
cd C:\Users\thiag\saee\frontend

# Atualizar .env.production com nova URL
# Depois:
vercel --prod
```

---

## 🌐 URLs Após Deploy

- **Frontend (Vercel):** https://altclinic-frontend.vercel.app (ou seu domínio)
- **Backend (Notebook):** https://fdef11b73864.ngrok-free.app
- **Email Relay (Notebook):** https://4f95973cd004.ngrok-free.app

---

## ✅ Checklist Pós-Deploy

- [ ] Frontend carregando no Vercel
- [ ] API conectando com backend (verificar console do navegador)
- [ ] Login funcionando
- [ ] Backend recebendo requisições (verificar logs)
- [ ] CORS configurado corretamente (sem erros no console)

---

## 🔧 Solução de Problemas

### Erro de CORS

Verifique se o backend está com CORS configurado para aceitar Vercel:

```javascript
// src/app.js já está configurado para aceitar *.vercel.app
```

### Backend não responde

1. Verifique se o ngrok está rodando:

```powershell
cd C:\Users\thiag\saee\tools\notebook-server
.\status.ps1
```

2. Teste a URL do backend:

```powershell
Invoke-RestMethod -Uri "https://fdef11b73864.ngrok-free.app/health"
```

### URL do ngrok mudou

1. Pegue nova URL:

```powershell
Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" | Select-Object -ExpandProperty tunnels | Where-Object { $_.name -eq 'api' } | Select-Object -ExpandProperty public_url
```

2. Atualize `frontend/.env.production`
3. Redeploy no Vercel

---

## 💡 Dicas

### Para URLs estáveis do ngrok:

Considere upgrade do ngrok para ter domínios fixos:

- Plano Personal: $8/mês
- Domínio reservado que não muda

### Alternativa ao ngrok:

- **Cloudflare Tunnel** (gratuito, domínio fixo)
- **Tailscale** (para acesso privado)
- **LocalTunnel** (alternativa gratuita)

---

## 🎯 Próximos Passos

1. ✅ Deploy frontend no Vercel
2. ✅ Testar integração frontend-backend
3. 🔄 Configurar webhook do GitHub para deploy automático
4. 💰 Considerar ngrok pago para URL fixa
5. 🚀 Planejar migração backend para cloud (AWS/Railway) no futuro
