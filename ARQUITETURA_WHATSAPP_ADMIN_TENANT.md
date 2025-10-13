# Arquitetura WhatsApp Admin-Tenant

## 📋 Visão Geral

A nova arquitetura separa completamente o **gerenciamento de conexões WhatsApp** (admin) do **uso das funcionalidades** (tenant). Cada licença/tenant pode ter suas próprias rotinas e eventos de envio, mas o relacionamento com o WhatsApp é gerenciado centralmente pelo admin.

## 🏗️ Componentes da Arquitetura

### 1. Admin Backend - Gerenciamento Central

- **Localização**: `admin/backend/`
- **Responsabilidade**: Gerenciar conexões WhatsApp e vincular tenants

#### Principais Arquivos:

- `migrations/001_admin_whatsapp_system.sql` - Estrutura do banco de dados
- `services/AdminWhatsAppManager.js` - Serviço principal de gerenciamento
- `routes/whatsapp-admin.js` - APIs para administração

#### Funcionalidades:

- ✅ Criar e gerenciar conexões WhatsApp (ManyChat, WhatsApp Business, etc.)
- ✅ Vincular tenants a conexões específicas
- ✅ Controlar limites de uso por tenant
- ✅ Logs centralizados de mensagens
- ✅ Templates de mensagens globais

### 2. Tenant App - Uso das Funcionalidades

- **Localização**: `src/`
- **Responsabilidade**: Usar WhatsApp através do admin

#### Principais Arquivos:

- `services/TenantWhatsAppService.js` - Cliente para conectar com admin
- `integrations/AgendamentoWhatsAppIntegration.js` - Exemplo de uso
- `app.js` - Integração com serviço tenant

#### Funcionalidades:

- ✅ Verificar disponibilidade do WhatsApp
- ✅ Enviar mensagens através do admin
- ✅ Respeitar limites configurados
- ✅ Cache de configurações
- ✅ Fallback gracioso quando WhatsApp não disponível

## 🔄 Fluxo de Funcionamento

### 1. Configuração pelo Admin

```
Admin → Cria conexão WhatsApp (ManyChat/WhatsApp Business)
     → Vincula tenant à conexão
     → Define automações habilitadas
     → Configura limites de uso
```

### 2. Uso pelo Tenant

```
Tenant App → Solicita envio de mensagem
          → TenantWhatsAppService verifica configuração
          → Se autorizado, envia via Admin API
          → Admin registra uso e atualiza limites
          → Retorna status do envio
```

## 📊 Estrutura do Banco de Dados Admin

### Tabelas Principais:

#### `admin_whatsapp_connections`

- Armazena conexões WhatsApp (ManyChat, WhatsApp Business, etc.)
- Credenciais criptografadas
- Status e configurações

#### `tenant_whatsapp_bindings`

- Vincula tenants a conexões
- Configurações específicas do tenant
- Limites de uso e controles

#### `tenant_whatsapp_usage`

- Logs de todas as mensagens enviadas
- Status de entrega
- Controle de custos

#### `admin_message_templates`

- Templates de mensagens reutilizáveis
- Suporte a variáveis dinâmicas
- Compatibilidade com tipos de conexão

## 🚀 Como Usar

### No Admin (Configuração):

```javascript
// Criar conexão ManyChat
const adminWhatsApp = new AdminWhatsAppManager();

await adminWhatsApp.createWhatsAppConnection({
  name: "ManyChat Principal",
  type: "manychat",
  credentials: {
    page_id: "9353710",
    api_token: "8f05258497356cfe8a039e79200b2af4",
  },
  config: {
    webhook_url: "https://api.exemplo.com/webhook/manychat",
  },
  created_by: 1,
});

// Vincular tenant
await adminWhatsApp.bindTenantToWhatsApp({
  tenant_id: "clinica_abc",
  tenant_name: "Clínica ABC",
  whatsapp_connection_id: 1,
  phone_number: "5511999999999",
  business_name: "Clínica ABC Estética",
  enabled_automations: {
    appointment_confirmations: true,
    appointment_reminders: true,
    payment_requests: false,
    satisfaction_surveys: true,
  },
});
```

### No Tenant App (Uso):

```javascript
const whatsapp = new TenantWhatsAppService();

// Enviar confirmação de agendamento
const result = await whatsapp.sendAppointmentConfirmation({
  patientName: "João Silva",
  doctorName: "Dr. Carlos",
  appointmentDate: "2024-01-15",
  appointmentTime: "14:30",
  phoneNumber: "11999999999",
});

if (result.success) {
  console.log(`Mensagem enviada! ID: ${result.message_id}`);
}
```

## 🔧 Configuração de Ambiente

### Admin Backend:

```env
# Database
ADMIN_DB_PATH=./admin/database/admin.db

# Criptografia
ENCRYPTION_KEY=sua_chave_super_secreta_aqui

# APIs WhatsApp
MANYCHAT_API_URL=https://api.manychat.com
WHATSAPP_BUSINESS_API_URL=https://graph.facebook.com
```

### Tenant App:

```env
# Conexão com Admin
ADMIN_WHATSAPP_URL=http://localhost:3001/api/whatsapp
TENANT_ID=sua_tenant_id

# Informações da clínica
CLINIC_NAME=Nome da Sua Clínica
CLINIC_ADDRESS=Endereço da Clínica
```

## 📈 Benefícios da Nova Arquitetura

### ✅ Vantagens:

- **Segurança**: Credenciais WhatsApp centralizadas e criptografadas
- **Escalabilidade**: Um admin gerencia múltiplos tenants
- **Flexibilidade**: Diferentes tipos de conexão WhatsApp
- **Controle**: Limites de uso e logs centralizados
- **Manutenção**: Atualizações de API em um local central
- **Compliance**: Auditoria completa de mensagens enviadas

### 🔄 Migração de Código Existente:

- Substituir chamadas diretas de WhatsApp por `TenantWhatsAppService`
- Remover imports de `bot.js`, `twilio`, `z-api`, `evolution-api`
- Atualizar controllers para usar nova integração
- Configurar variáveis de ambiente do admin

## 🔍 Monitoramento e Logs

### Logs de Uso:

```javascript
// Verificar estatísticas de uso
const stats = await tenantWhatsApp.getUsageStats();
console.log(stats);
// Output: { monthly_limit: 1000, current_usage: 245, remaining: 755 }

// Verificar status da conexão
const status = await tenantWhatsApp.checkConnection();
console.log(status);
// Output: { connected: true, connection_type: 'manychat', automations: {...} }
```

### APIs de Monitoramento:

- `GET /api/whatsapp/tenant-config/:tenant_id` - Configuração do tenant
- `GET /api/whatsapp/tenants/:tenant_id/usage-stats` - Estatísticas de uso
- `GET /whatsapp/status` - Status da conexão WhatsApp

## 🚧 Próximos Passos

1. **✅ Concluído**: Estrutura básica admin-tenant
2. **✅ Concluído**: TenantWhatsAppService para app principal
3. **🔄 Em andamento**: Remoção completa de integrações antigas
4. **📝 Pendente**: Interface web admin para gerenciamento
5. **📝 Pendente**: Migração completa dos controllers existentes
6. **📝 Pendente**: Implementação de webhooks ManyChat
7. **📝 Pendente**: Sistema de notificações em tempo real
8. **📝 Pendente**: Dashboard de métricas de WhatsApp

## 🆘 Troubleshooting

### Problemas Comuns:

#### Tenant não recebe mensagens:

1. Verificar se está vinculado no admin: `GET /api/whatsapp/tenant-config/:tenant_id`
2. Verificar limites de uso: `GET /api/whatsapp/tenants/:tenant_id/usage-stats`
3. Verificar automação habilitada: campo `enabled_automations`

#### Erro de conexão com admin:

1. Verificar URL do admin: `ADMIN_WHATSAPP_URL`
2. Verificar se admin está rodando
3. Verificar logs de rede no TenantWhatsAppService

#### Credenciais ManyChat inválidas:

1. Verificar Page ID e API Token no admin
2. Testar conexão diretamente: `curl https://api.manychat.com/fb/me/info`
3. Recriar conexão se necessário

## 📞 Suporte

Para dúvidas ou problemas:

1. Verificar logs do admin e tenant
2. Consultar documentação da API WhatsApp utilizada
3. Testar conectividade entre componentes
4. Verificar configurações de ambiente
