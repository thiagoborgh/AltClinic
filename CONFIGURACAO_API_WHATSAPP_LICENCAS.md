# 🔑 Configuração de API WhatsApp por Licença

## 📋 Visão Geral

O sistema suporta **duas formas** de configurar WhatsApp para as licenças:

### **Opção 1: API Central (Sua API)** 🏢

- **Uma API Key ManyChat** para todas as licenças
- Gerenciamento centralizado no admin
- Mais simples para começar
- Você controla todas as mensagens

### **Opção 2: API Própria por Licença** 🏪

- **Cada licença** tem sua própria API Key ManyChat
- Máximo isolamento e flexibilidade
- Cada cliente usa sua própria conta ManyChat
- Mais autonomia para os clientes

## 🏢 Opção 1: API Central (Sua API)

### Como Configurar:

1. **Criar Conexão Admin (Uma vez):**

```javascript
// Via API Admin
POST /api/whatsapp/connections
{
  "name": "ManyChat Central",
  "type": "manychat",
  "credentials": {
    "page_id": "9353710",
    "api_token": "sua_api_token_central"
  }
}
```

2. **Vincular Licenças à Sua API:**

```javascript
// Para cada licença
POST /api/whatsapp/tenants/bind
{
  "tenant_id": "licenca_abc",
  "tenant_name": "Clínica ABC",
  "whatsapp_connection_id": 1, // ID da sua conexão
  "phone_number": "5511999999999",
  "business_name": "Clínica ABC Estética",
  "enabled_automations": {
    "appointment_confirmations": true,
    "appointment_reminders": true,
    "payment_requests": true,
    "satisfaction_surveys": false
  }
}
```

### ✅ Vantagens:

- Setup simples
- Controle total
- Uma conta ManyChat para gerenciar
- Custos centralizados

### ⚠️ Desvantagens:

- Menos autonomia para clientes
- Você é responsável por todas as mensagens
- Limite compartilhado entre licenças

## 🏪 Opção 2: API Própria por Licença

### Como Configurar:

```javascript
// Para cada licença com API própria
POST /api/whatsapp/tenants/bind
{
  "tenant_id": "licenca_xyz",
  "tenant_name": "Estética XYZ",
  "use_own_api": true,
  "own_api_type": "manychat",
  "own_api_credentials": {
    "page_id": "page_id_do_cliente",
    "api_token": "api_token_do_cliente"
  },
  "own_api_config": {
    "webhook_url": "https://webhook-cliente.com",
    "language": "pt_BR"
  },
  "phone_number": "5511888888888",
  "business_name": "Estética XYZ",
  "enabled_automations": {
    "appointment_confirmations": true,
    "appointment_reminders": true,
    "payment_requests": true,
    "satisfaction_surveys": true
  }
}
```

### ✅ Vantagens:

- Máxima autonomia para clientes
- Isolamento completo entre licenças
- Cliente controla sua própria conta ManyChat
- Sem limites compartilhados

### ⚠️ Desvantagens:

- Cada cliente precisa ter conta ManyChat
- Setup mais complexo
- Mais configurações para gerenciar

## 🔧 Configuração Prática

### Exemplo de Setup Híbrido:

```javascript
// Licenças básicas usam sua API central
const licencasBasicas = [
  { tenant_id: "clinica_a", connection_id: 1 },
  { tenant_id: "clinica_b", connection_id: 1 },
  { tenant_id: "clinica_c", connection_id: 1 },
];

// Licenças premium usam API própria
const licencasPremium = [
  {
    tenant_id: "grande_clinica",
    own_api: {
      page_id: "cliente_page_id",
      api_token: "cliente_api_token",
    },
  },
];
```

### Script de Configuração Rápida:

```javascript
// Configurar múltiplas licenças
const AdminWhatsAppManager = require("./admin/backend/services/AdminWhatsAppManager");

async function configurarLicencas() {
  const admin = new AdminWhatsAppManager();

  // Opção 1: Usar sua API central
  await admin.bindTenantToWhatsApp({
    tenant_id: "clinica_abc",
    tenant_name: "Clínica ABC",
    whatsapp_connection_id: 1, // Sua conexão
    phone_number: "5511999999999",
    business_name: "Clínica ABC",
    enabled_automations: {
      appointment_confirmations: true,
      appointment_reminders: true,
    },
    assigned_by: 1,
  });

  // Opção 2: API própria do cliente
  await admin.bindTenantToWhatsApp({
    tenant_id: "estetica_xyz",
    tenant_name: "Estética XYZ",
    whatsapp_connection_id: null,
    phone_number: "5511888888888",
    business_name: "Estética XYZ",
    enabled_automations: {
      appointment_confirmations: true,
      appointment_reminders: true,
      payment_requests: true,
    },
    assigned_by: 1,
    // API própria
    own_api_enabled: true,
    own_api_type: "manychat",
    own_api_credentials: {
      page_id: "page_id_cliente",
      api_token: "api_token_cliente",
    },
    own_api_config: {
      webhook_url: "https://webhook-cliente.com",
    },
  });
}
```

## 📊 Comparação Detalhada

| Aspecto               | API Central    | API por Licença |
| --------------------- | -------------- | --------------- |
| **Setup**             | Simples        | Complexo        |
| **Controle**          | Total (seu)    | Distribuído     |
| **Custos**            | Centralizados  | Por cliente     |
| **Limites**           | Compartilhados | Individuais     |
| **Autonomia Cliente** | Baixa          | Alta            |
| **Manutenção**        | Fácil          | Média           |
| **Escalabilidade**    | Boa            | Excelente       |

## 🎯 Recomendações

### **Use API Central quando:**

- Começando o negócio
- Clientes pequenos/básicos
- Quer controle total
- Setup simples é prioridade

### **Use API por Licença quando:**

- Clientes grandes/premium
- Máxima autonomia desejada
- Isolamento total necessário
- Cliente já tem conta ManyChat

### **Abordagem Híbrida (Recomendada):**

1. **Comece** com API central para todas
2. **Migre clientes premium** para API própria conforme demanda
3. **Mantenha flexibilidade** para ambas as opções

## 🔄 Migração Entre Modelos

### De Central para Própria:

```javascript
// 1. Configurar API própria
await admin.bindTenantToWhatsApp({
  tenant_id: "cliente_existente",
  // ... nova configuração com own_api_enabled: true
});

// 2. Testar nova configuração
// 3. Confirmar funcionamento
// 4. Antiga configuração é substituída automaticamente
```

### De Própria para Central:

```javascript
// Vincular à conexão central
await admin.bindTenantToWhatsApp({
  tenant_id: "cliente_existente",
  whatsapp_connection_id: 1, // Sua conexão central
  own_api_enabled: false,
  // ... outras configurações
});
```

## 🚀 Começando

### Para Desenvolvimento:

```bash
# 1. Configure ambiente
npm run setup:dev

# 2. Use API central para testes
# Todos os números vão para seu WhatsApp de teste

# 3. Teste diferentes configurações
npm run test:dev-whatsapp
```

### Para Produção:

1. **Decida o modelo** (central vs individual)
2. **Configure conexões** via admin
3. **Vincule licenças** conforme escolhido
4. **Monitore uso** via dashboard admin

---

**🎯 Flexibilidade Total**: O sistema suporta ambas as abordagens e permite mudança conforme sua estratégia de negócio evolui!
