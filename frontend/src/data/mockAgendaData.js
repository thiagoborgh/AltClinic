import moment from 'moment';

// Mapeamento de profissionais com cores
export const profissionais = {
  1: { id: 1, nome: 'Dr. João Silva', cor: '#1976d2', categoria: 'medico' },
  2: { id: 2, nome: 'Dra. Maria Santos', cor: '#1976d2', categoria: 'medico' },
  3: { id: 3, nome: 'Ana Costa', cor: '#4caf50', categoria: 'enfermeira' },
  4: { id: 4, nome: 'Paula Lima', cor: '#4caf50', categoria: 'enfermeira' },
  5: { id: 5, nome: 'Carla Oliveira', cor: '#ff9800', categoria: 'esteticista' },
  6: { id: 6, nome: 'Sofia Pereira', cor: '#ff9800', categoria: 'esteticista' },
  7: { id: 7, nome: 'Carlos Mendes', cor: '#9c27b0', categoria: 'tecnico' },
  8: { id: 8, nome: 'Julia Rocha', cor: '#f44336', categoria: 'coordenadora' }
};

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
      profissional: 'Ana Costa',
      profissional_id: 3,
      equipamento: { id: 1, nome: 'Sala 1' },
      status: 'confirmado',
      observacoes: 'Primeira sessão',
      valor: 120.00,
      backgroundColor: profissionais[3].cor,
      borderColor: profissionais[3].cor
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
      profissional: 'Carla Oliveira',
      profissional_id: 5,
      equipamento: { id: 2, nome: 'Sala 2' },
      status: 'pendente',
      observacoes: 'Cliente regular',
      valor: 80.00,
      backgroundColor: profissionais[5].cor,
      borderColor: profissionais[5].cor
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
      profissional: 'Dr. João Silva',
      profissional_id: 1,
      equipamento: { id: 3, nome: 'Consultório 1' },
      status: 'confirmado',
      observacoes: 'Retorno - verificar evolução',
      valor: 200.00,
      backgroundColor: profissionais[1].cor,
      borderColor: profissionais[1].cor
    },
    {
      id: 4,
      title: 'Carlos Mendes - Aplicação de Botox',
      start: moment().add(2, 'hours').toDate(),
      end: moment().add(3, 'hours').toDate(),
      paciente: {
        id: 4,
        nome: 'Carlos Mendes',
        telefone: '(11) 99999-4444',
        email: 'carlos@email.com'
      },
      procedimento: 'Aplicação de Botox',
      profissional: 'Dra. Maria Santos',
      profissional_id: 2,
      equipamento: { id: 1, nome: 'Sala 1' },
      status: 'confirmado',
      observacoes: 'Primeira aplicação',
      valor: 350.00,
      backgroundColor: profissionais[2].cor,
      borderColor: profissionais[2].cor
    },
    {
      id: 5,
      title: 'Sofia Pereira - Hidratação Facial',
      start: moment().add(1, 'day').hour(10).minute(0).toDate(),
      end: moment().add(1, 'day').hour(11).minute(30).toDate(),
      paciente: {
        id: 5,
        nome: 'Sofia Pereira',
        telefone: '(11) 99999-5555',
        email: 'sofia@email.com'
      },
      procedimento: 'Hidratação Facial',
      profissional: 'Sofia Pereira',
      profissional_id: 6,
      equipamento: { id: 2, nome: 'Sala 2' },
      status: 'pendente',
      observacoes: 'Cliente VIP',
      valor: 180.00,
      backgroundColor: profissionais[6].cor,
      borderColor: profissionais[6].cor
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
