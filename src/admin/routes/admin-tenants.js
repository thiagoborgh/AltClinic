const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../../database/postgres');
const { requireAdminAuth, requireSuperAdmin } = require('../middleware/adminAuth');
const { criarTenant } = require('../services/TenantProvisionService');
const { invalidarCacheFeatures } = require('../../middleware/featureFlag');

// GET / — listagem com filtros (status, plano, search)
router.get('/', async (req, res) => {
  try {
    const { status, plano, search, limit = 50, offset = 0 } = req.query;

    let whereClauses = [];
    let params = [];
    let idx = 1;

    if (status) {
      whereClauses.push(`t.status = $${idx++}`);
      params.push(status);
    }
    if (plano) {
      whereClauses.push(`t.plano = $${idx++}`);
      params.push(plano);
    }
    if (search) {
      whereClauses.push(`(t.nome ILIKE $${idx} OR t.slug ILIKE $${idx} OR t.email ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const whereSQL = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const { rows } = await pool.query(
      `SELECT t.id, t.nome, t.slug, t.email, t.email_admin, t.plano, t.status,
              t.trial_fim, t.uso_pacientes, t.uso_usuarios, t.ultimo_acesso,
              t.created_at, p.preco_mensal
       FROM tenants t
       LEFT JOIN planos p ON p.id = t.plano_id
       ${whereSQL}
       ORDER BY t.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM tenants t ${whereSQL}`,
      params
    );

    res.json({
      data: rows,
      total: parseInt(countRows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('[admin-tenants] GET /:', err.message);
    res.status(500).json({ error: 'Erro ao listar tenants' });
  }
});

// GET /:slug — perfil completo com uso e histórico
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const { rows } = await pool.query(
      `SELECT t.*, p.nome AS plano_nome, p.preco_mensal, p.features_json
       FROM tenants t
       LEFT JOIN planos p ON p.id = t.plano_id
       WHERE t.slug = $1`,
      [slug]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Tenant não encontrado' });

    const { rows: historico } = await pool.query(
      `SELECT * FROM tenant_planos_historico WHERE tenant_slug = $1 ORDER BY criado_em DESC LIMIT 20`,
      [slug]
    );

    const { rows: auditRecente } = await pool.query(
      `SELECT id, acao, detalhes_json, ip, criado_em FROM admin_audit_log
       WHERE tenant_slug = $1 ORDER BY criado_em DESC LIMIT 20`,
      [slug]
    );

    res.json({
      tenant: rows[0],
      historico_planos: historico,
      audit_recente: auditRecente
    });
  } catch (err) {
    console.error('[admin-tenants] GET /:slug:', err.message);
    res.status(500).json({ error: 'Erro ao buscar tenant' });
  }
});

// POST / — criar tenant; requer super_admin
router.post('/', requireSuperAdmin, async (req, res) => {
  try {
    const { nome, slug, cnpjCpf, emailAdmin, telefone, planoNome } = req.body;

    if (!nome || !slug || !emailAdmin) {
      return res.status(400).json({ error: 'nome, slug e emailAdmin são obrigatórios' });
    }

    const resultado = await criarTenant({
      nome,
      slug,
      cnpjCpf,
      emailAdmin,
      telefone,
      planoNome: planoNome || 'trial',
      adminId: req.adminUser?.id || 0
    });

    res.status(201).json({
      message: 'Tenant criado com sucesso',
      ...resultado
    });
  } catch (err) {
    console.error('[admin-tenants] POST /:', err.message);
    if (err.message.includes('já está em uso') || err.message.includes('Slug inválido')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Erro ao criar tenant' });
  }
});

// PATCH /:slug/plano — mudar plano; requer super_admin
router.patch('/:slug/plano', requireSuperAdmin, async (req, res) => {
  try {
    const { slug } = req.params;
    const { planoNome, motivo } = req.body;

    if (!planoNome) return res.status(400).json({ error: 'planoNome é obrigatório' });

    const { rows: tenantRows } = await pool.query(
      'SELECT plano FROM tenants WHERE slug = $1',
      [slug]
    );
    if (!tenantRows[0]) return res.status(404).json({ error: 'Tenant não encontrado' });

    const planoAnterior = tenantRows[0].plano;

    const { rows: planoRows } = await pool.query(
      'SELECT id FROM planos WHERE nome = $1 AND ativo = TRUE',
      [planoNome]
    );
    if (!planoRows[0]) return res.status(400).json({ error: `Plano '${planoNome}' não encontrado ou inativo` });

    await pool.query(
      `UPDATE tenants SET plano = $1, plano_id = $2, plano_ativo_desde = NOW(), atualizado_em = NOW()
       WHERE slug = $3`,
      [planoNome, planoRows[0].id, slug]
    );

    await pool.query(
      `INSERT INTO tenant_planos_historico (tenant_slug, plano_anterior, plano_novo, motivo, admin_id)
       VALUES ($1,$2,$3,$4,$5)`,
      [slug, planoAnterior, planoNome, motivo || null, req.adminUser?.id || 0]
    );

    await pool.query(
      `INSERT INTO admin_audit_log (admin_id, tenant_slug, acao, detalhes_json, ip)
       VALUES ($1,$2,'tenant.mudar_plano',$3,$4)`,
      [
        req.adminUser?.id || 0,
        slug,
        JSON.stringify({ plano_anterior: planoAnterior, plano_novo: planoNome, motivo }),
        req.ip || null
      ]
    ).catch(() => {});

    invalidarCacheFeatures(slug);

    res.json({ message: 'Plano atualizado com sucesso', plano_anterior: planoAnterior, plano_novo: planoNome });
  } catch (err) {
    console.error('[admin-tenants] PATCH /:slug/plano:', err.message);
    res.status(500).json({ error: 'Erro ao mudar plano' });
  }
});

// PATCH /:slug/status — suspender/reativar; requer super_admin
router.patch('/:slug/status', requireSuperAdmin, async (req, res) => {
  try {
    const { slug } = req.params;
    const { status, motivo } = req.body;

    const statusValidos = ['ativo', 'trial', 'suspenso', 'cancelado', 'leitura'];
    if (!status || !statusValidos.includes(status)) {
      return res.status(400).json({ error: `status deve ser um de: ${statusValidos.join(', ')}` });
    }

    const { rows } = await pool.query(
      'SELECT status FROM tenants WHERE slug = $1',
      [slug]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Tenant não encontrado' });

    await pool.query(
      'UPDATE tenants SET status = $1, atualizado_em = NOW() WHERE slug = $2',
      [status, slug]
    );

    await pool.query(
      `INSERT INTO admin_audit_log (admin_id, tenant_slug, acao, detalhes_json, ip)
       VALUES ($1,$2,'tenant.mudar_status',$3,$4)`,
      [
        req.adminUser?.id || 0,
        slug,
        JSON.stringify({ status_anterior: rows[0].status, status_novo: status, motivo }),
        req.ip || null
      ]
    ).catch(() => {});

    res.json({ message: 'Status atualizado', status_anterior: rows[0].status, status_novo: status });
  } catch (err) {
    console.error('[admin-tenants] PATCH /:slug/status:', err.message);
    res.status(500).json({ error: 'Erro ao mudar status' });
  }
});

// POST /:slug/impersonar — gerar JWT de impersonação (TTL 2h)
router.post('/:slug/impersonar', async (req, res) => {
  try {
    const { slug } = req.params;
    const { motivo } = req.body;

    if (!motivo) return res.status(400).json({ error: 'motivo é obrigatório para impersonação' });

    const { rows } = await pool.query(
      'SELECT id, nome FROM tenants WHERE slug = $1',
      [slug]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Tenant não encontrado' });

    const tokenSessao = crypto.randomBytes(32).toString('hex');

    const jwtPayload = {
      sub: req.adminUser.id,
      nome: req.adminUser.nome,
      role: req.adminUser.role,
      isAdmin: true,
      impersonando: true,
      tenant_slug: slug,
      tenant_id: rows[0].id,
      sessao_token: tokenSessao
    };

    const token = jwt.sign(
      jwtPayload,
      process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    await pool.query(
      `INSERT INTO impersonacao_sessoes (admin_id, tenant_slug, motivo, token_sessao, ip)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.adminUser.id, slug, motivo, tokenSessao, req.ip || null]
    );

    await pool.query(
      `INSERT INTO admin_audit_log (admin_id, tenant_slug, acao, detalhes_json, ip)
       VALUES ($1,$2,'impersonacao.iniciar',$3,$4)`,
      [
        req.adminUser.id,
        slug,
        JSON.stringify({ motivo }),
        req.ip || null
      ]
    ).catch(() => {});

    res.json({ token, sessao_token: tokenSessao, expires_in: 7200 });
  } catch (err) {
    console.error('[admin-tenants] POST /:slug/impersonar:', err.message);
    res.status(500).json({ error: 'Erro ao iniciar impersonação' });
  }
});

// POST /:slug/encerrar-impersonacao — encerrar sessão de impersonação
router.post('/:slug/encerrar-impersonacao', async (req, res) => {
  try {
    const { slug } = req.params;
    const { sessao_token } = req.body;

    if (!sessao_token) return res.status(400).json({ error: 'sessao_token é obrigatório' });

    const { rowCount } = await pool.query(
      `UPDATE impersonacao_sessoes SET fim = NOW()
       WHERE token_sessao = $1 AND tenant_slug = $2 AND fim IS NULL`,
      [sessao_token, slug]
    );

    if (rowCount === 0) return res.status(404).json({ error: 'Sessão não encontrada ou já encerrada' });

    await pool.query(
      `INSERT INTO admin_audit_log (admin_id, tenant_slug, acao, detalhes_json, ip)
       VALUES ($1,$2,'impersonacao.encerrar',$3,$4)`,
      [
        req.adminUser.id,
        slug,
        JSON.stringify({ sessao_token }),
        req.ip || null
      ]
    ).catch(() => {});

    res.json({ message: 'Impersonação encerrada com sucesso' });
  } catch (err) {
    console.error('[admin-tenants] POST /:slug/encerrar-impersonacao:', err.message);
    res.status(500).json({ error: 'Erro ao encerrar impersonação' });
  }
});

module.exports = router;
