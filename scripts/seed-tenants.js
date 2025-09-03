// Seed initial fake data for all existing tenants
require('dotenv').config();

const multiTenantDb = require('../src/models/MultiTenantDatabase');

function log(msg) {
  console.log(`[seed-tenants] ${msg}`);
}

function ensureDefaultServices(tenantDb, tenantId) {
  const count = tenantDb.prepare('SELECT COUNT(*) as c FROM servicos').get().c || 0;
  if (count > 0) return;

  const services = [
    { nome: 'Consulta Médica', descricao: 'Consulta médica geral', duracao: 60, valor: 150.0 },
    { nome: 'Retorno', descricao: 'Consulta de retorno', duracao: 30, valor: 80.0 },
    { nome: 'Exame de Rotina', descricao: 'Exames de rotina e preventivos', duracao: 30, valor: 100.0 },
  ];
  const insert = tenantDb.prepare('INSERT INTO servicos (tenant_id, nome, descricao, duracao, valor) VALUES (?, ?, ?, ?, ?)');
  services.forEach(s => insert.run(tenantId, s.nome, s.descricao, s.duracao, s.valor));
}

function seedPatients(tenantDb, tenantId) {
  const count = tenantDb.prepare('SELECT COUNT(*) as c FROM pacientes').get().c || 0;
  if (count > 0) return [];

  const pacientes = [
    { nome: 'Maria Silva', email: 'maria.silva@example.com', telefone: '(11) 98888-1111', cpf: '123.456.789-00', data_nascimento: '1988-03-15', status: 'ativo' },
    { nome: 'João Santos', email: 'joao.santos@example.com', telefone: '(11) 97777-2222', cpf: '987.654.321-00', data_nascimento: '1982-07-22', status: 'ativo' },
    { nome: 'Ana Costa', email: 'ana.costa@example.com', telefone: '(11) 96666-3333', cpf: '111.222.333-44', data_nascimento: '1992-11-08', status: 'ativo' }
  ];
  const insert = tenantDb.prepare('INSERT INTO pacientes (tenant_id, nome, email, telefone, cpf, data_nascimento, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const ids = [];
  pacientes.forEach(p => {
    const res = insert.run(tenantId, p.nome, p.email, p.telefone, p.cpf, p.data_nascimento, p.status);
    ids.push(res.lastInsertRowid);
  });
  return ids;
}

function seedAppointments(tenantDb, tenantId, pacienteIds) {
  const count = tenantDb.prepare("SELECT COUNT(*) as c FROM agendamentos WHERE date(data_agendamento) >= date('now')").get().c || 0;
  if (count > 0) return;

  const now = Date.now();
  const inDays = (days, hour = 10) => {
    const d = new Date(now + days * 24 * 60 * 60 * 1000);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };

  const ags = [
    { paciente_id: pacienteIds[0], data_agendamento: inDays(1, 10), duracao: 60, servico: 'Consulta Médica', status: 'agendado', valor: 150.0 },
    { paciente_id: pacienteIds[1], data_agendamento: inDays(2, 11), duracao: 30, servico: 'Retorno', status: 'agendado', valor: 80.0 },
    { paciente_id: pacienteIds[2], data_agendamento: inDays(3, 14), duracao: 30, servico: 'Exame de Rotina', status: 'agendado', valor: 100.0 },
  ];
  const insert = tenantDb.prepare('INSERT INTO agendamentos (tenant_id, paciente_id, medico_id, data_agendamento, duracao, servico, status, valor) VALUES (?, ?, NULL, ?, ?, ?, ?, ?)');
  ags.forEach(a => insert.run(tenantId, a.paciente_id, a.data_agendamento, a.duracao, a.servico, a.status, a.valor));
}

async function main() {
  try {
    const masterDb = multiTenantDb.getMasterDb();
    const tenants = masterDb.prepare('SELECT id, slug, nome FROM tenants ORDER BY created_at DESC').all();
    if (!tenants || tenants.length === 0) {
      log('Nenhum tenant encontrado. Nada a fazer.');
      return;
    }

    log(`Encontrados ${tenants.length} tenants. Iniciando seed...`);
    for (const t of tenants) {
      try {
        const tenantDb = multiTenantDb.getTenantDb(t.id);
        ensureDefaultServices(tenantDb, t.id);
        const pids = seedPatients(tenantDb, t.id);
        if (pids.length > 0) {
          seedAppointments(tenantDb, t.id, pids);
        }
        log(`✅ Seed aplicado para tenant ${t.slug} (${t.nome})`);
      } catch (err) {
        log(`❌ Erro ao aplicar seed no tenant ${t.slug}: ${err.message || err}`);
      }
    }
    log('Seed concluído.');
  } catch (error) {
    log(`Erro: ${error.message || error}`);
    process.exitCode = 1;
  }
}

main();
