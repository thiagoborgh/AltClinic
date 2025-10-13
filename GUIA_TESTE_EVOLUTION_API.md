# 🧪 Guia Completo: Teste da Evolution API no AltClinic

## 📋 Visão Geral

Este guia mostra como testar completamente a integração da Evolution API no AltClinic, desde a configuração inicial até testes avançados de produção.

---

## 🚀 Pré-requisitos para Teste

### 1. Evolution API Rodando

```bash
# Verificar se está rodando
curl http://localhost:8080/instance/fetchInstances \
  -H "apikey: SUA_API_KEY"
```

### 2. AltClinic Configurado

```bash
# Verificar se AltClinic está rodando
curl http://localhost:3000/health
```

### 3. Conta WhatsApp

- Número de telefone válido
- WhatsApp Business instalado
- Acesso ao celular para escanear QR Code

---

## 🧪 Teste Passo-a-Passo

### **Passo 1: Teste Básico da API**

#### 1.1 Verificar Status da Evolution API

```bash
curl -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: SUA_API_KEY" \
  -H "Content-Type: application/json"
```

**Resposta esperada:**

```json
{
  "instances": []
}
```

#### 1.2 Criar Instância de Teste

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "test-instance",
    "token": "test-token",
    "qrcode": true
  }'
```

**Resposta esperada:**

```json
{
  "instance": {
    "instanceName": "test-instance",
    "status": "created"
  }
}
```

---

### **Passo 2: Teste de Conexão WhatsApp**

#### 2.1 Obter QR Code

```bash
curl -X GET http://localhost:8080/instance/qrCode/test-instance \
  -H "apikey: SUA_API_KEY"
```

**Resposta esperada:**

```json
{
  "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "code": "QR_CODE_STRING"
}
```

#### 2.2 Verificar Status da Conexão

```bash
curl -X GET http://localhost:8080/instance/connectionState/test-instance \
  -H "apikey: SUA_API_KEY"
```

**Estados possíveis:**

- `"connecting"` - Conectando
- `"connected"` - Conectado ✅
- `"disconnected"` - Desconectado
- `"qrcode"` - Aguardando QR Code

---

### **Passo 3: Teste de Envio de Mensagens**

#### 3.1 Mensagem de Texto Simples

```bash
curl -X POST http://localhost:8080/message/sendText/test-instance \
  -H "apikey: SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "text": "Olá! Teste da Evolution API no AltClinic 🧪"
  }'
```

**Resposta esperada:**

```json
{
  "key": {
    "id": "MESSAGE_ID"
  },
  "message": {
    "extendedTextMessage": {
      "text": "Olá! Teste da Evolution API no AltClinic 🧪"
    }
  },
  "messageTimestamp": 1695678901,
  "status": "sent"
}
```

#### 3.2 Mensagem com Imagem

```bash
curl -X POST http://localhost:8080/message/sendMedia/test-instance \
  -H "apikey: SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "mediatype": "image",
    "media": "https://picsum.photos/400/300",
    "caption": "Imagem de teste da Evolution API"
  }'
```

#### 3.3 Mensagem com Botões

```bash
curl -X POST http://localhost:8080/message/sendButtons/test-instance \
  -H "apikey: SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "title": "Agendamento AltClinic",
    "description": "Escolha uma opção:",
    "buttons": [
      {
        "buttonText": {
          "displayText": "Agendar Consulta"
        }
      },
      {
        "buttonText": {
          "displayText": "Ver Serviços"
        }
      }
    ]
  }'
```

---

### **Passo 4: Teste de Webhooks**

#### 4.1 Configurar Webhook na Instância

```bash
curl -X POST http://localhost:8080/webhook/set/test-instance \
  -H "apikey: SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:3000/api/whatsapp/webhook/evolution",
    "enabled": true,
    "events": ["message", "status", "connection"]
  }'
```

#### 4.2 Testar Webhook Manualmente

```bash
curl -X POST http://localhost:3000/api/whatsapp/webhook/evolution \
  -H "Content-Type: application/json" \
  -d '{
    "event": "test",
    "instance": "test-instance",
    "data": {
      "message": "Webhook funcionando! ✅"
    }
  }'
```

#### 4.3 Verificar Logs do Webhook

```bash
# Verificar logs do AltClinic
tail -f logs/whatsapp.log
```

---

### **Passo 5: Teste via AltClinic Frontend**

#### 5.1 Login no Sistema

1. Acesse: `http://localhost:3000/login`
2. Faça login com credenciais de teste

#### 5.2 Configurar WhatsApp

1. Vá para **Configurações** → **WhatsApp**
2. Selecione **Evolution API**
3. Configure:
   - **API URL**: `http://localhost:8080`
   - **API Key**: `SUA_API_KEY`
   - **Nome da Instância**: `test-instance`

#### 5.3 Testar Envio

1. Vá para **Mensagens** ou **Chat**
2. Envie uma mensagem de teste
3. Verifique se chegou no WhatsApp

---

## 📊 Scripts de Teste Automatizado

### **Script Básico de Teste**

Crie o arquivo `test-evolution-api.js`:

```javascript
// test-evolution-api.js
const axios = require("axios");

const API_BASE = "http://localhost:8080";
const API_KEY = "SUA_API_KEY";
const INSTANCE_NAME = "test-instance";
const TEST_NUMBER = "5511999999999"; // Número de teste

class EvolutionTester {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: {
        apikey: API_KEY,
        "Content-Type": "application/json",
      },
    });
  }

  async testConnection() {
    try {
      console.log("🔍 Testando conexão com Evolution API...");
      const response = await this.client.get("/instance/fetchInstances");
      console.log("✅ API conectada:", response.data);
      return true;
    } catch (error) {
      console.error("❌ Erro na conexão:", error.message);
      return false;
    }
  }

  async testInstanceCreation() {
    try {
      console.log("📱 Criando instância de teste...");
      const response = await this.client.post("/instance/create", {
        instanceName: INSTANCE_NAME,
        token: "test-token",
        qrcode: true,
      });
      console.log("✅ Instância criada:", response.data);
      return true;
    } catch (error) {
      console.error("❌ Erro ao criar instância:", error.message);
      return false;
    }
  }

  async testQRCode() {
    try {
      console.log("📷 Obtendo QR Code...");
      const response = await this.client.get(
        `/instance/qrCode/${INSTANCE_NAME}`
      );
      console.log("✅ QR Code obtido (base64)");
      return response.data.base64 ? true : false;
    } catch (error) {
      console.error("❌ Erro ao obter QR Code:", error.message);
      return false;
    }
  }

  async testConnectionStatus() {
    try {
      console.log("📊 Verificando status da conexão...");
      const response = await this.client.get(
        `/instance/connectionState/${INSTANCE_NAME}`
      );
      console.log("📊 Status:", response.data);
      return true;
    } catch (error) {
      console.error("❌ Erro ao verificar status:", error.message);
      return false;
    }
  }

  async testSendMessage() {
    try {
      console.log("💬 Enviando mensagem de teste...");
      const response = await this.client.post(
        `/message/sendText/${INSTANCE_NAME}`,
        {
          number: TEST_NUMBER,
          text: `🧪 Teste Evolution API - ${new Date().toLocaleString()}`,
        }
      );
      console.log("✅ Mensagem enviada:", response.data);
      return true;
    } catch (error) {
      console.error("❌ Erro ao enviar mensagem:", error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log("🚀 Iniciando testes da Evolution API...\n");

    const results = {
      connection: await this.testConnection(),
      instance: await this.testInstanceCreation(),
      qrcode: await this.testQRCode(),
      status: await this.testConnectionStatus(),
      message: await this.testSendMessage(),
    };

    console.log("\n📊 Resultado dos testes:");
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? "✅" : "❌"} ${test}`);
    });

    const passedCount = Object.values(results).filter(Boolean).length;
    console.log(`\n🎯 ${passedCount}/5 testes passaram`);

    return results;
  }
}

// Executar testes
if (require.main === module) {
  const tester = new EvolutionTester();
  tester.runAllTests().catch(console.error);
}

module.exports = EvolutionTester;
```

#### Executar Teste Automatizado

```bash
# Instalar dependências se necessário
npm install axios

# Executar teste
node test-evolution-api.js
```

---

## 🔍 Testes Avançados

### **Teste de Performance**

```javascript
// test-performance.js
const EvolutionTester = require("./test-evolution-api");

async function performanceTest() {
  const tester = new EvolutionTester();
  const startTime = Date.now();

  // Enviar 10 mensagens em sequência
  for (let i = 1; i <= 10; i++) {
    await tester.testSendMessage();
    console.log(`📤 Mensagem ${i}/10 enviada`);
  }

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log(`\n⚡ Performance: ${duration}s para 10 mensagens`);
  console.log(`📊 Média: ${duration / 10}s por mensagem`);
}
```

### **Teste de Limites**

```javascript
// test-limits.js
async function testLimits() {
  const tester = new EvolutionTester();

  // Testar mensagens grandes
  const longMessage = "A".repeat(4096); // WhatsApp limit
  await tester.client.post(`/message/sendText/${INSTANCE_NAME}`, {
    number: TEST_NUMBER,
    text: longMessage,
  });

  // Testar múltiplos destinatários
  const numbers = ["5511999999999", "5511988888888", "5511977777777"];
  for (const number of numbers) {
    await tester.client.post(`/message/sendText/${INSTANCE_NAME}`, {
      number,
      text: "Teste broadcast",
    });
  }
}
```

### **Teste de Webhook Events**

```javascript
// test-webhook-events.js
const express = require("express");
const app = express();

app.use(express.json());

// Capturar eventos do webhook
app.post("/webhook/evolution", (req, res) => {
  console.log("📨 Webhook recebido:", req.body);
  res.json({ success: true });
});

app.listen(3001, () => {
  console.log("🎧 Webhook listener rodando na porta 3001");
});
```

---

## 🐛 Troubleshooting de Testes

### **Problema: QR Code não aparece**

```bash
# Verificar se instância existe
curl http://localhost:8080/instance/fetchInstances \
  -H "apikey: SUA_API_KEY"

# Recriar instância se necessário
curl -X DELETE http://localhost:8080/instance/delete/test-instance \
  -H "apikey: SUA_API_KEY"
```

### **Problema: Mensagens não são enviadas**

```bash
# Verificar status da conexão
curl http://localhost:8080/instance/connectionState/test-instance \
  -H "apikey: SUA_API_KEY"

# Verificar se número está correto (formato internacional)
# Exemplo: 5511999999999 (Brasil)
```

### **Problema: Webhook não funciona**

```bash
# Testar URL do webhook
curl -X POST http://localhost:3000/api/whatsapp/webhook/evolution \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Verificar logs
tail -f logs/whatsapp.log
```

### **Problema: Erro 401 Unauthorized**

```bash
# Verificar API Key
curl http://localhost:8080/instance/fetchInstances \
  -H "apikey: VERIFIQUE_SUA_API_KEY"
```

---

## 📋 Checklist de Teste Completo

### ✅ Testes Básicos

- [ ] Evolution API rodando
- [ ] Instância criada
- [ ] QR Code gerado
- [ ] WhatsApp conectado
- [ ] Mensagem de texto enviada
- [ ] Mensagem com mídia enviada

### ✅ Testes Intermediários

- [ ] Webhook configurado
- [ ] Eventos recebidos
- [ ] Mensagens recebidas processadas
- [ ] Botões funcionais
- [ ] Grupos suportados

### ✅ Testes Avançados

- [ ] Performance (múltiplas mensagens)
- [ ] Limites testados
- [ ] Error handling
- [ ] Reconeção automática
- [ ] Backup e restauração

### ✅ Testes de Integração

- [ ] AltClinic configurado
- [ ] Frontend funcionando
- [ ] Banco de dados integrado
- [ ] Múltiplos tenants
- [ ] Logs monitorados

---

## 🎯 Próximos Passos Após Teste

### **Se todos os testes passaram:**

1. ✅ Configurar ambiente de produção
2. ✅ Implementar monitoramento
3. ✅ Criar documentação para usuários
4. ✅ Treinar equipe de suporte

### **Se algum teste falhou:**

1. 🔍 Identificar problema específico
2. 📖 Consultar documentação de troubleshooting
3. 🐛 Reportar bug se necessário
4. 🔄 Repetir teste após correção

---

## 📞 Suporte

**Precisa de ajuda com testes?**

- 📧 **Email**: suporte@altclinic.com
- 💬 **WhatsApp**: +55 11 99999-9999
- 📚 **Documentação**: [Evolution API Docs](https://doc.evolution-api.com/)
- 🐛 **Issues**: [GitHub Issues](https://github.com/EvolutionAPI/evolution-api/issues)

---

**Última atualização**: Setembro 2025
**Versão**: 1.0
**Mantido por**: Equipe AltClinic
