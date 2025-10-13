# 📱 Evolution API - Guia de Uso Completo

## 📋 Visão Geral

A **Evolution API** é uma solução open source gratuita que permite integrar o WhatsApp Business ao AltClinic. Você hospeda seu próprio servidor, tendo controle total sobre os dados e funcionalidades.

---

## 🚀 Pré-requisitos

### Sistema Operacional

- Linux, macOS ou Windows
- Docker (recomendado) ou Node.js 18+

### Recursos Necessários

- **CPU**: 1 vCPU mínimo
- **RAM**: 512MB mínimo
- **Armazenamento**: 1GB para dados
- **Porta**: 8080 (configurável)

---

## 🛠️ Instalação e Configuração

### Opção 1: Docker (Recomendado)

```bash
# 1. Criar diretório para Evolution API
mkdir evolution-api && cd evolution-api

# 2. Criar arquivo docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  evolution-api:
    image: atendai/evolution-api:latest
    ports:
      - "8080:8080"
    environment:
      - AUTHENTICATION_API_KEY=sua-chave-segura-aqui
      - DATABASE_URL=sqlite:///./evolution.db
    volumes:
      - ./data:/evolution/data
    restart: unless-stopped
EOF

# 3. Executar container
docker-compose up -d

# 4. Verificar se está rodando
curl http://localhost:8080
```

### Opção 2: Instalação Manual

```bash
# 1. Clonar repositório
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# 2. Instalar dependências
npm install

# 3. Configurar ambiente
cp .env.example .env

# 4. Editar .env
nano .env
```

**Conteúdo do .env:**

```bash
# Configurações essenciais
AUTHENTICATION_API_KEY=sua-chave-api-segura-aqui
DATABASE_URL=sqlite:///./evolution.db

# Webhooks (AltClinic)
WEBHOOK_URL=http://localhost:3000/api/whatsapp/webhook/evolution
WEBHOOK_EVENTS=messages,status,connection

# Configurações adicionais
PORT=8080
LOG_LEVEL=info
NODE_ENV=production
```

```bash
# 5. Executar aplicação
npm run build
npm start
```

---

## 🔧 Configuração no AltClinic

### Passo 1: Acessar Interface

1. Faça login no AltClinic
2. Vá para **Configurações** → **WhatsApp**
3. Selecione **Evolution API**

### Passo 2: Configurar Credenciais

```
API URL: http://localhost:8080
API Key: sua-chave-segura-aqui
Nome da Instância: altclinic
```

### Passo 3: Registrar Instância

```bash
curl -X POST http://localhost:3000/api/whatsapp/evolution/activate \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "altclinic",
    "apiUrl": "http://localhost:8080",
    "apiKey": "sua-chave-api-segura-aqui"
  }'
```

---

## 📱 Conexão WhatsApp

### Passo 1: Criar Instância no Painel

1. Acesse: `http://localhost:8080`
2. Faça login com sua API Key
3. Crie uma nova instância:
   - **Nome**: `altclinic` (mesmo nome usado no AltClinic)
   - **Webhook URL**: `http://localhost:3000/api/whatsapp/webhook/evolution`

### Passo 2: Obter QR Code

```bash
# Via API
curl -X GET http://localhost:3000/api/whatsapp/evolution/qr/evolution_altclinic_TIMESTAMP \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

**Resposta:**

```json
{
  "success": true,
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "instanceId": "evolution_altclinic_1234567890",
  "status": "pending"
}
```

### Passo 3: Escanear QR Code

1. Abra WhatsApp no celular
2. Vá em **Menu (⋮)** → **Dispositivos conectados**
3. Toque em **"Conectar um dispositivo"**
4. Escaneie o QR Code exibido

### Passo 4: Verificar Conexão

```bash
curl -X GET http://localhost:3000/api/whatsapp/evolution/status/evolution_altclinic_TIMESTAMP \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

**Status esperado:**

```json
{
  "success": true,
  "status": "connected",
  "instanceId": "evolution_altclinic_1234567890"
}
```

---

## 💬 Envio de Mensagens

### Mensagem de Texto Simples

```bash
curl -X POST http://localhost:3000/api/whatsapp/evolution/send \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+5511999999999",
    "message": "Olá! Bem-vindo à nossa clínica! 😊"
  }'
```

### Mensagem com Mídia

```bash
curl -X POST http://localhost:3000/api/whatsapp/evolution/send \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+5511999999999",
    "message": "Confira nossa promoção!",
    "media": {
      "type": "image",
      "url": "https://exemplo.com/imagem.jpg",
      "caption": "Tratamento especial!"
    }
  }'
```

---

## 🔄 Webhooks e Eventos

### Configuração de Webhooks

A Evolution API envia eventos automaticamente para o AltClinic:

```javascript
// Eventos suportados:
-messages - // Novas mensagens
  status - // Status de mensagens
  connection - // Status da conexão
  qrcode - // QR Code atualizado
  battery; // Nível da bateria
```

### Recebimento de Mensagens

Quando uma mensagem é recebida, o webhook é chamado:

```json
{
  "event": "messages",
  "instance": "altclinic",
  "data": {
    "from": "+5511999999999",
    "body": "Olá, gostaria de agendar uma consulta",
    "timestamp": 1634567890
  }
}
```

---

## 📊 Monitoramento e Logs

### Verificar Status da API

```bash
curl http://localhost:8080/instance/connectionState/altclinic \
  -H "apikey: sua-chave-api-segura-aqui"
```

### Logs do Servidor

```bash
# Docker logs
docker logs evolution-api

# Ou arquivo de log
tail -f evolution-api/logs/app.log
```

### Métricas de Uso

```bash
# Ver uso no AltClinic
curl -X GET http://localhost:3000/api/whatsapp/usage \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

---

## 🔧 Manutenção e Troubleshooting

### Problemas Comuns

#### 1. QR Code não aparece

```bash
# Verificar se instância existe
curl http://localhost:8080/instance/fetchInstances \
  -H "apikey: sua-chave-api-segura-aqui"
```

#### 2. Mensagens não são enviadas

```bash
# Verificar conexão
curl http://localhost:8080/instance/connectionState/altclinic \
  -H "apikey: sua-chave-api-segura-aqui"
```

#### 3. Webhook não funciona

```bash
# Testar webhook manualmente
curl -X POST http://localhost:3000/api/whatsapp/webhook/evolution \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

### Backup e Restauração

```bash
# Backup do banco
cp evolution.db evolution-backup.db

# Backup de configurações
cp .env .env.backup
```

### Atualização

```bash
# Parar container
docker-compose down

# Atualizar imagem
docker-compose pull

# Reiniciar
docker-compose up -d
```

---

## 📈 Limites e Performance

### Limites da Evolution API

- **Mensagens**: Ilimitadas (depende da infraestrutura)
- **Conexões**: 1 por instância
- **Taxa**: Sem limite artificial
- **Armazenamento**: Depende do disco disponível

### Otimização de Performance

```javascript
// Configurações recomendadas para produção
NODE_ENV = production;
LOG_LEVEL = warn;
DATABASE_CONNECTION_LIMIT = 10;
CACHE_REDIS = true;
```

---

## 🔒 Segurança

### Boas Práticas

- ✅ Use HTTPS em produção
- ✅ API Key forte e única
- ✅ Firewalls configurados
- ✅ Backups regulares
- ✅ Logs de auditoria

### Configuração de Segurança

```bash
# .env seguro
AUTHENTICATION_API_KEY=chave-muito-forte-aqui-123456789
NODE_ENV=production
CORS_ORIGIN=https://seudominio.com
```

---

## 🎯 Casos de Uso

### Clínica Pequena

- **Instâncias**: 1-2
- **Mensagens/dia**: 50-200
- **Uso**: Agendamentos e lembretes

### Rede de Clínicas

- **Instâncias**: 5-20
- **Mensagens/dia**: 500-2000
- **Uso**: Comunicação multi-filial

### Centro Médico Grande

- **Instâncias**: 20+
- **Mensagens/dia**: 2000+
- **Uso**: Sistema completo de comunicação

---

## 📞 Suporte

### Comunidade

- **GitHub**: https://github.com/EvolutionAPI/evolution-api
- **Discord**: https://evolution-api.com/discord
- **WhatsApp**: https://evolution-api.com/whatsapp

### Documentação Oficial

- **Docs**: https://doc.evolution-api.com/
- **Postman**: https://evolution-api.com/postman

---

## ✅ Checklist de Implementação

- [ ] Servidor Evolution API instalado
- [ ] API Key configurada
- [ ] Webhooks configurados
- [ ] Instância criada no painel
- [ ] QR Code escaneado
- [ ] Conexão verificada
- [ ] Mensagem de teste enviada
- [ ] Webhooks funcionando
- [ ] Monitoramento ativo

---

**Status**: ✅ Pronto para produção
**Versão**: 2.0+
**Última atualização**: Setembro 2025
