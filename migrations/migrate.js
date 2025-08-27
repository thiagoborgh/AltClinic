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
