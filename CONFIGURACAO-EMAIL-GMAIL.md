# Configuração de Email com Gmail

## 🎯 Objetivo

Configurar envio de emails transacionais (boas-vindas, recuperação de senha, etc) usando Gmail SMTP.

## 📋 Pré-requisitos

1. Conta Gmail ativa
2. Verificação em 2 Etapas habilitada
3. Acesso ao painel do Render.com

## 🔐 Passo 1: Gerar App Password do Gmail

### Por que App Password?

- Google não permite login com senha normal em aplicações de terceiros
- App Passwords são senhas específicas para apps com acesso seguro
- Requer Verificação em 2 Etapas ativa

### Como gerar:

1. **Habilitar 2FA (se ainda não estiver):**

   - Acesse: https://myaccount.google.com/security
   - Clique em **"Verificação em duas etapas"**
   - Siga as instruções (pode usar SMS ou app Authenticator)

2. **Gerar App Password:**
   - Acesse: https://myaccount.google.com/apppasswords
   - Ou navegue: Conta Google → Segurança → Verificação em duas etapas → Senhas de app
   - Clique em **"Selecionar app"** → **"Outro (nome personalizado)"**
   - Digite: `AltClinic SMTP` (ou qualquer nome)
   - Clique em **"Gerar"**
   - Copie a senha de 16 caracteres que aparece
   - **Importante:** Essa senha só aparece UMA vez! Guarde-a.

### Formato da senha:

```
Exibida: abcd efgh ijkl mnop
Para usar: abcdefghijklmnop (sem espaços)
```

## ⚙️ Passo 2: Configurar no Render

1. Acesse: https://dashboard.render.com
2. Selecione o serviço **altclinic**
3. Vá em **Environment** (menu lateral)
4. Adicione as seguintes variáveis:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=abcdefghijklmnop
SMTP_FROM=seu-email@gmail.com
SMTP_FROM_NAME=AltClinic - Sistema de Gestão
```

5. Clique em **"Save Changes"**
6. O serviço será reiniciado automaticamente

## 📧 Variáveis Explicadas

| Variável         | Valor            | Descrição                           |
| ---------------- | ---------------- | ----------------------------------- |
| `SMTP_HOST`      | `smtp.gmail.com` | Servidor SMTP do Gmail              |
| `SMTP_PORT`      | `587`            | Porta TLS (recomendada)             |
| `SMTP_SECURE`    | `false`          | false para porta 587, true para 465 |
| `SMTP_USER`      | Seu email Gmail  | Email remetente                     |
| `SMTP_PASS`      | App Password     | Senha de 16 caracteres gerada       |
| `SMTP_FROM`      | Seu email Gmail  | Email exibido como remetente        |
| `SMTP_FROM_NAME` | Nome do sistema  | Nome exibido ao destinatário        |

## ✅ Passo 3: Testar Configuração

Após configurar, teste criando um trial na landing page:

- URL: https://altclinic.onrender.com
- O sistema enviará email de boas-vindas
- Verifique inbox e spam

### Verificar logs:

```bash
# No Render → altclinic → Logs
# Procure por:
✅ Serviço de email inicializado com sucesso
✅ Conexão SMTP verificada com sucesso
📧 Email de primeiro acesso enviado para: [email]
```

## 🚨 Troubleshooting

### Erro: "Invalid login"

- ✅ Confirme que 2FA está habilitada
- ✅ Verifique se App Password está correto (16 caracteres, sem espaços)
- ✅ Use o App Password, NÃO a senha normal da conta

### Erro: "Connection timeout"

- ✅ Verifique `SMTP_PORT=587`
- ✅ Verifique `SMTP_SECURE=false`
- ✅ Teste com porta 465 + SMTP_SECURE=true

### Emails não chegam

- ✅ Verifique pasta de SPAM
- ✅ Verifique cota diária do Gmail (500 emails/dia para contas gratuitas)
- ✅ Verifique logs do Render para erros

### Email vai para SPAM

- ✅ Configure SPF record no domínio (se usar domínio próprio)
- ✅ Use email profissional ao invés de Gmail pessoal
- ✅ Considere serviços profissionais (SendGrid, AWS SES)

## 🔄 Alternativas ao Gmail

Se tiver problemas com Gmail, considere:

### SendGrid (Recomendado para produção)

- 100 emails/dia grátis
- Melhor deliverability
- Configuração similar

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=sua_api_key_do_sendgrid
```

### AWS SES

- Muito barato ($0.10/1000 emails)
- Alta deliverability
- Requer verificação de domínio

### Mailgun

- 5.000 emails/mês grátis
- Fácil configuração

## 📝 Notas Importantes

1. **Segurança:**

   - NUNCA commite App Passwords no git
   - Use apenas variáveis de ambiente
   - Revogue passwords não utilizados

2. **Limites do Gmail:**

   - 500 emails/dia para contas gratuitas
   - 2.000 emails/dia para Google Workspace
   - Rate limit de ~100 emails/hora

3. **Produção:**
   - Gmail é OK para testes/pequeno volume
   - Para produção, use serviço profissional (SendGrid, SES)
   - Configure domínio próprio para melhor deliverability

## 🔗 Links Úteis

- [Google Account Security](https://myaccount.google.com/security)
- [App Passwords](https://myaccount.google.com/apppasswords)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [Nodemailer Gmail Guide](https://nodemailer.com/usage/using-gmail/)

---

**Última atualização:** 14/10/2025
**Status:** ✅ Documentação completa
