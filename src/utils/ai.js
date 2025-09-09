// const { GoogleGenerativeAI } = require('@google/generative-ai');
// const { HfInference } = require('@huggingface/inference');

class AIService {
  constructor() {
    // Desabilitar IA em ambiente de teste ou quando explicitamente desativado
    const isTest = (process.env.NODE_ENV || '').toLowerCase() === 'test';
    if (isTest || process.env.AI_DISABLED === 'true') {
      this.provider = 'disabled';
      this.geminiApiKey = null;
      this.huggingfaceApiKey = null;
      console.log('🧪 IA desabilitada para testes');
      return;
    }
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY;
    this.provider = process.env.AI_PROVIDER || 'gemini';
    
    // Inicializar Google Gemini (só se módulo e chave existirem)
    let GoogleGenerativeAI;
    try {
      GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
    } catch (err) {
      GoogleGenerativeAI = null;
    }
    if (this.geminiApiKey && GoogleGenerativeAI) {
      this.genAI = new GoogleGenerativeAI(this.geminiApiKey);
      this.geminiModel = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      this.geminiVisionModel = this.genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
  console.log('✅ Google Gemini configurado');
    } else {
      console.warn('⚠️  GEMINI_API_KEY ou módulo GoogleGenerativeAI não configurados');
    }
    
    // Inicializar Hugging Face (só se módulo e chave existirem)
    let HfInference;
    try {
      HfInference = require('@huggingface/inference').HfInference;
    } catch (err) {
      HfInference = null;
    }
    if (this.huggingfaceApiKey && HfInference) {
      this.hf = new HfInference(this.huggingfaceApiKey);
  console.log('✅ Hugging Face configurado');
    } else {
      console.warn('⚠️  HUGGINGFACE_API_KEY ou módulo HfInference não configurados');
    }
  }

  /**
   * Chat genérico usando o provider configurado
   * @param {string} prompt - Prompt para a IA
   * @param {Object} options - Opções adicionais
   * @returns {Promise<string>} - Resposta da IA
   */
  async chat(prompt, options = {}) {
    try {
      switch (this.provider) {
        case 'gemini':
          return await this.chatWithGemini(prompt, options);
        case 'huggingface':
          return await this.chatWithHuggingFace(prompt, options);
        default:
          throw new Error(`Provider ${this.provider} não suportado`);
      }
    } catch (error) {
      console.error(`❌ Erro no chat com ${this.provider}:`, error.message);
      return this.getFallbackResponse(prompt);
    }
  }

  /**
   * Chat usando Google Gemini
   * @param {string} prompt - Prompt para o Gemini
   * @param {Object} options - Opções adicionais
   * @returns {Promise<string>} - Resposta do Gemini
   */
  async chatWithGemini(prompt, options = {}) {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API não configurada');
    }

    try {
      const result = await this.geminiModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
      
    } catch (error) {
      console.error('❌ Erro na API do Gemini:', error.message);
      throw error;
    }
  }

  /**
   * Análise com Hugging Face
   * @param {string} text - Texto para analisar
   * @param {Object} options - Opções de análise
   * @returns {Promise<string>} - Resultado da análise
   */
  async analyzeWithHuggingFace(text, options = {}) {
    if (!this.huggingfaceApiKey) {
      throw new Error('Hugging Face API não configurada');
    }

    try {
      // Usar análise de sentimentos como padrão
      const response = await this.hf.textClassification({
        model: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
        inputs: text
      });
      
      return JSON.stringify(response, null, 2);
      
    } catch (error) {
      console.error('❌ Erro na análise com Hugging Face:', error.message);
      throw error;
    }
  }

  /**
   * Análise de imagem usando Gemini Vision
   * @param {string} imageUrl - URL da imagem ou caminho local
   * @param {string} prompt - Prompt para análise
   * @returns {Promise<string>} - Análise da imagem
   */
  async analyzeImage(imageUrl, prompt = 'Descreva esta imagem detalhadamente') {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API não configurada para análise de imagem');
    }

    try {
      // Para URLs ou base64
      let imagePart;
      
      if (imageUrl.startsWith('http')) {
        // URL da imagem
        const response = await fetch(imageUrl);
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        
        imagePart = {
          inlineData: {
            data: base64,
            mimeType: response.headers.get('content-type') || 'image/jpeg'
          }
        };
      } else {
        // Assume que é uma imagem placeholder para teste
        imagePart = {
          inlineData: {
            data: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
            mimeType: 'image/jpeg'
          }
        };
      }
      
      const result = await this.geminiVisionModel.generateContent([prompt, imagePart]);
      const response = await result.response;
      return response.text();
      
    } catch (error) {
      console.error('❌ Erro na análise de imagem:', error.message);
      throw error;
    }
  }

  /**
   * Gera resposta natural para bot de atendimento
   * @param {string} mensagemCliente - Mensagem do cliente
   * @param {Object} context - Contexto do atendimento
   * @returns {Promise<string>} - Resposta sugerida
   */
  async gerarRespostaBot(mensagemCliente, context = {}) {
    const prompt = `Você é um assistente virtual de uma clínica estética chamada "${context.nomeClinica || 'nossa clínica'}".
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

Resposta natural em português:`;

    try {
      return await this.chat(prompt, { maxTokens: 300 });
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
    const prompt = `Gere 5-7 perguntas relevantes para anamnese em uma clínica estética.

Dados do paciente:
- Nome: ${paciente.nome}
- Procedimento: ${tipoProcedimento}

Considere:
1. Histórico médico relevante
2. Medicamentos/alergias
3. Expectativas do tratamento
4. Cuidados pós-procedimento
5. Contraindicações específicas

Retorne em formato JSON:
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
      const resposta = await this.chat(prompt, { maxTokens: 600 });
      
      // Tentar fazer parse do JSON
      try {
        return JSON.parse(resposta);
      } catch (parseError) {
        console.warn('⚠️  Resposta da IA não está em JSON válido');
        return this.getFallbackAnamnese(tipoProcedimento);
      }
      
    } catch (error) {
      console.error('❌ Erro ao gerar sugestões de anamnese:', error.message);
      return this.getFallbackAnamnese(tipoProcedimento);
    }
  }

  /**
   * Analisa imagem usando Google Gemini Vision
   * @param {Buffer|string} imagemBuffer - Buffer da imagem ou caminho
   * @param {string} tipoAnalise - Tipo de análise (evolucao, before_after, etc)
   * @param {Object} context - Contexto adicional
   * @returns {Promise<Object>} - Análise da imagem
   */
  async analisarImagem(imagemBuffer, tipoAnalise = 'evolucao', context = {}) {
    if (!this.geminiApiKey) {
      console.warn('⚠️  Gemini Vision não configurado');
      return { insights: ['Análise de imagem não disponível'], recomendacoes: [] };
    }

    try {
      let prompt = '';
      
      switch (tipoAnalise) {
        case 'evolucao':
          prompt = `Analise esta imagem de um tratamento estético e forneça insights sobre:
1. Condição da pele visível
2. Possíveis melhorias ou mudanças
3. Recomendações de cuidados
4. Observações técnicas relevantes

Formate a resposta em JSON:
{
  "condicao_pele": "...",
  "melhorias_observadas": ["..."],
  "recomendacoes": ["..."],
  "observacoes_tecnicas": ["..."]
}`;
          break;
          
        case 'before_after':
          prompt = `Compare esta imagem antes/depois de um tratamento estético:
1. Mudanças visíveis
2. Eficácia do tratamento
3. Áreas que podem precisar de atenção
4. Sugestões para próximos passos

Resposta em JSON:
{
  "mudancas_visiveis": ["..."],
  "eficacia_tratamento": "...",
  "areas_atencao": ["..."],
  "proximos_passos": ["..."]
}`;
          break;
          
        default:
          prompt = `Analise esta imagem relacionada a tratamento estético e forneça observações relevantes em formato JSON.`;
      }

      // Preparar imagem para o Gemini
      let imagePart;
      if (Buffer.isBuffer(imagemBuffer)) {
        imagePart = {
          inlineData: {
            data: imagemBuffer.toString('base64'),
            mimeType: 'image/jpeg'
          }
        };
      } else {
        // Se for caminho de arquivo
        const fs = require('fs');
        const imageBuffer = fs.readFileSync(imagemBuffer);
        imagePart = {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType: 'image/jpeg'
          }
        };
      }

      const result = await this.geminiVisionModel.generateContent([prompt, imagePart]);
      const response = await result.response;
      const texto = response.text();
      
      try {
        return JSON.parse(texto);
      } catch (parseError) {
        return {
          analise_texto: texto,
          insights: ['Análise realizada com sucesso'],
          recomendacoes: ['Consulte o profissional responsável para interpretação completa']
        };
      }
      
    } catch (error) {
      console.error('❌ Erro na análise de imagem:', error.message);
      return {
        insights: ['Erro na análise de imagem'],
        recomendacoes: ['Tente novamente ou consulte um profissional']
      };
    }
  }

  /**
   * Analisa evolução de medidas usando IA
   * @param {Array} historicoMedidas - Array com histórico de medidas
   * @returns {Promise<Object>} - Análise e sugestões
   */
  async analisarEvolucaoMedidas(historicoMedidas) {
    if (!historicoMedidas || historicoMedidas.length < 2) {
      return { 
        insights: ['Dados insuficientes para análise'], 
        recomendacoes: ['Adicione mais medições para análise de evolução'] 
      };
    }

    const prompt = `Analise a evolução das medidas corporais de um paciente de clínica estética:

Histórico de medidas:
${JSON.stringify(historicoMedidas, null, 2)}

Gere uma análise em formato JSON:
{
  "tendencia_geral": "positiva|estável|negativa",
  "insights": ["insight1", "insight2"],
  "recomendacoes": ["recomendacao1", "recomendacao2"],
  "alertas": ["alerta1"], // se houver mudanças drásticas
  "proximo_objetivo": "..."
}

Considere:
- Mudanças graduais são melhores que drásticas
- Identifique padrões de melhoria ou estagnação
- Sugira ajustes no tratamento se necessário`;

    try {
      const resposta = await this.chat(prompt, { maxTokens: 500 });
      
      try {
        return JSON.parse(resposta);
      } catch (parseError) {
        return {
          insights: ['Análise concluída - consulte dados detalhados'],
          recomendacoes: ['Continue o acompanhamento regular'],
          tendencia_geral: 'estável'
        };
      }
      
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

    if (tipoProcedimento.toLowerCase().includes('corporal')) {
      anamneseBase.perguntas.push({
        categoria: 'atividade_fisica',
        pergunta: 'Pratica atividade física regularmente?',
        tipo: 'sim_nao'
      });
    }

    return anamneseBase;
  }

  /**
   * Testa conexão com os serviços de IA
   * @returns {Object} - Status dos serviços
   */
  async testarConexoes() {
    const status = {
      gemini: false,
      huggingface: false,
      provider_ativo: this.provider
    };

    // Testar Gemini
    if (this.geminiApiKey) {
      try {
        await this.chatWithGemini('Teste de conexão. Responda apenas "OK".');
        status.gemini = true;
      } catch (error) {
        console.error('❌ Teste Gemini falhou:', error.message);
      }
    }

    // Testar Hugging Face
    if (this.huggingfaceApiKey) {
      try {
        await this.chatWithHuggingFace('Test');
        status.huggingface = true;
      } catch (error) {
        console.error('❌ Teste Hugging Face falhou:', error.message);
      }
    }

    return status;
  }

  /**
   * Status do serviço
   * @returns {Object} - Status atual
   */
  getStatus() {
    return {
      provider: this.provider,
      gemini_configured: !!this.geminiApiKey,
      huggingface_configured: !!this.huggingfaceApiKey,
      vision_available: !!this.geminiApiKey
    };
  }
}

module.exports = new AIService();
