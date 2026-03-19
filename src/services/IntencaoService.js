/**
 * IntencaoService — detecção de intenção e resolução de FAQ
 * Usa Claude API apenas para entradas ambíguas (throttle: 10 chamadas/min/tenant)
 */
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Throttle por tenant: máx 10 chamadas Claude/min
const throttle = new Map(); // tenantId → { count, resetAt }

function podeChamarClaude(tenantId) {
  const agora = Date.now();
  const entry = throttle.get(tenantId) || { count: 0, resetAt: agora + 60000 };
  if (agora > entry.resetAt) { entry.count = 0; entry.resetAt = agora + 60000; }
  if (entry.count >= 10) return false;
  entry.count++;
  throttle.set(tenantId, entry);
  return true;
}

const INTENCOES = ['agendar', 'cancelar', 'faq', 'horarios', 'humano', 'confirmar', 'negar', 'outro'];

/**
 * Detectar intenção principal do usuário
 * Regex rápida para opções numéricas; Claude para texto ambíguo
 */
async function detectarIntencao(mensagem, tenantId = 'default') {
  const texto = mensagem.trim();

  // Atalhos numéricos rápidos (menu 1-5)
  const numero = texto.match(/^(\d)$/);
  if (numero) {
    const mapa = { '1': 'agendar', '2': 'cancelar', '3': 'faq', '4': 'horarios', '5': 'humano' };
    return { intencao: mapa[numero[1]] || 'outro', confianca: 1.0 };
  }

  // Regex para padrões óbvios
  if (/agen(da|damento|dar)/i.test(texto))     return { intencao: 'agendar',   confianca: 0.95 };
  if (/cancel(ar|amento)/i.test(texto))         return { intencao: 'cancelar',  confianca: 0.95 };
  if (/(hor[aá]rio|funciona|abre|fecha)/i.test(texto)) return { intencao: 'horarios', confianca: 0.9 };
  if (/(sim|s\b|yes|ok|confirm)/i.test(texto))  return { intencao: 'confirmar', confianca: 0.9 };
  if (/(n[ãa]o\b|nao\b|cancela|desist)/i.test(texto)) return { intencao: 'negar', confianca: 0.9 };
  if (/(humano|atendente|pessoa|falar com)/i.test(texto)) return { intencao: 'humano', confianca: 0.95 };

  // Claude para casos ambíguos
  if (!podeChamarClaude(tenantId)) return { intencao: 'outro', confianca: 0.5 };

  try {
    const response = await anthropic.messages.create({
      model:       'claude-haiku-4-5-20251001',
      max_tokens:  80,
      temperature: 0,
      messages:    [{
        role: 'user',
        content: `Classifique a intenção desta mensagem de paciente numa clínica de saúde.
Responda APENAS com JSON: {"intencao": "<valor>", "confianca": <0.0-1.0>}

Intenções possíveis: agendar, cancelar, faq, horarios, humano, confirmar, negar, outro

Mensagem: "${texto}"`,
      }],
    });
    const r = JSON.parse(response.content[0].text);
    if (INTENCOES.includes(r.intencao) && r.confianca >= 0.6) return r;
  } catch (err) {
    console.error('[IntencaoService] Claude erro:', err.message);
  }

  return { intencao: 'outro', confianca: 0.0 };
}

/** Detecta se o paciente quer transferência imediata (urgência, frustração) */
async function detectarTransferencia(mensagem) {
  const texto = mensagem.trim().toUpperCase();

  const urgencia = ['URGENTE', 'EMERGENCIA', 'EMERGÊNCIA', 'SANGR', 'DOR FORTE', 'MAL', 'SOCORRO'];
  const atendente = ['ATENDENTE', 'HUMANO', 'PESSOA', 'FALAR COM ALGUÉM', 'FALAR COM ALGUEM'];

  if (urgencia.some(p => texto.includes(p)))  return { transferir: true, motivo: 'urgencia_medica' };
  if (atendente.some(p => texto.includes(p))) return { transferir: true, motivo: 'pedido_humano' };

  return { transferir: false };
}

/** Extrai entidade específica de uma mensagem (especialidade, horário, etc) */
async function extrairEntidade(mensagem, campoEsperado, opcoesValidas = []) {
  const opcoesStr = opcoesValidas.length ? opcoesValidas.join(', ') : 'qualquer';

  try {
    const response = await anthropic.messages.create({
      model:       'claude-haiku-4-5-20251001',
      max_tokens:  60,
      temperature: 0,
      messages:    [{
        role: 'user',
        content: `Extraia "${campoEsperado}" da mensagem abaixo.
Opções válidas: ${opcoesStr}
Responda APENAS com JSON: {"valor": "<valor encontrado ou null>"}

Mensagem: "${mensagem}"`,
      }],
    });
    const r = JSON.parse(response.content[0].text);
    return r.valor;
  } catch {
    return null;
  }
}

/**
 * Resolver FAQ por busca de palavras-chave (sem Claude)
 * @returns {string|null} resposta ou null se não encontrou
 */
async function resolverFaq(mensagem, pool, schema) {
  const { rows } = await pool.query(`
    SELECT id, resposta, palavras_chave FROM "${schema}".whatsapp_bot_faq
    WHERE ativo = true
  `).catch(() => ({ rows: [] }));

  if (!rows.length) return null;

  // Normalizar: remove acentos, lowercase
  const normalizar = str => str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const msgNorm = normalizar(mensagem);

  for (const faq of rows) {
    const palavras = Array.isArray(faq.palavras_chave) ? faq.palavras_chave : [];
    const match = palavras.some(p => msgNorm.includes(normalizar(p)));
    if (match) {
      // Incrementar uso_count sem bloquear
      pool.query(`UPDATE "${schema}".whatsapp_bot_faq SET uso_count = uso_count + 1 WHERE id = $1`, [faq.id]).catch(() => {});
      return faq.resposta;
    }
  }

  return null;
}

module.exports = { detectarIntencao, detectarTransferencia, extrairEntidade, resolverFaq };
