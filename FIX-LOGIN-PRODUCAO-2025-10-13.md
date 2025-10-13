# 🚨 FIX: Erro de Login em Produção (Render)

**Data:** 13 de Outubro de 2025  
**Status:** 🔴 CRÍTICO  
**Problema:** Usuário não encontrado no banco de dados

---

## 📋 Análise do Erro

### Erro Console:
```javascript
🌐 API ERROR: 401 POST /auth/login
{
  success: false, 
  message: 'Usuário não encontrado', 
  errorType: 'USER_NOT_FOUND',
  hint: 'Verifique se o email está correto ou se você tem acesso a esta clínica.'
}
```

### Causa Raiz:
- ✅ API está funcionando (retorna 401 correto)
- ✅ Tenant "teste" está sendo enviado no header
- ❌ **Banco de dados está vazio** - usuário não existe no tenant

---

## 🔧 Soluções

### ⭐⭐⭐ Solução SUPER FÁCIL: Página de Inicialização

**A forma mais simples de todas!**

1. **Acesse a página de inicialização:**
   ```
   https://altclinic.onrender.com/init-system.html
   ```

2. **Clique no botão "Inicializar Sistema Agora"**

3. **Copie as credenciais geradas** (email, senha, tenant)

4. **Clique em "Ir para Login"**

5. **Pronto! 🎉**

---

### ⭐⭐ Solução RÁPIDA: Via Console do Navegador

**Não precisa acessar Shell do Render!**

1. **Abra o site em produção:**
   ```
   https://altclinic.onrender.com
   ```

2. **Abra o Console (F12)**

3. **Cole este código:**
   ```javascript
   fetch('https://altclinic.onrender.com/api/auth/init-system', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' }
   })
   .then(r => r.json())
   .then(data => {
     console.log('✅ SISTEMA INICIALIZADO!');
     console.log('📧 Email:', data.credentials.email);
     console.log('🔑 Senha:', data.credentials.password);
     console.log('🏥 Tenant:', data.credentials.tenant);
     console.log('\n⚠️ SALVE ESSAS CREDENCIAIS!');
   })
   .catch(err => console.error('❌ Erro:', err));
   ```

4. **Copie as credenciais que aparecerem**

5. **Faça login com elas!**

---

### Solução 1: Criar usuário via Terminal Render

1. **Acesse o Dashboard do Render:**
   - https://dashboard.render.com
   - Selecione seu serviço "altclinic"

2. **Abra o Shell:**
   - Clique em "Shell" no menu lateral
   - Ou vá em: https://dashboard.render.com/web/[seu-service-id]/shell

3. **Execute o script:**
   ```bash
   node create-first-user-production.js
   ```

4. **Verifique a saída:**
   ```
   ✅ SUCESSO! Agora você pode fazer login com:
      Email: thiagoborgh@gmail.com
      Senha: Altclinic123
      Tenant: teste
   ```

5. **Tente fazer login novamente**

---

### Solução 2: Usar endpoint init-system via API (MAIS FÁCIL) ⭐

1. **Execute via curl:**
   ```bash
   curl -X POST https://altclinic.onrender.com/api/auth/init-system \
     -H "Content-Type: application/json"
   ```

2. **Ou via Postman:**
   - Método: `POST`
   - URL: `https://altclinic.onrender.com/api/auth/init-system`
   - Headers: `Content-Type: application/json`

3. **Ou abra no navegador e use console:**
   ```javascript
   // Cole no console do navegador (F12)
   fetch('https://altclinic.onrender.com/api/auth/init-system', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' }
   })
   .then(r => r.json())
   .then(console.log)
   ```

4. **Resposta esperada:**
   ```json
   {
     "success": true,
     "message": "Sistema inicializado com sucesso",
     "initialized": true,
     "credentials": {
       "email": "admin@sistema.local",
       "password": "senha_gerada_automaticamente",
       "tenant": "teste"
     }
   }
   ```

5. **⚠️ IMPORTANTE:** Salve as credenciais retornadas!

---

### Solução 3: Via package.json script

1. **No Shell do Render, execute:**
   ```bash
   npm run init:production
   ```

2. **Aguarde a confirmação:**
   ```
   ✅ Primeiro acesso criado com sucesso!
   ```

---

## 🔍 Verificações Pós-Fix

### 1. Verificar banco de dados

```bash
# No Shell do Render
node -e "const db = require('better-sqlite3')('./data/master.db'); console.log(db.prepare('SELECT * FROM tenants').all())"
```

### 2. Verificar usuários do tenant

```bash
# No Shell do Render
node -e "const db = require('better-sqlite3')('./data/tenant_teste.db'); console.log(db.prepare('SELECT id, nome, email, role FROM usuarios').all())"
```

### 3. Testar login via curl

```bash
curl -X POST https://altclinic.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Slug: teste" \
  -d '{
    "email": "thiagoborgh@gmail.com",
    "senha": "Altclinic123"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tenant": { ... }
}
```

---

## 📝 Checklist de Verificação

- [ ] Script `create-first-user-production.js` executado
- [ ] Tenant "teste" existe no banco master
- [ ] Usuário existe no banco do tenant
- [ ] Senha foi hasheada corretamente (bcrypt)
- [ ] Login retorna token JWT
- [ ] Frontend recebe e armazena o token
- [ ] Usuário é redirecionado para dashboard

---

## 🐛 Problemas Comuns

### Erro: "Cannot find module 'better-sqlite3'"
**Solução:**
```bash
npm install better-sqlite3
npm rebuild better-sqlite3
```

### Erro: "ENOENT: no such file or directory 'data/master.db'"
**Solução:**
```bash
mkdir -p data
node src/utils/productionInitializer.js
```

### Erro: "Table 'usuarios' doesn't exist"
**Solução:**
```bash
npm run migrate
```

### Erro: "bcrypt compare failed"
**Solução:**
```bash
# Recriar usuário com nova senha
node create-first-user-production.js
```

---

## 🔐 Credenciais Padrão

**Para desenvolvimento/teste:**
- Email: `thiagoborgh@gmail.com`
- Senha: `Altclinic123`
- Tenant: `teste`

**⚠️ IMPORTANTE:** Alterar senha após primeiro acesso em produção!

---

## 📊 Logs para Debug

### Backend (Render Logs):
```
🔐 LOGIN: tenantSlug from header: teste
🔐 LOGIN: tenant found: { id: 1, nome: 'Clínica Teste', slug: 'teste' }
🔐 LOGIN: calling authenticate for tenant: 1
🔐 LOGIN: authenticate result: { success: true, user: {...} }
```

### Frontend (Console):
```
🔐 LOGIN: Iniciando login para: thiagoborgh@gmail.com
🌐 API REQUEST: POST https://altclinic.onrender.com/api/auth/login
🌐 API: Added X-Tenant-Slug header: teste
✅ Login realizado com sucesso
```

---

## 🚀 Próximos Passos

1. ✅ Executar uma das soluções acima
2. ✅ Verificar usuário criado
3. ✅ Testar login no frontend
4. ✅ Confirmar redirecionamento
5. ✅ Alterar senha padrão
6. 📝 Documentar credenciais seguras

---

## 📞 Suporte

Se o problema persistir:

1. **Verifique logs do Render:**
   - Dashboard → Service → Logs
   - Procure por erros de banco de dados

2. **Verifique variáveis de ambiente:**
   - `JWT_SECRET` configurado?
   - `MASTER_DB_PATH` correto?
   - `NODE_ENV=production`?

3. **Reinicie o serviço:**
   - Dashboard → Manual Deploy
   - Ou: Settings → Restart Service

---

**Autor:** GitHub Copilot  
**Última atualização:** 13/10/2025  
**Versão:** 1.0.0
