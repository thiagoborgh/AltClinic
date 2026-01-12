# 🚀 Guia de Deploy para Produção

## 📋 Pré-requisitos

Antes de fazer deploy, certifique-se de que:

- [ ] Sistema funciona 100% localmente
- [ ] Todas as funcionalidades testadas
- [ ] Backend inicia sem erros
- [ ] Frontend conecta no backend
- [ ] Banco de dados criado automaticamente
- [ ] WhatsApp manual funciona

---

## 🎯 Escolha da Plataforma

### Opção 1: Railway (Recomendado para Começar) 🌟

**Vantagens:**

- ✅ **R$ 0/mês** para começar (500h grátis)
- ✅ Deploy automático via GitHub
- ✅ HTTPS incluído
- ✅ Fácil de usar
- ✅ Escala automaticamente

**Quando usar:** Validação, primeiros 20-50 clientes

### Opção 2: Render (Alternativa Gratuita)

**Vantagens:**

- ✅ **R$ 0/mês** no free tier
- ✅ Deploy automático
- ✅ HTTPS incluído

**Limitações:**

- ⚠️ Hiberna após 15min inativo (free)
- ⚠️ Primeiro acesso mais lento

### Opção 3: VPS (Para Escala)

**Vantagens:**

- ✅ Controle total
- ✅ Mais barato em escala
- ✅ Sem limites

**Quando usar:** 50+ clientes, receita > R$ 1000/mês

---

## 🚀 Deploy no Railway (Passo a Passo)

### Passo 1: Preparar o Repositório

```powershell
# 1. Inicializar Git (se ainda não fez)
cd c:\Projetos\clinica-estetica-mvp
git init
git add .
git commit -m "Sistema SaaS pronto para deploy"

# 2. Criar repositório no GitHub
# Acesse: https://github.com/new
# Nome: clinica-estetica-saas
# Público ou Privado (sua escolha)

# 3. Conectar ao GitHub
git remote add origin https://github.com/SEU_USUARIO/clinica-estetica-saas.git
git branch -M main
git push -u origin main
```

### Passo 2: Configurar Railway

1. **Criar conta:**

   - Acesse: https://railway.app
   - Clique em "Start a New Project"
   - Login com GitHub

2. **Criar projeto:**

   - "New Project" → "Deploy from GitHub repo"
   - Selecione: `clinica-estetica-saas`
   - Railway detecta automaticamente Node.js

3. **Configurar Backend:**

   - Railway criará serviço automaticamente
   - Clique em "Variables"
   - Adicione:
     ```
     JWT_SECRET=seu_secret_super_seguro_aqui_gerado_randomicamente
     PORT=3000
     NODE_ENV=production
     ```

4. **Gerar JWT_SECRET forte:**

   ```powershell
   # No PowerShell local:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   # Copie o resultado e use como JWT_SECRET
   ```

5. **Configurar domínio:**
   - Railway gera URL automática: `seu-app.up.railway.app`
   - Copie essa URL (vamos usar no frontend)

### Passo 3: Configurar Frontend

1. **Atualizar URL da API:**

Crie arquivo `frontend/.env.production`:

```env
VITE_API_URL=https://seu-app.up.railway.app
```

2. **Atualizar axios no frontend:**

Crie `frontend/src/config.js`:

```javascript
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
```

3. **Atualizar componentes para usar config:**

```javascript
// Em vez de:
axios.get("http://localhost:3000/...");

// Use:
import { API_URL } from "./config";
axios.get(`${API_URL}/...`);
```

### Passo 4: Build e Deploy Frontend

**Opção A: Mesmo Railway (Recomendado)**

1. Railway detecta pasta `frontend/`
2. Adiciona automaticamente
3. Build roda automaticamente
4. URL gerada: `frontend-seu-app.up.railway.app`

**Opção B: Netlify/Vercel (Grátis para frontend)**

```powershell
cd frontend
npm run build

# Deploy no Netlify:
# 1. Arraste pasta dist/ em netlify.app/drop
# 2. Configure variável VITE_API_URL
```

---

## 🔧 Configuração Completa Railway

### Railway.toml (Criar na raiz do projeto)

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "cd Backend && npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### Backend/package.json - Verificar scripts:

```json
{
  "scripts": {
    "start": "node server-saas.js",
    "dev": "node server-saas.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## 🌐 Deploy no VPS (Contabo/DigitalOcean)

### Passo 1: Criar VPS

1. **Contabo** (mais barato):

   - https://contabo.com
   - VPS S (2GB RAM): R$ 20/mês
   - Ubuntu 22.04 LTS

2. **DigitalOcean** (mais confiável):
   - https://digitalocean.com
   - Droplet $6/mês: R$ 30/mês
   - Ubuntu 22.04

### Passo 2: Configurar Servidor

```bash
# Conectar via SSH
ssh root@SEU_IP

# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Instalar PM2 (gerenciador de processos)
npm install -g pm2

# Instalar Nginx
apt install -y nginx

# Instalar Certbot (SSL grátis)
apt install -y certbot python3-certbot-nginx
```

### Passo 3: Clonar Projeto

```bash
# Criar usuário
adduser clinica
usermod -aG sudo clinica
su - clinica

# Clonar repositório
git clone https://github.com/SEU_USUARIO/clinica-estetica-saas.git
cd clinica-estetica-saas

# Backend
cd Backend
npm install --production

# Criar .env
nano .env
# Adicione:
# JWT_SECRET=seu_secret_aqui
# PORT=3000
# NODE_ENV=production

# Iniciar com PM2
pm2 start server-saas.js --name clinica-backend
pm2 save
pm2 startup
```

### Passo 4: Configurar Nginx

```bash
# Criar configuração
sudo nano /etc/nginx/sites-available/clinica

# Cole:
server {
    listen 80;
    server_name seu-dominio.com.br;

    # Frontend
    root /home/clinica/clinica-estetica-saas/frontend/dist;
    index index.html;

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Ativar site
sudo ln -s /etc/nginx/sites-available/clinica /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Configurar SSL (HTTPS)
sudo certbot --nginx -d seu-dominio.com.br
```

### Passo 5: Build Frontend

```bash
cd ~/clinica-estetica-saas/frontend

# Atualizar .env.production
echo "VITE_API_URL=https://seu-dominio.com.br/api" > .env.production

# Build
npm install
npm run build

# Arquivos estarão em dist/
```

---

## 🔐 Segurança em Produção

### 1. Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### 2. Ambiente

```bash
# Backend/.env
JWT_SECRET=use_um_secret_forte_aleatorio_64_caracteres
NODE_ENV=production
PORT=3000
DB_FILE=./clinica-saas.db
```

### 3. CORS

No `server-saas.js`, configure CORS correto:

```javascript
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://seu-dominio.com.br"
        : "http://localhost:5173",
    credentials: true,
  })
);
```

---

## 📊 Monitoramento

### 1. UptimeRobot (Grátis)

- https://uptimerobot.com
- Monitora se site está no ar
- Alerta por email/SMS se cair

### 2. PM2 Logs (VPS)

```bash
# Ver logs
pm2 logs clinica-backend

# Status
pm2 status

# Reiniciar
pm2 restart clinica-backend
```

### 3. Railway Logs

- Acesse dashboard Railway
- Clique no serviço
- Aba "Deployments" → "View Logs"

---

## 🧪 Checklist Final

Antes de anunciar:

- [ ] Sistema acessível pela URL pública
- [ ] HTTPS funcionando (cadeado verde)
- [ ] Cadastro de nova clínica funciona
- [ ] Login funciona
- [ ] Criação de agendamento funciona
- [ ] Link WhatsApp é gerado corretamente
- [ ] Dados persistem (teste recriar container)
- [ ] Performance aceitável (< 2s carregamento)
- [ ] Mobile responsivo
- [ ] Sem erros no console do navegador

---

## 🚨 Troubleshooting

### Backend não inicia

```bash
# Verificar logs
pm2 logs

# Testar manualmente
cd Backend
node server-saas.js
```

### Frontend 404

```bash
# Verificar build
cd frontend
npm run build
ls -la dist/

# Verificar nginx
sudo nginx -t
sudo systemctl status nginx
```

### Banco não cria

```bash
# Verificar permissões
cd Backend
touch clinica-saas.db
chmod 666 clinica-saas.db
```

---

## 💰 Custos Finais

### Railway (Recomendado Início)

```
Mês 1-2: R$ 0 (free tier)
Mês 3+: R$ 20-50/mês

Receita com 10 clientes: R$ 199/mês
Custo: R$ 20/mês
Lucro: R$ 179/mês (90% margem)
```

### VPS Próprio

```
Contabo: R$ 20/mês
DigitalOcean: R$ 30/mês
Domínio: R$ 40/ano

Total: ~R$ 25-35/mês

Receita com 50 clientes: R$ 995/mês
Custo: R$ 30/mês
Lucro: R$ 965/mês (97% margem)
```

---

## 📞 Próximos Passos

Após deploy:

1. [ ] Testar tudo em produção
2. [ ] Criar primeiras contas de teste
3. [ ] Configurar domínio próprio
4. [ ] Configurar backup automático
5. [ ] Integrar gateway de pagamento
6. [ ] Criar landing page
7. [ ] Buscar primeiros clientes! 🚀

---

**Qual opção você quer seguir?**

1. **Railway** - Rápido, grátis para começar (recomendado)
2. **VPS** - Mais controle, setup manual
3. **Render** - Alternativa ao Railway

Me diga qual prefere e continuamos! 😊
