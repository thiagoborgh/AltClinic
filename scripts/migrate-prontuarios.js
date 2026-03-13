// scripts/migrate-prontuarios.js
/**
 * Migra prontuários legados (prontuarios_pep) para o novo schema (prontuario_registros).
 * Idempotente: usa pep_origem_id para evitar duplicatas.
 * Executa em transação por tenant.
 *
 * Uso: node scripts/migrate-prontuarios.js [--tenant=slug] [--dry-run]
 */
require('dotenv').config();
const multiTenantPostgres = require('../src/database/MultiTenantPostgres');

const args = process.argv.slice(2);
const targetSlug = args.find(a => a.startsWith('--tenant='))?.split('=')[1];
const dryRun = args.includes('--dry-run');

async function migrateTenant(tenantId, slug) {
  console.log(`\n[migrate] Tenant: ${slug} (${tenantId})${dryRun ? ' [DRY-RUN]' : ''}`);
  // IMPORTANTE: prontuarios_pep usa tenant_id como coluna (não schema isolation)
  // A tabela existe no schema do tenant, mas filtramos por tenant_id por segurança
  const masterDb = multiTenantPostgres.getMasterDb();
  const tenantDb = multiTenantPostgres.getTenantDb(tenantId, slug);

  // Buscar template legado no schema público
  const template = await masterDb.get(
    `SELECT id FROM public.form_definitions
     WHERE name='Anamnese Estética (Legado)' AND is_system=true`
  );
  if (!template) {
    console.log(`  SKIP: Template legado não encontrado. Rode seed-form-templates.js primeiro.`);
    return { migrated: 0, skipped: 0, errors: 0 };
  }

  // prontuarios_pep pode estar no schema do tenant ou usar tenant_id como coluna
  // Tentar no tenantDb primeiro, fallback para masterDb com filtro tenant_id
  let legados = [];
  try {
    legados = await tenantDb.all(
      `SELECT * FROM prontuarios_pep WHERE tenant_id=$1 ORDER BY created_at ASC`,
      [tenantId]
    );
  } catch (e) {
    // Tabela não existe neste tenant, tentar sem schema isolation
    try {
      legados = await masterDb.all(
        `SELECT * FROM prontuarios_pep WHERE tenant_id=$1 ORDER BY created_at ASC`,
        [String(tenantId)]
      );
    } catch (e2) {
      console.log(`  SKIP: Tabela prontuarios_pep não encontrada.`);
      return { migrated: 0, skipped: 0, errors: 0 };
    }
  }

  console.log(`  Encontrados: ${legados.length} registros legados`);
  if (legados.length === 0) return { migrated: 0, skipped: 0, errors: 0 };

  let migrated = 0, skipped = 0, errors = 0;

  if (dryRun) {
    for (const pep of legados) {
      console.log(`  [DRY-RUN] Migraria PEP id=${pep.id}, paciente=${pep.paciente_id}`);
      migrated++;
    }
    return { migrated, skipped, errors };
  }

  // Executar em transação atômica por tenant usando tenantDb.transaction()
  // que gerencia BEGIN/COMMIT/ROLLBACK e search_path automaticamente
  try {
    await tenantDb.transaction(async (client) => {
      for (const pep of legados) {
        // Idempotência: verificar se já foi migrado
        const jaExiste = await client.query(
          'SELECT id FROM prontuario_registros WHERE pep_origem_id=$1', [pep.id]
        );
        if (jaExiste.rows.length > 0) { skipped++; continue; }

        const data_json = {
          queixa_principal:  pep.queixa_principal || '',
          historia_doenca:   pep.historia_doenca_atual || '',
          antecedentes:      `${pep.antecedentes_pessoais || ''}\n${pep.antecedentes_familiares || ''}`.trim(),
          medicamentos:      pep.medicamentos_em_uso || '',
          alergias:          pep.alergias || '',
          exame_fisico:      pep.exame_fisico || '',
          conduta:           pep.prescricao || '',
          observacoes:       pep.orientacoes || '',
        };

        await client.query(
          `INSERT INTO prontuario_registros
             (paciente_id, profissional_id, form_definition_id, data_registro,
              data_json, assinado, assinado_em, pep_origem_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [pep.paciente_id, pep.medico_id || 0, template.id,
           pep.created_at?.toISOString?.()?.split('T')[0] || pep.created_at?.split?.('T')[0] || new Date().toISOString().split('T')[0],
           JSON.stringify(data_json),
           pep.status === 'assinado', pep.assinado_em || null,
           pep.id, pep.created_at]
        );
        migrated++;
      }
    });
  } catch (err) {
    console.error(`  ROLLBACK tenant ${slug}:`, err.message);
    errors = legados.length;
    return { migrated: 0, skipped, errors };
  }

  // Validação pós-COMMIT (fora da transação para consistência observável)
  const countNovo = await tenantDb.get(
    'SELECT COUNT(*) as n FROM prontuario_registros WHERE pep_origem_id IS NOT NULL'
  );
  console.log(`  Legados: ${legados.length} | Migrados: ${countNovo.n} | Skipped: ${skipped} | Erros: ${errors}`);

  return { migrated, skipped, errors };
}

async function main() {
  const masterDb = multiTenantPostgres.getMasterDb();
  let tenants;

  if (targetSlug) {
    const t = await masterDb.get('SELECT id, slug FROM tenants WHERE slug=$1', [targetSlug]);
    if (!t) { console.error(`Tenant '${targetSlug}' não encontrado.`); process.exit(1); }
    tenants = [t];
  } else {
    // tenants.status é TEXT ('trial', 'active', 'cancelado', etc.) — não há coluna ativo (boolean)
    tenants = await masterDb.all(
      `SELECT id, slug FROM tenants WHERE status NOT IN ('cancelado', 'suspenso') ORDER BY slug`
    );
  }

  console.log(`[migrate] ${tenants.length} tenant(s) a processar`);

  let total = { migrated: 0, skipped: 0, errors: 0 };
  for (const t of tenants) {
    const result = await migrateTenant(t.id, t.slug);
    total.migrated += result.migrated;
    total.skipped  += result.skipped;
    total.errors   += result.errors;
  }

  console.log(`\n[migrate] CONCLUÍDO — Migrados: ${total.migrated} | Skipped: ${total.skipped} | Erros: ${total.errors}`);

  await multiTenantPostgres.closeAll();
  process.exit(total.errors > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
