const pool = require('../database/postgres');
const { validarCPF } = require('../utils/validar-cpf');

function schemaFromSlug(slug) {
  return 'clinica_' + slug.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function calcularAlertaValidade(registroValidadeStr, hoje = new Date()) {
  if (!registroValidadeStr) return null;
  const validade = new Date(registroValidadeStr);
  const diffMs = validade - hoje;
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias < 0)   return 'vencido';
  if (diffDias <= 7)  return '7_dias';
  if (diffDias <= 15) return '15_dias';
  if (diffDias <= 30) return '30_dias';
  return null;
}

async function listar(tenantSlug, filtros = {}) {
  const schema = schemaFromSlug(tenantSlug);
  const { busca, especialidade, status = 'ativo', page = 1, limit = 20 } = filtros;
  const limitNum = Math.min(100, parseInt(limit) || 20);
  const pageNum  = Math.max(1, parseInt(page) || 1);

  const params = [];
  let where = `WHERE 1=1`;

  if (status) {
    params.push(status);
    where += ` AND status = $${params.length}`;
  }
  if (busca) {
    params.push(`%${busca}%`, `%${busca}%`);
    where += ` AND (nome ILIKE $${params.length - 1} OR registro_numero ILIKE $${params.length})`;
  }
  if (especialidade) {
    params.push(especialidade);
    where += ` AND especialidade_principal = $${params.length}`;
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) AS total FROM "${schema}".profissionais ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].total, 10);

  params.push(limitNum, (pageNum - 1) * limitNum);
  const { rows: profissionais } = await pool.query(
    `SELECT id, nome, titulo, especialidade_principal,
            conselho, registro_numero, registro_uf, registro_validade,
            foto_url, status
     FROM "${schema}".profissionais
     ${where}
     ORDER BY nome ASC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const hoje = new Date();
  return {
    data: profissionais.map(p => ({
      ...p,
      alerta_validade: calcularAlertaValidade(p.registro_validade, hoje),
    })),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  };
}

async function buscarPorId(tenantSlug, id) {
  const schema = schemaFromSlug(tenantSlug);

  const { rows: profRows } = await pool.query(
    `SELECT * FROM "${schema}".profissionais WHERE id = $1`, [id]
  );
  const profissional = profRows[0];
  if (!profissional) return null;

  const [espRows, procRows, dispRows, bloqRows] = await Promise.all([
    pool.query(`SELECT especialidade FROM "${schema}".profissionais_especialidades WHERE profissional_id = $1`, [id]),
    pool.query(`SELECT procedimento_id, duracao_minutos FROM "${schema}".profissionais_procedimentos WHERE profissional_id = $1`, [id]),
    pool.query(`SELECT * FROM "${schema}".profissionais_disponibilidade WHERE profissional_id = $1 ORDER BY dia_semana, hora_inicio`, [id]),
    pool.query(`SELECT * FROM "${schema}".profissionais_bloqueios WHERE profissional_id = $1 AND data_fim >= CURRENT_DATE ORDER BY data_inicio`, [id]),
  ]);

  return {
    ...profissional,
    especialidades:  espRows.rows.map(r => r.especialidade),
    procedimentos:   procRows.rows,
    disponibilidade: dispRows.rows,
    bloqueios:       bloqRows.rows,
  };
}

async function criar(tenantSlug, dados, fotoUrl = null) {
  const schema = schemaFromSlug(tenantSlug);

  if (!validarCPF(dados.cpf)) {
    throw { status: 400, message: 'CPF inválido' };
  }

  const cpfNormalizado = dados.cpf.replace(/\D/g, '');

  const { rows: existente } = await pool.query(
    `SELECT id FROM "${schema}".profissionais WHERE cpf = $1`, [cpfNormalizado]
  );
  if (existente.length > 0) {
    throw { status: 409, message: 'CPF já cadastrado para outro profissional' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET search_path = "${schema}", public`);

    const { rows: insertRows } = await client.query(
      `INSERT INTO profissionais (
         usuario_id, nome, titulo, cpf, data_nascimento, sexo, foto_url,
         telefone, email, conselho, registro_numero, registro_uf, registro_validade,
         especialidade_principal, rqe, tipo_vinculo, comissao_tipo, comissao_valor, status
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'ativo')
       RETURNING id`,
      [
        dados.usuario_id || null, dados.nome, dados.titulo,
        cpfNormalizado, dados.data_nascimento, dados.sexo,
        fotoUrl, dados.telefone, dados.email, dados.conselho,
        dados.registro_numero, dados.registro_uf, dados.registro_validade,
        dados.especialidade_principal, dados.rqe || null,
        dados.tipo_vinculo || 'CLT', dados.comissao_tipo || null, dados.comissao_valor || null,
      ]
    );
    const profissionalId = insertRows[0].id;

    if (dados.especialidades?.length > 0) {
      for (const esp of dados.especialidades) {
        await client.query(
          `INSERT INTO profissionais_especialidades (profissional_id, especialidade)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [profissionalId, esp]
        );
      }
    }

    if (dados.procedimentos?.length > 0) {
      for (const proc of dados.procedimentos) {
        await client.query(
          `INSERT INTO profissionais_procedimentos (profissional_id, procedimento_id, duracao_minutos)
           VALUES ($1, $2, $3)
           ON CONFLICT (profissional_id, procedimento_id) DO UPDATE SET duracao_minutos = EXCLUDED.duracao_minutos`,
          [profissionalId, proc.procedimento_id, proc.duracao_minutos || 30]
        );
      }
    }

    if (dados.disponibilidade?.length > 0) {
      for (const d of dados.disponibilidade) {
        await client.query(
          `INSERT INTO profissionais_disponibilidade
             (profissional_id, dia_semana, hora_inicio, hora_fim, intervalo_minutos, max_pacientes)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (profissional_id, dia_semana, hora_inicio) DO UPDATE
             SET hora_fim = EXCLUDED.hora_fim, intervalo_minutos = EXCLUDED.intervalo_minutos,
                 max_pacientes = EXCLUDED.max_pacientes`,
          [profissionalId, d.dia_semana, d.hora_inicio, d.hora_fim, d.intervalo_minutos || 15, d.max_pacientes || null]
        );
      }
    }

    await client.query('COMMIT');
    return buscarPorId(tenantSlug, profissionalId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    try { await client.query('SET search_path = public'); } catch (_) {}
    client.release();
  }
}

async function atualizar(tenantSlug, id, dados, fotoUrl = null, assinaturaUrl = null, carimboUrl = null) {
  const schema = schemaFromSlug(tenantSlug);

  const { rows } = await pool.query(`SELECT id FROM "${schema}".profissionais WHERE id = $1`, [id]);
  if (rows.length === 0) throw { status: 404, message: 'Profissional não encontrado' };

  if (dados.cpf) {
    if (!validarCPF(dados.cpf)) throw { status: 400, message: 'CPF inválido' };
    dados.cpf = dados.cpf.replace(/\D/g, '');
  }

  const sets = [];
  const params = [];
  const add = (col, val) => { params.push(val); sets.push(`${col} = $${params.length}`); };

  if (dados.nome)                   add('nome', dados.nome);
  if (dados.titulo)                 add('titulo', dados.titulo);
  if (dados.cpf)                    add('cpf', dados.cpf);
  if (dados.data_nascimento)        add('data_nascimento', dados.data_nascimento);
  if (dados.sexo)                   add('sexo', dados.sexo);
  if (dados.telefone)               add('telefone', dados.telefone);
  if (dados.email)                  add('email', dados.email);
  if (dados.conselho)               add('conselho', dados.conselho);
  if (dados.registro_numero)        add('registro_numero', dados.registro_numero);
  if (dados.registro_uf)            add('registro_uf', dados.registro_uf);
  if (dados.registro_validade)      add('registro_validade', dados.registro_validade);
  if (dados.especialidade_principal) add('especialidade_principal', dados.especialidade_principal);
  if (dados.rqe !== undefined)      add('rqe', dados.rqe);
  if (dados.tipo_vinculo)           add('tipo_vinculo', dados.tipo_vinculo);
  if (dados.comissao_tipo !== undefined) add('comissao_tipo', dados.comissao_tipo);
  if (dados.comissao_valor !== undefined) add('comissao_valor', dados.comissao_valor);
  if (fotoUrl)        add('foto_url', fotoUrl);
  if (assinaturaUrl)  add('assinatura_url', assinaturaUrl);
  if (carimboUrl)     add('carimbo_url', carimboUrl);

  if (sets.length > 0) {
    params.push(id);
    await pool.query(
      `UPDATE "${schema}".profissionais SET ${sets.join(', ')}, atualizado_em = NOW() WHERE id = $${params.length}`,
      params
    );
  }

  return buscarPorId(tenantSlug, id);
}

async function atualizarStatus(tenantSlug, id, status) {
  const schema = schemaFromSlug(tenantSlug);
  const statusValidos = ['ativo', 'inativo', 'licenca'];
  if (!statusValidos.includes(status)) throw { status: 400, message: 'Status inválido' };

  const { rows } = await pool.query(`SELECT id FROM "${schema}".profissionais WHERE id = $1`, [id]);
  if (rows.length === 0) throw { status: 404, message: 'Profissional não encontrado' };

  await pool.query(
    `UPDATE "${schema}".profissionais SET status = $1, atualizado_em = NOW() WHERE id = $2`,
    [status, id]
  );
}

async function atualizarDisponibilidade(tenantSlug, profissionalId, disponibilidade) {
  const schema = schemaFromSlug(tenantSlug);

  const { rows } = await pool.query(`SELECT id FROM "${schema}".profissionais WHERE id = $1`, [profissionalId]);
  if (rows.length === 0) throw { status: 404, message: 'Profissional não encontrado' };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET search_path = "${schema}", public`);

    await client.query(`DELETE FROM profissionais_disponibilidade WHERE profissional_id = $1`, [profissionalId]);

    for (const d of disponibilidade) {
      await client.query(
        `INSERT INTO profissionais_disponibilidade
           (profissional_id, dia_semana, hora_inicio, hora_fim, intervalo_minutos, max_pacientes)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [profissionalId, d.dia_semana, d.hora_inicio, d.hora_fim, d.intervalo_minutos || 15, d.max_pacientes || null]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    try { await client.query('SET search_path = public'); } catch (_) {}
    client.release();
  }
}

async function criarBloqueio(tenantSlug, profissionalId, dados) {
  const schema = schemaFromSlug(tenantSlug);
  const { rows } = await pool.query(`SELECT id FROM "${schema}".profissionais WHERE id = $1`, [profissionalId]);
  if (rows.length === 0) throw { status: 404, message: 'Profissional não encontrado' };

  const { rows: inserted } = await pool.query(
    `INSERT INTO "${schema}".profissionais_bloqueios
       (profissional_id, data_inicio, data_fim, hora_inicio, hora_fim, motivo)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [profissionalId, dados.data_inicio, dados.data_fim, dados.hora_inicio || null, dados.hora_fim || null, dados.motivo || null]
  );
  return inserted[0];
}

async function removerBloqueio(tenantSlug, profissionalId, bloqueioId) {
  const schema = schemaFromSlug(tenantSlug);
  const { rowCount } = await pool.query(
    `DELETE FROM "${schema}".profissionais_bloqueios WHERE id = $1 AND profissional_id = $2`,
    [bloqueioId, profissionalId]
  );
  if (rowCount === 0) throw { status: 404, message: 'Bloqueio não encontrado' };
}

async function calcularProdutividade(tenantSlug, profissionalId, mes, ano) {
  const schema = schemaFromSlug(tenantSlug);

  const { rows: profRows } = await pool.query(`SELECT id FROM "${schema}".profissionais WHERE id = $1`, [profissionalId]);
  if (profRows.length === 0) throw { status: 404, message: 'Profissional não encontrado' };

  const periodo = `${ano}-${String(mes).padStart(2, '0')}`;

  let statsRows;
  try {
    const result = await pool.query(
      `SELECT
         COUNT(*) AS atendimentos_mes,
         SUM(CASE WHEN status = 'faltou' THEN 1 ELSE 0 END) AS total_no_show,
         SUM(CASE WHEN status != 'faltou' AND valor_cobrado IS NOT NULL THEN valor_cobrado ELSE 0 END) AS receita_mes
       FROM "${schema}".agendamentos
       WHERE profissional_id = $1
         AND TO_CHAR(data_hora, 'YYYY-MM') = $2
         AND status IN ('realizado', 'faltou')`,
      [profissionalId, periodo]
    );
    statsRows = result.rows[0];
  } catch (_) {
    // Tabela agendamentos pode não existir ainda
    statsRows = { atendimentos_mes: 0, total_no_show: 0, receita_mes: 0 };
  }

  const atendimentosMes = parseInt(statsRows.atendimentos_mes, 10) || 0;
  const totalNoShow     = parseInt(statsRows.total_no_show, 10) || 0;
  const receitaMes      = parseFloat(statsRows.receita_mes) || 0;
  const ticketMedio     = atendimentosMes > 0 ? Math.round((receitaMes / atendimentosMes) * 100) / 100 : 0;
  const taxaNoShow      = atendimentosMes > 0 ? Math.round((totalNoShow / atendimentosMes) * 1000) / 10 : 0;

  return {
    profissional_id:  profissionalId,
    periodo,
    atendimentos_mes: atendimentosMes,
    taxa_ocupacao:    0, // calculado via slots — omitido para simplificar v1
    taxa_no_show:     taxaNoShow,
    ticket_medio:     ticketMedio,
    receita_mes:      receitaMes,
  };
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  atualizarStatus,
  atualizarDisponibilidade,
  criarBloqueio,
  removerBloqueio,
  calcularProdutividade,
  calcularAlertaValidade,
};
