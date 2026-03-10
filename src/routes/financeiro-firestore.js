const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
let db;
try { db = admin.firestore(); } catch (_) { db = null; }

// ── SQLite helpers (fallback quando Firestore indisponível) ───────────────────

function getSQLiteDb(req) {
  return req.db || null;
}

function getMonthRange(offsetMonths) {
  const d = new Date();
  d.setMonth(d.getMonth() + (offsetMonths || 0));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return { start: y + '-' + m + '-01', end: y + '-' + m + '-31' };
}

async function safeGet(sqliteDb, sql, params) {
  try { return await sqliteDb.get(sql, params); } catch { return null; }
}

async function safeAll(sqliteDb, sql, params) {
  try { return await sqliteDb.all(sql, params); } catch { return []; }
}

/**
 * ROTAS FINANCEIRAS - FIRESTORE
 * Gerenciamento completo do módulo financeiro
 */

// GET /api/financeiro/resumo - Obter resumo financeiro
router.get('/resumo', async (req, res) => {
  try {
    const { tenantId } = req;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'TenantId não encontrado' });
    }

    const sqliteDb = getSQLiteDb(req);

    // ── SQLite (fonte primária) ──────────────────────────────────────────────
    if (sqliteDb) {
      const month = getMonthRange(0);
      const prevMonth = getMonthRange(-1);

      const recRow = await safeGet(sqliteDb,
        "SELECT COALESCE(SUM(valor),0) as total FROM agendamentos_lite WHERE tenant_id=$1 AND data BETWEEN $2 AND $3 AND valor>0",
        [tenantId, month.start, month.end]
      );
      const prevRow = await safeGet(sqliteDb,
        "SELECT COALESCE(SUM(valor),0) as total FROM agendamentos_lite WHERE tenant_id=$1 AND data BETWEEN $2 AND $3 AND valor>0",
        [tenantId, prevMonth.start, prevMonth.end]
      );
      const fatReceberRow = await safeGet(sqliteDb,
        "SELECT COALESCE(SUM(valor),0) as total FROM faturas WHERE tenant_id=$1 AND (status='pendente' OR status='aberta')",
        [tenantId]
      );

      const receitaMensal = recRow ? parseFloat(recRow.total) : 0;
      const prevReceita = prevRow ? parseFloat(prevRow.total) : 0;
      const contasReceberTotal = fatReceberRow ? parseFloat(fatReceberRow.total) : 0;
      const metaMensal = 10000;

      return res.json({
        success: true,
        data: {
          saldoAtual: receitaMensal,
          receitaMensal,
          despesaMensal: 0,
          lucroMensal: receitaMensal,
          variacao: prevReceita > 0 ? parseFloat(((receitaMensal - prevReceita) / prevReceita * 100).toFixed(1)) : 0,
          contasReceber: contasReceberTotal,
          contasPagar: 0,
          metaMensal,
          percentualMeta: metaMensal > 0 ? parseFloat((receitaMensal / metaMensal * 100).toFixed(1)) : 0
        }
      });
    }

    // ── Firestore fallback ───────────────────────────────────────────────────
    if (!db) {
      return res.json({ success: true, data: { saldoAtual: 0, receitaMensal: 0, despesaMensal: 0, lucroMensal: 0, contasReceber: 0, contasPagar: 0, metaMensal: 10000, percentualMeta: 0 } });
    }

    const [contasReceberSnapshot, contasPagarSnapshot] = await Promise.all([
      db.collection('tenants').doc(tenantId).collection('contas_receber').get(),
      db.collection('tenants').doc(tenantId).collection('contas_pagar').get()
    ]);

    let receitaMensal = 0, contasReceberTotal = 0, despesaMensal = 0, contasPagarTotal = 0;
    contasReceberSnapshot.forEach(doc => {
      const conta = doc.data();
      if (conta.status === 'pago') receitaMensal += conta.valor || 0;
      else contasReceberTotal += conta.valor || 0;
    });
    contasPagarSnapshot.forEach(doc => {
      const conta = doc.data();
      if (conta.status === 'pago') despesaMensal += conta.valor || 0;
      else contasPagarTotal += conta.valor || 0;
    });

    res.json({ success: true, data: {
      saldoAtual: receitaMensal - despesaMensal, receitaMensal, despesaMensal,
      lucroMensal: receitaMensal - despesaMensal,
      contasReceber: contasReceberTotal, contasPagar: contasPagarTotal,
      metaMensal: 35000, percentualMeta: (receitaMensal / 35000) * 100
    }});

  } catch (error) {
    console.error('Erro ao buscar resumo financeiro:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar resumo financeiro', error: error.message });
  }
});

// GET /api/financeiro/contas-receber - Listar contas a receber
router.get('/contas-receber', async (req, res) => {
  try {
    const { tenantId } = req;
    if (!tenantId) return res.status(400).json({ success: false, message: 'TenantId não encontrado' });

    const sqliteDb = getSQLiteDb(req);
    if (sqliteDb) {
      // Tenta buscar da tabela faturas
      const rows = await safeAll(sqliteDb,
        "SELECT id, descricao, valor, vencimento as dataVencimento, status, data_pagamento as dataPagamento, created_at as dataEmissao FROM faturas WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 50",
        [tenantId]
      );
      // Se faturas vazia, derivar de agendamentos com valor pendente
      if (!rows.length) {
        const appts = await safeAll(sqliteDb,
          "SELECT id, paciente as cliente, procedimento as descricao, valor, data as dataVencimento, status FROM agendamentos_lite WHERE tenant_id=$1 AND valor>0 AND status NOT IN ('cancelado','realizado') ORDER BY data DESC LIMIT 20",
          [tenantId]
        );
        return res.json({ success: true, data: appts.map(a => ({ ...a, status: 'pendente' })) });
      }
      return res.json({ success: true, data: rows });
    }

    if (!db) return res.json({ success: true, data: [] });

    const snapshot = await db.collection('tenants').doc(tenantId).collection('contas_receber').orderBy('dataVencimento', 'desc').get();
    const contas = [];
    snapshot.forEach(doc => contas.push({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: contas });

  } catch (error) {
    console.error('Erro ao buscar contas a receber:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar contas a receber', error: error.message });
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
      return res.status(400).json({ success: false, message: 'TenantId não encontrado' });
    }

    const sqliteDb = getSQLiteDb(req);

    // ── SQLite (fonte primária) ──────────────────────────────────────────────
    if (sqliteDb) {
      // Agrupamento por data dos últimos 30 dias
      const rows = await safeAll(sqliteDb,
        "SELECT data, COALESCE(SUM(CASE WHEN valor>0 THEN valor ELSE 0 END),0) as receitas FROM agendamentos_lite WHERE tenant_id=$1 AND data >= (NOW() - INTERVAL '30 days')::date GROUP BY data ORDER BY data ASC",
        [tenantId]
      );

      let saldoAcumulado = 0;
      const fluxo = rows.map(r => {
        saldoAcumulado += r.receitas;
        return { data: r.data, receitas: r.receitas, despesas: 0, saldo: saldoAcumulado };
      });

      return res.json({ success: true, data: fluxo });
    }

    // ── Firestore fallback ───────────────────────────────────────────────────
    if (!db) return res.json({ success: true, data: [] });

    const [receberSnapshot, pagarSnapshot] = await Promise.all([
      db.collection('tenants').doc(tenantId).collection('contas_receber').where('status', '==', 'pago').get(),
      db.collection('tenants').doc(tenantId).collection('contas_pagar').where('status', '==', 'pago').get()
    ]);

    const diasMap = new Map();
    receberSnapshot.forEach(doc => {
      const conta = doc.data();
      const data = (conta.dataPagamento || '').split('T')[0] || new Date().toISOString().split('T')[0];
      if (!diasMap.has(data)) diasMap.set(data, { data, receitas: 0, despesas: 0 });
      diasMap.get(data).receitas += conta.valor || 0;
    });
    pagarSnapshot.forEach(doc => {
      const conta = doc.data();
      const data = (conta.dataPagamento || '').split('T')[0] || new Date().toISOString().split('T')[0];
      if (!diasMap.has(data)) diasMap.set(data, { data, receitas: 0, despesas: 0 });
      diasMap.get(data).despesas += conta.valor || 0;
    });

    let saldoAcumulado = 0;
    const fluxo = [];
    Array.from(diasMap.values()).sort((a, b) => a.data.localeCompare(b.data)).forEach(dia => {
      saldoAcumulado += dia.receitas - dia.despesas;
      fluxo.push({ ...dia, saldo: saldoAcumulado });
    });

    res.json({ success: true, data: fluxo });

  } catch (error) {
    console.error('Erro ao buscar fluxo de caixa:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar fluxo de caixa', error: error.message });
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
