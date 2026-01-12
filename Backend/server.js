require('dotenv').config(); // Carrega as variáveis do .env

const express = require('express');
const Sequelize = require('sequelize');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET; // Usa a variável do .env

// Verifica se o JWT_SECRET está definido
if (!SECRET_KEY) {
  console.error('Erro: JWT_SECRET não está definido no arquivo .env');
  process.exit(1);
}

const app = express();
const port = 3000;

// Middlewares
app.use(express.json());
app.use(cors());

// Configuração do Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './agendamentos.db',
  logging: false
});

// Definição dos Modelos
const EmpresaMatriz = sequelize.define('empresa_matriz', {
  razaoSocial: { type: Sequelize.STRING, allowNull: false },
  nomeFantasia: { type: Sequelize.STRING, allowNull: false },
  cnpj: { type: Sequelize.STRING, allowNull: false, unique: true },
  cnes: Sequelize.STRING,
  cep: Sequelize.STRING,
  endereco: Sequelize.STRING,
  numero: Sequelize.STRING,
  compl: Sequelize.STRING,
  bairro: Sequelize.STRING,
  cidade: Sequelize.STRING,
  estado: Sequelize.STRING,
  telefone: Sequelize.STRING,
  celular: Sequelize.STRING,
  email: Sequelize.STRING,
  observacoes: Sequelize.STRING,
  fusoHorario: Sequelize.STRING,
  aplicarHorarioVerao: { type: Sequelize.BOOLEAN, defaultValue: false },
  linkCoordenadas: Sequelize.STRING,
  dddAutomatico: Sequelize.STRING,
  site: Sequelize.STRING,
  exibirAgendamentoOnline: { type: Sequelize.BOOLEAN, defaultValue: false },
  licencaId: Sequelize.STRING
});

const EmpresasFiliais = sequelize.define('empresas_filiais', {
  razaoSocial: { type: Sequelize.STRING, allowNull: false },
  nomeFantasia: { type: Sequelize.STRING, allowNull: false },
  cnpj: { type: Sequelize.STRING, allowNull: false, unique: true },
  cep: Sequelize.STRING,
  endereco: Sequelize.STRING,
  numero: Sequelize.STRING,
  compl: Sequelize.STRING,
  bairro: Sequelize.STRING,
  cidade: Sequelize.STRING,
  estado: Sequelize.STRING,
  telefone: Sequelize.STRING,
  celular: Sequelize.STRING,
  email: Sequelize.STRING,
  vinculadaMatriz: { type: Sequelize.BOOLEAN, defaultValue: false }
});

const Profissional = sequelize.define('profissional', {
  nome: { type: Sequelize.STRING, allowNull: false },
  cpf: Sequelize.STRING,
  dataNascimento: Sequelize.STRING,
  sexo: Sequelize.STRING,
  cns: Sequelize.STRING,
  especialidade: Sequelize.STRING,
  rqe: Sequelize.STRING,
  conselho: Sequelize.STRING,
  registro: Sequelize.STRING,
  uf: Sequelize.STRING,
  cep: Sequelize.STRING,
  endereco: Sequelize.STRING,
  numero: Sequelize.STRING,
  complemento: Sequelize.STRING,
  bairro: Sequelize.STRING,
  cidade: Sequelize.STRING,
  estado: Sequelize.STRING,
  pais: Sequelize.STRING,
  unidades: Sequelize.JSON,
  procedimentos: { type: Sequelize.JSON, allowNull: false },
  grade: { type: Sequelize.JSON, allowNull: false },
  email: Sequelize.STRING,
  senha: Sequelize.STRING,
  filialId: { type: Sequelize.INTEGER, references: { model: EmpresasFiliais, key: 'id' }, allowNull: true },
  ativo: { type: Sequelize.BOOLEAN, defaultValue: true }
});

const Agendamento = sequelize.define('agendamento', {
  cliente: { type: Sequelize.STRING, allowNull: false },
  profissionalId: { type: Sequelize.INTEGER, references: { model: Profissional, key: 'id' }, allowNull: false },
  procedimento: { type: Sequelize.STRING, allowNull: false },
  data: { type: Sequelize.STRING, allowNull: false },
  horario: { type: Sequelize.STRING, allowNull: false }
});

const LocalAtendimento = sequelize.define('local_atendimento', {
  tipo: Sequelize.STRING,
  nome: Sequelize.STRING,
  filialId: { type: Sequelize.INTEGER, references: { model: EmpresasFiliais, key: 'id' }, allowNull: true }
});

const Procedimento = sequelize.define('procedimento', {
  nome: Sequelize.STRING,
  duracao: Sequelize.STRING,
  preco: Sequelize.STRING,
  filialId: { type: Sequelize.INTEGER, references: { model: EmpresasFiliais, key: 'id' }, allowNull: true }
});

const FormaRecebimento = sequelize.define('forma_recebimento', {
  tipo: Sequelize.STRING,
  filialId: { type: Sequelize.INTEGER, references: { model: EmpresasFiliais, key: 'id' }, allowNull: true }
});

const Contrato = sequelize.define('contrato', {
  cliente: Sequelize.STRING,
  servico: Sequelize.STRING,
  valor: Sequelize.STRING,
  filialId: { type: Sequelize.INTEGER, references: { model: EmpresasFiliais, key: 'id' }, allowNull: true },
  detalhes: Sequelize.STRING
});

const Usuario = sequelize.define('usuario', {
  nome: Sequelize.STRING,
  email: Sequelize.STRING,
  ultimoAcesso: Sequelize.STRING
});

// Sincronizar modelos com o banco
sequelize.sync({ force: false })
  .then(() => console.log('Tabelas sincronizadas com sucesso'))
  .catch(err => console.error('Erro ao sincronizar tabelas:', err));

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ erro: 'Token de autenticação ausente' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ erro: 'Token inválido' });
    req.user = user;
    next();
  });
};

// Rota de login
app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  Profissional.findOne({ where: { email } })
    .then(async (profissional) => {
      if (!profissional) return res.status(400).json({ erro: 'Usuário não encontrado' });

      const match = await bcrypt.compare(senha, profissional.senha);
      if (!match) return res.status(400).json({ erro: 'Senha incorreta' });

      const token = jwt.sign({ id: profissional.id, email: profissional.email }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ token });
    })
    .catch(err => res.status(500).json({ erro: 'Erro no servidor', mensagem: err.message }));
});

// Rota para Empresa Matriz
app.get('/empresa-matriz', authenticateToken, (req, res) => {
  EmpresaMatriz.findOne({ where: { id: 1 } })
    .then(matriz => res.json(matriz || {}))
    .catch(err => res.status(500).json({ erro: 'Erro ao buscar empresa matriz', mensagem: err.message }));
});

app.post('/empresa-matriz', authenticateToken, (req, res) => {
  const {
    razaoSocial, nomeFantasia, cnpj, cnes, cep, endereco, numero, compl, bairro, cidade, estado,
    telefone, celular, email, observacoes, fusoHorario, aplicarHorarioVerao, linkCoordenadas,
    dddAutomatico, site, exibirAgendamentoOnline, licencaId
  } = req.body;

  if (!razaoSocial || !nomeFantasia || !cnpj) {
    return res.status(400).json({ erro: 'Razão Social, Nome Fantasia e CNPJ são obrigatórios.' });
  }

  EmpresaMatriz.findOne({ where: { cnpj } })
    .then(existing => {
      if (existing) return res.status(400).json({ erro: 'CNPJ já cadastrado.' });

      EmpresaMatriz.findOrCreate({
        where: { id: 1 },
        defaults: {
          razaoSocial, nomeFantasia, cnpj, cnes, cep, endereco, numero, compl, bairro, cidade, estado,
          telefone, celular, email, observacoes, fusoHorario, aplicarHorarioVerao, linkCoordenadas,
          dddAutomatico, site, exibirAgendamentoOnline, licencaId
        }
      })
      .then(([matriz, created]) => {
        if (!created) {
          return matriz.update({
            razaoSocial, nomeFantasia, cnpj, cnes, cep, endereco, numero, compl, bairro, cidade, estado,
            telefone, celular, email, observacoes, fusoHorario, aplicarHorarioVerao, linkCoordenadas,
            dddAutomatico, site, exibirAgendamentoOnline, licencaId
          });
        }
        return matriz;
      })
      .then(matriz => res.status(201).json({ mensagem: 'Dados da matriz salvos com sucesso!', data: matriz }))
      .catch(err => res.status(500).json({ erro: 'Erro ao salvar empresa matriz', mensagem: err.message }));
    })
    .catch(err => res.status(500).json({ erro: 'Erro ao verificar CNPJ', mensagem: err.message }));
});

// Rota para Empresas Filiais
app.get('/empresas-filiais', authenticateToken, (req, res) => {
  EmpresasFiliais.findAll()
    .then(filiais => res.json(filiais))
    .catch(err => res.status(500).json({ erro: 'Erro ao listar filiais', mensagem: err.message }));
});

app.post('/empresas-filiais', authenticateToken, (req, res) => {
  const {
    razaoSocial, nomeFantasia, cnpj, cep, endereco, numero, compl, bairro, cidade, estado,
    telefone, celular, email, vinculadaMatriz
  } = req.body;

  if (!razaoSocial || !nomeFantasia || !cnpj) {
    return res.status(400).json({ erro: 'Razão Social, Nome Fantasia e CNPJ são obrigatórios.' });
  }

  EmpresasFiliais.findOne({ where: { cnpj } })
    .then(existing => {
      if (existing) return res.status(400).json({ erro: 'CNPJ já cadastrado.' });

      EmpresasFiliais.create({
        razaoSocial, nomeFantasia, cnpj, cep, endereco, numero, compl, bairro, cidade, estado,
        telefone, celular, email, vinculadaMatriz
      })
      .then(filial => res.status(201).json({ mensagem: 'Filial salva com sucesso!', data: filial }))
      .catch(err => res.status(500).json({ erro: 'Erro ao salvar filial', mensagem: err.message }));
    })
    .catch(err => res.status(500).json({ erro: 'Erro ao verificar CNPJ', mensagem: err.message }));
});

// Rota para Profissionais
app.get('/profissionais', authenticateToken, (req, res) => {
  Profissional.findAll()
    .then(profissionais => res.json(profissionais))
    .catch(err => res.status(500).json({ erro: 'Erro ao listar profissionais', mensagem: err.message }));
});

app.post('/cadastro', async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });
  }
  try {
    const saltRounds = 10;
    const senhaCriptografada = await bcrypt.hash(senha, saltRounds);
    const novoProfissional = await Profissional.create({
      nome,
      email,
      senha: senhaCriptografada,
      procedimentos: JSON.stringify([]),
      grade: JSON.stringify([]),
      ativo: true,
    });
    res.status(201).json({ mensagem: 'Cadastro realizado com sucesso!', data: novoProfissional });
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao cadastrar', mensagem: error.message });
  }
});

app.post('/esqueci-senha', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ erro: 'Email é obrigatório.' });
  }
  try {
    const profissional = await Profissional.findOne({ where: { email } });
    if (!profissional) {
      return res.status(404).json({ erro: 'Email não encontrado.' });
    }
    // Lógica para enviar email (a implementar)
    res.json({ mensagem: 'Instruções enviadas para o email.' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao processar solicitação', mensagem: error.message });
  }
});

// Rota para cadastrar profissional com autenticação 
app.post('/profissionais', authenticateToken, async (req, res) => {
  const {
    nome, cpf, dataNascimento, sexo, cns, especialidade, rqe, conselho, registro,
    uf, cep, endereco, numero, complemento, bairro, cidade, estado, pais, unidades,
    procedimentos, grade, email, senha, filialId, ativo
  } = req.body;

  if (!nome || !procedimentos || !grade) {
    return res.status(400).json({ erro: 'Nome, procedimentos e grade são obrigatórios.' });
  }

  let senhaCriptografada = null;
  if (senha) {
    const saltRounds = 10;
    senhaCriptografada = await bcrypt.hash(senha, saltRounds);
  }

  Profissional.create({
    nome, cpf, dataNascimento, sexo, cns, especialidade, rqe, conselho, registro,
    uf, cep, endereco, numero, complemento, bairro, cidade, estado, pais, unidades: JSON.stringify(unidades),
    procedimentos: JSON.stringify(procedimentos), grade: JSON.stringify(grade), email, senha: senhaCriptografada,
    filialId, ativo
  })
  .then(profissional => res.status(201).json({ mensagem: `Profissional ${nome} cadastrado com sucesso!`, data: profissional }))
  .catch(err => res.status(500).json({ erro: 'Erro ao cadastrar profissional', mensagem: err.message }));
});

// Rota para atualizar profissional
app.put('/profissionais/:id', async (req, res) => {
  const { id } = req.params;
  const {
    nome, cpf, dataNascimento, sexo, cns, especialidade, rqe, conselho, registro,
    uf, cep, endereco, numero, complemento, bairro, cidade, estado, pais, unidades,
    procedimentos, grade, email, senha, filialId, ativo
  } = req.body;

  try {
    const unidadesArray = typeof unidades === 'string' ? JSON.parse(unidades) : unidades;
    const procedimentosArray = typeof procedimentos === 'string' ? JSON.parse(procedimentos) : procedimentos;
    const gradeArray = typeof grade === 'string' ? JSON.parse(grade) : grade;

    if (!nome || !procedimentosArray || !Array.isArray(procedimentosArray) || !gradeArray || !Array.isArray(gradeArray)) {
      return res.status(400).json({ erro: 'Dados inválidos' });
    }

    // Criptografar a senha, se fornecida
    let senhaCriptografada = null;
    if (senha) {
      const saltRounds = 10;
      senhaCriptografada = await bcrypt.hash(senha, saltRounds);
    }

    const stmt = db.prepare(`
      UPDATE profissionais SET
        nome = ?, cpf = ?, dataNascimento = ?, sexo = ?, cns = ?, especialidade = ?, rqe = ?, conselho = ?,
        registro = ?, uf = ?, cep = ?, endereco = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?,
        estado = ?, pais = ?, unidades = ?, procedimentos = ?, grade = ?, email = ?, senha = ?, filialId = ?, ativo = ?
      WHERE id = ?
    `);
    stmt.run(
      nome, cpf, dataNascimento, sexo, cns, especialidade, rqe, conselho, registro,
      uf, cep, endereco, numero, complemento, bairro, cidade, estado, pais, JSON.stringify(unidadesArray),
      JSON.stringify(procedimentosArray), JSON.stringify(gradeArray), email, senhaCriptografada, filialId, ativo ? 1 : 0, id,
      (err) => {
        if (err) {
          res.status(500).json({ erro: 'Erro ao atualizar profissional' });
          console.error(err.message);
          return;
        }
        res.json({ mensagem: `Profissional ${nome} atualizado com sucesso!` });
      }
    );
    stmt.finalize();
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao processar dados' });
    console.error('Erro:', error.message);
  }
});

// Rota para excluir profissional
app.delete('/profissionais/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM profissionais WHERE id = ?', id, (err) => {
    if (err) {
      res.status(500).json({ erro: 'Erro ao excluir profissional' });
      console.error(err.message);
      return;
    }
    res.json({ mensagem: 'Profissional excluído com sucesso!' });
  });
});

// Rota para cadastrar agendamento
app.post('/agendamentos', (req, res) => {
  const { cliente, profissionalId, procedimento, data, horario } = req.body;
  console.log('Dados recebidos no POST /agendamentos:', req.body);

  if (!cliente || !profissionalId || !procedimento || !data || !horario) {
    return res.status(400).json({ erro: 'Dados inválidos' });
  }

  const stmt = db.prepare('INSERT INTO agendamentos (cliente, profissionalId, procedimento, data, horario) VALUES (?, ?, ?, ?, ?)');
  stmt.run(cliente, profissionalId, procedimento, data, horario, function(err) {
    if (err) {
      res.status(500).json({ erro: 'Erro ao cadastrar agendamento' });
      console.error(err.message);
      return;
    }
    res.json({ mensagem: `Agendamento para ${cliente} cadastrado com sucesso!`, id: this.lastID });
  });
  stmt.finalize();
});

// Rota para listar agendamentos
app.get('/agendamentos', (req, res) => {
  db.all('SELECT * FROM agendamentos', [], (err, rows) => {
    if (err) {
      res.status(500).json({ erro: 'Erro ao listar agendamentos' });
      console.error(err.message);
      return;
    }
    res.json(rows);
  });
});

// Rota para excluir agendamento
app.delete('/agendamentos/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM agendamentos WHERE id = ?', id, (err) => {
    if (err) {
      res.status(500).json({ erro: 'Erro ao excluir agendamento' });
      console.error(err.message);
      return;
    }
    res.json({ mensagem: 'Agendamento excluído com sucesso!' });
  });
});

// Rota para buscar procedimentos do profissional por ID
app.get('/profissional-procedimentos/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT procedimentos FROM profissionais WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ erro: 'Erro ao buscar procedimentos' });
      console.error(err.message);
      return;
    }
    if (!row) {
      res.status(404).json({ erro: 'Profissional não encontrado' });
      return;
    }
    try {
      const procedimentos = typeof row.procedimentos === 'string' ? JSON.parse(row.procedimentos) : row.procedimentos;
      res.json(procedimentos);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao parsear procedimentos' });
      console.error('Erro ao parsear JSON:', error.message);
    }
  });
});

// Função para gerar horários com base no intervalo
function gerarHorarios(inicio, fim, intervaloMinutos) {
  const horarios = [];
  const inicioMinutos = parseInt(inicio.split(':')[0]) * 60 + parseInt(inicio.split(':')[1]);
  const fimMinutos = parseInt(fim.split(':')[0]) * 60 + parseInt(fim.split(':')[1]);

  for (let minutos = inicioMinutos; minutos < fimMinutos; minutos += parseInt(intervaloMinutos)) {
    const hora = Math.floor(minutos / 60);
    const min = minutos % 60;
    horarios.push(`${hora.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
  }
  return horarios;
}

// Rotas para horários e datas disponíveis (ajustadas para Sequelize)
app.get('/horarios-disponiveis', authenticateToken, (req, res) => {
  const { data, 'profissional-id': profissionalId, intervalo_entre_horarios } = req.query;

  if (!data || !profissionalId) {
    return res.status(400).json({ erro: 'Parâmetros inválidos' });
  }

  const intervalo = intervalo_entre_horarios || '30';

  const dateObj = new Date(data);
  if (isNaN(dateObj.getTime())) {
    return res.status(400).json({ erro: 'Formato de data inválido' });
  }

  Profissional.findByPk(profissionalId)
    .then(profissional => {
      if (!profissional) return res.status(404).json({ erro: 'Profissional não encontrado' });

      const grade = JSON.parse(profissional.grade);
      const diaSelecionado = dateObj.toLocaleString('pt-BR', { weekday: 'long' }).toLowerCase();
      const gradeDia = grade.find(g => g.dia_semana === diaSelecionado);

      if (!gradeDia || !gradeDia.disponivel) {
        return res.json([]);
      }

      let horarios = gerarHorarios(gradeDia.horario_inicio, gradeDia.horario_fim, intervalo);

      if (gradeDia.pausas && gradeDia.pausas.length > 0) {
        const pausas = gradeDia.pausas.map(i => ({
          inicio: parseInt(i.inicio.split(':')[0]) * 60 + parseInt(i.inicio.split(':')[1]),
          fim: parseInt(i.fim.split(':')[0]) * 60 + parseInt(i.fim.split(':')[1]),
        }));
        horarios = horarios.filter(horario => {
          const horarioMinutos = parseInt(horario.split(':')[0]) * 60 + parseInt(horario.split(':')[1]);
          return !pausas.some(inter => horarioMinutos >= inter.inicio && horarioMinutos < inter.fim);
        });
      }

      Agendamento.findAll({ where: { profissionalId, data } })
        .then(agendamentos => {
          const horariosOcupados = agendamentos.map(a => a.horario);
          const horariosDisponiveis = horarios.filter(h => !horariosOcupados.includes(h));
          res.json(horariosDisponiveis);
        })
        .catch(err => res.status(500).json({ erro: 'Erro ao buscar agendamentos', mensagem: err.message }));
    })
    .catch(err => res.status(500).json({ erro: 'Erro ao buscar profissional', mensagem: err.message }));
});

app.get('/datas-disponiveis', authenticateToken, (req, res) => {
  const profissionalId = req.query['profissional-id'];
  const intervalo = req.query['intervalo_entre_horarios'] || '30';

  if (!profissionalId) {
    return res.status(400).json({ erro: 'Parâmetro profissional-id é obrigatório' });
  }

  Profissional.findByPk(profissionalId)
    .then(profissional => {
      if (!profissional) return res.status(404).json({ erro: 'Profissional não encontrado' });

      const grade = JSON.parse(profissional.grade);
      const diasDisponiveis = grade.filter(g => g.disponivel).map(g => g.dia_semana);

      const datasDisponiveis = [];
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      for (let i = 0; i < 30; i++) {
        const data = new Date(hoje);
        data.setDate(hoje.getDate() + i);
        const diaSemana = data.toLocaleString('pt-BR', { weekday: 'long' }).toLowerCase();

        if (diasDisponiveis.includes(diaSemana)) {
          const dataFormatada = data.toISOString().split('T')[0];

          Agendamento.findAll({ where: { profissionalId, data: dataFormatada } })
            .then(agendamentos => {
              const gradeDia = grade.find(g => g.dia_semana === diaSemana);
              let horarios = gerarHorarios(gradeDia.horario_inicio, gradeDia.horario_fim, intervalo);

              if (gradeDia.pausas && gradeDia.pausas.length > 0) {
                const pausas = gradeDia.pausas.map(i => ({
                  inicio: parseInt(i.inicio.split(':')[0]) * 60 + parseInt(i.inicio.split(':')[1]),
                  fim: parseInt(i.fim.split(':')[0]) * 60 + parseInt(i.fim.split(':')[1]),
                }));
                horarios = horarios.filter(horario => {
                  const horarioMinutos = parseInt(horario.split(':')[0]) * 60 + parseInt(horario.split(':')[1]);
                  return !pausas.some(inter => horarioMinutos >= inter.inicio && horarioMinutos < inter.fim);
                });
              }

              const horariosOcupados = agendamentos.map(a => a.horario);
              const horariosDisponiveis = horarios.filter(h => !horariosOcupados.includes(h));

              if (horariosDisponiveis.length > 0) {
                datasDisponiveis.push(dataFormatada);
              }

              if (i === 29) {
                res.json(datasDisponiveis.sort());
              }
            })
            .catch(err => res.status(500).json({ erro: 'Erro ao buscar agendamentos', mensagem: err.message }));
        } else if (i === 29) {
          res.json(datasDisponiveis.sort());
        }
      }
    })
    .catch(err => res.status(500).json({ erro: 'Erro ao buscar profissional', mensagem: err.message }));
});

// Rotas para Locais de Atendimento
app.get('/locais-atendimento', authenticateToken, (req, res) => {
  LocalAtendimento.findAll()
    .then(locais => res.json(locais))
    .catch(err => res.status(500).json({ erro: 'Erro ao listar locais de atendimento', mensagem: err.message }));
});

app.post('/locais-atendimento', authenticateToken, (req, res) => {
  const { tipo, nome, filialId } = req.body;
  LocalAtendimento.create({ tipo, nome, filialId })
    .then(local => res.status(201).json({ mensagem: 'Local de atendimento cadastrado com sucesso!', data: local }))
    .catch(err => res.status(500).json({ erro: 'Erro ao cadastrar local de atendimento', mensagem: err.message }));
});

// Rotas para Procedimentos
app.get('/procedimentos', (req, res) => {
  db.all('SELECT * FROM procedimentos', [], (err, rows) => {
    if (err) {
      res.status(500).json({ erro: 'Erro ao listar procedimentos' });
      console.error(err.message);
      return;
    }
    res.json(rows);
  });
});

app.post('/procedimentos', (req, res) => {
  const { nome, duracao, preco, filialId } = req.body;
  const stmt = db.prepare('INSERT INTO procedimentos (nome, duracao, preco, filialId) VALUES (?, ?, ?, ?)');
  stmt.run(nome, duracao, preco, filialId, function(err) {
    if (err) {
      res.status(500).json({ erro: 'Erro ao cadastrar procedimento' });
      console.error(err.message);
      return;
    }
    res.status(201).json({ mensagem: 'Procedimento cadastrado com sucesso!', id: this.lastID });
  });
  stmt.finalize();
});

// Rotas para Formas de Recebimento
app.get('/formas-recebimento', (req, res) => {
  db.all('SELECT * FROM formas_recebimento', [], (err, rows) => {
    if (err) {
      res.status(500).json({ erro: 'Erro ao listar formas de recebimento' });
      console.error(err.message);
      return;
    }
    res.json(rows);
  });
});

app.post('/formas-recebimento', (req, res) => {
  const { tipo, filialId } = req.body;
  const stmt = db.prepare('INSERT INTO formas_recebimento (tipo, filialId) VALUES (?, ?)');
  stmt.run(tipo, filialId, function(err) {
    if (err) {
      res.status(500).json({ erro: 'Erro ao cadastrar forma de recebimento' });
      console.error(err.message);
      return;
    }
    res.status(201).json({ mensagem: 'Forma de recebimento cadastrada com sucesso!', id: this.lastID });
  });
  stmt.finalize();
});

// Rotas para Contratos/Propostas
app.get('/contratos', (req, res) => {
  db.all('SELECT * FROM contratos', [], (err, rows) => {
    if (err) {
      res.status(500).json({ erro: 'Erro ao listar contratos' });
      console.error(err.message);
      return;
    }
    res.json(rows);
  });
});

app.post('/contratos', (req, res) => {
  const { cliente, servico, valor, filialId, detalhes } = req.body;
  const stmt = db.prepare('INSERT INTO contratos (cliente, servico, valor, filialId, detalhes) VALUES (?, ?, ?, ?, ?)');
  stmt.run(cliente, servico, valor, filialId, detalhes, function(err) {
    if (err) {
      res.status(500).json({ erro: 'Erro ao cadastrar contrato' });
      console.error(err.message);
      return;
    }
    res.status(201).json({ mensagem: 'Contrato cadastrado com sucesso!', id: this.lastID });
  });
  stmt.finalize();
});

// Rotas para Usuário
app.get('/usuario', (req, res) => {
  db.get('SELECT * FROM usuario WHERE id = 1', [], (err, row) => {
    if (err) {
      res.status(500).json({ erro: 'Erro ao buscar usuário' });
      console.error(err.message);
      return;
    }
    res.json(row || {});
  });
});

app.post('/usuario', (req, res) => {
  const { nome, email, ultimoAcesso } = req.body;
  const stmt = db.prepare('INSERT OR REPLACE INTO usuario (id, nome, email, ultimoAcesso) VALUES (1, ?, ?, ?)');
  stmt.run(nome, email, ultimoAcesso, function(err) {
    if (err) {
      res.status(500).json({ erro: 'Erro ao salvar usuário' });
      console.error(err.message);
      return;
    }
    res.status(201).json({ mensagem: 'Usuário salvo com sucesso!', id: this.lastID });
  });
  stmt.finalize();
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});