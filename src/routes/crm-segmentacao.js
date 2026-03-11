/**
 * CRM Camada 2 — Issue #23
 * Segmentação por Tags e Campanhas
 *
 * Endpoints:
 *   POST   /api/crm/tags/:pacienteId        — adicionar tag a paciente
 *   DELETE /api/crm/tags/:pacienteId/:tag   — remover tag
 *   GET    /api/crm/tags                    — listar todas as tags usadas pelo tenant
 *   GET    /api/crm/segmentos/inativos      — pacientes sem visita há 90+ dias
 *   GET    /api/crm/segmentos/por-tag/:tag  — pacientes com determinada tag
 *   POST   /api/crm/segmentos/campanha      — disparar mensagem para segmento via WhatsApp
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const UnifiedWhatsAppService = require('../services/UnifiedWhatsAppService');

// ── DDL ──────────────────────────────────────────────────────────────────────

const DDL_PACIENTE_TAGS = `
  CREATE TABLE IF NOT EXISTS paciente_tags (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id   TEXT NOT NULL,
    paciente_id BIGINT NOT NULL,
    tag         TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, paciente_id, tag)
  )
`;

const DDL_CRM_MENSAGENS = `
  CREATE TABLE IF NOT EXISTS crm_mensagens (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id   TEXT NOT NULL,
    paciente_id BIGINT,
    tipo        TEXT NOT NULL DEFAULT 'campanha',
    conteudo    TEXT,
    status      TEXT NOT NULL DEFAULT 'enviada',
    enviado_em  TIMESTAMP DEFAULT NOW()
  )
`;

async function ensureTables(db) {
  await db.run(DDL_PACIENTE_TAGS);
  await db.run(DDL_CRM_MENSAGENS);
}

// ── POST /tags/:pacienteId ────────────────────────────────────────────────────

router.post('/tags/:pacienteId', authenticateToken, async (req, res) => {
  try {
    const { tenantId, db } = req;
    const { pacienteId } = req.params;
    const { tag } = req.body;

    if (!tag || !tag.trim()) {
      return res.status(400).json({ success: false, message: 'Campo obrigatório: tag' });
    }

    await ensureTables(db);

    const result = await db.run(
      `INSERT INTO paciente_tags (tenant_id, paciente_id, tag)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id, paciente_id, tag) DO NOTHING
       RETURNING *`,
      [tenantId, pacienteId, tag.trim().toLowerCase()]
    );

    const tagRow = result.rows ? result.rows[0] : null;

    if (!tagRow) {
      return res.json({ success: true, message: 'Tag já existia para este paciente' });
    }

    res.status(201).json({ success: true, data: tagRow, message: 'Tag adicionada com sucesso' });
  } catch (error) {
    console.error('Erro ao adicionar tag:', error.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// ── DELETE /tags/:pacienteId/:tag ─────────────────────────────────────────────

router.delete('/tags/:pacienteId/:tag', authenticateToken, async (req, res) => {
  try {
    const { tenantId, db } = req;
    const { pacienteId, tag } = req.params;

    await ensureTables(db);

    const result = await db.run(
      `DELETE FROM paciente_tags
       WHERE tenant_id = $1 AND paciente_id = $2 AND tag = $3
       RETURNING id`,
      [tenantId, pacienteId, tag.toLowerCase()]
    );

    const deleted = result.rows ? result.rows[0] : null;

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Tag não encontrada para este paciente' });
    }

    res.json({ success: true, message: 'Tag removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover tag:', error.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// ── GET /tags ─────────────────────────────────────────────────────────────────

router.get('/tags', authenticateToken, async (req, res) => {
  try {
    const { tenantId, db } = req;

    await ensureTables(db);

    const rows = await db.all(
      `SELECT tag, COUNT(DISTINCT paciente_id) AS total_pacientes
       FROM paciente_tags
       WHERE tenant_id = $1
       GROUP BY tag
       ORDER BY total_pacientes DESC, tag ASC`,
      [tenantId]
    );

    res.json({ success: true, tags: rows, total: rows.length });
  } catch (error) {
    console.error('Erro ao listar tags:', error.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// ── GET /segmentos/inativos ───────────────────────────────────────────────────

router.get('/segmentos/inativos', authenticateToken, async (req, res) => {
  try {
    const { tenantId, db } = req;
    const dias = parseInt(req.query.dias) || 90;

    // Busca pacientes cujo último agendamento é anterior ao limite
    // ou que nunca agendaram, dentro do mesmo tenant
    const pacientes = await db.all(
      `SELECT p.*,
              MAX(a.data_hora) AS ultimo_agendamento,
              EXTRACT(DAY FROM NOW() - MAX(a.data_hora))::INT AS dias_inativo
       FROM pacientes p
       LEFT JOIN agendamentos a ON a.paciente_id = p.id AND a.tenant_id = p.tenant_id
       WHERE p.tenant_id = $1
       GROUP BY p.id
       HAVING MAX(a.data_hora) < NOW() - ($2 || ' days')::INTERVAL
          OR MAX(a.data_hora) IS NULL
       ORDER BY MAX(a.data_hora) ASC NULLS FIRST
       LIMIT 200`,
      [tenantId, dias]
    );

    res.json({
      success: true,
      total: pacientes.length,
      dias_referencia: dias,
      pacientes,
    });
  } catch (error) {
    console.error('Erro ao buscar inativos:', error.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// ── GET /segmentos/por-tag/:tag ───────────────────────────────────────────────

router.get('/segmentos/por-tag/:tag', authenticateToken, async (req, res) => {
  try {
    const { tenantId, db } = req;
    const { tag } = req.params;

    await ensureTables(db);

    const pacientes = await db.all(
      `SELECT p.*, pt.tag, pt.created_at AS tag_adicionada_em
       FROM paciente_tags pt
       INNER JOIN pacientes p ON p.id = pt.paciente_id AND p.tenant_id = pt.tenant_id
       WHERE pt.tenant_id = $1 AND pt.tag = $2
       ORDER BY p.nome ASC`,
      [tenantId, tag.toLowerCase()]
    );

    res.json({
      success: true,
      tag,
      total: pacientes.length,
      pacientes,
    });
  } catch (error) {
    console.error('Erro ao buscar pacientes por tag:', error.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// ── POST /segmentos/campanha ──────────────────────────────────────────────────

router.post('/segmentos/campanha', authenticateToken, async (req, res) => {
  try {
    const { tenantId, db } = req;
    const { tag, mensagem } = req.body;

    if (!tag || !mensagem) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: tag, mensagem',
      });
    }

    await ensureTables(db);

    // Busca pacientes com a tag informada
    const pacientes = await db.all(
      `SELECT p.id, p.nome, p.telefone
       FROM paciente_tags pt
       INNER JOIN pacientes p ON p.id = pt.paciente_id AND p.tenant_id = pt.tenant_id
       WHERE pt.tenant_id = $1 AND pt.tag = $2
         AND p.telefone IS NOT NULL`,
      [tenantId, tag.toLowerCase()]
    );

    if (pacientes.length === 0) {
      return res.json({
        success: true,
        message: 'Nenhum paciente encontrado com esta tag ou sem telefone cadastrado',
        data: { tag, enviados: 0, erros: 0 },
      });
    }

    const whatsapp = new UnifiedWhatsAppService();

    let enviados = 0;
    let erros = 0;
    const errosDetalhe = [];

    for (const paciente of pacientes) {
      try {
        // Interpolar {nome} na mensagem
        const mensagemFinal = mensagem.replace(/\{nome\}/gi, paciente.nome);

        // Enviar via UnifiedWhatsAppService
        const resultado = await whatsapp.sendMessage(
          tenantId,
          'campanha_tag',
          {
            to: paciente.telefone,
            message: mensagemFinal,
            pacienteId: paciente.id,
          }
        );

        const status = resultado && resultado.success ? 'enviada' : 'falha';

        // Logar em crm_mensagens
        await db.run(
          `INSERT INTO crm_mensagens (tenant_id, paciente_id, tipo, conteudo, status)
           VALUES ($1, $2, $3, $4, $5)`,
          [tenantId, paciente.id, `campanha_tag:${tag}`, mensagemFinal, status]
        );

        if (status === 'enviada') {
          enviados++;
        } else {
          erros++;
          errosDetalhe.push({ paciente_id: paciente.id, nome: paciente.nome, erro: 'Falha no envio' });
        }
      } catch (envioErr) {
        console.error(`Erro ao enviar para paciente ${paciente.id}:`, envioErr.message);
        erros++;
        errosDetalhe.push({ paciente_id: paciente.id, nome: paciente.nome, erro: envioErr.message });

        // Logar falha
        try {
          await db.run(
            `INSERT INTO crm_mensagens (tenant_id, paciente_id, tipo, conteudo, status)
             VALUES ($1, $2, $3, $4, 'falha')`,
            [tenantId, paciente.id, `campanha_tag:${tag}`, mensagem]
          );
        } catch (_) {}
      }
    }

    res.json({
      success: true,
      message: 'Campanha disparada',
      data: {
        tag,
        total_pacientes: pacientes.length,
        enviados,
        erros,
        erros_detalhe: errosDetalhe,
      },
    });
  } catch (error) {
    console.error('Erro ao disparar campanha:', error.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

module.exports = router;
