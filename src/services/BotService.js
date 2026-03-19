/**
 * BotService — máquina de estados do bot de agendamento WhatsApp
 * Estado persistido em PostgreSQL (whatsapp_bot_sessoes) — tolerante a restart
 */
const pool = require('../database/postgres');
const { schemaFromSlug } = require('./CrmScoreService');
const IntencaoService    = require('./IntencaoService');
const AgendaService      = require('./AgendaService');

function getIo() {
  try { return require('../server').io; } catch { return null; }
}

class BotService {
  constructor(tenantId, tenantSlug) {
    this.tenantId   = tenantId;
    this.tenantSlug = tenantSlug;
    this.schema     = schemaFromSlug(tenantSlug);
  }

  // ─── Ponto de entrada do webhook ──────────────────────────────────────────

  async processar(conversaId, numero, mensagem, mediaType) {
    // Mensagem de mídia: bot não processa, instrui usar texto
    if (mediaType && mediaType !== 'texto' && mediaType !== 'text') {
      await this._enviarMensagem(numero,
        'Por enquanto só atendo mensagens de texto. Pode me escrever? 😊'
      );
      return;
    }

    const config = await this._obterConfig();
    if (!config || !config.ativo) return;
    if (!this.deveAtender(config)) return;

    // Verificar transferência imediata antes de qualquer estado
    const transferencia = await IntencaoService.detectarTransferencia(mensagem);
    if (transferencia.transferir) {
      const sessao = await this._obterOuCriarSessao(numero, conversaId);
      await this.transferirParaHumano(sessao, transferencia.motivo);
      return;
    }

    // Obter ou criar sessão
    const sessao = await this._obterOuCriarSessao(numero, conversaId);

    // Estado terminal — não processar
    if (sessao.estado === 'transferido_humano' || sessao.estado === 'encerrado') return;

    // Atualizar timestamp de última interação
    await pool.query(
      `UPDATE "${this.schema}".whatsapp_bot_sessoes SET ultima_interacao = NOW() WHERE id = $1`,
      [sessao.id]
    );

    await this._processarEstado(sessao, mensagem, config);
  }

  // ─── Verificar se o bot deve atender agora ────────────────────────────────

  deveAtender(config) {
    const agora = new Date();
    const diasSemana = Array.isArray(config.dias_semana)
      ? config.dias_semana
      : JSON.parse(config.dias_semana || '[0,1,2,3,4,5,6]');
    const diaSemana = agora.getDay(); // 0=Dom, 6=Sab

    if (!diasSemana.includes(diaSemana)) return false;

    const [hIni, mIni] = (config.horario_inicio || '00:00').split(':').map(Number);
    const [hFim, mFim] = (config.horario_fim    || '23:59').split(':').map(Number);
    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
    const minutosIni   = hIni * 60 + mIni;
    const minutosFim   = hFim * 60 + mFim;

    return minutosAgora >= minutosIni && minutosAgora < minutosFim;
  }

  // ─── Dispatcher principal ─────────────────────────────────────────────────

  async _processarEstado(sessao, mensagem, config) {
    const contexto = sessao.contexto || {};

    switch (sessao.estado) {
      case 'inicial':
        await this._handleInicial(sessao, config);
        break;
      case 'menu_principal':
        await this._handleMenuPrincipal(sessao, mensagem, config, contexto);
        break;
      case 'agendamento_especialidade':
        await this._handleAgendamentoEspecialidade(sessao, mensagem, contexto);
        break;
      case 'agendamento_profissional':
        await this._handleAgendamentoProfissional(sessao, mensagem, contexto);
        break;
      case 'agendamento_periodo':
        await this._handleAgendamentoPeriodo(sessao, mensagem, contexto);
        break;
      case 'agendamento_horario':
        await this._handleAgendamentoHorario(sessao, mensagem, contexto);
        break;
      case 'agendamento_dados_nome':
        await this._handleAgendamentoDadosNome(sessao, mensagem, contexto);
        break;
      case 'agendamento_dados_cpf':
        await this._handleAgendamentoDadosCpf(sessao, mensagem, contexto);
        break;
      case 'agendamento_confirmacao':
        await this._handleAgendamentoConfirmacao(sessao, mensagem, contexto);
        break;
      case 'cancelamento_busca':
        await this._handleCancelamentoBusca(sessao, contexto);
        break;
      case 'cancelamento_confirmacao':
        await this._handleCancelamentoConfirmacao(sessao, mensagem, contexto);
        break;
      default:
        await this._handleFallback(sessao, config);
    }
  }

  // ─── Handlers de estado ───────────────────────────────────────────────────

  async _handleInicial(sessao, config) {
    const msgs    = config.mensagens || {};
    const saudacao = msgs.saudacao ||
      `Olá! Sou ${config.nome_bot || 'Assistente'}, assistente virtual da clínica. Como posso ajudar?`;
    const menu = msgs.menu_principal ||
      '1️⃣ Agendar consulta\n2️⃣ Ver/Cancelar agendamento\n3️⃣ Procedimentos e valores\n4️⃣ Horários e endereço\n5️⃣ Falar com atendente';

    await this._enviarMensagem(sessao.numero, `${saudacao}\n\n${menu}`);
    await this._atualizarEstado(sessao.id, 'menu_principal', {});
  }

  async _handleMenuPrincipal(sessao, mensagem, config, contexto) {
    const { intencao } = await IntencaoService.detectarIntencao(mensagem, this.tenantId);

    switch (intencao) {
      case 'agendar':
        await this._enviarMensagem(sessao.numero,
          'Ótimo! Com qual especialidade ou profissional você quer agendar?'
        );
        await this._atualizarEstado(sessao.id, 'agendamento_especialidade', {});
        break;

      case 'cancelar': {
        await this._atualizarEstado(sessao.id, 'cancelamento_busca', {});
        await this._handleCancelamentoBusca({ ...sessao, estado: 'cancelamento_busca' }, {});
        break;
      }

      case 'faq':
      case 'horarios':
      case 'faq_procedimentos':
      case 'faq_horarios':
      case 'faq_convenio': {
        const resposta = await IntencaoService.resolverFaq(mensagem, pool, this.schema);
        if (resposta) {
          await this._enviarMensagem(sessao.numero, resposta);
          await this._enviarMensagem(sessao.numero,
            'Posso ajudar com mais alguma coisa? (envie o número)\n\n' +
            '1️⃣ Agendar consulta\n2️⃣ Ver/Cancelar agendamento\n5️⃣ Falar com atendente'
          );
          await this._atualizarEstado(sessao.id, 'menu_principal', {});
        } else {
          await this.transferirParaHumano(sessao, 'assunto_clinico');
        }
        break;
      }

      case 'humano':
      case 'transferir_humano':
        await this.transferirParaHumano(sessao, 'pedido_humano');
        break;

      default:
        await this._incrementarFalha(sessao, config,
          'Não entendi sua opção. Por favor, responda com um número de 1 a 5.'
        );
    }
  }

  async _handleAgendamentoEspecialidade(sessao, mensagem, contexto) {
    const agenda = new AgendaService(pool, this.schema);
    const especialidades = await agenda.listarEspecialidades();

    const especialidade = await IntencaoService.extrairEntidade(
      mensagem, 'especialidade', especialidades
    );

    if (!especialidade) {
      const lista = especialidades.map((e, i) => `${i + 1}. ${e}`).join('\n');
      await this._enviarMensagem(sessao.numero,
        `Não encontrei essa especialidade. Nossas opções:\n${lista}\n\nDigite o nome ou número.`
      );
      await this._incrementarFalha(sessao, null, null);
      return;
    }

    const profissionais = await agenda.listarProfissionais(especialidade);
    if (!profissionais.length) {
      await this._enviarMensagem(sessao.numero,
        `No momento não temos profissionais disponíveis para ${especialidade}. Posso te ajudar com outra coisa?`
      );
      await this._atualizarEstado(sessao.id, 'menu_principal', {});
      return;
    }

    const lista = profissionais.map((p, i) => `${i + 1}. ${p.nome}`).join('\n');
    await this._enviarMensagem(sessao.numero,
      `Temos:\n${lista}\n\nDigite o número do profissional desejado.`
    );
    await this._atualizarEstado(sessao.id, 'agendamento_profissional', {
      ...contexto,
      especialidade_nome: especialidade,
      profissionais,
    });
  }

  async _handleAgendamentoProfissional(sessao, mensagem, contexto) {
    const numSlot    = parseInt(mensagem.trim());
    const profissionais = contexto.profissionais || [];

    if (isNaN(numSlot) || numSlot < 1 || numSlot > profissionais.length) {
      await this._enviarMensagem(sessao.numero,
        `Por favor, digite o número do profissional (1 a ${profissionais.length}).`
      );
      return;
    }

    const profissional = profissionais[numSlot - 1];
    await this._enviarMensagem(sessao.numero, 'Prefere pela manhã, tarde ou qualquer horário?');
    await this._atualizarEstado(sessao.id, 'agendamento_periodo', {
      ...contexto,
      profissional_id:   profissional.id,
      profissional_nome: profissional.nome,
    });
  }

  async _handleAgendamentoPeriodo(sessao, mensagem, contexto) {
    const msg = mensagem.toLowerCase();
    let periodo;
    if (/manh[ãa]|manha|morning/i.test(msg))    periodo = 'manha';
    else if (/tarde|afternoon/i.test(msg))       periodo = 'tarde';
    else if (/qualquer|any|indif/i.test(msg))    periodo = 'qualquer';
    else {
      await this._enviarMensagem(sessao.numero,
        'Responda "manhã", "tarde" ou "qualquer horário".'
      );
      return;
    }

    const agenda = new AgendaService(pool, this.schema);
    const slots  = await agenda.buscarSlots(contexto.profissional_id, periodo);

    if (!slots.length) {
      await this._enviarMensagem(sessao.numero,
        `Não encontrei horários disponíveis para ${contexto.profissional_nome} nos próximos 7 dias. ` +
        'Deseja tentar outra especialidade ou falar com a recepção?'
      );
      await this._atualizarEstado(sessao.id, 'menu_principal', {});
      return;
    }

    const slotsFormatados = slots.slice(0, 5).map(s => {
      const dt = new Date(s);
      return {
        data_hora:      s,
        data_formatada: dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' }),
        horario:        dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
    });

    const lista = slotsFormatados.map((s, i) =>
      `${i + 1}. 📅 ${s.data_formatada} às ${s.horario}`
    ).join('\n');

    await this._enviarMensagem(sessao.numero,
      `Horários disponíveis:\n${lista}\n\nDigite o número do horário desejado.`
    );
    await this._atualizarEstado(sessao.id, 'agendamento_horario', {
      ...contexto, periodo, slots: slotsFormatados,
    });
  }

  async _handleAgendamentoHorario(sessao, mensagem, contexto) {
    const slots   = contexto.slots || [];
    const numSlot = parseInt(mensagem.trim());

    if (isNaN(numSlot) || numSlot < 1 || numSlot > slots.length) {
      const lista = slots.map((s, i) => `${i + 1}. ${s.data_formatada} às ${s.horario}`).join('\n');
      await this._enviarMensagem(sessao.numero,
        `Por favor, digite o número do horário desejado (1 a ${slots.length}):\n${lista}`
      );
      return;
    }

    const slotEscolhido = slots[numSlot - 1];

    // Verificar se o paciente já está vinculado à sessão
    if (sessao.paciente_id) {
      const { rows } = await pool.query(
        `SELECT * FROM "${this.schema}".pacientes WHERE id = $1`,
        [sessao.paciente_id]
      );
      const paciente = rows[0];
      await this._mostrarConfirmacao(sessao, slotEscolhido, contexto, paciente);
      return;
    }

    await this._enviarMensagem(sessao.numero,
      'Para finalizar, preciso de alguns dados. Qual o seu nome completo?'
    );
    await this._atualizarEstado(sessao.id, 'agendamento_dados_nome', {
      ...contexto, slot_escolhido: slotEscolhido,
    });
  }

  async _handleAgendamentoDadosNome(sessao, mensagem, contexto) {
    const nome = mensagem.trim();
    if (nome.length < 3) {
      await this._enviarMensagem(sessao.numero, 'Por favor, informe seu nome completo.');
      return;
    }

    await this._enviarMensagem(sessao.numero,
      'Obrigado! Agora preciso do seu CPF ou data de nascimento para confirmar seu cadastro.'
    );
    await this._atualizarEstado(sessao.id, 'agendamento_dados_cpf', {
      ...contexto, nome_coletado: nome,
    });
  }

  async _handleAgendamentoDadosCpf(sessao, mensagem, contexto) {
    const texto = mensagem.replace(/\D/g, '');
    if (texto.length < 8) {
      await this._enviarMensagem(sessao.numero,
        'Por favor, informe seu CPF (apenas números) ou data de nascimento (DD/MM/AAAA).'
      );
      return;
    }

    const { rows: pacienteRows } = await pool.query(`
      SELECT * FROM "${this.schema}".pacientes
      WHERE cpf = $1 OR data_nascimento::date = $2::date
      LIMIT 1
    `, [texto, mensagem.trim()]).catch(() => ({ rows: [] }));
    let paciente = pacienteRows[0];

    if (!paciente) {
      const { rows: insertRows } = await pool.query(`
        INSERT INTO "${this.schema}".pacientes (nome, telefone)
        VALUES ($1, $2)
        RETURNING *
      `, [contexto.nome_coletado, sessao.numero]);
      paciente = insertRows[0];
    }

    await pool.query(
      `UPDATE "${this.schema}".whatsapp_bot_sessoes SET paciente_id = $1 WHERE id = $2`,
      [paciente.id, sessao.id]
    );

    await this._mostrarConfirmacao(
      { ...sessao, paciente_id: paciente.id },
      contexto.slot_escolhido,
      contexto,
      paciente
    );
  }

  async _mostrarConfirmacao(sessao, slot, contexto, paciente) {
    const mensagem =
      `Confirmando o agendamento:\n\n` +
      `👤 ${paciente.nome}\n` +
      `📅 ${slot.data_formatada} às ${slot.horario}\n` +
      `👩‍⚕️ ${contexto.profissional_nome} — ${contexto.especialidade_nome || ''}\n\n` +
      `Confirma? Responda *SIM* ou *NÃO*.`;

    await this._enviarMensagem(sessao.numero, mensagem);
    await this._atualizarEstado(sessao.id, 'agendamento_confirmacao', {
      ...contexto, slot_escolhido: slot, paciente_id: sessao.paciente_id,
    });
  }

  async _handleAgendamentoConfirmacao(sessao, mensagem, contexto) {
    const msg = mensagem.toLowerCase().trim();

    if (/^(sim|s|confirmo|ok|yes)$/.test(msg)) {
      const agenda    = new AgendaService(pool, this.schema);
      const slotLivre = await agenda.verificarSlot(
        contexto.profissional_id, contexto.slot_escolhido.data_hora
      );

      if (!slotLivre) {
        await this._enviarMensagem(sessao.numero,
          'Poxa, esse horário acabou de ser ocupado! Vamos escolher outro?'
        );
        await this._atualizarEstado(sessao.id, 'agendamento_periodo', {
          ...contexto, slots: undefined, slot_escolhido: undefined,
        });
        return;
      }

      const ag = await agenda.criarAgendamento({
        paciente_id:     contexto.paciente_id,
        profissional_id: contexto.profissional_id,
        data_hora:       contexto.slot_escolhido.data_hora,
        origem:          'bot_whatsapp',
      });

      await this._enviarMensagem(sessao.numero,
        `✅ Agendamento confirmado!\n\n` +
        `📅 ${contexto.slot_escolhido.data_formatada} às ${contexto.slot_escolhido.horario}\n` +
        `👩‍⚕️ ${contexto.profissional_nome}\n\n` +
        `Você receberá um lembrete 1 dia antes. Até lá! 😊`
      );
      await this._atualizarEstado(sessao.id, 'encerrado', {});

    } else if (/^(n[ãa]o|nao|n|no|cancelar|desistir)$/.test(msg)) {
      await this._enviarMensagem(sessao.numero, 'Tudo bem! Posso ajudar com mais alguma coisa?');
      await this._atualizarEstado(sessao.id, 'menu_principal', {});

    } else {
      await this._enviarMensagem(sessao.numero,
        'Por favor, responda *SIM* para confirmar ou *NÃO* para cancelar.'
      );
    }
  }

  async _handleCancelamentoBusca(sessao, contexto) {
    const agenda      = new AgendaService(pool, this.schema);
    const agendamentos = await agenda.buscarAgendamentosPorTelefone(sessao.numero);

    if (!agendamentos.length) {
      await this._enviarMensagem(sessao.numero,
        'Não encontrei agendamentos futuros para este número. Posso ajudar com mais alguma coisa?'
      );
      await this._atualizarEstado(sessao.id, 'menu_principal', {});
      return;
    }

    const lista = agendamentos.slice(0, 5).map((a, i) =>
      `${i + 1}. 📅 ${new Date(a.data_hora).toLocaleString('pt-BR')} — ${a.profissional_nome}`
    ).join('\n');

    await this._enviarMensagem(sessao.numero,
      `Seus agendamentos:\n${lista}\n\nDigite o número para cancelar ou 0 para voltar.`
    );
    await this._atualizarEstado(sessao.id, 'cancelamento_confirmacao', {
      ...contexto, agendamentos: agendamentos.slice(0, 5),
    });
  }

  async _handleCancelamentoConfirmacao(sessao, mensagem, contexto) {
    const num         = parseInt(mensagem.trim());
    const agendamentos = contexto.agendamentos || [];

    if (num === 0) {
      await this._atualizarEstado(sessao.id, 'menu_principal', {});
      return;
    }

    if (isNaN(num) || num < 1 || num > agendamentos.length) {
      await this._enviarMensagem(sessao.numero,
        `Digite o número do agendamento (1 a ${agendamentos.length}) ou 0 para voltar.`
      );
      return;
    }

    const agendamento = agendamentos[num - 1];
    const agenda      = new AgendaService(pool, this.schema);
    await agenda.cancelarAgendamento(agendamento.id, 'cancelado_pelo_bot_whatsapp');

    await this._enviarMensagem(sessao.numero,
      `✅ Agendamento cancelado.\n📅 ${new Date(agendamento.data_hora).toLocaleString('pt-BR')}\n\n` +
      'Posso ajudar com mais alguma coisa?'
    );
    await this._atualizarEstado(sessao.id, 'menu_principal', {});
  }

  async _handleFallback(sessao, config) {
    const msgs       = config?.mensagens || {};
    const naoEntendeu = msgs.nao_entendeu ||
      'Desculpe, não entendi. Gostaria de falar com um atendente? (SIM/NÃO)';
    await this._enviarMensagem(sessao.numero, naoEntendeu);
    await this._atualizarEstado(sessao.id, 'menu_principal', {});
  }

  // ─── Transferência para humano ─────────────────────────────────────────────

  async transferirParaHumano(sessao, motivo) {
    await this._atualizarEstado(sessao.id, 'transferido_humano', sessao.contexto || {});

    if (sessao.conversa_id) {
      await pool.query(`
        UPDATE "${this.schema}".whatsapp_conversas
        SET tag = 'bot', status = 'aberta', origem = 'bot', atualizado_em = NOW()
        WHERE id = $1
      `, [sessao.conversa_id]).catch(() => {});

      await pool.query(`
        INSERT INTO "${this.schema}".whatsapp_mensagens
          (conversa_id, direcao, tipo, conteudo, origem)
        VALUES ($1, 'saida', 'sistema', $2, 'sistema')
      `, [sessao.conversa_id, `Sessão transferida do bot. Motivo: ${motivo}`]).catch(() => {});
    }

    const config = await this._obterConfig();
    const msgs   = config?.mensagens || {};
    await this._enviarMensagem(sessao.numero,
      msgs.transferencia || 'Transferindo para um atendente. Em breve você será atendido! 👋'
    );

    const io = getIo();
    if (io) {
      const contexto = sessao.contexto || {};
      io.to(`tenant:${this.tenantId}`).emit('bot_transferencia', {
        conversa_id:    sessao.conversa_id,
        numero:         sessao.numero,
        motivo,
        contexto_resumo: this._resumirContexto(contexto),
      });

      if (motivo === 'urgencia_medica') {
        io.to(`tenant:${this.tenantId}`).emit('alerta_urgencia', {
          conversa_id:       sessao.conversa_id,
          numero:            sessao.numero,
          mensagem_original: contexto.ultima_mensagem || '',
        });
      }
    }
  }

  // ─── Métodos auxiliares ────────────────────────────────────────────────────

  async _obterOuCriarSessao(numero, conversaId) {
    const { rows: existenteRows } = await pool.query(
      `SELECT * FROM "${this.schema}".whatsapp_bot_sessoes WHERE tenant_id = $1 AND numero = $2`,
      [this.tenantId, numero]
    );
    if (existenteRows[0]) return existenteRows[0];

    const { rows: insertRows } = await pool.query(`
      INSERT INTO "${this.schema}".whatsapp_bot_sessoes
        (tenant_id, numero, conversa_id, estado, contexto)
      VALUES ($1, $2, $3, 'inicial', '{}')
      ON CONFLICT (tenant_id, numero) DO UPDATE SET
        conversa_id = EXCLUDED.conversa_id,
        ultima_interacao = NOW()
      RETURNING *
    `, [this.tenantId, numero, conversaId]);

    return insertRows[0];
  }

  async _atualizarEstado(sessaoId, novoEstado, novoContexto) {
    await pool.query(`
      UPDATE "${this.schema}".whatsapp_bot_sessoes
      SET estado = $1, contexto = $2, tentativas_falha = 0, ultima_interacao = NOW()
      WHERE id = $3
    `, [novoEstado, novoContexto, sessaoId]);
  }

  async _incrementarFalha(sessao, config, mensagemErro) {
    const novasTentativas = (sessao.tentativas_falha || 0) + 1;
    await pool.query(
      `UPDATE "${this.schema}".whatsapp_bot_sessoes SET tentativas_falha = $1 WHERE id = $2`,
      [novasTentativas, sessao.id]
    );

    const maxTentativas = config?.max_tentativas || 3;
    if (novasTentativas >= maxTentativas) {
      await this.transferirParaHumano(sessao, 'frustracao');
      return;
    }

    if (mensagemErro) {
      await this._enviarMensagem(sessao.numero, mensagemErro);
    }
  }

  async _enviarMensagem(numero, texto) {
    try {
      const UnifiedWhatsAppService = require('./UnifiedWhatsAppService');
      const ua = new UnifiedWhatsAppService(this.tenantId, this.tenantSlug);
      return await ua.sendMessage(numero, texto);
    } catch (err) {
      console.error(`[Bot] Erro ao enviar para ${numero}:`, err.message);
      return null;
    }
  }

  async _obterConfig() {
    const { rows } = await pool.query(
      `SELECT * FROM "${this.schema}".whatsapp_bot_config WHERE tenant_id = $1`,
      [this.tenantId]
    ).catch(() => ({ rows: [] }));
    return rows[0];
  }

  _resumirContexto(contexto) {
    const partes = [];
    if (contexto.especialidade_nome) partes.push(`Especialidade: ${contexto.especialidade_nome}`);
    if (contexto.profissional_nome)  partes.push(`Profissional: ${contexto.profissional_nome}`);
    if (contexto.slot_escolhido)     partes.push(`Slot: ${contexto.slot_escolhido.data_formatada}`);
    if (contexto.nome_coletado)      partes.push(`Nome: ${contexto.nome_coletado}`);
    return partes.join(' | ') || 'Sem contexto coletado';
  }
}

module.exports = BotService;
