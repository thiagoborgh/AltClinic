# 🏗️ Arquitetura do Sistema SaaS

## 📊 Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                         USUÁRIOS                             │
│  👤 Clínica A    👤 Clínica B    👤 Clínica C               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                         │
│  - Cadastro  - Login  - Agenda  - Configurações             │
│  - TailwindCSS  - React Router  - Axios                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓ HTTP/JSON
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js + Express)                 │
│  - Multi-tenant  - JWT Auth  - API REST                     │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ↓               ↓               ↓
    ┌───────────┐   ┌───────────┐   ┌──────────────┐
    │  SQLite   │   │    JWT    │   │   WhatsApp   │
    │  Database │   │   Token   │   │  Integration │
    └───────────┘   └───────────┘   └──────────────┘
```

---

## 🗄️ Modelo de Dados Multi-Tenant

```
┌─────────────────────────────────────────┐
│              TENANTS                     │
│  (Cada clínica = 1 tenant)              │
├─────────────────────────────────────────┤
│  id, nome, email, plano, status,        │
│  dataExpiracao, maxUsuarios, ativo      │
└─────────────────────────────────────────┘
          │
          │ 1:N (um tenant, muitos usuários)
          ↓
┌─────────────────────────────────────────┐
│            USUÁRIOS                      │
│  (Profissionais, admins)                │
├─────────────────────────────────────────┤
│  id, nome, email, senha, papel,         │
│  tenantId, especialidade, grade         │
└─────────────────────────────────────────┘
          │
          │ 1:N (um usuário, muitos agendamentos)
          ↓
┌─────────────────────────────────────────┐
│          AGENDAMENTOS                    │
│  (Isolados por tenant)                  │
├─────────────────────────────────────────┤
│  id, clienteNome, clienteTelefone,      │
│  profissionalId, data, horario,         │
│  procedimento, tenantId                 │
└─────────────────────────────────────────┘
```

---

## 🔐 Fluxo de Autenticação

```
1. Usuário faz cadastro
   ↓
   Cria TENANT + USUÁRIO ADMIN
   ↓
   Gera TOKEN JWT
   ↓
   Armazena no localStorage
   ↓
   Redireciona para /agenda

2. Usuário faz login
   ↓
   Valida email + senha
   ↓
   Gera TOKEN JWT (inclui tenantId)
   ↓
   Armazena no localStorage
   ↓
   Redireciona para /agenda

3. Cada requisição
   ↓
   Envia token no header
   ↓
   Backend valida JWT
   ↓
   Extrai tenantId do token
   ↓
   Filtra dados por tenantId
   ↓
   Retorna apenas dados do tenant
```

---

## 📱 Fluxo de Agendamento com WhatsApp

### Opção 1: Manual (wa.me)

```
1. Usuário cria agendamento
   ↓
   Salva no banco (com tenantId)
   ↓
   Backend retorna ID do agendamento
   ↓
   Frontend chama: GET /agendamentos/:id/whatsapp-link
   ↓
   Backend gera:
   - Formata mensagem
   - Limpa telefone
   - Cria link wa.me
   ↓
   Frontend exibe botão "Enviar WhatsApp"
   ↓
   Usuário clica
   ↓
   Abre WhatsApp Web com mensagem pré-formatada
   ↓
   Usuário revisa e envia manualmente
```

### Opção 2: Evolution API (Automático)

```
1. Usuário cria agendamento
   ↓
   Salva no banco
   ↓
   Backend busca config do tenant:
   - evolutionApiUrl
   - evolutionApiKey
   ↓
   Backend faz POST para Evolution API:
   POST /message/sendText/{instance}
   Body: { number, text }
   ↓
   Evolution API:
   - Conecta com WhatsApp
   - Envia mensagem
   - Retorna status
   ↓
   Backend atualiza: whatsappEnviado = true
   ↓
   Frontend exibe: ✅ WhatsApp enviado
```

---

## 🔄 Isolamento Multi-Tenant

### Como funciona?

```javascript
// 1. Token inclui tenantId
const token = jwt.sign(
  {
    id: usuario.id,
    tenantId: usuario.tenantId, // ← IMPORTANTE!
  },
  SECRET_KEY
);

// 2. Middleware extrai tenantId
const authenticateToken = (req, res, next) => {
  jwt.verify(token, SECRET_KEY, (err, user) => {
    req.user = user; // user.tenantId disponível
    next();
  });
};

// 3. Todas as queries filtram por tenantId
app.get("/agendamentos", authenticateToken, async (req, res) => {
  const agendamentos = await Agendamento.findAll({
    where: { tenantId: req.user.tenantId }, // ← FILTRA!
  });
});
```

### Garantias de Isolamento

✅ Cada tenant só vê seus próprios dados
✅ Impossível acessar dados de outro tenant
✅ URL e IDs não revelam estrutura
✅ Token JWT expira (7 dias)

---

## 🎯 Fluxo de Trial e Assinatura

```
┌─────────────────────────────────────────┐
│         CADASTRO                        │
│  Usuário preenche formulário            │
└─────────────────────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────┐
│      CRIAR TENANT + USUÁRIO             │
│  status = 'trial'                       │
│  dataExpiracao = hoje + 30 dias         │
└─────────────────────────────────────────┘
                │
                ↓
        30 DIAS DE USO GRÁTIS
                │
                ↓
┌─────────────────────────────────────────┐
│     VERIFICAÇÃO AUTOMÁTICA              │
│  Middleware: checkTenantLimits          │
│  Se hoje > dataExpiracao → BLOQUEIA     │
└─────────────────────────────────────────┘
                │
        ┌───────┴───────┐
        ↓               ↓
    PAGOU          NÃO PAGOU
        │               │
        ↓               ↓
  status='active'  status='suspended'
  Novo prazo       Acesso bloqueado
```

---

## 🌐 Deploy em Produção

### Opção A: VPS Manual

```
┌──────────────────────────────────────┐
│         VPS (DigitalOcean/AWS)       │
│                                      │
│  ┌────────────────────────────┐     │
│  │   Backend (Node.js)        │     │
│  │   Porta 3000               │     │
│  └────────────────────────────┘     │
│                                      │
│  ┌────────────────────────────┐     │
│  │   Frontend (Build)         │     │
│  │   Nginx → Porta 80/443     │     │
│  └────────────────────────────┘     │
│                                      │
│  ┌────────────────────────────┐     │
│  │   SQLite Database          │     │
│  └────────────────────────────┘     │
└──────────────────────────────────────┘
            │
            ↓
      seu-dominio.com
```

### Opção B: Platform as a Service

```
GitHub Repo
    ↓
┌────────────────────┐
│   Railway/Heroku   │
│                    │
│  - Build automático│
│  - Deploy contínuo │
│  - HTTPS incluído  │
│  - Logs centralizados│
└────────────────────┘
    ↓
URL gerada: app.railway.app
```

---

## 📦 Tecnologias Usadas

### Backend

```javascript
{
  "runtime": "Node.js 18+",
  "framework": "Express 5",
  "database": "SQLite + Sequelize ORM",
  "auth": "JWT (jsonwebtoken)",
  "security": "bcrypt (hash senhas)",
  "cors": "Habilitado"
}
```

### Frontend

```javascript
{
  "framework": "React 19",
  "bundler": "Vite",
  "styling": "TailwindCSS",
  "routing": "React Router",
  "http": "Axios"
}
```

### WhatsApp (Opcional)

```javascript
{
  "manual": "wa.me (URL scheme)",
  "automation": "Evolution API (open-source)"
}
```

---

## 🔒 Segurança

### Camadas de Proteção

```
1. JWT Token
   ├─ Expira em 7 dias
   ├─ Assinado com SECRET_KEY
   └─ Inclui tenantId + userId

2. Senhas
   ├─ Hash bcrypt (10 rounds)
   ├─ Nunca retornadas em API
   └─ Validação no login

3. Isolamento Multi-Tenant
   ├─ Filtro automático por tenantId
   ├─ Middleware checkTenantLimits
   └─ Validação de status (trial/active)

4. CORS
   ├─ Configurado corretamente
   └─ Apenas origens permitidas

5. Validação
   ├─ Campos obrigatórios
   ├─ Tipos de dados
   └─ Limites (3 usuários)
```

---

## 📊 Performance

### Benchmarks Estimados

| Métrica                     | Valor                    |
| --------------------------- | ------------------------ |
| **Tempo de resposta**       | ~50ms (local)            |
| **Agendamentos suportados** | ~100.000 por banco       |
| **Usuários simultâneos**    | ~1000 (com VPS básico)   |
| **Tamanho do banco**        | ~10MB por tenant (média) |
| **Tempo de backup**         | ~1s                      |

### Otimizações

✅ **Sequelize ORM:** Queries otimizadas
✅ **Índices:** Criados automaticamente
✅ **JWT:** Stateless (sem session)
✅ **React:** Virtual DOM eficiente
✅ **Vite:** Build otimizado

---

## 🎯 Escalabilidade

### Crescimento do Sistema

```
Fase 1: MVP (Atual)
├─ SQLite
├─ 1 servidor
└─ ~100 tenants

Fase 2: Crescimento
├─ PostgreSQL
├─ 1 servidor maior
└─ ~1000 tenants

Fase 3: Escala
├─ PostgreSQL + Read Replicas
├─ Load Balancer
├─ Múltiplos servidores
└─ ~10.000 tenants
```

---

## 📚 Referências

- [Express.js](https://expressjs.com/)
- [React](https://react.dev/)
- [Sequelize](https://sequelize.org/)
- [JWT](https://jwt.io/)
- [TailwindCSS](https://tailwindcss.com/)
- [Evolution API](https://evolution-api.com/)

---

**Versão:** 2.0.0  
**Última atualização:** 12/01/2026
