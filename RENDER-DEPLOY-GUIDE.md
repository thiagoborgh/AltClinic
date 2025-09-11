# 🚀 GUIA COMPLETO: DEPLOY ALTCLINIC COM PAINEL ADMIN NO RENDER

## 📋 **PRÉ-REQUISITOS**

- Conta no [Render](https://render.com)
- Repositório GitHub atualizado
- Node.js 20.3.0+ (compatível com sharp module)

---

## 🔧 **PASSO 1: CONFIGURAÇÃO DO PROJETO**

### 1.1 Scripts de Build Atualizados

Os seguintes arquivos foram atualizados automaticamente:

**`package.json`** - Scripts de build incluem admin:

```json
{
  "engines": {
    "node": ">=20.3.0",
    "npm": ">=8.0.0"
  },
  "scripts": {
    "build:linux": "cd frontend && npm install && npm run build && cd .. && cd admin/frontend && npm install && npm run build && cd ../.. && mkdir -p public && mkdir -p public/admin && cp -r frontend/build/* public/ && cp -r admin/frontend/build/* public/admin/ && npm install",
    "heroku-postbuild": "cd frontend && npm install && npm run build && cd .. && cd admin/frontend && npm install && npm run build && cd ../.. && mkdir -p public && mkdir -p public/admin && cp -r frontend/build/* public/ && cp -r admin/frontend/build/* public/admin/ && npm install"
  }
}
```

**`copy-build.ps1`** - Script Windows atualizado:

```powershell
# Copia frontend principal e admin
robocopy "frontend/build" "public" /E /IS /IT /NFL /NDL /NJH /NJS
robocopy "admin/frontend/build" "public/admin" /E /IS /IT /NFL /NDL /NJH /NJS
```

---

## 🚀 **PASSO 2: DEPLOY NO RENDER**

### 2.1 Criar/Acessar Serviço

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Clique em **"New"** → **"Web Service"**
3. Conecte seu repositório GitHub
4. Selecione o branch `main`

### 2.2 Configurações do Serviço

#### **Build Settings:**

```
Build Command:
cd frontend && npm install && npm run build && cd .. && cd admin/frontend && npm install && npm run build && cd ../.. && mkdir -p public && mkdir -p public/admin && cp -r frontend/build/* public/ && cp -r admin/frontend/build/* public/admin/ && npm install

Start Command:
node src/app.js
```

#### **Environment Variables:**

```
NODE_ENV=production
JWT_SECRET=AltClinic2024SuperSeguro!
SESSION_SECRET=AltClinicSession2024!
FRONTEND_URL=https://seu-app.onrender.com
ADMIN_URL=https://seu-app.onrender.com/admin

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app_gmail
EMAIL_FROM=AltClinic SaaS <seu_email@gmail.com>
```

#### **Advanced Settings:**

```
Instance Type: Starter (Free) ou superior
Region: São Paulo (ou mais próximo)
```

### 2.3 Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o build (8-12 minutos - inclui admin)
3. Serviço estará disponível em: `https://seu-app.onrender.com`

---

## 🔍 **PASSO 3: VERIFICAÇÃO**

### 3.1 Testes Após Deploy

#### **Frontend Principal:**

```
URL: https://seu-app.onrender.com
✅ Página carrega
✅ Login funciona
✅ Navegação ok
```

#### **Painel Admin:**

```
URL: https://seu-app.onrender.com/admin
✅ Página admin carrega
✅ Login: admin@clinica.com / 123456
✅ Menu completo funciona
✅ Licenças, Financeiro, CRM, Automação
```

#### **APIs:**

```
✅ https://seu-app.onrender.com/api/health
✅ https://seu-app.onrender.com/api/tenants/admin/list
✅ https://seu-app.onrender.com/api/tenants/admin/financeiro/resumo
```

---

## 📁 **ESTRUTURA FINAL NO RENDER**

```
seu-app.onrender.com/
├── /                    # Frontend principal (clientes)
├── /admin/             # 🆕 Painel Admin (gestão)
├── /api/               # APIs unificadas
└── /uploads/           # Arquivos estáticos
```

---

## 🛠️ **TROUBLESHOOTING**

### Problema: Build falha

**Solução:** Verifique se todos os `package.json` têm dependências corretas

### Problema: Admin não carrega

**Solução:** Verifique se arquivos foram copiados para `public/admin/`

### Problema: 404 no admin

**Solução:** Confirme que homepage no admin é `/admin`

### Problema: APIs não funcionam

**Solução:** Verifique variáveis de ambiente JWT_SECRET

---

## 📊 **MONITORAMENTO**

### Logs do Render:

1. Acesse seu serviço no Render
2. Vá para **"Logs"** tab
3. Monitore por erros

### Health Check:

```
curl https://seu-app.onrender.com/health
```

---

## 🎉 **SUCESSO!**

Após completar estes passos, você terá:

✅ **Sistema completo no ar**
✅ **Frontend principal** funcionando
✅ **Painel Admin** com todas as funcionalidades
✅ **APIs integradas** e seguras
✅ **Deploy automatizado** via Git

### URLs de Acesso:

- 🌐 **Frontend:** `https://seu-app.onrender.com`
- 👨‍💼 **Admin:** `https://seu-app.onrender.com/admin`
- 🔑 **Login Admin:** `admin@clinica.com` / `123456`

**Deploy concluído com sucesso!** 🚀✨
