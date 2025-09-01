# 🏥 **NOVO SISTEMA DE LICENÇAS MÚLTIPLAS - ALTCLINIC**

## 📋 **RESUMO DAS MUDANÇAS IMPLEMENTADAS**

### 🎯 **OBJETIVO:**

Reestruturar o sistema para usar um domínio único (**altclinic.com.br**) com login unificado e seleção de licenças, permitindo que um usuário acesse múltiplas clínicas com o mesmo email.

---

## 🔄 **NOVA ARQUITETURA**

### **🌐 DOMÍNIO ÚNICO:**

- **Antes:** clinica1.altclinic.com.br, clinica2.altclinic.com.br
- **Agora:** altclinic.com.br (para todas as clínicas)

### **🔑 LOGIN UNIFICADO:**

- Mesmo email pode ter licenças em múltiplas clínicas
- Seleção de clínica após autenticação bem-sucedida
- Token JWT específico por licença ativa

### **👥 SISTEMA DE LICENÇAS:**

- Cada usuário pode ter múltiplas licenças (UserLicense)
- Cada licença vincula usuário + tenant + role + permissões
- Convites por email para novas licenças

---

## 🏗️ **ARQUIVOS CRIADOS/MODIFICADOS**

### **📊 BACKEND (Node.js + Express)**

#### **1. Modelos:**

- **`src/models/UserLicense.js`** _(NOVO)_
  - Modelo principal para gerenciar licenças múltiplas
  - Relaciona User + Tenant + Role + Permissões
  - Métodos para convites e validações

#### **2. Rotas de Autenticação:**

- **`src/routes/auth.js`** _(MODIFICADO)_
  - `POST /auth/login` - Login unificado com múltiplas licenças
  - `POST /auth/select-license` - Selecionar licença específica
  - `POST /auth/switch-license` - Trocar licença durante sessão
  - `POST /auth/invite-user` - Convidar usuário para clínica
  - `POST /auth/accept-invite/:token` - Aceitar convite
  - `GET /auth/my-licenses` - Listar licenças do usuário

#### **3. Middleware de Autenticação:**

- **`src/middleware/auth-new.js`** _(NOVO)_
  - Verificação de token JWT com licença específica
  - Validação de usuário + tenant + licença ativos
  - Autorização por role e permissões
  - Compatibilidade com sistema antigo

### **⚛️ FRONTEND (React + Material-UI)**

#### **1. Hook de Autenticação:**

- **`frontend/src/hooks/useAuth.js`** _(NOVO)_
  - Context Provider para gerenciar estado global
  - Funções: login, selectLicense, switchLicense
  - Estados: user, tenant, license, licenses

#### **2. Componentes de Interface:**

- **`frontend/src/components/Auth/LicenseSelector.js`** _(NOVO)_

  - Modal para seleção de clínica após login
  - Lista visual com informações de cada licença
  - Indicadores de plano e último acesso

- **`frontend/src/components/Auth/LicenseSwitcher.js`** _(NOVO)_
  - Componente para trocar clínica durante sessão
  - Menu dropdown com clínicas disponíveis
  - Badge com número de clínicas disponíveis

#### **3. Páginas:**

- **`frontend/src/pages/Login.js`** _(MODIFICADO)_

  - Integração com novo sistema de autenticação
  - Suporte a seleção de licença após login
  - Feedback visual para múltiplas licenças

- **`frontend/src/App.js`** _(MODIFICADO)_
  - AuthProvider envolvendo toda aplicação
  - Modal global de seleção de licença
  - Rotas protegidas com nova autenticação

---

## 🔐 **FLUXO DE AUTENTICAÇÃO**

### **🚀 NOVO FLUXO:**

1. **Login Unificado:**

   ```
   POST /auth/login
   { email, senha }
   ```

2. **Resposta com Uma Licença:**

   ```json
   {
     "success": true,
     "token": "jwt_token",
     "user": { ... },
     "tenant": { ... },
     "license": { ... },
     "singleLicense": true
   }
   ```

3. **Resposta com Múltiplas Licenças:**

   ```json
   {
     "success": true,
     "user": { ... },
     "licenses": [
       {
         "id": "license_id",
         "tenant": { "nome": "Clínica A" },
         "role": "admin"
       }
     ],
     "multipleLicenses": true
   }
   ```

4. **Seleção de Licença:**
   ```
   POST /auth/select-license
   { userId, licenseId }
   ```

---

## 🎨 **INTERFACE DO USUÁRIO**

### **📱 TELA DE LOGIN:**

- Campo de email e senha únicos
- Após login bem-sucedido:
  - **1 licença:** Acesso direto ao dashboard
  - **Múltiplas licenças:** Modal de seleção

### **🏥 MODAL DE SELEÇÃO:**

- Lista visual das clínicas disponíveis
- Informações de cada clínica:
  - Nome e plano (Trial, Starter, Professional, Enterprise)
  - Role do usuário (Proprietário, Admin, Médico, etc.)
  - Último acesso
- Seleção por clique no card

### **🔄 SWITCHER DE CLÍNICAS:**

- Ícone no header para usuários com múltiplas licenças
- Badge com número de clínicas disponíveis
- Menu dropdown com lista de clínicas
- Troca instantânea sem novo login

---

## 🔧 **CONFIGURAÇÕES NECESSÁRIAS**

### **📧 VARIÁVEIS DE AMBIENTE:**

```bash
# JWT Secret para tokens
JWT_SECRET=sua_chave_secreta_muito_forte

# URL do frontend para links em emails
FRONTEND_URL=https://altclinic.com.br

# Configurações de email para convites
SMTP_HOST=seu_servidor_smtp
SMTP_PORT=587
SMTP_USER=noreply@altclinic.com.br
SMTP_PASS=senha_do_email
```

### **🗄️ BANCO DE DADOS:**

```sql
-- Tabela de licenças (UserLicense)
CREATE TABLE user_licenses (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  tenantId UUID REFERENCES tenants(id),
  role ENUM('owner', 'admin', 'doctor', 'assistant', 'receptionist'),
  permissions JSON,
  status ENUM('active', 'inactive', 'invited', 'suspended'),
  inviteToken VARCHAR(255),
  inviteExpireAt TIMESTAMP,
  lastAccessAt TIMESTAMP,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

---

## ✅ **BENEFÍCIOS DA NOVA ARQUITETURA**

### **🎯 PARA USUÁRIOS:**

- **Login único:** Memorizar apenas um email/senha
- **Acesso múltiplo:** Gerenciar várias clínicas facilmente
- **Troca rápida:** Alternar entre clínicas sem novo login
- **Interface limpa:** Seleção visual e intuitiva

### **🏢 PARA O NEGÓCIO:**

- **Escalabilidade:** Fácil adicionar novas clínicas
- **Domínio único:** Branding consistente (altclinic.com.br)
- **Gestão centralizada:** Controle de acesso granular
- **Convites simplificados:** Sistema automatizado de convites

### **⚙️ PARA DESENVOLVIMENTO:**

- **Código limpo:** Separação clara de responsabilidades
- **Manutenção fácil:** Sistema modular e documentado
- **Compatibilidade:** Mantém funcionalidades existentes
- **Segurança:** JWT específico por licença ativa

---

## 🚀 **PRÓXIMOS PASSOS**

### **🔧 IMPLEMENTAÇÃO:**

1. **Migração do banco:** Executar scripts de criação das tabelas
2. **Deploy backend:** Atualizar API com novas rotas
3. **Deploy frontend:** Atualizar interface com novos componentes
4. **Configuração DNS:** Apontar altclinic.com.br para aplicação
5. **Testes:** Validar fluxos com múltiplas licenças

### **📈 MELHORIAS FUTURAS:**

- **SSO Integration:** Integração com Google/Microsoft
- **Mobile App:** Aplicativo nativo com mesmo sistema
- **Analytics:** Dashboard de uso por licença
- **API Keys:** Acesso programático por clínica
- **Auditoria:** Log completo de acessos e trocas

---

## 📞 **SUPORTE TÉCNICO**

Para dúvidas sobre implementação:

- **Documentação:** Consulte os comentários no código
- **Testes:** Execute a suíte de testes incluída
- **Logs:** Monitore logs do servidor para debugging
- **Rollback:** Sistema mantém compatibilidade com versão anterior

---

## 🎉 **CONCLUSÃO**

O novo sistema de licenças múltiplas transforma a experiência do usuário, mantendo a robustez técnica e oferecendo uma interface moderna e profissional. A arquitetura permite crescimento escalável e gestão centralizada, posicionando a AltClinic como líder em soluções SaaS para clínicas médicas.

**🏥 altclinic.com.br - Uma plataforma, infinitas possibilidades!**
