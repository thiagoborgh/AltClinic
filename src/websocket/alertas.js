/**
 * websocket/alertas.js — helpers para emissão de alertas proativos via socket.io
 * O servidor socket.io já está configurado em src/server.js.
 */
const pool = require('../database/postgres');

function getIo() {
  try { return require('../server').io; } catch { return null; }
}

/**
 * Emite um alerta já persistido para a sala do tenant.
 * @param {string} tenantId
 * @param {string|null} perfilAlvo — null = broadcast para todo o tenant
 * @param {Object} alerta
 */
function emitirAlerta(tenantId, perfilAlvo, alerta) {
  const io = getIo();
  if (!io) return;
  // Por enquanto emite para a sala do tenant inteira
  io.to(`tenant:${tenantId}`).emit('alerta_proativo', { perfilAlvo, alerta });
}

/**
 * Persiste um alerta no banco E emite via socket.io imediatamente.
 *
 * @param {string}  tenantId
 * @param {string}  schema       — schema da clínica (ex: "clinica_minha-clinica")
 * @param {string|null} perfilAlvo
 * @param {string}  tipo
 * @param {string}  prioridade   — 'baixa'|'normal'|'alta'|'critica'
 * @param {string}  titulo
 * @param {string}  mensagem
 * @param {Object|null} dados
 * @param {string|null} acaoUrl
 * @param {number|null} usuarioId — destinatário específico (opcional)
 * @returns {Promise<Object>} alerta inserido
 */
async function emitirAlertaInstantaneo(
  tenantId, schema,
  perfilAlvo, tipo, prioridade, titulo, mensagem,
  dados = null, acaoUrl = null, usuarioId = null
) {
  const { rows } = await pool.query(
    `INSERT INTO "${schema}".alertas_proativos
       (tenant_id, usuario_id, perfil_alvo, tipo, prioridade, titulo, mensagem, dados_json, acao_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [tenantId, usuarioId, perfilAlvo, tipo, prioridade, titulo, mensagem,
     dados ? JSON.stringify(dados) : null, acaoUrl]
  );
  const alerta = rows[0];
  emitirAlerta(tenantId, perfilAlvo, alerta);
  return alerta;
}

module.exports = { emitirAlerta, emitirAlertaInstantaneo };
