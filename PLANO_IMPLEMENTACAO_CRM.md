# Plano de Implementação CRM - Etapas Detalhadas

## 🚀 Cronograma de Desenvolvimento

### **FASE 1: FUNDAÇÃO (Dias 1-3)**

#### **Dia 1: Estrutura Base**

```bash
# Estrutura de diretórios a criar:
frontend/src/pages/crm/
frontend/src/components/crm/
frontend/src/hooks/crm/
frontend/src/data/crm/
frontend/src/styles/crm/
```

**Tarefas:**

- [ ] Criar página principal `CRMDashboard.js`
- [ ] Adicionar rota `/crm` no App.js
- [ ] Criar item CRM na Sidebar
- [ ] Estrutura básica de navegação

**Arquivos prioritários:**

1. `frontend/src/pages/crm/CRMDashboard.js`
2. `frontend/src/data/crm/mockCRMData.js`
3. Atualizar `frontend/src/App.js` (rotas)
4. Atualizar `frontend/src/components/common/Sidebar.js`

#### **Dia 2: Dashboard Inicial**

- [ ] Cards de métricas principais
- [ ] Gráfico de engajamento simples
- [ ] Lista de ações rápidas
- [ ] Layout responsivo

**Componentes:**

- `CRMMetricsCards.js`
- `EngagementChart.js`
- `QuickActions.js`

#### **Dia 3: Navegação Interna**

- [ ] Abas do CRM (Mensagens, Clientes, Relatórios, Config)
- [ ] Roteamento interno
- [ ] Breadcrumbs
- [ ] Estados de carregamento

---

### **FASE 2: GESTÃO DE PACIENTES (Dias 4-6)**

#### **Dia 4: Lista de Pacientes**

- [ ] Componente `PacientesList.js`
- [ ] Tabela com dados mock
- [ ] Filtros básicos (nome, status, última consulta)
- [ ] Paginação

**Funcionalidades:**

- Busca por nome
- Filtro por status (ativo/inativo)
- Ordenação por colunas
- 50 pacientes mock iniciais

#### **Dia 5: Segmentação**

- [ ] Sistema de tags
- [ ] Filtros avançados
- [ ] Segmentos predefinidos
- [ ] Criação de segmentos customizados

**Segmentos iniciais:**

- Pacientes ativos (< 30 dias)
- Inativos (30-90 dias)
- Perdidos (> 90 dias)
- Alto valor (> R$ 1.000)

#### **Dia 6: Perfil do Paciente**

- [ ] Modal detalhado do paciente
- [ ] Histórico de consultas
- [ ] Valor total gasto
- [ ] Última interação
- [ ] Botões de ação rápida

---

### **FASE 3: SISTEMA DE MENSAGENS (Dias 7-9)**

#### **Dia 7: Templates**

- [ ] Página de configuração de templates
- [ ] CRUD de templates
- [ ] Placeholders dinâmicos
- [ ] Preview em tempo real

**Templates iniciais:**

- Confirmação de consulta
- Lembrete de consulta
- Pós-atendimento
- Reativação de inativo
- Aniversário

#### **Dia 8: Envio Manual**

- [ ] Seleção de destinatários
- [ ] Escolha de template
- [ ] Personalização da mensagem
- [ ] Preview antes do envio
- [ ] Log de envios

#### **Dia 9: Histórico de Mensagens**

- [ ] Timeline de mensagens por paciente
- [ ] Status de entrega (mock)
- [ ] Respostas simuladas
- [ ] Métricas de abertura

---

### **FASE 4: AUTOMAÇÃO BÁSICA (Dias 10-12)**

#### **Dia 10: Triggers de Sistema**

- [ ] Hook para detectar novos agendamentos
- [ ] Hook para detectar cancelamentos
- [ ] Hook para detectar consultas finalizadas
- [ ] Sistema de filas de mensagens

#### **Dia 11: Detecção de Inativos**

- [ ] Algoritmo para classificar inativos
- [ ] Cron job simulado (setInterval)
- [ ] Alertas automáticos
- [ ] Sugestões de ação

#### **Dia 12: Envios Automáticos**

- [ ] Sistema de agendamento de mensagens
- [ ] Processamento de fila
- [ ] Logs de automação
- [ ] Configurações de timing

---

### **FASE 5: RELATÓRIOS (Dias 13-15)**

#### **Dia 13: Relatório de Ativação**

- [ ] Lista de pacientes para reativação
- [ ] Priorização por potencial
- [ ] Sugestões de abordagem
- [ ] Exportação CSV

#### **Dia 14: Métricas de Engajamento**

- [ ] Dashboard de performance
- [ ] Taxa de abertura
- [ ] Taxa de resposta
- [ ] Conversões (agendamentos)

#### **Dia 15: Analytics Avançados**

- [ ] Gráficos de tendência
- [ ] Comparativo mensal
- [ ] ROI das campanhas
- [ ] Insights automáticos

---

### **FASE 6: BACKEND E INTEGRAÇÃO (Dias 16-18)**

#### **Dia 16: APIs Backend**

- [ ] Rotas para CRM (`/api/crm/`)
- [ ] CRUD de pacientes
- [ ] CRUD de mensagens
- [ ] CRUD de templates

#### **Dia 17: Banco de Dados**

- [ ] Tabelas para CRM
- [ ] Relacionamentos com agendamento
- [ ] Relacionamentos com financeiro
- [ ] Migração de dados

#### **Dia 18: Integração Frontend-Backend**

- [ ] Substituir dados mock por API
- [ ] Tratamento de erros
- [ ] Loading states
- [ ] Otimização de performance

---

## 📋 Checklist de Implementação

### **Estrutura de Arquivos Completa**

```
frontend/src/
├── pages/crm/
│   ├── CRMDashboard.js          ✅ Dia 1
│   ├── MensagensPage.js         ✅ Dia 7
│   ├── ClientesPage.js          ✅ Dia 4
│   ├── RelatoriosPage.js        ✅ Dia 13
│   └── ConfiguracoesPage.js     ✅ Dia 7
├── components/crm/
│   ├── dashboard/
│   │   ├── CRMMetricsCards.js   ✅ Dia 2
│   │   ├── EngagementChart.js   ✅ Dia 2
│   │   └── QuickActions.js      ✅ Dia 2
│   ├── pacientes/
│   │   ├── PacientesList.js     ✅ Dia 4
│   │   ├── PacienteModal.js     ✅ Dia 6
│   │   ├── SegmentFilter.js     ✅ Dia 5
│   │   └── PacienteTags.js      ✅ Dia 5
│   ├── mensagens/
│   │   ├── MessageTemplate.js   ✅ Dia 7
│   │   ├── MessageComposer.js   ✅ Dia 8
│   │   ├── MessageHistory.js    ✅ Dia 9
│   │   └── SendModal.js         ✅ Dia 8
│   ├── relatorios/
│   │   ├── AtivacaoReport.js    ✅ Dia 13
│   │   ├── EngagementMetrics.js ✅ Dia 14
│   │   └── AnalyticsChart.js    ✅ Dia 15
│   └── automacao/
│       ├── TriggerConfig.js     ✅ Dia 10
│       ├── CronJobs.js          ✅ Dia 11
│       └── AutomationLog.js     ✅ Dia 12
├── hooks/crm/
│   ├── useCRM.js                ✅ Dia 1
│   ├── usePacientes.js          ✅ Dia 4
│   ├── useMensagens.js          ✅ Dia 7
│   ├── useRelatorios.js         ✅ Dia 13
│   └── useAutomacao.js          ✅ Dia 10
├── data/crm/
│   ├── mockCRMData.js           ✅ Dia 1
│   ├── mockPacientes.js         ✅ Dia 4
│   ├── mockMensagens.js         ✅ Dia 7
│   └── mockTemplates.js         ✅ Dia 7
├── services/crm/
│   ├── crmAPI.js                ✅ Dia 16
│   ├── messageService.js        ✅ Dia 16
│   └── automationService.js     ✅ Dia 16
└── styles/crm/
    ├── crm.css                  ✅ Dia 1
    ├── pacientes.css            ✅ Dia 4
    └── mensagens.css            ✅ Dia 7

backend/
├── routes/crm/
│   ├── pacientes.js             ✅ Dia 16
│   ├── mensagens.js             ✅ Dia 16
│   ├── templates.js             ✅ Dia 16
│   ├── relatorios.js            ✅ Dia 16
│   └── automacao.js             ✅ Dia 16
├── models/crm/
│   ├── Paciente.js              ✅ Dia 17
│   ├── Mensagem.js              ✅ Dia 17
│   ├── Template.js              ✅ Dia 17
│   └── Segmento.js              ✅ Dia 17
└── services/crm/
    ├── crmService.js            ✅ Dia 17
    ├── automationService.js     ✅ Dia 17
    └── notificationService.js   ✅ Dia 17
```

### **Métricas de Sucesso**

#### **MVP Básico (Dia 12)**

- [ ] Dashboard funcional
- [ ] 100+ pacientes mock
- [ ] 5+ templates configurados
- [ ] Envio manual funcional
- [ ] Segmentação básica

#### **MVP Completo (Dia 18)**

- [ ] Automação funcionando
- [ ] Relatórios gerados
- [ ] APIs funcionais
- [ ] Integração com agendamento
- [ ] Performance <3s

### **Próxima Sessão de Desenvolvimento**

**Prioridade 1:** Começar pela FASE 1 - Dias 1-3

- Criar estrutura base
- Dashboard inicial
- Navegação interna

**Comando inicial:**

```bash
# Criar diretórios
mkdir -p frontend/src/pages/crm
mkdir -p frontend/src/components/crm
mkdir -p frontend/src/hooks/crm
mkdir -p frontend/src/data/crm
mkdir -p frontend/src/styles/crm
```

**Está pronto para começar a implementação?** 🚀
