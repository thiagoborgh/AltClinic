# 🚀 Guia de Deploy Gratuito - AltClinic

## 📋 Opções de Deploy Gratuito

### 1. **Vercel** ⭐ (RECOMENDADO)
**Melhor para projetos React/Next.js**

**Vantagens:**
- ✅ Deploy automático via GitHub
- ✅ HTTPS automático
- ✅ Preview branches
- ✅ 100GB bandwidth/mês
- ✅ CDN global
- ✅ Domínio customizado gratuito

**Limites:**
- 100GB bandwidth/mês
- 100 deployments/dia

**Como fazer deploy:**
```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. No diretório frontend
cd frontend
vercel

# 3. Seguir o wizard:
# - Set up and deploy? Yes
# - Which scope? (sua conta)
# - Link to existing project? No
# - Project name: altclinic
# - Directory: ./
# - Override settings? No
```

---

### 2. **Netlify** ⭐
**Excelente para SPAs React**

**Vantagens:**
- ✅ Drag & drop deploy
- ✅ Forms gratuitos
- ✅ 100GB bandwidth/mês
- ✅ Deploy contínuo via Git
- ✅ HTTPS automático

**Como fazer deploy:**
```bash
# 1. Build do projeto
cd frontend
npm run build

# 2. Subir pasta build em netlify.com
# OU via CLI:
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

---

### 3. **GitHub Pages**
**Gratuito para repositórios públicos**

**Vantagens:**
- ✅ Totalmente gratuito
- ✅ Integração nativa com GitHub
- ✅ Domínio github.io incluído

**Limitações:**
- ❌ Apenas sites estáticos
- ❌ Sem variáveis de ambiente privadas

**Setup:**
```bash
# 1. Instalar gh-pages
npm install --save-dev gh-pages

# 2. Adicionar no package.json:
"homepage": "https://thiagoborgh.github.io/AltClinic",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}

# 3. Deploy
npm run deploy
```

---

### 4. **Railway** 🚂
**Bom para full-stack**

**Vantagens:**
- ✅ $5 crédito/mês gratuito
- ✅ Deploy de banco de dados
- ✅ Variáveis de ambiente
- ✅ Logs em tempo real

---

### 5. **Render**
**Alternativa ao Heroku**

**Vantagens:**
- ✅ 750h gratuitas/mês
- ✅ PostgreSQL gratuito
- ✅ SSL automático
- ✅ Deploy via GitHub

---

## 🎯 RECOMENDAÇÃO: Vercel

**Por que Vercel é a melhor opção para nós:**

1. **Otimizado para React** - Deploy em segundos
2. **Preview automático** - Cada PR gera uma URL de teste
3. **Analytics gratuito** - Métricas de performance
4. **Edge Functions** - Para funcionalidades serverless
5. **Domínio personalizado** - Tipo: altclinic.vercel.app

---

## 🛠️ Preparando o Projeto para Deploy

### **1. Build otimizado:**
```bash
cd frontend
npm run build
```

### **2. Testar build local:**
```bash
npm install -g serve
serve -s build
```

### **3. Variáveis de ambiente:**
Criar arquivo `.env.production`:
```env
REACT_APP_API_URL=https://sua-api.com
REACT_APP_WHATSAPP_API_URL=https://graph.facebook.com/v18.0
```

### **4. Otimizações para produção:**
```javascript
// Adicionar no package.json
"scripts": {
  "build": "react-scripts build && npm run optimize",
  "optimize": "npm run compress && npm run analyze",
  "compress": "gzip -9 build/static/js/*.js",
  "analyze": "npm run build && npx webpack-bundle-analyzer build/static/js/*.js"
}
```

---

## 🚀 Deploy Passo a Passo - Vercel

### **Opção A: Via Website (Mais Fácil)**
1. Acesse [vercel.com](https://vercel.com)
2. Conecte com GitHub
3. Selecione o repositório AltClinic
4. Configure:
   - Framework: Create React App
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`
5. Clique em "Deploy"

### **Opção B: Via CLI**
```bash
# 1. Instalar Vercel
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
cd frontend
vercel

# 4. Configurar:
# ? Set up and deploy "frontend"? [Y/n] y
# ? Which scope do you want to deploy to? [sua-conta]
# ? Link to existing project? [y/N] n
# ? What's your project's name? altclinic
# ? In which directory is your code located? ./
# ? Want to override the settings? [y/N] n
```

---

## 🔧 Configurações Específicas

### **Para WhatsApp Business API:**
```javascript
// Adicionar verificação de ambiente
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://graph.facebook.com/v18.0'
  : 'https://graph.facebook.com/v18.0';

// Webhook URL para produção
const WEBHOOK_URL = process.env.NODE_ENV === 'production'
  ? 'https://altclinic.vercel.app/api/webhook'
  : 'http://localhost:3000/api/webhook';
```

### **Configurar domínio personalizado:**
1. No dashboard Vercel
2. Vá em Settings > Domains
3. Adicione seu domínio (ex: altclinic.com.br)

---

## 📊 URLs de Deploy

Após o deploy, você terá:

**Vercel:**
- URL principal: `https://altclinic.vercel.app`
- Preview branches: `https://altclinic-git-[branch].vercel.app`

**Netlify:**
- URL principal: `https://altclinic.netlify.app`
- Preview: `https://[id]--altclinic.netlify.app`

**GitHub Pages:**
- URL: `https://thiagoborgh.github.io/AltClinic`

---

## 🔐 Configurações de Segurança

### **Variáveis de ambiente no Vercel:**
```bash
# No dashboard Vercel > Settings > Environment Variables
REACT_APP_WHATSAPP_PHONE_ID=your_phone_id
REACT_APP_WHATSAPP_ACCESS_TOKEN=your_token
REACT_APP_API_URL=https://sua-api.com
```

### **Headers de segurança:**
Criar `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

---

## 🎯 Checklist Pré-Deploy

- [ ] Build funciona localmente (`npm run build`)
- [ ] Teste a versão de produção (`serve -s build`)
- [ ] Configurar variáveis de ambiente
- [ ] Testar em dispositivos móveis
- [ ] Verificar performance (Lighthouse)
- [ ] Configurar analytics
- [ ] Documentar URLs de acesso

---

## 📈 Monitoramento Pós-Deploy

### **Analytics gratuitos:**
- Vercel Analytics (incluído)
- Google Analytics
- Hotjar (heatmaps)

### **Monitoramento de erros:**
- Sentry (gratuito até 5k erros/mês)
- LogRocket (sessões gratuitas)

---

## 🚀 Próximos Passos

1. **Deploy inicial** no Vercel
2. **Configurar domínio** personalizado
3. **Configurar WhatsApp** webhook para produção
4. **Testes completos** em produção
5. **Configurar analytics**
6. **Documentar acesso** para equipe

---

## 💡 Dicas Importantes

- 🔄 **Deploy automático** - Conecte com GitHub para CI/CD
- 🌍 **CDN global** - Vercel distribui globalmente
- 📱 **Mobile-first** - Teste sempre no mobile
- 🔐 **HTTPS obrigatório** - Para WhatsApp Business API
- 📊 **Analytics** - Configure desde o início

---

**URL recomendada após deploy:**
`https://altclinic.vercel.app` 🎉
