# 🔧 Z-API - Guia de Uso Completo

## 📋 Visão Geral

A **Z-API** é uma solução brasileira que facilita a integração com WhatsApp Business API. Oferece setup rápido, suporte em português e preços competitivos, ideal para PMEs e empresas brasileiras.

---

## 🚀 Pré-requisitos

### Conta Z-API

- Cadastro no site oficial
- Plano escolhido (Starter/Professional/Enterprise)
- Número de telefone válido

### Requisitos Técnicos

- **API Key**: Fornecida pela Z-API
- **Webhook URL**: Endpoint público
- **HTTPS**: Recomendado para produção

---

## 🛠️ Configuração Inicial

### Passo 1: Criar Conta Z-API

1. Acesse: https://app.z-api.io/
2. Faça cadastro
3. Escolha plano adequado
4. Adicione crédito (se necessário)

### Passo 2: Obter Credenciais

```javascript
// Após login, você recebe:
const credentials = {
  clientToken: "seu-client-token-aqui", // API Key principal
  instanceId: "instancia-gerada", // ID da instância
  webhookUrl: "opcional", // URL para webhooks
};
```

### Passo 3: Escolher Plano

| Plano            | Mensagens/Mês | Preço     | Ideal para        |
| ---------------- | ------------- | --------- | ----------------- |
| **Starter**      | 500           | R$ 29,90  | Pequenas clínicas |
| **Professional** | 2.500         | R$ 99,90  | Clínicas médias   |
| **Enterprise**   | 10.000        | R$ 299,90 | Redes de clínicas |

---

## 🔧 Configuração no AltClinic

### Passo 1: Acessar Interface

1. Faça login no AltClinic
2. Vá para **Configurações** → **WhatsApp**
3. Selecione **Z-API**

### Passo 2: Configurar Instância

#### Opção A: Configurar Instância Existente

```bash
# Se você já criou uma instância no painel Z-API:
Instance ID: seu-instance-id
API Token: seu-api-token
Webhook URL: (opcional)
```

#### Opção B: Criar Nova Instância

```bash
# Deixe em branco para criar automaticamente:
Phone Number: +5511999999999
```

### Passo 3: Ativar Conexão

```bash
curl -X POST http://localhost:3000/api/whatsapp/zapi/activate \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+5511999999999"
  }'
```

**Resposta esperada:**

```json
{
  "success": true,
  "instanceId": "12345",
  "message": "Instância Z-API criada. Use /zapi/qr/:instanceId para obter o QR code."
}
```

---

## 📱 Conexão WhatsApp

### Passo 1: Obter QR Code

```bash
curl -X GET http://localhost:3000/api/whatsapp/zapi/qr/12345 \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

**Resposta:**

```json
{
  "success": true,
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "message": "Escaneie este QR code no WhatsApp para conectar."
}
```

### Passo 2: Escanear QR Code

1. **Abra WhatsApp** no celular
2. **Menu (⋮)** → **Dispositivos conectados**
3. **Conectar um dispositivo**
4. **Escaneie o QR Code** exibido

### Passo 3: Verificar Status

```bash
curl -X GET http://localhost:3000/api/whatsapp/zapi/status/12345 \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

**Status possíveis:**

```json
{
  "success": true,
  "connected": true,
  "status": "active"
}
```

---

## 💬 Envio de Mensagens

### Mensagem de Texto Simples

```bash
curl -X POST http://localhost:3000/api/whatsapp/zapi/send \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+5511999999999",
    "message": "Olá! Sua consulta está confirmada para amanhã às 14h! 😊"
  }'
```

### Mensagem com Mídia

```bash
curl -X POST http://localhost:3000/api/whatsapp/zapi/send \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+5511999999999",
    "message": "Confira nossa nova promoção!",
    "file": "https://exemplo.com/promocao.jpg"
  }'
```

### Mensagem com Botões

```bash
curl -X POST http://localhost:3000/api/whatsapp/zapi/send \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+5511999999999",
    "message": "Como posso ajudar você hoje?",
    "options": [
      {"id": "1", "title": "Agendar consulta"},
      {"id": "2", "title": "Ver procedimentos"},
      {"id": "3", "title": "Falar com atendente"}
    ]
  }'
```

---

## 🔄 Webhooks e Automação

### Configuração de Webhooks

A Z-API permite configurar webhooks para receber eventos:

```javascript
// Eventos suportados:
const events = [
  "message", // Novas mensagens
  "message_ack", // Confirmações de entrega
  "typing", // Usuário digitando
  "presence", // Status online/offline
  "disconnect", // Desconexão
];
```

### Payload do Webhook

```json
{
  "type": "message",
  "instance": "12345",
  "message": {
    "from": "+5511999999999",
    "to": "+5511888888888",
    "body": "Olá, gostaria de agendar uma consulta",
    "timestamp": 1634567890,
    "id": "message_id",
    "type": "text"
  },
  "participant": {
    "name": "João Silva",
    "phone": "+5511999999999"
  }
}
```

### Processamento no AltClinic

```javascript
// Webhook endpoint no AltClinic
app.post("/api/whatsapp/webhook/zapi", (req, res) => {
  const { type, message, instance } = req.body;

  if (type === "message") {
    // Processar mensagem recebida
    console.log(`Nova mensagem de ${message.from}: ${message.body}`);

    // Responder automaticamente ou encaminhar
    // para sistema de atendimento
  }

  res.sendStatus(200);
});
```

---

## 📊 Limites e Controle de Uso

### Limites por Plano

| Plano        | Mensagens/Mês | Taxa Extra | Reset  |
| ------------ | ------------- | ---------- | ------ |
| Starter      | 500           | R$ 0,10    | Mensal |
| Professional | 2.500         | R$ 0,08    | Mensal |
| Enterprise   | 10.000        | R$ 0,06    | Mensal |

### Monitoramento de Uso

```bash
# Verificar uso atual
curl -X GET http://localhost:3000/api/whatsapp/usage \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

**Resposta:**

```json
{
  "success": true,
  "usage": {
    "used": 125,
    "limit": 500,
    "remaining": 375,
    "exceeded": false,
    "percentage": 25
  },
  "whatsappStatus": "active"
}
```

### Alertas de Limite

- **80%**: Notificação por email
- **90%**: Alerta no dashboard
- **100%**: Bloqueio automático
- **Upgrade**: Sugestão automática

---

## 🔧 Recursos Avançados

### Grupos e Broadcast

```bash
# Enviar para grupo
curl -X POST http://localhost:3000/api/whatsapp/zapi/send \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "120363123456789012@g.us",
    "message": "Lembrete: Consulta amanhã às 14h"
  }'
```

### Campanhas em Massa

```bash
# Enviar para múltiplos contatos
curl -X POST http://localhost:3000/api/whatsapp/zapi/broadcast \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contacts": ["+5511999999999", "+5511888888888"],
    "message": "Campanha especial: 20% desconto!",
    "delay": 30
  }'
```

### Integração com CRM

```javascript
// Sincronização automática
const crmIntegration = {
  onMessage: (message) => {
    // Salvar no CRM
    crm.saveMessage(message);

    // Atualizar status do paciente
    crm.updatePatientStatus(message.from, "ativo");
  },

  onAppointment: (appointment) => {
    // Enviar confirmação
    zapi.sendMessage(appointment.patientPhone, confirmationMessage);
  },
};
```

---

## 📱 Painel Z-API

### Recursos do Dashboard

- ✅ **Status da conexão** em tempo real
- ✅ **Histórico de mensagens** completo
- ✅ **Estatísticas de uso** detalhadas
- ✅ **Gerenciamento de webhooks**
- ✅ **Configuração de respostas automáticas**
- ✅ **Relatórios de deliverability**

### Monitoramento

```javascript
// Métricas disponíveis
const metrics = {
  messagesSent: 1250,
  messagesReceived: 980,
  deliveryRate: 94.5,
  readRate: 78.2,
  responseTime: "< 5s",
  uptime: 99.8,
};
```

---

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. QR Code não carrega

```bash
# Verificar status da instância
curl https://api.z-api.io/instances/12345/status \
  -H "Client-Token: seu-client-token"
```

#### 2. Mensagens não são entregues

```javascript
// Verificar se número está correto
// Verificar se WhatsApp está conectado
// Verificar créditos disponíveis
```

#### 3. Webhook não funciona

```javascript
// Verificar URL do webhook
// Verificar se servidor está acessível
// Verificar formato do payload
```

### Logs de Debug

```bash
# Habilitar logs detalhados
const debug = true;

// Ver logs do AltClinic
tail -f server.log | grep zapi

// Ver logs da Z-API no painel
# Acesse: https://app.z-api.io/logs
```

---

## 🔒 Segurança

### Recursos de Segurança Z-API

- ✅ **API Key única** por instância
- ✅ **Rate limiting** automático
- ✅ **Monitoramento de uso** 24/7
- ✅ **Backup automático** de dados
- ✅ **Criptografia** de mensagens

### Boas Práticas

```javascript
// Configurações recomendadas
const security = {
  apiKeyRotation: "mensal",
  ipWhitelist: ["seus-ips"],
  twoFactorAuth: true,
  auditLogs: true,
  dataRetention: "90d",
};
```

---

## 📈 Escalabilidade

### Múltiplas Instâncias

```javascript
// Estratégia para clínicas grandes
const multiInstance = {
  instances: [
    { id: "clinica1", phone: "+5511999999999" },
    { id: "clinica2", phone: "+5511888888888" },
    { id: "marketing", phone: "+5511777777777" },
  ],
  loadBalancer: "round-robin",
  failover: "automatic",
};
```

### Integração com Load Balancer

```
Internet
    ↓
Load Balancer
    ↓
├── Instância 1 (Consultas)
├── Instância 2 (Marketing)
└── Instância 3 (Suporte)
```

---

## 🎯 Casos de Uso

### Clínica Particular

- **Instâncias**: 1-2
- **Mensagens/dia**: 20-100
- **Uso**: Agendamentos e lembretes

### Rede de Clínicas

- **Instâncias**: 3-5
- **Mensagens/dia**: 200-500
- **Uso**: Comunicação multi-unidade

### Centro Médico

- **Instâncias**: 5+
- **Mensagens/dia**: 500+
- **Uso**: Atendimento completo + marketing

---

## 💰 Custos e Planos

### Comparativo de Custos

| Cenário          | Z-API Starter | Meta API | Evolution API |
| ---------------- | ------------- | -------- | ------------- |
| **Setup**        | R$ 0          | R$ 0     | R$ 0          |
| **Mensal**       | R$ 29,90      | R$ 0     | R$ 0          |
| **Por msg**      | R$ 0,10       | $0.005   | Gratuito      |
| **100 msg/mês**  | R$ 39,90      | $0.50    | Gratuito      |
| **500 msg/mês**  | R$ 79,90      | $2.50    | Gratuito      |
| **1000 msg/mês** | R$ 129,90     | $5.00    | Gratuito      |

### Otimização de Custos

```javascript
// Estratégias de economia
const costOptimization = {
  bulkSending: true, // Envio em lote
  scheduledMessages: true, // Mensagens agendadas
  templateReuse: true, // Reutilizar templates
  audienceSegmentation: true, // Segmentação de público
};
```

---

## 📞 Suporte Z-API

### Canais de Suporte

- **WhatsApp**: Suporte direto 24/7
- **Email**: suporte@z-api.io
- **Documentação**: https://docs.z-api.io/
- **Comunidade**: Grupo no WhatsApp

### SLA Z-API

- **Uptime**: 99.5% garantido
- **Suporte**: Resposta em até 2h
- **Setup**: Assistido gratuito

---

## ✅ Checklist de Implementação

### Pré-implementação

- [ ] Conta Z-API criada
- [ ] Plano escolhido
- [ ] Créditos adicionados
- [ ] API Key obtida

### Configuração AltClinic

- [ ] Credenciais inseridas
- [ ] Instância criada
- [ ] QR Code escaneado
- [ ] Conexão estabelecida

### Testes

- [ ] Mensagem de teste enviada
- [ ] Webhook funcionando
- [ ] Status monitorado
- [ ] Limites verificados

### Produção

- [ ] Monitoramento ativo
- [ ] Alertas configurados
- [ ] Backup automático
- [ ] Documentação atualizada

---

## 🚀 Próximos Passos

### Recursos Avançados

- [ ] **Chatbot integration** com Typebot
- [ ] **CRM integration** com sistemas externos
- [ ] **Analytics avançado** de conversas
- [ ] **API de voz** para WhatsApp
- [ ] **Integração com Meta Ads**

### Expansão

```javascript
// Roadmap sugerido
const roadmap = [
  "Integração com Typebot",
  "Sistema de chatbot avançado",
  "Relatórios de BI",
  "API de voz",
  "Integração com Meta Ads",
  "Multi-tenant avançado",
];
```

---

**Status**: ✅ Pronto para produção
**Versão**: Z-API v2.0
**Última atualização**: Setembro 2025
