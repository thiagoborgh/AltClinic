# 🚀 SOLUÇÃO RÁPIDA: Login em Produção

## ❌ Problema

Erro ao fazer login: **"Usuário não encontrado"**

## ✅ Solução (3 opções, escolha a mais fácil)

### 🥇 Opção 1: Página de Inicialização (MAIS FÁCIL)

1. **Acesse:** https://altclinic.onrender.com/init-system.html
2. **Clique em:** "Inicializar Sistema Agora"
3. **Copie as credenciais** geradas
4. **Faça login!** 🎉

---

### 🥈 Opção 2: Console do Navegador

1. Acesse: https://altclinic.onrender.com
2. Pressione **F12** (abrir console)
3. Cole este código:

```javascript
fetch("https://altclinic.onrender.com/api/auth/init-system", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
})
  .then((r) => r.json())
  .then((data) => {
    console.log("✅ CREDENCIAIS:");
    console.log("📧", data.credentials.email);
    console.log("🔑", data.credentials.password);
    console.log("🏥", data.credentials.tenant);
  });
```

4. Copie as credenciais
5. Faça login!

---

### 🥉 Opção 3: Shell do Render

1. Acesse: https://dashboard.render.com
2. Selecione seu serviço "altclinic"
3. Clique em "Shell"
4. Execute:

```bash
node quick-init-production.js
```

5. Copie as credenciais
6. Faça login!

---

## 📋 O que foi feito

Após o deploy no Render, o banco de dados estava vazio (sem usuários).

**Arquivos criados:**

- ✅ `public/init-system.html` - Página visual de inicialização
- ✅ `quick-init-production.js` - Script rápido via terminal
- ✅ `create-first-user-production.js` - Criar usuário específico
- ✅ `FIX-LOGIN-PRODUCAO-2025-10-13.md` - Guia completo
- ✅ `GUIA_TESTES_POS_DEPLOY.md` - Guia de testes

**Commit:** 48bee99
**Push:** ✅ Enviado para GitHub

---

## 🎯 Próximos Passos

Após inicializar:

1. ✅ **Fazer login** com as credenciais geradas
2. ✅ **Alterar senha** no primeiro acesso
3. ✅ **Testar funcionalidades:**
   - AgendaLite
   - ModalListaEspera
   - ConfiguracaoGrade
4. ✅ **Criar tag v2.0.0**

---

## ⚠️ Importante

- Esta inicialização deve ser feita **apenas uma vez**
- **Salve as credenciais** em local seguro
- **Altere a senha** após primeiro acesso
- Se já foi inicializado, não precisa fazer novamente

---

**Qualquer dúvida, consulte:**

- `FIX-LOGIN-PRODUCAO-2025-10-13.md` (detalhado)
- `GUIA_TESTES_POS_DEPLOY.md` (testes)
