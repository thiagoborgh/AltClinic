const cron = require('node-cron');
const pool = require('../database/postgres');

function schemaFromSlug(slug) {
  return 'clinica_' + slug.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

// Executa diariamente às 7h
cron.schedule('0 7 * * *', async () => {
  console.log('[CronJob] Verificando alertas de registro profissional...');

  let tenants;
  try {
    const { rows } = await pool.query(
      "SELECT slug, nome FROM public.tenants WHERE status = 'active'"
    );
    tenants = rows;
  } catch (err) {
    console.error('[CronJob] Erro ao buscar tenants:', err.message);
    return;
  }

  for (const tenant of tenants) {
    try {
      await verificarAlertasTenant(tenant);
    } catch (err) {
      console.error(`[CronJob] Erro no tenant ${tenant.slug}:`, err.message);
    }
  }
});

async function verificarAlertasTenant(tenant) {
  const schema = schemaFromSlug(tenant.slug);

  // Garantir que tabela de log existe
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".alertas_registro_log (
        profissional_id UUID NOT NULL,
        tipo_alerta     TEXT NOT NULL,
        enviado_em      DATE NOT NULL DEFAULT CURRENT_DATE,
        PRIMARY KEY (profissional_id, tipo_alerta, enviado_em)
      )
    `);
  } catch (_) { return; } // Schema pode não existir ainda

  const { rows: profissionais } = await pool.query(
    `SELECT id, nome, conselho, registro_numero, registro_uf, registro_validade
     FROM "${schema}".profissionais
     WHERE status = 'ativo'
       AND registro_validade <= CURRENT_DATE + INTERVAL '30 days'
     ORDER BY registro_validade ASC`
  );

  if (profissionais.length === 0) return;

  const hoje = new Date();

  for (const prof of profissionais) {
    const validade = new Date(prof.registro_validade);
    const diffDias = Math.floor((validade - hoje) / (1000 * 60 * 60 * 24));

    let tipoAlerta;
    if (diffDias < 0) tipoAlerta = 'vencido';
    else if (diffDias <= 7) tipoAlerta = '7_dias';
    else if (diffDias <= 15) tipoAlerta = '15_dias';
    else tipoAlerta = '30_dias';

    // Deduplicar: verificar se alerta já foi enviado hoje
    const { rows: jaEnviado } = await pool.query(
      `SELECT 1 FROM "${schema}".alertas_registro_log
       WHERE profissional_id = $1 AND tipo_alerta = $2 AND enviado_em = CURRENT_DATE`,
      [prof.id, tipoAlerta]
    );
    if (jaEnviado.length > 0) continue;

    await pool.query(
      `INSERT INTO "${schema}".alertas_registro_log (profissional_id, tipo_alerta)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [prof.id, tipoAlerta]
    );

    console.log(`[CronJob][${tenant.slug}] Alerta ${tipoAlerta} para ${prof.nome} (${prof.conselho} ${prof.registro_numero})`);
    // TODO: enviar email via emailService quando serviço de email estiver configurado
  }
}

module.exports = { verificarAlertasTenant };
