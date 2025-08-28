# Integração WhatsApp Business API — Documentação Completa

## 1. Visão Geral
Integração completa com WhatsApp Business API para comunicação automática, agendamentos e gestão financeira através do WhatsApp.

---

## 2. WhatsApp Business API - Funcionalidades

### 2.1. Mensagens Básicas
- **Envio de mensagens de texto**
- **Mensagens com mídia** (imagens, documentos, PDFs)
- **Templates aprovados** pela Meta
- **Mensagens interativas** (botões, listas)
- **Status de entrega** (enviado, entregue, lido)

### 2.2. Webhooks e Recebimento
- **Recebimento de mensagens** em tempo real
- **Status de entrega** via webhook
- **Mensagens de erro** e falhas
- **Eventos de conversa** (início, fim)

### 2.3. Templates de Negócio
- **Confirmação de agendamento**
- **Lembrete de consulta**
- **Cobrança e pagamento**
- **Resultado de exames**
- **Promoções e ofertas**

---

## 3. Sistema de Agendamentos via WhatsApp

### 3.1. Fluxo de Agendamento
1. **Paciente solicita agendamento** via WhatsApp
2. **Bot responde com horários disponíveis** (botões interativos)
3. **Paciente seleciona horário**
4. **Sistema confirma e bloqueia horário**
5. **Envio de confirmação** com detalhes
6. **Lembretes automáticos** (24h, 2h antes)

### 3.2. Mensagens Interativas
```javascript
// Exemplo de mensagem com botões para agendamento
{
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": {
      "text": "Horários disponíveis para Dr. Silva:"
    },
    "action": {
      "buttons": [
        {"id": "slot_1", "title": "14:00 - Ter 29/08"},
        {"id": "slot_2", "title": "15:30 - Ter 29/08"},
        {"id": "slot_3", "title": "09:00 - Qua 30/08"}
      ]
    }
  }
}
```

### 3.3. Gestão de Agenda
- **Slots de horários** disponíveis/ocupados
- **Bloqueio automático** ao confirmar
- **Reagendamento** via WhatsApp
- **Cancelamento** com política de prazo
- **Lista de espera** para horários concorridos

---

## 4. Gestão Financeira via WhatsApp

### 4.1. Cobrança e Pagamento
- **Envio de cobranças** automáticas
- **Links de pagamento** (PIX, cartão)
- **Confirmação de pagamento**
- **Parcelamento** e condições especiais
- **Lembretes de vencimento**

### 4.2. Templates Financeiros
```javascript
// Template de cobrança
{
  "name": "cobranca_consulta",
  "language": "pt_BR",
  "components": [
    {
      "type": "BODY",
      "parameters": [
        {"type": "text", "text": "{{nome_paciente}}"},
        {"type": "text", "text": "{{valor}}"},
        {"type": "text", "text": "{{data_vencimento}}"},
        {"type": "text", "text": "{{link_pagamento}}"}
      ]
    }
  ]
}
```

### 4.3. Integração com Gateway de Pagamento
- **Geração de PIX** automático
- **Links de pagamento** seguros
- **Webhook de confirmação** de pagamento
- **Conciliação automática**
- **Envio de recibos** via WhatsApp

---

## 5. Estrutura Técnica

### 5.1. Configuração da API
```javascript
// Configuração base
const whatsappConfig = {
  phoneNumberId: "PHONE_NUMBER_ID",
  accessToken: "ACCESS_TOKEN",
  webhookToken: "WEBHOOK_VERIFY_TOKEN",
  apiVersion: "v18.0",
  baseUrl: "https://graph.facebook.com"
}
```

### 5.2. Componentes Frontend
- `WhatsAppDashboard.js`: Dashboard principal da integração
- `TemplateManager.js`: Gestão de templates
- `ConversationView.js`: Visualização de conversas
- `AgendamentoWhatsApp.js`: Interface de agendamentos
- `CobrancaWhatsApp.js`: Gestão de cobranças
- `WebhookMonitor.js`: Monitor de webhooks em tempo real

### 5.3. Hooks Especializados
- `useWhatsAppAPI.js`: Comunicação com API
- `useWhatsAppTemplates.js`: Gestão de templates
- `useAgendamentoWhatsApp.js`: Lógica de agendamentos
- `useCobrancaWhatsApp.js`: Gestão financeira
- `useWhatsAppWebhook.js`: Processamento de webhooks

---

## 6. Fluxos Integrados

### 6.1. Agendamento Completo
1. **Solicitação** → Bot responde com horários
2. **Seleção** → Sistema bloqueia e confirma
3. **Lembrete** → Automação 24h antes
4. **Check-in** → Confirmação de chegada
5. **Pós-consulta** → Avaliação e próximos passos

### 6.2. Cobrança Automática
1. **Consulta realizada** → Sistema gera cobrança
2. **Envio automático** → WhatsApp com link de pagamento
3. **Acompanhamento** → Lembretes automáticos
4. **Confirmação** → Recibo via WhatsApp
5. **Integração** → Atualização no CRM

---

## 7. Implementação por Etapas

### **Fase 1: Base WhatsApp Business**
- Configuração da API
- Envio/recebimento básico
- Templates iniciais
- Dashboard de conversas

### **Fase 2: Agendamentos**
- Interface de slots
- Mensagens interativas
- Fluxo completo de agendamento
- Lembretes automáticos

### **Fase 3: Gestão Financeira**
- Templates de cobrança
- Integração com pagamentos
- Automação de cobranças
- Conciliação automática

### **Fase 4: Automações Avançadas**
- Chatbot inteligente
- Fluxos condicionais
- Integração com IA
- Analytics avançado
