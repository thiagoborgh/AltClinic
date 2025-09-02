-- Migração para adicionar tabela de imagens do prontuário
-- Data: 2025-09-02

CREATE TABLE IF NOT EXISTS prontuario_imagem (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL,
    categoria TEXT NOT NULL,
    descricao TEXT,
    data_imagem DATE NOT NULL,
    tags TEXT, -- JSON array
    arquivo_path TEXT NOT NULL, -- Caminho criptografado
    arquivo_nome TEXT NOT NULL,
    tamanho_arquivo INTEGER,
    tipo_mime TEXT DEFAULT 'image/webp',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES paciente(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_prontuario_imagem_paciente ON prontuario_imagem(paciente_id);
CREATE INDEX IF NOT EXISTS idx_prontuario_imagem_categoria ON prontuario_imagem(categoria);
CREATE INDEX IF NOT EXISTS idx_prontuario_imagem_data ON prontuario_imagem(data_imagem);

-- Trigger para atualizar updated_at
CREATE TRIGGER IF NOT EXISTS update_prontuario_imagem_timestamp 
    AFTER UPDATE ON prontuario_imagem
BEGIN
    UPDATE prontuario_imagem SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Adicionar algumas categorias padrão como comentário
-- Categorias sugeridas:
-- 'Antes do Tratamento'
-- 'Durante o Tratamento'  
-- 'Depois do Tratamento'
-- 'Evolução'
-- 'Complicação'
-- 'Resultado Final'
-- 'Documentação Médica'
-- 'Exame Complementar'
