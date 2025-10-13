# 📋 DOCUMENTAÇÃO COMPLETA DA INFRAESTRUTURA - SAEE

## 🎯 **VISÃO GERAL DO SISTEMA**

O SAEE é um sistema completo de agendamento automatizado para clínicas estéticas com arquitetura multitenant, desenvolvido em Node.js + React.

---

## 🏗️ **ARQUITETURA GERAL**

### **Stack Tecnológica**

- **Backend**: Node.js + Express.js
- **Frontend**: React.js + Material-UI
- **Banco de Dados**: SQLite (better-sqlite3) com suporte multitenant
- **Autenticação**: JWT + sistema de tenants
- **Deploy**: Suporte para Railway, Vercel, Render
- **Containerização**: Docker (opcional)

### **Estrutura de Pastas**

```
saee/
├── src/                    # Backend Node.js
│   ├── app.js             # Aplicação principal
│   ├── routes/            # Endpoints da API
│   ├── models/            # Modelos de dados
│   ├── middleware/        # Middlewares (auth, tenant, etc.)
│   ├── utils/             # Utilitários
│   └── integrations/      # Integrações externas
├── frontend/              # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas principais
│   │   ├── components/    # Componentes reutilizáveis
│   │   └── services/      # Serviços API
├── admin/                 # Painel administrativo
└── public/               # Arquivos estáticos
```

---

## 🗄️ **BANCO DE DADOS**

### **Arquitetura Multitenant**

- **Banco Master**: `saee.db` (configurações globais, tenants)
- **Bancos Tenant**: `tenant_{slug}.db` (dados específicos de cada clínica)

### **Tabelas Principais (Master)**

```sql
-- Tabela de tenants/clínicas
tenants (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  plano TEXT,
  status TEXT,
  trial_expire_at TEXT,
  database_name TEXT NOT NULL,
  created_at DATETIME,
  updated_at DATETIME
)

-- Tabela de agendamentos da AgendaLite (Nova)
agenda_agendamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  horario TEXT NOT NULL,        -- Formato: HH:MM
  data TEXT NOT NULL,           -- Formato: YYYY-MM-DD
  paciente TEXT NOT NULL,
  procedimento TEXT,
  status TEXT DEFAULT 'não confirmado',
  valor REAL DEFAULT 0,
  observacoes TEXT,
  created_at DATETIME,
  updated_at DATETIME
)
```

### **Tabelas por Tenant**

- `paciente` - Dados dos pacientes
- `procedimento` - Procedimentos oferecidos
- `agendamento` - Sistema de agendamento completo
- `prontuario` - Prontuários médicos
- `conta_receber` - Financeiro
- `proposta` - Propostas comerciais

---

## 🌐 **SERVIDOR BACKEND**

### **Inicialização**

```bash
# Desenvolvimento
npm run dev              # Nodemon com hot reload
npm start               # Produção

# Configuração
npm run setup           # Setup inicial
npm run build          # Build completo (backend + frontend)
```

### **Variáveis de Ambiente**

```env
# Banco de dados
DB_PATH=./saee.db
NODE_ENV=development

# APIs externas (opcionais)
GEMINI_API_KEY=
HUGGINGFACE_API_KEY=
CLAUDE_API_KEY=
SMTP_HOST=
SMTP_USER=
SMTP_PASS=

# Integrações WhatsApp
ZAPI_TOKEN=
EVOLUTION_API_URL=
MANYCHAT_API_KEY=
```

### **Endpoints Principais**

```
# Autenticação
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout

# Agendamentos (Nova API)
GET    /api/agenda/agendamentos    # Listar agendamentos
POST   /api/agenda/agendamentos    # Criar agendamento
PUT    /api/agenda/agendamentos/:id # Atualizar agendamento
DELETE /api/agenda/agendamentos/:id # Deletar agendamento

# Sistema completo
GET  /api/pacientes
POST /api/pacientes
GET  /api/agendamentos             # Sistema original
GET  /api/prontuarios
GET  /api/financeiro

# Administrativo
GET  /api/tenants
POST /api/tenants
GET  /api/admin/licencas
```

### **Middleware de Tenant**

```javascript
// Headers aceitos para identificar tenant:
X-Tenant-Slug: nome-da-clinica
// ou via JWT token
Authorization: Bearer <token-com-tenantId>
// ou via parâmetro
?tenant=nome-da-clinica
```

---

## 🖥️ **FRONTEND REACT**

### **Inicialização**

```bash
cd frontend/
npm start               # Desenvolvimento (porta 3001)
npm run build          # Build para produção
```

### **Páginas Principais**

- `/login` - Autenticação
- `/agenda` - AgendaLite (sistema de agendamento visual)
- `/pacientes` - Gestão de pacientes
- `/financeiro` - Dashboard financeiro
- `/prontuarios` - Prontuários eletrônicos
- `/configuracoes` - Configurações da clínica

### **Serviços API**

```javascript
// Novo serviço para AgendaLite
agendamentoService.buscarAgendamentosLite();
agendamentoService.criarAgendamentoLite();
agendamentoService.atualizarAgendamentoLite();
agendamentoService.deletarAgendamentoLite();
agendamentoService.migrarLocalStorageParaBanco();
```

### **Persistência de Dados**

- **Principal**: API REST com banco SQLite
- **Fallback**: localStorage (desenvolvimento/offline)
- **Migração**: Automática localStorage → banco na primeira execução

---

## 🚀 **DEPLOY E INFRAESTRUTURA**

### **Portas e Serviços**

```
Backend API:  http://localhost:3000
Frontend:     http://localhost:3001
Health Check: http://localhost:3000/health
Status API:   http://localhost:3000/api/status
```

### **Docker (Opcional)**

```yaml
# docker-compose.yml
services:
  altclinic-app:
    ports: ["3000:3000"]
    environment:
      - NODE_ENV=production
      - DB_PATH=/app/data/saee.db
    volumes:
      - altclinic-data:/app/data
```

### **Deploy Railway/Render**

```bash
# Build automatizado
npm run build           # Frontend + Backend
npm run build:linux     # Para ambientes Linux

# Scripts de deploy
./deploy.sh             # Deploy geral
./deploy-render.ps1     # Deploy específico Render
```

---

## 🔧 **OPERAÇÕES E MANUTENÇÃO**

### **Scripts Utilitários**

```bash
# Verificação do banco
node check-db.js
node check-tenants.js
node check-agendamentos-hoje.js

# Migração e setup
node create-tenant.js
node fix-trial-tenants.js
node migrate-schedules.js

# Testes
node test-agenda-api.js
node test-apis.js
```

### **Logs e Monitoramento**

- Logs em console com timestamps
- Health check endpoint
- Status detalhado da aplicação
- Cron jobs para tarefas automatizadas

### **Backup de Dados**

```bash
# Backup automático dos bancos SQLite
cp saee.db backup/saee-$(date +%Y%m%d).db
cp tenant_*.db backup/
```

---

## ⚠️ **TROUBLESHOOTING COMUM**

### **Problemas de Banco**

```javascript
// Erro: "no such table"
// Solução: Executar migration
node create-agenda-table.js

// Erro: "tenant not found"
// Solução: Verificar headers de tenant
X-Tenant-Slug: nome-correto
```

### **Problemas de API**

```bash
# Servidor não encontra rotas
# Solução: Reiniciar backend após mudanças
npm run dev

# CORS errors
# Solução: Verificar configuração no app.js
```

### **Problemas de Frontend**

```bash
# Módulos não encontrados
cd frontend/ && npm install

# Build errors
npm run build
```

---

## 🔐 **SEGURANÇA**

### **Autenticação**

- JWT tokens com tenantId
- Middleware de validação por rota
- Expiração automática de trial

### **Isolamento de Dados**

- Bancos separados por tenant
- Validação de acesso por middleware
- Logs de acesso por tenant

---

## 📊 **MONITORAMENTO**

### **Endpoints de Status**

```
GET /health             # Status geral
GET /api/status         # Status detalhado
GET /api/tenants        # Lista de tenants ativos
```

### **Métricas**

- Número de agendamentos por dia
- Tenants ativos/inativos
- Performance do banco
- Uso de APIs externas

---

## 🎯 **PRÓXIMOS PASSOS**

### **Melhorias Implementadas**

- ✅ Persistência de agendamentos no banco
- ✅ API REST para AgendaLite
- ✅ Migração automática localStorage → banco
- ✅ Sistema de fallback para offline

### **Melhorias Futuras**

- [ ] Relatórios avançados
- [ ] Integração com calendários externos
- [ ] Notificações push
- [ ] Dashboard analytics em tempo real

---

_Documentação atualizada em: 10/10/2025_
_Versão do sistema: 1.0.0_
_Última implementação: Sistema de persistência AgendaLite_
