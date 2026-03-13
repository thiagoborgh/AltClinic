// Seed CID-10 (Classificação Internacional de Doenças) into public.cid10
require('dotenv').config();

const multiTenantPostgres = require('../src/database/MultiTenantPostgres');

const CID10_SAMPLE = [
  { codigo: 'J00', descricao: 'Nasofaringite aguda (resfriado comum)', categoria: 'J00-J06', capitulo: 'X' },
  { codigo: 'J06.9', descricao: 'Infecção aguda das vias aéreas superiores não especificada', categoria: 'J00-J06', capitulo: 'X' },
  { codigo: 'J45.0', descricao: 'Asma predominantemente alérgica', categoria: 'J40-J47', capitulo: 'X' },
  { codigo: 'J45.1', descricao: 'Asma não alérgica', categoria: 'J40-J47', capitulo: 'X' },
  { codigo: 'I10', descricao: 'Hipertensão essencial (primária)', categoria: 'I10-I15', capitulo: 'IX' },
  { codigo: 'E11', descricao: 'Diabetes mellitus tipo 2', categoria: 'E10-E14', capitulo: 'IV' },
  { codigo: 'E11.9', descricao: 'Diabetes mellitus tipo 2 sem complicações', categoria: 'E10-E14', capitulo: 'IV' },
  { codigo: 'F32.0', descricao: 'Episódio depressivo leve', categoria: 'F30-F39', capitulo: 'V' },
  { codigo: 'F32.1', descricao: 'Episódio depressivo moderado', categoria: 'F30-F39', capitulo: 'V' },
  { codigo: 'F41.1', descricao: 'Transtorno de ansiedade generalizada', categoria: 'F40-F48', capitulo: 'V' },
  { codigo: 'K21.0', descricao: 'Doença do refluxo gastroesofágico com esofagite', categoria: 'K20-K31', capitulo: 'XI' },
  { codigo: 'K21.9', descricao: 'Doença do refluxo gastroesofágico sem esofagite', categoria: 'K20-K31', capitulo: 'XI' },
  { codigo: 'L20', descricao: 'Dermatite atópica', categoria: 'L20-L30', capitulo: 'XII' },
  { codigo: 'L50.0', descricao: 'Urticária alérgica', categoria: 'L50-L54', capitulo: 'XII' },
  { codigo: 'N39.0', descricao: 'Infecção do trato urinário de localização não especificada', categoria: 'N30-N39', capitulo: 'XIV' },
  { codigo: 'O09', descricao: 'Duração da gravidez', categoria: 'O00-O08', capitulo: 'XV' },
  { codigo: 'Z00.0', descricao: 'Exame médico geral', categoria: 'Z00-Z13', capitulo: 'XXI' },
  { codigo: 'Z00.1', descricao: 'Exame de rotina de saúde de criança', categoria: 'Z00-Z13', capitulo: 'XXI' },
];

async function seedCID10() {
  const masterDb = multiTenantPostgres.getMasterDb();
  console.log('[seed-cid10] Iniciando seed...');

  let inserted = 0;
  for (const row of CID10_SAMPLE) {
    await masterDb.run(
      `INSERT INTO public.cid10 (codigo, descricao, categoria, capitulo)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (codigo) DO NOTHING`,
      [row.codigo, row.descricao, row.categoria, row.capitulo]
    );
    inserted++;
  }

  console.log(`[seed-cid10] ${inserted} registros inseridos (ON CONFLICT DO NOTHING).`);
  process.exit(0);
}

seedCID10().catch(e => {
  console.error(e);
  process.exit(1);
});
