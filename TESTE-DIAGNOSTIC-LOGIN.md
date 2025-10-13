# 🧪 TESTE DE LOGIN - Diagnostic Page

**Data:** 13 de Outubro de 2025  
**URL:** https://altclinic.onrender.com/diagnostic-login.html

---

## 📝 INSTRUÇÕES DE TESTE

### 1️⃣ Abra a Página de Diagnóstico

**URL:**
```
https://altclinic.onrender.com/diagnostic-login.html
```

### 2️⃣ Abra o Console do Navegador

**Pressione:** `F12` ou `Ctrl+Shift+I`  
**Vá para aba:** Console

---

## 🧪 TESTES DISPONÍVEIS

### Teste 1: Login com Tenant "teste"
**Botão:** 🔐 1. Testar Login (tenant: teste)

**O que faz:**
- Tenta login com tenant específico "teste"
- Email: thiagoborgh@gmail.com
- Senha: Altclinic123
- Header: X-Tenant-Slug: teste

**Resultado esperado:**
- ✅ Sucesso: Mostra credenciais e tenant
- ❌ Erro: "Usuário não encontrado" ou "Tenant não encontrado"

---

### Teste 2: Login com Auto-Detect ⭐ (RECOMENDADO)
**Botão:** 🔄 2. Testar Login (auto-detect tenant)

**O que faz:**
- Tenta login SEM especificar tenant
- Sistema busca automaticamente em todos os 36 tenants
- Encontra o tenant que contém o usuário

**Resultado esperado:**
- ✅ Sucesso: Mostra qual tenant tem o usuário
- ❌ Erro: Usuário não existe em nenhum tenant

---

### Teste 3: Criar Usuário no Tenant "teste"
**Botão:** ➕ 3. Criar Usuário no Tenant "teste"

**O que faz:**
- Mostra instruções para criar usuário via Shell do Render

---

### Teste 4: Formulário Manual
**Campos:**
- Email: thiagoborgh@gmail.com
- Senha: Altclinic123
- Tenant: teste (ou vazio para auto-detect)

**Botão:** 🚀 Testar Login

---

## 📊 O QUE VERIFICAR NO CONSOLE

### ✅ Logs Esperados (Sucesso):

```javascript
🔍 Verificando status...
📊 Status: {initialized: true, tenants: 36}
✅ CREDENCIAIS:
📧 email@example.com
🔑 senha_gerada
🏥 tenant-slug
```

### ❌ Logs de Erro:

```javascript
❌ Erro: Request failed with status code 401
{
  success: false,
  message: "Usuário não encontrado",
  errorType: "USER_NOT_FOUND"
}
```

---

## 🔍 DIAGNÓSTICO POR ERRO

### Erro: "Usuário não encontrado"
**Causa:** Email não existe no tenant especificado

**Solução:**
1. Teste com auto-detect (Teste 2)
2. Ou crie usuário no tenant "teste" (Teste 3)

---

### Erro: "Tenant não encontrado"
**Causa:** Tenant "teste" não existe entre os 36 tenants

**Solução:**
1. Use auto-detect para descobrir tenant correto
2. Ou crie tenant "teste" via Shell do Render

---

### Erro: "Invalid password"
**Causa:** Senha incorreta

**Solução:**
- Verifique se senha é: Altclinic123 (case-sensitive)
- Ou resete senha via Shell do Render

---

## 🚀 AÇÕES PASSO A PASSO

### Passo 1: Teste Auto-Detect (MAIS FÁCIL)

1. **Abra:**
   ```
   https://altclinic.onrender.com/diagnostic-login.html
   ```

2. **Abra Console (F12)**

3. **Clique em:**
   ```
   🔄 2. Testar Login (auto-detect tenant)
   ```

4. **Observe o Console:**
   - Se aparecer ✅: Copie o tenant slug
   - Se aparecer ❌: Usuário não existe

---

### Passo 2: Se Auto-Detect Funcionar

**Console mostrará algo como:**
```javascript
✅ LOGIN FUNCIONOU (Auto-Detect)!
Email: thiagoborgh@gmail.com
Nome: Thiago Borgh
Tenant: clinic-demo (clinic-demo)

📝 ATENÇÃO:
Use o tenant: clinic-demo
(não "teste")
```

**Ação:**
- Copie o tenant slug (ex: clinic-demo)
- Use esse tenant no login

---

### Passo 3: Se Auto-Detect Falhar

**Console mostrará:**
```javascript
❌ Usuário não encontrado
ou
❌ Falha no login
```

**Ação:**
- Criar usuário via Shell do Render
- Comando: `node create-first-user-production.js`

---

## 🔧 COMANDOS ÚTEIS NO CONSOLE

### Ver localStorage:
```javascript
console.log('Tenant:', localStorage.getItem('tenantSlug'));
console.log('Token:', localStorage.getItem('token'));
```

### Limpar localStorage:
```javascript
localStorage.clear();
console.log('✅ localStorage limpo');
```

### Testar login manualmente:
```javascript
fetch('https://altclinic.onrender.com/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'thiagoborgh@gmail.com',
    senha: 'Altclinic123'
  })
})
.then(r => r.json())
.then(d => console.log('Resultado:', d))
.catch(e => console.error('Erro:', e));
```

---

## 📝 CHECKLIST DE TESTE

- [ ] 1. Abri https://altclinic.onrender.com/diagnostic-login.html
- [ ] 2. Abri Console (F12)
- [ ] 3. Cliquei em "Testar Login (auto-detect)"
- [ ] 4. Li o resultado no console
- [ ] 5. Se ✅: Copiei o tenant slug
- [ ] 6. Se ❌: Vou criar usuário no Shell

---

## 🎯 RESULTADO ESPERADO

### Se der certo:
```
✅ Tenant encontrado: [algum-tenant]
✅ Login funcionou
✅ Token recebido
```

### Se não der certo:
```
❌ Usuário não encontrado em nenhum tenant
→ Precisa criar usuário
```

---

## 📞 ME AVISE

Após testar, me envie:

1. **Screenshot do console** (F12)
2. **Qual teste você fez** (1, 2, 3 ou 4)
3. **Mensagem de erro** (se houver)
4. **Resultado** (✅ funcionou ou ❌ erro)

---

**Teste agora e me conte o resultado!** 🧪
