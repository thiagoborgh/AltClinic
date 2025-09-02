-- Migração 003: Configurações do Sistema

-- Tabela principal de configurações
CREATE TABLE IF NOT EXISTS configuracoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinica_id INTEGER NOT NULL,
    secao VARCHAR(100) NOT NULL,
    chave VARCHAR(100) NOT NULL,
    valor TEXT,
    descricao TEXT,
    tipo_valor VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
    obrigatorio BOOLEAN DEFAULT 0,
    criptografado BOOLEAN DEFAULT 0,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinica_id) REFERENCES clinica(id) ON DELETE CASCADE,
    UNIQUE(clinica_id, secao, chave)
);

-- Tabela de auditoria para configurações
CREATE TABLE IF NOT EXISTS configuracoes_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    configuracao_id INTEGER NOT NULL,
    usuario_id INTEGER,
    acao VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
    valor_anterior TEXT,
    valor_novo TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (configuracao_id) REFERENCES configuracoes(id) ON DELETE CASCADE
);

-- Tabela para logs de auditoria
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    acao VARCHAR(100) NOT NULL,
    entidade VARCHAR(100),
    entidade_id INTEGER,
    detalhes TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para procedimentos
CREATE TABLE IF NOT EXISTS procedimentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinica_id INTEGER NOT NULL,
    nome VARCHAR(200) NOT NULL,
    codigo VARCHAR(50),
    duracao INTEGER DEFAULT 30, -- em minutos
    valor DECIMAL(10,2),
    ativo BOOLEAN DEFAULT 1,
    especialidade_id INTEGER,
    descricao TEXT,
    preparo TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinica_id) REFERENCES clinica(id) ON DELETE CASCADE,
    UNIQUE(clinica_id, nome)
);

-- Tabela para equipamentos
CREATE TABLE IF NOT EXISTS equipamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinica_id INTEGER NOT NULL,
    nome VARCHAR(200) NOT NULL,
    tipo VARCHAR(100),
    capacidade INTEGER DEFAULT 1,
    descricao TEXT,
    ativo BOOLEAN DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinica_id) REFERENCES clinica(id) ON DELETE CASCADE
);

-- Tabela para horários de funcionamento
CREATE TABLE IF NOT EXISTS horarios_funcionamento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinica_id INTEGER NOT NULL,
    dia_semana INTEGER NOT NULL, -- 0=domingo, 1=segunda, ..., 6=sábado
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    ativo BOOLEAN DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinica_id) REFERENCES clinica(id) ON DELETE CASCADE
);

-- Tabela para templates de mensagens
CREATE TABLE IF NOT EXISTS templates_mensagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinica_id INTEGER NOT NULL,
    nome VARCHAR(200) NOT NULL,
    tipo VARCHAR(100) NOT NULL, -- confirmacao, lembrete, cancelamento, etc
    assunto VARCHAR(300),
    conteudo TEXT NOT NULL,
    variaveis TEXT, -- JSON com variáveis disponíveis
    ativo BOOLEAN DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinica_id) REFERENCES clinica(id) ON DELETE CASCADE,
    UNIQUE(clinica_id, nome, tipo)
);

-- Tabela para campos de anamnese customizados
CREATE TABLE IF NOT EXISTS campos_anamnese (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinica_id INTEGER NOT NULL,
    nome VARCHAR(200) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- text, textarea, select, checkbox, radio, date
    opcoes TEXT, -- JSON para select/radio/checkbox
    obrigatorio BOOLEAN DEFAULT 0,
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT 1,
    grupo VARCHAR(100),
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinica_id) REFERENCES clinica(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_configuracoes_clinica ON configuracoes(clinica_id);
CREATE INDEX IF NOT EXISTS idx_configuracoes_secao ON configuracoes(secao);
CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes(chave);
CREATE INDEX IF NOT EXISTS idx_procedimentos_clinica ON procedimentos(clinica_id);
CREATE INDEX IF NOT EXISTS idx_equipamentos_clinica ON equipamentos(clinica_id);
CREATE INDEX IF NOT EXISTS idx_horarios_clinica ON horarios_funcionamento(clinica_id);
CREATE INDEX IF NOT EXISTS idx_templates_clinica ON templates_mensagens(clinica_id);
CREATE INDEX IF NOT EXISTS idx_anamnese_clinica ON campos_anamnese(clinica_id);

-- Triggers para auditoria
CREATE TRIGGER IF NOT EXISTS audit_configuracoes_update
    AFTER UPDATE ON configuracoes
BEGIN
    INSERT INTO configuracoes_audit (
        configuracao_id, acao, valor_anterior, valor_novo, timestamp
    ) VALUES (
        NEW.id, 'UPDATE', OLD.valor, NEW.valor, CURRENT_TIMESTAMP
    );
END;

CREATE TRIGGER IF NOT EXISTS audit_configuracoes_delete
    AFTER DELETE ON configuracoes
BEGIN
    INSERT INTO configuracoes_audit (
        configuracao_id, acao, valor_anterior, timestamp
    ) VALUES (
        OLD.id, 'DELETE', OLD.valor, CURRENT_TIMESTAMP
    );
END;

-- Triggers para timestamps
CREATE TRIGGER IF NOT EXISTS update_configuracoes_timestamp 
    AFTER UPDATE ON configuracoes
BEGIN
    UPDATE configuracoes SET atualizado_em = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
