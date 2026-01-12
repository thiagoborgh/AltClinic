# 🚀 ALTCLINIC Agenda LITE 2.0

**Projeto Principal - Janeiro 2026**

---

## 📋 Especificações do Produto

### Posicionamento

- **Preço:** R$ 19,90/mês (SEM trial)
- **Target:** Clínicas pequenas que precisam apenas agenda funcional
- **Diferencial:** Ultra leve, rápida, barata de hospedar

### Características Essenciais

✅ **Grade Dinâmica**

- Slots gerados apenas nos horários configurados do profissional
- Intervalos: 30min ou 60min
- Visualizações: Diária, Semanal, Mensal

✅ **Consumo Múltiplo de Slots**

- Procedimentos longos ocupam vários slots consecutivos
- Ex: 60min = 2 slots de 30min
- Validação client-side + fallback server

✅ **Modal de Alerta**

- Alerta quando procedimento não cabe no horário
- Sugestão de horário alternativo

✅ **Bloqueio de Agenda**

- Clique direito → Bloquear slot
- Motivo opcional (pausa, compromisso)

✅ **Integração Evolution API**

- Ativação por número + QR
- Lembretes automáticos via WhatsApp
- **500 mensagens/mês absorvidas no plano**

---

## 🎯 Requisitos de Performance

### Frontend

- ⚡ **Carregamento inicial:** <1s
- ⚡ **Mudança visualização:** <500ms
- ⚡ **Consumo memória:** <50MB navegador

### Backend

- ⚡ **Resposta API:** <200ms
- ⚡ **Cache:** Redis ou in-memory para grades frequentes
- ⚡ **Endpoints mínimos:** Apenas essenciais

### Custo Cloud (500 clínicas)

- 💰 **Meta:** < R$ 100/mês total
- 💰 **Render Free Tier:** Frontend + Backend
- 💰 **SQLite:** Zero custo de banco
- 💰 **Evolution API:** Absorvido no plano

---

## 🛠️ Stack Técnica (LEVE)

### Frontend

```
- React 18 (minimal)
- Vite (build otimizado)
- Tailwind CSS (sem Material-UI)
- Zustand ou Context (estado leve)
- Custom Calendar (CSS Grid, sem FullCalendar)
```

### Backend

```
- Node.js + Express (minimal)
- SQLite (zero custo, leve)
- JWT (auth simples)
- Cache in-memory (sem Redis externo)
```

### Hospedagem

```
- Render Free Tier (frontend + backend)
- Custo: R$ 0/mês
```

---

## 📅 Roadmap

### Janeiro 2026 (AGORA)

- [x] Documentação LITE
- [ ] Estrutura base
- [ ] Backend leve
- [ ] Grade custom

### Fevereiro 2026

- [ ] Evolution API
- [ ] Testes performance
- [ ] Deploy Render

### Março 2026

- [ ] Lançamento R$ 19,90
- [ ] 100 primeiras clínicas
- [ ] Métricas validadas

---

## 🎨 Design da Grade (Inspiração Google Calendar)

```
┌─────────────────────────────────────────┐
│  [Diária] [Semanal] [Mensal]   [Dra Ana]│
├─────────────────────────────────────────┤
│ 08:00 │ □ Vago (R$ 150)                 │
│ 08:30 │ ■ Maria - Limpeza              │
│ 09:00 │ ■ Maria - Limpeza              │
│ 09:30 │ □ Vago (R$ 150)                 │
│ 10:00 │ ⊗ Bloqueado (Pausa)            │
│ 10:30 │ □ Vago (R$ 150)                 │
│ ...   │                                 │
│ 18:00 │ (fim do expediente)             │
└─────────────────────────────────────────┘
```

**Cores:**

- Verde claro: Slots vagos (destaque receita)
- Azul: Agendados
- Cinza: Bloqueados
- Vermelho: Conflitos

---

## 🔌 Integração Evolution API

### Fluxo de Ativação

1. Configurações → WhatsApp
2. Inserir número (ex: 11999999999)
3. Escanear QR Code
4. Status: ✅ Conectado

### Envios Automáticos

- **Confirmação:** Imediata após agendar
- **Lembrete:** 24h antes
- **Limite:** 500 msg/mês (absorvido)

### Mensagem Exemplo

```
🏥 *ALTCLINIC*

Olá Maria! 👋

Confirmamos seu agendamento:
📅 15/02/2026 às 09:00
👨‍⚕️ Dra. Ana Silva
💉 Limpeza de Pele

Qualquer dúvida, responda esta mensagem!
```

---

## 🚀 Meta de Lançamento

**Março 2026:**

- 100 clínicas ativas
- Custo cloud < R$ 100
- Satisfação > 90%
- Performance validada (<1s)

---

**Projeto Principal:** Substituir SaaS atual
**Status:** EM DESENVOLVIMENTO ⚡
