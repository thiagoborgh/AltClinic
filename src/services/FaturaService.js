'use strict';

/**
 * FaturaService — ciclo de vida completo de faturas
 * Usado por: rotas financeiras + módulo de atendimentos + job de vencimento
 */
const pool = require('../database/postgres');
const { schemaFromSlug } = require('./CrmScoreService');

class FaturaService {
  constructor(tenantId, tenantSlug) {
    this.tenantId = tenantId;
    this.schema   = schemaFromSlug(tenantSlug);
  }

  // ── Gerar fatura ao finalizar atendimento ─────────────────────────────────
  async gerarFaturaDoAtendimento(atendimentoId) {
    // 1. Idempotência: já existe fatura para este atendimento?
    const existing = await pool.query(
      `SELECT * FROM "${this.schema}".faturas WHERE atendimento_id = $1 AND tenant_id = $2`,
      [atendimentoId, this.tenantId]
    );
    if (existing.rows.length) return existing.rows[0];

    // 2. Buscar procedimentos do prontuário do atendimento
    const procsQuery = await pool.query(`
      SELECT pp.procedimento_id, pp.descricao, pp.quantidade, pp.valor_unitario,
             COALESCE(pr.valor_particular, 0) AS preco_tabela
      FROM "${this.schema}".prontuarios_procedimentos pp
      LEFT JOIN "${this.schema}".procedimentos_precos pr
             ON pr.procedimento_id = pp.procedimento_id AND pr.tenant_id = $1
      WHERE pp.atendimento_id = $2
    `, [this.tenantId, atendimentoId]).catch(() => ({ rows: [] }));

    const procs = procsQuery.rows;

    // 3. Calcular total
    let valorTotal = 0;
    const itens = procs.map(p => {
      const vu      = parseFloat(p.valor_unitario || p.preco_tabela || 0);
      const qtd     = parseInt(p.quantidade || 1);
      const subtotal = Math.round(vu * qtd * 100) / 100;
      valorTotal += subtotal;
      return { ...p, valor_unitario: vu, quantidade: qtd, subtotal };
    });
    valorTotal = Math.round(valorTotal * 100) / 100;

    // 4. Gerar número sequencial
    const seqRow = await pool.query(
      `SELECT COALESCE(MAX(id), 0) + 1 AS proximo FROM "${this.schema}".faturas WHERE tenant_id = $1`,
      [this.tenantId]
    );
    const ano = new Date().getFullYear();
    const num = String(seqRow.rows[0].proximo).padStart(6, '0');
    const numero = `FAT-${ano}-${num}`;

    // 5. Vencimento = hoje + 7 dias
    const vencimento = new Date();
    vencimento.setDate(vencimento.getDate() + 7);
    const vencStr = vencimento.toISOString().slice(0, 10);

    // 6. Buscar paciente e profissional do atendimento
    const atRow = await pool.query(
      `SELECT paciente_id, profissional_id FROM "${this.schema}".atendimentos WHERE id = $1`,
      [atendimentoId]
    ).catch(() => ({ rows: [{}] }));
    const at = atRow.rows[0] || {};

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: [fatura] } = await client.query(`
        INSERT INTO "${this.schema}".faturas
          (tenant_id, numero, atendimento_id, paciente_id, profissional_id,
           valor_total, valor_liquido, vencimento)
        VALUES ($1,$2,$3,$4,$5,$6,$6,$7)
        ON CONFLICT (atendimento_id) DO UPDATE SET atualizado_em = NOW()
        RETURNING *
      `, [this.tenantId, numero, atendimentoId, at.paciente_id, at.profissional_id,
          valorTotal, vencStr]);

      for (const item of itens) {
        await client.query(`
          INSERT INTO "${this.schema}".faturas_itens
            (fatura_id, procedimento_id, descricao, quantidade, valor_unitario, subtotal)
          VALUES ($1,$2,$3,$4,$5,$6)
        `, [fatura.id, item.procedimento_id || null, item.descricao || 'Procedimento',
            item.quantidade, item.valor_unitario, item.subtotal]);
      }

      await client.query('COMMIT');
      return fatura;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ── Registrar pagamento ────────────────────────────────────────────────────
  async registrarPagamento(faturaId, payload, usuarioId) {
    const { rows: [fatura] } = await pool.query(
      `SELECT * FROM "${this.schema}".faturas WHERE id = $1 AND tenant_id = $2`,
      [faturaId, this.tenantId]
    );
    if (!fatura) throw Object.assign(new Error('Fatura não encontrada'), { status: 404 });
    if (fatura.status === 'cancelada') throw Object.assign(new Error('Fatura cancelada'), { status: 400 });
    if (fatura.status === 'paga') throw Object.assign(new Error('Fatura já paga'), { status: 409 });

    const saldo = Math.round((parseFloat(fatura.valor_liquido) - parseFloat(fatura.valor_pago)) * 100) / 100;
    const valor = Math.round(parseFloat(payload.valor) * 100) / 100;
    if (valor <= 0 || valor > saldo) {
      throw Object.assign(new Error(`Valor inválido. Saldo: ${saldo}`), { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: [pagamento] } = await client.query(`
        INSERT INTO "${this.schema}".pagamentos
          (fatura_id, valor, forma, parcelas, bandeira, data_recebimento,
           usuario_id, observacao, referencia_externa, origem, idempotency_key)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING *
      `, [
        faturaId, valor, payload.forma, payload.parcelas || 1,
        payload.bandeira || null,
        payload.data_recebimento || new Date().toISOString().slice(0, 10),
        usuarioId, payload.observacao || null,
        payload.referencia_externa || null,
        payload.origem || 'manual',
        payload.idempotency_key || null,
      ]);

      const novoPago   = Math.round((parseFloat(fatura.valor_pago) + valor) * 100) / 100;
      const novoStatus = novoPago >= parseFloat(fatura.valor_liquido) ? 'paga' : 'parcial';

      const { rows: [faturaAtualizada] } = await client.query(`
        UPDATE "${this.schema}".faturas
        SET valor_pago = $1, status = $2, atualizado_em = NOW()
        WHERE id = $3
        RETURNING *
      `, [novoPago, novoStatus, faturaId]);

      await client.query(`
        INSERT INTO "${this.schema}".caixa_movimentos
          (tenant_id, data, tipo, valor, descricao, forma, fatura_id, pagamento_id, usuario_id)
        VALUES ($1,$2,'entrada',$3,$4,$5,$6,$7,$8)
      `, [
        this.tenantId,
        payload.data_recebimento || new Date().toISOString().slice(0, 10),
        valor,
        `Pagamento fatura ${fatura.numero}`,
        payload.forma, faturaId, pagamento.id, usuarioId,
      ]);

      await client.query('COMMIT');
      return { pagamento, fatura: faturaAtualizada };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ── Calcular repasse ───────────────────────────────────────────────────────
  async calcularRepasse(profissionalId, mesReferencia) {
    // Buscar config do profissional
    const profRow = await pool.query(
      `SELECT percentual_repasse, valor_fixo_repasse FROM "${this.schema}".profissionais WHERE id = $1`,
      [profissionalId]
    ).catch(() => ({ rows: [{}] }));
    const prof = profRow.rows[0] || {};

    // Buscar valor bruto do mês
    const { rows: [ag] } = await pool.query(`
      SELECT COALESCE(SUM(fi.subtotal), 0) AS valor_bruto,
             COUNT(DISTINCT f.atendimento_id) AS qtd_atendimentos
      FROM "${this.schema}".faturas f
      JOIN "${this.schema}".faturas_itens fi ON fi.fatura_id = f.id
      WHERE f.profissional_id = $1
        AND f.tenant_id = $2
        AND f.status IN ('paga','parcial')
        AND TO_CHAR(f.criado_em, 'YYYY-MM') = $3
    `, [profissionalId, this.tenantId, mesReferencia]);

    const valorBruto = parseFloat(ag.valor_bruto || 0);
    const qtd        = parseInt(ag.qtd_atendimentos || 0);
    const percentual = prof.percentual_repasse ? parseFloat(prof.percentual_repasse) : null;
    const fixo       = prof.valor_fixo_repasse  ? parseFloat(prof.valor_fixo_repasse)  : null;

    let valorCalculado = 0;
    if (percentual) {
      valorCalculado = Math.round(valorBruto * percentual * 100) / 100;
    } else if (fixo) {
      valorCalculado = Math.round(fixo * qtd * 100) / 100;
    }

    const { rows: [repasse] } = await pool.query(`
      INSERT INTO "${this.schema}".repasses
        (tenant_id, profissional_id, mes_referencia, valor_bruto, percentual,
         valor_fixo_por_proc, valor_calculado)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (tenant_id, profissional_id, mes_referencia) DO UPDATE
        SET valor_bruto     = EXCLUDED.valor_bruto,
            valor_calculado = EXCLUDED.valor_calculado,
            calculado_em    = NOW()
        WHERE repasses.status != 'pago'
      RETURNING *
    `, [this.tenantId, profissionalId, mesReferencia, valorBruto,
        percentual, fixo, valorCalculado]);

    return repasse;
  }

  // ── Atualizar faturas vencidas ─────────────────────────────────────────────
  async atualizarStatusVencidas() {
    const { rowCount } = await pool.query(`
      UPDATE "${this.schema}".faturas
      SET status = 'vencida', atualizado_em = NOW()
      WHERE tenant_id = $1
        AND status = 'aguardando'
        AND vencimento < CURRENT_DATE
    `, [this.tenantId]);
    return rowCount;
  }
}

module.exports = FaturaService;
