import { useState, useEffect } from 'react';
import useAutomacoes from './useAutomacoes';

// Hook para simular e executar gatilhos de workflows
const useGatilhos = () => {
  const { workflows } = useAutomacoes();
  const [execucoes, setExecucoes] = useState([]);

  // Simula verificação de gatilhos a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      verificarGatilhos();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [workflows]);

  const verificarGatilhos = () => {
    const agora = new Date();
    
    workflows
      .filter(w => w.status === 'ativo')
      .forEach(workflow => {
        const { gatilho } = workflow;
        
        switch (gatilho.tipo) {
          case 'temporal':
            verificarGatilhoTemporal(workflow, agora);
            break;
          case 'acao':
            // Lógica para gatilhos de ação seria implementada aqui
            break;
          case 'segmento':
            // Lógica para gatilhos de segmento seria implementada aqui
            break;
        }
      });
  };

  const verificarGatilhoTemporal = (workflow, agora) => {
    const { gatilho } = workflow;
    
    switch (gatilho.evento) {
      case 'aniversario':
        // Simula verificação de aniversários hoje
        if (Math.random() < 0.1) { // 10% de chance de simular aniversário
          executarWorkflow(workflow, 'Aniversário detectado');
        }
        break;
        
      case 'consulta_agendada':
        // Simula verificação de consultas nas próximas 24h
        if (Math.random() < 0.2) { // 20% de chance de simular consulta
          executarWorkflow(workflow, 'Consulta em 24h detectada');
        }
        break;
        
      case 'inatividade':
        // Simula verificação de pacientes inativos
        if (Math.random() < 0.05) { // 5% de chance
          executarWorkflow(workflow, 'Paciente inativo detectado');
        }
        break;
    }
  };

  const executarWorkflow = (workflow, motivo) => {
    const execucao = {
      id: Date.now(),
      workflowId: workflow.id,
      workflowNome: workflow.nome,
      motivo,
      data: new Date().toISOString(),
      status: 'executando',
      acoes: workflow.acoes.map((acao, index) => ({
        index,
        tipo: acao.tipo,
        status: 'pendente',
        resultado: null
      }))
    };

    setExecucoes(prev => [execucao, ...prev.slice(0, 49)]); // Manter últimas 50

    // Simular execução das ações
    simularExecucaoAcoes(execucao);
  };

  const simularExecucaoAcoes = async (execucao) => {
    for (let i = 0; i < execucao.acoes.length; i++) {
      // Aguardar um tempo aleatório (simular processamento)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      const sucesso = Math.random() > 0.1; // 90% de sucesso
      
      setExecucoes(prev => prev.map(exec => 
        exec.id === execucao.id 
          ? {
              ...exec,
              acoes: exec.acoes.map((acao, index) => 
                index === i 
                  ? {
                      ...acao,
                      status: sucesso ? 'sucesso' : 'erro',
                      resultado: sucesso ? 'Mensagem enviada com sucesso' : 'Falha no envio'
                    }
                  : acao
              )
            }
          : exec
      ));
    }

    // Marcar execução como concluída
    setExecucoes(prev => prev.map(exec => 
      exec.id === execucao.id 
        ? { ...exec, status: 'concluido' }
        : exec
    ));
  };

  const gatilhoManual = (workflowId, motivo = 'Execução manual') => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow) {
      executarWorkflow(workflow, motivo);
    }
  };

  return {
    execucoes,
    gatilhoManual,
    verificarGatilhos
  };
};

export default useGatilhos;
