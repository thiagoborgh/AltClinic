const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * ROTAS FINANCEIRAS - FIRESTORE
 * Gerenciamento completo do módulo financeiro
 */

// GET /api/financeiro/resumo - Obter resumo financeiro
router.get('/resumo', async (req, res) => {
  try {
    const { tenantId } = req;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log(`📊 Firestore: Buscando resumo financeiro do tenant ${tenantId}`);

    // Buscar contas a receber
    const contasReceberSnapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('contas_receber')
      .get();

    // Buscar contas a pagar
    const contasPagarSnapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('contas_pagar')
      .get();

    let receitaMensal = 0;
    let contasReceberTotal = 0;
    
    contasReceberSnapshot.forEach(doc => {
      const conta = doc.data();
      if (conta.status === 'pago') {
        receitaMensal += conta.valor || 0;
      } else {
        contasReceberTotal += conta.valor || 0;
      }
    });

    let despesaMensal = 0;
    let contasPagarTotal = 0;
    
    contasPagarSnapshot.forEach(doc => {
      const conta = doc.data();
      if (conta.status === 'pago') {
        despesaMensal += conta.valor || 0;
      } else {
        contasPagarTotal += conta.valor || 0;
      }
    });

    const lucroMensal = receitaMensal - despesaMensal;
    const saldoAtual = lucroMensal;

    const resumo = {
      saldoAtual,
      receitaMensal,
      despesaMensal,
      lucroMensal,
      contasReceber: contasReceberTotal,
      contasPagar: contasPagarTotal,
      metaMensal: 35000.00,
      percentualMeta: (receitaMensal / 35000.00) * 100
    };

    res.json({
      success: true,
      data: resumo
    });

  } catch (error) {
    console.error('❌ Erro ao buscar resumo financeiro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar resumo financeiro',
      error: error.message
    });
  }
});

// GET /api/financeiro/contas-receber - Listar contas a receber
router.get('/contas-receber', async (req, res) => {
  try {
    const { tenantId } = req;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log(`💰 Firestore: Buscando contas a receber do tenant ${tenantId}`);

    const snapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('contas_receber')
      .orderBy('dataVencimento', 'desc')
      .get();

    const contas = [];
    snapshot.forEach(doc => {
      contas.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: contas
    });

  } catch (error) {
    console.error('❌ Erro ao buscar contas a receber:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar contas a receber',
      error: error.message
    });
  }
});

// POST /api/financeiro/conta-receber - Criar conta a receber
router.post('/conta-receber', async (req, res) => {
  try {
    const { tenantId } = req;
    const dados = req.body;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log('💰 Firestore: Criando conta a receber:', dados);

    const contaData = {
      ...dados,
      tenantId,
      status: dados.status || 'pendente',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('contas_receber')
      .add(contaData);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...contaData
      },
      message: 'Conta a receber criada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao criar conta a receber:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar conta a receber',
      error: error.message
    });
  }
});

// PUT /api/financeiro/conta-receber/:id/pagar - Registrar pagamento
router.put('/conta-receber/:id/pagar', async (req, res) => {
  try {
    const { tenantId } = req;
    const { id } = req.params;
    const { valorRecebido, formaPagamento, dataPagamento } = req.body;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log(`💰 Firestore: Registrando pagamento da conta ${id}`);

    await db
      .collection('tenants')
      .doc(tenantId)
      .collection('contas_receber')
      .doc(id)
      .update({
        status: 'pago',
        valorRecebido: valorRecebido || 0,
        formaPagamento: formaPagamento || 'pix',
        dataPagamento: dataPagamento || new Date().toISOString(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    const docSnapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('contas_receber')
      .doc(id)
      .get();

    res.json({
      success: true,
      data: {
        id: docSnapshot.id,
        ...docSnapshot.data()
      },
      message: 'Pagamento registrado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao registrar pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar pagamento',
      error: error.message
    });
  }
});

// GET /api/financeiro/contas-pagar - Listar contas a pagar
router.get('/contas-pagar', async (req, res) => {
  try {
    const { tenantId } = req;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log(`💳 Firestore: Buscando contas a pagar do tenant ${tenantId}`);

    const snapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('contas_pagar')
      .orderBy('dataVencimento', 'desc')
      .get();

    const contas = [];
    snapshot.forEach(doc => {
      contas.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: contas
    });

  } catch (error) {
    console.error('❌ Erro ao buscar contas a pagar:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar contas a pagar',
      error: error.message
    });
  }
});

// POST /api/financeiro/conta-pagar - Criar conta a pagar
router.post('/conta-pagar', async (req, res) => {
  try {
    const { tenantId } = req;
    const dados = req.body;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log('💳 Firestore: Criando conta a pagar:', dados);

    const contaData = {
      ...dados,
      tenantId,
      status: dados.status || 'pendente',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('contas_pagar')
      .add(contaData);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...contaData
      },
      message: 'Conta a pagar criada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao criar conta a pagar:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar conta a pagar',
      error: error.message
    });
  }
});

// PUT /api/financeiro/conta-pagar/:id/pagar - Registrar pagamento
router.put('/conta-pagar/:id/pagar', async (req, res) => {
  try {
    const { tenantId } = req;
    const { id } = req.params;
    const { valorPago, formaPagamento, dataPagamento } = req.body;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log(`💳 Firestore: Registrando pagamento da conta ${id}`);

    await db
      .collection('tenants')
      .doc(tenantId)
      .collection('contas_pagar')
      .doc(id)
      .update({
        status: 'pago',
        valorPago: valorPago || 0,
        formaPagamento: formaPagamento || 'pix',
        dataPagamento: dataPagamento || new Date().toISOString(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    const docSnapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('contas_pagar')
      .doc(id)
      .get();

    res.json({
      success: true,
      data: {
        id: docSnapshot.id,
        ...docSnapshot.data()
      },
      message: 'Pagamento registrado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao registrar pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar pagamento',
      error: error.message
    });
  }
});

// GET /api/financeiro/propostas - Listar propostas
router.get('/propostas', async (req, res) => {
  try {
    const { tenantId } = req;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log(`📋 Firestore: Buscando propostas do tenant ${tenantId}`);

    const snapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('propostas')
      .orderBy('createdAt', 'desc')
      .get();

    const propostas = [];
    snapshot.forEach(doc => {
      propostas.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: propostas
    });

  } catch (error) {
    console.error('❌ Erro ao buscar propostas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar propostas',
      error: error.message
    });
  }
});

// POST /api/financeiro/proposta - Criar proposta
router.post('/proposta', async (req, res) => {
  try {
    const { tenantId } = req;
    const dados = req.body;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log('📋 Firestore: Criando proposta:', dados);

    // Gerar número da proposta
    const ano = new Date().getFullYear();
    const snapshot = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('propostas')
      .get();
    
    const numero = `PROP-${ano}-${String(snapshot.size + 1).padStart(3, '0')}`;

    const propostaData = {
      ...dados,
      numero,
      tenantId,
      status: dados.status || 'pendente',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('propostas')
      .add(propostaData);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...propostaData
      },
      message: 'Proposta criada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao criar proposta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar proposta',
      error: error.message
    });
  }
});

// GET /api/financeiro/fluxo-caixa - Obter fluxo de caixa
router.get('/fluxo-caixa', async (req, res) => {
  try {
    const { tenantId } = req;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log(`📈 Firestore: Buscando fluxo de caixa do tenant ${tenantId}`);

    // Buscar transações do último mês
    const dataInicio = new Date();
    dataInicio.setMonth(dataInicio.getMonth() - 1);

    const [receberSnapshot, pagarSnapshot] = await Promise.all([
      db.collection('tenants').doc(tenantId).collection('contas_receber')
        .where('status', '==', 'pago')
        .get(),
      db.collection('tenants').doc(tenantId).collection('contas_pagar')
        .where('status', '==', 'pago')
        .get()
    ]);

    const fluxo = [];
    const diasMap = new Map();

    // Processar receitas
    receberSnapshot.forEach(doc => {
      const conta = doc.data();
      const data = conta.dataPagamento?.split('T')[0] || new Date().toISOString().split('T')[0];
      
      if (!diasMap.has(data)) {
        diasMap.set(data, { data, receitas: 0, despesas: 0 });
      }
      
      const dia = diasMap.get(data);
      dia.receitas += conta.valor || 0;
    });

    // Processar despesas
    pagarSnapshot.forEach(doc => {
      const conta = doc.data();
      const data = conta.dataPagamento?.split('T')[0] || new Date().toISOString().split('T')[0];
      
      if (!diasMap.has(data)) {
        diasMap.set(data, { data, receitas: 0, despesas: 0 });
      }
      
      const dia = diasMap.get(data);
      dia.despesas += conta.valor || 0;
    });

    // Converter para array e calcular saldo
    let saldoAcumulado = 0;
    Array.from(diasMap.values())
      .sort((a, b) => a.data.localeCompare(b.data))
      .forEach(dia => {
        saldoAcumulado += dia.receitas - dia.despesas;
        fluxo.push({
          ...dia,
          saldo: saldoAcumulado
        });
      });

    res.json({
      success: true,
      data: fluxo
    });

  } catch (error) {
    console.error('❌ Erro ao buscar fluxo de caixa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar fluxo de caixa',
      error: error.message
    });
  }
});

// GET /api/financeiro/ia-insights - Obter insights de IA
router.get('/ia-insights', async (req, res) => {
  try {
    const { tenantId } = req;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log(`🤖 Firestore: Gerando insights IA para tenant ${tenantId}`);

    // Buscar dados para análise
    const [receberSnapshot, pagarSnapshot] = await Promise.all([
      db.collection('tenants').doc(tenantId).collection('contas_receber').get(),
      db.collection('tenants').doc(tenantId).collection('contas_pagar').get()
    ]);

    const insights = [];

    // Análise de contas vencidas
    let contasVencidas = 0;
    let valorVencido = 0;
    const hoje = new Date().toISOString().split('T')[0];

    receberSnapshot.forEach(doc => {
      const conta = doc.data();
      if (conta.status !== 'pago' && conta.dataVencimento < hoje) {
        contasVencidas++;
        valorVencido += conta.valor || 0;
      }
    });

    if (contasVencidas > 0) {
      insights.push({
        tipo: 'alerta',
        categoria: 'Contas a Receber',
        titulo: 'Contas Vencidas Detectadas',
        descricao: `Você tem ${contasVencidas} conta(s) vencida(s) totalizando R$ ${valorVencido.toFixed(2)}`,
        acao: 'Revisar e cobrar',
        prioridade: 'alta'
      });
    }

    // Análise de fluxo de caixa
    let receitaTotal = 0;
    let despesaTotal = 0;

    receberSnapshot.forEach(doc => {
      const conta = doc.data();
      if (conta.status === 'pago') {
        receitaTotal += conta.valor || 0;
      }
    });

    pagarSnapshot.forEach(doc => {
      const conta = doc.data();
      if (conta.status === 'pago') {
        despesaTotal += conta.valor || 0;
      }
    });

    if (despesaTotal > receitaTotal * 0.7) {
      insights.push({
        tipo: 'sugestao',
        categoria: 'Fluxo de Caixa',
        titulo: 'Despesas Elevadas',
        descricao: `Suas despesas representam ${((despesaTotal/receitaTotal) * 100).toFixed(1)}% da receita`,
        acao: 'Revisar custos operacionais',
        prioridade: 'media'
      });
    }

    // Se não há insights, adicionar mensagem positiva
    if (insights.length === 0) {
      insights.push({
        tipo: 'sucesso',
        categoria: 'Geral',
        titulo: 'Finanças Saudáveis',
        descricao: 'Suas finanças estão em boa ordem! Continue monitorando regularmente.',
        acao: null,
        prioridade: 'baixa'
      });
    }

    res.json({
      success: true,
      data: insights
    });

  } catch (error) {
    console.error('❌ Erro ao gerar insights:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar insights',
      error: error.message
    });
  }
});

// GET /api/financeiro/todos - Obter todos os dados (para dashboard)
router.get('/todos', async (req, res) => {
  try {
    const { tenantId } = req;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'TenantId não encontrado'
      });
    }

    console.log(`📊 Firestore: Buscando todos os dados financeiros do tenant ${tenantId}`);

    // Buscar todos os dados em paralelo
    const [
      contasReceberSnapshot,
      contasPagarSnapshot,
      propostasSnapshot
    ] = await Promise.all([
      db.collection('tenants').doc(tenantId).collection('contas_receber').get(),
      db.collection('tenants').doc(tenantId).collection('contas_pagar').get(),
      db.collection('tenants').doc(tenantId).collection('propostas').get()
    ]);

    const contasReceber = [];
    contasReceberSnapshot.forEach(doc => {
      contasReceber.push({ id: doc.id, ...doc.data() });
    });

    const contasPagar = [];
    contasPagarSnapshot.forEach(doc => {
      contasPagar.push({ id: doc.id, ...doc.data() });
    });

    const propostas = [];
    propostasSnapshot.forEach(doc => {
      propostas.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      success: true,
      data: {
        contasReceber,
        contasPagar,
        propostas
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar dados financeiros:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados financeiros',
      error: error.message
    });
  }
});

module.exports = router;
