import { useState } from 'react';

// Hook para gerenciar automações e workflows
const useAutomacoes = () => {
  const [workflows, setWorkflows] = useState([
    // Workflow de exemplo
    {
      id: 1,
      nome: 'Lembrete de Consulta',
      descricao: 'Envia lembrete 24h antes da consulta agendada',
      gatilho: {
        tipo: 'temporal',
        evento: 'consulta_agendada',
        condicoes: { horas_antes: 24 }
      },
      filtros: {
        segmentos: [],
        idade_min: null,
        idade_max: null
      },
      acoes: [
        {
          tipo: 'mensagem',
          conteudo: {
            canal: 'whatsapp',
            template: 'Olá {nome}! Lembramos que você tem consulta marcada para amanhã às {hora}. Confirme sua presença!'
          },
          intervalo_anterior: 0
        }
      ],
      status: 'ativo',
      criado_em: new Date().toISOString(),
      metricas: {
        execucoes: 45,
        sucesso: 42,
        falhas: 3
      }
    },
    {
      id: 2,
      nome: 'Boas-vindas Novo Paciente',
      descricao: 'Sequência de boas-vindas para novos pacientes',
      gatilho: {
        tipo: 'acao',
        evento: 'novo_paciente',
        condicoes: {}
      },
      filtros: {},
      acoes: [
        {
          tipo: 'mensagem',
          conteudo: {
            canal: 'whatsapp',
            template: 'Bem-vindo(a) {nome}! É um prazer tê-lo(a) como nosso paciente.'
          },
          intervalo_anterior: 0
        },
        {
          tipo: 'mensagem',
          conteudo: {
            canal: 'email',
            template: 'Aqui estão algumas informações importantes sobre nossa clínica...'
          },
          intervalo_anterior: 24 // 24 horas depois
        }
      ],
      status: 'pausado',
      criado_em: new Date().toISOString(),
      metricas: {
        execucoes: 12,
        sucesso: 11,
        falhas: 1
      }
    }
  ]);

  const adicionarWorkflow = (novoWorkflow) => {
    const workflow = {
      id: Date.now(),
      ...novoWorkflow,
      criado_em: new Date().toISOString(),
      metricas: {
        execucoes: 0,
        sucesso: 0,
        falhas: 0
      }
    };
    setWorkflows(prev => [...prev, workflow]);
    return workflow;
  };

  const toggleWorkflow = (id) => {
    setWorkflows(prev => prev.map(w => 
      w.id === id 
        ? { ...w, status: w.status === 'ativo' ? 'pausado' : 'ativo' }
        : w
    ));
  };

  const excluirWorkflow = (id) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
  };

  const atualizarWorkflow = (id, dadosAtualizados) => {
    setWorkflows(prev => prev.map(w => 
      w.id === id ? { ...w, ...dadosAtualizados } : w
    ));
  };

  return {
    workflows,
    adicionarWorkflow,
    toggleWorkflow,
    excluirWorkflow,
    atualizarWorkflow
  };
};

export default useAutomacoes;
