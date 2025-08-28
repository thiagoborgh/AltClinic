// Mock data para o módulo CRM
import { subDays } from 'date-fns';

// Dados mock de pacientes
export const mockPacientes = [
  {
    id: 1,
    nome: 'Maria Silva Santos',
    email: 'maria.santos@email.com',
    telefone: '(11) 99999-1234',
    data_nascimento: '1985-03-15',
    genero: 'Feminino',
    profissao: 'Empresária',
    endereco: 'Rua das Flores, 123 - Vila Madalena',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '05435-020',
    status: 'ativo',
    ultima_consulta: subDays(new Date(), 15),
    valor_total_gasto: 2500.00,
    numero_consultas: 8,
    opt_in_marketing: true,
    tags: ['VIP', 'Botox', 'Preenchimento'],
    segmento: {
      id: 1,
      nome: 'Alto Valor',
      cor: '#4CAF50'
    },
    observacoes: 'Paciente fidelizada, sempre pontual nas consultas.'
  },
  {
    id: 2,
    nome: 'João Carlos Oliveira',
    email: 'joao.oliveira@empresa.com',
    telefone: '(11) 98888-5678',
    data_nascimento: '1978-08-22',
    genero: 'Masculino',
    profissao: 'Executivo',
    endereco: 'Av. Paulista, 1000 - Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310-100',
    status: 'inativo',
    ultima_consulta: subDays(new Date(), 95),
    valor_total_gasto: 1800.00,
    numero_consultas: 6,
    opt_in_marketing: true,
    tags: ['Corporativo', 'Limpeza'],
    segmento: {
      id: 2,
      nome: 'Inativos Propensão',
      cor: '#FF9800'
    },
    observacoes: 'Cliente corporativo, preferência por horários após 18h.'
  },
  {
    id: 3,
    nome: 'Ana Paula Costa',
    email: 'ana.costa@gmail.com',
    telefone: '(11) 97777-9012',
    data_nascimento: '1992-12-05',
    genero: 'Feminino',
    profissao: 'Designer',
    endereco: 'Rua Augusta, 500 - Consolação',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01305-000',
    status: 'ativo',
    ultima_consulta: subDays(new Date(), 7),
    valor_total_gasto: 950.00,
    numero_consultas: 4,
    opt_in_marketing: true,
    tags: ['Jovem', 'Hidratação'],
    segmento: {
      id: 3,
      nome: 'Novos Clientes',
      cor: '#2196F3'
    },
    observacoes: 'Paciente jovem, interessada em tratamentos preventivos.'
  },
  {
    id: 4,
    nome: 'Roberto Ferreira Lima',
    email: 'roberto.lima@hotmail.com',
    telefone: '(11) 96666-3456',
    data_nascimento: '1970-06-18',
    genero: 'Masculino',
    profissao: 'Médico',
    endereco: 'Rua Oscar Freire, 800 - Jardins',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01426-000',
    status: 'perdido',
    ultima_consulta: subDays(new Date(), 180),
    valor_total_gasto: 3200.00,
    numero_consultas: 12,
    opt_in_marketing: false,
    tags: ['Médico', 'Ex-VIP'],
    segmento: {
      id: 4,
      nome: 'Perdidos Alto Valor',
      cor: '#F44336'
    },
    observacoes: 'Ex-cliente VIP, mudou para outro estado.'
  },
  {
    id: 5,
    nome: 'Carla Mendes Rodrigues',
    email: 'carla.mendes@yahoo.com',
    telefone: '(11) 95555-7890',
    data_nascimento: '1988-04-30',
    genero: 'Feminino',
    profissao: 'Advogada',
    endereco: 'Alameda Santos, 200 - Paraíso',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01418-000',
    status: 'ativo',
    ultima_consulta: subDays(new Date(), 3),
    valor_total_gasto: 1200.00,
    numero_consultas: 5,
    opt_in_marketing: true,
    tags: ['Profissional Liberal', 'Peeling'],
    segmento: {
      id: 1,
      nome: 'Alto Valor',
      cor: '#4CAF50'
    },
    observacoes: 'Paciente regular, sempre agenda com antecedência.'
  }
];

// Segmentos predefinidos
export const mockSegmentos = [
  {
    id: 1,
    nome: 'Alto Valor',
    descricao: 'Pacientes com gasto acima de R$ 1.000',
    criterios: {
      valor_minimo: 1000,
      consultas_minimas: 3
    },
    tipo: 'automatico',
    cor: '#4CAF50',
    ativo: true,
    total_pacientes: 15
  },
  {
    id: 2,
    nome: 'Inativos Propensão',
    descricao: 'Pacientes inativos com alta propensão ao retorno',
    criterios: {
      dias_inativo: [60, 120],
      valor_historico_minimo: 500
    },
    tipo: 'automatico',
    cor: '#FF9800',
    ativo: true,
    total_pacientes: 8
  },
  {
    id: 3,
    nome: 'Novos Clientes',
    descricao: 'Pacientes com menos de 6 meses na clínica',
    criterios: {
      meses_cliente: 6,
      consultas_maximas: 5
    },
    tipo: 'automatico',
    cor: '#2196F3',
    ativo: true,
    total_pacientes: 22
  },
  {
    id: 4,
    nome: 'Perdidos Alto Valor',
    descricao: 'Ex-clientes VIP que não retornam há mais de 6 meses',
    criterios: {
      dias_inativo: 180,
      valor_historico_minimo: 2000
    },
    tipo: 'automatico',
    cor: '#F44336',
    ativo: true,
    total_pacientes: 5
  }
];

// Templates de mensagens
export const mockTemplates = [
  {
    id: 1,
    nome: 'Confirmação de Consulta',
    assunto: 'Consulta Confirmada - {data_consulta}',
    conteudo: 'Olá {nome}! Sua consulta está confirmada para {data_consulta} às {hora_consulta}. Nos vemos em breve! 😊',
    tipo: 'whatsapp',
    categoria: 'confirmacao',
    placeholders: ['nome', 'data_consulta', 'hora_consulta', 'procedimento'],
    ativo: true,
    uso_ia: false
  },
  {
    id: 2,
    nome: 'Lembrete 24h',
    assunto: 'Lembrete: Consulta Amanhã',
    conteudo: 'Oi {nome}! Lembrando que você tem consulta amanhã ({data_consulta}) às {hora_consulta} para {procedimento}. Te esperamos!',
    tipo: 'whatsapp',
    categoria: 'lembrete',
    placeholders: ['nome', 'data_consulta', 'hora_consulta', 'procedimento'],
    ativo: true,
    uso_ia: false
  },
  {
    id: 3,
    nome: 'Pós-Atendimento',
    assunto: 'Como foi sua experiência?',
    conteudo: 'Olá {nome}! Esperamos que tenha gostado do seu {procedimento}. Como foi sua experiência? Sua opinião é muito importante para nós!',
    tipo: 'whatsapp',
    categoria: 'pos_atendimento',
    placeholders: ['nome', 'procedimento', 'data_consulta'],
    ativo: true,
    uso_ia: true
  },
  {
    id: 4,
    nome: 'Reativação Personalizada',
    assunto: 'Que saudades! Oferta especial para você',
    conteudo: 'Oi {nome}! Sentimos sua falta aqui na clínica. Que tal agendar uma nova sessão de {procedimento_favorito}? Temos uma oferta especial de 20% off só para você!',
    tipo: 'whatsapp',
    categoria: 'reativacao',
    placeholders: ['nome', 'procedimento_favorito', 'ultimo_procedimento'],
    ativo: true,
    uso_ia: true
  },
  {
    id: 5,
    nome: 'Aniversário',
    assunto: 'Parabéns! 🎉 Oferta especial de aniversário',
    conteudo: 'Parabéns, {nome}! 🎂 Para comemorar seu aniversário, preparamos uma oferta especial: 30% off em qualquer procedimento até o final do mês. Agende já!',
    tipo: 'email',
    categoria: 'promocional',
    placeholders: ['nome', 'idade'],
    ativo: true,
    uso_ia: false
  }
];

// Mensagens enviadas (histórico)
export const mockMensagens = [
  {
    id: 1,
    paciente_id: 1,
    paciente_nome: 'Maria Silva Santos',
    template_id: 1,
    template_nome: 'Confirmação de Consulta',
    tipo: 'whatsapp',
    assunto: 'Consulta Confirmada - 25/08/2024',
    conteudo: 'Olá Maria! Sua consulta está confirmada para 25/08/2024 às 14:30. Nos vemos em breve!',
    status: 'lido',
    origem: 'automatico',
    agendado_para: subDays(new Date(), 2),
    enviado_em: subDays(new Date(), 2),
    entregue_em: subDays(new Date(), 2),
    lido_em: subDays(new Date(), 2),
    respondido_em: subDays(new Date(), 2),
    resposta: 'Perfeito! Obrigada, estarei lá pontualmente.',
    tentativas: 1
  },
  {
    id: 2,
    paciente_id: 2,
    paciente_nome: 'João Carlos Oliveira',
    template_id: 4,
    template_nome: 'Reativação Personalizada',
    tipo: 'email',
    assunto: 'Que saudades! Oferta especial para você',
    conteudo: 'Oi João! Sentimos sua falta aqui na clínica. Que tal agendar uma nova sessão de Limpeza de Pele? Temos uma oferta especial de 20% off só para você!',
    status: 'entregue',
    origem: 'manual',
    agendado_para: subDays(new Date(), 5),
    enviado_em: subDays(new Date(), 5),
    entregue_em: subDays(new Date(), 5),
    lido_em: null,
    respondido_em: null,
    resposta: null,
    tentativas: 1
  },
  {
    id: 3,
    paciente_id: 3,
    paciente_nome: 'Ana Paula Costa',
    template_id: 3,
    template_nome: 'Pós-Atendimento',
    tipo: 'whatsapp',
    assunto: 'Como foi sua experiência?',
    conteudo: 'Olá Ana! Esperamos que tenha gostado da sua Hidratação Facial. Como foi sua experiência? Sua opinião é muito importante para nós!',
    status: 'lido',
    origem: 'automatico',
    agendado_para: subDays(new Date(), 1),
    enviado_em: subDays(new Date(), 1),
    entregue_em: subDays(new Date(), 1),
    lido_em: subDays(new Date(), 1),
    respondido_em: subDays(new Date(), 1),
    resposta: 'Adorei o tratamento! Minha pele ficou incrível. Já quero agendar o próximo! ⭐⭐⭐⭐⭐',
    tentativas: 1
  }
];

// Métricas do CRM
export const mockCRMMetrics = {
  pacientes_ativos: 156,
  change_pacientes_ativos: 12,
  pacientes_inativos: 23,
  change_inativos: -5,
  taxa_engajamento: 78.5,
  change_engajamento: 8.2,
  mensagens_mes: 245,
  change_mensagens: 15,
  
  // Métricas detalhadas
  taxa_entrega: 96.8,
  taxa_abertura: 72.4,
  taxa_resposta: 38.9,
  taxa_conversao: 15.2,
  
  // Engajamento por canal
  engajamento_por_canal: [
    { canal: 'WhatsApp', enviadas: 180, abertura: 82, resposta: 45, conversao: 18 },
    { canal: 'Email', enviadas: 65, abertura: 55, resposta: 25, conversao: 8 },
    { canal: 'SMS', enviadas: 15, abertura: 95, resposta: 30, conversao: 12 }
  ],
  
  // Tendência mensal (últimos 6 meses)
  tendencia_mensal: [
    { mes: 'Mar', pacientes_ativos: 142, engajamento: 65.2, conversao: 12.1 },
    { mes: 'Abr', pacientes_ativos: 148, engajamento: 68.7, conversao: 13.5 },
    { mes: 'Mai', pacientes_ativos: 151, engajamento: 71.3, conversao: 14.2 },
    { mes: 'Jun', pacientes_ativos: 153, engajamento: 74.8, conversao: 14.8 },
    { mes: 'Jul', pacientes_ativos: 154, engajamento: 76.1, conversao: 15.0 },
    { mes: 'Ago', pacientes_ativos: 156, engajamento: 78.5, conversao: 15.2 }
  ],
  
  // Alertas e notificações
  alerts: [
    {
      id: 1,
      tipo: 'warning',
      titulo: 'Pacientes Inativos',
      mensagem: '23 pacientes não retornam há mais de 60 dias',
      acao: 'Ver Lista',
      prioridade: 'alta'
    },
    {
      id: 2,
      tipo: 'info',
      titulo: 'Campanha de Aniversário',
      mensagem: '8 pacientes fazem aniversário esta semana',
      acao: 'Criar Campanha',
      prioridade: 'media'
    },
    {
      id: 3,
      tipo: 'success',
      titulo: 'Meta de Engajamento',
      mensagem: 'Taxa de resposta subiu 8% este mês!',
      acao: 'Ver Relatório',
      prioridade: 'baixa'
    }
  ]
};

// Relatório de ativação
export const mockRelatorioAtivacao = {
  pacientes_inativos: [
    {
      id: 2,
      nome: 'João Carlos Oliveira',
      ultima_consulta: subDays(new Date(), 95),
      dias_inativo: 95,
      valor_historico: 1800.00,
      propensao_retorno: 0.75,
      sugestao_abordagem: 'Oferta de desconto 20% + procedimento gratuito',
      procedimentos_favoritos: ['Limpeza de Pele', 'Tratamento Anti-idade'],
      motivo_inatividade: 'Mudança de rotina profissional',
      tentativas_contato: 1,
      ultima_tentativa: subDays(new Date(), 5)
    },
    {
      id: 6,
      nome: 'Patricia Alves Santos',
      ultima_consulta: subDays(new Date(), 75),
      dias_inativo: 75,
      valor_historico: 2200.00,
      propensao_retorno: 0.82,
      sugestao_abordagem: 'Convite para novo tratamento com tecnologia avançada',
      procedimentos_favoritos: ['Botox', 'Preenchimento', 'Peeling'],
      motivo_inatividade: 'Satisfação com resultados anteriores',
      tentativas_contato: 0,
      ultima_tentativa: null
    }
  ],
  metricas: {
    total_inativos: 23,
    potencial_receita_perdida: 18500.00,
    taxa_reativacao_esperada: 0.32,
    custo_aquisicao_vs_reativacao: {
      novo_cliente: 180.00,
      reativacao: 45.00,
      economia: 75
    }
  }
};

// Automações configuradas
export const mockAutomacoes = [
  {
    id: 1,
    nome: 'Confirmação Automática',
    descricao: 'Enviar confirmação ao agendar consulta',
    trigger_evento: 'nova_consulta',
    trigger_condicoes: { minutos_antes: 0 },
    acao_tipo: 'enviar_mensagem',
    template_id: 1,
    ativo: true,
    delay_horas: 0,
    execucoes: 156,
    ultima_execucao: subDays(new Date(), 1)
  },
  {
    id: 2,
    nome: 'Lembrete 24h',
    descricao: 'Lembrar paciente 24h antes da consulta',
    trigger_evento: 'consulta_amanha',
    trigger_condicoes: { horas_antes: 24 },
    acao_tipo: 'enviar_mensagem',
    template_id: 2,
    ativo: true,
    delay_horas: 0,
    execucoes: 142,
    ultima_execucao: subDays(new Date(), 1)
  },
  {
    id: 3,
    nome: 'Feedback Pós-Atendimento',
    descricao: 'Solicitar feedback 2 horas após consulta',
    trigger_evento: 'consulta_finalizada',
    trigger_condicoes: { horas_depois: 2 },
    acao_tipo: 'enviar_mensagem',
    template_id: 3,
    ativo: true,
    delay_horas: 2,
    execucoes: 98,
    ultima_execucao: subDays(new Date(), 1)
  },
  {
    id: 4,
    nome: 'Reativação de Inativos',
    descricao: 'Contatar pacientes inativos há 60 dias',
    trigger_evento: 'inatividade',
    trigger_condicoes: { dias_inativo: 60 },
    acao_tipo: 'enviar_mensagem',
    template_id: 4,
    ativo: true,
    delay_horas: 0,
    execucoes: 15,
    ultima_execucao: subDays(new Date(), 7)
  }
];

// Funções utilitárias
export const getStatusColor = (status) => {
  const colors = {
    'ativo': '#4CAF50',
    'inativo': '#FF9800', 
    'perdido': '#F44336'
  };
  return colors[status] || '#9E9E9E';
};

export const getStatusLabel = (status) => {
  const labels = {
    'ativo': 'Ativo',
    'inativo': 'Inativo',
    'perdido': 'Perdido'
  };
  return labels[status] || 'Indefinido';
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatPhone = (phone) => {
  return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

export const calculateDaysInactive = (lastConsultation) => {
  const today = new Date();
  const lastDate = new Date(lastConsultation);
  const diffTime = Math.abs(today - lastDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
