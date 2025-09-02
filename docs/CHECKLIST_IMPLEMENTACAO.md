# ✅ Checklist de Implementação - Configurações AltClinic

## 🎯 Guia para Equipe Técnica e Cliente

---

## 🚀 **FASE 1: SETUP INICIAL (ALTCLINIC)**

### 🤖 **Configurações de IA**
- [ ] **Claude AI**
  - [ ] Obter API key da Anthropic
  - [ ] Configurar `claude_api_key`
  - [ ] Definir `claude_model` (recomendado: claude-3-sonnet-20240229)
  - [ ] Configurar `claude_max_tokens` (4000)
  - [ ] Testar conexão com API

- [ ] **Google Gemini**
  - [ ] Obter API key do Google Cloud
  - [ ] Configurar `gemini_api_key`
  - [ ] Testar requisições

- [ ] **Hugging Face**
  - [ ] Obter token de acesso
  - [ ] Configurar `huggingface_api_key`
  - [ ] Validar acesso aos modelos

### 📧 **Configurações de Email**
- [ ] **SMTP Corporativo**
  - [ ] Configurar servidor SMTP
  - [ ] Definir `smtp_host`, `smtp_port`, `smtp_secure`
  - [ ] Configurar credenciais `smtp_user`, `smtp_password`
  - [ ] Testar envio de email

### 🔗 **Integrações Corporativas**
- [ ] **Twilio**
  - [ ] Obter conta Twilio
  - [ ] Configurar `twilio_account_sid`
  - [ ] Configurar `twilio_auth_token`
  - [ ] Testar envio de SMS

- [ ] **Telegram**
  - [ ] Criar bot no Telegram
  - [ ] Configurar `telegram_bot_token`
  - [ ] Testar envio de mensagens

### ⚙️ **Configurações de Sistema**
- [ ] **Ambiente**
  - [ ] Definir `ambiente` (production)
  - [ ] Configurar `debug_mode` (false)
  - [ ] Definir `log_level` (info)
  - [ ] Configurar `max_upload_size`

- [ ] **Cron Jobs**
  - [ ] Configurar `cron_confirmacao`
  - [ ] Configurar `cron_lembretes`
  - [ ] Configurar `cron_relatorios`
  - [ ] Configurar `cron_verificacao_inativos`

### 📱 **WhatsApp Integration**
- [ ] **API Setup**
  - [ ] Configurar WhatsApp Web.js
  - [ ] Definir `session_path`
  - [ ] Configurar `qr_timeout`
  - [ ] Configurar `webhook_url`
  - [ ] Testar geração de QR Code

---

## 👤 **FASE 2: DADOS DO CLIENTE (USUÁRIO)**

### 📋 **Informações Necessárias do Cliente**
- [ ] **Dados da Clínica**
  - [ ] Nome completo da clínica
  - [ ] CNPJ
  - [ ] Endereço completo
  - [ ] Telefone principal
  - [ ] Email principal

- [ ] **Dados Financeiros (PIX)**
  - [ ] Chave PIX preferida
  - [ ] Nome do banco
  - [ ] Nome do titular da conta
  - [ ] Verificar se dados estão corretos

- [ ] **Políticas da Clínica**
  - [ ] Período para considerar paciente inativo (dias)
  - [ ] Horários de funcionamento
  - [ ] Políticas de cancelamento

- [ ] **Comunicação**
  - [ ] Número WhatsApp da clínica
  - [ ] ID do chat Telegram (se usado)
  - [ ] Email para campanhas Mailchimp

### 🔒 **LGPD - Termo de Consentimento**
- [ ] **Elaboração do Termo**
  - [ ] Cliente elabora texto específico
  - [ ] Revisão jurídica recomendada
  - [ ] Configurar `texto_consentimento`
  - [ ] Testar exibição no sistema

---

## 🤝 **FASE 3: CONFIGURAÇÃO COMPARTILHADA**

### 📧 **Mailchimp (Opcional)**
- [ ] **Decisão de Implementação**
  - [ ] Cliente quer usar Mailchimp próprio?
  - [ ] Usar conta corporativa Altclinic?
  - [ ] Não usar Mailchimp?

- [ ] **Se Conta Própria do Cliente:**
  - [ ] Cliente fornece `mailchimp_api_key`
  - [ ] Cliente fornece `mailchimp_server_prefix`
  - [ ] Cliente fornece `mailchimp_list_id`
  - [ ] Testar integração

- [ ] **Se Conta Corporativa:**
  - [ ] Altclinic configura API keys
  - [ ] Cliente fornece dados de remetente
  - [ ] Criar lista específica do cliente

### 🔄 **Ativação de Serviços**
- [ ] **Definir quais serviços ativar:**
  - [ ] `claude_ativo` - IA para análises
  - [ ] `telegram_ativo` - Notificações Telegram
  - [ ] `mailchimp_ativo` - Campanhas de email

---

## 🔧 **FASE 4: TESTES E VALIDAÇÃO**

### ✅ **Testes de Sistema**
- [ ] **WhatsApp**
  - [ ] Gerar QR Code
  - [ ] Conectar dispositivo
  - [ ] Enviar mensagem teste
  - [ ] Verificar recebimento

- [ ] **Email/SMTP**
  - [ ] Enviar email teste
  - [ ] Verificar recebimento
  - [ ] Testar templates

- [ ] **Integrações**
  - [ ] Testar Twilio (SMS)
  - [ ] Testar Telegram (se ativo)
  - [ ] Testar Mailchimp (se ativo)

- [ ] **IA/APIs**
  - [ ] Testar Claude AI
  - [ ] Testar outras APIs ativas
  - [ ] Verificar limites e quotas

### 🔍 **Testes End-to-End**
- [ ] **Fluxo Completo de Paciente**
  - [ ] Cadastrar paciente teste
  - [ ] Agendar consulta
  - [ ] Testar lembretes automáticos
  - [ ] Testar confirmações

- [ ] **Configurações no Frontend**
  - [ ] Acessar página de configurações
  - [ ] Verificar todas as seções carregadas
  - [ ] Testar alteração de configurações
  - [ ] Verificar salvamento no banco

---

## 📊 **FASE 5: DOCUMENTAÇÃO E ENTREGA**

### 📝 **Documentação para Cliente**
- [ ] **Manual de Uso**
  - [ ] Como acessar configurações
  - [ ] Como conectar WhatsApp
  - [ ] Como alterar configurações permitidas

- [ ] **Credenciais e Acessos**
  - [ ] Login administrativo
  - [ ] Dados de acesso ao sistema
  - [ ] Contatos de suporte

### 🎓 **Treinamento**
- [ ] **Sessão de Treinamento**
  - [ ] Apresentar interface de configurações
  - [ ] Demonstrar conexão WhatsApp
  - [ ] Explicar configurações que cliente pode alterar
  - [ ] Processo de suporte

---

## 🚨 **CHECKLIST DE SEGURANÇA**

### 🔐 **Dados Sensíveis**
- [ ] **Verificar Criptografia**
  - [ ] API keys criptografadas
  - [ ] Senhas criptografadas
  - [ ] Dados PIX criptografados

- [ ] **Controle de Acesso**
  - [ ] Apenas admin acessa configurações
  - [ ] Logs de alterações
  - [ ] Backup das configurações

### 🛡️ **Validações**
- [ ] **Inputs**
  - [ ] Validar formato de emails
  - [ ] Validar formato de chaves PIX
  - [ ] Validar números de telefone

- [ ] **APIs**
  - [ ] Rate limiting configurado
  - [ ] Timeouts definidos
  - [ ] Error handling implementado

---

## 📞 **CONTATOS DE SUPORTE**

### 🏢 **Altclinic**
- **Técnico**: suporte-tecnico@altclinic.com
- **Comercial**: suporte@altclinic.com
- **Emergência**: +55 11 99999-9999

### 👤 **Cliente**
- **Responsável**: ________________
- **Email**: ________________
- **Telefone**: ________________

---

## 📅 **CRONOGRAMA SUGERIDO**

| Fase | Responsável | Tempo Estimado |
|------|-------------|----------------|
| Setup Inicial | Altclinic | 2-3 dias |
| Coleta de Dados | Cliente | 1 dia |
| Configuração Compartilhada | Ambos | 1 dia |
| Testes | Altclinic | 1 dia |
| Treinamento | Altclinic | 2 horas |

**Total**: 5-6 dias úteis

---

*Checklist de Implementação v1.0*  
*Criado em: Setembro 2025*  
*Última atualização: 02/09/2025*
