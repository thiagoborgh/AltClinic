# 🚀 WhatsApp Business API - Multi-Tenant (Atualizado)

## 📋 Visão Geral

O sistema AltClinic agora suporta **WhatsApp Business API multi-tenant**, permitindo que **cada clínica configure seu próprio número** de WhatsApp Business usando credenciais individuais da Meta.

### ✅ Benefícios

- **Cada clínica** tem seu próprio número WhatsApp
- **Credenciais isoladas** por tenant (clínica)
- **Configuração independente** - uma clínica não afeta a outra
- **Segurança aprimorada** - tokens criptografados no banco
- **Escalabilidade** - suporta centenas de clínicas

## 🏗️ Arquitetura Técnica

### Banco de Dados

```sql
CREATE TABLE whatsapp_tokens (
  client_id INTEGER PRIMARY KEY, -- ID único da clínica
  phone_id TEXT,                 -- Phone Number ID da Meta
  phone_number TEXT,             -- Número formatado (+55...)
  token TEXT,                    -- Token criptografado (AES-256)

  -- Credenciais específicas por tenant
  wa_app_id TEXT,                -- App ID do Facebook Developers
  wa_system_user_token TEXT,     -- System User Token (criptografado)
  wa_webhook_verify_token TEXT,  -- Webhook verify token
  wa_business_account_id TEXT,   -- Business Account ID (opcional)

  status TEXT DEFAULT 'not_configured',
  created_at DATETIME,
  updated_at DATETIME
);
```

### Endpoints Atualizados

#### `POST /api/whatsapp/configure`

Configura credenciais da Meta API para o tenant atual.

**Payload:**

```json
{
  "waAppId": "1234567890123456",
  "waSystemUserToken": "EAAKk8xYZ...[token completo]",
  "waWebhookVerifyToken": "altclinic_webhook_verify_2025",
  "waBusinessAccountId": "123456789012345",
  "phoneNumber": "+5511999999999"
}
```

#### `GET /api/whatsapp/configuration`

Retorna configuração atual do tenant.

#### `POST /api/whatsapp/activate`

Ativa WhatsApp usando credenciais do tenant.

#### `POST /api/whatsapp/send`

Envia mensagens usando credenciais do tenant.

## 🔄 Fluxo de Configuração

### Para Cada Clínica:

1. **Criar conta no Facebook Business Manager**
2. **Criar app no Facebook Developers**
3. **Adicionar produto WhatsApp**
4. **Configurar webhook** (URL compartilhada, mas token por tenant)
5. **Criar System User e obter tokens**
6. **Adicionar e verificar número de telefone**
7. **Configurar credenciais no AltClinic**

### Interface do Usuário:

```
Configurações > WhatsApp >
├── Configuração da Meta API
│   ├── WA_APP_ID: _______________
│   ├── WA_SYSTEM_USER_TOKEN: ____
│   ├── WA_WEBHOOK_VERIFY_TOKEN: _
│   ├── WA_BUSINESS_ACCOUNT_ID: __
│   └── Número do WhatsApp: ______
│
└── [Salvar Credenciais] → [Ativar WhatsApp]
```

## 🔐 Segurança

- **Criptografia AES-256** para tokens sensíveis
- **Isolamento por tenant** - credenciais não são compartilhadas
- **Webhook seguro** - identifica tenant pelo phone_id
- **Validação rigorosa** de tokens e permissões

## 🌐 Webhook Multi-Tenant

O webhook `/api/whatsapp/webhook/meta` agora:

1. Recebe atualizações da Meta
2. Identifica o tenant pelo `phone_id`
3. Criptografa e salva o token no tenant correto
4. Atualiza status para `active`

**Exemplo de payload do webhook:**

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "field": "phone_number",
          "value": {
            "token": "new_access_token_here",
            "metadata": {
              "phone_number_id": "123456789012345"
            }
          }
        }
      ]
    }
  ]
}
```

## 📊 Limites e Custos

### Por Clínica:

- **Trial:** 100 mensagens/mês (grátis)
- **Starter:** 500 mensagens/mês (R$ 29,90)
- **Professional:** 2.500 mensagens/mês (R$ 99,90)
- **Enterprise:** 10.000 mensagens/mês (R$ 299,90)

### Meta API:

- **Desenvolvimento:** 250 mensagens/dia grátis
- **Produção:** $0.005 por mensagem (conversação)

## 🚀 Migração

### Para Clínicas Existentes:

1. Acessar configurações do WhatsApp
2. Preencher credenciais da Meta API
3. Salvar configuração
4. Ativar WhatsApp normalmente

### Para Novas Clínicas:

1. Seguir fluxo normal de configuração
2. Credenciais são obrigatórias antes da ativação

## 🧪 Testes

### Script de Teste Atualizado:

```bash
# Para testar uma clínica específica
node test-whatsapp-meta.js --tenant [tenant_slug]
```

### Validações:

- ✅ Credenciais obrigatórias por tenant
- ✅ Criptografia funcionando
- ✅ Webhook identificando tenant correto
- ✅ Mensagens enviadas com token correto
- ✅ Isolamento entre tenants

## 📞 Suporte

- **Documentação Técnica:** Este arquivo
- **Guia de Setup:** `WHATSAPP_META_SETUP.md`
- **Suporte Meta:** https://developers.facebook.com/docs/whatsapp/

---

**Status:** ✅ Implementado e funcional
**Versão:** 2.0 - Multi-Tenant
**Data:** Setembro 2025
