# 🔧 Manual Técnico - Configurações por Seção

## 🎯 Guia Completo de Configuração do Sistema AltClinic

---

## 🤖 **SEÇÃO AI - INTELIGÊNCIA ARTIFICIAL**

### Claude AI (Anthropic)

```
claude_api_key: sk-ant-xxxxx (Chave da API)
claude_model: claude-3-sonnet-20240229 (Modelo recomendado)
claude_max_tokens: 4000 (Limite de tokens por requisição)
claude_ativo: true/false (Ativar serviço)
```

### Google Gemini

```
gemini_api_key: AIzaSyxxxxx (Chave da API do Google)
```

### Hugging Face

```
huggingface_api_key: hf_xxxxx (Token de acesso)
```

**🏢 Responsável**: Altclinic  
**📋 Ação**: Configurar durante setup inicial

---

## 👥 **SEÇÃO CRM - GESTÃO DE PACIENTES**

### Período de Inatividade

```
periodo_inatividade: 90 (dias para considerar paciente inativo)
```

**👤 Responsável**: Usuário Contratante  
**📋 Ação**: Definir política da clínica  
**💡 Sugestão**: 60-120 dias dependendo da especialidade

---

## 📧 **SEÇÃO EMAIL**

### Configurações SMTP

```
smtp_host: smtp.gmail.com (Servidor SMTP)
smtp_port: 587 (Porta padrão TLS)
smtp_secure: true (Usar SSL/TLS)
smtp_user: seu-email@gmail.com (Usuário)
smtp_password: sua-senha-app (Senha de aplicativo)
```

### Mailchimp

```
mailchimp_api_key: xxxxx-us1 (Chave da API)
mailchimp_server_prefix: us1 (Prefixo do servidor)
mailchimp_list_id: xxxxxx (ID da lista)
mailchimp_from_email: contato@clinica.com (Email remetente)
mailchimp_from_name: Clínica XYZ (Nome remetente)
mailchimp_ativo: true/false (Ativar serviço)
```

**🏢 SMTP**: Altclinic (configuração técnica)  
**👤 Mailchimp Dados**: Usuário (dados específicos)  
**🤝 Mailchimp API**: Compartilhado (conta própria ou corporativa)

---

## 🔗 **SEÇÃO INTEGRAÇÕES**

### Twilio (SMS/WhatsApp Business)

```
twilio_account_sid: ACxxxxx (SID da conta)
twilio_auth_token: xxxxx (Token de autenticação)
twilio_whatsapp_number: +5511999999999 (Número da clínica)
```

### Telegram

```
telegram_bot_token: 123456:ABCxxxxx (Token do bot)
telegram_chat_id: -100xxxxxx (ID do chat da clínica)
telegram_ativo: true/false (Ativar serviço)
```

**🏢 Tokens/APIs**: Altclinic  
**👤 Dados específicos**: Usuário (números, chat IDs)

---

## 🔒 **SEÇÃO LGPD**

### Termo de Consentimento

```
texto_consentimento: "Eu autorizo o tratamento dos meus dados pessoais..."
```

**👤 Responsável**: Usuário Contratante  
**📋 Ação**: Elaborar termo específico da clínica  
**⚖️ Recomendação**: Consultar advogado especializado

---

## 💰 **SEÇÃO PIX**

### Configurações Financeiras

```
chave_pix: contato@clinica.com (Chave PIX)
banco: Banco do Brasil (Nome do banco)
nome_titular: Clínica XYZ Ltda (Nome do titular)
```

**👤 Responsável**: Usuário Contratante  
**📋 Ação**: Fornecer dados bancários  
**🔐 Segurança**: Dados criptografados no banco

---

## ⚙️ **SEÇÃO SISTEMA**

### Configurações Técnicas

```
ambiente: production (development/production)
debug_mode: false (true/false)
log_level: info (error/warn/info/debug)
max_upload_size: 10485760 (10MB em bytes)
```

### Agendamentos (Cron Jobs)

```
cron_confirmacao: 0 8 * * * (Todo dia às 8h)
cron_lembretes: 0 18 * * * (Todo dia às 18h)
cron_relatorios: 0 6 * * 1 (Segunda-feira às 6h)
cron_verificacao_inativos: 0 2 * * 0 (Domingo às 2h)
```

**🏢 Responsável**: Altclinic  
**📋 Ação**: Configurar durante setup  
**⚙️ Formato**: Expressões cron padrão

---

## 📱 **SEÇÃO WHATSAPP**

### Configurações da API

```
api_token: xxxxx (Token da API)
auto_init: true (Inicialização automática)
qr_timeout: 60000 (60 segundos)
session_path: ./sessions (Caminho das sessões)
webhook_url: https://api.clinica.com/webhook (URL do webhook)
```

**🏢 Responsável**: Altclinic  
**📋 Ação**: Configurar integração WhatsApp Web  
**🔄 Processo**: QR Code gerado automaticamente

---

## 📊 **Checklist de Configuração**

### ✅ **Setup Inicial (Altclinic)**

- [ ] Configurar APIs de IA (Claude, Gemini, Hugging Face)
- [ ] Configurar SMTP corporativo
- [ ] Configurar Twilio e Telegram
- [ ] Configurar sistema e cron jobs
- [ ] Configurar WhatsApp Web integration
- [ ] Testar todas as integrações

### ✅ **Personalização (Usuário)**

- [ ] Definir período de inatividade de pacientes
- [ ] Elaborar termo de consentimento LGPD
- [ ] Fornecer dados PIX da clínica
- [ ] Configurar dados de contato (emails, números)
- [ ] Testar recebimento de mensagens

### ✅ **Ativação (Compartilhado)**

- [ ] Ativar serviços desejados
- [ ] Configurar Mailchimp (se aplicável)
- [ ] Conectar WhatsApp via QR Code
- [ ] Verificar funcionamento end-to-end

---

## 🚨 **Troubleshooting Comum**

### WhatsApp não conecta

1. Gerar novo QR Code
2. Verificar timeout (padrão 60s)
3. Limpar sessões antigas

### Emails não enviados

1. Verificar configurações SMTP
2. Testar credenciais
3. Verificar firewall/portas

### APIs não respondem

1. Verificar chaves de API
2. Verificar limites de uso
3. Verificar status dos serviços

---

## 📞 **Suporte por Seção**

| Seção                 | Responsável   | Contato                       |
| --------------------- | ------------- | ----------------------------- |
| AI, SISTEMA, WHATSAPP | Altclinic     | suporte-tecnico@altclinic.com |
| CRM, LGPD, PIX        | Usuário       | suporte@altclinic.com         |
| INTEGRAÇÕES           | Compartilhado | suporte@altclinic.com         |

---

_Manual Técnico v1.0 - Setembro 2025_
