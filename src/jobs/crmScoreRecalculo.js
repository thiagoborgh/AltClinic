const cron = require('node-cron');
const pool = require('../database/postgres');
const { calcularScoreIA, schemaFromSlug } = require('../services/CrmScoreService');

cron.schedule('0 6 * * *', async () => {
  console.log('[CRM Score] Iniciando recálculo diário...');

  let tenants;
  try {
    const { rows } = await pool.query(`SELECT slug FROM public.tenants WHERE ativo = true`);
    tenants = rows;
  } catch (err) {
    console.error('[CRM Score] Falha ao buscar tenants:', err.message);
    return;
  }

  for (const { slug } of tenants) {
    const schema = schemaFromSlug(slug);
    try {
      const { rows: pendentes } = await pool.query(`
        SELECT id FROM "${schema}".crm_oportunidades
        WHERE ativo = 1
          AND etapa_id NOT IN (
            SELECT id FROM "${schema}".crm_etapas_config WHERE nome IN ('Convertido', 'Perdido')
          )
          AND (score_ia IS NULL OR score_ia_em < NOW() - INTERVAL '1 day')
        ORDER BY criado_em DESC
        LIMIT 100
      `);

      for (const { id } of pendentes) {
        try {
          await calcularScoreIA(schema, id);
        } catch (err) {
          console.error(`[CRM Score] Erro ao calcular score ${id} (${slug}):`, err.message);
        }
      }

      console.log(`[CRM Score] ${slug}: ${pendentes.length} scores atualizados`);
    } catch (err) {
      console.error(`[CRM Score] Erro no tenant ${slug}:`, err.message);
    }
  }
});
