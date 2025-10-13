# 🧪 Guia Completo: Teste Local Z-API Integration

## ✅ Status Atual

- ✅ Servidor rodando
- ✅ Tabelas do banco criadas
- ✅ Rotas Z-API implementadas e protegidas
- ✅ Frontend implementado
- ✅ Configuração básica OK

## 🚀 Configuração para Teste Local

### 1. Conta Z-API de Teste

```bash
# Acesse: https://z-api.io
# Crie conta gratuita para testes
# Obtenha API Key no painel
```

### 2. Configurar Ambiente

```bash
# Edite o arquivo .env
Z_API_KEY=sua-api-key-real-aqui
Z_API_URL=https://api.z-api.io/instances
```

### 3. Webhook Local (Opcional para testes avançados)

```bash
# Instale ngrok: https://ngrok.com
npm install -g ngrok

# Execute ngrok na porta 3000
ngrok http 3000

# Copie a URL gerada (ex: https://abc123.ngrok.io)
# Configure no painel Z-API em "Webhooks"
```

### 4. Teste Manual via API

#### 4.1 Login no Sistema

```bash
# Acesse: http://localhost:3001
# Faça login como administrador ou cliente
# Obtenha o token JWT (verifique no localStorage ou network tab)
```

#### 4.2 Teste Ativação Z-API

```bash
curl -X POST "http://localhost:3000/api/whatsapp/zapi/activate" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+5511999999999"
  }'
```

#### 4.3 Teste QR Code

```bash
curl -X GET "http://localhost:3000/api/whatsapp/zapi/qr/INSTANCE_ID_RETORNADO" \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

#### 4.4 Teste Status

```bash
curl -X GET "http://localhost:3000/api/whatsapp/zapi/status/INSTANCE_ID" \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

#### 4.5 Teste Envio de Mensagem

```bash
curl -X POST "http://localhost:3000/api/whatsapp/zapi/send" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511888888888",
    "message": "Olá! Teste da AltClinic via Z-API"
  }'
```

### 5. Teste via Frontend

#### 5.1 Acesse a Interface

```
http://localhost:3001/configuracoes/whatsapp
```

#### 5.2 Fluxo de Teste

1. **Ativação**: Digite número +5511999999999
2. **QR Code**: Clique "Obter QR Code"
3. **Conexão**: Escaneie com WhatsApp
4. **Envio**: Teste envio de mensagens
5. **Limites**: Verifique dashboard de uso

### 6. Teste de Limites e Upgrades

#### 6.1 Verificar Uso Atual

```bash
curl -X GET "http://localhost:3000/api/whatsapp/usage" \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

#### 6.2 Simular Upgrade

```bash
curl -X POST "http://localhost:3000/api/whatsapp/upgrade" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newPlan": "starter"
  }'
```

## 🐛 Troubleshooting

### Erro: "ECONNREFUSED"

```bash
# Servidor não está rodando
npm start
```

### Erro: "401 Unauthorized"

```bash
# Token JWT inválido ou expirado
# Faça login novamente no frontend
```

### Erro: "400 Bad Request"

```bash
# Dados inválidos na requisição
# Verifique formato do telefone: +5511999999999
```

### Erro: "Z-API API Key inválida"

```bash
# Verifique Z_API_KEY no .env
# Certifique-se que é uma key válida da Z-API
```

### Webhook não funciona

```bash
# Para testes locais, use ngrok
ngrok http 3000
# Configure a URL no painel Z-API
```

## 📊 Scripts de Teste Automatizado

### Teste Básico

```bash
node test-local-zapi.js
```

### Teste com Autenticação (criar depois)

```javascript
// test-zapi-auth.js
const axios = require("axios");

const BASE_URL = "http://localhost:3000";
const JWT_TOKEN = "SEU_TOKEN_AQUI";

async function testAuthenticated() {
  try {
    // Teste configuração
    const config = await axios.get(`${BASE_URL}/api/whatsapp/zapi/config`, {
      headers: { Authorization: `Bearer ${JWT_TOKEN}` },
    });
    console.log("Config:", config.data);

    // Teste ativação
    const activate = await axios.post(
      `${BASE_URL}/api/whatsapp/zapi/activate`,
      {
        phoneNumber: "+5511999999999",
      },
      {
        headers: {
          Authorization: `Bearer ${JWT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Activate:", activate.data);
  } catch (error) {
    console.error("Erro:", error.response?.data || error.message);
  }
}

testAuthenticated();
```

## 🎯 Checklist de Teste Completo

- [ ] Conta Z-API criada
- [ ] API Key configurada no .env
- [ ] Servidor rodando (`npm start`)
- [ ] Login realizado no frontend
- [ ] Ativação Z-API funciona
- [ ] QR Code gerado
- [ ] Conexão estabelecida
- [ ] Mensagem enviada
- [ ] Limites verificados
- [ ] Upgrade testado
- [ ] Webhook configurado (opcional)

## 📞 Suporte

- **Z-API Docs**: https://developer.z-api.io
- **AltClinic Issues**: Abra issue no repositório
- **Comunidade**: Discord/Slack da Z-API

---

**Data**: 25 de setembro de 2025
**Status**: ✅ Pronto para teste local
