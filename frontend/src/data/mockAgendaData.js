import moment from 'moment';

// Dados mock para demonstração da agenda
export const mockAgendaData = {
  agendamentos: [
    {
      id: 1,
      title: 'Maria Silva - Limpeza Facial',
      start: moment().add(1, 'hour').toDate(),
      end: moment().add(2, 'hour').toDate(),
      paciente: {
        id: 1,
        nome: 'Maria Silva',
        telefone: '(11) 99999-1111',
        email: 'maria@email.com'
      },
      procedimento: 'Limpeza Facial',
      profissional: 'Dra. Ana Costa',
      equipamento: { id: 1, nome: 'Sala 1' },
      status: 'confirmado',
      observacoes: 'Primeira sessão',
      valor: 120.00
    },
    {
      id: 2,
      title: 'João Santos - Massagem Relaxante',
      start: moment().add(3, 'hour').toDate(),
      end: moment().add(4, 'hour').toDate(),
      paciente: {
        id: 2,
        nome: 'João Santos',
        telefone: '(11) 99999-2222',
        email: 'joao@email.com'
      },
      procedimento: 'Massagem Relaxante',
      profissional: 'Dr. Carlos Lima',
      equipamento: { id: 2, nome: 'Sala 2' },
      status: 'pendente',
      observacoes: 'Cliente regular',
      valor: 80.00
    },
    {
      id: 3,
      title: 'Ana Paula - Consulta Dermatológica',
      start: moment().add(1, 'day').hour(14).minute(0).toDate(),
      end: moment().add(1, 'day').hour(15).minute(0).toDate(),
      paciente: {
        id: 3,
        nome: 'Ana Paula',
        telefone: '(11) 99999-3333',
        email: 'ana@email.com'
      },
      procedimento: 'Consulta Dermatológica',
      profissional: 'Dra. Marina Rocha',
      equipamento: { id: 3, nome: 'Consultório 1' },
      status: 'confirmado',
      observacoes: 'Retorno - verificar evolução',
      valor: 200.00
    }
  ],

  equipamentos: [
    {
      id: 1,
      nome: 'Sala 1',
      tipo: 'Estética Facial',
      capacidade: 1,
      status: 'disponivel',
      recursos: ['Vaporizador', 'Luz LED', 'Maca Ajustável']
    },
    {
      id: 2,
      nome: 'Sala 2',
      tipo: 'Massoterapia',
      capacidade: 1,
      status: 'disponivel',
      recursos: ['Maca', 'Aquecedor', 'Som Ambiente']
    },
    {
      id: 3,
      nome: 'Consultório 1',
      tipo: 'Consultas Médicas',
      capacidade: 1,
      status: 'ocupado',
      recursos: ['Mesa', 'Cadeiras', 'Computador']
    }
  ],

  lembretes: [
    {
      id: 1,
      agendamentoId: 1,
      paciente: 'Maria Silva',
      procedimento: 'Limpeza Facial',
      dataAgendamento: moment().add(1, 'hour').toDate(),
      tipo: '24h',
      enviado: true,
      status: 'confirmado'
    },
    {
      id: 2,
      agendamentoId: 2,
      paciente: 'João Santos',
      procedimento: 'Massagem Relaxante',
      dataAgendamento: moment().add(3, 'hour').toDate(),
      tipo: '2h',
      enviado: false,
      status: 'pendente'
    }
  ],

  insights: {
    agendamentosHoje: 8,
    taxaOcupacao: 75,
    noShows: 2,
    confirmados: 6,
    noShowsAlto: 3,
    
    variacao: {
      agendamentos: 12,
      ocupacao: -5,
      noShows: -15,
      confirmados: 8
    },

    alertasIA: [
      'Pico de demanda detectado para amanhã às 14h-16h (85% capacidade)',
      'Sugestão: Agendar overbooking de +2 slots na quinta-feira',
      'Paciente João Santos tem histórico de 20% no-show - enviar lembrete extra'
    ]
  }
};
