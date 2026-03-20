const express = require('express');
const router  = express.Router({ mergeParams: true });
const crypto  = require('crypto');
const pool    = require('../database/postgres');
const { authenticateToken } = require('../middleware/auth');
const { extractTenant }     = require('../middleware/tenant');
const { schemaFromSlug }    = require('../services/CrmScoreService');
const QRBillingService      = require('../services/QRBillingService');
const EFIBankService        = require('../services/EFIBankService');

function getSchema(req) {
  const slug = req.tenant?.slug || req.usuario?.tenant_slug;
  return slug ? schemaFromSlug(slug) : null;
}
function getTenantId(req) {
  return req.tenantId || req.tenant?.id || req.usuario?.tenant_id;
}
const auth = [extractTenant, authenticateToken];

// POST /faturas/:id/gerar-qr
router.post('/faturas/:id/gerar-qr', ...auth, async (req, res) => {
  try {
    const tenantId   = getTenantId(req);
    const tenantSlug = req.tenant?.slug || req.usuario?.tenant_slug;
    const { id }     = req.params;
    const { canal = 'presencial' } = req.body;

    const svc = new QRBillingService(tenantId, tenantSlug);
    const qr  = await svc.gerarQR(parseInt(id), canal);

    res.json({
      txid:           qr.txid,
      qr_code_base64: qr.qr_code_base64,
      copia_cola:     qr.copia_cola,
      valor:          parseFloat(qr.valor),
      expira_em:      qr.expira_em,
      canal:          qr.canal,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /faturas/:id/qr-atual
router.get('/faturas/:id/qr-atual', ...auth, async (req, res) => {
  try {
    const schema     = getSchema(req);
    const tenantId   = getTenantId(req);
    const { id }     = req.params;

    const { rows } = await pool.query(`
      SELECT * FROM "${schema}".qr_codes
      WHERE fatura_id = $1 AND tenant_id = $2
      ORDER BY criado_em DESC LIMIT 1
    `, [id, tenantId]);

    if (!rows.length) return res.status(404).json({ error: 'Nenhum QR encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /faturas/:id/status-pagamento
router.get('/faturas/:id/status-pagamento', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const { id }   = req.params;

    const { rows: [fatura] } = await pool.query(
      `SELECT id, status, valor_pago, valor_liquido FROM "${schema}".faturas WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    if (!fatura) return res.status(404).json({ error: 'Fatura não encontrada' });

    const { rows: [qr] } = await pool.query(
      `SELECT txid, status, expira_em, pago_em FROM "${schema}".qr_codes
       WHERE fatura_id = $1 ORDER BY criado_em DESC LIMIT 1`,
      [id]
    );

    res.json({
      fatura_id:   parseInt(id),
      status:      fatura.status,
      valor_pago:  parseFloat(fatura.valor_pago),
      saldo:       Math.round((parseFloat(fatura.valor_liquido) - parseFloat(fatura.valor_pago)) * 100) / 100,
      qr:          qr || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /webhook/pix — público, sem JWT
router.post('/webhook/pix', async (req, res) => {
  // Validar HMAC se configurado
  const secret = process.env.EFI_WEBHOOK_SECRET;
  if (secret) {
    const signature = req.headers['x-signature'] || req.headers['webhook-signature'] || '';
    const rawBody   = req.rawBody || JSON.stringify(req.body);
    const expected  = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    try {
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        return res.status(401).json({ error: 'Assinatura inválida' });
      }
    } catch {
      return res.status(401).json({ error: 'Assinatura inválida' });
    }
  }

  res.status(200).json({ ok: true }); // Responder imediatamente

  // Processar de forma assíncrona
  const pixList = req.body?.pix || [];
  setImmediate(async () => {
    for (const pix of pixList) {
      try {
        // Descobrir tenant pelo txid prefix
        const { rows: tenants } = await pool.query(
          "SELECT id, slug FROM public.tenants WHERE status IN ('active','trial')"
        );

        for (const tenant of tenants) {
          try {
            const svc = new QRBillingService(tenant.id, tenant.slug);
            await svc.processarPagamentoPix({
              txid:    pix.txid,
              valor:   pix.valor,
              pagador: pix.pagador,
              horario: pix.horario,
            });
          } catch { /* não é deste tenant */ }
        }
      } catch (err) {
        console.error('[QR Webhook] Erro ao processar pix:', err.message);
      }
    }
  });
});

// GET /admin/pix-config
router.get('/admin/pix-config', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);

    const { rows } = await pool.query(
      `SELECT id, tenant_id, chave_pix, tipo_chave, ambiente,
              validade_presencial_seg, validade_remoto_seg, ativo, atualizado_em
       FROM "${schema}".pix_config WHERE tenant_id = $1`,
      [tenantId]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /admin/pix-config
router.patch('/admin/pix-config', ...auth, async (req, res) => {
  try {
    const schema   = getSchema(req);
    const tenantId = getTenantId(req);
    const {
      client_id, client_secret, chave_pix, tipo_chave,
      ambiente, validade_presencial_seg, validade_remoto_seg,
    } = req.body;

    if (!client_id || !client_secret || !chave_pix || !tipo_chave) {
      return res.status(400).json({ error: 'client_id, client_secret, chave_pix, tipo_chave obrigatórios' });
    }

    const client_id_enc     = EFIBankService.encrypt(client_id);
    const client_secret_enc = EFIBankService.encrypt(client_secret);

    const { rows: [cfg] } = await pool.query(`
      INSERT INTO "${schema}".pix_config
        (tenant_id, client_id_enc, client_secret_enc, chave_pix, tipo_chave,
         ambiente, validade_presencial_seg, validade_remoto_seg)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (tenant_id) DO UPDATE SET
        client_id_enc           = EXCLUDED.client_id_enc,
        client_secret_enc       = EXCLUDED.client_secret_enc,
        chave_pix               = EXCLUDED.chave_pix,
        tipo_chave              = EXCLUDED.tipo_chave,
        ambiente                = EXCLUDED.ambiente,
        validade_presencial_seg = EXCLUDED.validade_presencial_seg,
        validade_remoto_seg     = EXCLUDED.validade_remoto_seg,
        atualizado_em           = NOW()
      RETURNING id, tenant_id, chave_pix, tipo_chave, ambiente, ativo, atualizado_em
    `, [
      tenantId, client_id_enc, client_secret_enc, chave_pix, tipo_chave,
      ambiente || 'producao',
      validade_presencial_seg || 600,
      validade_remoto_seg || 86400,
    ]);

    res.json(cfg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/pix-config/registrar-webhook
router.post('/admin/pix-config/registrar-webhook', ...auth, async (req, res) => {
  try {
    const tenantId   = getTenantId(req);
    const tenantSlug = req.tenant?.slug || req.usuario?.tenant_slug;
    const webhookUrl = req.body.webhookUrl || `${process.env.API_URL || ''}/api/financeiro/webhook/pix`;

    await EFIBankService.registrarWebhook({ tenantId, tenantSlug, webhookUrl });
    res.json({ ok: true, webhookUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
