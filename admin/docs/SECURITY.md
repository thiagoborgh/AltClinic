# 🛡️ Guia de Segurança - Intranet Altclinic

## 🎯 **VISÃO GERAL DE SEGURANÇA**

A Intranet Altclinic implementa múltiplas camadas de segurança para proteger dados sensíveis de clientes e operações administrativas. Este guia detalha todas as medidas de segurança implementadas e melhores práticas.

---

## 🔐 **AUTENTICAÇÃO E AUTORIZAÇÃO**

### Sistema de Autenticação
- **JWT (JSON Web Tokens)** com expiração de 24 horas
- **bcrypt** para hash de senhas (rounds: 12)
- **Refresh tokens** não implementados (segurança adicional)
- **Logout** invalida tokens no servidor

### Níveis de Acesso
```javascript
const roles = {
  'super_admin': {
    permissions: ['*'], // Acesso total
    description: 'Acesso completo, pode sincronizar dados'
  },
  'admin': {
    permissions: [
      'licencas:read', 'licencas:write',
      'configuracoes:read', 'configuracoes:write',
      'relatorios:read', 'whatsapp:manage'
    ],
    description: 'Acesso completo exceto operações críticas'
  },
  'viewer': {
    permissions: [
      'licencas:read', 'configuracoes:read', 'relatorios:read'
    ],
    description: 'Apenas visualização (futuro)'
  }
};
```

### Validação de Senhas
```javascript
const passwordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true
};
```

---

## 🛡️ **PROTEÇÕES DE REDE**

### Rate Limiting
```nginx
# Configurações Nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Rate limits específicos
location /api/admin/auth/login {
    limit_req zone=login burst=3 nodelay;
}

location /api/admin/ {
    limit_req zone=api burst=10 nodelay;
}
```

### Headers de Segurança
```nginx
# Headers obrigatórios em produção
add_header Strict-Transport-Security "max-age=63072000" always;
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:";
```

### Firewall (UFW)
```bash
# Configuração básica
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Bloqueios específicos
sudo ufw deny 3001  # Backend direto
sudo ufw deny 3000  # Frontend dev
```

---

## 🔒 **CRIPTOGRAFIA E DADOS SENSÍVEIS**

### Criptografia de Dados
```javascript
// Exemplo de criptografia para dados sensíveis
const crypto = require('crypto');

class DataEncryption {
  static encrypt(text, key) {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  static decrypt(encryptedData, key) {
    const algorithm = 'aes-256-gcm';
    const decipher = crypto.createDecipher(algorithm, key);
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### Mascaramento de Dados
```javascript
// Mascaramento de campos sensíveis na API
const maskSensitiveData = (config) => {
  const sensitiveFields = ['password', 'api_key', 'token', 'secret'];
  
  const masked = { ...config };
  
  Object.keys(masked).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      const value = masked[key];
      if (typeof value === 'string' && value.length > 4) {
        masked[key] = value.substring(0, 4) + '*'.repeat(value.length - 4);
      }
    }
  });
  
  return masked;
};
```

---

## 🗄️ **SEGURANÇA DO BANCO DE DADOS**

### Configurações SQLite Seguras
```sql
-- Configurações de segurança no banco
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA secure_delete = ON;
PRAGMA auto_vacuum = FULL;

-- Criação de usuário com permissões limitadas
-- (SQLite não tem usuários, mas implementamos no app)
```

### Backup Seguro
```bash
#!/bin/bash
# Script de backup com criptografia

BACKUP_DIR="/var/lib/altclinic/backups"
DB_PATH="/var/lib/altclinic/database/admin.sqlite"
DATE=$(date +%Y%m%d_%H%M%S)
GPG_RECIPIENT="admin@altclinic.com"

# Backup com criptografia GPG
sqlite3 "$DB_PATH" ".backup /tmp/admin_temp.sqlite"
gpg --trust-model always --encrypt -r "$GPG_RECIPIENT" \
    --output "$BACKUP_DIR/admin_$DATE.sqlite.gpg" \
    "/tmp/admin_temp.sqlite"

# Limpar arquivo temporário
shred -vfz -n 3 /tmp/admin_temp.sqlite
```

### Auditoria Completa
```sql
-- Tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS admin_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    resource TEXT,
    resource_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES admin_users(id)
);

-- Índices para performance
CREATE INDEX idx_admin_logs_user_id ON admin_logs(user_id);
CREATE INDEX idx_admin_logs_action ON admin_logs(action);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at);
```

---

## 🔍 **MONITORAMENTO E DETECÇÃO**

### Log Security Events
```javascript
// Sistema de logs de segurança
class SecurityLogger {
  static logSecurityEvent(type, details, req) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: type,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      user: req.user?.email || 'anonymous',
      details: details,
      severity: this.getSeverity(type)
    };
    
    // Log para arquivo específico de segurança
    console.log('SECURITY:', JSON.stringify(logEntry));
    
    // Alertas para eventos críticos
    if (logEntry.severity === 'critical') {
      this.sendSecurityAlert(logEntry);
    }
  }
  
  static getSeverity(type) {
    const severityMap = {
      'failed_login': 'medium',
      'suspicious_activity': 'high',
      'privilege_escalation': 'critical',
      'data_breach_attempt': 'critical',
      'unauthorized_access': 'high'
    };
    
    return severityMap[type] || 'low';
  }
}
```

### Detecção de Intrusão
```javascript
// Middleware para detecção de atividades suspeitas
const suspiciousActivityDetector = (req, res, next) => {
  const ip = req.ip;
  const userAgent = req.headers['user-agent'];
  
  // Detectar múltiplas tentativas de login
  if (req.path === '/auth/login' && req.method === 'POST') {
    const attempts = getLoginAttempts(ip);
    if (attempts > 5) {
      SecurityLogger.logSecurityEvent('suspicious_login_attempts', {
        attempts: attempts,
        timeWindow: '15 minutes'
      }, req);
      
      return res.status(429).json({
        success: false,
        error: 'Too many login attempts. Please try again later.'
      });
    }
  }
  
  // Detectar User-Agents suspeitos
  const suspiciousAgents = ['sqlmap', 'nikto', 'nessus', 'burp'];
  if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    SecurityLogger.logSecurityEvent('suspicious_user_agent', {
      userAgent: userAgent
    }, req);
    
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }
  
  next();
};
```

---

## 🚨 **RESPOSTA A INCIDENTES**

### Procedimentos de Emergência

#### 1. Suspeita de Comprometimento
```bash
# Script de emergência
#!/bin/bash
# /usr/local/bin/emergency-lockdown.sh

echo "EMERGENCY LOCKDOWN ACTIVATED"

# Parar aplicação
pm2 stop altclinic-admin-backend

# Bloquear tráfego suspeito
sudo ufw insert 1 deny from [IP_SUSPEITO]

# Fazer backup de emergência
/usr/local/bin/altclinic-backup.sh emergency

# Notificar equipe
echo "Emergency lockdown at $(date)" | mail -s "SECURITY ALERT" admin@altclinic.com

# Log da ação
echo "$(date): Emergency lockdown executed" >> /var/lib/altclinic/logs/security.log
```

#### 2. Rotação de Chaves de Emergência
```javascript
// Script para rotação de JWT secret
const rotateJWTSecret = async () => {
  const newSecret = crypto.randomBytes(64).toString('hex');
  
  // Atualizar .env
  const envPath = '/var/www/altclinic-admin/backend/.env';
  const envContent = fs.readFileSync(envPath, 'utf8');
  const newContent = envContent.replace(
    /JWT_SECRET=.*/,
    `JWT_SECRET=${newSecret}`
  );
  
  fs.writeFileSync(envPath, newContent);
  
  // Reiniciar aplicação
  exec('pm2 restart altclinic-admin-backend');
  
  console.log('JWT Secret rotated successfully');
};
```

### Plano de Resposta a Incidentes

#### Fase 1: Detecção (0-15 minutos)
1. **Alertas automáticos** disparam
2. **Análise inicial** dos logs
3. **Classificação** do incidente
4. **Notificação** da equipe

#### Fase 2: Contenção (15-60 minutos)
1. **Isolamento** do sistema afetado
2. **Backup de emergência**
3. **Bloqueio** de IPs maliciosos
4. **Preservação** de evidências

#### Fase 3: Erradicação (1-4 horas)
1. **Identificação** da vulnerabilidade
2. **Aplicação** de patches
3. **Remoção** de malware/intrusos
4. **Fortalecimento** das defesas

#### Fase 4: Recuperação (4-24 horas)
1. **Restauração** dos serviços
2. **Monitoramento** intensivo
3. **Validação** da segurança
4. **Comunicação** com clientes

#### Fase 5: Lições Aprendidas (1-7 dias)
1. **Análise** pós-incidente
2. **Documentação** das lições
3. **Melhoria** dos processos
4. **Treinamento** da equipe

---

## 📋 **COMPLIANCE E CONFORMIDADE**

### LGPD (Lei Geral de Proteção de Dados)

#### Tratamento de Dados Pessoais
```javascript
// Implementação de consentimento LGPD
const lgpdConsent = {
  purposes: [
    'administracao_sistema',
    'suporte_tecnico',
    'melhorias_produto'
  ],
  
  lawfulBases: [
    'legitimate_interest',
    'contract_execution',
    'legal_obligation'
  ],
  
  dataRetention: {
    logs: '2 years',
    configurations: 'while license active',
    user_data: 'while account active'
  }
};
```

#### Direitos dos Titulares
```javascript
// Implementação dos direitos LGPD
class LGPDRights {
  // Direito de acesso
  static async exportUserData(licencaId) {
    const data = await db.getUserData(licencaId);
    return {
      personal_data: data.personal,
      configurations: data.configs,
      logs: data.logs.filter(log => 
        Date.now() - new Date(log.created_at) < 2 * 365 * 24 * 60 * 60 * 1000
      )
    };
  }
  
  // Direito de retificação
  static async updateUserData(licencaId, updates) {
    await db.updateLicense(licencaId, updates);
    await this.logDataChange(licencaId, 'retification', updates);
  }
  
  // Direito de exclusão
  static async deleteUserData(licencaId) {
    await db.deleteLicense(licencaId);
    await db.anonymizeLogs(licencaId);
    await this.logDataChange(licencaId, 'deletion');
  }
}
```

---

## 🔧 **CONFIGURAÇÕES DE SEGURANÇA**

### Configuração de Produção (.env)
```env
# Segurança
NODE_ENV=production
JWT_SECRET=sua-chave-super-secreta-produção-256-bits
SESSION_SECRET=outra-chave-secreta-para-sessoes

# Rate Limiting
RATE_LIMIT_WINDOW=15 # minutos
RATE_LIMIT_MAX=100   # requests por window
LOGIN_RATE_LIMIT_MAX=5

# Logs de Segurança
SECURITY_LOG_LEVEL=info
SECURITY_LOG_PATH=/var/lib/altclinic/logs/security.log

# CORS
ALLOWED_ORIGINS=https://admin.altclinic.com
CREDENTIALS=true

# Headers de Segurança
ENABLE_HSTS=true
ENABLE_CSP=true
ENABLE_NOSNIFF=true

# Criptografia
ENCRYPTION_KEY=chave-para-dados-sensíveis-256-bits
```

### Middleware de Segurança
```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

// Configuração de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Sanitização
app.use(mongoSanitize());
```

---

## 🧪 **TESTES DE SEGURANÇA**

### Checklist de Testes
```bash
# 1. Teste de autenticação
curl -X POST http://localhost:3001/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","password":"invalid"}'

# 2. Teste de autorização
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:3001/api/admin/licencas

# 3. Teste de rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/admin/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@altclinic.com","password":"wrong"}'
done

# 4. Teste de SQL injection
curl -X GET "http://localhost:3001/api/admin/licencas?search='; DROP TABLE licencas; --"

# 5. Teste de XSS
curl -X PUT http://localhost:3001/api/admin/licencas/1 \
  -H "Content-Type: application/json" \
  -d '{"nome_clinica":"<script>alert(\"xss\")</script>"}'
```

### Ferramentas de Teste
```bash
# OWASP ZAP
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://admin.altclinic.com

# SSL Labs Test
curl -s "https://api.ssllabs.com/api/v3/analyze?host=admin.altclinic.com"

# Security Headers
curl -I https://admin.altclinic.com

# Nmap scan
nmap -sV -sC admin.altclinic.com
```

---

## 📊 **MÉTRICAS DE SEGURANÇA**

### KPIs de Segurança
```javascript
const securityMetrics = {
  // Autenticação
  failed_logins_per_day: 0,
  successful_logins_per_day: 0,
  blocked_ips_count: 0,
  
  // Atividade suspeita
  suspicious_requests_per_day: 0,
  blocked_requests_per_day: 0,
  
  // Sistema
  security_patches_applied: 0,
  vulnerabilities_found: 0,
  vulnerabilities_fixed: 0,
  
  // Compliance
  data_requests_lgpd: 0,
  data_deletions_lgpd: 0,
  consent_updates: 0
};
```

### Dashboard de Segurança
```javascript
// Endpoint para métricas de segurança
app.get('/api/admin/security/metrics', authenticateToken, async (req, res) => {
  try {
    const metrics = await SecurityMetrics.getDaily();
    
    res.json({
      success: true,
      data: {
        authentication: {
          failed_logins: metrics.failed_logins,
          successful_logins: metrics.successful_logins,
          blocked_ips: metrics.blocked_ips
        },
        threats: {
          blocked_requests: metrics.blocked_requests,
          suspicious_activity: metrics.suspicious_activity
        },
        compliance: {
          lgpd_requests: metrics.lgpd_requests,
          data_retention_compliance: metrics.retention_compliance
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security metrics'
    });
  }
});
```

---

## 📚 **RECURSOS E REFERÊNCIAS**

### Standards e Frameworks
- **OWASP Top 10** - Vulnerabilidades web mais críticas
- **NIST Cybersecurity Framework** - Framework de cibersegurança
- **ISO 27001** - Gestão de segurança da informação
- **LGPD** - Lei Geral de Proteção de Dados

### Ferramentas Recomendadas
- **OWASP ZAP** - Teste de segurança
- **Burp Suite** - Teste de penetração
- **SSL Labs** - Teste de SSL/TLS
- **Security Headers** - Análise de headers

### Treinamento da Equipe
- Phishing awareness
- Secure coding practices
- Incident response procedures
- LGPD compliance

---

## ✅ **CHECKLIST DE SEGURANÇA**

### Configuração Inicial
- [ ] JWT secret forte configurado
- [ ] Senhas padrão alteradas
- [ ] Headers de segurança configurados
- [ ] Rate limiting ativo
- [ ] Firewall configurado

### Monitoramento
- [ ] Logs de segurança ativos
- [ ] Alertas configurados
- [ ] Backup automático funcionando
- [ ] Detecção de intrusão ativa

### Compliance
- [ ] Política de privacidade implementada
- [ ] Consentimento LGPD coletado
- [ ] Retenção de dados configurada
- [ ] Procedimentos de exclusão implementados

### Testes
- [ ] Testes de penetração realizados
- [ ] Vulnerabilidades corrigidas
- [ ] SSL/TLS validado
- [ ] Logs de auditoria verificados

---

*Guia de Segurança - Intranet Altclinic v1.0*  
*Última atualização: 02/09/2025*
