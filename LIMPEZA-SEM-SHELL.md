# 🧹 LIMPEZA DE TENANTS ÓRFÃOS - SEM SHELL (Gratuito)

**Solução alternativa ao Render Shell (que é pago)**

---

## 🎯 SOLUÇÃO: Endpoint Temporário

Adicionamos um endpoint `/api/cleanup-orphans` que pode ser acessado pelo navegador!

---

## 📋 PASSO A PASSO

### **1. Fazer Deploy do Endpoint** (5 min)

O endpoint já foi adicionado em `src/app.js`. Agora precisa fazer deploy:

```powershell
# Commitar mudança
git add src/app.js temp-cleanup-endpoint.js
git commit -m "feat: Adicionar endpoint temporário para limpeza de órfãos"
git push origin main
```

**Aguarde:** Auto-deploy do Render (~3-5 min)

---

### **2. Analisar Órfãos** (30 segundos)

Abra no navegador:

```
https://altclinic.onrender.com/api/cleanup-orphans
```

**Resultado esperado:**

```json
{
  "success": true,
  "action": "ANALYSIS_ONLY",
  "message": "Análise concluída. Para executar limpeza, adicione ?execute=true",
  "stats": {
    "total": 36,
    "valid": 32,
    "orphans": 4
  },
  "orphansFound": [
    {
      "slug": "altclinin-1",
      "nome": "altclinin",
      "database": "tenant_altclinin-1_1757420957495"
    },
    {
      "slug": "teste-123",
      "nome": "Teste",
      "database": "tenant_teste-123_1234567890"
    }
  ],
  "affectedUsers": [
    {
      "email": "thiagoborgh@gmail.com",
      "tenantSlug": "altclinin-1"
    }
  ],
  "nextStep": "Acesse: /api/cleanup-orphans?execute=true para executar"
}
```

**Isso mostra:**
- Quantos tenants órfãos existem
- Quais são (slug, nome, database)
- Quais usuários serão afetados

---

### **3. Executar Limpeza** (30 segundos)

Se estiver tudo OK, execute a limpeza:

```
https://altclinic.onrender.com/api/cleanup-orphans?execute=true
```

**Resultado esperado:**

```json
{
  "success": true,
  "action": "CLEANUP_EXECUTED",
  "message": "Limpeza de órfãos concluída!",
  "deleted": {
    "tenants": 4,
    "users": 4
  },
  "orphansRemoved": [
    "altclinin-1",
    "teste-123"
  ]
}
```

**Pronto!** Órfãos deletados! ✅

---

### **4. Testar Criar Trial** (1 min)

Agora o email `thiagoborgh@gmail.com` está livre!

1. Acesse: https://altclinic.onrender.com
2. Clique em "Criar Conta Teste"
3. Preencha os dados
4. Clique em "Começar agora"

**Esperado:**
```
✅ Trial criado com sucesso!
✅ Email enviado
✅ Redirecionamento para login
```

---

### **5. REMOVER Endpoint** (Segurança)

⚠️ **IMPORTANTE:** Após usar, remova o endpoint!

Edite `src/app.js` e **delete** todo o bloco:

```javascript
// 🧹 ENDPOINT TEMPORÁRIO - Limpeza de tenants órfãos
// TODO: REMOVER APÓS USO!
this.app.get('/api/cleanup-orphans', async (req, res) => {
  // ... TODO O CÓDIGO ATÉ ...
});
```

**Depois:**

```powershell
git add src/app.js
git commit -m "chore: Remover endpoint temporário de limpeza"
git push origin main
```

---

## 📊 ALTERNATIVAS (Se não quiser usar endpoint)

### **ALTERNATIVA 1: Usar Email Diferente** 🔄

Mais simples: Use outro email!

- Landing page → "Criar Conta Teste"
- Email: `teste@suaclinica.com` (qualquer outro)
- **Funciona imediatamente!**

---

### **ALTERNATIVA 2: API via Postman/Insomnia** 🛠️

Se você tem Postman ou Insomnia:

1. **GET** `https://altclinic.onrender.com/api/cleanup-orphans`
2. Ver resposta (análise)
3. **GET** `https://altclinic.onrender.com/api/cleanup-orphans?execute=true`
4. Ver resposta (limpeza executada)

---

### **ALTERNATIVA 3: PowerShell local (via Invoke-WebRequest)** 💻

```powershell
# Análise
Invoke-WebRequest -Uri "https://altclinic.onrender.com/api/cleanup-orphans" | Select-Object -ExpandProperty Content

# Executar limpeza
Invoke-WebRequest -Uri "https://altclinic.onrender.com/api/cleanup-orphans?execute=true" | Select-Object -ExpandProperty Content
```

---

## ⚠️ SEGURANÇA

### **Por que remover o endpoint depois?**

- Qualquer pessoa pode acessar a URL
- Pode deletar dados se usado incorretamente
- É temporário apenas para este fix

### **Alternativa mais segura (se precisar manter):**

Adicione autenticação:

```javascript
this.app.get('/api/cleanup-orphans', async (req, res) => {
  // Verificar token de segurança
  const token = req.headers.authorization;
  if (token !== `Bearer ${process.env.CLEANUP_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // ... resto do código ...
});
```

E configure `CLEANUP_TOKEN` no Render Environment.

---

## 📋 CHECKLIST

- [ ] Commitar endpoint (`src/app.js`)
- [ ] Push para GitHub
- [ ] Aguardar auto-deploy (3-5 min)
- [ ] Acessar `/api/cleanup-orphans` (análise)
- [ ] Verificar órfãos encontrados
- [ ] Acessar `/api/cleanup-orphans?execute=true` (executar)
- [ ] Verificar: "Limpeza concluída!"
- [ ] Testar criar trial novamente
- [ ] **REMOVER** endpoint após uso
- [ ] Commitar remoção + push

---

## 🎯 RESUMO

**Vantagem:** 100% gratuito, sem precisar de Shell pago!

**Tempo total:** 
- Deploy: 5 min
- Análise: 30 segundos
- Execução: 30 segundos
- Teste: 1 min
- Remoção: 2 min
- **Total:** ~10 minutos

**Resultado:** Email liberado, trial funcionando, sistema limpo! ✅

---

**Qual alternativa prefere?**
1. Usar endpoint temporário (recomendado)
2. Usar email diferente (mais rápido)
3. Esperar até termos acesso ao Shell

Me avise qual escolher e te ajudo no próximo passo! 🚀
