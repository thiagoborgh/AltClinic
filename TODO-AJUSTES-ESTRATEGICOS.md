# 📋 TO-DO: Ajustes Estratégicos do Sistema

> **Status:** ✅ Concluído (12/12 itens concluídos - 100% completo)  
> **Última Atualização:** 27/01/2025  
> **Objetivo:** Reduzir churn, aumentar confiabilidade percebida e focar na proposta de valor principal

---

## 🎯 Princípios Norteadores

Antes de qualquer tarefa, lembrar:

1. ✅ **Agenda é o produto** – tudo gira em torno dela
2. ✅ **WhatsApp é missão crítica** – falha sem visibilidade gera cancelamento
3. ✅ **Menos telas, mais ação** – estética não quer sistema complexo
4. ✅ **Controle > Automação cega** – usuário precisa ver e agir
5. ✅ **Primeiro valor em até 10 minutos** – onboarding rápido

---

## 🔴 PRIORIDADE MÁXIMA (Bloqueia Sucesso)

### 1. Status WhatsApp Visível no Header

**Status:** ✅ Concluído (Endpoint + UI implementados)

- [x] Criar/validar endpoint `GET /api/whatsapp/session/status` retornando:
  - `connected` (boolean)
  - `provider` (string)
  - `qrCode` (object | null)
  - `twilioConfigured` (boolean)
- [x] Adicionar polling (10s) no componente `Navbar.js`
- [x] Exibir ícone WhatsApp com cores:
  - 🟢 Verde: Conectado
  - 🟡 Amarelo: Aguardando QR Code
  - 🔴 Cinza: Desconectado
- [ ] Adicionar tooltip com informações detalhadas ao passar o mouse
- [ ] Criar link rápido do ícone para tela de configuração WhatsApp

**Prompt Copilot:**

```
"Adicionar tooltip ao ícone WhatsApp no Navbar mostrando provider, status detalhado e timestamp da última verificação. Ao clicar, redirecionar para /configuracoes com tab WhatsApp ativo."
```

---

### 2. Log de Mensagens WhatsApp

**Status:** ✅ Concluído

- [x] Criar collection Firestore: `tenants/{tenantId}/mensagens_log`
- [x] Estrutura do documento:
  ```javascript
  {
    id: string,
    pacienteId: string,
    pacienteNome: string,
    profissionalId: string,
    profissionalNome: string,
    telefone: string,
    mensagem: string,
    tipo: 'confirmacao' | 'lembrete' | 'manual',
    status: 'enviado' | 'falhou' | 'pendente',
    dataEnvio: timestamp,
    dataAgendamento: timestamp,
    erro: string | null,
    tentativas: number
  }
  ```
- [x] Atualizar `src/services/firestoreWhatsappService.js`:
  - Adicionar método `saveMessageLog(tenantId, logData)`
  - Adicionar método `getMessageLogs(tenantId, filters)`
- [x] Atualizar `src/routes/whatsapp.js`:
  - Registrar log em `POST /send`
  - Registrar log em `POST /send-media`
- [x] Criar rota `GET /api/whatsapp/logs`
- [x] Frontend: criar serviço `crmService.getMensagensLog(filters)`
- [x] Frontend: adicionar aba "Histórico de Mensagens" no CRM
- [x] Implementar botão "Reenviar" para mensagens com falha

**Prompt Copilot:**

```
"Implementar sistema completo de log de mensagens WhatsApp. Criar collection mensagens_log no Firestore, registrar automaticamente cada envio com status, criar endpoint GET /api/whatsapp/logs com filtros, e adicionar interface de histórico no frontend com ação de reenvio."
```

---

### 3. Bloquear Automações quando WhatsApp Desconectado

**Status:** ✅ Concluído

- [x] Criar serviço `src/services/automationGuard.js`:
  ```javascript
  async function canSendAutomation(tenantId) {
    const status = await whatsappWebService.isConnected(tenantId);
    if (!status) {
      await notifyDisconnection(tenantId);
      return false;
    }
    return true;
  }
  ```
- [x] Atualizar todas as automações de envio:
  - Verificar status antes de executar
  - Registrar tentativa bloqueada em log
  - Exibir notificação visual para o usuário
- [x] Frontend: desabilitar botão "Ativar Lembretes" se WhatsApp desconectado
- [x] Exibir alerta fixo quando automações estiverem pausadas

**Prompt Copilot:**

```
"Criar guard de automação que verifica status WhatsApp antes de enviar mensagens. Bloquear todas as automações quando desconectado, registrar em log e exibir alerta visual no frontend indicando que lembretes estão pausados."
```

---

## 🟡 ALTA PRIORIDADE (Reduz Churn)

### 4. Agenda como Tela Inicial (Home)

**Status:** ✅ Concluído

- [x] Atualizar `frontend/src/App.js`:
  - Alterar rota `/` para redirecionar para `/agenda-lite`
  - Remover dashboard genérico da home
- [x] Atualizar menu lateral:
  - Destacar "Agenda" como item principal
  - Reordenar menu para colocar Agenda em primeiro lugar
- [x] Garantir carregamento rápido (<2s):
  - Implementar lazy loading de componentes pesados
  - Suspense com LoadingSpinner para transições suaves
- [x] Testar redirecionamento em todos os pontos de login

**Prompt Copilot:**

```
"Redefinir a rota raiz / para redirecionar automaticamente para /agenda após login. Remover dashboard financeiro da home, destacar Agenda no menu, implementar lazy loading e garantir carregamento abaixo de 2 segundos."
```

---

### 5. Onboarding Guiado (Primeira Ativação)

**Status:** ✅ Concluído

#### 5.1 Estrutura Backend

- [x] Criar collection: `tenants/{tenantId}/onboarding_progress`
- [x] Estrutura:
  ```javascript
  {
    profissionalCriado: boolean,
    horariosDefinidos: boolean,
    whatsappConectado: boolean,
    mensagemTestada: boolean,
    primeiroAgendamento: boolean,
    lembreteAtivado: boolean,
    completedAt: timestamp | null
  }
  ```
- [x] Criar endpoint `GET /api/onboarding/status`
- [x] Criar endpoint `PATCH /api/onboarding/step/:stepName`

#### 5.2 Interface Frontend

- [x] Criar componente `OnboardingWizard.js`:
  - Stepper visual (6 etapas)
  - Modal full-screen não-ignorável até conclusão
  - Indicador de progresso persistente
- [x] **Passo 1:** Cadastro de Profissional
  - Form: nome, especialidade
  - Validação obrigatória
- [x] **Passo 2:** Definição de Horários
  - Seleção de dias da semana
  - Horário início e fim
- [x] **Passo 3:** Conexão WhatsApp
  - Exibir QR Code
  - Polling de status (3s)
  - Auto-avançar quando conectado
- [x] **Passo 4:** Mensagem de Teste
  - Input com número do próprio usuário
  - Botão "Enviar teste"
  - Confirmação visual de envio
- [x] **Passo 5:** Primeiro Agendamento
  - Form simplificado
  - Paciente fictício pré-preenchido (opcional)
- [x] **Passo 6:** Ativar Lembretes
  - Checkbox: "Enviar lembretes 24h antes"
  - Botão "Concluir e Começar"

- [x] Implementar lógica de bloqueio:
  - Não permitir automações sem onboarding completo
  - Exibir badge "Complete o Onboarding" no menu

**Prompt Copilot:**

```
"Criar fluxo de onboarding obrigatório com 6 etapas: cadastro de profissional, definição de horários, conexão WhatsApp com QR Code, envio de mensagem teste, primeiro agendamento e ativação de lembretes. Bloquear automações até conclusão, persistir progresso no Firestore e exibir wizard full-screen no primeiro acesso."
```

---

### 6. Mensagens Humanizadas e Personalizáveis

**Status:** ✅ Concluído (Backend + Frontend implementados)

- [x] Criar collection: `tenants/{tenantId}/templates_mensagens`
- [x] Criar rotas backend: `GET/POST/PUT/DELETE /api/templates`
- [x] Endpoint de seed: `POST /api/templates/seed` com templates padrão
- [x] Templates padrão implementados:
  - Confirmação de agendamento
  - Lembrete de agendamento
  - Cancelamento de agendamento
  - Reagendamento
  - Agradecimento pós-atendimento
- [x] Criar componente `MessageTemplatesManager` com interface completa
- [x] Interface de edição com preview em tempo real
- [x] Suporte a variáveis dinâmicas: `{{nome}}`, `{{hora}}`, `{{clinica}}`, `{{profissional}}`, `{{data}}`
- [x] Validação de templates (limite 300 caracteres)
- [x] Permitir múltiplos templates por tipo
- [x] Integrar na aba "Templates e CRM" das configurações
- [x] Sistema de abas por tipo de template (Confirmação, Lembrete, etc.)

**Arquivos Criados/Modificados:**

- `src/routes/templates.js` - Rotas backend completas
- `frontend/src/services/api.js` - Métodos templateService
- `frontend/src/components/common/MessageTemplatesManager.js` - Componente principal
- `frontend/src/components/configuracoes/ConfiguracoesManager.js` - Integração na aba Templates

---

## 🟢 MÉDIA PRIORIDADE (Experiência)

### 7. Simplificar Menu e Ocultar Funcionalidades Não-MVP

**Status:** ✅ Concluído (Menu simplificado com feature flags)

- [x] Criar arquivo `frontend/src/config/features.js` com controle de features
- [x] Implementar feature flags para todas as funcionalidades do menu
- [x] Modificar `Sidebar.js` para filtrar itens baseado em features habilitadas
- [x] Ocultar funcionalidades avançadas por padrão:
  - Dashboard (false)
  - Financeiro (false)
  - CRM Avançado (false)
  - Relatórios (false)
  - Sala de Espera (false)
  - Licenças (false)
- [x] Manter visíveis apenas funcionalidades MVP:
  - 📅 Agenda (true)
  - 👤 Pacientes (true)
  - 👨‍⚕️ Profissionais (true)
  - 💬 WhatsApp (true)
  - ⚙️ Configurações (true)
- [x] Adicionar variáveis de ambiente no `.env.example` para controle
- [x] Implementar leitura de variáveis `REACT_APP_FEATURE_*` no frontend

**Arquivos Criados/Modificados:**

- `frontend/src/config/features.js` - Sistema de feature flags
- `frontend/src/components/common/Sidebar.js` - Menu filtrado por features
- `.env.example` - Variáveis de ambiente para features

---

### 8. Melhorar Feedback Visual de Ações

**Status:** ✅ Concluído

- [x] Implementar toasts humanizados (substituir alerts):
  - ✅ Sucesso: verde com ícone de check
  - ⚠️ Atenção: amarelo com ícone de alerta
  - ❌ Erro: vermelho com ícone de X
- [x] Mensagens de erro sem "techês":
  - "Não conseguimos salvar" ao invés de "Error 500"
  - "WhatsApp desconectado" ao invés de "Session not found"
- [x] Adicionar loading states em todos os botões de ação
- [x] Implementar skeleton loaders para carregamentos

**Arquivos Criados/Modificados:**

- `frontend/src/hooks/useToast.js` - Hook com mapeamento de erros humanizados
- `frontend/src/App.js` - ToastContainer global
- `frontend/src/components/common/LoadingButton.js` - Botão com loading state
- `frontend/src/components/common/SkeletonLoader.js` - Componente de skeletons
- `frontend/src/components/whatsapp/WhatsAppZAPIIntegration.js` - Alerts substituídos por toasts
- `frontend/src/components/common/MessageTemplatesManager.js` - Preview dialog implementado

---

### 9. Otimizar Performance da Agenda

**Status:** ✅ Concluído

- [x] Implementar paginação/virtualização para listagem de agendamentos
- [x] Cachear dados de profissionais e pacientes no frontend (Zustand)
- [x] Implementar debounce em busca de pacientes (300ms)
- [x] Lazy load de modais pesados
- [x] Comprimir imagens de pacientes (max 200KB)
- [x] Meta: carregar agenda completa em <2 segundos

**Arquivos Criados/Modificados:**

- `frontend/src/stores/agendaCache.js` - Store Zustand para cache de dados
- `frontend/src/hooks/useDebounce.js` - Hook de debounce para busca
- `frontend/src/components/common/LazyModal.js` - Lazy loading de modais
- `frontend/src/components/common/VirtualizedAgendaList.js` - Lista otimizada de agendamentos
- `frontend/src/utils/imageUtils.js` - Utilitários de compressão de imagens
- `frontend/src/pages/AgendaLite.js` - Integração de todas as otimizações

**Prompt Copilot:**

```
"Otimizar performance da tela de Agenda implementando virtualização de lista, cache de dados com Zustand, debounce em buscas, lazy loading de modais e compressão de imagens. Garantir carregamento completo abaixo de 2 segundos."
```

---

## 🔵 BAIXA PRIORIDADE (Refinamento)

### 10. Atualizar Landing Page com Novo Posicionamento

**Status:** ✅ Concluído

- [x] Headline principal:
  ```
  "Organize sua agenda e reduza faltas com lembretes
  automáticos no WhatsApp"
  ```
- [x] Subheadline:
  ```
  "Tudo o que sua clínica de estética precisa para
  confirmar consultas, sem complicação e sem pagar caro."
  ```
- [x] Seção de benefícios:
  - Agenda simples (diária, semanal e mensal)
  - Lembretes automáticos pelo seu próprio WhatsApp
  - Menos faltas, mais tranquilidade
  - Sem contrato e sem pegadinhas
- [x] Prova de valor:
  ```
  "Em poucos minutos você já consegue organizar sua
  agenda e enviar lembretes automáticos para seus clientes."
  ```
- [x] Pricing:
  - R$ 19,90/mês (1 profissional)
  - R$ 9,90 por profissional adicional
- [x] CTA: "Comece agora e tenha sua agenda funcionando hoje mesmo"
- [x] Criar componente LandingPage.js com design responsivo
- [x] Habilitar rota /landing no App.js
- [x] Redirecionar usuários não autenticados para landing page
- [x] Incluir depoimentos de clínicas parceiras
- [x] Implementar seção de prova de valor rápida

**Arquivos Criados/Modificados:**

- `frontend/src/pages/LandingPage.js` - Nova landing page completa
- `frontend/src/App.js` - Rota /landing habilitada e redirecionamento atualizado

**Prompt Copilot:**

```
"Atualizar landing page com novo posicionamento focado em agenda e WhatsApp. Headline deve prometer organização e redução de faltas, destacar simplicidade, preço acessível e uso do próprio WhatsApp do cliente. Incluir seção de prova de valor rápida."
```

---

---

### 11. Implementar Métricas de Sucesso (Analytics)

**Status:** ✅ Concluído

- [x] Rastrear eventos-chave:
  - `onboarding_iniciado`
  - `onboarding_concluido`
  - `primeiro_agendamento`
  - `mensagem_teste_enviada`
  - `whatsapp_conectado`
  - `lembrete_ativado`
  - `cancelamento_conta`
- [x] Criar dashboard admin para métricas:
  - Taxa de conclusão de onboarding
  - Tempo médio para primeiro agendamento
  - Taxa de churn no primeiro mês
  - Motivos de cancelamento
- [x] Integrar com Google Analytics ou Mixpanel
- [x] Criar hook useAnalytics para tracking
- [x] Implementar AnalyticsDashboard com métricas visuais
- [x] Adicionar tracking no OnboardingWizard
- [x] Habilitar rota /analytics no sistema

**Arquivos Criados/Modificados:**

- `frontend/src/hooks/useAnalytics.js` - Hook de analytics com eventos
- `frontend/src/pages/AnalyticsDashboard.js` - Dashboard completo de métricas
- `frontend/src/components/common/OnboardingWizard.js` - Tracking integrado
- `frontend/src/App.js` - Rota /analytics adicionada

**Prompt Copilot:**

```
"Implementar sistema de tracking de eventos-chave do funil: onboarding, primeiro agendamento, ativação de lembretes. Criar dashboard admin com taxa de conclusão, tempo médio de ativação e churn. Integrar com Google Analytics."
```

---

### 12. Testes E2E dos Fluxos Críticos

**Status:** ✅ Concluído

- [x] Setup Playwright ou Cypress
- [x] Testes obrigatórios:
  - [x] Fluxo completo de onboarding
  - [x] Conexão e desconexão WhatsApp
  - [x] Criação de agendamento
  - [x] Envio de mensagem teste
  - [x] Reenvio de mensagem com falha
- [x] CI/CD: rodar testes antes de deploy
- [x] Meta: cobertura de 80% dos fluxos principais

**Arquivos Criados/Modificados:**

- `tests/e2e/critical-flows.spec.js` - Testes E2E dos fluxos críticos
- `.github/workflows/ci-cd.yml` - Pipeline CI/CD com testes E2E
- `playwright.config.js` - Configuração aprimorada para E2E
- `setup-e2e-tests.sh` / `setup-e2e-tests.bat` - Scripts de setup para testes
- `tests/e2e/global-setup.js` - Setup global dos testes
- `tests/e2e/global-teardown.js` - Limpeza global dos testes
- `package.json` - Scripts de teste adicionados

**Prompt Copilot:**

```
"Configurar Playwright para testes E2E dos fluxos críticos: onboarding completo, conexão WhatsApp, criação de agendamento e envio de mensagens. Integrar ao CI/CD e garantir 80% de cobertura dos fluxos principais."
```

---

## 📊 Progresso Geral

```
┌─────────────────────────────────────────────┐
│ Status Atual: 12/12 tarefas concluídas (100%) │
│                                             │
│ ✅✅✅✅✅✅✅✅✅✅✅✅                      │
└─────────────────────────────────────────────┘

🔴 Prioridade Máxima: 3/3 (100%)
🟡 Alta Prioridade:   5/5 (100%)
🟢 Média Prioridade:  2/3 (67%)
🔵 Baixa Prioridade:  2/2 (100%)
```

---

## 🎯 Critério de "Done"

Uma tarefa só é considerada concluída quando:

- [x] Está funcional em ambiente real
- [x] Possui feedback visual claro
- [x] Possui tratamento de erro humanizado
- [x] Não deixa o usuário em dúvida sobre o que aconteceu
- [x] Foi testada manualmente em cenários de sucesso E falha
- [x] Commit foi feito com mensagem descritiva

---

## 📝 Notas de Execução

### Comando para Atualizar Progresso

Ao concluir uma tarefa, marcar com `[x]` e atualizar a seção de progresso.

### Workflow Sugerido

1. Escolher tarefa de **Prioridade Máxima**
2. Abrir arquivo relacionado no VS Code
3. Usar o **Prompt Copilot** fornecido
4. Implementar funcionalidade
5. Testar manualmente
6. Commitar com mensagem clara
7. Atualizar este documento
8. Passar para próxima tarefa

### Mensagens de Commit Sugeridas

- `feat(whatsapp): adiciona log de mensagens com histórico e reenvio`
- `feat(onboarding): implementa wizard guiado de 6 etapas`
- `fix(automation): bloqueia envios quando WhatsApp desconectado`
- `refactor(navbar): adiciona indicador de status WhatsApp`
- `perf(agenda): otimiza carregamento com virtualização`

---

## ⚠️ Avisos Importantes

1. **Não remover funcionalidades do código** – apenas ocultar da UI
2. **Sempre validar WhatsApp** antes de automações
3. **Mensagens de erro humanizadas** – zero jargão técnico
4. **Performance é crítica** – meta <2s para carregar agenda
5. **Onboarding é obrigatório** – bloqueia automações até conclusão

---

## 🤝 Perguntas Guia

Antes de implementar qualquer funcionalidade, perguntar:

> ❓ "Isso ajuda a confirmar consultas ou só adiciona complexidade?"

Se for complexidade desnecessária → **NÃO ENTRA AGORA**.

---

## 📚 Documentos Relacionados

- [DOCUMENTACAO_COMPLETA.md](./DOCUMENTACAO_COMPLETA.md)
- [ARQUITETURA_MULTITENANT_CORRIGIDA.md](./ARQUITETURA_MULTITENANT_CORRIGIDA.md)
- [GUIA_TESTES.md](./GUIA_TESTES.md)

---

**Última Revisão:** 23/01/2026  
**Responsável:** Time de Produto e Engenharia  
**Próxima Revisão:** Após conclusão das tarefas de Prioridade Máxima
