# Solução Definitiva: SendGrid Gratuito

## 🎯 Por que SendGrid?

- Gmail está bloqueando conexões do Render
- SendGrid é confiável e gratuito (100 emails/dia)
- Melhor deliverability que Gmail
- Suporte profissional

## 📋 Passo 1: Criar Conta SendGrid

1. Acesse: https://sendgrid.com/free
2. Clique em **"Start for Free"**
3. Preencha dados:
   - Email: `contatoaltclinic@gmail.com`
   - Nome: AltClinic
   - Senha: (escolha segura)
4. Verifique email e confirme conta

## 📋 Passo 2: Gerar API Key

1. No painel SendGrid, vá para **Settings** → **API Keys**
2. Clique em **"Create API Key"**
3. Nome: `AltClinic SMTP`
4. Permissões: **Full Access** (ou Restricted Access → Mail Send)
5. Clique **"Create & View"**
6. **COPIE A API KEY** (aparece apenas uma vez!)

## 📋 Passo 3: Configurar no Render

Acesse: https://dashboard.render.com → altclinic → Environment

**Atualize/Substitua as variáveis:**

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SUA_API_KEY_DO_SENDGRID_AQUI
SMTP_FROM=contatoaltclinic@gmail.com
SMTP_FROM_NAME=AltClinic - Sistema de Gestão
```

**IMPORTANTE:** Substitua `SUA_API_KEY_DO_SENDGRID_AQUI` pela API Key real!

## 📋 Passo 4: Verificar Domínio (Opcional)

Para melhor deliverability:

1. No SendGrid → **Settings** → **Sender Authentication**
2. Adicione domínio: `altclinic.com` (se tiver)
3. Ou use Single Sender Verification com `contatoaltclinic@gmail.com`

## 📋 Passo 5: Testar

Após salvar no Render (~2-3 min para reiniciar):

### Teste 1: Criar Trial

- URL: https://altclinic.onrender.com
- Deve enviar email de boas-vindas

### Teste 2: Forgot Password

- URL: https://altclinic.onrender.com/login
- Clique "Esqueci minha senha"
- Deve enviar email de redefinição

## 📊 Limites SendGrid Gratuito

- **100 emails/dia** (suficiente para testes)
- **Upgrade:** $0.0015 por email adicional
- **Melhor deliverability** que Gmail

## 🔍 Verificar Logs

Após configurar, verifique logs do Render:

```
📧 Configurando SMTP: apikey → smtp.sendgrid.net:587
✅ Serviço de email inicializado com sucesso
📧 Email de redefinição enviado para: [email]
```

## 🚨 Troubleshooting

### API Key Errada

- Verifique se copiou corretamente
- Deve começar com `SG.`

### Porta Bloqueada

Se 587 não funcionar:

```
SMTP_PORT=2525
SMTP_SECURE=false
```

### Emails na SPAM

- Configure Sender Authentication
- Use domínio próprio se possível

## ✅ Benefícios SendGrid

- ✅ Funciona no Render (não bloqueia)
- ✅ Melhor deliverability
- ✅ Logs detalhados
- ✅ Suporte profissional
- ✅ Escalável

---

**Status:** Recomendação para migração imediata para SendGrid</content>
<parameter name="filePath">c:\Users\thiag\saee\SENDGRID-SOLUTION.md
