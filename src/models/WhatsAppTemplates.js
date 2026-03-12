const multiTenantDb = require('../database/MultiTenantPostgres');

/**
 * Classe para gerenciar templates de mensagens WhatsApp
 */
class WhatsAppTemplates {
  /**
   * Inicializa tabelas necessárias para templates
   */
  static async initializeTables(tenantId) {
    try {
      const db = multiTenantDb.getTenantDb(tenantId);
      await db.run(`
        CREATE TABLE IF NOT EXISTS whatsapp_templates (
          id BIGSERIAL PRIMARY KEY,
          nome VARCHAR(100) NOT NULL,
          tipo VARCHAR(50) NOT NULL,
          titulo VARCHAR(200) NOT NULL,
          conteudo TEXT NOT NULL,
          ativo BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await db.run(
        `CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_tipo ON whatsapp_templates(tipo)`
      );
    } catch (error) {
      console.error('Erro ao inicializar tabelas de templates:', error.message);
    }
  }

  /**
   * Insere templates padrão para clínicas
   */
  async insertDefaultTemplates(db, clinicaNome) {
    try {
      const templates = this.getDefaultTemplates(clinicaNome);

      for (const template of templates) {
        await db.run(
          `INSERT INTO whatsapp_templates (nome, tipo, titulo, conteudo)
           VALUES ($1, $2, $3, $4)`,
          [template.nome, template.tipo, template.titulo, template.conteudo]
        );
      }

      console.log(`Templates padrão criados para clínica ${clinicaNome}`);
    } catch (error) {
      console.error('Erro ao inserir templates padrão:', error.message);
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
        conteudo: `*Lembrete de Consulta*

Olá {nome_paciente}!

Lembrando seu agendamento:
Data: {data_agendamento}
Procedimento: {procedimento}
Local: ${clinicaNome}

{preparo}

Nos vemos em breve!`
      },
      {
        nome: 'Confirmação de Agendamento',
        tipo: 'confirmacao',
        titulo: 'Agendamento Confirmado',
        conteudo: `*Agendamento Confirmado!*

Olá {nome_paciente}!

Seu agendamento foi realizado com sucesso:
Data: {data_agendamento}
Procedimento: {procedimento}
Local: ${clinicaNome}

Nos vemos em breve!`
      },
      {
        nome: 'Reativação de Paciente Inativo',
        tipo: 'inativo',
        titulo: 'Sentimos sua Falta',
        conteudo: `*Sentimos sua Falta!*

Olá {nome_paciente}!

Faz {dias_inativos} dias desde seu último atendimento em ${clinicaNome}.

Que tal agendar uma nova sessão? Temos novidades especiais para você!

Responda esta mensagem para agendar.`
      },
      {
        nome: 'Proposta Comercial',
        tipo: 'proposta',
        titulo: 'Proposta Especial',
        conteudo: `*Proposta Especial - ${clinicaNome}*

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
        conteudo: `*Obrigado pela Preferência!*

Olá {nome_paciente}!

Foi um prazer atendê-lo em ${clinicaNome}.
Esperamos que tenha ficado satisfeito com nosso atendimento.

Sua opinião é muito importante! Conte-nos como foi sua experiência.

Até a próxima!`
      }
    ];
  }

  /**
   * Busca templates por clínica
   */
  static async findByClinica(tenantId) {
    try {
      await WhatsAppTemplates.initializeTables(tenantId);
      const db = multiTenantDb.getTenantDb(tenantId);
      return await db.all(
        `SELECT * FROM whatsapp_templates WHERE ativo = TRUE ORDER BY tipo, nome`
      );
    } catch (error) {
      console.error('Erro ao buscar templates:', error.message);
      return [];
    }
  }

  /**
   * Busca template por ID
   */
  static async findById(tenantId, id) {
    try {
      const db = multiTenantDb.getTenantDb(tenantId);
      return await db.get(
        'SELECT * FROM whatsapp_templates WHERE id = $1',
        [id]
      );
    } catch (error) {
      console.error('Erro ao buscar template:', error.message);
      return null;
    }
  }

  /**
   * Busca template por tipo
   */
  async findByTipo(tenantId, tipo) {
    try {
      const db = multiTenantDb.getTenantDb(tenantId);
      return await db.get(
        `SELECT * FROM whatsapp_templates
         WHERE tipo = $1 AND ativo = TRUE
         ORDER BY updated_at DESC
         LIMIT 1`,
        [tipo]
      );
    } catch (error) {
      console.error('Erro ao buscar template por tipo:', error.message);
      return null;
    }
  }

  /**
   * Cria novo template
   */
  static async create(tenantId, dados) {
    try {
      await WhatsAppTemplates.initializeTables(tenantId);
      const db = multiTenantDb.getTenantDb(tenantId);
      const r = await db.run(
        `INSERT INTO whatsapp_templates (nome, tipo, titulo, conteudo)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [dados.nome, dados.tipo, dados.titulo, dados.conteudo]
      );
      return r.lastID;
    } catch (error) {
      console.error('Erro ao criar template:', error.message);
      throw error;
    }
  }

  /**
   * Atualiza template
   */
  static async update(tenantId, id, dados) {
    try {
      const db = multiTenantDb.getTenantDb(tenantId);
      await db.run(
        `UPDATE whatsapp_templates
         SET nome = $1, tipo = $2, titulo = $3, conteudo = $4, updated_at = NOW()
         WHERE id = $5`,
        [dados.nome, dados.tipo, dados.titulo, dados.conteudo, id]
      );
      return true;
    } catch (error) {
      console.error('Erro ao atualizar template:', error.message);
      throw error;
    }
  }

  /**
   * Remove template (soft delete)
   */
  static async delete(tenantId, id) {
    try {
      const db = multiTenantDb.getTenantDb(tenantId);
      await db.run(
        'UPDATE whatsapp_templates SET ativo = FALSE WHERE id = $1',
        [id]
      );
      return true;
    } catch (error) {
      console.error('Erro ao remover template:', error.message);
      throw error;
    }
  }

  /**
   * Processa template com dados do paciente/agendamento
   */
  processTemplate(template, dados = {}) {
    let conteudo = template.conteudo;

    const placeholders = {
      '{nome_paciente}': dados.nome_paciente || '',
      '{data_agendamento}': dados.data_agendamento || '',
      '{procedimento}': dados.procedimento || '',
      '{preparo}': dados.preparo ? `\n\nPreparo necessário:\n${dados.preparo}` : '',
      '{dias_inativos}': dados.dias_inativos || '',
      '{procedimentos}': dados.procedimentos || '',
      '{valor_total}': dados.valor_total || '',
      '{condicoes}': dados.condicoes || ''
    };

    for (const [placeholder, valor] of Object.entries(placeholders)) {
      conteudo = conteudo.replace(new RegExp(placeholder, 'g'), valor);
    }

    return { titulo: template.titulo, conteudo: conteudo.trim() };
  }
}

module.exports = WhatsAppTemplates;
