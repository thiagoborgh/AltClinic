# Sistema de Automações e Workflows — Documentação

## 1. Visão Geral
Sistema inteligente de automação de comunicação que permite criar fluxos automatizados de mensagens baseados em gatilhos específicos, reduzindo trabalho manual e melhorando o engajamento com pacientes.

---

## 2. Tipos de Automações

### 2.1. Gatilhos Temporais
- **Aniversário**: Mensagem automática no aniversário do paciente
- **Consulta Agendada**: Lembrete 24h/2h antes da consulta
- **Follow-up**: Mensagem pós-consulta (1 dia, 1 semana, 1 mês depois)
- **Inatividade**: Reconquista de pacientes inativos (30, 60, 90 dias)

### 2.2. Gatilhos de Ação
- **Novo Paciente**: Sequência de boas-vindas
- **Primeira Consulta**: Orientações pré e pós consulta
- **Cancelamento**: Reagendamento automático
- **Resultado de Exame**: Notificação quando exame fica pronto

### 2.3. Gatilhos de Segmento
- **Mudança de Segmento**: Mensagem quando paciente muda de categoria
- **Alto Valor**: Tratamento VIP para pacientes premium
- **Risco de Churn**: Ações preventivas para retenção

---

## 3. Estrutura de Workflow

### 3.1. Componentes de um Workflow
- **Nome e Descrição**: Identificação clara
- **Gatilho**: Condição que inicia o workflow
- **Filtros**: Critérios para aplicar (segmento, idade, etc.)
- **Sequência de Ações**: Lista ordenada de mensagens/ações
- **Intervalos**: Tempo entre cada ação
- **Status**: Ativo/Inativo/Pausado

### 3.2. Ações Disponíveis
- **Enviar Mensagem**: WhatsApp, Email, SMS
- **Agendar Consulta**: Criar slot de agendamento
- **Adicionar Tag**: Marcar paciente
- **Alterar Segmento**: Reclassificar paciente
- **Enviar Notificação**: Alertar equipe interna

---

## 4. Interface e Componentes

### 4.1. Dashboard de Automações
- Lista de workflows ativos/inativos
- Métricas de performance (taxa de sucesso, engajamento)
- Botão para criar novo workflow
- Status de execução em tempo real

### 4.2. Editor de Workflow
- **Passo 1**: Configuração básica (nome, descrição)
- **Passo 2**: Definição do gatilho
- **Passo 3**: Filtros e critérios
- **Passo 4**: Sequência de ações
- **Passo 5**: Revisão e ativação

### 4.3. Monitoramento
- Log de execuções
- Pacientes em cada etapa do workflow
- Taxa de conversão por etapa
- Relatórios de performance

---

## 5. Componentes Frontend

- `AutomacoesPage.js`: Página principal de automações
- `WorkflowEditor.js`: Editor drag-and-drop de workflows
- `GatilhoSelector.js`: Seleção de gatilhos
- `AcaoEditor.js`: Editor de ações individuais
- `WorkflowMonitor.js`: Monitoramento e logs
- Hooks: `useAutomacoes.js`, `useWorkflows.js`, `useGatilhos.js`

---

## 6. Estrutura de Dados

### 6.1. Workflow
```javascript
{
  id: number,
  nome: string,
  descricao: string,
  gatilho: {
    tipo: 'temporal' | 'acao' | 'segmento',
    evento: string,
    condicoes: object
  },
  filtros: {
    segmentos: array,
    idade_min: number,
    idade_max: number,
    // outros filtros
  },
  acoes: [
    {
      tipo: 'mensagem' | 'agendar' | 'tag',
      conteudo: object,
      intervalo_anterior: number // em horas
    }
  ],
  status: 'ativo' | 'inativo' | 'pausado',
  criado_em: date,
  metricas: {
    execucoes: number,
    sucesso: number,
    falhas: number
  }
}
```

---

## 7. Implementação por Etapas

1. **Estrutura básica**: Componentes e hooks iniciais
2. **Dashboard de automações**: Lista e status de workflows
3. **Editor simples**: Criar workflows básicos (gatilho + 1 ação)
4. **Gatilhos temporais**: Aniversário, consulta, follow-up
5. **Sequências**: Múltiplas ações com intervalos
6. **Monitoramento**: Logs e métricas
7. **Gatilhos avançados**: Ações e segmentos
8. **Interface drag-and-drop**: Editor visual
