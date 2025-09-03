# 🚀 Guia de Deploy - Intranet Altclinic

## 🎯 **VISÃO GERAL DO DEPLOY**

Este guia aborda o deploy completo da Intranet Altclinic em ambiente de produção, incluindo configurações de servidor, segurança e monitoramento.

---

## 🖥️ **REQUISITOS DO SERVIDOR**

### Especificações Mínimas

- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **OS**: Ubuntu 20.04 LTS ou superior
- **Network**: IP público com SSL

### Especificações Recomendadas

- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 50GB SSD
- **Backup**: Storage adicional para backups

---

## 🔧 **PREPARAÇÃO DO SERVIDOR**

### 1. Atualização do Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalação do Node.js

```bash
# Instalar Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 3. Instalação do PM2

```bash
sudo npm install -g pm2
```

### 4. Instalação do Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 5. Configuração do Firewall

```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw status
```

---

## 📂 **ESTRUTURA DE DIRETÓRIOS**

### Criar Estrutura de Produção

```bash
# Criar diretório principal
sudo mkdir -p /var/www/altclinic-admin
sudo chown -R $USER:$USER /var/www/altclinic-admin

# Criar diretórios de dados
sudo mkdir -p /var/lib/altclinic/{database,backups,logs}
sudo chown -R $USER:$USER /var/lib/altclinic

# Estrutura final
/var/www/altclinic-admin/     # Aplicação
├── backend/                  # API Backend
├── frontend/                 # Frontend Build
└── docs/                     # Documentação

/var/lib/altclinic/           # Dados
├── database/                 # Bancos SQLite
├── backups/                  # Backups automáticos
└── logs/                     # Logs da aplicação
```

---

## 📦 **DEPLOY DO BACKEND**

### 1. Upload dos Arquivos

```bash
# Via SCP
scp -r admin/backend user@server:/var/www/altclinic-admin/

# Via Git (recomendado)
cd /var/www/altclinic-admin
git clone https://github.com/altclinic/saee-admin.git .
```

### 2. Instalação das Dependências

```bash
cd /var/www/altclinic-admin/backend
npm ci --production
```

### 3. Configuração do .env

```bash
cd /var/www/altclinic-admin/backend
cp .env.example .env
nano .env
```

**Arquivo .env de Produção:**

```env
# Ambiente
NODE_ENV=production
PORT=3001

# Banco de dados
ADMIN_DB_PATH=/var/lib/altclinic/database/admin.sqlite
MAIN_DB_PATH=/var/lib/altclinic/database/main.sqlite

# JWT Secret (GERAR UMA CHAVE ÚNICA!)
JWT_SECRET=sua-chave-producao-super-secreta-altclinic-2025

# CORS
ALLOWED_ORIGINS=https://admin.altclinic.com

# Logs
LOG_LEVEL=info
LOG_PATH=/var/lib/altclinic/logs

# Backup
BACKUP_PATH=/var/lib/altclinic/backups
BACKUP_RETENTION_DAYS=30
```

### 4. Inicialização do Banco

```bash
npm run init-db
```

### 5. Configuração do PM2

```bash
# Criar ecosystem file
nano ecosystem.config.js
```

**ecosystem.config.js:**

```javascript
module.exports = {
  apps: [
    {
      name: "altclinic-admin-backend",
      script: "server.js",
      cwd: "/var/www/altclinic-admin/backend",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      error_file: "/var/lib/altclinic/logs/backend-error.log",
      out_file: "/var/lib/altclinic/logs/backend-out.log",
      log_file: "/var/lib/altclinic/logs/backend-combined.log",
      max_memory_restart: "1G",
      node_args: "--max_old_space_size=1024",
    },
  ],
};
```

### 6. Iniciar Backend

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🎨 **DEPLOY DO FRONTEND**

### 1. Build Local (se necessário)

```bash
cd admin/frontend
npm ci
npm run build
```

### 2. Upload do Build

```bash
# Upload da pasta build
scp -r admin/frontend/build/* user@server:/var/www/altclinic-admin/frontend/

# Ou via rsync
rsync -avz admin/frontend/build/ user@server:/var/www/altclinic-admin/frontend/
```

### 3. Configuração de Permissões

```bash
sudo chown -R www-data:www-data /var/www/altclinic-admin/frontend
sudo chmod -R 755 /var/www/altclinic-admin/frontend
```

---

## 🌐 **CONFIGURAÇÃO DO NGINX**

### 1. Configuração do Site

```bash
sudo nano /etc/nginx/sites-available/admin.altclinic.com
```

**Configuração Nginx:**

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Upstream para backend
upstream altclinic_backend {
    server 127.0.0.1:3001;
    keepalive 32;
}

server {
    listen 80;
    server_name admin.altclinic.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.altclinic.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/admin.altclinic.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.altclinic.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Root directory
    root /var/www/altclinic-admin/frontend;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # API routes com rate limiting
    location /api/admin/auth/login {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://altclinic_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/admin/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://altclinic_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Frontend routing
    location / {
        try_files $uri $uri/ /index.html;

        # Security for HTML files
        location ~* \.html$ {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
    }

    # Admin route specific
    location /admin {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
```

### 2. Ativar Site

```bash
sudo ln -s /etc/nginx/sites-available/admin.altclinic.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 **CONFIGURAÇÃO SSL**

### 1. Instalar Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Obter Certificado SSL

```bash
sudo certbot --nginx -d admin.altclinic.com
```

### 3. Auto-renovação

```bash
sudo crontab -e
# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 **MONITORAMENTO E LOGS**

### 1. Configuração de Logs

```bash
# Criar arquivos de log
sudo touch /var/lib/altclinic/logs/{backend-access.log,backend-error.log,nginx-access.log,nginx-error.log}
sudo chown $USER:$USER /var/lib/altclinic/logs/*
```

### 2. Logrotate

```bash
sudo nano /etc/logrotate.d/altclinic-admin
```

**Configuração Logrotate:**

```
/var/lib/altclinic/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reload altclinic-admin-backend
    endscript
}
```

### 3. Monitoramento com PM2

```bash
# Status dos processos
pm2 status

# Logs em tempo real
pm2 logs altclinic-admin-backend

# Monitoramento de recursos
pm2 monit
```

---

## 🔄 **BACKUP AUTOMATIZADO**

### 1. Script de Backup

```bash
sudo nano /usr/local/bin/altclinic-backup.sh
```

**Script de Backup:**

```bash
#!/bin/bash

# Configurações
BACKUP_DIR="/var/lib/altclinic/backups"
DB_PATH="/var/lib/altclinic/database"
APP_PATH="/var/www/altclinic-admin"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

# Backup do banco de dados
echo "Backing up database..."
cp "$DB_PATH/admin.sqlite" "$BACKUP_DIR/admin_$DATE.sqlite"

# Backup das configurações
echo "Backing up configurations..."
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" \
    "$APP_PATH/backend/.env" \
    "$APP_PATH/backend/ecosystem.config.js" \
    "/etc/nginx/sites-available/admin.altclinic.com"

# Backup dos logs importantes
echo "Backing up logs..."
tar -czf "$BACKUP_DIR/logs_$DATE.tar.gz" \
    "/var/lib/altclinic/logs" --exclude="*.gz"

# Limpeza de backups antigos
echo "Cleaning old backups..."
find "$BACKUP_DIR" -name "*.sqlite" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Verificar espaço em disco
DISK_USAGE=$(df "$BACKUP_DIR" | awk 'NR==2{printf "%.1f", $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "WARNING: Disk usage is above 80%"
fi

echo "Backup completed: $DATE"
```

### 2. Permissões e Cron

```bash
sudo chmod +x /usr/local/bin/altclinic-backup.sh

# Configurar cron para backup diário às 2h
sudo crontab -e
# Adicionar:
0 2 * * * /usr/local/bin/altclinic-backup.sh >> /var/lib/altclinic/logs/backup.log 2>&1
```

---

## 🚨 **MONITORAMENTO E ALERTAS**

### 1. Health Check Script

```bash
sudo nano /usr/local/bin/altclinic-health.sh
```

**Health Check Script:**

```bash
#!/bin/bash

# Configurações
API_URL="https://admin.altclinic.com/api/admin/health"
EMAIL="admin@altclinic.com"
LOG_FILE="/var/lib/altclinic/logs/health.log"

# Função para enviar alerta
send_alert() {
    echo "$(date): $1" >> "$LOG_FILE"
    echo "$1" | mail -s "Altclinic Admin Alert" "$EMAIL"
}

# Verificar API
if ! curl -f -s "$API_URL" > /dev/null; then
    send_alert "API is down or unreachable"
fi

# Verificar PM2
if ! pm2 describe altclinic-admin-backend > /dev/null 2>&1; then
    send_alert "PM2 process is not running"
fi

# Verificar espaço em disco
DISK_USAGE=$(df / | awk 'NR==2{printf "%.0f", $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    send_alert "Disk usage is critical: ${DISK_USAGE}%"
fi

# Verificar memória
MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEM_USAGE" -gt 90 ]; then
    send_alert "Memory usage is critical: ${MEM_USAGE}%"
fi
```

### 2. Configurar Monitoramento

```bash
sudo chmod +x /usr/local/bin/altclinic-health.sh

# Health check a cada 5 minutos
sudo crontab -e
# Adicionar:
*/5 * * * * /usr/local/bin/altclinic-health.sh
```

---

## 🔧 **MANUTENÇÃO E ATUALIZAÇÕES**

### 1. Script de Atualização

```bash
sudo nano /usr/local/bin/altclinic-update.sh
```

**Update Script:**

```bash
#!/bin/bash

APP_DIR="/var/www/altclinic-admin"
BACKUP_DIR="/var/lib/altclinic/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup antes da atualização
echo "Creating backup before update..."
/usr/local/bin/altclinic-backup.sh

# Parar aplicação
echo "Stopping application..."
pm2 stop altclinic-admin-backend

# Atualizar código
echo "Updating code..."
cd "$APP_DIR"
git pull origin main

# Atualizar dependências
echo "Updating dependencies..."
cd "$APP_DIR/backend"
npm ci --production

# Executar migrações se necessário
echo "Running migrations..."
npm run migrate

# Reiniciar aplicação
echo "Starting application..."
pm2 start altclinic-admin-backend

echo "Update completed: $DATE"
```

### 2. Zero Downtime Deploy

```bash
# Para deploys sem downtime
pm2 reload altclinic-admin-backend
```

---

## 📈 **OTIMIZAÇÃO DE PERFORMANCE**

### 1. Configuração do Node.js

```javascript
// No ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "altclinic-admin-backend",
      script: "server.js",
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "1G",
      node_args: "--max_old_space_size=1024",

      // Environment
      env: {
        NODE_ENV: "production",
        UV_THREADPOOL_SIZE: 16,
      },
    },
  ],
};
```

### 2. Otimização do SQLite

```bash
# No backend/database/database.js adicionar:
pragma journal_mode = WAL;
pragma synchronous = normal;
pragma cache_size = 1000000;
pragma foreign_keys = true;
pragma temp_store = memory;
```

---

## ✅ **CHECKLIST DE DEPLOY**

### Pré-Deploy

- [ ] Servidor configurado com Node.js, PM2, Nginx
- [ ] Domínio apontando para o servidor
- [ ] Certificado SSL configurado
- [ ] Firewall configurado

### Deploy Backend

- [ ] Código do backend enviado
- [ ] Dependências instaladas
- [ ] Arquivo .env configurado com chaves de produção
- [ ] Banco de dados inicializado
- [ ] PM2 configurado e rodando

### Deploy Frontend

- [ ] Build gerado em produção
- [ ] Arquivos enviados para servidor
- [ ] Nginx configurado
- [ ] Routing funcionando

### Pós-Deploy

- [ ] API respondendo corretamente
- [ ] Frontend carregando
- [ ] Login funcionando
- [ ] SSL funcionando
- [ ] Backups configurados
- [ ] Monitoramento ativo
- [ ] Logs configurados

### Testes de Produção

- [ ] Login com credenciais padrão
- [ ] Alteração de senha
- [ ] CRUD de licenças
- [ ] Configurações por licença
- [ ] Relatórios gerando
- [ ] WhatsApp QR code
- [ ] Performance aceitável

---

## 🆘 **TROUBLESHOOTING DE PRODUÇÃO**

### Problemas Comuns

**1. API não responde**

```bash
# Verificar status PM2
pm2 status

# Verificar logs
pm2 logs altclinic-admin-backend --lines 50

# Reiniciar se necessário
pm2 restart altclinic-admin-backend
```

**2. Nginx 502 Bad Gateway**

```bash
# Verificar backend
curl http://localhost:3001/api/admin/health

# Verificar configuração Nginx
sudo nginx -t

# Verificar logs Nginx
sudo tail -f /var/log/nginx/error.log
```

**3. SSL não funcionando**

```bash
# Verificar certificado
sudo certbot certificates

# Renovar se necessário
sudo certbot renew

# Testar configuração SSL
openssl s_client -connect admin.altclinic.com:443
```

**4. Banco de dados corrompido**

```bash
# Verificar integridade
sqlite3 /var/lib/altclinic/database/admin.sqlite "PRAGMA integrity_check;"

# Restaurar backup se necessário
cp /var/lib/altclinic/backups/admin_YYYYMMDD_HHMMSS.sqlite \
   /var/lib/altclinic/database/admin.sqlite
```

---

## 📞 **SUPORTE PÓS-DEPLOY**

### Contatos de Emergência

- **Técnico**: dev@altclinic.com
- **DevOps**: ops@altclinic.com
- **Emergência**: +55 11 99999-9999

### Documentação de Referência

- Logs: `/var/lib/altclinic/logs/`
- Configurações: `/var/www/altclinic-admin/backend/.env`
- Nginx: `/etc/nginx/sites-available/admin.altclinic.com`
- PM2: `pm2 show altclinic-admin-backend`

---

_Guia de Deploy - Intranet Altclinic v1.0_  
_Última atualização: 02/09/2025_
