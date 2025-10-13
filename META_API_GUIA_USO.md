# 📘 Meta WhatsApp Business API - Guia de Uso Completo

## 📋 Visão Geral

A **Meta WhatsApp Business API** é a solução oficial do WhatsApp para empresas. Oferece máxima confiabilidade, compliance total e suporte direto da Meta, ideal para aplicações críticas e empresas de grande porte.

---

## 🚀 Pré-requisitos

### Conta Meta Business

- Conta Facebook Business verificada
- Acesso ao Meta Developers
- Número de telefone comercial
- Documentação da empresa

### Requisitos Técnicos

- **Servidor**: HTTPS obrigatório
- **Webhook**: URL pública acessível
- **Certificado**: SSL válido
- **Uptime**: 99.9% recomendado

---

## 🛠️ Configuração Inicial

### Passo 1: Criar Conta Meta Business

1. Acesse: https://business.facebook.com/
2. Crie conta Business
3. Verifique conta com documento

### Passo 2: Acessar Meta Developers

1. Vá para: https://developers.facebook.com/
2. Crie app do tipo **"Business"**
3. Adicione produto **"WhatsApp"**

### Passo 3: Configurar WhatsApp

```bash
# No Meta Developers Console:

1. WhatsApp > Setup
2. Adicionar número de telefone
3. Verificar número via SMS
4. Configurar webhook URL
5. Testar webhook
```

### Passo 4: Obter Credenciais

```javascript
// Credenciais necessárias:
const credentials = {
  waAppId: "1234567890123456", // App ID
  waSystemUserToken: "EAAKk8xYZ...", // System User Token
  waWebhookVerifyToken: "altclinic_verify_2025", // Verify Token
  waBusinessAccountId: "123456789012345", // Business Account ID
  phoneNumber: "+5511999999999", // Número verificado
};
```

---

## 🔧 Configuração no AltClinic

### Passo 1: Acessar Interface

1. Faça login no AltClinic
2. Vá para **Configurações** → **WhatsApp**
3. Selecione **Meta API**

### Passo 2: Configurar Credenciais

```bash
# Preencher formulário:
WA_APP_ID: 1234567890123456
WA_SYSTEM_USER_TOKEN: EAAKk8xYZ...[token completo]
WA_WEBHOOK_VERIFY_TOKEN: altclinic_webhook_verify_2025
WA_BUSINESS_ACCOUNT_ID: 123456789012345
Número do WhatsApp: +5511999999999
```

### Passo 3: Salvar Configuração

```bash
curl -X POST http://localhost:3000/api/whatsapp/configure \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "waAppId": "1234567890123456",
    "waSystemUserToken": "EAAKk8xYZ...[token completo]",
    "waWebhookVerifyToken": "altclinic_webhook_verify_2025",
    "waBusinessAccountId": "123456789012345",
    "phoneNumber": "+5511999999999"
  }'
```

---

## 📱 Ativação e Conexão

### Passo 1: Ativar WhatsApp

```bash
curl -X POST http://localhost:3000/api/whatsapp/activate \
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
  "message": "Código de emparelhamento gerado. Escaneie o QR Code no WhatsApp Business App.",
  "qrUrl": "https://api.qrserver.com/v1/create-qr-code/...",
  "pairingCode": "123-456",
  "instructions": [
    "1. Abra o WhatsApp Business App no seu telefone",
    "2. Vá em Configurações > Conta Vinculada",
    "3. Escolha 'Vincular conta' > 'Vincular com código de telefone'",
    "4. Digite o código SMS recebido ou use o QR Code acima"
  ]
}
```

### Passo 2: Vincular WhatsApp Business

1. **Instale WhatsApp Business** no celular
2. **Abra o app** e vá para Configurações
3. **Conta Vinculada** → **Vincular conta**
4. **Vincular com código de telefone**
5. **Digite o código** recebido por SMS ou escaneie QR

### Passo 3: Verificar Conexão

```bash
# Verificar status
curl -X GET http://localhost:3000/api/whatsapp/configuration \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

**Status esperado:**

```json
{
  "success": true,
  "configured": true,
  "configuration": {
    "phoneNumber": "+5511999999999",
    "status": "active"
  }
}
```

---

## 📝 Templates de Mensagem

### Por que Templates são Obrigatórios?

A Meta API **exige templates pré-aprovados** para iniciar conversas. Sem template aprovado, você só pode responder mensagens recebidas.

### Criar Template no Meta

1. Acesse Meta Business Manager
2. Vá para **WhatsApp Manager**
3. **Message Templates** → **Create Template**

**Exemplo de Template:**

```
Nome: consulta_agendada
Categoria: UTILITY
Idioma: pt_BR
Conteúdo: Olá {{1}}! Sua consulta está agendada para {{2}} às {{3}}.
```

### Aprovação de Template

- **Tempo**: 1-24 horas para aprovação
- **Taxa de aprovação**: ~80-90%
- **Rejeições**: Conteúdo não permitido, spam, etc.

### Usar Template Aprovado

```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+5511999999999",
    "type": "template",
    "template": {
      "name": "consulta_agendada",
      "language": "pt_BR",
      "components": [
        {
          "type": "body",
          "parameters": [
            {"type": "text", "text": "João"},
            {"type": "text", "text": "15/10/2025"},
            {"type": "text", "text": "14:30"}
          ]
        }
      ]
    }
  }'
```

---

## 💬 Envio de Mensagens

### Mensagem de Texto (Resposta)

```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+5511999999999",
    "message": "Olá! Como posso ajudar você hoje?"
  }'
```

### Mensagem Interativa

```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+5511999999999",
    "type": "interactive",
    "interactive": {
      "type": "button",
      "body": {
        "text": "Escolha uma opção:"
      },
      "action": {
        "buttons": [
          {"type": "reply", "reply": {"id": "agendar", "title": "Agendar"}},
          {"type": "reply", "reply": {"id": "cancelar", "title": "Cancelar"}}
        ]
      }
    }
  }'
```

### Mensagem com Mídia

```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+5511999999999",
    "type": "image",
    "image": {
      "link": "https://exemplo.com/imagem.jpg",
      "caption": "Confira nossa promoção!"
    }
  }'
```

---

## 🔄 Webhooks

### Configuração de Webhooks

```javascript
// URL do webhook no AltClinic
const webhookUrl = "https://seudominio.com/api/whatsapp/webhook/meta";

// Eventos suportados pela Meta:
const events = [
  "messages", // Novas mensagens
  "message_deliveries", // Confirmações de entrega
  "message_reads", // Confirmações de leitura
  "message_echoes", // Mensagens enviadas
];
```

### Payload do Webhook

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "business_account_id",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "5511999999999",
              "phone_number_id": "123456789012345"
            },
            "contacts": [
              {
                "profile": {
                  "name": "João Silva"
                },
                "wa_id": "5511999999999"
              }
            ],
            "messages": [
              {
                "from": "5511999999999",
                "id": "message_id",
                "timestamp": "1634567890",
                "text": {
                  "body": "Olá, gostaria de agendar uma consulta"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### Verificação de Webhook

```javascript
// GET /api/whatsapp/webhook/meta
app.get("/webhook/meta", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WA_WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});
```

---

## 📊 Limites e Custos

### Limites da Meta API

#### Trial (Desenvolvimento)

- **Mensagens**: 250 por dia
- **Conversas**: 24h janelas
- **Templates**: Limitados
- **Custo**: Gratuito

#### Produção

- **Mensagens**: Ilimitadas
- **Custo**: $0.005 por mensagem
- **Setup Fee**: Nenhum
- **Suporte**: Incluído

### Custos por Tipo de Conversa

| Tipo           | Duração | Custo  |
| -------------- | ------- | ------ |
| Marketing      | 24h     | $0.041 |
| Utility        | 24h     | $0.020 |
| Authentication | 24h     | $0.020 |
| Service        | 24h     | $0.020 |

### Monitoramento de Uso

```bash
# Verificar uso atual
curl -X GET http://localhost:3000/api/whatsapp/usage \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

---

## 🔧 Monitoramento e Troubleshooting

### Verificar Status da API

```bash
# Status da conta WhatsApp
curl -X GET "https://graph.facebook.com/v20.0/{phone_number_id}" \
  -H "Authorization: Bearer {system_user_token}"
```

### Problemas Comuns

#### 1. Template não aprovado

```javascript
// Verificar status do template
GET /v20.0/{business_account_id}/message_templates
```

#### 2. Número não verificado

```javascript
// Verificar status do número
GET /v20.0/{phone_number_id}
```

#### 3. Token expirado

```javascript
// Renovar token no Meta Developers
// Ou gerar novo System User Token
```

#### 4. Webhook não funcionando

```javascript
// Testar webhook no Meta Developers Console
// Verificar se URL está acessível publicamente
// Verificar certificado SSL
```

### Logs e Debugging

```javascript
// Habilitar logs detalhados
const debug = true;

// Ver logs do AltClinic
tail -f server.log

// Ver webhooks recebidos
grep "webhook" server.log
```

---

## 🔒 Segurança e Compliance

### Requisitos de Segurança

- ✅ **HTTPS obrigatório** em produção
- ✅ **Certificado SSL válido**
- ✅ **Webhook verify token** único
- ✅ **System user token** criptografado
- ✅ **Rate limiting** implementado

### Compliance WhatsApp

- ✅ **Política de privacidade** clara
- ✅ **Opt-in obrigatório** para marketing
- ✅ **Opt-out fácil** para usuários
- ✅ **Dados criptografados** em trânsito e repouso

### Auditoria

```javascript
// Logs de auditoria obrigatórios
const auditLog = {
  timestamp: new Date(),
  action: "message_sent",
  user: "clinica_id",
  recipient: "+5511999999999",
  messageId: "message_id",
};
```

---

## 📈 Escalabilidade

### Arquitetura Recomendada

```
Load Balancer
    ├── Server 1 (Meta API 1)
    ├── Server 2 (Meta API 2)
    └── Server 3 (Meta API 3)
```

### Estratégias de Escalabilidade

- **Horizontal**: Múltiplas contas WhatsApp
- **Vertical**: Servidores mais potentes
- **Geográfica**: Servidores em múltiplas regiões
- **Cache**: Redis para sessões e tokens

### Monitoramento Avançado

```javascript
// Métricas importantes
const metrics = {
  messagesSent: 0,
  messagesReceived: 0,
  deliveryRate: 0.98,
  responseTime: 150, // ms
  errorRate: 0.02,
  uptime: 99.9,
};
```

---

## 🎯 Casos de Uso Empresariais

### Hospital/Clínica Grande

- **Volume**: 10.000+ mensagens/dia
- **Templates**: 50+ aprovados
- **Equipes**: Suporte 24/7
- **Integração**: CRM completo

### Rede de Clínicas

- **Filiais**: 20+ unidades
- **Número único**: WhatsApp principal
- **Roteamento**: Automático por filial
- **Relatórios**: Consolidados

### Telemedicina

- **Conformidade**: HIPAA/GDPR
- **Criptografia**: End-to-end
- **Auditoria**: Completa
- **Backup**: Geográfico

---

## 📞 Suporte Meta

### Canais de Suporte

- **Meta Business Support**: 24/7 para produção
- **Developer Community**: Fóruns e documentação
- **WhatsApp Business API**: Documentação técnica
- **Meta for Developers**: Tutoriais e guias

### SLA Meta

- **Disponibilidade**: 99.9% uptime garantido
- **Suporte**: Resposta em até 24h
- **Escalation**: Possível para casos críticos

---

## ✅ Checklist de Implementação

### Pré-implementação

- [ ] Conta Meta Business criada
- [ ] App Meta Developers configurado
- [ ] Número WhatsApp verificado
- [ ] Webhook URL configurada
- [ ] SSL certificado válido

### Configuração AltClinic

- [ ] Credenciais inseridas
- [ ] Webhook testado
- [ ] Templates criados
- [ ] Templates aprovados

### Ativação

- [ ] WhatsApp Business instalado
- [ ] Código de emparelhamento usado
- [ ] Conexão estabelecida
- [ ] Mensagem de teste enviada

### Produção

- [ ] Monitoramento ativo
- [ ] Alertas configurados
- [ ] Backup automático
- [ ] Documentação atualizada

---

## 🚨 Plano de Contingência

### Cenários de Falha

1. **Token expirado**: Processo de renovação automática
2. **Limite excedido**: Fallback para Evolution API
3. **Serviço indisponível**: Sistema de retry
4. **Número bloqueado**: Processo de recuperação

### Recuperação de Desastre

```javascript
// Estratégia de backup
const backupStrategy = {
  primary: "meta_api",
  secondary: "evolution_api",
  tertiary: "z_api",
  failoverTime: "30s",
  dataRetention: "90d",
};
```

---

**Status**: ✅ Pronto para produção
**Versão**: Meta WhatsApp Business API v20.0
**Última atualização**: Setembro 2025
