const Database = require('better-sqlite3');
const path = require('path');

const migrations = [
  {
    version: 1,
    name: 'create_initial_tables',
    up: `
      -- Tabela de Clínicas
      CREATE TABLE IF NOT EXISTS clinica (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabela de Usuários
      CREATE TABLE IF NOT EXISTS usuario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clinica_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'atendente')),
        email TEXT UNIQUE NOT NULL,
        senha_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (clinica_id) REFERENCES clinica(id) ON DELETE CASCADE
      );

      -- Tabela de Pacientes
      CREATE TABLE IF NOT EXISTS paciente (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clinica_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        telefone TEXT NOT NULL,
        email TEXT,
        ultimo_atendimento DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (clinica_id) REFERENCES clinica(id) ON DELETE CASCADE
      );

      -- Tabela de Procedimentos
      CREATE TABLE IF NOT EXISTS procedimento (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clinica_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        duracao_minutos INTEGER NOT NULL DEFAULT 60,
        preco DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        preparo_texto TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (clinica_id) REFERENCES clinica(id) ON DELETE CASCADE
      );

      -- Tabela de Equipamentos/Salas
      CREATE TABLE IF NOT EXISTS equipamento (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clinica_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        capacidade INTEGER NOT NULL DEFAULT 1,
        descricao TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (clinica_id) REFERENCES clinica(id) ON DELETE CASCADE
      );

      -- Tabela de Agendamentos
      CREATE TABLE IF NOT EXISTS agendamento (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente_id INTEGER NOT NULL,
        procedimento_id INTEGER NOT NULL,
        equipamento_id INTEGER NOT NULL,
        data_hora DATETIME NOT NULL,
        status TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'cancelado', 'realizado')),
        sessao_numero INTEGER DEFAULT 1,
        observacoes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (paciente_id) REFERENCES paciente(id) ON DELETE CASCADE,
        FOREIGN KEY (procedimento_id) REFERENCES procedimento(id) ON DELETE CASCADE,
        FOREIGN KEY (equipamento_id) REFERENCES equipamento(id) ON DELETE CASCADE
      );

      -- Tabela de Prontuários
      CREATE TABLE IF NOT EXISTS prontuario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente_id INTEGER NOT NULL,
        anamnese_json TEXT, -- JSON configurável
        medidas_json TEXT,  -- JSON com evolução temporal
        imagem_path TEXT,   -- Caminho criptografado
        data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (paciente_id) REFERENCES paciente(id) ON DELETE CASCADE
      );

      -- Tabela de Propostas
      CREATE TABLE IF NOT EXISTS proposta (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente_id INTEGER NOT NULL,
        contrato_texto TEXT NOT NULL,
        itens TEXT NOT NULL, -- JSON array de procedimentos/sessões
        valor_total DECIMAL(10,2) NOT NULL,
        data_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'enviada' CHECK (status IN ('enviada', 'aceita', 'rejeitada')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (paciente_id) REFERENCES paciente(id) ON DELETE CASCADE
      );

      -- Tabela de Contas a Receber
      CREATE TABLE IF NOT EXISTS conta_receber (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        proposta_id INTEGER NOT NULL,
        valor_pago DECIMAL(10,2) DEFAULT 0.00,
        data_pagamento DATETIME,
        recibo_texto TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (proposta_id) REFERENCES proposta(id) ON DELETE CASCADE
      );

      -- Tabela de Mensagens CRM
      CREATE TABLE IF NOT EXISTS mensagem_crm (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente_id INTEGER NOT NULL,
        tipo TEXT NOT NULL CHECK (tipo IN ('marcada', 'desmarcada', 'remarcada', 'inativo', 'confirmacao', 'lembrete')),
        data_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
        conteudo TEXT NOT NULL,
        canal TEXT DEFAULT 'whatsapp' CHECK (canal IN ('whatsapp', 'telegram', 'email')),
        status TEXT DEFAULT 'enviada' CHECK (status IN ('enviada', 'entregue', 'lida', 'erro')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (paciente_id) REFERENCES paciente(id) ON DELETE CASCADE
      );
    `
  },
  {
    version: 2,
    name: 'create_indexes',
    up: `
      -- Índices para performance
      CREATE INDEX IF NOT EXISTS idx_agendamento_data_hora ON agendamento(data_hora);
      CREATE INDEX IF NOT EXISTS idx_agendamento_paciente_id ON agendamento(paciente_id);
      CREATE INDEX IF NOT EXISTS idx_agendamento_equipamento_id ON agendamento(equipamento_id);
      CREATE INDEX IF NOT EXISTS idx_agendamento_status ON agendamento(status);
      
      CREATE INDEX IF NOT EXISTS idx_paciente_clinica_id ON paciente(clinica_id);
      CREATE INDEX IF NOT EXISTS idx_paciente_ultimo_atendimento ON paciente(ultimo_atendimento);
      CREATE INDEX IF NOT EXISTS idx_paciente_telefone ON paciente(telefone);
      
      CREATE INDEX IF NOT EXISTS idx_mensagem_crm_paciente_id ON mensagem_crm(paciente_id);
      CREATE INDEX IF NOT EXISTS idx_mensagem_crm_tipo ON mensagem_crm(tipo);
      CREATE INDEX IF NOT EXISTS idx_mensagem_crm_data_envio ON mensagem_crm(data_envio);
      
      CREATE INDEX IF NOT EXISTS idx_prontuario_paciente_id ON prontuario(paciente_id);
      CREATE INDEX IF NOT EXISTS idx_prontuario_data_registro ON prontuario(data_registro);
      
      CREATE INDEX IF NOT EXISTS idx_proposta_paciente_id ON proposta(paciente_id);
      CREATE INDEX IF NOT EXISTS idx_proposta_status ON proposta(status);
    `
  },
  {
    version: 3,
    name: 'create_migration_table',
    up: `
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `
  },
  {
    version: 4,
    name: 'create_whatsapp_tables',
    up: `
      -- Tabela para armazenar tokens e configurações do WhatsApp por cliente
      CREATE TABLE IF NOT EXISTS whatsapp_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        phone_id TEXT,
        phone_number TEXT,
        token TEXT, -- Token criptografado com AES-256
        status TEXT DEFAULT 'not_configured', -- not_configured, pending_qr, active, blocked, expired

        -- Credenciais específicas da Meta API por cliente
        wa_app_id TEXT,
        wa_system_user_token TEXT, -- Token criptografado
        wa_webhook_verify_token TEXT,
        wa_business_account_id TEXT,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(client_id),
        UNIQUE(phone_id)
      );

      -- Tabela para controlar uso mensal do WhatsApp por cliente
      CREATE TABLE IF NOT EXISTS whatsapp_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        month INTEGER NOT NULL, -- 1-12
        year INTEGER NOT NULL, -- 2025, 2026, etc.
        used_messages INTEGER DEFAULT 0,
        limit_messages INTEGER NOT NULL,
        plan_type TEXT NOT NULL, -- trial, starter, professional, enterprise
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(client_id, month, year)
      );

      -- Índices para performance
      CREATE INDEX IF NOT EXISTS idx_whatsapp_tokens_client_id ON whatsapp_tokens(client_id);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_tokens_phone_id ON whatsapp_tokens(phone_id);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_usage_client_month_year ON whatsapp_usage(client_id, month, year);
    `
  },
  {
    version: 5,
    name: 'create_whatsapp_upgrades',
    up: `
      -- Tabela para controlar upgrades do WhatsApp
      CREATE TABLE IF NOT EXISTS whatsapp_upgrades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        plan_type TEXT NOT NULL, -- starter, professional, enterprise
        stripe_session_id TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'pending', -- pending, completed, failed, cancelled
        amount INTEGER NOT NULL, -- valor em centavos
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES tenants(id) ON DELETE CASCADE
      );

      -- Índice para performance
      CREATE INDEX IF NOT EXISTS idx_whatsapp_upgrades_client_id ON whatsapp_upgrades(client_id);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_upgrades_stripe_session ON whatsapp_upgrades(stripe_session_id);
    `
  },
  {
    version: 6,
    name: 'create_whatsapp_message_status',
    up: `
      -- Tabela para controlar status das mensagens WhatsApp
      CREATE TABLE IF NOT EXISTS whatsapp_message_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id TEXT NOT NULL,
        client_id INTEGER NOT NULL,
        status TEXT NOT NULL, -- sent, delivered, read, failed
        timestamp TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(message_id),
        FOREIGN KEY (client_id) REFERENCES tenants(id) ON DELETE CASCADE
      );

      -- Índice para performance
      CREATE INDEX IF NOT EXISTS idx_whatsapp_message_status_client_id ON whatsapp_message_status(client_id);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_message_status_message_id ON whatsapp_message_status(message_id);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_message_status_timestamp ON whatsapp_message_status(timestamp);
    `
  },
  {
    version: 7,
    name: 'add_meta_api_credentials_fields',
    up: `
      -- Adicionar campos para credenciais da Meta API por tenant
      ALTER TABLE whatsapp_tokens ADD COLUMN phone_number TEXT;
      ALTER TABLE whatsapp_tokens ADD COLUMN wa_app_id TEXT;
      ALTER TABLE whatsapp_tokens ADD COLUMN wa_system_user_token TEXT;
      ALTER TABLE whatsapp_tokens ADD COLUMN wa_webhook_verify_token TEXT;
      ALTER TABLE whatsapp_tokens ADD COLUMN wa_business_account_id TEXT;

      -- Atualizar status padrão para novas configurações
      UPDATE whatsapp_tokens SET status = 'not_configured' WHERE status IS NULL OR status = '';
    `,
    down: `
      -- Remover campos adicionados (SQLite não suporta DROP COLUMN diretamente)
      -- Para rollback, seria necessário recriar a tabela sem estes campos
      -- Mas para simplificar, apenas limpamos os valores
      UPDATE whatsapp_tokens SET
        phone_number = NULL,
        wa_app_id = NULL,
        wa_system_user_token = NULL,
        wa_webhook_verify_token = NULL,
        wa_business_account_id = NULL;
    `
  }
];

function runMigrations() {
  const dbPath = process.env.DB_PATH || './saee.db';
  const db = new Database(dbPath);
  
  console.log('🚀 Iniciando migrations...');
  
  try {
    // Criar tabela de migrations primeiro
    db.exec(migrations[2].up);
    
    // Verificar quais migrations já foram executadas
    const executedMigrations = db.prepare('SELECT version FROM migrations ORDER BY version').all();
    const executedVersions = executedMigrations.map(m => m.version);
    
    // Executar migrations pendentes
    migrations.forEach((migration, index) => {
      if (migration.version === 3) return; // Pular a migration da tabela de migrations
      
      if (!executedVersions.includes(migration.version)) {
        console.log(`📦 Executando migration ${migration.version}: ${migration.name}`);
        
        try {
          db.exec(migration.up);
          
          // Registrar migration como executada
          db.prepare('INSERT INTO migrations (version, name) VALUES (?, ?)').run(
            migration.version,
            migration.name
          );
          
          console.log(`✅ Migration ${migration.version} executada com sucesso`);
        } catch (error) {
          console.error(`❌ Erro ao executar migration ${migration.version}:`, error.message);
          throw error;
        }
      } else {
        console.log(`⏭️  Migration ${migration.version} já executada`);
      }
    });
    
    console.log('🎉 Todas as migrations foram executadas com sucesso!');
    
    // Inserir dados de exemplo para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('🌱 Inserindo dados de exemplo...');
      seedDevelopmentData(db);
    }
    
  } catch (error) {
    console.error('💥 Erro durante as migrations:', error.message);
    throw error;
  } finally {
    db.close();
  }
}

function seedDevelopmentData(db) {
  try {
    // Verificar se já existem dados
    const clinicaCount = db.prepare('SELECT COUNT(*) as count FROM clinica').get().count;
    if (clinicaCount > 0) {
      console.log('📊 Dados de exemplo já existem');
      return;
    }
    
    const bcrypt = require('bcrypt');
    const hashedPassword = bcrypt.hashSync('123456', 10);
    
    // Inserir clínica de exemplo
    const clinicaResult = db.prepare(`
      INSERT INTO clinica (nome, email, senha_hash)
      VALUES ('Clínica Estética Exemplo', 'admin@clinica.com', ?)
    `).run(hashedPassword);
    
    const clinicaId = clinicaResult.lastInsertRowid;
    
    // Inserir usuário admin
    db.prepare(`
      INSERT INTO usuario (clinica_id, nome, role, email, senha_hash)
      VALUES (?, 'Administrador', 'admin', 'admin@clinica.com', ?)
    `).run(clinicaId, hashedPassword);
    
    // Inserir procedimentos de exemplo
    const procedimentos = [
      ['Limpeza de Pele', 60, 80.00, 'Chegar sem maquiagem'],
      ['Hidratação Facial', 45, 120.00, 'Evitar exposição solar 24h antes'],
      ['Massagem Relaxante', 90, 150.00, 'Usar roupas confortáveis']
    ];
    
    procedimentos.forEach(proc => {
      db.prepare(`
        INSERT INTO procedimento (clinica_id, nome, duracao_minutos, preco, preparo_texto)
        VALUES (?, ?, ?, ?, ?)
      `).run(clinicaId, ...proc);
    });
    
    // Inserir equipamentos/salas
    const equipamentos = [
      ['Sala 1', 2, 'Sala para procedimentos faciais'],
      ['Sala 2', 1, 'Sala VIP para atendimentos premium'],
      ['Sala de Massagem', 1, 'Sala exclusiva para massagens']
    ];
    
    equipamentos.forEach(equip => {
      db.prepare(`
        INSERT INTO equipamento (clinica_id, nome, capacidade, descricao)
        VALUES (?, ?, ?, ?)
      `).run(clinicaId, ...equip);
    });
    
    // Inserir pacientes de exemplo
    const pacientes = [
      ['Maria Silva', '11999887766', 'maria@email.com'],
      ['Ana Santos', '11998776655', 'ana@email.com'],
      ['Carla Oliveira', '11997665544', 'carla@email.com']
    ];
    
    pacientes.forEach(pac => {
      db.prepare(`
        INSERT INTO paciente (clinica_id, nome, telefone, email, ultimo_atendimento)
        VALUES (?, ?, ?, ?, datetime('now', '-45 days'))
      `).run(clinicaId, ...pac);
    });
    
    console.log('✅ Dados de exemplo inseridos com sucesso');
    console.log('👤 Login: admin@clinica.com | Senha: 123456');
    
  } catch (error) {
    console.error('❌ Erro ao inserir dados de exemplo:', error.message);
  }
}

module.exports = { runMigrations, migrations };

// Executar migrations se chamado diretamente
if (require.main === module) {
  require('dotenv').config();
  runMigrations();
}
