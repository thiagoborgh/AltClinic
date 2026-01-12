# ✅ TO-DO LIST - ALTCLINIC Agenda LITE 2.0

**Projeto:** Transformação para Agenda Ultra Leve  
**Início:** 12 de Janeiro de 2026  
**Meta Lançamento:** Março 2026  
**Plano:** R$ 19,90/mês (sem trial)

---

## 🎯 FASE 1: PREPARAÇÃO E LIMPEZA (Janeiro 2026)

### 1.1 Backup e Organização
- [ ] Criar branch `backup-saas-antigo` com código atual
- [ ] Documentar estrutura atual para referência
- [ ] Limpar arquivos desnecessários (node_modules, builds)
- [ ] Criar estrutura de pastas otimizada

### 1.2 Análise de Dependências
- [ ] Listar todas as dependências atuais
- [ ] Identificar bibliotecas pesadas para substituir
- [ ] Definir stack LITE definitivo
- [ ] Criar package.json minimalista

---

## 🔧 FASE 2: BACKEND LEVE (Janeiro 2026)

### 2.1 Estrutura Base
- [ ] Criar `backend-lite/server.js` minimalista
- [ ] Configurar Express básico (<10 rotas)
- [ ] Setup SQLite com schema otimizado
- [ ] Implementar middleware JWT simples

### 2.2 Modelos de Dados
- [ ] Model: Clinicas (tenantId, nome, plano, status)
- [ ] Model: Usuarios (clinicaId, nome, email, senha)
- [ ] Model: Profissionais (id, nome, horarios JSON)
- [ ] Model: Agendamentos (id, profissionalId, slot, paciente, status)
- [ ] Model: Bloqueios (id, profissionalId, slot, motivo)

### 2.3 Endpoints Essenciais
- [ ] POST /auth/login (retorna JWT)
- [ ] POST /auth/cadastro (plano R$ 19,90)
- [ ] GET /agenda/slots?profissionalId&data (cache 5min)
- [ ] GET /agendamentos?profissionalId&periodo
- [ ] POST /agendamentos (validação de slots)
- [ ] PUT /agendamentos/:id (remarcar)
- [ ] DELETE /agendamentos/:id (cancelar)
- [ ] POST /bloqueios (bloquear slot)
- [ ] DELETE /bloqueios/:id (desbloquear)

### 2.4 Cache e Performance
- [ ] Implementar cache in-memory (Map) para slots
- [ ] TTL de 5 minutos para grades
- [ ] Invalidação ao criar/editar agendamento
- [ ] Testes de carga (<200ms resposta)

---

## 🎨 FASE 3: FRONTEND LEVE (Janeiro/Fevereiro 2026)

### 3.1 Estrutura Base
- [ ] Limpar frontend atual
- [ ] Criar estrutura minimalista:
  ```
  src/
    components/
      Login.jsx
      Cadastro.jsx
      AgendaLite.jsx (PRINCIPAL)
      ModalAgendamento.jsx
      ModalBloqueio.jsx
      ConfiguracoesWhatsApp.jsx
    utils/
      api.js
      cache.js
    App.jsx
    main.jsx
  ```

### 3.2 Componente AgendaLite (CORE)
- [ ] CSS Grid layout (sem biblioteca externa)
- [ ] Toggle visualizações: Diária | Semanal | Mensal
- [ ] Renderizar apenas horários configurados do profissional
- [ ] Slot component: Vago (verde) | Ocupado (azul) | Bloqueado (cinza)
- [ ] Destaque visual de slots vagos como receita
- [ ] Filtro por profissional (dropdown)
- [ ] Busca rápida por paciente

### 3.3 Sistema de Slots
- [ ] Calcular slots disponíveis entre horário início/fim
- [ ] Intervalos configuráveis (30min ou 60min)
- [ ] Consumo múltiplo: procedimento 60min = 2 slots 30min
- [ ] Validação client-side antes de enviar ao backend
- [ ] Feedback visual ao arrastar/selecionar

### 3.4 Modal de Agendamento
- [ ] Formulário simples: Paciente, Telefone, Procedimento, Duração
- [ ] Autocomplete de pacientes (últimos 50)
- [ ] Seletor de procedimentos (carregado de configuração)
- [ ] Validação de duração vs slots disponíveis
- [ ] Botão salvar com loading state

### 3.5 Modal de Alerta (Duração Incompatível)
- [ ] Trigger quando procedimento > slots disponíveis
- [ ] Mensagem clara: "Procedimento de 60min precisa 2 slots livres"
- [ ] Sugestão de horário alternativo mais próximo
- [ ] Botões: Voltar | Ver Sugestão

### 3.6 Bloqueio de Agenda
- [ ] Clique direito em slot → menu contextual "Bloquear"
- [ ] Modal simples: Motivo (opcional) + Confirmar
- [ ] Slot fica cinza com ícone de cadeado
- [ ] Hover mostra motivo do bloqueio
- [ ] Desbloquear: clique direito → "Desbloquear"

### 3.7 Performance Frontend
- [ ] Lazy loading de dias fora da visualização
- [ ] Debounce em filtros/busca (300ms)
- [ ] Cache localStorage de configurações
- [ ] Virtual scrolling para visualização mensal
- [ ] Bundle analysis: target <300KB gzipped

---

## 📱 FASE 4: INTEGRAÇÃO EVOLUTION API (Fevereiro 2026)

### 4.1 Backend Evolution
- [ ] Endpoint POST /whatsapp/config (salvar instância)
- [ ] Endpoint GET /whatsapp/status (verificar conexão)
- [ ] Endpoint POST /whatsapp/send (enviar mensagem)
- [ ] Model: WhatsAppConfig (clinicaId, numero, instanceId, status)
- [ ] Contador de mensagens mensais (limite 500)

### 4.2 Frontend Evolution
- [ ] Tela ConfiguracoesWhatsApp.jsx
- [ ] Input: Número de telefone
- [ ] Botão: Gerar QR Code
- [ ] Display QR Code (base64 da API)
- [ ] Status: Desconectado | Conectando | Conectado
- [ ] Contador: "450/500 mensagens este mês"

### 4.3 Lembretes Automáticos
- [ ] Trigger ao criar agendamento: confirmação imediata
- [ ] Cron job (ou worker): lembretes 24h antes
- [ ] Template de mensagem configurável
- [ ] Logs de envios (sucesso/falha)
- [ ] Retry automático (3 tentativas)

### 4.4 Templates de Mensagens
- [ ] Template confirmação: "Olá {nome}! Confirmado: {data} às {hora} com {profissional}"
- [ ] Template lembrete: "Lembrete: Amanhã {data} às {hora} com {profissional}"
- [ ] Template cancelamento: "Agendamento cancelado: {data} às {hora}"
- [ ] Permitir personalização na tela de configurações

---

## 🚀 FASE 5: OTIMIZAÇÃO E DEPLOY (Fevereiro 2026)

### 5.1 Testes de Performance
- [ ] Lighthouse: target Score >90
- [ ] Carregamento inicial: meta <1s
- [ ] Mudança de visualização: meta <500ms
- [ ] Consumo memória navegador: meta <50MB
- [ ] Teste em conexão 3G lenta

### 5.2 Build Otimizado
- [ ] Vite config: manualChunks otimizado
- [ ] Tree-shaking de dependências não usadas
- [ ] Minificação CSS (Tailwind JIT)
- [ ] Compression gzip habilitada
- [ ] Análise final de bundle size

### 5.3 Deploy Render
- [ ] Backend: Render Web Service (Free Tier)
- [ ] Frontend: Render Static Site (Free Tier)
- [ ] Configurar variáveis de ambiente
- [ ] Testar deploy automático via GitHub
- [ ] Configurar domínio custom (opcional)

### 5.4 Monitoramento
- [ ] Health check: /health endpoint
- [ ] Logs estruturados (Winston ou Pino)
- [ ] Error tracking básico (console + arquivo)
- [ ] Métricas de uso: agendamentos/dia, clínicas ativas

---

## 🎯 FASE 6: VALIDAÇÃO E LANÇAMENTO (Março 2026)

### 6.1 Testes Beta
- [ ] 5 clínicas beta testers (gratuito 1 mês)
- [ ] Coletar feedback de usabilidade
- [ ] Ajustes finos de UI/UX
- [ ] Correção de bugs críticos

### 6.2 Documentação
- [ ] Guia de uso para clínicas
- [ ] Tutorial de primeiro acesso
- [ ] FAQ: perguntas frequentes
- [ ] Vídeo demo (2-3 minutos)

### 6.3 Precificação e Pagamento
- [ ] Integração com gateway (Stripe ou Mercado Pago)
- [ ] Tela de assinatura R$ 19,90/mês
- [ ] Sem trial: pagamento imediato
- [ ] Conta ADMIN gratuita: admin@altclinic.com.br

### 6.4 Lançamento
- [ ] Anúncio oficial: site/redes sociais
- [ ] Meta: 100 clínicas no primeiro mês
- [ ] Suporte via WhatsApp/Email
- [ ] Monitorar métricas: churn, satisfação, performance

---

## 📊 MÉTRICAS DE SUCESSO

### Performance
- ✅ Carregamento inicial: <1s
- ✅ Resposta API: <200ms
- ✅ Bundle size: <300KB gzipped
- ✅ Lighthouse Score: >90

### Custo
- ✅ Render Free Tier: R$ 0/mês (500 clínicas)
- ✅ Total cloud: <R$ 100/mês para infraestrutura extra

### Produto
- ✅ 100 clínicas ativas em 30 dias
- ✅ Satisfação usuário: >90%
- ✅ Uptime: >99%
- ✅ Churn: <5%

---

## 🚨 RISCOS E MITIGAÇÕES

### Risco 1: Performance insuficiente
- **Mitigação:** Testes contínuos, profiling, otimização incremental

### Risco 2: Custos excederem estimativa
- **Mitigação:** Monitoramento diário, alertas de uso, plano de scale

### Risco 3: Evolution API instável
- **Mitigação:** Fallback para envios manuais, timeout + retry

### Risco 4: Baixa adesão (preço)
- **Mitigação:** Trial 7 dias (opcional), descontos para anuidade

---

## 📅 CRONOGRAMA RESUMIDO

| Fase | Período | Status |
|------|---------|--------|
| 1. Preparação | 12-15 Jan | 🔄 Em andamento |
| 2. Backend | 15-22 Jan | ⏳ Pendente |
| 3. Frontend | 22 Jan - 05 Fev | ⏳ Pendente |
| 4. Evolution API | 05-12 Fev | ⏳ Pendente |
| 5. Otimização | 12-19 Fev | ⏳ Pendente |
| 6. Lançamento | 01 Mar | ⏳ Pendente |

---

## ✅ CHECKLIST DIÁRIO

Ao final de cada dia, marcar progresso:
- [ ] Commits no GitHub
- [ ] Testes locais OK
- [ ] Performance validada
- [ ] Documentação atualizada

---

**Última Atualização:** 12/01/2026  
**Próxima Revisão:** 15/01/2026  
**Responsável:** Thiago Borgh  
**Status Geral:** 🚀 INICIANDO DESENVOLVIMENTO
