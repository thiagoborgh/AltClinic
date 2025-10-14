# Verificação de Email no Render

## 🔍 Problema Identificado
- ✅ Localhost: Email funcionando
- ❌ Render: Email não funcionando

## 📋 Verificação Necessária

### 1. Verificar Variáveis no Render
Acesse: https://dashboard.render.com → altclinic → Environment

**Variáveis necessárias:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=contatoaltclinic@gmail.com
SMTP_PASS=eeejahjghyvbrzoq
SMTP_FROM=contatoaltclinic@gmail.com
SMTP_FROM_NAME=AltClinic - Sistema de Gestão
```

### 2. Verificar se há duplicatas
Procure por variáveis duplicadas como:
- `EMAIL_FROM` (remover se existir)
- `SMTP_FROM_NAME` (deve ser apenas uma)

### 3. Teste de Conexão
Após atualizar, o serviço reinicia automaticamente (~2-3 min).

### 4. Verificar Logs
Acesse: https://dashboard.render.com → altclinic → Logs

Procure por:
```
✅ Serviço de email inicializado com sucesso
📧 Configurando SMTP: contatoaltclinic@gmail.com → smtp.gmail.com:465
```

### 5. Teste Funcional
- Criar trial: https://altclinic.onrender.com
- Ou forgot password: https://altclinic.onrender.com/login

## 🚨 Possíveis Problemas

### Gmail bloqueou o Render
1. Acesse: https://myaccount.google.com/security
2. Procure alertas de "Tentativa de login bloqueada"
3. Clique em "Isso fui eu" se aparecer

### Porta bloqueada
Se 465 não funcionar, tentar:
```
SMTP_PORT=587
SMTP_SECURE=false
```

### App Password expirado
Se o App Password foi regenerado recentemente, atualizar no Render.

## 🔧 Solução Alternativa: SendGrid

Se Gmail continuar bloqueando, usar SendGrid (gratuito):

1. Criar conta: https://sendgrid.com
2. Gerar API Key
3. Configurar no Render:
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SUA_API_KEY_DO_SENDGRID
```

## 📝 Checklist de Correção

- [ ] Verificar variáveis no Render
- [ ] Remover duplicatas
- [ ] Salvar mudanças (reinicia serviço)
- [ ] Verificar logs
- [ ] Testar funcionalidade
- [ ] Verificar alertas Gmail se necessário

---
**Status:** Aguardando verificação das variáveis no Render</content>
<parameter name="filePath">c:\Users\thiag\saee\DEBUG-EMAIL-RENDER.md