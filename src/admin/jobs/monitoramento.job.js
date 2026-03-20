const cron = require('node-cron');
const pool = require('../../database/postgres');

async function verificarTrialsExpirando() {
  try {
    const em3Dias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const agora = new Date().toISOString();

    const { rows } = await pool.query(
      `SELECT slug FROM tenants
       WHERE status = 'trial' AND trial_fim > $1 AND trial_fim <= $2`,
      [agora, em3Dias]
    );

    for (const tenant of rows) {
      await pool.query(
        `INSERT INTO admin_audit_log (admin_id, tenant_slug, acao, detalhes_json)
         VALUES (0, $1, 'trial.expirando_3_dias', $2)`,
        [tenant.slug, JSON.stringify({ trial_fim: tenant.trial_fim })]
      ).catch(() => {});
    }

    if (rows.length > 0) {
      console.log(`[monitoramento] ${rows.length} trial(s) expirando em 3 dias`);
    }
  } catch (err) {
    console.error('[monitoramento] verificarTrialsExpirando:', err.message);
  }
}

async function expirarTrials() {
  try {
    const agora = new Date().toISOString();

    const { rows } = await pool.query(
      `UPDATE tenants SET status = 'leitura', atualizado_em = NOW()
       WHERE status = 'trial' AND trial_fim < $1
       RETURNING slug`,
      [agora]
    );

    for (const tenant of rows) {
      await pool.query(
        `INSERT INTO admin_audit_log (admin_id, tenant_slug, acao, detalhes_json)
         VALUES (0, $1, 'trial.expirado', $2)`,
        [tenant.slug, JSON.stringify({ expirado_em: agora })]
      ).catch(() => {});
    }

    if (rows.length > 0) {
      console.log(`[monitoramento] ${rows.length} trial(s) expirado(s) → status='leitura'`);
    }
  } catch (err) {
    console.error('[monitoramento] expirarTrials:', err.message);
  }
}

async function suspenderLeituraAntiga() {
  try {
    const limite = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { rows } = await pool.query(
      `UPDATE tenants SET status = 'suspenso', atualizado_em = NOW()
       WHERE status = 'leitura' AND atualizado_em < $1
       RETURNING slug`,
      [limite]
    );

    for (const tenant of rows) {
      await pool.query(
        `INSERT INTO admin_audit_log (admin_id, tenant_slug, acao, detalhes_json)
         VALUES (0, $1, 'tenant.suspenso_por_inadimplencia', $2)`,
        [tenant.slug, JSON.stringify({ suspenso_em: new Date().toISOString() })]
      ).catch(() => {});
    }

    if (rows.length > 0) {
      console.log(`[monitoramento] ${rows.length} tenant(s) suspenso(s) por inadimplência > 7 dias`);
    }
  } catch (err) {
    console.error('[monitoramento] suspenderLeituraAntiga:', err.message);
  }
}

async function detectarInativos() {
  try {
    const limite14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const { rows } = await pool.query(
      `SELECT slug, ultimo_acesso FROM tenants
       WHERE status = 'ativo'
         AND (ultimo_acesso < $1 OR ultimo_acesso IS NULL)
         AND created_at < $1`,
      [limite14]
    );

    for (const tenant of rows) {
      await pool.query(
        `INSERT INTO admin_audit_log (admin_id, tenant_slug, acao, detalhes_json)
         VALUES (0, $1, 'tenant.inativo_14_dias', $2)`,
        [tenant.slug, JSON.stringify({ ultimo_acesso: tenant.ultimo_acesso })]
      ).catch(() => {});
    }

    if (rows.length > 0) {
      console.log(`[monitoramento] ${rows.length} tenant(s) inativo(s) há > 14 dias`);
    }
  } catch (err) {
    console.error('[monitoramento] detectarInativos:', err.message);
  }
}

async function atualizarUsoTenants() {
  try {
    const { rows: tenants } = await pool.query(
      `SELECT id, slug, schema_name FROM tenants WHERE status IN ('ativo','trial','leitura') AND schema_name IS NOT NULL`
    );

    for (const tenant of tenants) {
      try {
        const schema = tenant.schema_name;

        // Contar pacientes
        const { rows: pacRows } = await pool.query(
          `SELECT COUNT(*) AS total FROM ${schema}.pacientes`
        ).catch(() => [{ total: 0 }]);

        // Contar usuários
        const { rows: usrRows } = await pool.query(
          `SELECT COUNT(*) AS total FROM ${schema}.usuarios`
        ).catch(() => [{ total: 0 }]);

        const pacientes = parseInt(pacRows[0]?.total || 0);
        const usuarios = parseInt(usrRows[0]?.total || 0);

        await pool.query(
          `UPDATE tenants SET uso_pacientes = $1, uso_usuarios = $2, atualizado_em = NOW()
           WHERE id = $3`,
          [pacientes, usuarios, tenant.id]
        );
      } catch (schemaErr) {
        // Schema pode não existir ainda — ignorar silenciosamente
      }
    }

    console.log(`[monitoramento] uso atualizado para ${tenants.length} tenant(s)`);
  } catch (err) {
    console.error('[monitoramento] atualizarUsoTenants:', err.message);
  }
}

async function executarMonitoramento() {
  console.log('[monitoramento] Iniciando ciclo de monitoramento...');
  await verificarTrialsExpirando();
  await expirarTrials();
  await suspenderLeituraAntiga();
  await detectarInativos();
  await atualizarUsoTenants();
  console.log('[monitoramento] Ciclo concluído.');
}

function register() {
  // Executar diariamente às 09:00
  cron.schedule('0 9 * * *', executarMonitoramento, {
    timezone: process.env.TZ || 'America/Sao_Paulo'
  });
  console.log('[monitoramento.job] Registrado — execução diária às 09:00');
}

module.exports = { register, executarMonitoramento };
