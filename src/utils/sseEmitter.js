// Server-Sent Events emitter — isolado por tenant
const clients = new Map(); // tenantId → Set<{ res, options }>

function registerSSEClient(tenantId, res, options = {}) {
  if (!clients.has(tenantId)) clients.set(tenantId, new Set());
  const entry = { res, options };
  clients.get(tenantId).add(entry);
  res.on('close', () => clients.get(tenantId)?.delete(entry));
}

function emitCheckinEvent(tenantId, payload) {
  const tenantClients = clients.get(tenantId);
  if (!tenantClients || tenantClients.size === 0) return;
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  tenantClients.forEach(({ res }) => {
    try { res.write(data); } catch (_) {}
  });
}

function emitFilaEvent(tenantId, payload) {
  const tenantClients = clients.get(tenantId);
  if (!tenantClients || tenantClients.size === 0) return;
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  tenantClients.forEach(({ res, options }) => {
    // Filtrar por profissional_id se o cliente registrou esse filtro
    if (options.profissionalId && payload.profissional_id &&
        options.profissionalId !== payload.profissional_id) {
      return;
    }
    try { res.write(data); } catch (_) {}
  });
}

function emitConfirmacaoEvent(tenantId, payload) {
  const tenantClients = clients.get(tenantId);
  if (!tenantClients || tenantClients.size === 0) return;
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  tenantClients.forEach(({ res }) => {
    try { res.write(data); } catch (_) {}
  });
}

module.exports = { registerSSEClient, emitCheckinEvent, emitFilaEvent, emitConfirmacaoEvent };
