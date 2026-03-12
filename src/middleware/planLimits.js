/**
 * Middleware de limites por plano — AltClinic
 *
 * Verifica se o tenant atingiu os limites do seu plano antes
 * de permitir a criação de médicos/usuários ou pacientes.
 *
 * Compatível com req.db via MultiTenantDatabase (SQLite síncrono).
 * Caso req.db exponha uma API async (TenantDb PostgreSQL), await funciona igualmente.
 */

const PLANOS = {
  trial:      { maxMedicos: 1,  maxPacientes: 100,  valor: 0   },
  starter:    { maxMedicos: 1,  maxPacientes: 500,   valor: 149 },
  pro:        { maxMedicos: 5,  maxPacientes: 2000,  valor: 349 },
  enterprise: { maxMedicos: -1, maxPacientes: -1,    valor: 799 },
  // Aliases usados por registros legados
  freemium:    { maxMedicos: 1,  maxPacientes: 100,  valor: 0   },
  professional:{ maxMedicos: 5,  maxPacientes: 2000, valor: 349 },
};

/**
 * Resolve o limite do plano para um recurso.
 * Prioridade:
 *   1. tenant.config.maxMedicos / maxPacientes (set durante onboarding)
 *   2. Tabela PLANOS por tenant.plano
 *   3. Fallback seguro: 1
 */
function resolveLimit(tenant, field) {
  // config JSONB/JSON já parseado pelo driver
  const fromConfig = tenant.config?.[field];
  if (typeof fromConfig === 'number') return fromConfig;

  const planoKey = (tenant.plano || 'trial').toLowerCase();
  const plano = PLANOS[planoKey];
  if (plano && typeof plano[field] === 'number') return plano[field];

  return 1; // fallback seguro
}

// ─── checkMedicoLimit ─────────────────────────────────────────────────────────

/**
 * Middleware que impede criação de médicos/usuários quando o limite do plano
 * foi atingido.
 *
 * Tabela verificada: usuarios (status = 'active')
 */
const checkMedicoLimit = async (req, res, next) => {
  try {
    const { tenant } = req;

    if (!tenant) {
      return res.status(400).json({ error: 'Tenant não encontrado no contexto da requisição' });
    }

    const limite = resolveLimit(tenant, 'maxMedicos');

    // -1 = ilimitado (enterprise)
    if (limite === -1) return next();

    const db = req.db;
    let total;

    if (db && typeof db.get === 'function') {
      // API async (TenantDb PostgreSQL): await db.get(sql, params)
      // ou SQLite síncrono que também retorna direto — await é transparente
      const row = await db.get(
        `SELECT COUNT(*) AS total FROM usuarios WHERE tenant_id = $1 AND status = 'active'`,
        [tenant.id]
      );
      total = parseInt(row?.total ?? 0, 10);
    } else if (db && typeof db.prepare === 'function') {
      // Fallback: SQLite síncrono via better-sqlite3
      const row = db.prepare(
        `SELECT COUNT(*) AS total FROM usuarios WHERE tenant_id = ? AND status = 'active'`
      ).get(tenant.id);
      total = parseInt(row?.total ?? 0, 10);
    } else {
      // Sem db disponível — deixar passar e logar
      console.warn('[planLimits] checkMedicoLimit: req.db indisponível, pulando verificação');
      return next();
    }

    if (total >= limite) {
      return res.status(402).json({
        error: 'Limite do plano atingido',
        message: `Seu plano ${tenant.plano} permite até ${limite} médico(s). Faça upgrade para adicionar mais.`,
        current: total,
        limit: limite,
        plano: tenant.plano,
        upgradeUrl: `/upgrade?tenant=${tenant.slug}`,
      });
    }

    next();
  } catch (error) {
    console.error('[planLimits] Erro em checkMedicoLimit:', error);
    res.status(500).json({ error: 'Erro interno ao verificar limite de médicos' });
  }
};

// ─── checkPacienteLimit ───────────────────────────────────────────────────────

/**
 * Middleware que impede criação de pacientes quando o limite do plano
 * foi atingido.
 *
 * Tabela verificada: pacientes (status = 'ativo')
 */
const checkPacienteLimit = async (req, res, next) => {
  try {
    const { tenant } = req;

    if (!tenant) {
      return res.status(400).json({ error: 'Tenant não encontrado no contexto da requisição' });
    }

    const limite = resolveLimit(tenant, 'maxPacientes');

    // -1 = ilimitado (enterprise)
    if (limite === -1) return next();

    const db = req.db;
    let total;

    if (db && typeof db.get === 'function') {
      const row = await db.get(
        `SELECT COUNT(*) AS total FROM pacientes WHERE tenant_id = $1 AND status = 'ativo'`,
        [tenant.id]
      );
      total = parseInt(row?.total ?? 0, 10);
    } else if (db && typeof db.prepare === 'function') {
      const row = db.prepare(
        `SELECT COUNT(*) AS total FROM pacientes WHERE tenant_id = ? AND status = 'ativo'`
      ).get(tenant.id);
      total = parseInt(row?.total ?? 0, 10);
    } else {
      console.warn('[planLimits] checkPacienteLimit: req.db indisponível, pulando verificação');
      return next();
    }

    if (total >= limite) {
      return res.status(402).json({
        error: 'Limite do plano atingido',
        message: `Seu plano ${tenant.plano} permite até ${limite} paciente(s). Faça upgrade para adicionar mais.`,
        current: total,
        limit: limite,
        plano: tenant.plano,
        upgradeUrl: `/upgrade?tenant=${tenant.slug}`,
      });
    }

    next();
  } catch (error) {
    console.error('[planLimits] Erro em checkPacienteLimit:', error);
    res.status(500).json({ error: 'Erro interno ao verificar limite de pacientes' });
  }
};

module.exports = { checkMedicoLimit, checkPacienteLimit, PLANOS };
