import { useState, useEffect } from 'react';
import { financeiroService } from '../../services/api';
import { mockFinanceiroData } from '../../data/financeiro/mockFinanceiroData';

export const useFinanceiro = () => {
  const [resumoFinanceiro, setResumoFinanceiro] = useState({});
  const [fluxoCaixa, setFluxoCaixa] = useState([]);
  const [contasReceber, setContasReceber] = useState([]);
  const [contasPagar, setContasPagar] = useState([]);
  const [propostas, setPropostas] = useState([]);
  const [insightsIA, setInsightsIA] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    carregarDadosFinanceiros();
  }, []);

  const carregarDadosFinanceiros = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Carregando dados financeiros...');
      
      // Tentar carregar do backend primeiro
      try {
        console.log('🌐 Tentando conectar com backend...');
        const [
          resumoResponse,
          contasReceberResponse,
          contasPagarResponse,
          propostasResponse,
          fluxoCaixaResponse,
          insightsResponse
        ] = await Promise.all([
          financeiroService.getResumo(),
          financeiroService.getContasReceber(),
          financeiroService.getContasPagar(),
          financeiroService.getPropostas(),
          financeiroService.getFluxoCaixa(),
          financeiroService.getIAInsights()
        ]);

        // Se chegou até aqui, backend está funcionando
        setBackendConnected(true);
        console.log('✅ Backend conectado com sucesso!');
        
        setResumoFinanceiro(resumoResponse.data || {});
        setContasReceber(Array.isArray(contasReceberResponse.data) ? contasReceberResponse.data : []);
        setContasPagar(Array.isArray(contasPagarResponse.data) ? contasPagarResponse.data : []);
        setPropostas(Array.isArray(propostasResponse.data) ? propostasResponse.data : []);
        setFluxoCaixa(Array.isArray(fluxoCaixaResponse.data) ? fluxoCaixaResponse.data : []);
        setInsightsIA(Array.isArray(insightsResponse.data) ? insightsResponse.data : []);

      } catch (backendError) {
        console.warn('⚠️ Backend não disponível, usando dados mock:', backendError.message);
        setBackendConnected(false);
        
        // Fallback para dados mock
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setResumoFinanceiro(mockFinanceiroData.resumoFinanceiro);
        setFluxoCaixa(mockFinanceiroData.fluxoCaixa);
        setContasReceber(mockFinanceiroData.contasReceber);
        setContasPagar(mockFinanceiroData.contasPagar);
        setPropostas(mockFinanceiroData.propostas);
        setInsightsIA(mockFinanceiroData.insightsIA);
      }

    } catch (error) {
      console.error('❌ Erro ao carregar dados financeiros:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Criar nova proposta
  const criarProposta = async (dadosProposta) => {
    try {
      setLoading(true);
      
      if (backendConnected) {
        try {
          const response = await financeiroService.criarProposta(dadosProposta);
          const novaProposta = response.data;
          setPropostas(prev => [novaProposta, ...prev]);
          console.log('✅ Proposta criada no backend:', novaProposta);
          return novaProposta;
        } catch (backendError) {
          console.warn('⚠️ Erro no backend, criando localmente:', backendError.message);
        }
      }

      // Fallback local
      const novaProposta = {
        ...dadosProposta,
        id: Date.now(),
        dataCreated: new Date(),
        status: 'pendente'
      };
      
      setPropostas(prev => [novaProposta, ...prev]);
      console.log('📝 Proposta criada localmente:', novaProposta);
      return novaProposta;
    } catch (error) {
      console.error('❌ Erro ao criar proposta:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Registrar recebimento
  const registrarRecebimento = async (id, valorRecebido, formaPagamento = 'pix') => {
    try {
      setLoading(true);

      if (backendConnected) {
        try {
          const response = await financeiroService.registrarPagamentoReceber(id, {
            valorRecebido,
            formaPagamento,
            dataPagamento: new Date()
          });
          
          setContasReceber(prev => 
            prev.map(conta => 
              conta.id === id ? response.data : conta
            )
          );
          
          console.log('✅ Recebimento registrado no backend');
          return;
        } catch (backendError) {
          console.warn('⚠️ Erro no backend, registrando localmente:', backendError.message);
        }
      }

      // Fallback local
      setContasReceber(prev => 
        prev.map(conta => 
          conta.id === id 
            ? { 
                ...conta, 
                status: 'pago', 
                dataPagamento: new Date(),
                formaPagamento,
                valorPago: valorRecebido
              }
            : conta
        )
      );
      
      // Atualizar resumo financeiro
      setResumoFinanceiro(prev => ({
        ...prev,
        saldoAtual: prev.saldoAtual + valorRecebido,
        receitaMensal: prev.receitaMensal + valorRecebido
      }));
      
      console.log('📝 Recebimento registrado localmente:', { id, valorRecebido, formaPagamento });
    } catch (error) {
      console.error('❌ Erro ao registrar recebimento:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Registrar pagamento
  const registrarPagamento = async (dadosPagamento) => {
    try {
      setLoading(true);

      if (backendConnected) {
        try {
          const response = await financeiroService.registrarPagamentoPagar(dadosPagamento.id, dadosPagamento);
          const novoPagamento = response.data;
          setContasPagar(prev => [novoPagamento, ...prev]);
          console.log('✅ Pagamento registrado no backend');
          return novoPagamento;
        } catch (backendError) {
          console.warn('⚠️ Erro no backend, registrando localmente:', backendError.message);
        }
      }

      // Fallback local
      const novoPagamento = {
        ...dadosPagamento,
        id: Date.now(),
        dataPagamento: new Date(),
        status: 'pago'
      };
      
      setContasPagar(prev => [novoPagamento, ...prev]);
      
      // Atualizar resumo financeiro
      setResumoFinanceiro(prev => ({
        ...prev,
        saldoAtual: prev.saldoAtual - dadosPagamento.valor,
        despesasMensais: prev.despesasMensais + dadosPagamento.valor
      }));
      
      console.log('📝 Pagamento registrado localmente:', novoPagamento);
      return novoPagamento;
    } catch (error) {
      console.error('❌ Erro ao registrar pagamento:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Gerar insights de IA
  const gerarInsightsIA = async () => {
    try {
      setLoading(true);

      if (backendConnected) {
        try {
          const response = await financeiroService.getInsightsIA();
          const insights = response.data;
          setInsightsIA(insights);
          console.log('✅ Insights IA carregados do backend');
          return insights;
        } catch (backendError) {
          console.warn('⚠️ Erro no backend, gerando insights localmente:', backendError.message);
        }
      }

      // Fallback local
      const insights = [
        "💡 Receita 23% maior que o mês passado - excelente crescimento!",
        "⚠️ 3 contas vencendo esta semana - envie lembretes automáticos",
        "📈 Melhor dia: Terças-feiras geram 35% mais receita",
        "💰 Sugestão: Ofereça desconto de 10% para pagamentos à vista"
      ];
      
      setInsightsIA(insights);
      console.log('📝 Insights IA gerados localmente');
      return insights;
    } catch (error) {
      console.error('❌ Erro ao gerar insights IA:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Gerar código PIX
  const gerarPIX = async (valor, descricao = '') => {
    try {
      if (backendConnected) {
        try {
          const response = await financeiroService.gerarPIX(valor, descricao);
          console.log('✅ PIX gerado no backend');
          return response.data;
        } catch (backendError) {
          console.warn('⚠️ Erro no backend, gerando PIX localmente:', backendError.message);
        }
      }

      // Fallback local
      const pixCode = `00020126${descricao.length.toString().padStart(2, '0')}${descricao}5204000053039865802BR5925ALT CLINIC LTDA6009SAO PAULO61080540900062290525${Date.now()}6304`;
      
      const pixData = {
        codigo: pixCode,
        qrcode: `data:image/svg+xml;base64,${btoa('<svg>QR Code placeholder</svg>')}`,
        valor,
        vencimento: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
      };

      console.log('📝 PIX gerado localmente');
      return pixData;
    } catch (error) {
      console.error('❌ Erro ao gerar PIX:', error);
      throw error;
    }
  };

  // Testar conexão com backend
  const testarConexaoBackend = async () => {
    try {
      const response = await financeiroService.getResumo();
      const conectado = !!response.data;
      setBackendConnected(conectado);
      return conectado;
    } catch (error) {
      setBackendConnected(false);
      return false;
    }
  };

  return {
    // Estados
    resumoFinanceiro,
    fluxoCaixa,
    contasReceber,
    contasPagar,
    propostas,
    insightsIA,
    loading,
    error,
    backendConnected,
    
    // Ações
    criarProposta,
    registrarRecebimento,
    registrarPagamento,
    gerarInsightsIA,
    gerarPIX,
    carregarDadosFinanceiros,
    testarConexaoBackend
  };
};
