/**
 * AsaasService — Integração com gateway de pagamento Asaas (Brasil)
 *
 * Issues: #12 (integração Asaas) e #13 (webhooks de pagamento)
 *
 * Suporta: boleto, Pix, cartão de crédito
 * API Sandbox: https://sandbox.asaas.com/api/v3
 * API Prod:    https://api.asaas.com/api/v3
 *
 * Se ASAAS_API_KEY não estiver configurada, retorna dados mockados
 * para facilitar o desenvolvimento local sem credenciais.
 */
const axios = require('axios');

class AsaasService {
  constructor() {
    this.apiKey = process.env.ASAAS_API_KEY;
    this.baseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://api.asaas.com/api/v3'
        : 'https://sandbox.asaas.com/api/v3';
    this.isEnabled = !!this.apiKey;

    if (!this.isEnabled) {
      console.warn(
        '[AsaasService] ASAAS_API_KEY não configurada — usando respostas mockadas.'
      );
    }
  }

  // ─── Helpers internos ─────────────────────────────────────────────────────

  /** Headers padrão para todas as requisições Asaas */
  _headers() {
    return {
      'Content-Type': 'application/json',
      access_token: this.apiKey,
    };
  }

  /**
   * Wrapper HTTP genérico com tratamento de erro padronizado.
   * @param {'get'|'post'|'delete'} method
   * @param {string} path  — ex: '/customers'
   * @param {object} [data] — body para POST
   */
  async _request(method, path, data) {
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${path}`,
        headers: this._headers(),
        data,
        timeout: 15000,
      });
      return response.data;
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.errors?.[0]?.description || err.message;
      console.error(`[AsaasService] ${method.toUpperCase()} ${path} falhou (${status}): ${detail}`);
      throw new Error(`Asaas API error [${status}]: ${detail}`);
    }
  }

  // ─── Mock helpers (desenvolvimento sem ASAAS_API_KEY) ─────────────────────

  _mockCustomer({ name, email }) {
    return {
      id: `mock_cus_${Date.now()}`,
      name,
      email,
      dateCreated: new Date().toISOString().slice(0, 10),
      object: 'customer',
      _mock: true,
    };
  }

  _mockSubscription({ customerId, planName, value }) {
    return {
      id: `mock_sub_${Date.now()}`,
      customer: customerId,
      billingType: 'PIX',
      cycle: 'MONTHLY',
      value,
      description: planName,
      status: 'ACTIVE',
      nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      paymentLink: 'https://sandbox.asaas.com/mock-payment-link',
      _mock: true,
    };
  }

  // ─── API pública ──────────────────────────────────────────────────────────

  /**
   * Cria um customer no Asaas.
   * @param {{ name: string, email: string, cpfCnpj?: string, phone?: string }} data
   */
  async createCustomer({ name, email, cpfCnpj, phone }) {
    if (!this.isEnabled) {
      console.log('[AsaasService] [mock] createCustomer:', { name, email });
      return this._mockCustomer({ name, email });
    }

    const payload = { name, email };
    if (cpfCnpj) payload.cpfCnpj = cpfCnpj.replace(/\D/g, '');
    if (phone) payload.mobilePhone = phone.replace(/\D/g, '');

    const customer = await this._request('post', '/customers', payload);
    console.log(`[AsaasService] Customer criado: ${customer.id} (${email})`);
    return customer;
  }

  /**
   * Cria uma assinatura recorrente mensal no Asaas.
   * @param {{
   *   customerId: string,
   *   planName: string,
   *   value: number,
   *   description: string,
   *   externalReference?: string,
   * }} opts
   */
  async createSubscription({ customerId, planName, value, description, externalReference }) {
    if (!this.isEnabled) {
      console.log('[AsaasService] [mock] createSubscription:', { customerId, planName, value });
      return this._mockSubscription({ customerId, planName, value });
    }

    // Próximo vencimento = amanhã (Asaas exige data futura para 1ª cobrança)
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + 1);
    const nextDueDate = nextDue.toISOString().slice(0, 10);

    const payload = {
      customer: customerId,
      billingType: 'UNDEFINED', // Asaas permite que o cliente escolha boleto/Pix/cartão
      cycle: 'MONTHLY',
      value,
      nextDueDate,
      description: description || planName,
    };

    if (externalReference) payload.externalReference = externalReference;

    const subscription = await this._request('post', '/subscriptions', payload);
    console.log(`[AsaasService] Assinatura criada: ${subscription.id} (plano: ${planName})`);
    return subscription;
  }

  /**
   * Cancela uma assinatura no Asaas.
   * @param {string} subscriptionId
   */
  async cancelSubscription(subscriptionId) {
    if (!this.isEnabled) {
      console.log('[AsaasService] [mock] cancelSubscription:', subscriptionId);
      return { deleted: true, id: subscriptionId, _mock: true };
    }

    const result = await this._request('delete', `/subscriptions/${subscriptionId}`);
    console.log(`[AsaasService] Assinatura cancelada: ${subscriptionId}`);
    return result;
  }

  /**
   * Busca os pagamentos (faturas) de uma assinatura.
   * @param {string} subscriptionId
   * @returns {Promise<Array>}
   */
  async getSubscriptionPayments(subscriptionId) {
    if (!this.isEnabled) {
      console.log('[AsaasService] [mock] getSubscriptionPayments:', subscriptionId);
      return [
        {
          id: `mock_pay_${Date.now()}`,
          subscription: subscriptionId,
          status: 'CONFIRMED',
          value: 149,
          dueDate: new Date().toISOString().slice(0, 10),
          paymentDate: new Date().toISOString().slice(0, 10),
          invoiceUrl: 'https://sandbox.asaas.com/mock-invoice',
          _mock: true,
        },
      ];
    }

    const result = await this._request('get', `/payments?subscription=${subscriptionId}`);
    return result.data || [];
  }

  /**
   * Busca dados de um customer pelo ID.
   * @param {string} customerId
   */
  async getCustomer(customerId) {
    if (!this.isEnabled) {
      console.log('[AsaasService] [mock] getCustomer:', customerId);
      return {
        id: customerId,
        name: 'Mock Customer',
        email: 'mock@example.com',
        _mock: true,
      };
    }

    const customer = await this._request('get', `/customers/${customerId}`);
    return customer;
  }
}

module.exports = new AsaasService();
