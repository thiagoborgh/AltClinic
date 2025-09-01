import moment from 'moment';

// Dados mock para demonstração do módulo financeiro
export const mockFinanceiroData = {
  // Resumo financeiro
  resumoFinanceiro: {
    saldoAtual: 45750.30,
    receitaMensal: 89200.00,
    despesasMensais: 32400.50,
    variacaoReceita: 23.5,
    variacaoDespesas: -8.2,
    contasPendentes: 8,
    valorPendente: 12300.00,
    margemLucro: 63.7
  },

  // Insights de IA
  insightsIA: [
    "💡 Receita 23% maior que o mês passado - excelente crescimento!",
    "⚠️ 3 contas vencendo esta semana - envie lembretes automáticos via WhatsApp",
    "📈 Melhor performance: Terças-feiras geram 35% mais receita em procedimentos estéticos",
    "💰 Oportunidade: Pacientes recorrentes têm 40% menos chance de inadimplência - ofereça pacotes",
    "🎯 Sugestão IA: Implemente desconto de 10% para pagamentos PIX (aumenta conversão em 28%)"
  ],

  // Propostas e Orçamentos
  propostas: [
    {
      id: 1,
      numero: 'PROP-2025-001',
      paciente: {
        id: 1,
        nome: 'Maria Silva Santos',
        telefone: '(11) 99999-1111',
        email: 'maria@email.com'
      },
      itens: [
        {
          id: 1,
          procedimento: 'Limpeza Facial Profunda',
          quantidade: 1,
          valorUnitario: 180.00,
          valorTotal: 180.00
        },
        {
          id: 2,
          procedimento: 'Hidratação Facial',
          quantidade: 1,
          valorUnitario: 120.00,
          valorTotal: 120.00
        }
      ],
      valorTotal: 300.00,
      desconto: 30.00,
      valorFinal: 270.00,
      status: 'aprovada',
      dataCreated: moment().subtract(2, 'days').toDate(),
      dataValidade: moment().add(15, 'days').toDate(),
      observacoes: 'Paciente VIP - desconto especial aplicado',
      formaPagamento: 'pix',
      pixCode: '00020126580014br.gov.bcb.pix...',
      contratoAssinado: true
    },
    {
      id: 2,
      numero: 'PROP-2025-002',
      paciente: {
        id: 2,
        nome: 'João Carlos Lima',
        telefone: '(11) 98888-2222',
        email: 'joao@email.com'
      },
      itens: [
        {
          id: 1,
          procedimento: 'Massagem Relaxante 60min',
          quantidade: 4,
          valorUnitario: 150.00,
          valorTotal: 600.00
        }
      ],
      valorTotal: 600.00,
      desconto: 60.00,
      valorFinal: 540.00,
      status: 'pendente',
      dataCreated: moment().subtract(1, 'days').toDate(),
      dataValidade: moment().add(10, 'days').toDate(),
      observacoes: 'Pacote de 4 sessões - desconto progressivo',
      formaPagamento: 'parcelado',
      contratoAssinado: false
    },
    {
      id: 3,
      numero: 'PROP-2025-003',
      paciente: {
        id: 3,
        nome: 'Ana Paula Costa',
        telefone: '(11) 97777-3333',
        email: 'ana@email.com'
      },
      itens: [
        {
          id: 1,
          procedimento: 'Consulta Dermatológica',
          quantidade: 1,
          valorUnitario: 250.00,
          valorTotal: 250.00
        },
        {
          id: 2,
          procedimento: 'Peeling Químico',
          quantidade: 1,
          valorUnitario: 400.00,
          valorTotal: 400.00
        }
      ],
      valorTotal: 650.00,
      desconto: 0,
      valorFinal: 650.00,
      status: 'rejeitada',
      dataCreated: moment().subtract(5, 'days').toDate(),
      dataValidade: moment().subtract(1, 'days').toDate(),
      observacoes: 'Cliente cancelou por questões financeiras',
      formaPagamento: 'cartao',
      contratoAssinado: false
    }
  ],

  // Contas a Receber
  contasReceber: [
    {
      id: 1,
      paciente: 'Maria Silva Santos',
      procedimento: 'Limpeza Facial + Hidratação',
      valor: 270.00,
      dataVencimento: moment().add(3, 'days').toDate(),
      status: 'pendente',
      parcela: '1/1',
      formaPagamento: 'pix',
      observacoes: 'PIX gerado - aguardando pagamento'
    },
    {
      id: 2,
      paciente: 'Roberto Oliveira',
      procedimento: 'Fisioterapia - Pacote 10 sessões',
      valor: 800.00,
      dataVencimento: moment().add(7, 'days').toDate(),
      status: 'pendente',
      parcela: '2/4',
      formaPagamento: 'boleto',
      observacoes: 'Parcela 2 de 4 - enviar lembrete'
    },
    {
      id: 3,
      paciente: 'Fernanda Rocha',
      procedimento: 'Consulta + Exames',
      valor: 450.00,
      dataVencimento: moment().subtract(2, 'days').toDate(),
      status: 'vencida',
      parcela: '1/1',
      formaPagamento: 'cartao',
      observacoes: 'VENCIDA - contatar urgente',
      diasAtraso: 2
    },
    {
      id: 4,
      paciente: 'Carlos Mendes',
      procedimento: 'Massagem Terapêutica',
      valor: 150.00,
      dataVencimento: moment().subtract(1, 'days').toDate(),
      status: 'pago',
      parcela: '1/1',
      formaPagamento: 'pix',
      dataPagamento: moment().subtract(1, 'days').toDate(),
      observacoes: 'Pago via PIX'
    }
  ],

  // Contas a Pagar
  contasPagar: [
    {
      id: 1,
      fornecedor: 'Distribuidora Medical Ltda',
      descricao: 'Suprimentos para procedimentos (seringas, gases, cremes)',
      categoria: 'Suprimentos Médicos',
      valor: 850.00,
      dataVencimento: moment().add(5, 'days').toDate(),
      status: 'pendente',
      recorrente: false,
      observacoes: 'Pedido 12345 - produtos para próxima semana'
    },
    {
      id: 2,
      fornecedor: 'Imobiliária Centro Comercial',
      descricao: 'Aluguel da clínica - Agosto 2025',
      categoria: 'Aluguel',
      valor: 4500.00,
      dataVencimento: moment().add(10, 'days').toDate(),
      status: 'pendente',
      recorrente: true,
      observacoes: 'Pagamento mensal recorrente'
    },
    {
      id: 3,
      fornecedor: 'Energia Elétrica SP',
      descricao: 'Conta de luz - Julho 2025',
      categoria: 'Utilidades',
      valor: 680.50,
      dataVencimento: moment().add(8, 'days').toDate(),
      status: 'pendente',
      recorrente: true,
      observacoes: 'Consumo alto devido ao ar condicionado'
    },
    {
      id: 4,
      fornecedor: 'Dr. João Especialista',
      descricao: 'Consultoria médica - Julho',
      categoria: 'Honorários',
      valor: 2500.00,
      dataVencimento: moment().subtract(1, 'days').toDate(),
      status: 'pago',
      dataPagamento: moment().subtract(1, 'days').toDate(),
      recorrente: false,
      observacoes: 'Consultoria especializada paga'
    },
    {
      id: 5,
      fornecedor: 'Software Alt Clinic Ltda',
      descricao: 'Licença mensal do sistema Alt Clinic',
      categoria: 'Software',
      valor: 299.90,
      dataVencimento: moment().add(15, 'days').toDate(),
      status: 'pendente',
      recorrente: true,
      observacoes: 'Renovação automática ativa'
    }
  ],

  // Fluxo de Caixa (últimos 30 dias)
  fluxoCaixa: Array.from({ length: 30 }, (_, index) => {
    const data = moment().subtract(29 - index, 'days');
    return {
      data: data.format('YYYY-MM-DD'),
      entradas: Math.random() * 2000 + 500,
      saidas: Math.random() * 800 + 200,
      saldo: Math.random() * 1500 + 300,
      transacoes: Math.floor(Math.random() * 15) + 3
    };
  }),

  // Estoque vinculado aos custos
  estoque: [
    {
      id: 1,
      item: 'Seringas Descartáveis 5ml',
      categoria: 'Suprimentos Médicos',
      quantidadeAtual: 45,
      quantidadeMinima: 20,
      custoUnitario: 2.50,
      fornecedor: 'Distribuidora Medical Ltda',
      ultimaCompra: moment().subtract(10, 'days').toDate(),
      consumoMedio: 8, // por semana
      status: 'ok'
    },
    {
      id: 2,
      item: 'Creme Hidratante Facial 200ml',
      categoria: 'Cosméticos',
      quantidadeAtual: 8,
      quantidadeMinima: 15,
      custoUnitario: 45.00,
      fornecedor: 'Cosméticos Premium',
      ultimaCompra: moment().subtract(20, 'days').toDate(),
      consumoMedio: 5,
      status: 'baixo'
    },
    {
      id: 3,
      item: 'Luvas Látex Descartáveis (cx c/100)',
      categoria: 'EPI',
      quantidadeAtual: 3,
      quantidadeMinima: 5,
      custoUnitario: 25.00,
      fornecedor: 'Distribuidora Medical Ltda',
      ultimaCompra: moment().subtract(15, 'days').toDate(),
      consumoMedio: 2,
      status: 'critico'
    }
  ],

  // Categorias de despesas
  categorias: [
    'Suprimentos Médicos',
    'Aluguel',
    'Utilidades',
    'Honorários',
    'Software',
    'Marketing',
    'Equipamentos',
    'Manutenção',
    'Impostos',
    'Outros'
  ],

  // Formas de pagamento
  formasPagamento: [
    'pix',
    'cartao_credito',
    'cartao_debito',
    'boleto',
    'dinheiro',
    'transferencia'
  ]
};
