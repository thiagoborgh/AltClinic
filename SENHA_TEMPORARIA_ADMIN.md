# Funcionalidades de Senha Temporária no Admin

## 📧 Criar Tenant com Senha Temporária

### Endpoint: `POST /api/tenants/admin/create`

Cria um novo tenant e opcionalmente envia uma senha temporária por email.

**Parâmetros:**
```json
{
  "nome": "João Silva",
  "email": "joao@clinica.com",
  "telefone": "(11) 99999-9999",
  "clinica": "Clínica Saúde Total",
  "especialidade": "Dermatologia",
  "plano": "trial",
  "sendTempPassword": true,
  "customPassword": null
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Tenant criado com sucesso! Email enviado.",
  "tenant": {
    "id": "uuid-123",
    "slug": "clinica-saude-total",
    "nome": "Clínica Saúde Total",
    "email": "joao@clinica.com",
    "plano": "trial",
    "status": "trial"
  },
  "credentials": {
    "email": "joao@clinica.com",
    "temp_password": "AbCdEf12",
    "login_url": "https://app.com/login?tenant=clinica-saude-total"
  },
  "email_sent": true
}
```

## 🔄 Reenviar Senha Temporária

### Endpoint: `POST /api/tenants/admin/:tenantId/send-temp-password`

Reenvia uma nova senha temporária para o owner do tenant.

**Parâmetros (opcionais):**
```json
{
  "customPassword": "MinhaSenha123"
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Senha temporária reenviada com sucesso",
  "credentials": {
    "email": "joao@clinica.com",
    "temp_password": "XyZwVu34",
    "login_url": "https://app.com/login?tenant=clinica-saude-total"
  }
}
```

## 🎯 Funcionalidades Implementadas

### ✅ Criar Tenant Manualmente
- Formulário completo no painel admin
- Validação de dados obrigatórios
- Geração automática de slug único
- Suporte a diferentes planos (trial, basic, premium)
- Criação de database isolado
- Criação de usuário owner

### ✅ Envio de Senha Temporária
- Geração automática de senha forte (10 caracteres)
- Template de email personalizado
- Link direto para login
- Suporte a senha personalizada
- Logs de auditoria

### ✅ Reenvio de Senha
- Geração de nova senha
- Atualização no banco de dados
- Reenvio por email
- Confirmação de ação

## 🔧 Configuração de Email

Certifique-se de que as variáveis de ambiente de email estão configuradas:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app
EMAIL_FROM=AltClinic SaaS <seu_email@gmail.com>
```

## 📱 Interface Admin

### Botão "Novo Tenant"
- Localizado no cabeçalho da página de Licenças
- Abre modal com formulário completo
- Validação em tempo real

### Botão "Reenviar Senha"
- Ícone de envelope nas ações da tabela
- Confirmação antes de executar
- Feedback visual de sucesso/erro

## 🛡️ Segurança

- Senhas temporárias são hashadas com bcrypt
- Validação de email único por tenant
- Logs de auditoria para todas as ações
- Rate limiting nas APIs

## 📊 Monitoramento

Todas as ações são logadas no console:
```
🎯 Tenant criado pelo admin: Clínica Saúde Total (joao@clinica.com) - Slug: clinica-saude-total - Plano: trial
✅ Email enviado para joao@clinica.com - Tenant: Clínica Saúde Total
```</content>
<parameter name="filePath">c:\Users\thiag\saee\SENHA_TEMPORARIA_ADMIN.md
