# 🧪 Guia de Desenvolvimento WhatsApp

## 📋 Configuração Rápida

### 1. Definir Seu Número de Teste

Edite o arquivo `.env.development` e coloque seu número WhatsApp:

```bash
DEV_WHATSAPP_NUMBER=5511999887766  # ← Seu número aqui
```

### 2. Configurar Ambiente

```bash
npm run setup:dev
```

### 3. Iniciar Aplicação

```bash
npm run dev:whatsapp
```

## 🎯 Como Funciona

### Conceito:

- **Todas as licenças/tenants** usam o **mesmo número** para WhatsApp durante desenvolvimento
- Você pode testar múltiplas clínicas enviando mensagens para seu próprio número
- Cada licença mantém suas próprias rotinas e dados

### Exemplo Prático:

```javascript
// Clínica A envia confirmação para "11999111111"
// Clínica B envia lembrete para "11999222222"
// Clínica C envia cobrança para "11999333333"

// ↓ TODAS chegam no seu número configurado ↓
// Seu WhatsApp: 5511999887766
```

## 🧪 Testes Disponíveis

### Testar Múltiplas Licenças:

```bash
npm run test:dev-whatsapp
```

### Testar Tipos de Mensagem:

```bash
npm run test:dev-mensagens
```

### Ver Status:

```bash
npm run setup:show
```

## 📱 Tipos de Mensagem Testáveis

### ✅ Confirmação de Agendamento

```javascript
const result = await whatsapp.sendAppointmentConfirmation({
  patientName: "João Silva",
  doctorName: "Dr. Carlos",
  appointmentDate: new Date(),
  appointmentTime: "14:30",
  phoneNumber: "11999999999", // Será enviado para seu número
  clinicName: "Clínica ABC",
});
```

### 🔔 Lembrete de Consulta

```javascript
const result = await whatsapp.sendAppointmentReminder({
  patientName: "Maria Santos",
  doctorName: "Dra. Ana",
  appointmentDate: new Date(),
  appointmentTime: "15:00",
  phoneNumber: "11999888777", // Será enviado para seu número
  clinicName: "Estética XYZ",
});
```

### 💰 Cobrança de Pagamento

```javascript
const result = await whatsapp.sendPaymentRequest({
  patientName: "Pedro Costa",
  amount: 150.0,
  description: "Consulta dermatológica",
  dueDate: new Date(),
  paymentLink: "https://pay.exemplo.com/123",
  phoneNumber: "11999777666", // Será enviado para seu número
});
```

### 📊 Pesquisa de Satisfação

```javascript
const result = await whatsapp.sendSatisfactionSurvey({
  patientName: "Ana Silva",
  doctorName: "Dr. Roberto",
  serviceDate: new Date(),
  phoneNumber: "11999666555", // Será enviado para seu número
  surveyLink: "https://survey.exemplo.com/123",
  clinicName: "Dermatologia 123",
});
```

## 🔍 Verificações

### Health Check com Info de Desenvolvimento:

```bash
curl http://localhost:3000/health
```

Resposta incluirá:

```json
{
  "development": {
    "is_development": true,
    "development_phone": "5511999887766",
    "environment": "development",
    "note": "Todas as mensagens serão enviadas para o número padrão"
  }
}
```

### Status WhatsApp:

```bash
curl http://localhost:3000/whatsapp/status
```

## 🔧 Comandos de Manutenção

### Resetar Configuração:

```bash
npm run setup:reset
```

### Ver Configuração Atual:

```bash
npm run setup:show
```

### Modo Produção (números reais):

```bash
NODE_ENV=production npm start
```

## 🎮 Fluxo de Desenvolvimento Típico

1. **Configurar uma vez:**

   ```bash
   # Editar .env.development com seu número
   npm run setup:dev
   ```

2. **Desenvolver/testar:**

   ```bash
   npm run dev:whatsapp
   ```

3. **Testar funcionalidades:**

   ```bash
   npm run test:dev-whatsapp
   npm run test:dev-mensagens
   ```

4. **Verificar mensagens no seu WhatsApp** 📱

5. **Repetir testes** conforme necessário

## ⚠️ Importante

- **Desenvolvimento**: Todas as mensagens vão para SEU número
- **Produção**: Cada tenant usa seus próprios números configurados no admin
- **Logs**: Mensagens mostram qual era o número original e para onde foi enviado
- **Automações**: Configuradas por tenant no admin

## 🚀 Pronto para Produção

Quando estiver pronto para produção:

1. Configure admin com números reais para cada tenant
2. Remova `USE_DEV_PHONE=true` do ambiente
3. Configure `NODE_ENV=production`
4. Cada licença usará seus próprios números WhatsApp

---

**🎯 Benefício**: Permite testar o sistema completo com múltiplas licenças usando apenas seu número pessoal!
