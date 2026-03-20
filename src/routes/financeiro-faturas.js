'use strict';

/**
 * financeiro-faturas — rotas TDD 16
 * Faturas, Pagamentos, Caixa, Repasses e Tabela de Preços
 */
const express = require('express');
const router  = express.Router({ mergeParams: true });
const pool    = require('../database/postgres');
const { authenticateToken } = require('../middleware/auth');
const { extractTenant }     = require('../middleware/tenant');
const { schemaFromSlug }    = require('../services/CrmScoreService');
const FaturaService         = require('../services/FaturaService');

const auth = [extractTenant, authenticateToken];

function getSchema(req) {
  const slug = req.tenant?.slug || req.usuario?.tenant_slug;
  return slug ? schemaFromSlug(slug) : null;
}

function getTenantId(req) {
  return req.tenantId || req.tenant?.id || req.usuario?.tenant_id;
}

// ─── FATURAS ─────────────────────────────────────────────────────────────────

/**
 * GET /api/financeiro/faturas
 * Listagem com filtros + resumo financeiro
 */
router.get('/faturas', auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const {
      status,
      periodo_inicio,
      periodo_fim,
      profissional_id,
      paciente_id,
      page  = 1,
      limit = 20,
    } = req.query;

    const conditions = ['f.tenant_id = $1'];
    const params     = [tenantId];
    let   idx        = 2;

    if (status) {
      conditions.push(`f.status = $${idx++}`);
      params.push(status);
    }
    if (periodo_inicio) {
      conditions.push(`f.criado_em >= $${idx++}`);
      params.push(periodo_inicio);
    }
    if (periodo_fim) {
      conditions.push(`f.criado_em <= $${idx++}`);
      params.push(periodo_fim + ' 23:59:59');
    }
    if (profissional_id) {
      conditions.push(`f.profissional_id = $${idx++}`);
      params.push(parseInt(profissional_id, 10));
    }
    if (paciente_id) {
      conditions.push(`f.paciente_id = $${idx++}`);
      params.push(parseInt(paciente_id, 10));
    }

    const offset   = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const limitNum = Math.min(parseInt(limit, 10), 100);
    const where    = conditions.join(' AND ');

    const [faturasResult, countResult, resumoResult] = await Promise.all([
      pool.query(
        `SELECT f.*,
                p.nome  AS paciente_nome,
                pr.nome AS profissional_nome
         FROM "${schema}".faturas f
         LEFT JOIN "${schema}".pacientes     p  ON p.id  = f.paciente_id
         LEFT JOIN "${schema}".profissionais pr ON pr.id = f.profissional_id
         WHERE ${where}
         ORDER BY f.criado_em DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limitNum, offset]
      ),
      pool.query(
        `SELECT COUNT(*) AS total FROM "${schema}".faturas f WHERE ${where}`,
        params
      ),
      pool.query(
        `SELECT
           COALESCE(SUM(CASE WHEN DATE(criado_em) = CURRENT_DATE THEN valor_liquido END), 0)                          AS receita_dia,
           COALESCE(SUM(CASE WHEN DATE_TRUNC('month', criado_em) = DATE_TRUNC('month', NOW()) THEN valor_liquido END), 0) AS receita_mes,
           COALESCE(SUM(CASE WHEN status NOT IN ('paga','cancelada') THEN valor_liquido - valor_pago END), 0)          AS a_receber,
           COALESCE(SUM(CASE WHEN status = 'vencida' THEN valor_liquido - valor_pago END), 0)                         AS vencidas,
           CASE WHEN COUNT(CASE WHEN status = 'paga' THEN 1 END) > 0
                THEN ROUND(SUM(CASE WHEN status = 'paga' THEN valor_liquido END) / COUNT(CASE WHEN status = 'paga' THEN 1 END), 2)
                ELSE 0 END AS ticket_medio
         FROM "${schema}".faturas
         WHERE tenant_id = $1`,
        [tenantId]
      ),
    ]);

    res.json({
      success: true,
      data:    faturasResult.rows,
      total:   parseInt(countResult.rows[0].total, 10),
      page:    parseInt(page, 10),
      limit:   limitNum,
      resumo:  resumoResult.rows[0],
    });
  } catch (err) {
    console.error('[GET /faturas]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/financeiro/faturas/:id
 * Detalhes com itens e pagamentos
 */
router.get('/faturas/:id', auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const id       = parseInt(req.params.id, 10);

    const [faturaResult, itensResult, pagamentosResult] = await Promise.all([
      pool.query(
        `SELECT f.*,
                p.nome  AS paciente_nome,
                p.telefone AS paciente_telefone,
                pr.nome AS profissional_nome
         FROM "${schema}".faturas f
         LEFT JOIN "${schema}".pacientes     p  ON p.id  = f.paciente_id
         LEFT JOIN "${schema}".profissionais pr ON pr.id = f.profissional_id
         WHERE f.id = $1 AND f.tenant_id = $2`,
        [id, tenantId]
      ),
      pool.query(
        `SELECT * FROM "${schema}".faturas_itens WHERE fatura_id = $1 ORDER BY id`,
        [id]
      ),
      pool.query(
        `SELECT pg.*, u.nome AS usuario_nome
         FROM "${schema}".pagamentos pg
         LEFT JOIN "${schema}".usuarios u ON u.id = pg.usuario_id
         WHERE pg.fatura_id = $1
         ORDER BY pg.criado_em DESC`,
        [id]
      ),
    ]);

    if (!faturaResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Fatura não encontrada' });
    }

    res.json({
      success: true,
      data: {
        ...faturaResult.rows[0],
        itens:      itensResult.rows,
        pagamentos: pagamentosResult.rows,
      },
    });
  } catch (err) {
    console.error('[GET /faturas/:id]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/financeiro/faturas
 * Criar fatura manualmente
 */
router.post('/faturas', auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const {
      paciente_id,
      profissional_id,
      atendimento_id = null,
      vencimento,
      itens = [],
    } = req.body;

    if (!paciente_id || !profissional_id || !vencimento) {
      return res.status(400).json({ success: false, message: 'paciente_id, profissional_id e vencimento são obrigatórios' });
    }

    let valorTotal = 0;
    const itensProcessados = itens.map(item => {
      const vu      = parseFloat(item.valor_unitario || 0);
      const qtd     = parseInt(item.quantidade || 1);
      const desc    = parseFloat(item.desconto || 0);
      const subtotal = Math.round((vu * qtd - desc) * 100) / 100;
      valorTotal += subtotal;
      return { ...item, valor_unitario: vu, quantidade: qtd, desconto: desc, subtotal };
    });
    valorTotal = Math.round(valorTotal * 100) / 100;

    // Gerar número
    const seqRow = await pool.query(
      `SELECT COALESCE(MAX(id), 0) + 1 AS proximo FROM "${schema}".faturas WHERE tenant_id = $1`,
      [tenantId]
    );
    const ano    = new Date().getFullYear();
    const num    = String(seqRow.rows[0].proximo).padStart(6, '0');
    const numero = `FAT-${ano}-${num}`;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: [fatura] } = await client.query(`
        INSERT INTO "${schema}".faturas
          (tenant_id, numero, atendimento_id, paciente_id, profissional_id,
           valor_total, valor_liquido, vencimento)
        VALUES ($1,$2,$3,$4,$5,$6,$6,$7)
        RETURNING *
      `, [tenantId, numero, atendimento_id || null,
          parseInt(paciente_id, 10), parseInt(profissional_id, 10),
          valorTotal, vencimento]);

      for (const item of itensProcessados) {
        await client.query(`
          INSERT INTO "${schema}".faturas_itens
            (fatura_id, procedimento_id, descricao, quantidade, valor_unitario, desconto, subtotal)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
        `, [fatura.id, item.procedimento_id || null,
            item.descricao || 'Procedimento',
            item.quantidade, item.valor_unitario, item.desconto, item.subtotal]);
      }

      await client.query('COMMIT');
      res.status(201).json({ success: true, data: fatura });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[POST /faturas]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/financeiro/faturas/:id/desconto
 * Aplicar desconto (requer admin ou financeiro)
 */
router.patch('/faturas/:id/desconto', auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const id       = parseInt(req.params.id, 10);
    const { valor_desconto, desconto_motivo } = req.body;

    if (valor_desconto === undefined || valor_desconto === null) {
      return res.status(400).json({ success: false, message: 'valor_desconto é obrigatório' });
    }

    const usuarioId = req.usuario?.id || null;
    const desconto  = parseFloat(valor_desconto);

    const { rows } = await pool.query(
      `UPDATE "${schema}".faturas
       SET valor_desconto      = $1,
           valor_liquido       = valor_total - $1,
           desconto_motivo     = $2,
           desconto_usuario_id = $3,
           atualizado_em       = NOW()
       WHERE id = $4 AND tenant_id = $5
         AND status NOT IN ('paga','cancelada')
       RETURNING *`,
      [desconto, desconto_motivo || null, usuarioId, id, tenantId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Fatura não encontrada ou não pode ser alterada' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[PATCH /faturas/:id/desconto]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/financeiro/faturas/:id/cancelar
 * Cancelar fatura (requer admin ou financeiro)
 */
router.patch('/faturas/:id/cancelar', auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const id       = parseInt(req.params.id, 10);
    const usuarioId = req.usuario?.id || null;

    const { rows } = await pool.query(
      `UPDATE "${schema}".faturas
       SET status       = 'cancelada',
           cancelado_por = $1,
           cancelado_em  = NOW(),
           atualizado_em = NOW()
       WHERE id = $2 AND tenant_id = $3
         AND status NOT IN ('paga','cancelada')
       RETURNING *`,
      [usuarioId, id, tenantId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Fatura não encontrada ou não pode ser cancelada' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[PATCH /faturas/:id/cancelar]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PAGAMENTOS ──────────────────────────────────────────────────────────────

/**
 * GET /api/financeiro/faturas/:id/pagamentos
 * Histórico de pagamentos de uma fatura
 */
router.get('/faturas/:id/pagamentos', auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const id       = parseInt(req.params.id, 10);

    // Verificar que a fatura pertence ao tenant
    const { rows: check } = await pool.query(
      `SELECT id FROM "${schema}".faturas WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    if (!check.length) {
      return res.status(404).json({ success: false, message: 'Fatura não encontrada' });
    }

    const { rows } = await pool.query(
      `SELECT pg.*, u.nome AS usuario_nome
       FROM "${schema}".pagamentos pg
       LEFT JOIN "${schema}".usuarios u ON u.id = pg.usuario_id
       WHERE pg.fatura_id = $1
       ORDER BY pg.criado_em DESC`,
      [id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[GET /faturas/:id/pagamentos]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/financeiro/faturas/:id/pagamentos
 * Registrar pagamento em uma fatura
 */
router.post('/faturas/:id/pagamentos', auth, async (req, res) => {
  try {
    const tenantId  = getTenantId(req);
    const tenantSlug = req.tenant?.slug || req.usuario?.tenant_slug;
    const faturaId  = parseInt(req.params.id, 10);
    const usuarioId = req.usuario?.id;

    if (!req.body.forma) {
      return res.status(400).json({ success: false, message: 'forma é obrigatória' });
    }
    if (!req.body.valor) {
      return res.status(400).json({ success: false, message: 'valor é obrigatório' });
    }

    const svc    = new FaturaService(tenantId, tenantSlug);
    const result = await svc.registrarPagamento(faturaId, req.body, usuarioId);

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error('[POST /faturas/:id/pagamentos]', err);
    const status = err.status || 500;
    res.status(status).json({ success: false, message: err.message });
  }
});

// ─── CAIXA ────────────────────────────────────────────────────────────────────

/**
 * GET /api/financeiro/caixa
 * Movimentos do caixa do dia (?data=YYYY-MM-DD)
 */
router.get('/caixa', auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const data     = req.query.data || new Date().toISOString().slice(0, 10);

    const { rows } = await pool.query(
      `SELECT cm.*, u.nome AS usuario_nome
       FROM "${schema}".caixa_movimentos cm
       LEFT JOIN "${schema}".usuarios u ON u.id = cm.usuario_id
       WHERE cm.tenant_id = $1 AND cm.data = $2
       ORDER BY cm.criado_em ASC`,
      [tenantId, data]
    );

    const totais = rows.reduce((acc, m) => {
      if (['entrada','abertura'].includes(m.tipo)) acc.entradas += parseFloat(m.valor);
      if (['saida','sangria'].includes(m.tipo))    acc.saidas   += parseFloat(m.valor);
      return acc;
    }, { entradas: 0, saidas: 0 });
    totais.saldo = Math.round((totais.entradas - totais.saidas) * 100) / 100;

    res.json({ success: true, data: rows, totais });
  } catch (err) {
    console.error('[GET /caixa]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/financeiro/caixa/abertura
 * Abrir caixa
 */
router.post('/caixa/abertura', auth, async (req, res) => {
  try {
    const schema    = getSchema(req);
    const tenantId  = getTenantId(req);
    const usuarioId = req.usuario?.id;
    const { valor = 0, descricao = 'Abertura de caixa' } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO "${schema}".caixa_movimentos
         (tenant_id, data, tipo, valor, descricao, usuario_id)
       VALUES ($1, CURRENT_DATE, 'abertura', $2, $3, $4)
       RETURNING *`,
      [tenantId, parseFloat(valor), descricao, usuarioId]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[POST /caixa/abertura]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/financeiro/caixa/fechamento
 * Fechar caixa
 */
router.post('/caixa/fechamento', auth, async (req, res) => {
  try {
    const schema    = getSchema(req);
    const tenantId  = getTenantId(req);
    const usuarioId = req.usuario?.id;
    const { valor = 0, descricao = 'Fechamento de caixa' } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO "${schema}".caixa_movimentos
         (tenant_id, data, tipo, valor, descricao, usuario_id)
       VALUES ($1, CURRENT_DATE, 'fechamento', $2, $3, $4)
       RETURNING *`,
      [tenantId, parseFloat(valor), descricao, usuarioId]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[POST /caixa/fechamento]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/financeiro/caixa/saida
 * Saída manual do caixa
 */
router.post('/caixa/saida', auth, async (req, res) => {
  try {
    const schema    = getSchema(req);
    const tenantId  = getTenantId(req);
    const usuarioId = req.usuario?.id;
    const { valor, descricao, forma = null } = req.body;

    if (!valor || !descricao) {
      return res.status(400).json({ success: false, message: 'valor e descricao são obrigatórios' });
    }

    const { rows } = await pool.query(
      `INSERT INTO "${schema}".caixa_movimentos
         (tenant_id, data, tipo, valor, descricao, forma, usuario_id)
       VALUES ($1, CURRENT_DATE, 'saida', $2, $3, $4, $5)
       RETURNING *`,
      [tenantId, parseFloat(valor), descricao, forma, usuarioId]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[POST /caixa/saida]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── REPASSES ─────────────────────────────────────────────────────────────────

/**
 * GET /api/financeiro/repasses
 * Listagem de repasses (?profissional_id=X&mes=2026-03)
 */
router.get('/repasses', auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { profissional_id, mes } = req.query;

    const conditions = ['r.tenant_id = $1'];
    const params     = [tenantId];
    let   idx        = 2;

    if (profissional_id) {
      conditions.push(`r.profissional_id = $${idx++}`);
      params.push(parseInt(profissional_id, 10));
    }
    if (mes) {
      conditions.push(`r.mes_referencia = $${idx++}`);
      params.push(mes);
    }

    const { rows } = await pool.query(
      `SELECT r.*, pr.nome AS profissional_nome
       FROM "${schema}".repasses r
       LEFT JOIN "${schema}".profissionais pr ON pr.id = r.profissional_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY r.mes_referencia DESC, r.profissional_id`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[GET /repasses]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/financeiro/repasses/calcular
 * Calcular repasses mensais para todos os profissionais do tenant
 */
router.post('/repasses/calcular', auth, async (req, res) => {
  try {
    const schema     = getSchema(req);
    const tenantId   = getTenantId(req);
    const tenantSlug = req.tenant?.slug || req.usuario?.tenant_slug;
    const { mes_referencia } = req.body;

    if (!mes_referencia) {
      return res.status(400).json({ success: false, message: 'mes_referencia é obrigatório (ex: 2026-03)' });
    }

    // Buscar todos os profissionais ativos do tenant
    const { rows: profissionais } = await pool.query(
      `SELECT id FROM "${schema}".profissionais WHERE tenant_id = $1 AND ativo = true`,
      [tenantId]
    ).catch(() => ({ rows: [] }));

    const svc      = new FaturaService(tenantId, tenantSlug);
    const repasses = [];

    for (const prof of profissionais) {
      try {
        const repasse = await svc.calcularRepasse(prof.id, mes_referencia);
        if (repasse) repasses.push(repasse);
      } catch (err) {
        console.warn(`[repasses/calcular] Profissional ${prof.id}:`, err.message);
      }
    }

    res.json({ success: true, data: repasses, total: repasses.length });
  } catch (err) {
    console.error('[POST /repasses/calcular]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/financeiro/repasses/:id/pagar
 * Marcar repasse como pago
 */
router.patch('/repasses/:id/pagar', auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const id       = parseInt(req.params.id, 10);
    const { comprovante_url = null } = req.body;

    const { rows } = await pool.query(
      `UPDATE "${schema}".repasses
       SET status          = 'pago',
           pago_em         = NOW(),
           comprovante_url = $1
       WHERE id = $2 AND tenant_id = $3 AND status = 'pendente'
       RETURNING *`,
      [comprovante_url, id, tenantId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Repasse não encontrado ou já pago' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[PATCH /repasses/:id/pagar]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── TABELA DE PREÇOS ────────────────────────────────────────────────────────

/**
 * GET /api/financeiro/precos
 * Listar tabela de preços de procedimentos
 */
router.get('/precos', auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);

    const { rows } = await pool.query(
      `SELECT * FROM "${schema}".procedimentos_precos
       WHERE tenant_id = $1
       ORDER BY descricao`,
      [tenantId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[GET /precos]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/financeiro/precos
 * Criar preço de procedimento
 */
router.post('/precos', auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { procedimento_id = null, descricao, valor_particular } = req.body;

    if (!descricao || valor_particular === undefined) {
      return res.status(400).json({ success: false, message: 'descricao e valor_particular são obrigatórios' });
    }

    const { rows } = await pool.query(
      `INSERT INTO "${schema}".procedimentos_precos
         (tenant_id, procedimento_id, descricao, valor_particular)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (tenant_id, procedimento_id) DO UPDATE
         SET descricao        = EXCLUDED.descricao,
             valor_particular = EXCLUDED.valor_particular,
             atualizado_em    = NOW()
       RETURNING *`,
      [tenantId, procedimento_id, descricao, parseFloat(valor_particular)]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[POST /precos]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/financeiro/precos/:id
 * Atualizar preço de procedimento
 */
router.patch('/precos/:id', auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const id       = parseInt(req.params.id, 10);
    const { descricao, valor_particular, ativo } = req.body;

    const sets   = ['atualizado_em = NOW()'];
    const params = [id, tenantId];
    let   idx    = 3;

    if (descricao !== undefined) {
      sets.push(`descricao = $${idx++}`);
      params.push(descricao);
    }
    if (valor_particular !== undefined) {
      sets.push(`valor_particular = $${idx++}`);
      params.push(parseFloat(valor_particular));
    }
    if (ativo !== undefined) {
      sets.push(`ativo = $${idx++}`);
      params.push(ativo);
    }

    const { rows } = await pool.query(
      `UPDATE "${schema}".procedimentos_precos
       SET ${sets.join(', ')}
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      params
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Preço não encontrado' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[PATCH /precos/:id]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
