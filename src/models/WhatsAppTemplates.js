const dbManager = require('./database');
const multiTenantDb = require('./MultiTenantDatabase');

/**
 * Classe para gerenciar templates de mensagens WhatsApp
 */
class WhatsAppTemplates {
  /**
   * Inicializa tabelas necessárias para templates
   */
  static initializeTables(tenantId) {
    try {
      const db = multiTenantDb.getTenantDb(tenantId);
      // Tabela de templates de mensagens
      db.exec(`
        CREATE TABLE IF NOT EXISTS whatsapp_templates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome VARCHAR(100) NOT NULL,
          tipo VARCHAR(50) NOT NULL, -- lembrete, confirmacao, inativo, proposta, etc.
          titulo VARCHAR(200) NOT NULL,
          conteudo TEXT NOT NULL,
          ativo BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_tipo ON whatsapp_templates(tipo);
      `);

      // Inserir templates padrão se não existirem - removido temporariamente para debug
      // this.insertDefaultTemplates();

    } catch (error) {
      console.error('❌ Erro ao inicializar tabelas de templates:', error.message);
    }
  }

  /**
   * Insere templates padrão para clínicas
   */
  insertDefaultTemplates() {
    try {
      const clinicas = this.db.prepare('SELECT id, nome FROM clinica').all();

      for (const clinica of clinicas) {
        // Verificar se já existem templates para esta clínica
        const existing = this.db.prepare('SELECT COUNT(*) as count FROM whatsapp_templates WHERE clinica_id = ?').get(clinica.id);

        if (existing.count === 0) {
          // Inserir templates padrão
          const templates = this.getDefaultTemplates(clinica.nome);

          for (const template of templates) {
            this.db.prepare(`
              INSERT INTO whatsapp_templates (clinica_id, nome, tipo, titulo, conteudo)
              VALUES (?, ?, ?, ?, ?)
            `).run(clinica.id, template.nome, template.tipo, template.titulo, template.conteudo);
          }

          console.log(`📝 Templates padrão criados para clínica ${clinica.nome}`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao inserir templates padrão:', error.message);
    }
  }

  /**
   * Retorna templates padrão
   */
  getDefaultTemplates(clinicaNome) {
    return [
      {
        nome: 'Lembrete de Consulta',
        tipo: 'lembrete',
        titulo: 'Lembrete de Consulta',
        conteudo: `⏰ *Lembrete de Consulta*

Olá {nome_paciente}!

Lembrando seu agendamento:
📅 Data: {data_agendamento}
💆‍♀️ Procedimento: {procedimento}
🏥 Local: ${clinicaNome}

{preparo}

Nos vemos em breve! 😊`
      },
      {
        nome: 'Confirmação de Agendamento',
        tipo: 'confirmacao',
        titulo: 'Agendamento Confirmado',
        conteudo: `🎉 *Agendamento Confirmado!*

Olá {nome_paciente}!

Seu agendamento foi realizado com sucesso:
📅 Data: {data_agendamento}
💆‍♀️ Procedimento: {procedimento}
🏥 Local: ${clinicaNome}

Nos vemos em breve! 😊`
      },
      {
        nome: 'Reativação de Paciente Inativo',
        tipo: 'inativo',
        titulo: 'Sentimos sua Falta',
        conteudo: `😊 *Sentimos sua Falta!*

Olá {nome_paciente}!

Faz {dias_inativos} dias desde seu último atendimento em ${clinicaNome}.

Que tal agendar uma nova sessão? Temos novidades especiais para você! 💄✨

Responda esta mensagem para agendar.`
      },
      {
        nome: 'Proposta Comercial',
        tipo: 'proposta',
        titulo: 'Proposta Especial',
        conteudo: `💼 *Proposta Especial - ${clinicaNome}*

Olá {nome_paciente}!

Preparamos uma proposta personalizada com os melhores procedimentos para você:

{procedimentos}

Valor total: R$ {valor_total}
Condições: {condicoes}

Interessado? Responda esta mensagem!

Atenciosamente,
Equipe ${clinicaNome}`
      },
      {
        nome: 'Agradecimento Pós-Atendimento',
        tipo: 'pos_atendimento',
        titulo: 'Obrigado pela Preferência',
        conteudo: `🙏 *Obrigado pela Preferência!*

Olá {nome_paciente}!

Foi um prazer atendê-lo em ${clinicaNome}.
Esperamos que tenha ficado satisfeito com nosso atendimento.

Sua opinião é muito importante! Conte-nos como foi sua experiência.

💕 Até a próxima!`
      }
    ];
  }

  /**
   * Busca templates por clínica
   */
  static findByClinica(tenantId) {
    try {
      this.initializeTables(tenantId);
      const db = multiTenantDb.getTenantDb(tenantId);
      return db.prepare(`
        SELECT * FROM whatsapp_templates
        WHERE ativo = 1
        ORDER BY tipo, nome
      `).all();
    } catch (error) {
      console.error('❌ Erro ao buscar templates:', error.message);
      return [];
    }
  }

  /**
   * Busca template por ID
   */
  static findById(tenantId, id) {
    try {
      const db = multiTenantDb.getTenantDb(tenantId);
      return db.prepare('SELECT * FROM whatsapp_templates WHERE id = ?').get(id);
    } catch (error) {
      console.error('❌ Erro ao buscar template:', error.message);
      return null;
    }
  }

  /**
   * Busca template por tipo e clínica
   */
  findByTipo(clinicaId, tipo) {
    try {
      return this.db.prepare(`
        SELECT * FROM whatsapp_templates
        WHERE clinica_id = ? AND tipo = ? AND ativo = 1
        ORDER BY updated_at DESC
        LIMIT 1
      `).get(clinicaId, tipo);
    } catch (error) {
      console.error('❌ Erro ao buscar template por tipo:', error.message);
      return null;
    }
  }

  /**
   * Cria novo template
   */
  static create(tenantId, dados) {
    try {
      this.initializeTables(tenantId);
      const db = multiTenantDb.getTenantDb(tenantId);
      const result = db.prepare(`
        INSERT INTO whatsapp_templates (nome, tipo, titulo, conteudo)
        VALUES (?, ?, ?, ?)
      `).run(dados.nome, dados.tipo, dados.titulo, dados.conteudo);

      return result.lastInsertRowid;
    } catch (error) {
      console.error('❌ Erro ao criar template:', error.message);
      throw error;
    }
  }

  /**
   * Atualiza template
   */
  static update(tenantId, id, dados) {
    try {
      const db = multiTenantDb.getTenantDb(tenantId);
      db.prepare(`
        UPDATE whatsapp_templates
        SET nome = ?, tipo = ?, titulo = ?, conteudo = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(dados.nome, dados.tipo, dados.titulo, dados.conteudo, id);

      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar template:', error.message);
      throw error;
    }
  }

  /**
   * Remove template (soft delete)
   */
  static delete(tenantId, id) {
    try {
      const db = multiTenantDb.getTenantDb(tenantId);
      db.prepare('UPDATE whatsapp_templates SET ativo = 0 WHERE id = ?').run(id);
      return true;
    } catch (error) {
      console.error('❌ Erro ao remover template:', error.message);
      throw error;
    }
  }

  /**
   * Processa template com dados do paciente/agendamento
   */
  processTemplate(template, dados = {}) {
    let conteudo = template.conteudo;

    // Substituir placeholders
    const placeholders = {
      '{nome_paciente}': dados.nome_paciente || '',
      '{data_agendamento}': dados.data_agendamento || '',
      '{procedimento}': dados.procedimento || '',
      '{preparo}': dados.preparo ? `\n\n📋 *Preparo necessário:*\n${dados.preparo}` : '',
      '{dias_inativos}': dados.dias_inativos || '',
      '{procedimentos}': dados.procedimentos || '',
      '{valor_total}': dados.valor_total || '',
      '{condicoes}': dados.condicoes || ''
    };

    // Substituir todos os placeholders
    for (const [placeholder, valor] of Object.entries(placeholders)) {
      conteudo = conteudo.replace(new RegExp(placeholder, 'g'), valor);
    }

    return {
      titulo: template.titulo,
      conteudo: conteudo.trim()
    };
  }
}

module.exports = WhatsAppTemplates;