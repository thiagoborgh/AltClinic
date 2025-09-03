# 🏢 Intranet Altclinic - Documentação Completa

## 🎯 Visão Geral

A **Intranet Altclinic** é um sistema exclusivo para gerenciamento interno de licenças e configurações de clientes. Permite à equipe Altclinic administrar centralmente todas as instalações do sistema em diferentes clínicas.

---

## 🏗️ **ARQUITETURA DO SISTEMA**

### 📁 Estrutura de Diretórios

```
admin/
├── frontend/           # React.js Application
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas principais
│   │   ├── contexts/      # Context API (Auth)
│   │   └── index.js       # Entry point
│   ├── public/
│   └── package.json
├── backend/            # Node.js API
│   ├── routes/           # Rotas da API
│   ├── database/         # Sistema de banco
│   ├── server.js         # Servidor principal
│   └── package.json
└── docs/              # Documentação
```

### 🔧 Stack Tecnológica

**Frontend:**

- React 18.2.0
- Material-UI 5.14.17
- React Router DOM 6.8.0
- Axios para HTTP requests
- Recharts para gráficos

**Backend:**

- Node.js + Express.js
- SQLite3 com better-sqlite3
- JWT para autenticação
- bcrypt para senhas
- Rate limiting e segurança

---

## 🚀 **INSTALAÇÃO E CONFIGURAÇÃO**

### 1️⃣ Backend Setup

```bash
cd admin/backend
npm install
```

**Configurar .env:**

```env
PORT=3001
NODE_ENV=development
ADMIN_DB_PATH=./database/admin.sqlite
JWT_SECRET=sua-chave-super-secreta-admin-altclinic-2025
MAIN_DB_PATH=../src/database/database.sqlite
```

**Iniciar servidor:**

```bash
npm run dev
```

### 2️⃣ Frontend Setup

```bash
cd admin/frontend
npm install
npm start
```

### 3️⃣ Acesso Inicial

**URL:** http://localhost:3000/admin  
**Login padrão:**

- Email: `admin@altclinic.com`
- Senha: `Admin123!`

⚠️ **ALTERAR SENHA APÓS PRIMEIRO LOGIN**

---

## 🔐 **SISTEMA DE AUTENTICAÇÃO**

### Usuários Admin

- **Super Admin**: Acesso total, pode sincronizar dados
- **Admin**: Acesso completo exceto operações críticas
- **Viewer**: Apenas visualização (futuro)

### Segurança

- JWT tokens com expiração de 24h
- Rate limiting: 100 requests/15min por IP
- Logs de todas as ações
- Senhas com hash bcrypt

---

## 📊 **FUNCIONALIDADES PRINCIPAIS**

### 🏠 **Dashboard**

- **Estatísticas em tempo real**

  - Total de licenças
  - Licenças ativas/vencendo/vencidas
  - Faturamento mensal
  - Crescimento percentual

- **Gráficos interativos**

  - Status das licenças (Pie Chart)
  - Faturamento mensal (Bar Chart)
  - Crescimento temporal (Line Chart)

- **Alertas automáticos**
  - Licenças vencendo em 30 dias
  - Licenças vencidas
  - Problemas de sistema

### 🏢 **Gerenciamento de Licenças**

- **CRUD completo de licenças**

  - Criar, editar, visualizar, suspender
  - Filtros por status, busca por nome/email
  - Paginação e ordenação

- **Informações por licença**

  - Dados do cliente
  - Plano contratado
  - Datas de início/vencimento
  - Status atual
  - Observações

- **Sincronização automática**
  - Importa dados do sistema principal
  - Mantém cache local para performance

### ⚙️ **Configurações por Licença**

- **Gerenciamento centralizado** de todas as configurações
- **Organização por abas:**

  1. **IA & Automação**: Claude, Gemini, Hugging Face
  2. **Comunicação**: SMTP, Telegram, Mailchimp
  3. **WhatsApp**: QR Code, API, webhooks
  4. **Financeiro**: PIX, dados bancários
  5. **Sistema**: Logs, debug, crons
  6. **LGPD**: Termos de consentimento

- **Recursos avançados:**
  - Campos sensíveis mascarados
  - Backup de configurações
  - Histórico de alterações
  - Validação de dados

### 📱 **Integração WhatsApp**

- **QR Code generation** para conectar WhatsApp
- **Status monitoring** em tempo real
- **Mensagens de teste**
- **Logs de atividade**
- **Desconexão remota**
- **Monitoramento global** de todas as sessões

### 📈 **Relatórios e Analytics**

- **Tipos de relatório:**

  - Geral: Visão completa do sistema
  - Financeiro: Faturamento e métricas
  - Licenças: Distribuição e crescimento
  - Suporte: Tickets e satisfação

- **Filtros avançados:**

  - Período personalizado
  - Tipo de relatório
  - Formato de exportação

- **Visualizações:**
  - Gráficos interativos
  - Tabelas detalhadas
  - KPIs principais
  - Alertas contextuais

---

## 🔌 **API ENDPOINTS**

### 🔐 Autenticação

```
POST /api/admin/auth/login
GET  /api/admin/auth/me
POST /api/admin/auth/logout
POST /api/admin/auth/change-password
```

### 🏢 Licenças

```
GET    /api/admin/licencas
GET    /api/admin/licencas/:id
POST   /api/admin/licencas
PUT    /api/admin/licencas/:id
DELETE /api/admin/licencas/:id
POST   /api/admin/licencas/sync
```

### ⚙️ Configurações

```
GET /api/admin/configuracoes/:licencaId
PUT /api/admin/configuracoes/:licencaId
GET /api/admin/configuracoes/:licencaId/sections
GET /api/admin/configuracoes/:licencaId/backup
```

### 📊 Dashboard

```
GET /api/admin/dashboard/stats
GET /api/admin/dashboard/recent-activity
GET /api/admin/dashboard/alerts
GET /api/admin/dashboard/revenue
GET /api/admin/dashboard/licenses-by-status
```

### 📈 Relatórios

```
GET  /api/admin/relatorios
POST /api/admin/relatorios/export
GET  /api/admin/relatorios/templates
```

### 📱 WhatsApp

```
POST /api/admin/whatsapp/:licencaId/qr
GET  /api/admin/whatsapp/:licencaId/status
POST /api/admin/whatsapp/:licencaId/disconnect
POST /api/admin/whatsapp/:licencaId/test-message
GET  /api/admin/whatsapp/:licencaId/logs
GET  /api/admin/whatsapp/global-status
```

---

## 💾 **BANCO DE DADOS**

### Tabelas Principais

**admin_users**

- Usuários da intranet
- Roles e permissões
- Logs de acesso

**licencas**

- Cache das licenças do sistema principal
- Informações comerciais
- Status e datas

**admin_logs**

- Log de todas as ações
- Auditoria completa
- Rastreamento de mudanças

**admin_settings**

- Configurações da intranet
- Parâmetros globais

### Sincronização

- **Readonly** no banco principal
- **Cache local** para performance
- **Sincronização manual** pelo super admin

---

## 🛡️ **SEGURANÇA E COMPLIANCE**

### Medidas de Segurança

- **HTTPS obrigatório** em produção
- **Rate limiting** por IP
- **JWT tokens** com expiração
- **Logs detalhados** de todas as ações
- **Validação rigorosa** de inputs

### Auditoria

- **Todas as ações** são logadas
- **IP e User-Agent** registrados
- **Histórico completo** de mudanças
- **Relatórios de acesso**

### Backup

- **Backup automático** do banco admin
- **Export de configurações** por licença
- **Restore point** antes de mudanças críticas

---

## 🔧 **DESENVOLVIMENTO E MANUTENÇÃO**

### Estrutura de Desenvolvimento

```bash
# Backend Development
cd admin/backend
npm run dev

# Frontend Development
cd admin/frontend
npm start

# Build Production
npm run build
```

### Logs e Debugging

- **Console logs** detalhados
- **Error tracking** completo
- **Performance monitoring**
- **Debug mode** configurável

### Extensibilidade

- **Modular architecture**
- **Plugin system** ready
- **API versioning**
- **Microservices** compatible

---

## 📈 **MONITORAMENTO E MÉTRICAS**

### KPIs Principais

- **Uptime** da intranet
- **Response time** da API
- **Uso por usuário**
- **Licenças gerenciadas**
- **Configurações alteradas**

### Alertas

- **Sistema offline**
- **Licenças críticas**
- **Erros de sincronização**
- **Falhas de autenticação**

---

## 🚀 **DEPLOY E PRODUÇÃO**

### Requisitos de Servidor

- **Node.js** 16+
- **SQLite3** support
- **2GB RAM** mínimo
- **SSD** recomendado

### Variáveis de Ambiente

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=sua-chave-producao-super-secreta
ADMIN_DB_PATH=/var/lib/altclinic/admin.sqlite
MAIN_DB_PATH=/var/lib/altclinic/main.sqlite
ALLOWED_ORIGINS=https://admin.altclinic.com
```

### Nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name admin.altclinic.com;

    location /api/admin/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /var/www/admin-frontend/build;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🆘 **SUPORTE E TROUBLESHOOTING**

### Problemas Comuns

**1. Erro de conexão com banco principal**

- Verificar path do arquivo SQLite
- Confirmar permissões de leitura
- Testar conectividade

**2. JWT tokens inválidos**

- Verificar JWT_SECRET
- Conferir expiração
- Limpar localStorage do browser

**3. Sincronização falhando**

- Verificar banco principal acessível
- Confirmar estrutura das tabelas
- Logs de erro no console

### Logs Úteis

```bash
# Logs do servidor
tail -f admin/backend/logs/app.log

# Logs do banco
sqlite3 admin/backend/database/admin.sqlite ".tables"

# Status da aplicação
curl http://localhost:3001/api/admin/health
```

### Contatos de Suporte

- **Técnico**: dev@altclinic.com
- **Comercial**: admin@altclinic.com
- **Emergência**: +55 11 99999-9999

---

## 📝 **CHANGELOG**

### v1.0.0 (Setembro 2025)

- ✅ Sistema completo de autenticação
- ✅ Gerenciamento de licenças
- ✅ Configurações por licença
- ✅ Dashboard com métricas
- ✅ Relatórios e analytics
- ✅ Integração WhatsApp
- ✅ Sistema de logs e auditoria
- ✅ API REST completa

---

## 🎯 **ROADMAP FUTURO**

### v1.1 (Próximas features)

- [ ] Notificações em tempo real
- [ ] Sistema de tickets interno
- [ ] Backup automático
- [ ] Multi-tenancy
- [ ] Mobile app

### v1.2 (Expansões)

- [ ] Integração com CRM externo
- [ ] Analytics avançados
- [ ] Machine Learning insights
- [ ] API pública para integrações

---

_Documentação da Intranet Altclinic v1.0_  
_Criada em: Setembro 2025_  
_Última atualização: 02/09/2025_
