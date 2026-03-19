const { formatarCpf } = require('../utils/validarCpf');

/**
 * Retorna objeto de duplicata ou null.
 * Tipo 'cpf_duplicado' é BLOQUEANTE; 'nome_similar' é AVISO.
 */
async function verificarDuplicata(db, tenantId, cpf, nome, excluirId = null) {
  const cpfFmt = formatarCpf(cpf);

  const porCpf = await db.get(
    `SELECT id, nome FROM pacientes
     WHERE cpf = $1 AND tenant_id = $2
       AND ($3::text IS NULL OR id::text <> $3)`,
    [cpfFmt, tenantId, excluirId]
  );
  if (porCpf) return { tipo: 'cpf_duplicado', paciente: porCpf };

  const primeiroNome = nome.trim().split(' ')[0];
  const porNome = await db.all(
    `SELECT id, nome, cpf FROM pacientes
     WHERE nome ILIKE $1 AND tenant_id = $2
       AND ($3::text IS NULL OR id::text <> $3)
     LIMIT 3`,
    [`%${primeiroNome}%`, tenantId, excluirId]
  );
  if (porNome.length > 0) return { tipo: 'nome_similar', pacientes: porNome };

  return null;
}

async function buscarPacienteCompleto(db, tenantId, id, perfil) {
  const paciente = await db.get(
    `SELECT p.*,
            pe.cep, pe.logradouro, pe.numero, pe.complemento, pe.bairro, pe.cidade, pe.estado
     FROM pacientes p
     LEFT JOIN pacientes_enderecos pe ON pe.paciente_id = p.id
     WHERE p.id = $1 AND p.tenant_id = $2`,
    [id, tenantId]
  );

  if (!paciente) return null;

  // Dados clínicos restritos: recepcionista e financeiro não veem
  const perfisComDadosClinicos = ['admin', 'admin_master', 'medico', 'enfermeira', 'owner'];
  let dadosClinicos = null;
  if (perfisComDadosClinicos.includes(perfil)) {
    dadosClinicos = await db.get(
      'SELECT tipo_sanguineo, alergias, medicamentos, condicoes FROM pacientes_dados_clinicos WHERE paciente_id = $1',
      [id]
    );
  }

  return { ...paciente, dados_clinicos: dadosClinicos };
}

async function listarPacientes(db, tenantId, { q, status = 'ativo', convenio_id, profissional_id, page = 1, limit = 20, sort = 'nome', order = 'asc' }) {
  const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));
  const limitNum = Math.min(100, parseInt(limit));

  const colunaOrdem = ['nome', 'criado_em'].includes(sort) ? sort : 'nome';
  const direcao = order === 'desc' ? 'DESC' : 'ASC';

  const params = [tenantId, status];
  const conditions = ['p.tenant_id = $1', 'p.status = $2'];

  if (q) {
    params.push(`%${q}%`);
    const idx = params.length;
    conditions.push(`(p.nome ILIKE $${idx} OR p.cpf ILIKE $${idx} OR p.telefone ILIKE $${idx} OR p.email ILIKE $${idx})`);
  }
  if (convenio_id) {
    params.push(convenio_id);
    conditions.push(`p.convenio_id = $${params.length}`);
  }
  if (profissional_id) {
    params.push(profissional_id);
    conditions.push(`p.profissional_referencia_id = $${params.length}`);
  }

  const where = conditions.join(' AND ');

  const countRow = await db.get(
    `SELECT COUNT(*) as total FROM pacientes p WHERE ${where}`,
    params
  );
  const total = parseInt(countRow.total || 0);

  params.push(limitNum, offset);
  const rows = await db.all(
    `SELECT p.id, p.nome, p.cpf, p.telefone, p.email, p.foto_url, p.status,
            p.convenio_id, p.criado_em
     FROM pacientes p
     WHERE ${where}
     ORDER BY p.${colunaOrdem} ${direcao}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: rows,
    pagination: {
      page: parseInt(page),
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  };
}

module.exports = { verificarDuplicata, buscarPacienteCompleto, listarPacientes };
