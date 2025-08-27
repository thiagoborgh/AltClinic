// Mock data para o sistema de agenda
export const mockAgendamentos = [
  {
    id: 1,
    paciente: 'Maria Silva',
    telefone: '(11) 99999-1111',
    email: 'maria@email.com',
    procedimento: 'Limpeza de Pele',
    especialidade: 'Estética',
    profissional: 'Dr. Ana Costa',
    equipamento: 'Sala 1',
    dataHora: new Date(2025, 7, 27, 9, 0), // 27/08/2025 09:00
    duracao: 60, // minutos
    status: 'confirmado',
    valor: 150.00,
    observacoes: 'Paciente tem alergia a ácido',
    lembreteEnviado: true,
    criadoEm: new Date(2025, 7, 25),
    historico: [
      { data: new Date(2025, 7, 25), acao: 'Agendamento criado', usuario: 'Recepção' },
      { data: new Date(2025, 7, 26), acao: 'Lembrete enviado', usuario: 'Sistema' }
    ]
  },
  {
    id: 2,
    paciente: 'João Santos',
    telefone: '(11) 99999-2222',
    email: 'joao@email.com',
    procedimento: 'Massagem Relaxante',
    especialidade: 'Fisioterapia',
    profissional: 'Dra. Beatriz Lima',
    equipamento: 'Sala 2',
    dataHora: new Date(2025, 7, 27, 10, 30),
    duracao: 90,
    status: 'pendente',
    valor: 120.00,
    observacoes: '',
    lembreteEnviado: false,
    criadoEm: new Date(2025, 7, 26),
    historico: [
      { data: new Date(2025, 7, 26), acao: 'Agendamento criado', usuario: 'WhatsApp Bot' }
    ]
  },
  {
    id: 3,
    paciente: 'Carlos Oliveira',
    telefone: '(11) 99999-3333',
    email: 'carlos@email.com',
    procedimento: 'Consulta Dermatológica',
    especialidade: 'Dermatologia',
    profissional: 'Dr. Pedro Alves',
    equipamento: 'Consultório A',
    dataHora: new Date(2025, 7, 27, 14, 0),
    duracao: 45,
    status: 'confirmado',
    valor: 200.00,
    observacoes: 'Retorno - acompanhamento de tratamento',
    lembreteEnviado: true,
    criadoEm: new Date(2025, 7, 20),
    historico: [
      { data: new Date(2025, 7, 20), acao: 'Agendamento criado', usuario: 'Recepção' },
      { data: new Date(2025, 7, 25), acao: 'Lembrete enviado', usuario: 'Sistema' },
      { data: new Date(2025, 7, 26), acao: 'Confirmado pelo paciente', usuario: 'WhatsApp Bot' }
    ]
  },
  {
    id: 4,
    paciente: 'Ana Paula',
    telefone: '(11) 99999-4444',
    email: 'ana@email.com',
    procedimento: 'Aplicação de Botox',
    especialidade: 'Estética',
    profissional: 'Dr. Ana Costa',
    equipamento: 'Sala 1',
    dataHora: new Date(2025, 7, 27, 16, 0),
    duracao: 30,
    status: 'em-andamento',
    valor: 800.00,
    observacoes: 'Primeira aplicação',
    lembreteEnviado: true,
    criadoEm: new Date(2025, 7, 15),
    historico: [
      { data: new Date(2025, 7, 15), acao: 'Agendamento criado', usuario: 'Recepção' },
      { data: new Date(2025, 7, 25), acao: 'Lembrete enviado', usuario: 'Sistema' },
      { data: new Date(2025, 7, 27), acao: 'Paciente chegou', usuario: 'Recepção' }
    ]
  },
  {
    id: 5,
    paciente: 'Roberto Mendes',
    telefone: '(11) 99999-5555',
    email: 'roberto@email.com',
    procedimento: 'Fisioterapia Respiratória',
    especialidade: 'Fisioterapia',
    profissional: 'Dra. Beatriz Lima',
    equipamento: 'Sala 3',
    dataHora: new Date(2025, 7, 28, 8, 0),
    duracao: 60,
    status: 'confirmado',
    valor: 100.00,
    observacoes: 'Sessão 5 de 10',
    lembreteEnviado: false,
    criadoEm: new Date(2025, 7, 26),
    historico: [
      { data: new Date(2025, 7, 26), acao: 'Agendamento criado', usuario: 'Recepção' }
    ]
  },
  {
    id: 6,
    paciente: 'Fernanda Costa',
    telefone: '(11) 99999-6666',
    email: 'fernanda@email.com',
    procedimento: 'Peeling Químico',
    especialidade: 'Dermatologia',
    profissional: 'Dr. Pedro Alves',
    equipamento: 'Consultório A',
    dataHora: new Date(2025, 7, 28, 15, 30),
    duracao: 90,
    status: 'cancelado',
    valor: 300.00,
    observacoes: 'Cancelado - emergência familiar',
    lembreteEnviado: true,
    motivoCancelamento: 'Emergência familiar',
    canceladoEm: new Date(2025, 7, 27),
    criadoEm: new Date(2025, 7, 22),
    historico: [
      { data: new Date(2025, 7, 22), acao: 'Agendamento criado', usuario: 'WhatsApp Bot' },
      { data: new Date(2025, 7, 26), acao: 'Lembrete enviado', usuario: 'Sistema' },
      { data: new Date(2025, 7, 27), acao: 'Cancelado pelo paciente', usuario: 'WhatsApp Bot' }
    ]
  }
];

export const mockEquipamentos = [
  {
    id: 1,
    nome: 'Sala 1',
    tipo: 'Sala de Procedimentos',
    capacidade: 1,
    especialidades: ['Estética', 'Dermatologia'],
    equipamentos: ['Microagulhamento', 'Laser CO2', 'Ultrassom'],
    status: 'ativo',
    observacoes: 'Sala climatizada com equipamentos de estética avançada'
  },
  {
    id: 2,
    nome: 'Sala 2',
    tipo: 'Sala de Massagem',
    capacidade: 1,
    especialidades: ['Fisioterapia', 'Massoterapia'],
    equipamentos: ['Mesa de massagem', 'Óleos terapêuticos'],
    status: 'ativo',
    observacoes: 'Ambiente relaxante com música ambiente'
  },
  {
    id: 3,
    nome: 'Sala 3',
    tipo: 'Sala de Fisioterapia',
    capacidade: 2,
    especialidades: ['Fisioterapia'],
    equipamentos: ['Esteira', 'Aparelhos de eletroterapia', 'Pesos'],
    status: 'ativo',
    observacoes: 'Sala ampla para exercícios de reabilitação'
  },
  {
    id: 4,
    nome: 'Consultório A',
    tipo: 'Consultório Médico',
    capacidade: 1,
    especialidades: ['Dermatologia', 'Clínica Geral'],
    equipamentos: ['Dermatoscópio', 'Balança', 'Esfigmomanômetro'],
    status: 'ativo',
    observacoes: 'Consultório completo para consultas médicas'
  },
  {
    id: 5,
    nome: 'Recepção',
    tipo: 'Área Comum',
    capacidade: 10,
    especialidades: ['Todas'],
    equipamentos: ['Sistema de som', 'TV', 'Wi-Fi'],
    status: 'ativo',
    observacoes: 'Área de espera confortável para pacientes'
  }
];

export const mockProfissionais = [
  {
    id: 1,
    nome: 'Dr. Ana Costa',
    especialidade: 'Estética',
    crm: 'CRM-SP 123456',
    email: 'ana.costa@altclinic.com',
    telefone: '(11) 99888-1111',
    horarioTrabalho: {
      segunda: { inicio: '08:00', fim: '18:00' },
      terca: { inicio: '08:00', fim: '18:00' },
      quarta: { inicio: '08:00', fim: '18:00' },
      quinta: { inicio: '08:00', fim: '18:00' },
      sexta: { inicio: '08:00', fim: '16:00' },
      sabado: null,
      domingo: null
    },
    status: 'ativo'
  },
  {
    id: 2,
    nome: 'Dra. Beatriz Lima',
    especialidade: 'Fisioterapia',
    crefito: 'CREFITO-3 98765',
    email: 'beatriz.lima@altclinic.com',
    telefone: '(11) 99888-2222',
    horarioTrabalho: {
      segunda: { inicio: '07:00', fim: '17:00' },
      terca: { inicio: '07:00', fim: '17:00' },
      quarta: { inicio: '07:00', fim: '17:00' },
      quinta: { inicio: '07:00', fim: '17:00' },
      sexta: { inicio: '07:00', fim: '15:00' },
      sabado: { inicio: '08:00', fim: '12:00' },
      domingo: null
    },
    status: 'ativo'
  },
  {
    id: 3,
    nome: 'Dr. Pedro Alves',
    especialidade: 'Dermatologia',
    crm: 'CRM-SP 789012',
    email: 'pedro.alves@altclinic.com',
    telefone: '(11) 99888-3333',
    horarioTrabalho: {
      segunda: { inicio: '09:00', fim: '19:00' },
      terca: { inicio: '09:00', fim: '19:00' },
      quarta: { inicio: '09:00', fim: '19:00' },
      quinta: { inicio: '09:00', fim: '19:00' },
      sexta: { inicio: '09:00', fim: '17:00' },
      sabado: null,
      domingo: null
    },
    status: 'ativo'
  }
];

export const mockProcedimentos = [
  {
    id: 1,
    nome: 'Limpeza de Pele',
    especialidade: 'Estética',
    duracao: 60,
    valor: 150.00,
    descricao: 'Limpeza profunda da pele com extração de cravos',
    preparo: 'Evitar exposição solar 24h antes'
  },
  {
    id: 2,
    nome: 'Aplicação de Botox',
    especialidade: 'Estética',
    duracao: 30,
    valor: 800.00,
    descricao: 'Aplicação de toxina botulínica para rugas de expressão',
    preparo: 'Não usar anticoagulantes 7 dias antes'
  },
  {
    id: 3,
    nome: 'Massagem Relaxante',
    especialidade: 'Fisioterapia',
    duracao: 90,
    valor: 120.00,
    descricao: 'Massagem terapêutica para relaxamento muscular',
    preparo: 'Evitar refeições pesadas 2h antes'
  },
  {
    id: 4,
    nome: 'Fisioterapia Respiratória',
    especialidade: 'Fisioterapia',
    duracao: 60,
    valor: 100.00,
    descricao: 'Exercícios e técnicas para melhorar a respiração',
    preparo: 'Usar roupas confortáveis'
  },
  {
    id: 5,
    nome: 'Consulta Dermatológica',
    especialidade: 'Dermatologia',
    duracao: 45,
    valor: 200.00,
    descricao: 'Consulta médica especializada em problemas de pele',
    preparo: 'Trazer exames anteriores se houver'
  },
  {
    id: 6,
    nome: 'Peeling Químico',
    especialidade: 'Dermatologia',
    duracao: 90,
    valor: 300.00,
    descricao: 'Tratamento para renovação da pele com ácidos',
    preparo: 'Não usar ácidos 1 semana antes'
  }
];

// Mock de dados de relatórios
export const mockRelatoriosAgenda = {
  estatisticas: {
    totalAgendamentos: 250,
    taxaConfirmacao: 85,
    taxaCancelamento: 12,
    taxaNoShow: 8,
    receitaTotal: 45000.00,
    tempoMedioAtendimento: 65
  },
  tendencias: [
    { mes: 'Jan', agendamentos: 180, receita: 32000 },
    { mes: 'Fev', agendamentos: 195, receita: 35000 },
    { mes: 'Mar', agendamentos: 210, receita: 38000 },
    { mes: 'Abr', agendamentos: 225, receita: 41000 },
    { mes: 'Mai', agendamentos: 240, receita: 43000 },
    { mes: 'Jun', agendamentos: 250, receita: 45000 }
  ],
  horariosPico: [
    { horario: '09:00', ocupacao: 95 },
    { horario: '10:00', ocupacao: 88 },
    { horario: '14:00', ocupacao: 92 },
    { horario: '15:00', ocupacao: 85 },
    { horario: '16:00', ocupacao: 78 }
  ]
};
