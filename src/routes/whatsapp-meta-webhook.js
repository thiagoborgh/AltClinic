// whatsapp-meta-webhook.js
// Endpoints públicos para o webhook do Meta WhatsApp Cloud API.
//
// IMPORTANTE: Esta rota deve ser montada SEM o middleware extractTenantFirestore
// porque o Meta faz um GET de verificação sem nenhum header de tenant.
// Montagem em routes/index.js ANTES do bloco:
//   app.use('/api/whatsapp', extractTenantFirestore, whatsappRoutes)

const express = require('express');
const router  = express.Router();

const institutionalService = require('../services/MetaWhatsAppInstitutionalService');

// ── GET /api/whatsapp/webhook/meta ────────────────────────────────────────────
// Meta envia este GET durante a configuração do webhook para verificar a URL.
// Referência: https://developers.facebook.com/docs/graph-api/webhooks/getting-started
router.get('/', (req, res) => {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WA_WEBHOOK_VERIFY_TOKEN) {
        console.log('[Meta Webhook] Verificação bem-sucedida.');
        return res.status(200).send(challenge);
    }

    console.warn('[Meta Webhook] Falha na verificação. Verifique WA_WEBHOOK_VERIFY_TOKEN.');
    return res.sendStatus(403);
});

// ── POST /api/whatsapp/webhook/meta ───────────────────────────────────────────
// Meta envia todos os eventos aqui: status de mensagens e mensagens inbound.
// OBRIGATÓRIO: responder 200 imediatamente. Meta reenvia se não houver ACK em 20s.
router.post('/', express.json(), async (req, res) => {
    // ACK imediato — processamento ocorre de forma assíncrona
    res.sendStatus(200);

    const body = req.body;
    if (!body || body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
            if (change.field !== 'messages') continue;

            const value = change.value;

            // 1. Atualizações de status de entrega (sent / delivered / read / failed)
            for (const statusEntry of value.statuses || []) {
                try {
                    // Atualiza log institucional
                    institutionalService.updateDeliveryStatus(statusEntry);

                    // Atualiza whatsapp_message_status para mensagens de tenants
                    _updateTenantMessageStatus(statusEntry);
                } catch (e) {
                    console.error('[Meta Webhook] Erro ao processar status:', e.message);
                }
            }

            // 2. Mensagens inbound (cliente enviou mensagem para o número AltClinic)
            for (const message of value.messages || []) {
                try {
                    institutionalService.handleInboundMessage(value.metadata, message);
                } catch (e) {
                    console.error('[Meta Webhook] Erro ao processar mensagem inbound:', e.message);
                }
            }
        }
    }
});

// ── Helper: atualizar tabela de status para mensagens enviadas por tenants ────
async function _updateTenantMessageStatus({ id: wamId, status }) {
    if (!wamId || !status) return;

    try {
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });

        await pool.query(
            `UPDATE whatsapp_message_status
             SET status = $1, provider = 'meta_cloud'
             WHERE meta_wam_id = $2`,
            [status, wamId]
        );

        await pool.end();
    } catch (e) {
        // Não-fatal: pode acontecer se a migration 012 ainda não rodou
        console.error('[Meta Webhook] Erro ao atualizar tenant message status:', e.message);
    }
}

module.exports = router;
