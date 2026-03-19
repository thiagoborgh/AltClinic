'use strict';

/**
 * CobrancaWhatsAppService — TDD 15
 * Gerencia cobranças e lembretes financeiros via WhatsApp
 */

const TEMPLATES = {
  pos_atendimento: {
    amigavel: `Olá, {{nome}}! 😊 Tudo bem?

Passando para compartilhar o resumo do seu atendimento de hoje:

📋 *Serviço:* {{servico}}
💰 *Valor:* {{valor}}
📅 *Vencimento:* {{vencimento}}

{{pix_instrucao}}

Qualquer dúvida, estamos à disposição! 🏥`,

    neutro: `Olá, {{nome}}.

Segue o resumo do seu atendimento:

Serviço: {{servico}}
Valor: {{valor}}
Vencimento: {{vencimento}}

{{pix_instrucao}}

Atenciosamente.`,

    formal: `Prezado(a) {{nome}},

Encaminhamos o resumo do atendimento realizado:

Serviço: {{servico}}
Valor: R$ {{valor}}
Data de Vencimento: {{vencimento}}

{{pix_instrucao}}

Permanecemos à disposição.`
  },

  lembrete_venc: {
    amigavel: `Oi, {{nome}}! 👋

Lembramos que sua fatura vence em *{{dias_venc}} dia(s)*, no dia {{vencimento}}.

💰 *Valor:* {{valor}}

{{pix_instrucao}}

Se já realizou o pagamento, desconsidere esta mensagem. 🙏`,

    neutro: `Olá, {{nome}}.

Informamos que sua fatura vence em {{dias_venc}} dia(s), em {{vencimento}}.

Valor: {{valor}}

{{pix_instrucao}}`,

    formal: `Prezado(a) {{nome}},

Comunicamos que a fatura referente ao serviço prestado vencerá em {{dias_venc}} dia(s), na data de {{vencimento}}.

Valor: R$ {{valor}}

{{pix_instrucao}}

Atenciosamente.`
  },

  inadimplencia_d1: {
    amigavel: `Oi, {{nome}}! 🌟

Notamos que sua fatura venceu ontem. Acontece! 😊

💰 *Valor:* {{valor}}
📅 *Venceu em:* {{vencimento}}

{{pix_instrucao}}

Regularize quando puder. Estamos aqui para ajudar!`,

    neutro: `Olá, {{nome}}.

Identificamos que sua fatura venceu há 1 dia.

Valor: {{valor}}
Vencimento: {{vencimento}}

{{pix_instrucao}}

Por favor, efetue o pagamento o mais breve possível.`,

    formal: `Prezado(a) {{nome}},

Informamos que a fatura abaixo encontra-se em atraso há 1 dia.

Valor: R$ {{valor}}
Data de Vencimento: {{vencimento}}

{{pix_instrucao}}

Solicitamos a regularização do débito.`
  },

  inadimplencia_d7: {
    amigavel: `Olá, {{nome}}. 🤝

Sua fatura está em aberto há 7 dias. Gostaríamos de ajudá-lo(a) a regularizar.

💰 *Valor:* {{valor}}
📅 *Vencimento:* {{vencimento}}

{{pix_instrucao}}

Se tiver alguma dificuldade, entre em contato conosco para conversarmos! 💬`,

    neutro: `Olá, {{nome}}.

Sua fatura está em aberto há 7 dias.

Valor: {{valor}}
Vencimento: {{vencimento}}

{{pix_instrucao}}

Entre em contato caso precise de assistência.`,

    formal: `Prezado(a) {{nome}},

Comunicamos que a fatura em referência encontra-se em atraso há 7 dias.

Valor: R$ {{valor}}
Data de Vencimento: {{vencimento}}

{{pix_instrucao}}

Solicitamos contato para regularização do débito.`
  },

  inadimplencia_d15: {
    amigavel: `Olá, {{nome}}.

Sua fatura está em aberto há 15 dias. É importante regularizarmos juntos.

💰 *Valor:* {{valor}}
📅 *Vencimento:* {{vencimento}}

{{pix_instrucao}}

Por favor, entre em contato conosco para resolvermos da melhor forma. 🙏`,

    neutro: `Olá, {{nome}}.

Fatura em aberto há 15 dias.

Valor: {{valor}}
Vencimento: {{vencimento}}

{{pix_instrucao}}

Entre em contato urgentemente para regularização.`,

    formal: `Prezado(a) {{nome}},

A fatura em referência encontra-se em atraso há 15 dias, necessitando regularização imediata.

Valor: R$ {{valor}}
Data de Vencimento: {{vencimento}}

{{pix_instrucao}}

Solicitamos contato imediato para tratativas de regularização.`
  },

  confirmacao_pag: {
    amigavel: `Olá, {{nome}}! 🎉

Recebemos seu pagamento com sucesso!

✅ *Valor:* {{valor}}
📅 *Data:* {{data_pagamento}}

Obrigado pela confiança! Até a próxima. 😊`,

    neutro: `Olá, {{nome}}.

Confirmamos o recebimento do seu pagamento.

Valor: {{valor}}
Data: {{data_pagamento}}

Obrigado.`,

    formal: `Prezado(a) {{nome}},

Confirmamos o recebimento do pagamento conforme abaixo:

Valor: R$ {{valor}}
Data de Pagamento: {{data_pagamento}}

Agradecemos sua pontualidade.`
  }
};

class CobrancaWhatsAppService {
  constructor(pool, tenantId, schema) {
    this.pool = pool;
    this.tenantId = tenantId;
    this.schema = schema;
  }

  /**
   * Verifica se o horário atual está dentro da janela de envio
   */
  podeEnviarAgora(config) {
    try {
      const agora = new Date();
      const horaAtual = agora.getHours() * 60 + agora.getMinutes();

      const [hIni, mIni] = (config.horario_inicio_envio || '08:00').split(':').map(Number);
      const [hFim, mFim] = (config.horario_fim_envio || '20:00').split(':').map(Number);

      const inicio = hIni * 60 + mIni;
      const fim = hFim * 60 + mFim;

      return horaAtual >= inicio && horaAtual < fim;
    } catch {
      return false;
    }
  }

  /**
   * Retorna o próximo horário válido de envio (ISO string)
   */
  proximoHorarioValido(config) {
    const agora = new Date();
    const [hIni, mIni] = (config.horario_inicio_envio || '08:00').split(':').map(Number);

    const proximo = new Date(agora);

    // Se já passou do horário de início hoje, agenda para amanhã
    const minAtual = agora.getHours() * 60 + agora.getMinutes();
    const minInicio = hIni * 60 + mIni;

    if (minAtual >= minInicio) {
      proximo.setDate(proximo.getDate() + 1);
    }

    proximo.setHours(hIni, mIni, 0, 0);
    return proximo.toISOString();
  }

  /**
   * Monta a mensagem a partir do template e dos dados
   */
  montarMensagem(tipo, paciente, fatura, config) {
    const tom = config.tom_mensagem || 'amigavel';
    const templateSet = TEMPLATES[tipo];
    if (!templateSet) throw new Error(`Tipo de cobrança inválido: ${tipo}`);

    const template = templateSet[tom] || templateSet['amigavel'];

    let pixInstrucao = '';
    if (fatura.qr_code_payload) {
      pixInstrucao = `*PIX copia e cola:*\n\`${fatura.qr_code_payload}\``;
    } else if (config.chave_pix) {
      pixInstrucao = `*Chave PIX:* ${config.chave_pix}`;
    }

    const diasVenc = fatura.data_vencimento
      ? Math.ceil(
          (new Date(fatura.data_vencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      : null;

    const vars = {
      nome: paciente.nome || 'Paciente',
      servico: fatura.descricao || 'Consulta',
      valor: this._formatarValor(fatura.valor),
      vencimento: this._formatarData(fatura.data_vencimento),
      data_pagamento: this._formatarData(fatura.pago_em || new Date().toISOString()),
      dias_venc: diasVenc !== null ? String(Math.abs(diasVenc)) : '?',
      pix_instrucao: pixInstrucao
    };

    return this._renderizar(template, vars);
  }

  /**
   * Envia cobrança via WhatsApp
   */
  async enviar(cobranca) {
    try {
      const UnifiedWhatsAppService = require('./UnifiedWhatsAppService');
      const svc = new UnifiedWhatsAppService();

      const { rows: pacRows } = await this.pool.query(
        `SELECT telefone, nome FROM "${this.schema}".pacientes WHERE id = $1`,
        [cobranca.paciente_id]
      );
      const paciente = pacRows[0];
      if (!paciente || !paciente.telefone) {
        throw new Error('Paciente sem telefone cadastrado');
      }

      // Enviar imagem QR Code se disponível
      if (cobranca.qr_code_url) {
        await svc.sendMessage(this.tenantId, 'image', {
          phone: paciente.telefone,
          imageUrl: cobranca.qr_code_url,
          caption: 'QR Code PIX para pagamento'
        });
      }

      // Enviar mensagem de texto com copia-e-cola
      await svc.sendMessage(this.tenantId, 'text', {
        phone: paciente.telefone,
        message: cobranca.mensagem
      });

      // Atualizar status para enviado
      await this.pool.query(
        `UPDATE "${this.schema}".cobrancas_whatsapp
         SET status = 'enviado', enviado_em = NOW()
         WHERE id = $1`,
        [cobranca.id]
      );

      return { success: true };
    } catch (err) {
      // Registrar falha
      await this.pool.query(
        `UPDATE "${this.schema}".cobrancas_whatsapp
         SET status = 'falha', erro = $1
         WHERE id = $2`,
        [err.message, cobranca.id]
      ).catch(() => {});

      return { success: false, error: err.message };
    }
  }

  /**
   * Cancela cobranças pendentes para uma fatura
   */
  async cancelarPendentes(faturaId) {
    const { rowCount } = await this.pool.query(
      `UPDATE "${this.schema}".cobrancas_whatsapp
       SET status = 'cancelado'
       WHERE fatura_id = $1 AND status = 'pendente'`,
      [faturaId]
    );
    return rowCount;
  }

  /**
   * Cancela cobranças pendentes de um paciente
   */
  async cancelarPendentesPorPaciente(pacienteId) {
    const { rowCount } = await this.pool.query(
      `UPDATE "${this.schema}".cobrancas_whatsapp
       SET status = 'cancelado'
       WHERE paciente_id = $1 AND status = 'pendente'`,
      [pacienteId]
    );
    return rowCount;
  }

  /**
   * Determina tom adaptativo via Claude Haiku, com fallback 'amigavel'
   */
  async determinarTomAdaptativo(pacienteId, tipo) {
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const client = new Anthropic();

      // Buscar histórico do paciente
      const { rows } = await this.pool.query(
        `SELECT COUNT(*) as total_cobrancas,
                SUM(CASE WHEN status = 'enviado' THEN 1 ELSE 0 END) as enviadas
         FROM "${this.schema}".cobrancas_whatsapp
         WHERE paciente_id = $1`,
        [pacienteId]
      ).catch(() => ({ rows: [{ total_cobrancas: 0, enviadas: 0 }] }));

      const historico = rows[0];

      const msg = await client.messages.create({
        model: 'claude-haiku-20240307',
        max_tokens: 20,
        messages: [{
          role: 'user',
          content: `Determine o tom ideal para cobrança financeira.
Tipo: ${tipo}
Histórico: ${historico.total_cobrancas} cobranças anteriores, ${historico.enviadas} enviadas.
Responda apenas uma palavra: amigavel, neutro ou formal.`
        }]
      });

      const tom = msg.content[0]?.text?.trim().toLowerCase();
      if (['amigavel', 'neutro', 'formal'].includes(tom)) return tom;
      return 'amigavel';
    } catch {
      return 'amigavel';
    }
  }

  // ─── helpers privados ────────────────────────────────────────────────────

  _renderizar(template, vars) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] !== undefined ? vars[key] : '');
  }

  _formatarValor(valor) {
    if (valor == null) return '0,00';
    return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  _formatarData(dataStr) {
    if (!dataStr) return '--/--/----';
    try {
      const d = new Date(dataStr);
      return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    } catch {
      return dataStr;
    }
  }
}

module.exports = { CobrancaWhatsAppService, TEMPLATES };
