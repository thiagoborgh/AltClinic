# 📋 Guia de Responsabilidades - Configurações do Sistema

## 🎯 Visão Geral

Este documento define claramente as responsabilidades de configuração do sistema AltClinic entre a **empresa Altclinic** e o **usuário contratante** (clínica/consultório).

---

## 🏢 Responsabilidade da **ALTCLINIC**

> ⚙️ **Configurações técnicas e de infraestrutura que devem ser definidas pela equipe técnica da Altclinic**

### 🤖 **Seção AI - Inteligência Artificial**

- ✅ `claude_api_key` - Chave da API do Claude AI
- ✅ `claude_model` - Modelo do Claude a ser utilizado
- ✅ `claude_max_tokens` - Limite máximo de tokens
- ✅ `gemini_api_key` - Chave da API do Google Gemini
- ✅ `huggingface_api_key` - Chave da API do Hugging Face

**Justificativa**: APIs de IA requerem conhecimento técnico e contratos corporativos.

---

### ⚙️ **Seção SISTEMA - Configurações Técnicas**

- ✅ `ambiente` - Ambiente (desenvolvimento/produção)
- ✅ `debug_mode` - Modo de debug ativo/inativo
- ✅ `log_level` - Nível de logging do sistema
- ✅ `max_upload_size` - Tamanho máximo de upload
- ✅ `cron_confirmacao` - Agendamento de confirmações
- ✅ `cron_lembretes` - Agendamento de lembretes
- ✅ `cron_relatorios` - Agendamento de relatórios
- ✅ `cron_verificacao_inativos` - Verificação de usuários inativos

**Justificativa**: Configurações críticas do sistema que afetam performance e segurança.

---

### 📱 **Seção WHATSAPP - Configurações Técnicas**

- ✅ `api_token` - Token da API do WhatsApp
- ✅ `auto_init` - Inicialização automática
- ✅ `qr_timeout` - Timeout do QR Code
- ✅ `session_path` - Caminho das sessões
- ✅ `webhook_url` - URL do webhook

**Justificativa**: Configurações técnicas da integração WhatsApp Web.

---

### 📧 **Seção EMAIL - Configurações SMTP**

- ✅ `smtp_host` - Servidor SMTP
- ✅ `smtp_port` - Porta do servidor SMTP
- ✅ `smtp_secure` - Conexão segura (SSL/TLS)
- ✅ `smtp_user` - Usuário do servidor SMTP
- ✅ `smtp_password` - Senha do servidor SMTP

**Justificativa**: Requer configuração de servidor de email corporativo.

---

### 🔗 **Seção INTEGRAÇÕES - APIs Corporativas**

- ✅ `twilio_account_sid` - SID da conta Twilio
- ✅ `twilio_auth_token` - Token de autenticação Twilio
- ✅ `telegram_bot_token` - Token do bot do Telegram

**Justificativa**: Contas corporativas e tokens de APIs que requerem configuração técnica.

---

## 👤 Responsabilidade do **USUÁRIO CONTRATANTE**

> 🏥 **Configurações específicas da clínica/consultório que devem ser definidas pelo contratante**

### 👥 **Seção CRM - Gestão de Pacientes**

- 🔵 `periodo_inatividade` - Período para considerar paciente inativo (em dias)

**Justificativa**: Política específica de cada clínica sobre gestão de pacientes.

---

### 🔒 **Seção LGPD - Conformidade Legal**

- 🔵 `texto_consentimento` - Texto do termo de consentimento LGPD

**Justificativa**: Cada clínica deve definir seu próprio termo de consentimento.

---

### 💰 **Seção PIX - Dados Financeiros**

- 🔵 `chave_pix` - Chave PIX da clínica
- 🔵 `banco` - Nome do banco
- 🔵 `nome_titular` - Nome do titular da conta

**Justificativa**: Dados financeiros específicos de cada clínica.

---

### 📧 **Seção INTEGRAÇÕES - Dados da Clínica**

- 🔵 `mailchimp_from_email` - Email remetente para campanhas
- 🔵 `mailchimp_from_name` - Nome remetente para campanhas
- 🔵 `telegram_chat_id` - ID do chat do Telegram da clínica
- 🔵 `twilio_whatsapp_number` - Número WhatsApp da clínica

**Justificativa**: Dados específicos de comunicação de cada clínica.

---

## 🤝 Responsabilidade **COMPARTILHADA**

> ⚡ **Configurações que podem ser definidas em conjunto ou transferidas após setup inicial**

### 📧 **Seção INTEGRAÇÕES - Ativação de Serviços**

- 🟡 `mailchimp_ativo` - Ativar/desativar Mailchimp
- 🟡 `telegram_ativo` - Ativar/desativar Telegram
- 🟡 `claude_ativo` - Ativar/desativar Claude AI

**Processo**: Altclinic configura, usuário decide quando ativar.

### 📧 **Seção INTEGRAÇÕES - Configurações Mailchimp**

- 🟡 `mailchimp_api_key` - Chave da API (se cliente tiver conta própria)
- 🟡 `mailchimp_server_prefix` - Prefixo do servidor
- 🟡 `mailchimp_list_id` - ID da lista de contatos

**Processo**: Pode usar conta corporativa da Altclinic ou conta própria do cliente.

---

## 📝 **Processo de Configuração Recomendado**

### 1️⃣ **Fase de Setup Inicial** (Altclinic)

- Configurar todas as APIs e integrações técnicas
- Definir configurações de sistema e segurança
- Preparar ambiente de produção

### 2️⃣ **Fase de Personalização** (Usuário + Altclinic)

- Usuário fornece dados específicos da clínica
- Altclinic implementa configurações personalizadas
- Testes de integração em conjunto

### 3️⃣ **Fase de Operação** (Usuário)

- Usuário gerencia ativação/desativação de serviços
- Ajustes de políticas de negócio
- Manutenção de dados da clínica

---

## 🔐 **Considerações de Segurança**

### 🟥 **CRÍTICO - Apenas Altclinic**

- Chaves de API
- Tokens de autenticação
- Configurações de servidor

### 🟨 **SENSÍVEL - Compartilhado**

- Dados de integração
- Configurações de ativação

### 🟩 **PÚBLICO - Usuário**

- Dados da clínica
- Políticas de negócio
- Textos personalizados

---

## 📞 **Suporte e Contato**

- **Configurações Técnicas**: Equipe técnica Altclinic
- **Configurações de Negócio**: Suporte ao cliente Altclinic
- **Dúvidas sobre Responsabilidades**: Consultar este documento ou contatar suporte

---

_Documento criado em: Setembro 2025_  
_Versão: 1.0_  
_Última atualização: 02/09/2025_
