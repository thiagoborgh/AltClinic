# 🚀 Guia Completo: WhatsApp Business API (Meta) - AltClinic

## 📋 Pré-requisitos

- Conta no Facebook Business Manager
- Número de telefone dedicado para WhatsApp Business
- Domínio próprio (recomendado para produção)
- Aplicação Node.js rodando

## 📱 Passo 1: Criar Aplicação no Facebook Developers

### 1.1 Acesse o Facebook Developers

1. Vá para: https://developers.facebook.com/
2. Faça login com sua conta Facebook
3. Clique em **"My Apps"** no menu superior direito

### 1.2 Criar Nova Aplicação

1. Clique em **"Create App"**
2. Selecione **"Business"** como tipo de app
3. Preencha os detalhes:
   - **App Name:** `AltClinic WhatsApp`
   - **App Contact Email:** seu-email@clinica.com
   - **Business Account:** Selecione sua conta business (ou crie uma nova)

### 1.3 Configurar Produto WhatsApp

1. Na dashboard do app, clique em **"Add Product"**
2. Procure por **"WhatsApp"** e clique em **"Set Up"**
3. Leia e aceite os termos de serviço

## 🔧 Passo 2: Configurar Webhook

### 2.1 Configurar URL de Callback

1. Vá para **"WhatsApp" → "Configuration"** no menu lateral
2. Em **"Webhook"**, clique em **"Add Callback URL"**
3. Configure:
   - **Callback URL:** `https://seudominio.com/api/whatsapp/webhook/meta`
   - **Verify Token:** `altclinic_webhook_verify_2025`

### 2.2 Selecionar Eventos

Marque estes eventos para receber notificações:

- ✅ `messages` - Receber mensagens dos pacientes
- ✅ `message_deliveries` - Status de entrega das mensagens
- ✅ `message_status` - Status de leitura das mensagens

### 2.3 Testar Webhook

1. Clique em **"Test"** para verificar se a URL está respondendo
2. Deve retornar status 200 OK

## 🔑 Passo 3: Criar System User e Access Token

### 3.1 Acessar Business Manager

1. Vá para: https://business.facebook.com/
2. Certifique-se de estar na conta business correta

### 3.2 Criar System User

1. No menu lateral, vá para **"Users" → "System Users"**
2. Clique em **"Add"** para criar um novo usuário do sistema
3. Dê um nome: `AltClinic WhatsApp Bot`
4. Atribua a função: **"Manage WhatsApp"**

### 3.3 Gerar Access Token

1. Clique no usuário criado
2. Vá para a aba **"Assign Assets"**
3. Selecione seu app do Facebook Developers
4. Marque a permissão: **"whatsapp_business_management"**
5. Clique em **"Generate Token"**
6. **IMPORTANTE:** Copie o token imediatamente (não poderá vê-lo novamente!)

## 📞 Passo 4: Configurar Número de Telefone

### 4.1 Adicionar Número

1. Volte ao Facebook Developers
2. Vá para **"WhatsApp" → "Getting Started"**
3. Clique em **"Add Phone Number"**
4. Digite o número da clínica (formato internacional: +5511999999999)

### 4.2 Verificar Número

1. Escolha o método de verificação:
   - **SMS:** Receberá um código por SMS
   - **Voice:** Receberá uma chamada com código de voz
2. Digite o código de 6 dígitos

### 4.3 Anotar IDs

Após verificação, anote:

- **Phone Number ID:** (ex: 123456789012345)
- **WhatsApp Business Account ID:** (ex: 123456789012345)

## ⚙️ Passo 5: Configurar Variáveis de Ambiente

### 5.1 Criar ou editar .env

```bash
# WhatsApp Business API (Meta)
WA_APP_ID=1234567890123456
WA_SYSTEM_USER_TOKEN=EAAKk8xYZ...[token completo aqui]
WA_WEBHOOK_VERIFY_TOKEN=altclinic_webhook_verify_2025
WA_PHONE_NUMBER_ID=123456789012345
WA_BUSINESS_ACCOUNT_ID=123456789012345
```

### 5.2 Reiniciar Aplicação

```bash
npm restart
# ou
pm2 restart altclinic
```

## 🧪 Passo 6: Testar Configuração

### 6.1 Verificar Status da API

```bash
curl -X GET "https://graph.facebook.com/v20.0/{WA_PHONE_NUMBER_ID}" \
  -H "Authorization: Bearer {WA_SYSTEM_USER_TOKEN}"
```

### 6.2 Testar no Frontend

1. Acesse: `http://localhost:3001/configuracoes`
2. Vá para a seção **"WhatsApp"**
3. Digite o número da clínica
4. Clique em **"Ativar WhatsApp"**
5. Escaneie o QR Code no WhatsApp Business App

### 6.3 Enviar Mensagem de Teste

```bash
curl -X POST "https://graph.facebook.com/v20.0/{WA_PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer {WA_SYSTEM_USER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "5511999999999",
    "type": "text",
    "text": {
      "body": "Olá! Esta é uma mensagem de teste da AltClinic."
    }
  }'
```

## 📋 Templates de Mensagem

### Como Criar Templates

1. No Facebook Developers → WhatsApp → Message Templates
2. Clique **"Create Template"**
3. Escolha categoria: **"Utility"** ou **"Marketing"**
4. Crie templates para:
   - Confirmação de consulta
   - Lembrete de consulta
   - Cancelamento de consulta
   - Recibo de pagamento

### Exemplo de Template

```
Nome: consulta_confirmada
Linguagem: pt_BR
Categoria: Utility
Corpo: Olá {{1}}! Sua consulta está confirmada para {{2}} às {{3}}.
```

## 🚨 Solução de Problemas

### Erro: "Invalid Access Token"

- Verifique se o token foi copiado corretamente
- Gere um novo token no Business Manager

### Erro: "Phone Number Not Verified"

- Verifique se o número foi adicionado e verificado
- Aguarde alguns minutos após verificação

### Erro: "Webhook Verification Failed"

- Certifique-se de que o servidor está rodando
- Verifique se a URL do webhook está acessível publicamente
- Confirme o verify token no código

### Erro: "Rate Limit Exceeded"

- Aguarde alguns minutos
- Reduza a frequência de mensagens
- Considere upgrade para tier pago

## 💰 Custos e Limites

### Gratuito (Desenvolvimento)

- Até 5 números de teste
- 250 mensagens/dia por número
- 10 templates para aprovação

### Produção

- $0.005 por mensagem (conversação)
- $0.008 por mensagem (utilitária)
- Templates gratuitos (sujeito aprovação)

## 🔄 Próximos Passos

1. **Testar Integração Completa**

   - Envio de mensagens
   - Recebimento de mensagens
   - Webhooks funcionando

2. **Configurar Templates**

   - Criar templates aprovados
   - Implementar automação

3. **Monitoramento**

   - Logs de mensagens
   - Status de entrega
   - Métricas de uso

4. **Produção**
   - Migrar para domínio HTTPS
   - Configurar monitoramento
   - Backup de tokens

---

## 📞 Suporte

- **Documentação Oficial:** https://developers.facebook.com/docs/whatsapp/
- **Business Manager:** https://business.facebook.com/
- **Status da API:** https://developers.facebook.com/status/

Para dúvidas específicas do AltClinic, consulte a documentação interna ou abra uma issue no repositório.
