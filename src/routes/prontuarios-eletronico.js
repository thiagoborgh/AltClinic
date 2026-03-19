const express = require('express');
const router = express.Router();
const multer = require('multer');
const { extractTenant } = require('../middleware/tenant');
const { authenticateToken } = require('../middleware/auth');
const { auditarProntuario } = require('../middleware/prontuarioAudit');
const { gerarProntuarioPdf } = require('../services/ProntuarioPdfService');
const HistoricoService = require('../services/HistoricoService');
const storageService = require('../services/storageService');

// Multer para anexos — 20MB, todos os tipos
const uploadAnexo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Helper: verifica se o perfil tem acesso a prontuários
function requireProntuarioRead(req, res, next) {
  const perfil = req.usuario?.perfil || req.user?.role;
  const bloqueados = ['recepcionista', 'financeiro'];
  if (bloqueados.includes(perfil)) {
    return res.status(403).json({ error: 'Acesso negado a prontuários' });
  }
  next();
}

function requireProntuarioWrite(req, res, next) {
  const perfil = req.usuario?.perfil || req.user?.role;
  const permitidos = ['profissional', 'medico', 'owner', 'admin', 'admin_master'];
  if (!permitidos.includes(perfil)) {
    return res.status(403).json({ error: 'Sem permissão para editar prontuários' });
  }
  next();
}

function getTenantId(req) {
  return req.tenantId || req.usuario?.tenant_slug || req.user?.tenantId;
}

function getUserId(req) {
  return req.usuario?.id || req.user?.id;
}

function getPerfil(req) {
  return req.usuario?.perfil || req.user?.role;
}

// ── GET /api/prontuarios-v2/cid10/buscar ──────────────────────────────────────
router.get('/cid10/buscar', extractTenant, authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Parâmetro q requerido (mín 2 caracteres)' });
    }

    const db = req.db;
    const { rows } = await db.query(
      `SELECT codigo, descricao FROM public.cid10
       WHERE codigo ILIKE $1
          OR to_tsvector('portuguese', descricao) @@ plainto_tsquery('portuguese', $2)
       ORDER BY codigo
       LIMIT 10`,
      [`${q}%`, q]
    );

    return res.json({ data: rows });
  } catch (err) {
    console.error('❌ GET /cid10/buscar:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ── GET /api/prontuarios-v2/:paciente_id ──────────────────────────────────────
router.get('/:paciente_id', extractTenant, authenticateToken, requireProntuarioRead,
  auditarProntuario('leitura'),
  async (req, res) => {
    try {
      const db = req.db;
      if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

      const { paciente_id } = req.params;
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const perfil = getPerfil(req);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // Verificar se paciente existe
      const paciente = await db.get(
        `SELECT id FROM pacientes WHERE id = $1`,
        [paciente_id]
      );
      if (!paciente) return res.status(404).json({ error: 'Paciente não encontrado' });

      const params = [paciente_id, tenantId];
      let whereProfissional = '';

      // Profissional vê apenas os seus próprios prontuários
      if (perfil === 'profissional' || perfil === 'medico') {
        params.push(userId);
        whereProfissional = `AND pr.id = $${params.length}`;
      }

      params.push(limit, offset);

      const rows = await db.all(`
        SELECT
          p.id,
          p.paciente_id,
          p.tipo_atendimento,
          p.status,
          p.criado_em,
          p.assinado_em,
          pr.id   AS profissional_id,
          pr.nome AS profissional_nome,
          pr.crm  AS profissional_crm
        FROM prontuarios p
        JOIN profissionais pr ON pr.id = p.profissional_id
        WHERE p.paciente_id = $1
          AND p.tenant_id = $2::uuid
          ${whereProfissional}
        ORDER BY p.criado_em DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `, params);

      const countRow = await db.get(`
        SELECT COUNT(*) AS total
        FROM prontuarios p
        WHERE p.paciente_id = $1 AND p.tenant_id = $2::uuid
      `, [paciente_id, tenantId]);

      const total = parseInt(countRow?.total || 0);

      return res.json({
        data: rows.map(r => ({
          ...r,
          profissional: { id: r.profissional_id, nome: r.profissional_nome, crm: r.profissional_crm },
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      console.error('❌ GET /prontuarios-v2/:paciente_id:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// ── POST /api/prontuarios-v2 ──────────────────────────────────────────────────
router.post('/', extractTenant, authenticateToken, requireProntuarioWrite,
  auditarProntuario('criacao'),
  async (req, res) => {
    try {
      const db = req.db;
      if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

      const { paciente_id, atendimento_id, tipo_atendimento, triagem_json } = req.body;
      const tenantId = getTenantId(req);
      const userId = getUserId(req);

      if (!paciente_id) return res.status(400).json({ error: 'paciente_id é obrigatório' });

      const paciente = await db.get(
        `SELECT id FROM pacientes WHERE id = $1`,
        [paciente_id]
      );
      if (!paciente) return res.status(404).json({ error: 'Paciente não encontrado' });

      const { rows: [prontuario] } = await db.query(`
        INSERT INTO prontuarios
          (tenant_id, paciente_id, profissional_id, atendimento_id, tipo_atendimento,
           triagem_json, status, criado_por)
        VALUES ($1::uuid, $2, $3, $4, $5, $6, 'draft', $7)
        RETURNING id, status, criado_em
      `, [
        tenantId, paciente_id, userId,
        atendimento_id || null,
        tipo_atendimento || 'consulta',
        triagem_json ? JSON.stringify(triagem_json) : null,
        userId,
      ]);

      return res.status(201).json(prontuario);
    } catch (err) {
      console.error('❌ POST /prontuarios-v2:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// ── PATCH /api/prontuarios-v2/:id/draft ───────────────────────────────────────
router.patch('/:id/draft', extractTenant, authenticateToken, requireProntuarioWrite,
  auditarProntuario('edicao'),
  async (req, res) => {
    try {
      const db = req.db;
      if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

      const { id } = req.params;
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const { entradas, prescricoes, cids } = req.body;

      const prontuario = await db.get(
        `SELECT id, status, profissional_id FROM prontuarios WHERE id = $1 AND tenant_id = $2::uuid`,
        [id, tenantId]
      );
      if (!prontuario) return res.status(404).json({ error: 'Prontuário não encontrado' });

      if (prontuario.status === 'assinado') {
        return res.status(400).json({
          error: 'Prontuário já assinado',
          message: 'Não é possível editar um prontuário assinado. Use /adendo para adicionar informações.',
        });
      }

      await db.transaction(async (client) => {
        if (entradas) {
          for (const [secao, conteudo] of Object.entries(entradas)) {
            await client.query(`
              INSERT INTO prontuario_entradas (prontuario_id, tenant_id, secao, conteudo_json, autor_id)
              VALUES ($1, $2::uuid, $3, $4, $5)
              ON CONFLICT (prontuario_id, secao) WHERE secao != 'adendo'
              DO UPDATE SET
                conteudo_json = EXCLUDED.conteudo_json,
                versao = prontuario_entradas.versao + 1,
                atualizado_em = now()
            `, [id, tenantId, secao, JSON.stringify(conteudo), userId]);
          }
        }

        if (prescricoes !== undefined) {
          await client.query(`DELETE FROM prontuario_prescricoes WHERE prontuario_id = $1`, [id]);
          for (let i = 0; i < prescricoes.length; i++) {
            const p = prescricoes[i];
            await client.query(`
              INSERT INTO prontuario_prescricoes
                (prontuario_id, tenant_id, medicamento, dose, frequencia, duracao, via, observacoes, ordem)
              VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, $8, $9)
            `, [id, tenantId, p.medicamento, p.dose || null, p.frequencia || null,
                p.duracao || null, p.via || null, p.observacoes || null, i]);
          }
        }

        if (cids !== undefined) {
          await client.query(`DELETE FROM prontuario_cids WHERE prontuario_id = $1`, [id]);
          for (const c of cids) {
            await client.query(`
              INSERT INTO prontuario_cids
                (prontuario_id, tenant_id, cid_codigo, cid_descricao, tipo, status_cid)
              VALUES ($1, $2::uuid, $3, $4, $5, $6)
            `, [id, tenantId, c.cid_codigo, c.cid_descricao,
                c.tipo || 'principal', c.status_cid || 'hipotese']);
          }
        }

        await client.query(
          `UPDATE prontuarios SET atualizado_em = now() WHERE id = $1`,
          [id]
        );
      });

      return res.json({ id, status: 'draft', atualizado_em: new Date().toISOString() });
    } catch (err) {
      console.error('❌ PATCH /prontuarios-v2/:id/draft:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// ── POST /api/prontuarios-v2/:id/assinar ─────────────────────────────────────
router.post('/:id/assinar', extractTenant, authenticateToken,
  auditarProntuario('assinatura'),
  async (req, res) => {
    try {
      const db = req.db;
      if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

      const { id } = req.params;
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const perfil = getPerfil(req);

      const prontuario = await db.get(
        `SELECT id, status, paciente_id, profissional_id FROM prontuarios
         WHERE id = $1 AND tenant_id = $2::uuid`,
        [id, tenantId]
      );
      if (!prontuario) return res.status(404).json({ error: 'Prontuário não encontrado' });
      if (prontuario.status === 'assinado') {
        return res.status(400).json({ error: 'Prontuário já assinado' });
      }

      // Profissional só pode assinar seus próprios prontuários
      if ((perfil === 'profissional' || perfil === 'medico') &&
          String(prontuario.profissional_id) !== String(userId)) {
        return res.status(403).json({ error: 'Apenas o profissional autor pode assinar este prontuário' });
      }

      await db.run(
        `UPDATE prontuarios
         SET status = 'assinado', assinado_por = $1, assinado_em = now(), atualizado_em = now()
         WHERE id = $2 AND tenant_id = $3::uuid`,
        [userId, id, tenantId]
      );

      await HistoricoService.registrar({
        db, tenantId,
        pacienteId: prontuario.paciente_id,
        tipoEvento: 'prontuario_assinado',
        referenciaId: id,
        referenciaTabela: 'prontuarios',
        descricao: 'Entrada de prontuário assinada pelo profissional',
        usuarioId: userId,
      });

      return res.json({
        id,
        status: 'assinado',
        assinado_em: new Date().toISOString(),
        message: 'Prontuário assinado com sucesso',
      });
    } catch (err) {
      console.error('❌ POST /prontuarios-v2/:id/assinar:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// ── POST /api/prontuarios-v2/:id/adendo ──────────────────────────────────────
router.post('/:id/adendo', extractTenant, authenticateToken, requireProntuarioWrite,
  async (req, res) => {
    try {
      const db = req.db;
      if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

      const { id } = req.params;
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const { conteudo } = req.body;

      if (!conteudo) return res.status(400).json({ error: 'conteudo é obrigatório' });

      const prontuario = await db.get(
        `SELECT id FROM prontuarios WHERE id = $1 AND tenant_id = $2::uuid`,
        [id, tenantId]
      );
      if (!prontuario) return res.status(404).json({ error: 'Prontuário não encontrado' });

      const { rows: [adendo] } = await db.query(`
        INSERT INTO prontuario_entradas
          (prontuario_id, tenant_id, secao, conteudo_json, autor_id)
        VALUES ($1, $2::uuid, 'adendo', $3, $4)
        RETURNING id, criado_em
      `, [id, tenantId, JSON.stringify({ texto: conteudo }), userId]);

      return res.status(201).json({
        id_adendo:    adendo.id,
        prontuario_id: id,
        criado_em:    adendo.criado_em,
      });
    } catch (err) {
      console.error('❌ POST /prontuarios-v2/:id/adendo:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// ── GET /api/prontuarios-v2/:id/pdf ──────────────────────────────────────────
router.get('/:id/pdf', extractTenant, authenticateToken, requireProntuarioRead,
  auditarProntuario('exportacao_pdf'),
  async (req, res) => {
    try {
      const db = req.db;
      if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

      const { id } = req.params;
      const tenantId = getTenantId(req);

      const prontuario = await db.get(`
        SELECT p.*, pac.nome AS paciente_nome, pr.nome AS profissional_nome, pr.crm AS profissional_crm
        FROM prontuarios p
        JOIN pacientes pac ON pac.id = p.paciente_id
        JOIN profissionais pr ON pr.id = p.profissional_id
        WHERE p.id = $1 AND p.tenant_id = $2::uuid
      `, [id, tenantId]);

      if (!prontuario) return res.status(404).json({ error: 'Prontuário não encontrado' });

      const [entradas, prescricoes, cids] = await Promise.all([
        db.all(`SELECT secao, conteudo_json, versao, criado_em FROM prontuario_entradas WHERE prontuario_id = $1 ORDER BY criado_em ASC`, [id]),
        db.all(`SELECT * FROM prontuario_prescricoes WHERE prontuario_id = $1 ORDER BY ordem ASC`, [id]),
        db.all(`SELECT * FROM prontuario_cids WHERE prontuario_id = $1`, [id]),
      ]);

      const pdfBuffer = await gerarProntuarioPdf({ ...prontuario, entradas, prescricoes, cids });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="prontuario-${id}.pdf"`);
      return res.send(pdfBuffer);
    } catch (err) {
      console.error('❌ GET /prontuarios-v2/:id/pdf:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// ── POST /api/prontuarios-v2/:id/anexos ──────────────────────────────────────
router.post('/:id/anexos', extractTenant, authenticateToken, requireProntuarioWrite,
  uploadAnexo.single('arquivo'),
  auditarProntuario('upload_anexo'),
  async (req, res) => {
    try {
      const db = req.db;
      if (!db) return res.status(400).json({ error: 'Tenant não especificado' });

      if (!req.file) return res.status(400).json({ error: 'Arquivo é obrigatório' });

      const { id } = req.params;
      const tenantId = getTenantId(req);
      const userId = getUserId(req);

      const prontuario = await db.get(
        `SELECT id FROM prontuarios WHERE id = $1 AND tenant_id = $2::uuid`,
        [id, tenantId]
      );
      if (!prontuario) return res.status(404).json({ error: 'Prontuário não encontrado' });

      const filename = `${Date.now()}-${req.file.originalname.replace(/\s/g, '_')}`;
      const url = await storageService.uploadPacienteFoto(
        `prontuarios/${tenantId}`,
        req.file.buffer,
        filename
      );

      const { rows: [anexo] } = await db.query(`
        INSERT INTO prontuario_anexos
          (prontuario_id, tenant_id, nome_arquivo, url, tipo_mime, tamanho_bytes, enviado_por)
        VALUES ($1, $2::uuid, $3, $4, $5, $6, $7)
        RETURNING id, nome_arquivo, url, tamanho_bytes
      `, [id, tenantId, req.file.originalname, url,
          req.file.mimetype, req.file.size, userId]);

      return res.status(201).json(anexo);
    } catch (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Arquivo excede o limite de 20MB' });
      }
      console.error('❌ POST /prontuarios-v2/:id/anexos:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

module.exports = router;
