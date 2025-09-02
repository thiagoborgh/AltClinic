# 🚀 Guia de Instalação - Intranet Altclinic

## 📋 **PRÉ-REQUISITOS**

### Software Necessário
- **Node.js** v16.0.0 ou superior
- **npm** v8.0.0 ou superior  
- **Git** (para clonar repositório)
- **SQLite3** (incluído com Node.js)

### Verificar Instalações
```bash
node --version
npm --version
git --version
```

---

## ⬇️ **DOWNLOAD E PREPARAÇÃO**

### 1. Clone/Cópia dos Arquivos
Se você possui acesso ao repositório:
```bash
git clone https://github.com/altclinic/saee-admin.git
cd saee-admin/admin
```

Ou copie manualmente a pasta `admin/` para seu servidor.

### 2. Estrutura de Diretórios
Verifique se a estrutura está correta:
```
admin/
├── frontend/
├── backend/
└── docs/
```

---

## 🔧 **CONFIGURAÇÃO DO BACKEND**

### 1. Navegar para o Backend
```bash
cd admin/backend
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie o arquivo `.env`:
```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Edite o arquivo `.env`:
```env
# Porta do servidor backend
PORT=3001

# Ambiente (development/production)
NODE_ENV=development

# Caminho do banco de dados admin
ADMIN_DB_PATH=./database/admin.sqlite

# Chave secreta para JWT (ALTERE ESTA CHAVE!)
JWT_SECRET=sua-chave-super-secreta-admin-altclinic-2025

# Caminho do banco principal do sistema SAEE
MAIN_DB_PATH=../../src/database/database.sqlite

# Origens permitidas (CORS)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

⚠️ **IMPORTANTE**: Altere o `JWT_SECRET` para uma chave única e segura!

### 4. Inicializar Banco de Dados
```bash
npm run init-db
```

### 5. Testar Backend
```bash
npm run dev
```

Você deve ver:
```
✅ Admin Server running on port 3001
✅ Admin database connected
✅ Database tables checked/created
✅ Default admin user created
```

---

## 🎨 **CONFIGURAÇÃO DO FRONTEND**

### 1. Navegar para o Frontend
```bash
cd admin/frontend
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar API URL (se necessário)
Edite `src/config.js` se a URL da API for diferente:
```javascript
const config = {
  API_BASE_URL: 'http://localhost:3001/api/admin'
};
```

### 4. Iniciar Frontend
```bash
npm start
```

O frontend abrirá automaticamente em: http://localhost:3000

---

## 🔐 **PRIMEIRO ACESSO**

### 1. Acessar a Intranet
Abra seu navegador e acesse: **http://localhost:3000/admin**

### 2. Login Inicial
Use as credenciais padrão:
- **Email**: `admin@altclinic.com`
- **Senha**: `Admin123!`

### 3. Alterar Senha (OBRIGATÓRIO)
1. Após o login, vá para o perfil
2. Clique em "Alterar Senha"
3. Digite uma nova senha segura
4. Confirme a alteração

---

## 🔄 **SINCRONIZAÇÃO COM SISTEMA PRINCIPAL**

### 1. Configurar Caminho do Banco Principal
No `.env` do backend, ajuste o caminho:
```env
# Exemplo para Windows
MAIN_DB_PATH=C:/caminho/para/seu/saee/src/database/database.sqlite

# Exemplo para Linux
MAIN_DB_PATH=/home/user/saee/src/database/database.sqlite
```

### 2. Primeira Sincronização
1. Acesse a intranet
2. Vá para "Licenças"
3. Clique em "Sincronizar Dados"
4. Aguarde a importação das licenças

---

## 🧪 **TESTES DE FUNCIONAMENTO**

### 1. Teste do Backend
```bash
cd admin/backend

# Testar saúde da API
curl http://localhost:3001/api/admin/health

# Testar autenticação
curl -X POST http://localhost:3001/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@altclinic.com","password":"Admin123!"}'
```

### 2. Teste do Frontend
1. ✅ Login funciona
2. ✅ Dashboard carrega estatísticas
3. ✅ Licenças lista/cria/edita
4. ✅ Configurações carregam por licença
5. ✅ Relatórios geram gráficos

---

## 🚨 **TROUBLESHOOTING**

### Backend não inicia
**Erro comum**: `EADDRINUSE: address already in use :::3001`
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID [PID_NUMBER] /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Frontend não conecta com Backend
1. Verifique se o backend está rodando em :3001
2. Confirme as configurações de CORS no backend
3. Verifique o `API_BASE_URL` no frontend

### Banco de dados não encontrado
1. Verifique o caminho no `ADMIN_DB_PATH`
2. Confirme permissões de escrita no diretório
3. Execute `npm run init-db` novamente

### Erro de sincronização
1. Verifique o `MAIN_DB_PATH` no .env
2. Confirme que o arquivo existe e tem permissão de leitura
3. Teste a conexão manualmente:
```bash
sqlite3 "../../src/database/database.sqlite" ".tables"
```

---

## 🔒 **CONFIGURAÇÃO DE SEGURANÇA**

### 1. Firewall (Produção)
```bash
# Permitir apenas portas necessárias
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw deny 3001   # Bloquear acesso direto ao backend
```

### 2. Proxy Reverso (Nginx)
```nginx
# /etc/nginx/sites-available/admin.altclinic.com
server {
    listen 80;
    server_name admin.altclinic.com;
    
    # API Backend
    location /api/admin/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Frontend Static Files
    location / {
        root /var/www/admin-frontend/build;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### 3. SSL/HTTPS (Certbot)
```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d admin.altclinic.com

# Auto-renovação
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 **MONITORAMENTO E LOGS**

### 1. Logs do Sistema
```bash
# Backend logs
tail -f admin/backend/logs/app.log
tail -f admin/backend/logs/error.log

# PM2 logs (se usando PM2)
pm2 logs admin-backend
pm2 logs admin-frontend
```

### 2. Monitoramento com PM2
```bash
# Instalar PM2
npm install -g pm2

# Configurar processo backend
pm2 start admin/backend/server.js --name "admin-backend"

# Configurar processo frontend (build primeiro)
cd admin/frontend && npm run build
pm2 serve build 3000 --name "admin-frontend"

# Salvar configuração
pm2 save
pm2 startup
```

### 3. Backup Automático
```bash
#!/bin/bash
# /home/user/scripts/backup-admin.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/altclinic-admin"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do banco admin
cp /caminho/para/admin/backend/database/admin.sqlite \
   $BACKUP_DIR/admin_$DATE.sqlite

# Backup das configurações
tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
    /caminho/para/admin/backend/.env \
    /caminho/para/admin/frontend/src/config.js

# Manter apenas últimos 30 dias
find $BACKUP_DIR -name "*.sqlite" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### 4. Cron para Backup
```bash
# Editar crontab
crontab -e

# Backup diário às 2h da manhã
0 2 * * * /home/user/scripts/backup-admin.sh >> /var/log/admin-backup.log 2>&1
```

---

## ✅ **CHECKLIST DE INSTALAÇÃO**

### Backend Setup
- [ ] Node.js instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado
- [ ] `JWT_SECRET` alterado
- [ ] Banco inicializado (`npm run init-db`)
- [ ] Servidor iniciado (`npm run dev`)
- [ ] API respondendo em :3001

### Frontend Setup
- [ ] Dependências instaladas (`npm install`)
- [ ] `API_BASE_URL` configurado
- [ ] Frontend iniciado (`npm start`)
- [ ] Interface acessível em :3000

### Configurações
- [ ] Primeiro login realizado
- [ ] Senha padrão alterada
- [ ] Caminho do banco principal configurado
- [ ] Primeira sincronização executada
- [ ] Testes de funcionalidade ok

### Produção (Opcional)
- [ ] Proxy reverso configurado
- [ ] SSL/HTTPS ativo
- [ ] Firewall configurado
- [ ] Monitoramento ativo
- [ ] Backup automatizado

---

## 📞 **SUPORTE**

Se você encontrar problemas durante a instalação:

1. **Consulte a documentação completa**: `admin/docs/README.md`
2. **Verifique os logs**: Backend e Frontend logs
3. **Teste conectividade**: API endpoints e banco de dados
4. **Contato técnico**: dev@altclinic.com

---

*Guia de Instalação - Intranet Altclinic v1.0*  
*Última atualização: 02/09/2025*
