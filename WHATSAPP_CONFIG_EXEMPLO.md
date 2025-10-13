# ⚙️ Configuração de APIs WhatsApp - AltClinic

## 📋 Arquivo de Configuração Consolidado

Este arquivo contém exemplos de configuração para todas as três APIs WhatsApp suportadas pelo AltClinic.

---

## 🔧 Estrutura de Configuração

### Arquivo: `config/whatsapp.js`

```javascript
// config/whatsapp.js
const whatsappConfig = {
  // Configuração geral
  defaultProvider: process.env.WHATSAPP_DEFAULT_PROVIDER || "evolution",

  // Configurações por provider
  providers: {
    evolution: {
      enabled: process.env.EVOLUTION_ENABLED === "true",
      baseUrl: process.env.EVOLUTION_BASE_URL,
      apiKey: process.env.EVOLUTION_API_KEY,
      instanceName: process.env.EVOLUTION_INSTANCE_NAME,
      webhooks: {
        enabled: true,
        url: process.env.EVOLUTION_WEBHOOK_URL,
        events: ["message", "status", "connection"],
      },
      limits: {
        messagesPerSecond: 10,
        maxFileSize: 16 * 1024 * 1024, // 16MB
      },
    },

    meta: {
      enabled: process.env.META_ENABLED === "true",
      appId: process.env.META_APP_ID,
      appSecret: process.env.META_APP_SECRET,
      accessToken: process.env.META_ACCESS_TOKEN,
      phoneNumberId: process.env.META_PHONE_NUMBER_ID,
      businessAccountId: process.env.META_BUSINESS_ACCOUNT_ID,
      verifyToken: process.env.META_VERIFY_TOKEN,
      webhooks: {
        enabled: true,
        url: process.env.META_WEBHOOK_URL,
        verifyToken: process.env.META_VERIFY_TOKEN,
      },
      limits: {
        messagesPerDay: 1000,
        templatesPerMonth: 250,
      },
    },

    zapi: {
      enabled: process.env.ZAPI_ENABLED === "true",
      apiUrl: process.env.ZAPI_API_URL || "https://api.z-api.io",
      instanceId: process.env.ZAPI_INSTANCE_ID,
      token: process.env.ZAPI_TOKEN,
      securityToken: process.env.ZAPI_SECURITY_TOKEN,
      clientToken: process.env.ZAPI_CLIENT_TOKEN,
      webhooks: {
        enabled: true,
        url: process.env.ZAPI_WEBHOOK_URL,
        events: ["message", "status", "disconnect"],
      },
      limits: {
        messagesPerMonth: parseInt(process.env.ZAPI_PLAN_MESSAGES || "1000"),
        maxFileSize: 100 * 1024 * 1024, // 100MB
      },
    },
  },

  // Configurações globais
  global: {
    // Timeout para requests
    timeout: 30000, // 30 segundos

    // Retry configuration
    retry: {
      attempts: 3,
      delay: 1000, // 1 segundo
      backoff: 2,
    },

    // Rate limiting
    rateLimit: {
      windowMs: 60000, // 1 minuto
      maxRequests: 100,
    },

    // Logs
    logging: {
      level: process.env.LOG_LEVEL || "info",
      file: "logs/whatsapp.log",
    },
  },
};

module.exports = whatsappConfig;
```

---

## 🌍 Arquivo de Ambiente (.env)

### Exemplo: `.env.example`

```bash
# ===========================================
# CONFIGURAÇÃO WHATSAPP APIS - ALTCLINIC
# ===========================================

# Provider padrão (evolution, meta, zapi)
WHATSAPP_DEFAULT_PROVIDER=evolution

# ===========================================
# EVOLUTION API CONFIGURATION
# ===========================================
EVOLUTION_ENABLED=true
EVOLUTION_BASE_URL=http://localhost:8080
EVOLUTION_API_KEY=sua-chave-api-aqui
EVOLUTION_INSTANCE_NAME=altclinic-instance
EVOLUTION_WEBHOOK_URL=https://seu-dominio.com/webhooks/whatsapp/evolution

# ===========================================
# META WHATSAPP BUSINESS API CONFIGURATION
# ===========================================
META_ENABLED=false
META_APP_ID=seu-app-id-meta
META_APP_SECRET=seu-app-secret-meta
META_ACCESS_TOKEN=seu-access-token-meta
META_PHONE_NUMBER_ID=seu-phone-number-id-meta
META_BUSINESS_ACCOUNT_ID=seu-business-account-id-meta
META_VERIFY_TOKEN=seu-verify-token-meta
META_WEBHOOK_URL=https://seu-dominio.com/webhooks/whatsapp/meta

# ===========================================
# Z-API CONFIGURATION
# ===========================================
ZAPI_ENABLED=false
ZAPI_API_URL=https://api.z-api.io
ZAPI_INSTANCE_ID=seu-instance-id-zapi
ZAPI_TOKEN=seu-token-zapi
ZAPI_SECURITY_TOKEN=seu-security-token-zapi
ZAPI_CLIENT_TOKEN=seu-client-token-zapi
ZAPI_WEBHOOK_URL=https://seu-dominio.com/webhooks/whatsapp/zapi
ZAPI_PLAN_MESSAGES=1000

# ===========================================
# CONFIGURAÇÕES GLOBAIS
# ===========================================
LOG_LEVEL=info
NODE_ENV=production

# ===========================================
# BANCO DE DADOS
# ===========================================
DATABASE_URL=postgresql://user:password@localhost:5432/altclinic
REDIS_URL=redis://localhost:6379

# ===========================================
# SEGURANÇA
# ===========================================
JWT_SECRET=sua-chave-jwt-secreta
ENCRYPTION_KEY=sua-chave-criptografia

# ===========================================
# SERVIDOR
# ===========================================
PORT=3000
HOST=0.0.0.0
CORS_ORIGIN=https://altclinic.com
```

---

## 🔄 Classe de Gerenciamento de Providers

### Arquivo: `services/whatsapp/WhatsappManager.js`

```javascript
// services/whatsapp/WhatsappManager.js
const EvolutionProvider = require("./providers/EvolutionProvider");
const MetaProvider = require("./providers/MetaProvider");
const ZapiProvider = require("./providers/ZapiProvider");
const whatsappConfig = require("../../config/whatsapp");

class WhatsappManager {
  constructor() {
    this.providers = {};
    this.activeProvider = null;
    this.initializeProviders();
  }

  initializeProviders() {
    // Evolution API
    if (whatsappConfig.providers.evolution.enabled) {
      this.providers.evolution = new EvolutionProvider(
        whatsappConfig.providers.evolution
      );
    }

    // Meta API
    if (whatsappConfig.providers.meta.enabled) {
      this.providers.meta = new MetaProvider(whatsappConfig.providers.meta);
    }

    // Z-API
    if (whatsappConfig.providers.zapi.enabled) {
      this.providers.zapi = new ZapiProvider(whatsappConfig.providers.zapi);
    }

    // Define provider ativo
    this.activeProvider = whatsappConfig.defaultProvider;
  }

  async sendMessage(to, message, options = {}) {
    const provider = this.providers[this.activeProvider];
    if (!provider) {
      throw new Error(`Provider ${this.activeProvider} não está configurado`);
    }

    return await provider.sendMessage(to, message, options);
  }

  async sendMedia(to, mediaUrl, caption, options = {}) {
    const provider = this.providers[this.activeProvider];
    if (!provider) {
      throw new Error(`Provider ${this.activeProvider} não está configurado`);
    }

    return await provider.sendMedia(to, mediaUrl, caption, options);
  }

  async getStatus() {
    const status = {};

    for (const [name, provider] of Object.entries(this.providers)) {
      try {
        status[name] = await provider.getStatus();
      } catch (error) {
        status[name] = { error: error.message };
      }
    }

    return status;
  }

  switchProvider(providerName) {
    if (!this.providers[providerName]) {
      throw new Error(`Provider ${providerName} não está disponível`);
    }

    this.activeProvider = providerName;
    console.log(`Switched to provider: ${providerName}`);
  }

  getActiveProvider() {
    return this.activeProvider;
  }

  getAvailableProviders() {
    return Object.keys(this.providers);
  }
}

module.exports = WhatsappManager;
```

---

## 📡 Webhook Handler Consolidado

### Arquivo: `routes/webhooks/whatsapp.js`

```javascript
// routes/webhooks/whatsapp.js
const express = require("express");
const router = express.Router();
const whatsappManager = require("../../services/whatsapp/WhatsappManager");

// Middleware de validação
const validateWebhook = (req, res, next) => {
  const provider = req.params.provider;

  if (!["evolution", "meta", "zapi"].includes(provider)) {
    return res.status(400).json({ error: "Provider inválido" });
  }

  next();
};

// Evolution API Webhook
router.post("/evolution", validateWebhook, async (req, res) => {
  try {
    const payload = req.body;

    // Processa eventos da Evolution API
    switch (payload.event) {
      case "message":
        await handleEvolutionMessage(payload);
        break;
      case "status":
        await handleEvolutionStatus(payload);
        break;
      case "connection":
        await handleEvolutionConnection(payload);
        break;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Evolution webhook error:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Meta API Webhook
router.post("/meta", validateWebhook, async (req, res) => {
  try {
    const payload = req.body;

    // Verifica token de verificação
    if (req.query["hub.verify_token"] === process.env.META_VERIFY_TOKEN) {
      return res.send(req.query["hub.challenge"]);
    }

    // Processa mensagens da Meta
    if (payload.object === "whatsapp_business_account") {
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field === "messages") {
            await handleMetaMessage(change.value);
          }
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Meta webhook error:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Z-API Webhook
router.post("/zapi", validateWebhook, async (req, res) => {
  try {
    const payload = req.body;

    // Processa eventos da Z-API
    switch (payload.type) {
      case "message":
        await handleZapiMessage(payload);
        break;
      case "status":
        await handleZapiStatus(payload);
        break;
      case "disconnect":
        await handleZapiDisconnect(payload);
        break;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Z-API webhook error:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Handlers específicos
async function handleEvolutionMessage(payload) {
  // Lógica para processar mensagens Evolution
  console.log("Evolution message:", payload);
}

async function handleMetaMessage(value) {
  // Lógica para processar mensagens Meta
  console.log("Meta message:", value);
}

async function handleZapiMessage(payload) {
  // Lógica para processar mensagens Z-API
  console.log("Z-API message:", payload);
}

// Outros handlers...
async function handleEvolutionStatus(payload) {
  /* ... */
}
async function handleEvolutionConnection(payload) {
  /* ... */
}
async function handleMetaStatus(value) {
  /* ... */
}
async function handleZapiStatus(payload) {
  /* ... */
}
async function handleZapiDisconnect(payload) {
  /* ... */
}

module.exports = router;
```

---

## 🧪 Arquivo de Testes

### Arquivo: `tests/whatsapp-integration.test.js`

```javascript
// tests/whatsapp-integration.test.js
const WhatsappManager = require("../services/whatsapp/WhatsappManager");

describe("WhatsApp Integration Tests", () => {
  let whatsappManager;

  beforeAll(() => {
    whatsappManager = new WhatsappManager();
  });

  test("should initialize providers correctly", () => {
    const providers = whatsappManager.getAvailableProviders();
    expect(providers.length).toBeGreaterThan(0);
  });

  test("should send text message", async () => {
    const result = await whatsappManager.sendMessage(
      "5511999999999",
      "Teste de integração"
    );
    expect(result).toHaveProperty("success", true);
  });

  test("should send media message", async () => {
    const result = await whatsappManager.sendMedia(
      "5511999999999",
      "https://example.com/image.jpg",
      "Imagem de teste"
    );
    expect(result).toHaveProperty("success", true);
  });

  test("should get status of all providers", async () => {
    const status = await whatsappManager.getStatus();
    expect(typeof status).toBe("object");
  });

  test("should switch provider", () => {
    const providers = whatsappManager.getAvailableProviders();
    if (providers.length > 1) {
      whatsappManager.switchProvider(providers[1]);
      expect(whatsappManager.getActiveProvider()).toBe(providers[1]);
    }
  });
});
```

---

## 📊 Dashboard de Monitoramento

### Arquivo: `routes/admin/whatsapp-dashboard.js`

```javascript
// routes/admin/whatsapp-dashboard.js
const express = require("express");
const router = express.Router();
const whatsappManager = require("../../services/whatsapp/WhatsappManager");

// Dashboard principal
router.get("/dashboard", async (req, res) => {
  try {
    const status = await whatsappManager.getStatus();
    const activeProvider = whatsappManager.getActiveProvider();
    const availableProviders = whatsappManager.getAvailableProviders();

    res.json({
      activeProvider,
      availableProviders,
      providers: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estatísticas por provider
router.get("/stats/:provider", async (req, res) => {
  try {
    const { provider } = req.params;
    const stats = await getProviderStats(provider);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trocar provider ativo
router.post("/switch/:provider", async (req, res) => {
  try {
    const { provider } = req.params;
    whatsappManager.switchProvider(provider);

    res.json({
      success: true,
      activeProvider: provider,
      message: `Provider alterado para ${provider}`,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Testar envio
router.post("/test-send", async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res
        .status(400)
        .json({ error: "Campos obrigatórios: to, message" });
    }

    const result = await whatsappManager.sendMessage(to, message);

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function getProviderStats(provider) {
  // Implementar lógica para buscar estatísticas
  // Por exemplo: mensagens enviadas, taxa de sucesso, etc.
  return {
    provider,
    messagesSent: 0,
    successRate: 0,
    lastActivity: new Date().toISOString(),
  };
}

module.exports = router;
```

---

## 🚀 Script de Inicialização

### Arquivo: `scripts/init-whatsapp.js`

```javascript
#!/usr/bin/env node

// scripts/init-whatsapp.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🚀 Inicializando configuração WhatsApp APIs...\n");

// Verifica se .env existe
const envPath = path.join(__dirname, "..", ".env");
if (!fs.existsSync(envPath)) {
  console.log("📝 Criando arquivo .env...");
  const envExample = fs.readFileSync(
    path.join(__dirname, "..", ".env.example"),
    "utf8"
  );
  fs.writeFileSync(envPath, envExample);
  console.log("✅ Arquivo .env criado. Configure suas credenciais!\n");
}

// Verifica dependências
console.log("📦 Verificando dependências...");
try {
  execSync("npm list axios", { stdio: "pipe" });
  console.log("✅ Dependências OK\n");
} catch (error) {
  console.log("⚠️  Instalando dependências...");
  execSync("npm install axios", { stdio: "inherit" });
  console.log("✅ Dependências instaladas\n");
}

// Cria diretórios necessários
const dirs = [
  "logs",
  "services/whatsapp/providers",
  "routes/webhooks",
  "tests",
];

dirs.forEach((dir) => {
  const dirPath = path.join(__dirname, "..", dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Diretório criado: ${dir}`);
  }
});

console.log("\n🎉 Inicialização completa!");
console.log("\n📋 Próximos passos:");
console.log("1. Configure suas credenciais no arquivo .env");
console.log("2. Escolha o provider padrão (EVOLUTION_ENABLED=true)");
console.log("3. Execute: npm run dev");
console.log("4. Acesse: http://localhost:3000/admin/whatsapp/dashboard\n");
```

---

## 📝 README de Configuração

### Arquivo: `WHATSAPP_CONFIG_README.md`

````markdown
# ⚙️ Configuração WhatsApp APIs - AltClinic

## 📋 Visão Geral

Este guia explica como configurar as três APIs WhatsApp suportadas pelo AltClinic.

## 🚀 Configuração Rápida

### 1. Inicializar Projeto

```bash
node scripts/init-whatsapp.js
```
````

### 2. Configurar Ambiente

```bash
cp .env.example .env
# Edite o arquivo .env com suas credenciais
```

### 3. Escolher Provider

```bash
# Para Evolution API (recomendado para começar)
EVOLUTION_ENABLED=true
META_ENABLED=false
ZAPI_ENABLED=false

# Para Meta API (produção enterprise)
EVOLUTION_ENABLED=false
META_ENABLED=true
ZAPI_ENABLED=false

# Para Z-API (Brasil)
EVOLUTION_ENABLED=false
META_ENABLED=false
ZAPI_ENABLED=true
```

### 4. Executar Testes

```bash
npm test -- --grep "WhatsApp"
```

## 🔧 Configuração Detalhada

### Evolution API

1. Instale o Docker
2. Execute: `docker run -p 8080:8080 atendai/evolution-api`
3. Configure as credenciais no `.env`
4. Acesse: http://localhost:8080 para conectar WhatsApp

### Meta API

1. Crie conta no [Meta Business](https://business.facebook.com/)
2. Configure app no [Meta Developers](https://developers.facebook.com/)
3. Obtenha tokens de acesso
4. Configure webhooks

### Z-API

1. Cadastre-se em [Z-API](https://z-api.io/)
2. Escolha um plano
3. Gere tokens de API
4. Configure webhooks

## 📊 Monitoramento

Acesse o dashboard em: `/admin/whatsapp/dashboard`

## 🧪 Testes

Execute testes com:

```bash
npm run test:whatsapp
```

## 🆘 Suporte

- **Evolution**: [GitHub Issues](https://github.com/EvolutionAPI/evolution-api/issues)
- **Meta**: [Developer Support](https://developers.facebook.com/support/)
- **Z-API**: [Suporte WhatsApp](https://wa.me/5511988888888)

```

---

## 🎯 Conclusão

Esta configuração permite que o AltClinic suporte múltiplas APIs WhatsApp simultaneamente, garantindo flexibilidade e alta disponibilidade.

**Próximos passos**:
1. Configure o ambiente de desenvolvimento
2. Escolha o provider inicial
3. Teste a integração
4. Implemente em produção

Para dúvidas, consulte os guias específicos de cada API ou entre em contato com o suporte.

---

**Última atualização**: Setembro 2025
**Versão**: 1.0
**Mantido por**: Equipe AltClinic
```
