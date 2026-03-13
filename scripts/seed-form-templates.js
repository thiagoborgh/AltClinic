// scripts/seed-form-templates.js
require('dotenv').config();

const multiTenantPostgres = require('../src/database/MultiTenantPostgres');

const TEMPLATES = [
  {
    name: '1ª Consulta — Clínica Geral',
    type: 'anamnese',
    specialty: 'clinica_geral',
    is_system: true,
    fields_json: [
      { id: 'queixa_principal', type: 'memo', label: 'Queixa Principal', required: true, grid_col: 1 },
      { id: 'historia_doenca', type: 'memo', label: 'História da Doença Atual', required: false, grid_col: 1 },
      { id: 'antecedentes_pessoais', type: 'memo', label: 'Antecedentes Pessoais', required: false, grid_col: 2 },
      { id: 'medicamentos', type: 'memo', label: 'Medicamentos em Uso', required: false, grid_col: 2 },
      { id: 'alergias', type: 'text', label: 'Alergias', required: false, grid_col: 1 },
      { id: 'exame_fisico', type: 'memo', label: 'Exame Físico', required: false, grid_col: 1 },
      { id: 'cid_principal', type: 'cid10', label: 'Hipótese Diagnóstica (CID-10)', required: false, grid_col: 2 },
      { id: 'conduta', type: 'memo', label: 'Conduta / Plano', required: false, grid_col: 2 },
    ]
  },
  {
    name: 'Retorno — Clínica Geral',
    type: 'evolucao',
    specialty: 'clinica_geral',
    is_system: true,
    fields_json: [
      { id: 'evolucao', type: 'memo', label: 'Evolução Clínica', required: true, grid_col: 1 },
      { id: 'exame_fisico', type: 'memo', label: 'Exame Físico', required: false, grid_col: 1 },
      { id: 'cid_principal', type: 'cid10', label: 'CID-10', required: false, grid_col: 2 },
      { id: 'conduta', type: 'memo', label: 'Conduta', required: false, grid_col: 2 },
    ]
  },
  {
    name: '1ª Consulta — Dermatologia',
    type: 'anamnese',
    specialty: 'dermatologia',
    is_system: true,
    fields_json: [
      { id: 'queixa_principal', type: 'memo', label: 'Queixa Principal', required: true, grid_col: 1 },
      { id: 'historia_doenca', type: 'memo', label: 'História da Doença Atual', required: false, grid_col: 1 },
      { id: 'antecedentes', type: 'memo', label: 'Antecedentes Dermatológicos', required: false, grid_col: 2 },
      { id: 'fototipo', type: 'select', label: 'Fototipo (Fitzpatrick)', required: false, grid_col: 2,
        options: ['I - Muito Branca', 'II - Branca', 'III - Morena Clara', 'IV - Morena', 'V - Negra Clara', 'VI - Negra'] },
      { id: 'exame_dermatologico', type: 'memo', label: 'Exame Dermatológico', required: false, grid_col: 1 },
      { id: 'cid_principal', type: 'cid10', label: 'Hipótese Diagnóstica (CID-10)', required: false, grid_col: 2 },
      { id: 'conduta', type: 'memo', label: 'Conduta', required: false, grid_col: 1 },
    ]
  },
  {
    name: '1ª Consulta — Ginecologia',
    type: 'anamnese',
    specialty: 'ginecologia',
    is_system: true,
    fields_json: [
      { id: 'queixa_principal', type: 'memo', label: 'Queixa Principal', required: true, grid_col: 1 },
      { id: 'historia_menstrual', type: 'memo', label: 'História Menstrual', required: false, grid_col: 1 },
      { id: 'historia_obstetrica', type: 'text', label: 'G/P/A (Gestações/Partos/Abortos)', required: false, grid_col: 2 },
      { id: 'metodo_contraceptivo', type: 'text', label: 'Método Contraceptivo', required: false, grid_col: 2 },
      { id: 'antecedentes', type: 'memo', label: 'Antecedentes Pessoais', required: false, grid_col: 1 },
      { id: 'exame_ginecologico', type: 'memo', label: 'Exame Ginecológico', required: false, grid_col: 1 },
      { id: 'cid_principal', type: 'cid10', label: 'CID-10', required: false, grid_col: 2 },
      { id: 'conduta', type: 'memo', label: 'Conduta', required: false, grid_col: 2 },
    ]
  },
  {
    name: '1ª Consulta — Pediatria',
    type: 'anamnese',
    specialty: 'pediatria',
    is_system: true,
    fields_json: [
      { id: 'queixa_principal', type: 'memo', label: 'Queixa Principal', required: true, grid_col: 1 },
      { id: 'responsavel', type: 'text', label: 'Nome do Responsável', required: false, grid_col: 2 },
      { id: 'historia_doenca', type: 'memo', label: 'História da Doença', required: false, grid_col: 1 },
      { id: 'dnpm', type: 'memo', label: 'Desenvolvimento Neuropsicomotor', required: false, grid_col: 2 },
      { id: 'vacinacao', type: 'memo', label: 'Vacinação (em dia?)', required: false, grid_col: 1 },
      { id: 'exame_fisico', type: 'memo', label: 'Exame Físico', required: false, grid_col: 1 },
      { id: 'cid_principal', type: 'cid10', label: 'CID-10', required: false, grid_col: 2 },
      { id: 'conduta', type: 'memo', label: 'Conduta', required: false, grid_col: 2 },
    ]
  },
  {
    name: 'Entrevista Inicial — Psicologia',
    type: 'anamnese',
    specialty: 'psicologia',
    is_system: true,
    fields_json: [
      { id: 'queixa_principal', type: 'memo', label: 'Queixa Principal', required: true, grid_col: 1 },
      { id: 'historia_problema', type: 'memo', label: 'História do Problema Atual', required: false, grid_col: 1 },
      { id: 'historia_pessoal', type: 'memo', label: 'História Pessoal e Familiar', required: false, grid_col: 2 },
      { id: 'hipotese', type: 'memo', label: 'Hipótese Diagnóstica', required: false, grid_col: 2 },
      { id: 'plano_terapeutico', type: 'memo', label: 'Plano Terapêutico', required: false, grid_col: 1 },
    ]
  },
  {
    name: 'Evolução SOAP — Psicologia',
    type: 'evolucao',
    specialty: 'psicologia',
    is_system: true,
    fields_json: [
      { id: 'subjetivo', type: 'memo', label: 'S — Subjetivo (relato do paciente)', required: false, grid_col: 1 },
      { id: 'objetivo', type: 'memo', label: 'O — Objetivo (observação clínica)', required: false, grid_col: 1 },
      { id: 'avaliacao', type: 'memo', label: 'A — Avaliação', required: false, grid_col: 2 },
      { id: 'plano', type: 'memo', label: 'P — Plano', required: false, grid_col: 2 },
    ]
  },
  {
    name: 'Anamnese Estética (Legado)',
    type: 'anamnese',
    specialty: 'estetica',
    is_system: true,
    fields_json: [
      { id: 'queixa_principal', type: 'memo', label: 'Motivo da Consulta', required: true, grid_col: 1 },
      { id: 'antecedentes', type: 'memo', label: 'Antecedentes Médicos', required: false, grid_col: 1 },
      { id: 'alergias', type: 'text', label: 'Alergias', required: false, grid_col: 2 },
      { id: 'medicamentos', type: 'memo', label: 'Medicamentos em Uso', required: false, grid_col: 2 },
      { id: 'observacoes', type: 'memo', label: 'Observações', required: false, grid_col: 1 },
    ]
  },
];

async function seedTemplates() {
  const masterDb = multiTenantPostgres.getMasterDb();
  console.log('[seed-templates] Iniciando seed de templates...');

  let inserted = 0;
  for (const tpl of TEMPLATES) {
    const existing = await masterDb.get(
      'SELECT id FROM public.form_definitions WHERE name=$1 AND is_system=true',
      [tpl.name]
    );
    if (existing) { console.log(`  SKIP: ${tpl.name}`); continue; }

    await masterDb.run(
      `INSERT INTO public.form_definitions (name, type, specialty, fields_json, is_system)
       VALUES ($1, $2, $3, $4, $5)`,
      [tpl.name, tpl.type, tpl.specialty, JSON.stringify(tpl.fields_json), true]
    );
    console.log(`  OK: ${tpl.name}`);
    inserted++;
  }

  console.log(`[seed-templates] ${inserted} templates inseridos.`);
  process.exit(0);
}

seedTemplates().catch(e => { console.error(e); process.exit(1); });
