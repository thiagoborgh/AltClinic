# Design Spec — Central de Atendimento WhatsApp (Sprint 1)
**Data:** 2026-03-18
**Status:** Aprovado (v3 — pós revisão)
**Autor:** Claude Code (AltClinic Dev System)
**Referência TDD:** `docs/tdd/tdd-whatsapp-atendimento.md`

---

## Contexto

O AltClinic é um SaaS multi-tenant de gestão clínica. O módulo WhatsApp precisa ser construído do zero — nada funciona de ponta a ponta atualmente. Este spec cobre o Sprint 1: Central de Atendimento (chat operacional para recepcionistas/atendentes).

O Sprint 2 (bot de agendamento) e Sprint 3 (cobrança via WhatsApp) seguirão a mesma infraestrutura estabelecida aqui.

---

## Decisões de Design

- **Provider WhatsApp:** Z-API — usar `ZAPIService.js` diretamente (não `UnifiedWhatsAppService`, que não suporta envio de texto livre)
- **Multi-tenant:** cada clínica conecta o próprio número — 1 instância Z-API por tenant
- **Banco:** PostgreSQL via `pg` pool, schema `clinica_{slug}` por tenant
- **Real-time:** socket.io — **não está instalado no projeto**, instalar como pré-requisito (Step 0)
- **Schema name:** sempre derivado via `MultiTenantPostgresManager.schemaName(slug)` — normaliza hífens para underscore (ex: `cambui-center` → `clinica_cambui_center`)
- **Tenant no request:** middleware atual expõe `req.tenant.slug` (não `req.tenantSlug`)
- **Coexistência:** o `whatsapp.js` atual (Firestore) não é deletado — novas rotas ficam em arquivo separado

---

## Arquitetura

```
Z-API (número da clínica)
    ↓ POST /api/whatsapp/webhook/:tenantSlug
    ↓ Header: X-Webhook-Token (validado com timing-safe compare)
WhatsAppConversaService.processarWebhook()
  → validar X-Webhook-Token contra webhook_secret do tenant
  → deduplicação por webhook_id
  → identificar paciente pelo telefone (normalizado E.164)
  → salvar mensagem no PostgreSQL (clinica_{slug})
  → verificar se bot ativo (whatsapp_bot_config.ativo)
  → emitir evento socket.io → room "tenant:{tenantId}"
    ↓
Frontend (3 colunas, React)
  ← socket.io tempo real
```

**Isolamento:** o webhook recebe `tenantSlug` na URL. Schema derivado via `MultiTenantPostgresManager.schemaName(req.params.tenantSlug)`. Impossível vazar dados entre tenants.

---

## Banco de Dados

Schema: `clinica_{slug}` (PostgreSQL, Supabase)

DDL autoritativo: TDD `tdd-whatsapp-atendimento.md`. Abaixo o resumo das tabelas:

### Tabelas

```sql
-- Credenciais Z-API por tenant (1 por clínica)
-- ATENÇÃO: já existe tabela `whatsapp_instances` (inglês) no TENANT_SCHEMA_SQL do MultiTenantPostgres.js
-- Usar ALTER TABLE para adicionar colunas faltantes em vez de criar nova tabela
-- A migration deve: ALTER TABLE whatsapp_instances ADD COLUMN IF NOT EXISTS api_url TEXT DEFAULT 'https://api.z-api.io'
-- Manter nome `whatsapp_instances` (inglês) — não criar `whatsapp_instancias` separada
-- Referência: src/database/MultiTenantPostgres.js linha ~277

-- Uma conversa por número de telefone por tenant
CREATE TABLE IF NOT EXISTS whatsapp_conversas (
  id                  BIGSERIAL PRIMARY KEY,
  tenant_id           TEXT NOT NULL,
  paciente_id         BIGINT REFERENCES pacientes(id) ON DELETE SET NULL,
  numero              TEXT NOT NULL,           -- E.164: +5511999998888
  nome_contato        TEXT,
  ultima_mensagem_pre TEXT,                    -- preview últimas 80 chars
  ultima_atividade    TIMESTAMPTZ,
  status              TEXT DEFAULT 'aberta'    -- aberta/aguardando/encerrada
                        CHECK (status IN ('aberta','aguardando','encerrada')),
  atendente_id        BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  nao_lidas           INTEGER DEFAULT 0,
  sem_resposta_alerta BOOLEAN DEFAULT false,
  tag                 TEXT CHECK (tag IN ('urgente','financeiro','agendamento','outros',NULL)),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, numero)
);

-- Mensagens individuais
CREATE TABLE IF NOT EXISTS whatsapp_mensagens (
  id          BIGSERIAL PRIMARY KEY,
  conversa_id BIGINT NOT NULL REFERENCES whatsapp_conversas(id) ON DELETE CASCADE,
  tenant_id   TEXT NOT NULL,
  direcao     TEXT NOT NULL CHECK (direcao IN ('entrada', 'saida')),
  tipo        TEXT DEFAULT 'texto' CHECK (tipo IN ('texto','imagem','audio','documento','sticker')),
  conteudo    TEXT NOT NULL,
  midia_url   TEXT,
  webhook_id  TEXT UNIQUE,     -- deduplicação Z-API (campo messageId do payload)
  status      TEXT DEFAULT 'entregue' CHECK (status IN ('enviando','entregue','lida','falhou')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações de atendimento por tenant
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id                      BIGSERIAL PRIMARY KEY,
  tenant_id               TEXT NOT NULL UNIQUE,
  horario_atendimento     JSONB DEFAULT '{"seg_sex": "08:00-18:00", "sab": "08:00-12:00"}',
  mensagem_fora_horario   TEXT DEFAULT 'Olá! Nosso horário é seg-sex 8h-18h.',
  sla_minutos             INTEGER DEFAULT 120,
  classificacao_ia        BOOLEAN DEFAULT false,
  webhook_secret          TEXT NOT NULL DEFAULT '',  -- validação X-Webhook-Token
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Stub para bot (Sprint 2) — necessário no Sprint 1 para não quebrar webhook
CREATE TABLE IF NOT EXISTS whatsapp_bot_config (
  id        BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL UNIQUE,
  ativo     BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_wa_conversas_tenant    ON whatsapp_conversas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wa_conversas_numero    ON whatsapp_conversas(tenant_id, numero);
CREATE INDEX IF NOT EXISTS idx_wa_conversas_status    ON whatsapp_conversas(status);
CREATE INDEX IF NOT EXISTS idx_wa_mensagens_conversa  ON whatsapp_mensagens(conversa_id);
CREATE INDEX IF NOT EXISTS idx_wa_mensagens_webhook   ON whatsapp_mensagens(webhook_id);
```

---

## Backend

### Arquivo: `src/routes/whatsapp-atendimento.js` (novo)

```
POST /api/whatsapp/webhook/:tenantSlug     ← Z-API envia mensagens (sem auth JWT, com X-Webhook-Token)
GET  /api/whatsapp/conversas               ← lista conversas paginada (com auth JWT)
GET  /api/whatsapp/conversas/:id/mensagens ← histórico de mensagens
POST /api/whatsapp/conversas/:id/enviar    ← envia mensagem via ZAPIService
POST /api/whatsapp/conversas/:id/resolver  ← status → encerrada
POST /api/whatsapp/conversas/:id/vincular  ← vincula paciente_id à conversa
GET  /api/whatsapp/instancia               ← status da conexão Z-API
POST /api/whatsapp/instancia/configurar    ← salva instance_id + api_token
```

### Arquivo: `src/services/WhatsAppConversaService.js` (novo)

| Método | Responsabilidade |
|--------|-----------------|
| `processarWebhook(tenantSlug, payload, secret)` | Valida X-Webhook-Token, deduplica por `webhook_id`, identifica paciente, salva, emite socket |
| `enviarMensagem(conversaId, conteudo, tenantDb, zapiConfig)` | Instancia `new ZAPIService({ instance_id, token })`, normaliza telefone com `zapi.formatPhone()` (método de instância), chama `zapi.sendTextMessage()`, salva mensagem de saída |
| `identificarPaciente(telefone, tenantDb)` | Busca em `pacientes` pelo telefone normalizado |
| `vincularPaciente(conversaId, pacienteId, tenantDb)` | Atualiza `paciente_id` na conversa |
| `resolverConversa(conversaId, tenantDb)` | Status → encerrada, limpa alerta SLA |
| `verificarSLA()` | Cron 5min — alerta conversas abertas sem resposta há > `sla_minutos` |

### Integração Z-API (via ZAPIService.js existente)

```javascript
// Envio de texto — ZAPIService já implementado
// ATENÇÃO: construtor recebe objeto, não dois args separados
const zapi = new ZAPIService({ instance_id: instanceId, token: apiToken });
// ATENÇÃO: formatPhone é método de instância, não estático
const telefoneFormatado = zapi.formatPhone(conversa.numero); // remove '+', mantém DDI
await zapi.sendTextMessage(telefoneFormatado, conteudo);

// Payload webhook Z-API recebido (campos usados)
{
  phone: "5519999990000",   // sem + — normalizar para E.164 ao salvar
  text: { message: "oi" },
  messageId: "abc123",      // usado como webhook_id
  fromMe: false
}
```

### Validação de Webhook

```javascript
// Todas as requests para /webhook/:tenantSlug devem ter:
const token = req.headers['x-webhook-token'];
const secret = await getWebhookSecret(tenantSlug); // busca em whatsapp_config
if (!crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret))) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### Schema Name

```javascript
// SEMPRE usar esta função — nunca concatenar diretamente
const { schemaName } = require('../database/MultiTenantPostgres');
const schema = schemaName(req.params.tenantSlug);
// 'cambui-center' → 'clinica_cambui_center'
```

---

## Frontend

### Estrutura de Arquivos (novos)

```
frontend/src/pages/
  WhatsAppAtendimento.js       ← página principal (layout 3 colunas)

frontend/src/components/whatsapp/
  ConversasList.js             ← coluna 1: lista de conversas
  ChatPanel.js                 ← coluna 2: chat + input de envio
  PacienteContexto.js          ← coluna 3: dados do paciente vinculado
  VincularPacienteModal.js     ← modal de busca/vinculação de paciente
```

### Layout

```
┌─────────────────┬──────────────────────┬─────────────────────┐
│  CONVERSAS      │  CHAT                │  CONTEXTO           │
│  [Buscar...]    │  João Silva · aberta │  📋 Paciente        │
│                 │  ─────────────────── │  João Silva, 34a    │
│ 🔴 João Silva   │  João: Quero agendar │  (19) 9999-0000     │
│  Quero agendar  │                      │                     │
│  14:32 · 2 💬   │  Você: Olá João!     │  📅 Próximo         │
│                 │  Qual procedimento?  │  25/03 14h - Botox  │
│  Maria Santos   │                      │                     │
│  Obrigada!      │  ─────────────────── │  💰 Financeiro      │
│  13:15          │  [Digite mensagem..] │  Fatura: R$ 380     │
│                 │  [📎]      [Enviar ▶]│  Venc: 20/03        │
│ 🟠 Carlos Lima  │                      │                     │
│  Fatura? (2h+)  │                      │  🕐 Histórico       │
│  12:00 · 1 💬   │                      │  Última: 3 meses    │
└─────────────────┴──────────────────────┴─────────────────────┘
```

### Comportamentos

- **Real-time:** socket.io emite `mensagem_nova` e `conversa_atualizada` — frontend atualiza sem reload
- **Auto-vinculação:** ao abrir conversa, busca paciente pelo telefone; se encontrar, carrega contexto automaticamente
- **Sem paciente:** painel direito mostra botão "Vincular paciente" com modal de busca
- **Badges:** conversas com `nao_lidas > 0` mostram contador vermelho
- **Ordenação:** conversas ordenadas por `ultima_atividade DESC`
- **Alerta SLA:** conversas com `sem_resposta_alerta = true` destacadas em laranja (🟠)

---

## Fluxo Completo: Mensagem Recebida

```
1. Paciente envia "Oi" no WhatsApp da clínica
2. Z-API POST → /api/whatsapp/webhook/cambui-center
   Header: X-Webhook-Token: <secret>
3. Middleware valida token com timingSafeEqual
4. schema = schemaName('cambui-center') → 'clinica_cambui_center'
5. processarWebhook():
   a. Verifica webhook_id não processado (INSERT ... ON CONFLICT DO NOTHING)
   b. Normaliza telefone → E.164 (+5519999990000)
   c. Busca/cria whatsapp_conversas por (tenant_id, numero)
   d. Insere em whatsapp_mensagens
   e. Busca paciente pelo telefone → atualiza paciente_id se encontrar
   f. Verifica whatsapp_bot_config.ativo → se true, delega para bot (Sprint 2)
   g. io.to("tenant:{tenantId}").emit("mensagem_nova", { conversa, mensagem })
6. Frontend recebe evento → atualiza coluna 1 e coluna 2 em tempo real
```

---

## O que NÃO está no escopo deste sprint

- Bot de agendamento autônomo (Sprint 2)
- Cobrança via WhatsApp + Pix (Sprint 3)
- Classificação por IA (Claude API) — `classificacao_ia` flag desativada por padrão
- Envio de mídia (imagens, áudios) — apenas texto neste sprint
- Templates de mensagem rápida — v2
- Relatórios de WhatsApp — v2

---

## Critérios de Aceite

1. Admin configura Z-API (instance_id + token + webhook_secret) pela interface → status muda para "connected"
2. Paciente envia mensagem → aparece na lista de conversas em < 2 segundos (socket.io)
3. Atendente responde pela interface → mensagem entregue via Z-API
4. Se telefone bate com paciente cadastrado → painel direito carrega dados automaticamente
5. Conversa sem resposta por mais de 2h → destacada em laranja na lista
6. Marcar como resolvida → sai da fila ativa (status encerrada)
7. Webhook rejeita requisições sem X-Webhook-Token válido (401)

---

## Ordem de Implementação

```
Step 0: npm install socket.io (backend) + socket.io-client (frontend)
        Configurar io no server.js: const io = new Server(httpServer)
        Exportar: module.exports = { app, io }

Step 1: Migration SQL
        → ALTER TABLE whatsapp_instances ADD COLUMN IF NOT EXISTS ... (estender tabela existente)
        → CREATE TABLE IF NOT EXISTS whatsapp_conversas (nova)
        → CREATE TABLE IF NOT EXISTS whatsapp_mensagens (nova)
        → CREATE TABLE IF NOT EXISTS whatsapp_config (nova)
        → CREATE TABLE IF NOT EXISTS whatsapp_bot_config (stub Sprint 2)

Step 2: WhatsAppConversaService.js
        → processarWebhook (validação + deduplicação + socket emit)
        → enviarMensagem (ZAPIService.formatPhone + sendTextMessage)
        → identificarPaciente, vincularPaciente, resolverConversa

Step 3: src/routes/whatsapp-atendimento.js
        → webhook (sem JWT, com X-Webhook-Token)
        → conversas CRUD (com JWT)
        → instancia configurar/status

Step 4: Registrar rota no server.js / app.js

Step 5: Frontend ConversasList.js + ChatPanel.js (socket.io-client)

Step 6: Frontend PacienteContexto.js + VincularPacienteModal.js

Step 7: Frontend WhatsAppAtendimento.js (página principal)

Step 8: Rota /whatsapp/atendimento no React Router + item no Sidebar

Step 9: Testes manuais end-to-end com Z-API sandbox
```
