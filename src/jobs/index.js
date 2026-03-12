/**
 * Jobs CRM — AltClinic
 * Registra e inicia todos os jobs automáticos.
 *
 * Importar e chamar startAllJobs() no src/server.js ou src/app.js.
 */
const multiTenantDb = require('../database/MultiTenantPostgres');

const crmConfirmacao = require('./crmConfirmacao');
const crmRetorno     = require('./crmRetorno');
const crmAniversario = require('./crmAniversario');
const crmNps         = require('./crmNps');

function startAllJobs() {
  if (process.env.NODE_ENV === 'test') {
    console.log('[Jobs] Ambiente de teste — jobs não iniciados.');
    return;
  }

  crmConfirmacao.start(multiTenantDb);  // 09:00 — confirmação D-2 / D-1
  crmRetorno.start(multiTenantDb);      // 09:30 — lembrete de retorno
  crmAniversario.start(multiTenantDb);  // 09:00 — mensagem de aniversário
  crmNps.start(multiTenantDb);          // 10:00 — NPS pós-consulta

  console.log('[Jobs] ✅ Todos os jobs CRM iniciados.');
}

module.exports = { startAllJobs };
