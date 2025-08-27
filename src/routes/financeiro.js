const express = require('express');
const router = express.Router();

// Simulação de dados financeiros para desenvolvimento
const mockFinanceiroData = {
  resumoFinanceiro: {
    saldoAtual: 45750.80,
    receitaMensal: 28500.00,
    despesaMensal: 15200.00,
    lucroMensal: 13300.00,
    contasReceber: 12450.00,
    contasPagar: 8750.00,
    metaMensal: 35000.00,
    percentualMeta: 81.4
  },
  
  contasReceber: [
    {
      id: 1,
      cliente: "Maria Silva",
      telefone: "(11) 99999-1234",
      descricao: "Limpeza de Pele + Hidratação",
      valor: 350.00,
      dataEmissao: "2024-01-10",
      dataVencimento: "2024-01-25",
      dataPagamento: null,
      status: "pendente"
    },
    {
      id: 2,
      cliente: "João Santos",
      telefone: "(11) 98888-5678",
      descricao: "Consulta Dermatológica",
      valor: 200.00,
      dataEmissao: "2024-01-12",
      dataVencimento: "2024-01-15",
      dataPagamento: "2024-01-15",
      status: "paga"
    },
    {
      id: 3,
      cliente: "Ana Costa",
      telefone: "(11) 97777-9012",
      descricao: "Tratamento Facial Completo",
      valor: 450.00,
      dataEmissao: "2024-01-08",
      dataVencimento: "2024-01-20",
      dataPagamento: null,
      status: "pendente"
    }
  ],
  
  contasPagar: [
    {
      id: 1,
      fornecedor: "Beauty Supplies Ltda",
      contato: "contato@beautysupplies.com.br",
      categoria: "Fornecedores",
      descricao: "Produtos para tratamento facial",
      valor: 1250.00,
      dataEmissao: "2024-01-10",
      dataVencimento: "2024-01-30",
      dataPagamento: null,
      status: "pendente"
    },
    {
      id: 2,
      fornecedor: "Transportes Rápidos",
      contato: "(11) 3333-4444",
      categoria: "Transporte",
      descricao: "Frete de equipamentos",
      valor: 180.00,
      dataEmissao: "2024-01-12",
      dataVencimento: "2024-01-18",
      dataPagamento: "2024-01-18",
      status: "paga"
    }
  ],
  
  propostas: [
    {
      id: 1,
      numero: "PROP-2024-001",
      paciente: {
        nome: "Carla Mendes",
        telefone: "(11) 96666-7890",
        email: "carla@email.com"
      },
      itens: [
        {
          procedimento: "Limpeza Facial",
          quantidade: 1,
          valorUnitario: 150.00,
          valorTotal: 150.00
        }
      ],
      valorTotal: 150.00,
      desconto: 0,
      valorFinal: 150.00,
      status: "pendente",
      dataCreated: "2024-01-15",
      dataValidade: "2024-01-30",
      formaPagamento: "pix"
    },
    {
      id: 2,
      numero: "PROP-2024-002",
      paciente: {
        nome: "Roberto Lima",
        telefone: "(11) 95555-6789",
        email: "roberto@email.com"
      },
      itens: [
        {
          procedimento: "Consulta Dermatológica",
          quantidade: 1,
          valorUnitario: 200.00,
          valorTotal: 200.00
        },
        {
          procedimento: "Peeling Químico",
          quantidade: 1,
          valorUnitario: 300.00,
          valorTotal: 300.00
        }
      ],
      valorTotal: 500.00,
      desconto: 50.00,
      valorFinal: 450.00,
      status: "aprovada",
      dataCreated: "2024-01-12",
      dataValidade: "2024-01-27",
      formaPagamento: "cartao"
    }
  ],

  fluxoCaixa: [
    {
      data: "2024-01-15",
      entradas: 850.00,
      saidas: 380.00,
      saldo: 470.00,
      descricao: "Fluxo do dia"
    },
    {
      data: "2024-01-14",
      entradas: 600.00,
      saidas: 220.00,
      saldo: 380.00,
      descricao: "Fluxo do dia"
    }
  ],

  iaInsights: {
    analiseFluxoCaixa: "Com base nos dados dos últimos 30 dias, o fluxo de caixa está 15% acima da média histórica. Recomendo manter as estratégias atuais de captação de clientes.",
    tendencias: [
      "Aumento de 23% nos tratamentos faciais",
      "Crescimento nas consultas dermatológicas",
      "Oportunidade de expansão em massagens"
    ],
    alertas: [
      "2 contas vencidas requerem atenção",
      "Meta mensal pode ser alcançada com 3 novos procedimentos"
    ],
    sugestoes: [
      "Considere criar pacotes promocionais para março",
      "Aumente o foco em tratamentos de alta margem"
    ]
  }
};

// GET /api/financeiro/resumo - Resumo financeiro geral
router.get('/resumo', (req, res) => {
  try {
    res.json({
      success: true,
      data: mockFinanceiroData.resumoFinanceiro
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar resumo financeiro',
      error: error.message
    });
  }
});

// GET /api/financeiro/contas-receber - Lista de contas a receber
router.get('/contas-receber', (req, res) => {
  try {
    res.json({
      success: true,
      data: mockFinanceiroData.contasReceber
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar contas a receber',
      error: error.message
    });
  }
});

// GET /api/financeiro/contas-pagar - Lista de contas a pagar
router.get('/contas-pagar', (req, res) => {
  try {
    res.json({
      success: true,
      data: mockFinanceiroData.contasPagar
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar contas a pagar',
      error: error.message
    });
  }
});

// GET /api/financeiro/propostas - Lista de propostas
router.get('/propostas', (req, res) => {
  try {
    res.json({
      success: true,
      data: mockFinanceiroData.propostas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar propostas',
      error: error.message
    });
  }
});

// GET /api/financeiro/fluxo-caixa - Dados do fluxo de caixa
router.get('/fluxo-caixa', (req, res) => {
  try {
    res.json({
      success: true,
      data: mockFinanceiroData.fluxoCaixa
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar fluxo de caixa',
      error: error.message
    });
  }
});

// GET /api/financeiro/ia-insights - Insights da IA
router.get('/ia-insights', (req, res) => {
  try {
    res.json({
      success: true,
      data: mockFinanceiroData.iaInsights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar insights da IA',
      error: error.message
    });
  }
});

// POST /api/financeiro/proposta - Criar nova proposta
router.post('/proposta', (req, res) => {
  try {
    const novaProposta = {
      id: mockFinanceiroData.propostas.length + 1,
      ...req.body,
      dataCreated: new Date().toISOString().split('T')[0]
    };
    
    mockFinanceiroData.propostas.push(novaProposta);
    
    res.json({
      success: true,
      message: 'Proposta criada com sucesso',
      data: novaProposta
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao criar proposta',
      error: error.message
    });
  }
});

// POST /api/financeiro/pix - Gerar PIX
router.post('/pix', (req, res) => {
  try {
    const { valor, descricao } = req.body;
    
    if (!valor || valor <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valor inválido para PIX'
      });
    }
    
    // Simulação de geração de PIX
    const pixData = {
      codigo: `00020126580014BR.GOV.BCB.PIX013636401040-1f40-48ba-9b4f-2b9e3b65454652040000530398654${valor.toFixed(2).padStart(4, '0')}5802BR5921ALTCLINIC ESTETICA LTDA6008SAOPAULO62070503***6304${Math.random().toString(16).substring(2, 6).toUpperCase()}`,
      valor: parseFloat(valor),
      descricao: descricao || 'Pagamento ALTclinic',
      vencimento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      qrCode: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...` // QR Code simulado
    };
    
    res.json({
      success: true,
      message: 'PIX gerado com sucesso',
      data: pixData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar PIX',
      error: error.message
    });
  }
});

// PUT /api/financeiro/conta-receber/:id/pagar - Registrar pagamento
router.put('/conta-receber/:id/pagar', (req, res) => {
  try {
    const { id } = req.params;
    const { valorPago, formaPagamento, dataPagamento, observacoes } = req.body;
    
    const conta = mockFinanceiroData.contasReceber.find(c => c.id == id);
    if (!conta) {
      return res.status(404).json({
        success: false,
        message: 'Conta não encontrada'
      });
    }
    
    conta.status = 'paga';
    conta.dataPagamento = dataPagamento || new Date().toISOString().split('T')[0];
    conta.valorPago = valorPago || conta.valor;
    conta.formaPagamento = formaPagamento;
    conta.observacoesPagamento = observacoes;
    
    res.json({
      success: true,
      message: 'Pagamento registrado com sucesso',
      data: conta
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar pagamento',
      error: error.message
    });
  }
});

// PUT /api/financeiro/conta-pagar/:id/pagar - Registrar pagamento de conta a pagar
router.put('/conta-pagar/:id/pagar', (req, res) => {
  try {
    const { id } = req.params;
    const { valorPago, formaPagamento, dataPagamento, observacoes } = req.body;
    
    const conta = mockFinanceiroData.contasPagar.find(c => c.id == id);
    if (!conta) {
      return res.status(404).json({
        success: false,
        message: 'Conta não encontrada'
      });
    }
    
    conta.status = 'paga';
    conta.dataPagamento = dataPagamento || new Date().toISOString().split('T')[0];
    conta.valorPago = valorPago || conta.valor;
    conta.formaPagamento = formaPagamento;
    conta.observacoesPagamento = observacoes;
    
    res.json({
      success: true,
      message: 'Pagamento registrado com sucesso',
      data: conta
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar pagamento',
      error: error.message
    });
  }
});

// GET /api/financeiro/todos - Todos os dados financeiros de uma vez
router.get('/todos', (req, res) => {
  try {
    res.json({
      success: true,
      data: mockFinanceiroData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados financeiros',
      error: error.message
    });
  }
});

module.exports = router;
