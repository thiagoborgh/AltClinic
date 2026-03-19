// Server-Sent Events emitter — isolado por tenant
const clients = new Map(); // tenantId → Set<res>

function registerSSEClient(tenantId, res) {
  if (!clients.has(tenantId)) clients.set(tenantId, new Set());
  clients.get(tenantId).add(res);
  res.on('close', () => clients.get(tenantId)?.delete(res));
}

function emitCheckinEvent(tenantId, payload) {
  const tenantClients = clients.get(tenantId);
  if (!tenantClients || tenantClients.size === 0) return;
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  tenantClients.forEach(res => {
    try { res.write(data); } catch (_) {}
  });
}

module.exports = { registerSSEClient, emitCheckinEvent };
