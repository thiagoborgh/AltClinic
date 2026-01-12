# 🚀 Deploy no Railway - Passo a Passo

## Pré-requisitos
- [ ] Código commitado no Git local
- [ ] Conta no GitHub
- [ ] Conta no Railway (https://railway.app)

## Parte 1: Subir Código para GitHub

### 1.1 Criar Repositório no GitHub
1. Acesse https://github.com/new
2. Nome do repositório: `clinica-saas`
3. Descrição: "Sistema SaaS de Gestão de Clínicas Estéticas"
4. **Deixe PRIVADO** (ou público se preferir)
5. **NÃO marque** "Add a README"
6. Clique em **Create repository**

### 1.2 Conectar e Enviar Código
```powershell
# No PowerShell, execute:
cd C:\Projetos\clinica-estetica-mvp

# Adicione o repositório remoto (SUBSTITUA pelo SEU usuário GitHub)
git remote add origin https://github.com/SEU-USUARIO/clinica-saas.git

# Envie o código
git branch -M main
git push -u origin main
```

**✅ CHECKPOINT:** Atualize a página do GitHub - seu código deve estar lá!

---

## Parte 2: Deploy do Backend no Railway

### 2.1 Criar Projeto no Railway
1. Acesse https://railway.app
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Autorize o Railway a acessar seu GitHub
5. Selecione o repositório **clinica-saas**

### 2.2 Configurar Backend
1. Railway vai detectar o Node.js automaticamente
2. Clique em **"Add variables"**
3. Adicione estas variáveis:

```
JWT_SECRET=seu_segredo_jwt_aqui_64_caracteres_aleatorios
NODE_ENV=production
PORT=3000
DATABASE_PATH=./clinica-saas.db
```

**Gerar JWT_SECRET:**
```powershell
# Execute no PowerShell:
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

### 2.3 Configurar Build
1. Vá em **Settings** → **Build**
2. **Root Directory**: `Backend`
3. **Start Command**: `node server-saas.js`

### 2.4 Deploy
1. Clique em **"Deploy"**
2. Aguarde o build finalizar (1-2 minutos)
3. Copie a URL do backend: `https://seu-backend.up.railway.app`

**✅ CHECKPOINT:** Teste a URL: `https://seu-backend.up.railway.app/health` deve retornar `{"status":"ok"}`

---

## Parte 3: Deploy do Frontend no Railway

### 3.1 Criar Segundo Serviço
1. No mesmo projeto Railway, clique **"+ New"**
2. Selecione **"GitHub Repo"** → escolha **clinica-saas** novamente
3. Será criado um segundo serviço

### 3.2 Configurar Frontend
1. Clique em **"Add variables"**
2. Adicione:

```
VITE_API_URL=https://seu-backend.up.railway.app
```

**⚠️ IMPORTANTE:** Cole a URL EXATA do backend (da etapa 2.4)

### 3.3 Configurar Build
1. Vá em **Settings** → **Build**
2. **Root Directory**: `frontend`
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm run preview -- --host 0.0.0.0 --port $PORT`

### 3.4 Deploy
1. Clique em **"Deploy"**
2. Aguarde o build (2-3 minutos)
3. Copie a URL do frontend: `https://seu-frontend.up.railway.app`

**✅ CHECKPOINT:** Abra a URL do frontend no navegador - página de login deve aparecer!

---

## Parte 4: Testar Sistema

### 4.1 Criar Primeira Conta
1. Acesse `https://seu-frontend.up.railway.app`
2. Clique em **"Criar Nova Conta"**
3. Preencha os dados:
   - Nome da Clínica: **Minha Clínica Teste**
   - Email: **admin@clinica.com**
   - Senha: **senha123**
4. Clique em **"Criar Conta"**

### 4.2 Fazer Login
1. Use o email e senha cadastrados
2. Deve redirecionar para **/configuracoes**

### 4.3 Testar Agendamento
1. Vá em **Configurações** → aba **WhatsApp**
2. Configure telefone de teste: **5511999999999**
3. Escolha integração: **Manual (wa.me)**
4. Salve
5. Crie um agendamento de teste
6. Verifique se gera link do WhatsApp

---

## 🎉 Pronto! Sistema no Ar!

**URLs Finais:**
- Backend: `https://seu-backend.up.railway.app`
- Frontend: `https://seu-frontend.up.railway.app`

---

## 📊 Monitoramento

### Railway Dashboard
- **Logs**: Railway → seu-backend → Logs
- **Métricas**: CPU, RAM, Requests
- **Banco**: SQLite está no container (persiste entre deploys)

### Custos Esperados
- **Tier Gratuito**: 500 horas/mês (suficiente para testes)
- **Tier Pago**: ~$5-10/mês (cerca de R$25-50)

---

## 🔧 Atualizações Futuras

Quando fizer mudanças no código:

```powershell
# 1. Commit
git add .
git commit -m "descrição da mudança"

# 2. Push
git push

# 3. Railway faz deploy automático!
```

---

## ❓ Problemas Comuns

### Backend não sobe
- Verifique variáveis de ambiente (JWT_SECRET, PORT)
- Veja logs: Railway → Backend → Logs
- Confirme Root Directory: `Backend`

### Frontend erro 404 na API
- Verifique VITE_API_URL no frontend
- Teste URL do backend manualmente: `/health`

### Erro de CORS
- Backend precisa estar com CORS habilitado (já está no server-saas.js)

---

**Dúvidas?** Verifique os logs no Railway ou abra issue no GitHub!
