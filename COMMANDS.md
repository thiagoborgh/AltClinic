# ⚡ Comandos Úteis - Guia Rápido

## 🚀 Desenvolvimento

### Iniciar Backend

```powershell
cd Backend
npm start
# ou
npm run dev
```

### Iniciar Frontend

```powershell
cd frontend
npm run dev
```

### Iniciar Ambos (Windows PowerShell)

```powershell
# Terminal 1
cd Backend; npm start

# Terminal 2 (novo terminal)
cd frontend; npm run dev
```

---

## 📦 Instalação

### Instalar Dependências Backend

```powershell
cd Backend
npm install
```

### Instalar Dependências Frontend

```powershell
cd frontend
npm install
```

### Instalar Tudo de Uma Vez

```powershell
cd Backend; npm install; cd ../frontend; npm install
```

---

## 🗄️ Banco de Dados

### Resetar Banco (Apagar e Recriar)

```powershell
# Parar servidor primeiro (Ctrl+C)
cd Backend
Remove-Item clinica-saas.db
npm start
# Banco será recriado automaticamente
```

### Backup do Banco

```powershell
cd Backend
Copy-Item clinica-saas.db clinica-saas-backup-$(Get-Date -Format 'yyyyMMdd').db
```

### Restaurar Backup

```powershell
cd Backend
Copy-Item clinica-saas-backup-20260112.db clinica-saas.db
```

---

## 🔑 Configuração

### Criar Arquivo .env

```powershell
cd Backend
@"
JWT_SECRET=sua_chave_secreta_123
PORT=3000
"@ | Out-File -FilePath .env -Encoding UTF8
```

### Gerar JWT Secret Seguro

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🧪 Testes

### Testar Backend (curl)

```powershell
# Teste se está rodando
curl http://localhost:3000

# Teste de cadastro
$body = @{
    nomeClinica = "Teste Clinica"
    nomeUsuario = "Admin Teste"
    email = "teste@teste.com"
    senha = "senha123"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/cadastro -Method POST -Body $body -ContentType "application/json"
```

### Testar Frontend

```powershell
# Abrir no navegador
Start-Process "http://localhost:5173"
```

---

## 🔍 Logs e Debug

### Ver Logs Backend

```powershell
# Logs aparecem no terminal onde rodou npm start
# Para salvar em arquivo:
npm start | Tee-Object -FilePath logs.txt
```

### Verificar Portas em Uso

```powershell
# Ver o que está usando porta 3000
netstat -ano | findstr :3000

# Matar processo na porta 3000
# Encontre o PID e:
Stop-Process -Id PID_AQUI -Force
```

---

## 🌐 Rede

### Descobrir IP Local

```powershell
ipconfig | Select-String -Pattern "IPv4"
```

### Testar de Outro Dispositivo

```powershell
# Backend
curl http://SEU_IP:3000

# Frontend (no celular)
# Abra navegador: http://SEU_IP:5173
```

---

## 📦 Build de Produção

### Build Frontend

```powershell
cd frontend
npm run build
# Arquivos gerados em: frontend/dist/
```

### Servir Build Localmente

```powershell
cd frontend
npm install -g serve
serve -s dist -p 5173
```

---

## 🔄 Git

### Iniciar Repositório

```powershell
git init
git add .
git commit -m "Sistema SaaS completo v2.0"
```

### Adicionar Remote

```powershell
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

### Ignorar Arquivos Sensíveis

```powershell
# .gitignore já está configurado!
# Nunca commitar:
# - .env
# - *.db
# - node_modules/
```

---

## 🐳 Docker (Opcional)

### Backend com Docker

```dockerfile
# Backend/Dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Construir e Rodar

```powershell
cd Backend
docker build -t clinica-backend .
docker run -p 3000:3000 -e JWT_SECRET=sua_chave clinica-backend
```

---

## 🌍 Deploy

### Deploy no Railway (Recomendado)

1. **Crie conta:** https://railway.app
2. **Conecte GitHub**
3. **Deploy automático:**
   ```
   New Project → Deploy from GitHub
   → Selecione: clinica-estetica-mvp
   → Variáveis: JWT_SECRET=...
   → Deploy!
   ```

### Deploy no Heroku

```powershell
# Instalar Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

heroku login
heroku create minha-clinica-app

# Deploy Backend
cd Backend
git push heroku main

# Configurar variável
heroku config:set JWT_SECRET=sua_chave
```

---

## 🧹 Limpeza

### Limpar node_modules

```powershell
# Backend
cd Backend
Remove-Item -Recurse -Force node_modules

# Frontend
cd frontend
Remove-Item -Recurse -Force node_modules
```

### Limpar Caches

```powershell
# Backend
cd Backend
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install

# Frontend
cd frontend
Remove-Item -Recurse -Force node_modules, package-lock.json, .vite
npm install
```

---

## 📊 Monitoramento

### Ver Processos Node

```powershell
Get-Process node
```

### Matar Todos os Processos Node

```powershell
Get-Process node | Stop-Process -Force
```

### Ver Uso de Memória

```powershell
Get-Process node | Select-Object Name, CPU, PM
```

---

## 🔧 Problemas Comuns

### "Porta já em uso"

```powershell
# Matar processo na porta 3000
netstat -ano | findstr :3000
Stop-Process -Id PID_AQUI -Force

# Ou mude a porta no .env
```

### "JWT_SECRET não definido"

```powershell
cd Backend
echo "JWT_SECRET=minha_chave_123" > .env
```

### "Module not found"

```powershell
# Reinstalar dependências
Remove-Item -Recurse -Force node_modules
npm install
```

### Frontend não conecta

```powershell
# Verificar CORS no server-saas.js
# Deve ter: app.use(cors())

# Verificar se backend está rodando
curl http://localhost:3000
```

---

## 📱 WhatsApp

### Testar Link WhatsApp

```powershell
# Gerar link de teste
$telefone = "5511999999999"
$mensagem = "Olá, teste!"
$link = "https://wa.me/$telefone`?text=$([uri]::EscapeDataString($mensagem))"
Start-Process $link
```

### Evolution API - Criar Instância

```powershell
$headers = @{ "apikey" = "SUA_CHAVE" }
$body = @{
    instanceName = "clinica_whatsapp"
    qrcode = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:8080/instance/create -Method POST -Headers $headers -Body $body -ContentType "application/json"
```

---

## 🎯 Atalhos Úteis

### Abrir Tudo de Uma Vez

```powershell
# Crie um script start.ps1:
@"
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd Backend; npm start'
Start-Sleep 2
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd frontend; npm run dev'
Start-Sleep 5
Start-Process 'http://localhost:5173'
"@ | Out-File -FilePath start.ps1

# Execute:
.\start.ps1
```

### Parar Tudo

```powershell
Get-Process node | Stop-Process -Force
```

---

## 📚 Referências Rápidas

| Comando         | O que faz            |
| --------------- | -------------------- |
| `npm start`     | Inicia servidor      |
| `npm install`   | Instala dependências |
| `npm run dev`   | Modo desenvolvimento |
| `npm run build` | Build produção       |
| `Ctrl+C`        | Para servidor        |
| `curl`          | Testa endpoint       |
| `Get-Process`   | Ver processos        |

---

## 🆘 Precisa de Ajuda?

1. Consulte [FAQ.md](FAQ.md)
2. Leia [QUICK-START.md](QUICK-START.md)
3. Veja logs no terminal
4. Busque o erro no Google

---

**Todos os comandos testados no Windows PowerShell!** ✅

Para bash/zsh (Mac/Linux), ajuste conforme necessário:

- `cd` → igual
- `Remove-Item` → `rm -rf`
- `Copy-Item` → `cp`
- `Get-Process` → `ps aux | grep`
