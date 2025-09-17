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
  },

  // Configurações financeiras da empresa
  configuracoes: {
    pix: {
      chavePix: "",
      tipoChave: "cpf", // cpf, cnpj, email, telefone, aleatoria
      nomeTitular: "",
      cidade: "",
      ativo: false
    },
    gateways: {
      pagseguro: {
        ativo: false,
        email: "",
        token: "",
        appId: "",
        appKey: ""
      },
      mercadopago: {
        ativo: false,
        publicKey: "",
        accessToken: "",
        clientId: "",
        clientSecret: ""
      },
      stripe: {
        ativo: false,
        publishableKey: "",
        secretKey: "",
        webhookSecret: ""
      }
    },
    gerais: {
      moedaPadrao: "BRL",
      idioma: "pt-BR",
      timezone: "America/Sao_Paulo",
      formatoData: "DD/MM/YYYY",
      emailNotificacoes: "",
      diasVencimentoPadrao: 30,
      jurosMora: 2.0,
      multaAtraso: 2.0,
      permitirParcelamento: true,
      maxParcelas: 12,
      valorMinimoParcela: 50.00
    }
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
    const { valor, descricao, tenant } = req.body;
    
    if (!valor || valor <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valor inválido para PIX'
      });
    }

    // Usar configurações PIX salvas
    const pixConfig = mockFinanceiroData.configuracoes.pix;
    
    if (!pixConfig.ativo || !pixConfig.chavePix) {
      return res.status(400).json({
        success: false,
        message: 'PIX não configurado. Configure primeiro nas configurações financeiras.'
      });
    }

    // Gerar código PIX mais realista baseado nas configurações
    const valorFormatado = valor.toFixed(2);
    const txid = `TXN${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Formato básico do PIX (EMV QR Code)
    const pixCode = [
      '00020101', // Payload Format Indicator
      '021226', // Point of Initiation Method
      `0014BR.GOV.BCB.PIX01${pixConfig.chavePix.length.toString().padStart(2, '0')}${pixConfig.chavePix}`, // Merchant Account Information
      '52040000', // Merchant Category Code
      '5303986', // Transaction Currency (BRL)
      `54${valorFormatado.length.toString().padStart(2, '0')}${valorFormatado}`, // Transaction Amount
      '5802BR', // Country Code
      `59${pixConfig.nomeTitular.length.toString().padStart(2, '0')}${pixConfig.nomeTitular}`, // Merchant Name
      `60${pixConfig.cidade.length.toString().padStart(2, '0')}${pixConfig.cidade}`, // Merchant City
      `62${(7 + txid.length).toString().padStart(2, '0')}05${txid.length.toString().padStart(2, '0')}${txid}`, // Additional Data Field Template
      '6304' // CRC16
    ].join('');

    const pixData = {
      codigo: pixCode,
      valor: parseFloat(valor),
      descricao: descricao || 'Pagamento ALTclinic',
      vencimento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      txid: txid,
      chavePix: pixConfig.chavePix,
      nomeTitular: pixConfig.nomeTitular,
      cidade: pixConfig.cidade,
      tenant: tenant
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

// GET /api/financeiro/configuracoes - Buscar configurações financeiras
router.get('/configuracoes', (req, res) => {
  try {
    res.json({
      success: true,
      data: mockFinanceiroData.configuracoes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar configurações financeiras',
      error: error.message
    });
  }
});

// PUT /api/financeiro/configuracoes - Salvar configurações financeiras
router.put('/configuracoes', (req, res) => {
  try {
    const { pix, gateways, gerais } = req.body;

    // Validação básica
    if (!pix || !gateways || !gerais) {
      return res.status(400).json({
        success: false,
        message: 'Dados de configuração incompletos'
      });
    }

    // Atualizar configurações
    mockFinanceiroData.configuracoes.pix = { ...mockFinanceiroData.configuracoes.pix, ...pix };
    mockFinanceiroData.configuracoes.gateways = { ...mockFinanceiroData.configuracoes.gateways, ...gateways };
    mockFinanceiroData.configuracoes.gerais = { ...mockFinanceiroData.configuracoes.gerais, ...gerais };

    res.json({
      success: true,
      message: 'Configurações salvas com sucesso',
      data: mockFinanceiroData.configuracoes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar configurações',
      error: error.message
    });
  }
});

// Endpoint para buscar histórico de faturas de um tenant específico (admin)
router.get('/admin/invoices/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    // Simulação de dados de histórico de faturas
    const mockInvoices = [
      {
        id: 1,
        subdomain,
        data_geracao: '2024-01-15T10:30:00.000Z',
        valor: '299.90',
        descricao: 'Mensalidade - Plano Profissional',
        status: 'pago',
        metodo_pagamento: 'PIX',
        qr_code: 'EMV_QR_CODE_EXAMPLE_1'
      },
      {
        id: 2,
        subdomain,
        data_geracao: '2024-01-01T09:15:00.000Z',
        valor: '199.90',
        descricao: 'Mensalidade - Plano Básico',
        status: 'pago',
        metodo_pagamento: 'PIX',
        qr_code: 'EMV_QR_CODE_EXAMPLE_2'
      },
      {
        id: 3,
        subdomain,
        data_geracao: '2024-02-15T14:20:00.000Z',
        valor: '299.90',
        descricao: 'Mensalidade - Plano Profissional',
        status: 'pendente',
        metodo_pagamento: 'PIX',
        qr_code: 'EMV_QR_CODE_EXAMPLE_3'
      }
    ];

    res.json({
      success: true,
      invoices: mockInvoices
    });
  } catch (error) {
    console.error('Erro ao buscar histórico de faturas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar histórico de faturas',
      error: error.message
    });
  }
});

// Endpoint para salvar uma nova fatura (quando gerada no financeiro)
router.post('/admin/invoices', async (req, res) => {
  try {
    const { subdomain, valor, descricao, qr_code, metodo_pagamento } = req.body;
    
    // Simular salvamento no banco
    const newInvoice = {
      id: Date.now(),
      subdomain,
      data_geracao: new Date().toISOString(),
      valor: parseFloat(valor).toFixed(2),
      descricao,
      status: 'pendente',
      metodo_pagamento: metodo_pagamento || 'PIX',
      qr_code
    };
    
    console.log('📋 Nova fatura salva:', newInvoice);
    
    res.json({
      success: true,
      invoice: newInvoice,
      message: 'Fatura salva com sucesso'
    });
  } catch (error) {
    console.error('Erro ao salvar fatura:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar fatura',
      error: error.message
    });
  }
});

module.exports = router;
