# 📋 TO-DO: Ajustes Estratégicos do Sistema

> **Status:** Em Progresso (7/12 itens concluídos - 58% completo)  
> **Última Atualização:** 25/01/2026  
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

**Status:** ⏳ Não Iniciado

- [ ] Implementar toasts humanizados (substituir alerts):
  - ✅ Sucesso: verde com ícone de check
  - ⚠️ Atenção: amarelo com ícone de alerta
  - ❌ Erro: vermelho com ícone de X
- [ ] Mensagens de erro sem "techês":
  - "Não conseguimos salvar" ao invés de "Error 500"
  - "WhatsApp desconectado" ao invés de "Session not found"
- [ ] Adicionar loading states em todos os botões de ação
- [ ] Implementar skeleton loaders para carregamentos

**Prompt Copilot:**
```
"Implementar sistema de feedback visual humanizado usando react-hot-toast. Substituir todos os alerts por toasts coloridos, remover jargão técnico das mensagens de erro, adicionar loading states em botões e skeleton loaders em listas."
```

---

### 9. Otimizar Performance da Agenda

**Status:** ⏳ Não Iniciado

- [ ] Implementar paginação/virtualização para listagem de agendamentos
- [ ] Cachear dados de profissionais e pacientes no frontend (Zustand)
- [ ] Implementar debounce em busca de pacientes (300ms)
- [ ] Lazy load de modais pesados
- [ ] Comprimir imagens de pacientes (max 200KB)
- [ ] Meta: carregar agenda completa em <2 segundos

**Prompt Copilot:**
```
"Otimizar performance da tela de Agenda implementando virtualização de lista, cache de dados com Zustand, debounce em buscas, lazy loading de modais e compressão de imagens. Garantir carregamento completo abaixo de 2 segundos."
```

---

## 🔵 BAIXA PRIORIDADE (Refinamento)

### 10. Atualizar Landing Page com Novo Posicionamento

**Status:** ⏳ Não Iniciado

- [ ] Headline principal:
  ```
  "Organize sua agenda e reduza faltas com lembretes 
  automáticos no WhatsApp"
  ```
- [ ] Subheadline:
  ```
  "Tudo o que sua clínica de estética precisa para 
  confirmar consultas, sem complicação e sem pagar caro."
  ```
- [ ] Seção de benefícios:
  - Agenda simples (diária, semanal e mensal)
  - Lembretes automáticos pelo seu próprio WhatsApp
  - Menos faltas, mais tranquilidade
  - Sem contrato e sem pegadinhas
- [ ] Prova de valor:
  ```
  "Em poucos minutos você já consegue organizar sua 
  agenda e enviar lembretes automáticos para seus clientes."
  ```
- [ ] Pricing:
  - R$ 19,90/mês (1 profissional)
  - R$ 9,90 por profissional adicional
- [ ] CTA: "Comece agora e tenha sua agenda funcionando hoje mesmo"

**Prompt Copilot:**
```
"Atualizar landing page com novo posicionamento focado em agenda e WhatsApp. Headline deve prometer organização e redução de faltas, destacar simplicidade, preço acessível e uso do próprio WhatsApp do cliente. Incluir seção de prova de valor rápida."
```

---

### 11. Implementar Métricas de Sucesso (Analytics)

**Status:** ⏳ Não Iniciado

- [ ] Rastrear eventos-chave:
  - `onboarding_iniciado`
  - `onboarding_concluido`
  - `primeiro_agendamento`
  - `mensagem_teste_enviada`
  - `whatsapp_conectado`
  - `lembrete_ativado`
  - `cancelamento_conta`
- [ ] Criar dashboard admin para métricas:
  - Taxa de conclusão de onboarding
  - Tempo médio para primeiro agendamento
  - Taxa de churn no primeiro mês
  - Motivos de cancelamento
- [ ] Integrar com Google Analytics ou Mixpanel

**Prompt Copilot:**
```
"Implementar sistema de tracking de eventos-chave do funil: onboarding, primeiro agendamento, ativação de lembretes. Criar dashboard admin com taxa de conclusão, tempo médio de ativação e churn. Integrar com Google Analytics."
```

---

### 12. Testes E2E dos Fluxos Críticos

**Status:** ⏳ Não Iniciado

- [ ] Setup Playwright ou Cypress
- [ ] Testes obrigatórios:
  - Fluxo completo de onboarding
  - Conexão e desconexão WhatsApp
  - Criação de agendamento
  - Envio de mensagem teste
  - Reenvio de mensagem com falha
- [ ] CI/CD: rodar testes antes de deploy
- [ ] Meta: cobertura de 80% dos fluxos principais

**Prompt Copilot:**
```
"Configurar Playwright para testes E2E dos fluxos críticos: onboarding completo, conexão WhatsApp, criação de agendamento e envio de mensagens. Integrar ao CI/CD e garantir 80% de cobertura dos fluxos principais."
```

---

## 📊 Progresso Geral

```
┌─────────────────────────────────────────────┐
│ Status Atual: 7/12 tarefas concluídas (58%) │
│                                             │
│ ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ │
│ ✅✅✅✅✅✅✅                            │
└─────────────────────────────────────────────┘

🔴 Prioridade Máxima: 3/3 (100%)
🟡 Alta Prioridade:   3/4 (75%)
🟢 Média Prioridade:  1/3 (33%)
🔵 Baixa Prioridade:  0/2 (0%)
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
