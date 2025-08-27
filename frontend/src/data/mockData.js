// Mock data para demonstração enquanto o backend não está conectado
export const mockDashboardData = {
  metrics: {
    todayAppointments: { value: 12, variation: 8.2 },
    activePatients: { value: 248, variation: 15.3 },
    monthlyRevenue: { value: 'R$ 22.5k', variation: 12.8 },
    occupationRate: { value: '85%', variation: 5.2 }
  },
  
  activities: [
    {
      id: 1,
      type: 'agendamento',
      title: 'Nova consulta agendada',
      description: 'Maria Silva - Limpeza de Pele',
      time: '2 min atrás'
    },
    {
      id: 2,
      type: 'whatsapp',
      title: 'Mensagem WhatsApp',
      description: 'João Santos confirmou agendamento',
      time: '5 min atrás'
    },
    {
      id: 3,
      type: 'proposta',
      title: 'Proposta aprovada',
      description: 'Ana Costa - R$ 1.200',
      time: '10 min atrás'
    },
    {
      id: 4,
      type: 'paciente',
      title: 'Novo paciente cadastrado',
      description: 'Carlos Lima',
      time: '15 min atrás'
    }
  ],

  appointments: [
    {
      id: 1,
      paciente: 'Maria Silva',
      procedimento: 'Limpeza de Pele',
      horario: '09:00',
      status: 'confirmado',
      avatar: 'MS'
    },
    {
      id: 2,
      paciente: 'João Santos',
      procedimento: 'Botox',
      horario: '10:30',
      status: 'pendente',
      avatar: 'JS'
    },
    {
      id: 3,
      paciente: 'Ana Costa',
      procedimento: 'Preenchimento',
      horario: '14:00',
      status: 'confirmado',
      avatar: 'AC'
    },
    {
      id: 4,
      paciente: 'Carlos Lima',
      procedimento: 'Peeling',
      horario: '15:30',
      status: 'reagendado',
      avatar: 'CL'
    }
  ],

  chartData: {
    appointmentsRevenue: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      datasets: [
        {
          label: 'Agendamentos',
          data: [65, 78, 90, 85, 92, 88],
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.2)',
          yAxisID: 'y',
        },
        {
          label: 'Receita (R$ mil)',
          data: [18, 22, 28, 25, 30, 27],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          yAxisID: 'y1',
        }
      ],
    },
    
    procedures: {
      labels: ['Limpeza de Pele', 'Botox', 'Preenchimento', 'Peeling', 'Outros'],
      datasets: [
        {
          data: [35, 25, 20, 15, 5],
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(255, 99, 132, 0.8)',
            'rgba(153, 102, 255, 0.8)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 2,
        },
      ],
    }
  }
};

export default mockDashboardData;
