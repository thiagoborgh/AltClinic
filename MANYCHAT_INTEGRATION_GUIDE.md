# ManyChat API Integration Guide

## Configuração da API ManyChat

### Credenciais

- **Page ID**: 9353710
- **API Token**: 8f05258497356cfe8a039e79200b2af4
- **Base URL**: https://api.manychat.com

### Endpoints Principais

#### 1. Enviar Mensagens

```
POST https://api.manychat.com/fb/sending/sendContent
```

#### 2. Gerenciar Subscribers

```
GET https://api.manychat.com/fb/subscriber/getInfo
POST https://api.manychat.com/fb/subscriber/setCustomField
```

#### 3. Criar Tags

```
POST https://api.manychat.com/fb/subscriber/addTag
POST https://api.manychat.com/fb/subscriber/removeTag
```

### Headers Necessários

```
Content-Type: application/json
Authorization: Bearer 8f05258497356cfe8a039e79200b2af4
```

### Exemplos de Uso

#### Enviar Mensagem de Texto

```json
{
  "subscriber_id": "SUBSCRIBER_ID",
  "data": {
    "version": "v2",
    "content": {
      "messages": [
        {
          "type": "text",
          "text": "Olá! Seu agendamento foi confirmado para amanhã às 14h."
        }
      ]
    }
  }
}
```

#### Enviar Mensagem com Botões

```json
{
  "subscriber_id": "SUBSCRIBER_ID",
  "data": {
    "version": "v2",
    "content": {
      "messages": [
        {
          "type": "cards",
          "elements": [
            {
              "title": "Confirmação de Agendamento",
              "subtitle": "Dr. João Silva - 15/10/2025 às 14:00",
              "buttons": [
                {
                  "type": "postback",
                  "title": "Confirmar",
                  "payload": "CONFIRM_APPOINTMENT"
                },
                {
                  "type": "postback",
                  "title": "Reagendar",
                  "payload": "RESCHEDULE_APPOINTMENT"
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

### Casos de Uso para Clínica

1. **Confirmação de Agendamentos**
2. **Lembretes de Consulta**
3. **Cancelamentos e Reagendamentos**
4. **Resultados de Exames**
5. **Cobrança de Pagamentos**
6. **Pesquisas de Satisfação**

### Variáveis Personalizadas

Para cada paciente, podemos criar:

- `nome_paciente`
- `proximo_agendamento`
- `medico_responsavel`
- `valor_consulta`
- `data_nascimento`

### Webhooks

Configure webhooks no ManyChat para receber:

- Respostas dos pacientes
- Status de entrega das mensagens
- Novos subscribers
