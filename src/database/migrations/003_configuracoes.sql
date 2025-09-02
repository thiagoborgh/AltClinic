-- Migração para tabela de configurações
-- Executar com: npm run migrate

-- Tabela para armazenar configurações da clínica
CREATE TABLE IF NOT EXISTS configuracoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinica_id INTEGER NOT NULL,
    secao VARCHAR(100) NOT NULL,
    chave VARCHAR(200) NOT NULL,
    valor TEXT,
    criptografado BOOLEAN DEFAULT 0,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
    UNIQUE(clinica_id, secao, chave)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_configuracoes_clinica ON configuracoes(clinica_id);
CREATE INDEX IF NOT EXISTS idx_configuracoes_secao ON configuracoes(clinica_id, secao);

-- Tabela para logs de auditoria
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    acao VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE, LOGIN, etc.
    tabela VARCHAR(100),
    registro_id INTEGER,
    detalhes TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índices para logs de auditoria
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON logs_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_timestamp ON logs_auditoria(timestamp);
CREATE INDEX IF NOT EXISTS idx_auditoria_acao ON logs_auditoria(acao);

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
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
    FOREIGN KEY (especialidade_id) REFERENCES especialidades(id)
);

-- Tabela para especialidades
CREATE TABLE IF NOT EXISTS especialidades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinica_id INTEGER NOT NULL,
    nome VARCHAR(100) NOT NULL,
    codigo VARCHAR(20),
    ativo BOOLEAN DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE
);

-- Tabela para equipamentos
CREATE TABLE IF NOT EXISTS equipamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinica_id INTEGER NOT NULL,
    nome VARCHAR(200) NOT NULL,
    tipo VARCHAR(100),
    marca VARCHAR(100),
    modelo VARCHAR(100),
    numero_serie VARCHAR(100),
    data_aquisicao DATE,
    data_calibracao DATE,
    proxima_calibracao DATE,
    status VARCHAR(50) DEFAULT 'ativo', -- ativo, manutencao, inativo
    localizacao VARCHAR(200),
    observacoes TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE
);

-- Tabela para templates de mensagens
CREATE TABLE IF NOT EXISTS templates_mensagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinica_id INTEGER NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- boas_vindas, confirmacao, lembrete, etc.
    nome VARCHAR(100) NOT NULL,
    conteudo TEXT NOT NULL,
    variaveis TEXT, -- JSON com variáveis disponíveis
    ativo BOOLEAN DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE
);

-- Tabela para backup de configurações
CREATE TABLE IF NOT EXISTS backup_configuracoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinica_id INTEGER NOT NULL,
    nome_arquivo VARCHAR(200) NOT NULL,
    dados_backup TEXT NOT NULL, -- JSON com todas as configurações
    tamanho INTEGER,
    tipo VARCHAR(20) DEFAULT 'manual', -- manual, automatico
    status VARCHAR(20) DEFAULT 'completo', -- em_andamento, completo, erro
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    criado_por INTEGER,
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
    FOREIGN KEY (criado_por) REFERENCES usuarios(id)
);

-- Tabela para campos personalizados da anamnese
CREATE TABLE IF NOT EXISTS campos_anamnese (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinica_id INTEGER NOT NULL,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- text, number, select, radio, checkbox, textarea
    opcoes TEXT, -- JSON para campos select/radio/checkbox
    obrigatorio BOOLEAN DEFAULT 0,
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT 1,
    categoria VARCHAR(50), -- dados_pessoais, historico, sintomas, etc.
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE
);

-- Índices adicionais
CREATE INDEX IF NOT EXISTS idx_procedimentos_clinica ON procedimentos(clinica_id);
CREATE INDEX IF NOT EXISTS idx_especialidades_clinica ON especialidades(clinica_id);
CREATE INDEX IF NOT EXISTS idx_equipamentos_clinica ON equipamentos(clinica_id);
CREATE INDEX IF NOT EXISTS idx_templates_clinica ON templates_mensagens(clinica_id);
CREATE INDEX IF NOT EXISTS idx_backup_clinica ON backup_configuracoes(clinica_id);
CREATE INDEX IF NOT EXISTS idx_campos_anamnese_clinica ON campos_anamnese(clinica_id);

-- Inserir configurações padrão se não existirem
INSERT OR IGNORE INTO configuracoes (clinica_id, secao, chave, valor) VALUES
(1, 'clinica.informacoes', 'nome', ''),
(1, 'clinica.informacoes', 'cnpj', ''),
(1, 'clinica.informacoes', 'endereco', ''),
(1, 'clinica.informacoes', 'telefone', ''),
(1, 'clinica.informacoes', 'email', ''),
(1, 'templates.mensagens', 'boas_vindas', 'Olá! Bem-vindo(a) à nossa clínica. Como podemos ajudá-lo(a)?'),
(1, 'templates.mensagens', 'confirmacao_agendamento', 'Seu agendamento foi confirmado para {data} às {hora}.'),
(1, 'seguranca.backup', 'automatico', 'true'),
(1, 'seguranca.backup', 'frequencia', 'diaria'),
(1, 'seguranca.auditoria', 'log_acessos', 'true'),
(1, 'seguranca.auditoria', 'log_modificacoes', 'true');

-- Inserir especialidades padrão
INSERT OR IGNORE INTO especialidades (clinica_id, nome, codigo) VALUES
(1, 'Clínica Geral', 'CG'),
(1, 'Cardiologia', 'CARDIO'),
(1, 'Dermatologia', 'DERMATO'),
(1, 'Ginecologia', 'GINECO'),
(1, 'Pediatria', 'PEDIATRIA'),
(1, 'Ortopedia', 'ORTO'),
(1, 'Oftalmologia', 'OFTALMO'),
(1, 'Neurologia', 'NEURO');

-- Inserir procedimentos padrão
INSERT OR IGNORE INTO procedimentos (clinica_id, nome, codigo, duracao, valor, especialidade_id) VALUES
(1, 'Consulta Médica', 'CONSULTA', 30, 150.00, 1),
(1, 'Consulta de Retorno', 'RETORNO', 20, 100.00, 1),
(1, 'Eletrocardiograma', 'ECG', 15, 80.00, 2),
(1, 'Dermatoscopia', 'DERMATO', 20, 120.00, 3),
(1, 'Consulta Ginecológica', 'GINECO', 40, 180.00, 4),
(1, 'Consulta Pediátrica', 'PEDIATRIA', 30, 140.00, 5);

-- Inserir templates de mensagens padrão
INSERT OR IGNORE INTO templates_mensagens (clinica_id, tipo, nome, conteudo, variaveis) VALUES
(1, 'boas_vindas', 'Mensagem de Boas-vindas', 'Olá! Bem-vindo(a) à nossa clínica. Como podemos ajudá-lo(a)?', '{}'),
(1, 'confirmacao', 'Confirmação de Agendamento', 'Olá {nome}! Seu agendamento foi confirmado para {data} às {hora}. Local: {endereco}', '{"nome": "Nome do paciente", "data": "Data da consulta", "hora": "Horário da consulta", "endereco": "Endereço da clínica"}'),
(1, 'lembrete', 'Lembrete de Consulta', 'Lembrete: {nome}, você tem consulta amanhã ({data}) às {hora}. Em caso de cancelamento, entre em contato.', '{"nome": "Nome do paciente", "data": "Data da consulta", "hora": "Horário da consulta"}'),
(1, 'cancelamento', 'Cancelamento de Consulta', 'Olá {nome}, seu agendamento para {data} às {hora} foi cancelado. Entre em contato para reagendar.', '{"nome": "Nome do paciente", "data": "Data da consulta", "hora": "Horário da consulta"}'),
(1, 'pos_consulta', 'Pós-consulta', 'Obrigado por sua visita, {nome}! Como foi sua experiência? Sua opinião é muito importante para nós.', '{"nome": "Nome do paciente"}');

-- Inserir campos padrão da anamnese
INSERT OR IGNORE INTO campos_anamnese (clinica_id, nome, tipo, obrigatorio, ordem, categoria) VALUES
(1, 'Queixa Principal', 'textarea', 1, 1, 'sintomas'),
(1, 'Histórico da Doença Atual', 'textarea', 1, 2, 'historico'),
(1, 'Antecedentes Pessoais', 'textarea', 0, 3, 'historico'),
(1, 'Antecedentes Familiares', 'textarea', 0, 4, 'historico'),
(1, 'Medicamentos em Uso', 'textarea', 0, 5, 'medicamentos'),
(1, 'Alergias', 'text', 0, 6, 'alergias'),
(1, 'Exame Físico', 'textarea', 1, 7, 'exame'),
(1, 'Hipótese Diagnóstica', 'textarea', 1, 8, 'diagnostico'),
(1, 'Conduta/Tratamento', 'textarea', 1, 9, 'tratamento');

-- Trigger para atualizar timestamp
CREATE TRIGGER IF NOT EXISTS update_configuracoes_timestamp 
    AFTER UPDATE ON configuracoes
BEGIN
    UPDATE configuracoes SET atualizado_em = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_procedimentos_timestamp 
    AFTER UPDATE ON procedimentos
BEGIN
    UPDATE procedimentos SET atualizado_em = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_equipamentos_timestamp 
    AFTER UPDATE ON equipamentos
BEGIN
    UPDATE equipamentos SET atualizado_em = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_templates_timestamp 
    AFTER UPDATE ON templates_mensagens
BEGIN
    UPDATE templates_mensagens SET atualizado_em = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_campos_anamnese_timestamp 
    AFTER UPDATE ON campos_anamnese
BEGIN
    UPDATE campos_anamnese SET atualizado_em = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
