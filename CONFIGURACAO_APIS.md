# 🚀 SAAE - Guia de Configuração das APIs Gratuitas

Este guia mostra como configurar todas as integrações gratuitas para o MVP do SAAE.

## 📱 1. Google Gemini (IA Principal - GRATUITO)

### Recursos:

- ✅ 15 requisições por minuto gratuitamente
- ✅ Análise de texto e imagens
- ✅ Respostas naturais para bot
- ✅ Análise de prontuários

### Como configurar:

1. Acesse: https://makersuite.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada
5. Cole no arquivo `.env`: `GEMINI_API_KEY=sua_chave_aqui`

## 🤗 2. Hugging Face (IA Secundária - GRATUITO)

### Recursos:

- ✅ Backup para quando Gemini não estiver disponível
- ✅ Modelos de classificação de texto
- ✅ Análise de sentimentos
- ✅ 1000 requisições/mês grátis

### Como configurar:

1. Acesse: https://huggingface.co/settings/tokens
2. Crie uma conta gratuita
3. Clique em "New token"
4. Dê um nome (ex: "SAAE-Token")
5. Escolha "Read"
6. Cole no arquivo `.env`: `HUGGINGFACE_API_KEY=sua_chave_aqui`

## 📱 3. Twilio WhatsApp (GRATUITO para desenvolvimento)

### Recursos:

- ✅ WhatsApp oficial via API
- ✅ Sandbox gratuito para testes
- ✅ Webhook para receber mensagens
- ✅ Mais estável que WhatsApp Web.js

### Como configurar:

1. Acesse: https://console.twilio.com/
2. Crie uma conta gratuita ($15 de crédito inicial)
3. Vá em "Messaging" > "Try it out" > "Send a WhatsApp message"
4. Configure o sandbox seguindo as instruções
5. Copie as credenciais:
   - Account SID: `TWILIO_ACCOUNT_SID=sua_sid_aqui`
   - Auth Token: `TWILIO_AUTH_TOKEN=sua_token_aqui`
   - Phone Number: `TWILIO_PHONE_NUMBER=whatsapp:+14155238886`

### Configuração do Webhook:

1. No console Twilio, vá em "Messaging" > "Settings" > "WhatsApp sandbox settings"
2. Em "When a message comes in", coloque: `https://seu-dominio.com/webhook/twilio`
3. Método: POST

## 🤖 4. Telegram Bot (TOTALMENTE GRATUITO)

### Recursos:

- ✅ Completamente gratuito
- ✅ APIs robustas
- ✅ Webhooks inclusos
- ✅ Suporte a mídia

### Como configurar:

1. Abra o Telegram
2. Procure por @BotFather
3. Digite `/newbot`
4. Escolha um nome para seu bot (ex: "SAAE Clínica Bot")
5. Escolha um username (ex: "saae_clinica_bot")
6. Copie o token gerado
7. Cole no arquivo `.env`: `TELEGRAM_BOT_TOKEN=sua_token_aqui`

## 📧 5. Mailchimp (GRATUITO até 2000 contatos)

### Recursos:

- ✅ 2000 contatos gratuitos
- ✅ 10000 emails/mês
- ✅ Automações básicas
- ✅ Formulários de captura

### Como configurar:

1. Acesse: https://mailchimp.com/
2. Crie uma conta gratuita
3. Vá em "Account" > "Extras" > "API keys"
4. Clique em "Create A Key"
5. Copie a chave e o server prefix (ex: us1, us2, etc.)
6. Crie uma lista de contatos em "Audience" > "All contacts"
7. Copie o List ID em "Settings" > "Audience name and defaults"
8. Configure no `.env`:
   ```
   MAILCHIMP_API_KEY=sua_chave_aqui
   MAILCHIMP_SERVER_PREFIX=us1
   MAILCHIMP_LIST_ID=sua_lista_id
   ```

## 🔧 6. WhatsApp Web.js (Alternativa gratuita)

### Recursos:

- ✅ Totalmente gratuito
- ✅ Usa WhatsApp Web
- ✅ QR Code para conectar
- ⚠️ Menos estável que Twilio

### Como usar:

1. Inicie o servidor: `npm run dev`
2. Aguarde aparecer o QR Code no terminal
3. Escaneie com seu WhatsApp
4. O bot estará conectado automaticamente

## 🚀 Ordem de Prioridade para MVP

### 1. **Essenciais (Configure primeiro):**

- ✅ Google Gemini (IA principal)
- ✅ Telegram Bot (mais fácil de configurar)
- ✅ WhatsApp Web.js (backup gratuito)

### 2. **Recomendados:**

- ✅ Hugging Face (backup de IA)
- ✅ Mailchimp (CRM de email)

### 3. **Avançados:**

- ✅ Twilio WhatsApp (para produção)

## 📱 Testando as Integrações

### Teste do Gemini:

```bash
# No terminal do servidor, procure por:
✅ Google Gemini configurado e funcionando
```

### Teste do Telegram:

1. Procure seu bot no Telegram
2. Digite `/start`
3. Deve responder automaticamente

### Teste do WhatsApp:

1. Escaneie o QR Code que aparece no terminal
2. Envie uma mensagem para o número conectado
3. Deve responder automaticamente

## 🔒 Segurança

- ⚠️ Nunca commite o arquivo `.env` no Git
- ✅ Use variáveis de ambiente em produção
- ✅ Regenere todas as chaves em produção
- ✅ Configure rate limiting adequado

## 💡 Dicas Importantes

1. **Gemini**: Limite de 15 req/min - ideal para MVP
2. **Telegram**: Mais confiável que WhatsApp Web.js
3. **Twilio**: Use apenas quando tiver tráfego real
4. **Mailchimp**: Ótimo para campanhas de reativação
5. **Hugging Face**: Use modelos pequenos para rapidez

## 🆘 Suporte

Se tiver problemas:

1. Verifique os logs do servidor: `npm run dev`
2. Teste uma API por vez
3. Verifique se as chaves estão corretas no `.env`
4. Consulte a documentação oficial de cada serviço

---

**🎉 Com essas configurações, seu MVP estará 100% funcional e gratuito!**
