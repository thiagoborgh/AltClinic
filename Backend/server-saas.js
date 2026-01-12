require('dotenv').config();

const express = require('express');
const Sequelize = require('sequelize');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'seu-secret-key-aqui';

const app = express();
const port = 3000;

// Middlewares
app.use(express.json());
app.use(cors());

// Configuração do Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './clinica-saas.db',
  logging: false
});

// ============================================
// MODELOS SIMPLIFICADOS PARA SAAS
// ============================================

// Tenant = Clínica (cada clínica é um tenant)
const Tenant = sequelize.define('tenant', {
  nome: { type: Sequelize.STRING, allowNull: false },
  email: { type: Sequelize.STRING, allowNull: false, unique: true },
  telefone: Sequelize.STRING,
  plano: { type: Sequelize.STRING, defaultValue: 'starter' }, // starter = R$ 19,90
  status: { type: Sequelize.STRING, defaultValue: 'pending_payment' }, // pending_payment, active, suspended, canceled
  dataExpiracao: { type: Sequelize.DATE }, // Data de renovação mensal
  maxUsuarios: { type: Sequelize.INTEGER, defaultValue: 3 },
  whatsappMethod: { type: Sequelize.STRING, defaultValue: 'manual' }, // manual (wa.me) ou evolution (api)
  evolutionApiUrl: Sequelize.STRING,
  evolutionApiKey: Sequelize.STRING,
  ativo: { type: Sequelize.BOOLEAN, defaultValue: true }
});

// Usuário (pertence a um tenant)
const Usuario = sequelize.define('usuario', {
  nome: { type: Sequelize.STRING, allowNull: false },
  email: { type: Sequelize.STRING, allowNull: false, unique: true },
  senha: { type: Sequelize.STRING, allowNull: false },
  papel: { type: Sequelize.STRING, defaultValue: 'profissional' }, // admin, profissional
  telefone: Sequelize.STRING,
  tenantId: { 
    type: Sequelize.INTEGER, 
    references: { model: 'tenants', key: 'id' },
    allowNull: false 
  },
  especialidade: Sequelize.STRING,
  procedimentos: Sequelize.JSON, // JSON array
  grade: Sequelize.JSON, // JSON array de disponibilidade
  ativo: { type: Sequelize.BOOLEAN, defaultValue: true }
});

// Agendamento (pertence a um tenant)
const Agendamento = sequelize.define('agendamento', {
  clienteNome: { type: Sequelize.STRING, allowNull: false },
  clienteTelefone: { type: Sequelize.STRING, allowNull: false },
  clienteEmail: Sequelize.STRING,
  profissionalId: { 
    type: Sequelize.INTEGER, 
    references: { model: 'usuarios', key: 'id' },
    allowNull: false 
  },
  procedimento: { type: Sequelize.STRING, allowNull: false },
  data: { type: Sequelize.STRING, allowNull: false }, // YYYY-MM-DD
  horario: { type: Sequelize.STRING, allowNull: false }, // HH:MM
  status: { type: Sequelize.STRING, defaultValue: 'confirmado' }, // confirmado, cancelado, concluido
  observacoes: Sequelize.TEXT,
  whatsappEnviado: { type: Sequelize.BOOLEAN, defaultValue: false },
  tenantId: { 
    type: Sequelize.INTEGER, 
    references: { model: 'tenants', key: 'id' },
    allowNull: false 
  }
});

// Procedimento (pertence a um tenant)
const Procedimento = sequelize.define('procedimento', {
  nome: { type: Sequelize.STRING, allowNull: false },
  duracao: Sequelize.INTEGER, // minutos
  valor: Sequelize.DECIMAL(10, 2),
  descricao: Sequelize.TEXT,
  tenantId: { 
    type: Sequelize.INTEGER, 
    references: { model: 'tenants', key: 'id' },
    allowNull: false 
  }
});

// Relacionamentos
Tenant.hasMany(Usuario, { foreignKey: 'tenantId' });
Usuario.belongsTo(Tenant, { foreignKey: 'tenantId' });

Tenant.hasMany(Agendamento, { foreignKey: 'tenantId' });
Agendamento.belongsTo(Tenant, { foreignKey: 'tenantId' });

Usuario.hasMany(Agendamento, { foreignKey: 'profissionalId' });
Agendamento.belongsTo(Usuario, { foreignKey: 'profissionalId' });

Tenant.hasMany(Procedimento, { foreignKey: 'tenantId' });
Procedimento.belongsTo(Tenant, { foreignKey: 'tenantId' });

// Sincronizar banco
sequelize.sync({ force: false })
  .then(() => console.log('✅ Banco de dados SaaS sincronizado'))
  .catch(err => console.error('❌ Erro ao sincronizar:', err));

// ============================================
// MIDDLEWARES
// ============================================

// Autenticação JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ erro: 'Token ausente' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ erro: 'Token inválido' });
    req.user = user;
    next();
  });
};

// Verificar limites do tenant
const checkTenantLimits = async (req, res, next) => {
  try {
    const tenant = await Tenant.findByPk(req.user.tenantId);
    
    if (!tenant || !tenant.ativo) {
      return res.status(403).json({ erro: 'Tenant inativo ou não encontrado' });
    }

    if (tenant.status === 'suspended' || tenant.status === 'canceled') {
      return res.status(403).json({ erro: 'Assinatura suspensa ou cancelada' });
    }

    // Verificar status de pagamento
    if (tenant.status === 'pending_payment') {
      return res.status(402).json({ erro: 'Pagamento pendente. Configure o pagamento para ativar sua conta.' });
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao verificar tenant' });
  }
};

// ============================================
// ROTAS PÚBLICAS
// ============================================

// Cadastro de novo tenant (clínica)
app.post('/cadastro', async (req, res) => {
  const { nomeClinica, nomeUsuario, email, telefone, senha } = req.body;

  if (!nomeClinica || !nomeUsuario || !email || !senha) {
    return res.status(400).json({ erro: 'Todos os campos obrigatórios devem ser preenchidos' });
  }

  try {
    // Verificar se email já existe
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }

    // Criar tenant - verificar se é conta ADMIN especial
    let status = 'pending_payment';
    let plano = 'starter';
    let dataExpiracao = new Date();
    dataExpiracao.setMonth(dataExpiracao.getMonth() + 1); // Primeira cobrança em 30 dias
    
    // CONTA ADMIN GRATUITA
    const emailsAdmin = ['admin@altclinic.com.br', 'teste@altclinic.com.br', 'demo@altclinic.com.br'];
    if (emailsAdmin.includes(email.toLowerCase())) {
      status = 'active';
      plano = 'enterprise'; // Plano especial com tudo liberado
      dataExpiracao = new Date('2099-12-31'); // Nunca expira
    }

    const tenant = await Tenant.create({
      nome: nomeClinica,
      email,
      telefone,
      plano,
      status,
      dataExpiracao,
      maxUsuarios: emailsAdmin.includes(email.toLowerCase()) ? 999 : 3
    });

    // Criar usuário admin
    const senhaCriptografada = await bcrypt.hash(senha, 10);
    const usuario = await Usuario.create({
      nome: nomeUsuario,
      email,
      senha: senhaCriptografada,
      papel: 'admin',
      telefone,
      tenantId: tenant.id,
      procedimentos: [],
      grade: []
    });

    // Gerar token
    const token = jwt.sign({ 
      id: usuario.id, 
      email: usuario.email, 
      tenantId: tenant.id,
      papel: usuario.papel
    }, SECRET_KEY, { expiresIn: '7d' });

    const mensagemCadastro = emailsAdmin.includes(email.toLowerCase()) 
      ? '🎉 Conta ADMIN criada com sucesso! Acesso GRATUITO e ILIMITADO.'
      : 'Cadastro realizado! Configure o pagamento para ativar sua conta.';

    res.status(201).json({ 
      mensagem: mensagemCadastro,
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel
      },
      tenant: {
        id: tenant.id,
        nome: tenant.nome,
        status: tenant.status,
        plano: 'R$ 19,90/mês'
      }
    });
  } catch (error) {
    console.error('Erro no cadastro:', error);
    res.status(500).json({ erro: 'Erro ao realizar cadastro' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
  }

  try {
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    // Verificar tenant
    const tenant = await Tenant.findByPk(usuario.tenantId);
    if (!tenant || !tenant.ativo) {
      return res.status(403).json({ erro: 'Conta inativa' });
    }

    const token = jwt.sign({ 
      id: usuario.id, 
      email: usuario.email, 
      tenantId: usuario.tenantId,
      papel: usuario.papel
    }, SECRET_KEY, { expiresIn: '7d' });

    res.json({ 
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel
      },
      tenant: {
        id: tenant.id,
        nome: tenant.nome,
        status: tenant.status
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

// ============================================
// ROTAS PROTEGIDAS - TENANT
// ============================================

// Obter informações do tenant
app.get('/tenant', authenticateToken, async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.user.tenantId);
    
    if (!tenant) {
      return res.status(404).json({ erro: 'Tenant não encontrado' });
    }

    // Calcular dias restantes
    const hoje = new Date();
    const expiracao = new Date(tenant.dataExpiracao);
    const diasRestantes = Math.ceil((expiracao - hoje) / (1000 * 60 * 60 * 24));

    // Contar usuários
    const totalUsuarios = await Usuario.count({ where: { tenantId: tenant.id } });

    res.json({
      ...tenant.toJSON(),
      diasRestantes: diasRestantes > 0 ? diasRestantes : 0,
      totalUsuarios,
      limiteUsuarios: tenant.maxUsuarios,
      podeCriarUsuario: totalUsuarios < tenant.maxUsuarios
    });
  } catch (error) {
    console.error('Erro ao buscar tenant:', error);
    res.status(500).json({ erro: 'Erro ao buscar informações' });
  }
});

// Atualizar configurações do tenant
app.put('/tenant', authenticateToken, async (req, res) => {
  const { nome, telefone, whatsappMethod, evolutionApiUrl, evolutionApiKey } = req.body;

  try {
    const tenant = await Tenant.findByPk(req.user.tenantId);
    
    if (!tenant) {
      return res.status(404).json({ erro: 'Tenant não encontrado' });
    }

    await tenant.update({
      nome: nome || tenant.nome,
      telefone: telefone || tenant.telefone,
      whatsappMethod: whatsappMethod || tenant.whatsappMethod,
      evolutionApiUrl: evolutionApiUrl || tenant.evolutionApiUrl,
      evolutionApiKey: evolutionApiKey || tenant.evolutionApiKey
    });

    res.json({ mensagem: 'Configurações atualizadas', tenant });
  } catch (error) {
    console.error('Erro ao atualizar tenant:', error);
    res.status(500).json({ erro: 'Erro ao atualizar configurações' });
  }
});

// ============================================
// ROTAS PROTEGIDAS - USUÁRIOS
// ============================================

// Listar usuários do tenant
app.get('/usuarios', authenticateToken, checkTenantLimits, async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      where: { tenantId: req.user.tenantId },
      attributes: { exclude: ['senha'] }
    });
    res.json(usuarios);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ erro: 'Erro ao listar usuários' });
  }
});

// Criar novo usuário (verifica limite de 3)
app.post('/usuarios', authenticateToken, checkTenantLimits, async (req, res) => {
  const { nome, email, senha, papel, telefone, especialidade, procedimentos, grade } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
  }

  try {
    // Verificar limite de usuários
    const totalUsuarios = await Usuario.count({ where: { tenantId: req.user.tenantId } });
    if (totalUsuarios >= req.tenant.maxUsuarios) {
      return res.status(403).json({ 
        erro: `Limite de ${req.tenant.maxUsuarios} usuários atingido. Faça upgrade do plano.` 
      });
    }

    // Verificar se email já existe
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);
    const novoUsuario = await Usuario.create({
      nome,
      email,
      senha: senhaCriptografada,
      papel: papel || 'profissional',
      telefone,
      especialidade,
      procedimentos: procedimentos || [],
      grade: grade || [],
      tenantId: req.user.tenantId
    });

    const { senha: _, ...usuarioSemSenha } = novoUsuario.toJSON();
    res.status(201).json({ 
      mensagem: 'Usuário criado com sucesso',
      usuario: usuarioSemSenha
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ erro: 'Erro ao criar usuário' });
  }
});

// Atualizar usuário
app.put('/usuarios/:id', authenticateToken, checkTenantLimits, async (req, res) => {
  const { id } = req.params;
  const { nome, email, telefone, especialidade, procedimentos, grade, ativo } = req.body;

  try {
    const usuario = await Usuario.findOne({
      where: { id, tenantId: req.user.tenantId }
    });

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    await usuario.update({
      nome: nome || usuario.nome,
      email: email || usuario.email,
      telefone: telefone || usuario.telefone,
      especialidade: especialidade || usuario.especialidade,
      procedimentos: procedimentos || usuario.procedimentos,
      grade: grade || usuario.grade,
      ativo: ativo !== undefined ? ativo : usuario.ativo
    });

    const { senha: _, ...usuarioSemSenha } = usuario.toJSON();
    res.json({ 
      mensagem: 'Usuário atualizado',
      usuario: usuarioSemSenha
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ erro: 'Erro ao atualizar usuário' });
  }
});

// ============================================
// ROTAS PROTEGIDAS - AGENDAMENTOS
// ============================================

// Listar agendamentos
app.get('/agendamentos', authenticateToken, checkTenantLimits, async (req, res) => {
  const { data, profissionalId } = req.query;
  
  try {
    const where = { tenantId: req.user.tenantId };
    if (data) where.data = data;
    if (profissionalId) where.profissionalId = profissionalId;

    const agendamentos = await Agendamento.findAll({
      where,
      include: [{
        model: Usuario,
        attributes: ['id', 'nome', 'especialidade']
      }],
      order: [['data', 'ASC'], ['horario', 'ASC']]
    });

    res.json(agendamentos);
  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);
    res.status(500).json({ erro: 'Erro ao listar agendamentos' });
  }
});

// Criar agendamento
app.post('/agendamentos', authenticateToken, checkTenantLimits, async (req, res) => {
  const { clienteNome, clienteTelefone, clienteEmail, profissionalId, procedimento, data, horario, observacoes } = req.body;

  if (!clienteNome || !clienteTelefone || !profissionalId || !procedimento || !data || !horario) {
    return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
  }

  try {
    // Verificar se horário está disponível
    const agendamentoExistente = await Agendamento.findOne({
      where: { 
        profissionalId, 
        data, 
        horario,
        tenantId: req.user.tenantId,
        status: { [Sequelize.Op.ne]: 'cancelado' }
      }
    });

    if (agendamentoExistente) {
      return res.status(400).json({ erro: 'Horário indisponível' });
    }

    const agendamento = await Agendamento.create({
      clienteNome,
      clienteTelefone,
      clienteEmail,
      profissionalId,
      procedimento,
      data,
      horario,
      observacoes,
      tenantId: req.user.tenantId
    });

    res.status(201).json({ 
      mensagem: 'Agendamento criado com sucesso',
      agendamento
    });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ erro: 'Erro ao criar agendamento' });
  }
});

// Gerar link WhatsApp para agendamento
app.get('/agendamentos/:id/whatsapp-link', authenticateToken, checkTenantLimits, async (req, res) => {
  const { id } = req.params;

  try {
    const agendamento = await Agendamento.findOne({
      where: { id, tenantId: req.user.tenantId },
      include: [{ model: Usuario, attributes: ['nome'] }]
    });

    if (!agendamento) {
      return res.status(404).json({ erro: 'Agendamento não encontrado' });
    }

    const tenant = await Tenant.findByPk(req.user.tenantId);
    
    // Formatar data
    const [ano, mes, dia] = agendamento.data.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;

    // Criar mensagem
    const mensagem = `Olá ${agendamento.clienteNome}! 👋\n\nSeu agendamento está confirmado:\n\n📅 Data: ${dataFormatada}\n🕐 Horário: ${agendamento.horario}\n💆 Procedimento: ${agendamento.procedimento}\n👨‍⚕️ Profissional: ${agendamento.usuario.nome}\n\nAguardamos você! 😊\n\n${tenant.nome}`;

    // Limpar telefone (remover caracteres não numéricos)
    const telefone = agendamento.clienteTelefone.replace(/\D/g, '');

    // Gerar link wa.me
    const linkWhatsApp = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;

    res.json({ 
      link: linkWhatsApp,
      mensagem,
      telefone: `+55 ${telefone}`
    });
  } catch (error) {
    console.error('Erro ao gerar link WhatsApp:', error);
    res.status(500).json({ erro: 'Erro ao gerar link' });
  }
});

// ============================================
// ROTAS PROTEGIDAS - PROCEDIMENTOS
// ============================================

// Listar procedimentos
app.get('/procedimentos', authenticateToken, checkTenantLimits, async (req, res) => {
  try {
    const procedimentos = await Procedimento.findAll({
      where: { tenantId: req.user.tenantId }
    });
    res.json(procedimentos);
  } catch (error) {
    console.error('Erro ao listar procedimentos:', error);
    res.status(500).json({ erro: 'Erro ao listar procedimentos' });
  }
});

// Criar procedimento
app.post('/procedimentos', authenticateToken, checkTenantLimits, async (req, res) => {
  const { nome, duracao, valor, descricao } = req.body;

  if (!nome) {
    return res.status(400).json({ erro: 'Nome do procedimento é obrigatório' });
  }

  try {
    const procedimento = await Procedimento.create({
      nome,
      duracao,
      valor,
      descricao,
      tenantId: req.user.tenantId
    });

    res.status(201).json({ 
      mensagem: 'Procedimento criado',
      procedimento
    });
  } catch (error) {
    console.error('Erro ao criar procedimento:', error);
    res.status(500).json({ erro: 'Erro ao criar procedimento' });
  }
});

// ============================================
// SERVIDOR
// ============================================

app.listen(port, () => {
  console.log(`
  ✅ Servidor SaaS rodando em http://localhost:${port}
  
  📦 Plano Starter: R$ 19,90/mês
  👥 Limite: 3 usuários por tenant
  🎁 Trial: 30 dias grátis
  `);
});
