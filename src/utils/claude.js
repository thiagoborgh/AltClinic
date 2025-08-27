const axios = require('axios');

class ClaudeService {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
    this.model = 'claude-3-5-sonnet-20241022';
    this.maxTokens = 1000;
    
    if (!this.apiKey) {
      console.warn('⚠️  CLAUDE_API_KEY não configurada. Serviço de IA indisponível.');
    }
  }

  /**
   * Faz uma requisição para a API do Claude
   * @param {string} prompt - Prompt para o Claude
   * @param {Object} options - Opções adicionais
   * @returns {Promise<string>} - Resposta do Claude
   */
  async chat(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('API do Claude não configurada');
    }

    try {
      const response = await axios.post(this.baseURL, {
        model: this.model,
        max_tokens: options.maxTokens || this.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        timeout: 30000
      });

      return response.data.content[0].text;
      
    } catch (error) {
      console.error('❌ Erro na API do Claude:', error.message);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      
      throw new Error('Erro ao comunicar com o serviço de IA');
    }
  }

  /**
   * Gera resposta natural para bot de atendimento
   * @param {string} mensagemCliente - Mensagem do cliente
   * @param {Object} context - Contexto do atendimento
   * @returns {Promise<string>} - Resposta sugerida
   */
  async gerarRespostaBot(mensagemCliente, context = {}) {
    const prompt = `
Você é um assistente virtual de uma clínica estética chamada "${context.nomeClinica || 'nossa clínica'}".
Seja cordial, profissional e útil. Mantenha as respostas concisas (máximo 2 parágrafos).

Contexto disponível:
- Cliente: ${context.nomeCliente || 'Cliente'}
- Último atendimento: ${context.ultimoAtendimento || 'Não informado'}
- Procedimentos disponíveis: ${context.procedimentos?.join(', ') || 'Consultar disponibilidade'}

Mensagem do cliente: "${mensagemCliente}"

Instruções:
1. Se for sobre agendamento, pergunte preferência de data/horário
2. Se for sobre procedimentos, explique brevemente e mencione duração/preparo
3. Se for cancelamento, seja compreensivo e ofereça reagendamento
4. Se não souber responder, direcione para atendente humano
5. Sempre termine oferecendo ajuda adicional

Resposta natural:`;

    try {
      return await this.chat(prompt, { maxTokens: 500 });
    } catch (error) {
      console.error('❌ Erro ao gerar resposta do bot:', error.message);
      return this.getFallbackResponse(mensagemCliente);
    }
  }

  /**
   * Gera sugestões para anamnese baseado no perfil do paciente
   * @param {Object} paciente - Dados do paciente
   * @param {string} tipoProcedimento - Tipo de procedimento
   * @returns {Promise<Object>} - Sugestões de perguntas para anamnese
   */
  async gerarSugestoesAnamnese(paciente, tipoProcedimento) {
    const prompt = `
Gere sugestões de perguntas para anamnese em uma clínica estética.

Dados do paciente:
- Idade estimada: ${this.calcularIdadeAproximada(paciente.nome)} anos
- Gênero provável: ${this.inferirGenero(paciente.nome)}
- Procedimento: ${tipoProcedimento}

Gere 5-8 perguntas relevantes em formato JSON, considerando:
1. Histórico médico relevante
2. Medicamentos/alergias
3. Expectativas do tratamento
4. Cuidados pós-procedimento
5. Contraindicações específicas

Formato de resposta:
{
  "perguntas": [
    {
      "categoria": "historico_medico",
      "pergunta": "...",
      "tipo": "texto|multipla_escolha|sim_nao",
      "opcoes": ["opcao1", "opcao2"] // apenas se tipo = multipla_escolha
    }
  ]
}`;

    try {
      const resposta = await this.chat(prompt, { maxTokens: 800 });
      return JSON.parse(resposta);
    } catch (error) {
      console.error('❌ Erro ao gerar sugestões de anamnese:', error.message);
      return this.getFallbackAnamnese(tipoProcedimento);
    }
  }

  /**
   * Analisa evolução de medidas e gera insights
   * @param {Array} historicoMedidas - Array com histórico de medidas
   * @returns {Promise<Object>} - Análise e sugestões
   */
  async analisarEvolucaoMedidas(historicoMedidas) {
    if (!historicoMedidas || historicoMedidas.length < 2) {
      return { insights: ['Dados insuficientes para análise'], recomendacoes: [] };
    }

    const prompt = `
Analise a evolução das medidas corporais de um paciente de clínica estética:

Histórico de medidas:
${JSON.stringify(historicoMedidas, null, 2)}

Gere uma análise em formato JSON com:
1. Insights sobre a evolução (progressos, estagnação, retrocessos)
2. Recomendações de procedimentos ou cuidados
3. Alertas se houver mudanças drásticas

Formato:
{
  "insights": ["insight1", "insight2"],
  "recomendacoes": ["recomendacao1", "recomendacao2"],
  "alertas": ["alerta1"] // se houver
}`;

    try {
      const resposta = await this.chat(prompt, { maxTokens: 600 });
      return JSON.parse(resposta);
    } catch (error) {
      console.error('❌ Erro ao analisar evolução:', error.message);
      return {
        insights: ['Análise indisponível no momento'],
        recomendacoes: ['Consulte o profissional responsável']
      };
    }
  }

  /**
   * Resposta de fallback quando a IA não está disponível
   * @param {string} mensagem - Mensagem original
   * @returns {string} - Resposta padrão
   */
  getFallbackResponse(mensagem) {
    const mensagemLower = mensagem.toLowerCase();
    
    if (mensagemLower.includes('agendar') || mensagemLower.includes('marcar')) {
      return 'Olá! Ficarei feliz em ajudar com seu agendamento. Qual procedimento você gostaria de agendar e qual sua preferência de data e horário?';
    }
    
    if (mensagemLower.includes('cancelar') || mensagemLower.includes('desmarcar')) {
      return 'Entendo que precisa cancelar um agendamento. Posso ajudar a reagendar para outra data que seja mais conveniente para você.';
    }
    
    if (mensagemLower.includes('preço') || mensagemLower.includes('valor')) {
      return 'Para informações sobre valores, nosso atendente pode fornecer todos os detalhes e opções de pagamento. Gostaria que eu conecte você?';
    }
    
    return 'Olá! Obrigado pelo contato. Nossa equipe está pronta para atendê-lo. Como posso ajudar hoje?';
  }

  /**
   * Anamnese de fallback por tipo de procedimento
   * @param {string} tipoProcedimento - Tipo do procedimento
   * @returns {Object} - Perguntas padrão
   */
  getFallbackAnamnese(tipoProcedimento) {
    const anamneseBase = {
      perguntas: [
        {
          categoria: 'historico_medico',
          pergunta: 'Possui alguma condição médica relevante?',
          tipo: 'texto'
        },
        {
          categoria: 'medicamentos',
          pergunta: 'Faz uso de algum medicamento atualmente?',
          tipo: 'texto'
        },
        {
          categoria: 'alergias',
          pergunta: 'Possui alguma alergia conhecida?',
          tipo: 'texto'
        },
        {
          categoria: 'expectativas',
          pergunta: 'Quais são suas expectativas com o tratamento?',
          tipo: 'texto'
        }
      ]
    };

    // Adicionar perguntas específicas por tipo
    if (tipoProcedimento.toLowerCase().includes('facial')) {
      anamneseBase.perguntas.push({
        categoria: 'cuidados_pele',
        pergunta: 'Qual sua rotina atual de cuidados com a pele?',
        tipo: 'texto'
      });
    }

    return anamneseBase;
  }

  /**
   * Utilitário para calcular idade aproximada baseado no nome
   * @param {string} nome - Nome do paciente
   * @returns {number} - Idade estimada
   */
  calcularIdadeAproximada(nome) {
    // Estimativa muito básica - em produção, usar data de nascimento
    const nomesJovens = ['ana', 'amanda', 'gabriela', 'lucas', 'joão'];
    const nomesMaturos = ['maria', 'josé', 'antonio', 'francisca'];
    
    const nomeNormalized = nome.toLowerCase();
    
    if (nomesJovens.some(n => nomeNormalized.includes(n))) {
      return Math.floor(Math.random() * 15) + 20; // 20-35
    }
    
    if (nomesMaturos.some(n => nomeNormalized.includes(n))) {
      return Math.floor(Math.random() * 20) + 40; // 40-60
    }
    
    return Math.floor(Math.random() * 30) + 25; // 25-55 (padrão)
  }

  /**
   * Utilitário para inferir gênero baseado no nome
   * @param {string} nome - Nome do paciente
   * @returns {string} - Gênero inferido
   */
  inferirGenero(nome) {
    const nomesMasculinos = ['joão', 'josé', 'antonio', 'carlos', 'lucas', 'paulo'];
    const nomesFemininos = ['maria', 'ana', 'francisca', 'amanda', 'carla', 'julia'];
    
    const nomeNormalized = nome.toLowerCase();
    
    if (nomesMasculinos.some(n => nomeNormalized.includes(n))) {
      return 'masculino';
    }
    
    if (nomesFemininos.some(n => nomeNormalized.includes(n))) {
      return 'feminino';
    }
    
    return 'não especificado';
  }
}

module.exports = new ClaudeService();
