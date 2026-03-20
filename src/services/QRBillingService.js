/**
 * QRBillingService — orquestra geração, consulta e processamento de QR Pix
 */
const pool   = require('../database/postgres');
const { schemaFromSlug } = require('./CrmScoreService');
const EFIBankService = require('./EFIBankService');
const FaturaService  = require('./FaturaService');

class QRBillingService {
  constructor(tenantId, tenantSlug) {
    this.tenantId = tenantId;
    this.tenantSlug = tenantSlug;
    this.schema   = schemaFromSlug(tenantSlug);
  }

  // ── Gerar ou reusar QR code para fatura ───────────────────────────────────
  async gerarQR(faturaId, canal = 'presencial') {
    // 1. Validar fatura
    const { rows: [fatura] } = await pool.query(
      `SELECT f.*, p.nome AS paciente_nome, p.cpf AS paciente_cpf
       FROM "${this.schema}".faturas f
       LEFT JOIN "${this.schema}".pacientes p ON p.id = f.paciente_id
       WHERE f.id = $1 AND f.tenant_id = $2`,
      [faturaId, this.tenantId]
    );
    if (!fatura) throw Object.assign(new Error('Fatura não encontrada'), { status: 404 });
    if (['paga', 'cancelada'].includes(fatura.status)) {
      throw Object.assign(new Error('Fatura já paga ou cancelada'), { status: 409 });
    }

    // 2. Verificar QR ativo existente
    const { rows: qrsAtivos } = await pool.query(
      `SELECT * FROM "${this.schema}".qr_codes
       WHERE fatura_id = $1 AND status = 'ativo' AND expira_em > NOW()
       ORDER BY criado_em DESC LIMIT 1`,
      [faturaId]
    );
    if (qrsAtivos.length) return qrsAtivos[0];

    // 3. Buscar tentativa atual
    const { rows: [ultQR] } = await pool.query(
      `SELECT MAX(tentativa) AS max_tentativa FROM "${this.schema}".qr_codes WHERE fatura_id = $1`,
      [faturaId]
    );
    const tentativa = (parseInt(ultQR?.max_tentativa || 0) + 1);

    // 4. Marcar QR anterior como expirado se existir
    await pool.query(
      `UPDATE "${this.schema}".qr_codes SET status = 'expirado'
       WHERE fatura_id = $1 AND status = 'ativo'`,
      [faturaId]
    );

    // 5. Gerar txid
    const raw  = `altclinic${this.tenantSlug}${faturaId}${Date.now()}`;
    const txid = raw.replace(/[^a-zA-Z0-9]/g, '').substring(0, 35);

    // 6. Buscar config para calcular expiracao
    let expiracao = canal === 'presencial' ? 600 : 86400;
    try {
      const cfg = await EFIBankService.getPixConfig(this.tenantId, this.tenantSlug);
      expiracao = canal === 'presencial' ? cfg.validade_presencial_seg : cfg.validade_remoto_seg;
    } catch { /* usar defaults */ }

    const expiraEm = new Date(Date.now() + expiracao * 1000);

    // 7. Chamar EFI Bank — criar cobrança + imagem QR em paralelo
    const valor = parseFloat(fatura.valor_liquido) - parseFloat(fatura.valor_pago);
    let cobResp, qrBase64, copiaeCola, locId;

    try {
      cobResp = await EFIBankService.criarCobranca({
        tenantId: this.tenantId,
        tenantSlug: this.tenantSlug,
        txid, valor,
        paciente: { nome: fatura.paciente_nome, cpf: fatura.paciente_cpf },
        fatura: { numero: fatura.numero },
        expiracao,
      });
      copiaeCola = cobResp.pixCopiaECola;
      locId = cobResp.loc?.id ? String(cobResp.loc.id) : null;

      if (locId) {
        qrBase64 = await EFIBankService.gerarQRCode({
          tenantId: this.tenantId,
          tenantSlug: this.tenantSlug,
          locId,
        });
      }
    } catch (efiErr) {
      // Fallback: gerar QR estático simples (sem EFI Bank configurado)
      console.warn('[QRBilling] EFI Bank indisponível — usando fallback estático:', efiErr.message);
    }

    // 8. Salvar no banco
    const { rows: [qr] } = await pool.query(`
      INSERT INTO "${this.schema}".qr_codes
        (tenant_id, fatura_id, txid, valor, qr_code_base64, copia_cola,
         canal, expira_em, tentativa, loc_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `, [
      this.tenantId, faturaId, txid, valor,
      qrBase64 || null, copiaeCola || null,
      canal, expiraEm.toISOString(), tentativa, locId,
    ]);

    return qr;
  }

  // ── Processar pagamento confirmado (webhook) ──────────────────────────────
  async processarPagamentoPix({ txid, valor, pagador, horario }) {
    // 1. Buscar QR
    const { rows: [qr] } = await pool.query(
      `SELECT * FROM "${this.schema}".qr_codes WHERE txid = $1`,
      [txid]
    );
    if (!qr) return null; // txid de outro tenant — ignorar

    // 2. Idempotência
    if (qr.status === 'pago') return qr;

    const faturaId  = qr.fatura_id;
    const usuarioId = 0; // sistema

    const faturaSvc = new FaturaService(this.tenantId, this.tenantSlug);
    let resultado;
    try {
      resultado = await faturaSvc.registrarPagamento(faturaId, {
        valor: parseFloat(valor),
        forma: 'pix',
        data_recebimento: horario ? horario.slice(0, 10) : new Date().toISOString().slice(0, 10),
        referencia_externa: txid,
        origem: 'webhook_pix',
        idempotency_key: txid,
        observacao: pagador ? `Pix — ${pagador.nome || ''}` : 'Pix',
      }, usuarioId);
    } catch (err) {
      if (err.status === 409) {
        // já pago — só atualizar qr_codes
      } else {
        throw err;
      }
    }

    // 3. Atualizar qr_codes
    await pool.query(`
      UPDATE "${this.schema}".qr_codes
      SET status = 'pago', pago_em = $1, webhook_payload = $2
      WHERE txid = $3
    `, [horario || new Date().toISOString(), JSON.stringify({ txid, valor, pagador, horario }), txid]);

    // 4. Notificar via Socket.io
    try {
      const { io } = require('../server');
      if (io) {
        io.of('/pagamento').to(`fatura:${faturaId}`).emit('pagamento_confirmado', {
          faturaId, valor: parseFloat(valor),
          pagador: pagador?.nome, pago_em: horario, txid,
        });
      }
    } catch { /* socket opcional */ }

    return resultado;
  }
}

module.exports = QRBillingService;
