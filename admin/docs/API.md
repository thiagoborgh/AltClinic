# 📚 Documentação da API - Intranet Altclinic

## 🌐 **BASE URL**

```
http://localhost:3001/api/admin
```

## 🔐 **AUTENTICAÇÃO**

Todas as rotas (exceto `/auth/login`) requerem um token JWT no header:

```
Authorization: Bearer <jwt_token>
```

---

## 🔑 **ENDPOINTS DE AUTENTICAÇÃO**

### POST `/auth/login`

Realiza login na intranet.

**Request Body:**

```json
{
  "email": "admin@altclinic.com",
  "password": "Admin123!"
}
```

**Response (200):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@altclinic.com",
    "nome": "Administrador",
    "role": "super_admin",
    "ativo": true
  }
}
```

**Errors:**

- `400`: Email e senha obrigatórios
- `401`: Credenciais inválidas
- `403`: Usuário inativo

---

### GET `/auth/me`

Retorna dados do usuário logado.

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "admin@altclinic.com",
    "nome": "Administrador",
    "role": "super_admin",
    "ativo": true,
    "ultimo_login": "2025-09-02T10:30:00.000Z"
  }
}
```

---

### POST `/auth/logout`

Realiza logout (invalida token).

**Response (200):**

```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

---

### POST `/auth/change-password`

Altera senha do usuário.

**Request Body:**

```json
{
  "currentPassword": "Admin123!",
  "newPassword": "NovaSenh@456"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Senha alterada com sucesso"
}
```

---

## 🏢 **ENDPOINTS DE LICENÇAS**

### GET `/licencas`

Lista todas as licenças com filtros e paginação.

**Query Parameters:**

- `search`: Busca por nome ou email
- `status`: Filtra por status (ativa, vencida, suspensa)
- `page`: Página (default: 1)
- `limit`: Itens por página (default: 20)
- `sortBy`: Campo para ordenação
- `sortOrder`: asc ou desc

**Example:**

```
GET /licencas?search=clinica&status=ativa&page=1&limit=10
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "licencas": [
      {
        "id": "lic_001",
        "nome_clinica": "Clínica São João",
        "email": "admin@clinicasaojoao.com",
        "plano": "premium",
        "status": "ativa",
        "data_inicio": "2024-01-01",
        "data_vencimento": "2025-01-01",
        "valor_mensal": 299.9,
        "observacoes": "Cliente prioritário"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5
    }
  }
}
```

---

### GET `/licencas/:id`

Retorna dados detalhados de uma licença.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "lic_001",
    "nome_clinica": "Clínica São João",
    "email": "admin@clinicasaojoao.com",
    "telefone": "(11) 99999-9999",
    "endereco": "Rua das Flores, 123",
    "cnpj": "12.345.678/0001-90",
    "plano": "premium",
    "status": "ativa",
    "data_inicio": "2024-01-01",
    "data_vencimento": "2025-01-01",
    "valor_mensal": 299.9,
    "observacoes": "Cliente prioritário",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-06-15T14:30:00.000Z"
  }
}
```

---

### POST `/licencas`

Cria uma nova licença.

**Request Body:**

```json
{
  "id": "lic_002",
  "nome_clinica": "Clínica Nova",
  "email": "admin@clinicaniva.com",
  "telefone": "(11) 88888-8888",
  "endereco": "Av. Principal, 456",
  "cnpj": "98.765.432/0001-10",
  "plano": "basic",
  "data_inicio": "2025-09-01",
  "data_vencimento": "2026-09-01",
  "valor_mensal": 199.9,
  "observacoes": "Novo cliente"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "lic_002",
    "nome_clinica": "Clínica Nova"
    // ... outros campos
  },
  "message": "Licença criada com sucesso"
}
```

---

### PUT `/licencas/:id`

Atualiza uma licença existente.

**Request Body:** (campos opcionais)

```json
{
  "nome_clinica": "Clínica São João Atualizada",
  "plano": "premium_plus",
  "valor_mensal": 399.9,
  "observacoes": "Plano atualizado"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "lic_001"
    // ... campos atualizados
  },
  "message": "Licença atualizada com sucesso"
}
```

---

### DELETE `/licencas/:id`

Suspende uma licença (soft delete).

**Response (200):**

```json
{
  "success": true,
  "message": "Licença suspensa com sucesso"
}
```

---

### POST `/licencas/sync`

Sincroniza licenças do sistema principal.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "imported": 12,
    "updated": 5,
    "errors": 0
  },
  "message": "Sincronização concluída"
}
```

---

## ⚙️ **ENDPOINTS DE CONFIGURAÇÕES**

### GET `/configuracoes/:licencaId`

Retorna todas as configurações de uma licença.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "licencaId": "lic_001",
    "configuracoes": {
      "smtp": {
        "host": "smtp.gmail.com",
        "port": 587,
        "user": "***@gmail.com",
        "password": "***",
        "secure": false
      },
      "whatsapp": {
        "api_key": "wpp_***",
        "webhook_url": "https://***",
        "connected": true
      },
      "claude": {
        "api_key": "claude_***",
        "model": "claude-3-sonnet"
      }
      // ... outras configurações
    }
  }
}
```

---

### PUT `/configuracoes/:licencaId`

Atualiza configurações de uma licença.

**Request Body:**

```json
{
  "section": "smtp",
  "config": {
    "host": "smtp.outlook.com",
    "port": 587,
    "user": "admin@clinica.com",
    "password": "novasenha123",
    "secure": false
  }
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Configurações atualizadas com sucesso"
}
```

---

### GET `/configuracoes/:licencaId/sections`

Lista todas as seções de configuração disponíveis.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "sections": [
      {
        "key": "smtp",
        "name": "Email SMTP",
        "description": "Configurações de envio de email",
        "icon": "email"
      },
      {
        "key": "whatsapp",
        "name": "WhatsApp API",
        "description": "Integração com WhatsApp",
        "icon": "whatsapp"
      }
      // ... outras seções
    ]
  }
}
```

---

### GET `/configuracoes/:licencaId/backup`

Gera backup das configurações.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "backup": {
      "licencaId": "lic_001",
      "timestamp": "2025-09-02T15:30:00.000Z",
      "configurations": {
        // ... todas as configurações
      }
    }
  }
}
```

---

## 📊 **ENDPOINTS DE DASHBOARD**

### GET `/dashboard/stats`

Retorna estatísticas gerais do sistema.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalLicencas": 45,
    "licencasAtivas": 38,
    "licencasVencendo": 4,
    "licencasVencidas": 3,
    "faturamentoMensal": 12450.5,
    "crescimentoMensal": 15.2,
    "novasLicencasUltimos30Dias": 8
  }
}
```

---

### GET `/dashboard/recent-activity`

Retorna atividades recentes do sistema.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": 1,
        "type": "license_created",
        "description": "Nova licença criada: Clínica ABC",
        "user": "admin@altclinic.com",
        "timestamp": "2025-09-02T14:30:00.000Z"
      },
      {
        "id": 2,
        "type": "config_updated",
        "description": "Configurações SMTP atualizadas - lic_001",
        "user": "admin@altclinic.com",
        "timestamp": "2025-09-02T13:15:00.000Z"
      }
    ]
  }
}
```

---

### GET `/dashboard/alerts`

Retorna alertas importantes do sistema.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": 1,
        "type": "warning",
        "title": "Licenças vencendo",
        "message": "4 licenças vencem nos próximos 30 dias",
        "count": 4,
        "action": "/licencas?status=vencendo"
      },
      {
        "id": 2,
        "type": "error",
        "title": "Licenças vencidas",
        "message": "3 licenças estão vencidas",
        "count": 3,
        "action": "/licencas?status=vencida"
      }
    ]
  }
}
```

---

### GET `/dashboard/revenue`

Retorna dados de faturamento por período.

**Query Parameters:**

- `period`: monthly, quarterly, yearly (default: monthly)
- `months`: Número de meses para retornar (default: 12)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "revenue": [
      {
        "month": "2024-01",
        "value": 10500.0,
        "licenses": 35
      },
      {
        "month": "2024-02",
        "value": 11200.0,
        "licenses": 37
      }
      // ... outros meses
    ]
  }
}
```

---

### GET `/dashboard/licenses-by-status`

Retorna distribuição de licenças por status.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "distribution": [
      {
        "status": "ativa",
        "count": 38,
        "percentage": 84.4
      },
      {
        "status": "vencendo",
        "count": 4,
        "percentage": 8.9
      },
      {
        "status": "vencida",
        "count": 3,
        "percentage": 6.7
      }
    ]
  }
}
```

---

## 📈 **ENDPOINTS DE RELATÓRIOS**

### GET `/relatorios`

Lista relatórios disponíveis e gerados.

**Query Parameters:**

- `type`: Tipo de relatório (geral, financeiro, licencas, suporte)
- `period`: Período (today, week, month, quarter, year, custom)
- `startDate`: Data início (para custom)
- `endDate`: Data fim (para custom)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "rel_001",
        "type": "geral",
        "title": "Relatório Geral - Setembro 2025",
        "period": "month",
        "startDate": "2025-09-01",
        "endDate": "2025-09-30",
        "createdAt": "2025-09-02T15:00:00.000Z",
        "url": "/relatorios/rel_001/download"
      }
    ]
  }
}
```

---

### POST `/relatorios/export`

Gera e exporta um relatório.

**Request Body:**

```json
{
  "type": "financeiro",
  "period": "month",
  "startDate": "2025-09-01",
  "endDate": "2025-09-30",
  "format": "pdf"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "reportId": "rel_002",
    "downloadUrl": "/relatorios/rel_002/download",
    "expiresAt": "2025-09-09T15:00:00.000Z"
  },
  "message": "Relatório gerado com sucesso"
}
```

---

### GET `/relatorios/templates`

Retorna templates de relatórios disponíveis.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "type": "geral",
        "name": "Relatório Geral",
        "description": "Visão completa do sistema",
        "metrics": ["licenses", "revenue", "activity"]
      },
      {
        "type": "financeiro",
        "name": "Relatório Financeiro",
        "description": "Faturamento e métricas financeiras",
        "metrics": ["revenue", "plans", "payments"]
      }
    ]
  }
}
```

---

## 📱 **ENDPOINTS DE WHATSAPP**

### POST `/whatsapp/:licencaId/qr`

Gera QR Code para conectar WhatsApp.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "expiresIn": 60,
    "sessionId": "wpp_session_001"
  }
}
```

---

### GET `/whatsapp/:licencaId/status`

Verifica status da conexão WhatsApp.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "connected": true,
    "sessionId": "wpp_session_001",
    "phoneNumber": "+5511999999999",
    "lastActivity": "2025-09-02T15:20:00.000Z",
    "messageCount": 1245
  }
}
```

---

### POST `/whatsapp/:licencaId/disconnect`

Desconecta sessão WhatsApp.

**Response (200):**

```json
{
  "success": true,
  "message": "WhatsApp desconectado com sucesso"
}
```

---

### POST `/whatsapp/:licencaId/test-message`

Envia mensagem de teste.

**Request Body:**

```json
{
  "phoneNumber": "+5511999999999",
  "message": "Teste de conectividade WhatsApp"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "messageId": "msg_001",
    "sentAt": "2025-09-02T15:25:00.000Z"
  },
  "message": "Mensagem enviada com sucesso"
}
```

---

### GET `/whatsapp/:licencaId/logs`

Retorna logs da sessão WhatsApp.

**Query Parameters:**

- `limit`: Número de logs (default: 50)
- `level`: Nível do log (info, warning, error)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "level": "info",
        "message": "WhatsApp conectado com sucesso",
        "timestamp": "2025-09-02T15:00:00.000Z",
        "data": {
          "phoneNumber": "+5511999999999"
        }
      }
    ]
  }
}
```

---

### GET `/whatsapp/global-status`

Status global de todas as sessões WhatsApp.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalSessions": 45,
      "connectedSessions": 38,
      "disconnectedSessions": 7,
      "errorSessions": 0
    },
    "sessions": [
      {
        "licencaId": "lic_001",
        "clinicaName": "Clínica São João",
        "connected": true,
        "phoneNumber": "+5511999999999",
        "lastActivity": "2025-09-02T15:20:00.000Z"
      }
      // ... outras sessões
    ]
  }
}
```

---

## ⚠️ **CÓDIGOS DE ERRO**

### Códigos HTTP

- `200`: Sucesso
- `201`: Criado com sucesso
- `400`: Dados inválidos
- `401`: Não autorizado
- `403`: Acesso negado
- `404`: Não encontrado
- `409`: Conflito (duplicação)
- `429`: Muitas requisições
- `500`: Erro interno do servidor

### Formato de Erro

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email ou senha inválidos",
    "details": {
      "field": "password",
      "received": "***"
    }
  }
}
```

### Códigos de Erro Comuns

- `INVALID_CREDENTIALS`: Credenciais inválidas
- `TOKEN_EXPIRED`: Token JWT expirado
- `PERMISSION_DENIED`: Permissão insuficiente
- `LICENSE_NOT_FOUND`: Licença não encontrada
- `VALIDATION_ERROR`: Erro de validação
- `RATE_LIMIT_EXCEEDED`: Limite de requisições excedido
- `DATABASE_ERROR`: Erro no banco de dados
- `WHATSAPP_CONNECTION_ERROR`: Erro na conexão WhatsApp

---

## 🔒 **RATE LIMITING**

### Limites Padrão

- **Geral**: 100 requests por 15 minutos por IP
- **Login**: 5 tentativas por 15 minutos por IP
- **WhatsApp QR**: 10 gerações por hora por licença

### Headers de Rate Limit

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1693747200
```

---

## 📝 **EXEMPLOS DE USO**

### Autenticação e Busca de Licenças

```javascript
// Login
const loginResponse = await fetch("/api/admin/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "admin@altclinic.com",
    password: "Admin123!",
  }),
});

const { token } = await loginResponse.json();

// Buscar licenças
const licencasResponse = await fetch("/api/admin/licencas?status=ativa", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const licencas = await licencasResponse.json();
```

### Atualizar Configurações

```javascript
// Atualizar configurações SMTP
const configResponse = await fetch("/api/admin/configuracoes/lic_001", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    section: "smtp",
    config: {
      host: "smtp.gmail.com",
      port: 587,
      user: "email@clinica.com",
      password: "senha123",
    },
  }),
});
```

### Gerar Relatório

```javascript
// Gerar relatório financeiro
const reportResponse = await fetch("/api/admin/relatorios/export", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    type: "financeiro",
    period: "month",
    startDate: "2025-09-01",
    endDate: "2025-09-30",
    format: "pdf",
  }),
});

const { downloadUrl } = await reportResponse.json();
```

---

_Documentação da API - Intranet Altclinic v1.0_  
_Última atualização: 02/09/2025_
