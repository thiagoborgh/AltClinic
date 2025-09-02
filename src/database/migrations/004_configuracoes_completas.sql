-- Adicionar configurações adicionais para todas as integrações mencionadas no log

-- Configurações Twilio
INSERT OR IGNORE INTO configuracoes (clinica_id, secao, chave, valor, descricao, tipo_valor, criptografado) VALUES
(1, 'integracoes', 'twilio_account_sid', '', 'Account SID do Twilio', 'string', 1),
(1, 'integracoes', 'twilio_auth_token', '', 'Auth Token do Twilio', 'string', 1),
(1, 'integracoes', 'twilio_whatsapp_number', '', 'Número WhatsApp do Twilio', 'string', 0);

-- Configurações Telegram
INSERT OR IGNORE INTO configuracoes (clinica_id, secao, chave, valor, descricao, tipo_valor, criptografado) VALUES
(1, 'integracoes', 'telegram_bot_token', '', 'Token do Bot Telegram', 'string', 1),
(1, 'integracoes', 'telegram_chat_id', '', 'Chat ID padrão do Telegram', 'string', 0),
(1, 'integracoes', 'telegram_ativo', 'false', 'Ativar integração Telegram', 'boolean', 0);

-- Configurações Mailchimp
INSERT OR IGNORE INTO configuracoes (clinica_id, secao, chave, valor, descricao, tipo_valor, criptografado) VALUES
(1, 'integracoes', 'mailchimp_api_key', '', 'API Key do Mailchimp', 'string', 1),
(1, 'integracoes', 'mailchimp_server_prefix', 'us1', 'Prefixo do servidor Mailchimp', 'string', 0),
(1, 'integracoes', 'mailchimp_list_id', '', 'ID da lista Mailchimp', 'string', 0),
(1, 'integracoes', 'mailchimp_from_email', '', 'Email remetente', 'string', 0),
(1, 'integracoes', 'mailchimp_from_name', '', 'Nome do remetente', 'string', 0),
(1, 'integracoes', 'mailchimp_ativo', 'false', 'Ativar integração Mailchimp', 'boolean', 0);

-- Configurações Claude AI
INSERT OR IGNORE INTO configuracoes (clinica_id, secao, chave, valor, descricao, tipo_valor, criptografado) VALUES
(1, 'ai', 'claude_api_key', '', 'API Key do Claude (Anthropic)', 'string', 1),
(1, 'ai', 'claude_model', 'claude-3-sonnet-20240229', 'Modelo do Claude a usar', 'string', 0),
(1, 'ai', 'claude_ativo', 'false', 'Ativar Claude AI', 'boolean', 0),
(1, 'ai', 'claude_max_tokens', '4000', 'Máximo de tokens por resposta', 'number', 0);

-- Configurações SMTP/Email
INSERT OR IGNORE INTO configuracoes (clinica_id, secao, chave, valor, descricao, tipo_valor, criptografado) VALUES
(1, 'integracoes', 'smtp_host', '', 'Servidor SMTP', 'string', 0),
(1, 'integracoes', 'smtp_port', '587', 'Porta SMTP', 'number', 0),
(1, 'integracoes', 'smtp_secure', 'true', 'SMTP com TLS/SSL', 'boolean', 0),
(1, 'integracoes', 'smtp_user', '', 'Usuário SMTP', 'string', 0),
(1, 'integracoes', 'smtp_password', '', 'Senha SMTP', 'string', 1);

-- Configurações WhatsApp Web.js adicionais
INSERT OR IGNORE INTO configuracoes (clinica_id, secao, chave, valor, descricao, tipo_valor, criptografado) VALUES
(1, 'whatsapp', 'session_path', './whatsapp-session', 'Caminho da sessão WhatsApp', 'string', 0),
(1, 'whatsapp', 'auto_init', 'false', 'Inicialização automática', 'boolean', 0),
(1, 'whatsapp', 'qr_timeout', '60', 'Timeout do QR Code (segundos)', 'number', 0);

-- Configurações de Sistema
INSERT OR IGNORE INTO configuracoes (clinica_id, secao, chave, valor, descricao, tipo_valor, criptografado) VALUES
(1, 'sistema', 'ambiente', 'development', 'Ambiente da aplicação', 'string', 0),
(1, 'sistema', 'debug_mode', 'true', 'Modo debug ativo', 'boolean', 0),
(1, 'sistema', 'log_level', 'info', 'Nível de log', 'string', 0),
(1, 'sistema', 'max_upload_size', '10485760', 'Tamanho máximo upload (bytes)', 'number', 0);

-- Configurações Cron Jobs
INSERT OR IGNORE INTO configuracoes (clinica_id, secao, chave, valor, descricao, tipo_valor, criptografado) VALUES
(1, 'sistema', 'cron_verificacao_inativos', '0 9 * * *', 'Cron verificação inativos', 'string', 0),
(1, 'sistema', 'cron_confirmacao', '0 8-18/2 * * *', 'Cron confirmação agendamentos', 'string', 0),
(1, 'sistema', 'cron_lembretes', '0 8-20 * * *', 'Cron lembretes', 'string', 0),
(1, 'sistema', 'cron_relatorios', '0 20 * * *', 'Cron relatórios diários', 'string', 0);

-- Log da execução
INSERT INTO logs_auditoria (usuario_id, acao, detalhes, ip_address, user_agent) VALUES
(1, 'CONFIGURACAO_ADICIONAL', 'Adicionadas todas as configurações de integrações do sistema', '127.0.0.1', 'Sistema');
