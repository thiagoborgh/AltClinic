'use strict';

/**
 * PixService — TDD 15
 * Geração de QR Code PIX via Asaas ou fallback estático
 */
class PixService {
  constructor(tenantId, config) {
    this.tenantId = tenantId;
    this.config = config;
  }

  async gerarQRCode(valor, faturaId, descricao) {
    // Try AsaasService if available
    try {
      const AsaasService = require('./AsaasService');
      const asaas = new AsaasService(this.tenantId);
      const externalReference = `fatura_${faturaId}_${this.tenantId}`;
      const charge = await asaas.createCharge({
        billingType: 'PIX',
        value: valor,
        dueDate: this._dataVencimentoQR(),
        description: descricao || 'Cobrança clínica',
        externalReference,
        postalService: false
      });
      const pixData = await asaas.getPixQRCode(charge.id);
      return {
        qr_code_url: pixData.encodedImage ? `data:image/png;base64,${pixData.encodedImage}` : null,
        qr_code_payload: pixData.payload,
        expira_em: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        gateway_charge_id: charge.id
      };
    } catch (err) {
      // Fallback: generate static Pix copia-e-cola if chave_pix configured
      if (this.config?.chave_pix) {
        return {
          qr_code_url: null,
          qr_code_payload: this._gerarPixEstatico(valor, descricao),
          expira_em: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          gateway_charge_id: null
        };
      }
      throw err;
    }
  }

  async verificarStatus(gatewayChargeId) {
    const AsaasService = require('./AsaasService');
    const asaas = new AsaasService(this.tenantId);
    const charge = await asaas.getCharge(gatewayChargeId);
    return charge.status;
  }

  _dataVencimentoQR() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  _gerarPixEstatico(valor, descricao) {
    // Returns a simple Pix chave string for copy-paste
    const chave = this.config.chave_pix || '';
    return `${chave} | R$ ${Number(valor).toFixed(2)} | ${descricao || 'Pagamento'}`;
  }
}

module.exports = { PixService };
