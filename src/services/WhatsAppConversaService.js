/**
 * WhatsAppConversaService — gerenciamento de conversas e mensagens
 */

class WhatsAppConversaService {
  constructor(pool, tenantId, schema) {
    this.pool     = pool;
    this.tenantId = tenantId;
    this.schema   = schema;
  }

  /** Resolver ou criar conversa aberta para o número */
  async resolverConversa(numero) {
    const { rows } = await this.pool.query(`
      SELECT * FROM "${this.schema}".whatsapp_conversas
      WHERE tenant_id = $1 AND numero = $2 AND status != 'encerrada'
      ORDER BY criado_em DESC
      LIMIT 1
    `, [this.tenantId, numero]);

    if (rows.length) return rows[0];

    const { rows: inserted } = await this.pool.query(`
      INSERT INTO "${this.schema}".whatsapp_conversas (tenant_id, numero, status, origem)
      VALUES ($1, $2, 'aberta', 'paciente')
      RETURNING *
    `, [this.tenantId, numero]);

    return inserted[0];
  }

  /** Persistir mensagem de entrada */
  async registrarMensagemEntrada(conversaId, payload) {
    const { tipo, conteudo, midia_url, midia_mime, provider_msg_id } = payload;

    const { rows } = await this.pool.query(`
      INSERT INTO "${this.schema}".whatsapp_mensagens
        (conversa_id, direcao, tipo, conteudo, midia_url, midia_mime, origem, provider_msg_id)
      VALUES ($1, 'entrada', $2, $3, $4, $5, 'humano', $6)
      RETURNING *
    `, [conversaId, tipo, conteudo, midia_url || null, midia_mime || null, provider_msg_id || null]);

    return rows[0];
  }

  /** Identificar paciente pelo número (vínculo explícito → telefone cadastrado) */
  async identificarPaciente(numero) {
    const { rows: vincRows } = await this.pool.query(`
      SELECT paciente_id FROM "${this.schema}".whatsapp_numero_paciente
      WHERE tenant_id = $1 AND numero = $2
    `, [this.tenantId, numero]);

    if (vincRows.length) {
      const { rows } = await this.pool.query(
        `SELECT * FROM "${this.schema}".pacientes WHERE id = $1`,
        [vincRows[0].paciente_id]
      );
      return rows[0] || null;
    }

    const numeroDigitos = numero.replace(/\D/g, '');
    const { rows } = await this.pool.query(`
      SELECT * FROM "${this.schema}".pacientes
      WHERE telefone = $1 OR telefone = $2 OR telefone = $3
      LIMIT 1
    `, [numero, numeroDigitos, `+${numeroDigitos}`]);

    return rows[0] || null;
  }

  /** Vincular número a paciente */
  async vincularPaciente(numero, pacienteId, usuarioId) {
    await this.pool.query(`
      INSERT INTO "${this.schema}".whatsapp_numero_paciente
        (tenant_id, numero, paciente_id, vinculado_por)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (tenant_id, numero) DO UPDATE
        SET paciente_id = EXCLUDED.paciente_id,
            vinculado_por = EXCLUDED.vinculado_por,
            vinculado_em = NOW()
    `, [this.tenantId, numero, pacienteId, usuarioId]);

    await this.pool.query(`
      UPDATE "${this.schema}".whatsapp_conversas
      SET paciente_id = $1, atualizado_em = NOW()
      WHERE tenant_id = $2 AND numero = $3 AND paciente_id IS NULL
    `, [pacienteId, this.tenantId, numero]);
  }

  /** Encerrar conversa */
  async encerrar(conversaId) {
    await this.pool.query(`
      UPDATE "${this.schema}".whatsapp_conversas
      SET status = 'encerrada', atualizado_em = NOW()
      WHERE id = $1 AND tenant_id = $2
    `, [conversaId, this.tenantId]);
  }
}

/** Renderiza template substituindo variáveis {chave} */
function renderizarTemplate(texto, variaveis) {
  return texto.replace(/\{(\w+)\}/g, (_, chave) => {
    return variaveis[chave] !== undefined ? variaveis[chave] : `{${chave}}`;
  });
}

module.exports = { WhatsAppConversaService, renderizarTemplate };
