/**
 * AgendaService — integração com agendamentos para o bot WhatsApp
 */

class AgendaService {
  constructor(pool, schema) {
    this.pool   = pool;
    this.schema = schema;
  }

  /** Lista especialidades únicas dos profissionais ativos */
  async listarEspecialidades() {
    const { rows } = await this.pool.query(`
      SELECT DISTINCT especialidade FROM "${this.schema}".profissionais
      WHERE ativo = 1 AND especialidade IS NOT NULL
      ORDER BY especialidade
    `).catch(() => ({ rows: [] }));
    return rows.map(r => r.especialidade);
  }

  /** Lista profissionais ativos de uma especialidade */
  async listarProfissionais(especialidade) {
    const { rows } = await this.pool.query(`
      SELECT id, nome, especialidade FROM "${this.schema}".profissionais
      WHERE ativo = 1 AND especialidade ILIKE $1
      ORDER BY nome
    `, [especialidade]).catch(() => ({ rows: [] }));
    return rows;
  }

  /**
   * Busca slots disponíveis para um profissional nos próximos 7 dias
   * @param {number} profissionalId
   * @param {string} periodo - 'manha' | 'tarde' | 'qualquer'
   * @returns {Array} até 5 slots disponíveis
   */
  async buscarSlots(profissionalId, periodo = 'qualquer') {
    // Gerar slots candidatos (próximos 7 dias, 8h-18h, a cada 30min)
    const slots = [];
    const agora  = new Date();
    for (let d = 0; d < 7 && slots.length < 20; d++) {
      const dia = new Date(agora);
      dia.setDate(dia.getDate() + d);
      const diaSemana = dia.getDay();
      if (diaSemana === 0) continue; // pular domingo

      const horaInicio = 8;
      const horaFim    = 18;

      for (let h = horaInicio; h < horaFim; h++) {
        for (const min of [0, 30]) {
          const slot = new Date(dia);
          slot.setHours(h, min, 0, 0);
          if (slot <= agora) continue;

          if (periodo === 'manha' && h >= 12) continue;
          if (periodo === 'tarde'  && h < 12) continue;

          slots.push(slot);
          if (slots.length >= 20) break;
        }
        if (slots.length >= 20) break;
      }
    }

    if (!slots.length) return [];

    // Buscar horários já ocupados
    const inicio = slots[0];
    const fim    = slots[slots.length - 1];

    const { rows: ocupados } = await this.pool.query(`
      SELECT data_hora FROM "${this.schema}".agendamentos_lite
      WHERE profissional_id = $1
        AND data_hora >= $2 AND data_hora <= $3
        AND status NOT IN ('cancelado')
    `, [profissionalId, inicio, fim]).catch(() => ({ rows: [] }));

    const ocupadosSet = new Set(ocupados.map(r => new Date(r.data_hora).getTime()));

    const disponiveis = slots.filter(s => !ocupadosSet.has(s.getTime()));
    return disponiveis.slice(0, 5);
  }

  /** Verifica se um slot específico ainda está disponível (anti-race condition) */
  async verificarSlot(profissionalId, dataHora) {
    const { rows } = await this.pool.query(`
      SELECT 1 FROM "${this.schema}".agendamentos_lite
      WHERE profissional_id = $1
        AND data_hora = $2
        AND status NOT IN ('cancelado')
      LIMIT 1
    `, [profissionalId, dataHora]);
    return rows.length === 0; // true = disponível
  }

  /** Cria agendamento via bot */
  async criarAgendamento({ paciente_id, profissional_id, data_hora, origem = 'bot_whatsapp', procedimento_id = null }) {
    const { rows: [ag] } = await this.pool.query(`
      INSERT INTO "${this.schema}".agendamentos_lite
        (paciente_id, profissional_id, data_hora, status, origem, procedimento_id)
      VALUES ($1, $2, $3, 'agendado', $4, $5)
      RETURNING id, data_hora
    `, [paciente_id, profissional_id, data_hora, origem, procedimento_id]);
    return ag;
  }

  /** Busca agendamentos futuros de um paciente pelo telefone */
  async buscarAgendamentosPorTelefone(telefone) {
    const num = telefone.replace(/\D/g, '');
    const { rows } = await this.pool.query(`
      SELECT a.id, a.data_hora, a.status,
             pr.nome AS profissional_nome, proc.nome AS procedimento_nome
      FROM "${this.schema}".agendamentos_lite a
      LEFT JOIN "${this.schema}".profissionais pr   ON pr.id   = a.profissional_id
      LEFT JOIN "${this.schema}".procedimentos proc ON proc.id = a.procedimento_id
      WHERE a.paciente_id IN (
        SELECT id FROM "${this.schema}".pacientes
        WHERE telefone = $1 OR telefone = $2 OR telefone = $3
      )
      AND a.data_hora > NOW()
      AND a.status NOT IN ('cancelado')
      ORDER BY a.data_hora
      LIMIT 5
    `, [telefone, num, `+${num}`]).catch(() => ({ rows: [] }));
    return rows;
  }

  /** Cancela agendamento */
  async cancelarAgendamento(agendamentoId, motivo = 'cancelado_pelo_paciente') {
    await this.pool.query(`
      UPDATE "${this.schema}".agendamentos_lite
      SET status = 'cancelado', atualizado_em = NOW()
      WHERE id = $1
    `, [agendamentoId]);
  }

  /** Busca ou cria paciente pelo telefone/nome */
  async buscarOuCriarPaciente(nome, telefone) {
    const num = telefone.replace(/\D/g, '');
    const { rows: existing } = await this.pool.query(`
      SELECT id FROM "${this.schema}".pacientes
      WHERE telefone = $1 OR telefone = $2 OR telefone = $3
      LIMIT 1
    `, [telefone, num, `+${num}`]);

    if (existing.length) return existing[0].id;

    const { rows: [pac] } = await this.pool.query(`
      INSERT INTO "${this.schema}".pacientes (nome, telefone)
      VALUES ($1, $2)
      RETURNING id
    `, [nome, telefone]);
    return pac.id;
  }
}

module.exports = AgendaService;
