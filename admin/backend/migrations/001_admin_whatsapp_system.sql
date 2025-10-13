-- Migration para sistema de vinculação WhatsApp Admin-Tenant
-- Arquivo: admin_whatsapp_connections.sql

-- Tabela para gerenciar conexões WhatsApp no admin
CREATE TABLE IF NOT EXISTS admin_whatsapp_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL, -- Nome da conexão (ex: "ManyChat Clínica A", "WhatsApp Business API")
  type VARCHAR(50) NOT NULL, -- Tipo: 'manychat', 'whatsapp_business', 'z_api', etc.
  credentials TEXT NOT NULL, -- JSON com credenciais (criptografado)
  config TEXT, -- JSON com configurações específicas
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, error
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER, -- ID do admin que criou
  
  -- Índices
  INDEX idx_type (type),
  INDEX idx_status (status)
);

-- Tabela para vincular tenants às conexões WhatsApp
CREATE TABLE IF NOT EXISTS tenant_whatsapp_bindings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id VARCHAR(255) NOT NULL, -- ID do tenant
  tenant_name VARCHAR(255) NOT NULL, -- Nome do tenant
  whatsapp_connection_id INTEGER, -- FK para admin_whatsapp_connections (pode ser NULL se usar API própria)
  
  -- API própria da licença (alternativa à conexão admin)
  own_api_enabled BOOLEAN DEFAULT false, -- Se a licença usa sua própria API
  own_api_type VARCHAR(50), -- Tipo: 'manychat', 'whatsapp_business', etc.
  own_api_credentials TEXT, -- JSON com credenciais próprias (criptografado)
  own_api_config TEXT, -- JSON com configurações específicas da API própria
  
  -- Configurações específicas do tenant
  phone_number VARCHAR(20), -- Número do WhatsApp vinculado
  business_name VARCHAR(255), -- Nome comercial para as mensagens
  
  -- Rotinas ativas para este tenant
  enabled_automations TEXT, -- JSON com rotinas ativadas
  message_templates TEXT, -- JSON com templates personalizados
  
  -- Limites e controles
  monthly_message_limit INTEGER DEFAULT 1000,
  current_monthly_usage INTEGER DEFAULT 0,
  last_usage_reset DATE,
  
  -- Metadados
  status VARCHAR(20) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  assigned_by INTEGER, -- ID do admin que fez a vinculação
  
  -- Constraints
  FOREIGN KEY (whatsapp_connection_id) REFERENCES admin_whatsapp_connections(id) ON DELETE SET NULL,
  UNIQUE(tenant_id), -- Cada tenant pode ter apenas uma configuração ativa
  CHECK (
    -- Deve ter conexão admin OU API própria, mas não ambos
    (whatsapp_connection_id IS NOT NULL AND own_api_enabled = false) OR
    (whatsapp_connection_id IS NULL AND own_api_enabled = true)
  ),
  
  -- Índices
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_connection_id (whatsapp_connection_id),
  INDEX idx_phone_number (phone_number),
  INDEX idx_status (status),
  INDEX idx_own_api (own_api_enabled)
);

-- Tabela para logs de uso de WhatsApp por tenant
CREATE TABLE IF NOT EXISTS tenant_whatsapp_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id VARCHAR(255) NOT NULL,
  whatsapp_connection_id INTEGER NOT NULL,
  
  -- Detalhes do envio
  message_type VARCHAR(50) NOT NULL, -- 'confirmation', 'reminder', 'payment', 'survey'
  recipient_phone VARCHAR(20) NOT NULL,
  message_content TEXT,
  message_hash VARCHAR(64), -- Hash do conteúdo para controle de duplicação
  
  -- Controle de duplicação por evento
  event_type VARCHAR(100), -- 'appointment_123', 'payment_456', etc.
  event_id VARCHAR(255), -- ID único do evento (agendamento, pagamento, etc.)
  
  -- Status da entrega
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, failed, duplicate_blocked
  external_message_id VARCHAR(255), -- ID da mensagem no sistema externo
  error_message TEXT,
  
  -- Custos (se aplicável)
  cost_cents INTEGER DEFAULT 0,
  
  -- Timestamps
  sent_at DATETIME,
  delivered_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  FOREIGN KEY (whatsapp_connection_id) REFERENCES admin_whatsapp_connections(id),
  
  -- Índice único para prevenir duplicação por evento
  UNIQUE(tenant_id, event_type, event_id, message_type),
  
  -- Índices
  INDEX idx_tenant_usage (tenant_id, created_at),
  INDEX idx_message_type (message_type),
  INDEX idx_status (status),
  INDEX idx_sent_at (sent_at),
  INDEX idx_message_hash (message_hash),
  INDEX idx_event (event_type, event_id)
);

-- Tabela para templates de mensagens configurados pelo admin
CREATE TABLE IF NOT EXISTS admin_message_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'confirmation', 'reminder', 'payment', 'survey', 'custom'
  category VARCHAR(100), -- 'appointment', 'billing', 'marketing', etc.
  
  -- Conteúdo do template
  title VARCHAR(255),
  content TEXT NOT NULL,
  variables TEXT, -- JSON com variáveis disponíveis
  
  -- Configurações
  is_global BOOLEAN DEFAULT true, -- Se pode ser usado por todos os tenants
  whatsapp_connection_types TEXT, -- JSON com tipos de conexão compatíveis
  
  -- Metadados
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  
  -- Índices
  INDEX idx_type_category (type, category),
  INDEX idx_is_global (is_global)
);

-- Inserir templates padrão
INSERT INTO admin_message_templates (name, type, category, title, content, variables, is_global) VALUES
('Confirmação de Agendamento Padrão', 'confirmation', 'appointment', 'Agendamento Confirmado', 
 '🏥 *{{clinic_name}}*\n\n✅ *Agendamento Confirmado*\n\n👤 Paciente: {{patient_name}}\n👨‍⚕️ Médico: {{doctor_name}}\n📅 Data: {{appointment_date}}\n🕐 Horário: {{appointment_time}}\n\nℹ️ Por favor, chegue 15 minutos antes do horário marcado.',
 '["clinic_name", "patient_name", "doctor_name", "appointment_date", "appointment_time"]', true),

('Lembrete de Consulta Padrão', 'reminder', 'appointment', 'Lembrete de Consulta',
 '🔔 *Lembrete de Consulta*\n\n{{patient_name}}, você tem consulta marcada para:\n\n👨‍⚕️ {{doctor_name}}\n📅 {{appointment_date}} às {{appointment_time}}\n\n🏥 {{clinic_name}}\n📍 {{clinic_address}}',
 '["patient_name", "doctor_name", "appointment_date", "appointment_time", "clinic_name", "clinic_address"]', true),

('Cobrança de Pagamento Padrão', 'payment', 'billing', 'Cobrança Pendente',
 '💰 *Cobrança Pendente*\n\n{{patient_name}}, você possui uma pendência de R$ {{amount}} referente a:\n\n📋 {{description}}\n📅 Vencimento: {{due_date}}\n\n💳 Clique no link para pagar: {{payment_link}}',
 '["patient_name", "amount", "description", "due_date", "payment_link"]', true);

-- Exemplos de conexões padrão
INSERT INTO admin_whatsapp_connections (name, type, credentials, config, created_by) VALUES
('ManyChat Principal', 'manychat', 
 '{"page_id": "9353710", "api_token": "8f05258497356cfe8a039e79200b2af4"}',
 '{"webhook_url": "", "default_language": "pt_BR", "business_hours": "08:00-18:00"}', 1),
 
('Z-API Desenvolvimento', 'z_api', 
 '{"instance_id": "3E82B061D75E61EBAFEAD69A39353161", "token": "6F0F59D6B5E47985FC591A56"}',
 '{"webhook_url": "", "prevent_duplicates": true, "message_variation": true}', 1);