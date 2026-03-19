const express = require('express');
const router = express.Router();
const { Parser: Json2csv } = require('json2csv');
const { extractTenant } = require('../middleware/tenant');
const { authenticateToken } = require('../middleware/auth');
const { gerarHistoricoPdf } = require('../services/HistoricoPdfService');
const HistoricoService = require('../services/HistoricoService');

// Mapeamento de perfil → categorias permitidas (null = todas)
const CATEGORIAS_PERMITIDAS = {
  owner:         null,
  admin:         null,
  admin_master:  null,
  recepcionista: ['agendamento', 'financeiro', 'whatsapp', 'crm', 'geral'],
  profissional:  ['clinico', 'agendamento', 'geral'],
  medico:        ['clinico', 'agendamento', 'geral'],
  financeiro:    ['financeiro', 'whatsapp', 'geral'],
  enfermeira:    ['clinico', 'agendamento'],
};

function getPerfil(req) {
  return req.usuario?.perfil || req.user?.role;
}

function getTenantId(req) {
  return req.tenantId || req.usuario?.tenant_slug || req.user?.tenantId;
}

function getUserId(req) {
  return req.usuario?.id || req.user?.id;
}

// ── GET /api/pacientes/:id/historico/export ───────────────────────────────────
// Deve vir ANTES de /:id/historico para evitar conflito de rota
router.get('/:id/historico/export', extractTenant, authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

    const perfil = getPerfil(req);
    const exportPermitidos = ['owner', 'admin', 'admin_master', 'profissional', 'medico'];
    if (!exportPermitidos.includes(perfil)) {
      return res.status(403).json({ error: 'Sem permissão para exportar histórico' });
    }

    const { id: pacienteId } = req.params;
    const { formato = 'csv' } = req.query;
    const tenantId = getTenantId(req);

    if (!['csv', 'pdf'].includes(formato)) {
      return res.status(400).json({ error: 'Formato inválido. Use csv ou pdf.' });
    }

    const paciente = await db.get(
      `SELECT id, nome FROM pacientes WHERE id = $1`,
      [pacienteId]
    );
    if (!paciente) return res.status(404).json({ error: 'Paciente não encontrado' });

    const categoriasPerfil = CATEGORIAS_PERMITIDAS[perfil];
    const params = [tenantId, pacienteId];
    let whereExtra = '';

    if (categoriasPerfil) {
      const placeholders = categoriasPerfil.map((_, i) => `$${params.length + i + 1}`).join(', ');
      whereExtra = `AND h.categoria IN (${placeholders})`;
      params.push(...categoriasPerfil);
    }

    const eventos = await db.all(
      `SELECT h.tipo_evento, h.categoria, h.descricao, h.referencia_tabela, h.criado_em
       FROM historico_eventos h
       WHERE h.tenant_id = $1::uuid AND h.paciente_id = $2
         ${whereExtra}
       ORDER BY h.criado_em DESC`,
      params
    );

    const nomeBase = `historico_${paciente.nome.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;

    if (formato === 'csv') {
      const campos = ['tipo_evento', 'categoria', 'descricao', 'referencia_tabela', 'criado_em'];
      const parser = new Json2csv({ fields: campos });
      const csv = parser.parse(eventos);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${nomeBase}.csv"`);
      return res.send('\uFEFF' + csv); // BOM para Excel reconhecer UTF-8
    }

    const pdfBuffer = await gerarHistoricoPdf(paciente, eventos);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeBase}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('❌ GET /historico/export:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ── POST /api/pacientes/:id/historico/observacao ──────────────────────────────
router.post('/:id/historico/observacao', extractTenant, authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

    const { id: pacienteId } = req.params;
    const { descricao } = req.body;
    const tenantId = getTenantId(req);
    const usuarioId = getUserId(req);

    if (!descricao || !descricao.trim()) {
      return res.status(400).json({ error: 'descricao é obrigatória' });
    }

    const paciente = await db.get(`SELECT id FROM pacientes WHERE id = $1`, [pacienteId]);
    if (!paciente) return res.status(404).json({ error: 'Paciente não encontrado' });

    const { rows: [evento] } = await db.query(
      `INSERT INTO historico_eventos
         (tenant_id, paciente_id, tipo_evento, descricao, categoria, usuario_id)
       VALUES ($1::uuid, $2, 'observacao_manual', $3, 'geral', $4)
       RETURNING id, tipo_evento, descricao, criado_em`,
      [tenantId, pacienteId, descricao.trim(), usuarioId]
    );

    return res.status(201).json(evento);
  } catch (err) {
    console.error('❌ POST /historico/observacao:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ── GET /api/pacientes/:id/historico ─────────────────────────────────────────
router.get('/:id/historico', extractTenant, authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

    const { id: pacienteId } = req.params;
    const {
      tipo, categoria, data_inicio, data_fim,
      q, page = 1, limit = 20,
    } = req.query;

    const tenantId = getTenantId(req);
    const perfil = getPerfil(req);
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const paciente = await db.get(`SELECT id, nome FROM pacientes WHERE id = $1`, [pacienteId]);
    if (!paciente) return res.status(404).json({ error: 'Paciente não encontrado' });

    const categoriasPerfil = CATEGORIAS_PERMITIDAS[perfil];

    const params = [tenantId, pacienteId];
    const conditions = ['h.tenant_id = $1::uuid', 'h.paciente_id = $2'];
    let i = 3;

    // Filtro RBAC por categorias do perfil
    if (categoriasPerfil !== null && categoriasPerfil !== undefined) {
      const placeholders = categoriasPerfil.map(() => `$${i++}`).join(', ');
      conditions.push(`h.categoria IN (${placeholders})`);
      params.push(...categoriasPerfil);
    }

    if (categoria) {
      conditions.push(`h.categoria = $${i++}`);
      params.push(categoria);
    }
    if (tipo) {
      conditions.push(`h.tipo_evento = $${i++}`);
      params.push(tipo);
    }
    if (data_inicio) {
      conditions.push(`h.criado_em >= $${i++}`);
      params.push(new Date(data_inicio).toISOString());
    }
    if (data_fim) {
      conditions.push(`h.criado_em <= $${i++}`);
      params.push(new Date(data_fim + 'T23:59:59Z').toISOString());
    }
    if (q) {
      conditions.push(`h.descricao ILIKE $${i++}`);
      params.push(`%${q}%`);
    }

    const where = conditions.join(' AND ');

    const countRow = await db.get(
      `SELECT COUNT(*) AS total FROM historico_eventos h WHERE ${where}`,
      params
    );
    const total = parseInt(countRow?.total || 0);

    const offset = (pageNum - 1) * limitNum;
    const eventos = await db.all(
      `SELECT h.id, h.tipo_evento, h.categoria, h.descricao,
              h.referencia_id, h.referencia_tabela, h.usuario_id,
              h.criado_em, u.nome AS usuario_nome
       FROM historico_eventos h
       LEFT JOIN usuarios u ON u.id = h.usuario_id
       WHERE ${where}
       ORDER BY h.criado_em DESC
       LIMIT $${i++} OFFSET $${i++}`,
      [...params, limitNum, offset]
    );

    const resumo = await calcularResumo(db, tenantId, pacienteId, perfil);

    return res.json({
      data: eventos.map(e => ({
        id:                e.id,
        tipo_evento:       e.tipo_evento,
        categoria:         e.categoria,
        descricao:         e.descricao,
        referencia_id:     e.referencia_id,
        referencia_tabela: e.referencia_tabela,
        usuario:           e.usuario_id ? { id: e.usuario_id, nome: e.usuario_nome } : null,
        criado_em:         e.criado_em,
      })),
      pagination: {
        page:  pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      resumo,
    });
  } catch (err) {
    console.error('❌ GET /historico:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

async function calcularResumo(db, tenantId, pacienteId, perfil) {
  const podeVerClinico   = ['owner', 'admin', 'admin_master', 'profissional', 'medico', 'recepcionista', 'enfermeira'].includes(perfil);
  const podeVerFinanceiro = ['owner', 'admin', 'admin_master', 'financeiro', 'recepcionista'].includes(perfil);

  const [atendimentos, stats] = await Promise.all([
    podeVerClinico ? db.get(
      `SELECT COUNT(*) AS total, MAX(criado_em) AS ultimo
       FROM historico_eventos
       WHERE tenant_id = $1::uuid AND paciente_id = $2 AND tipo_evento = 'atendimento_realizado'`,
      [tenantId, pacienteId]
    ).catch(() => null) : null,

    podeVerFinanceiro ? db.get(
      `SELECT
         COALESCE(SUM(CASE WHEN tipo_evento = 'no_show' THEN 1 ELSE 0 END), 0) AS no_shows
       FROM historico_eventos
       WHERE tenant_id = $1::uuid AND paciente_id = $2`,
      [tenantId, pacienteId]
    ).catch(() => null) : null,
  ]);

  return {
    total_atendimentos: atendimentos ? parseInt(atendimentos.total) : undefined,
    ultimo_atendimento: atendimentos?.ultimo ?? undefined,
    no_shows:           stats ? parseInt(stats.no_shows) : undefined,
  };
}

module.exports = router;
