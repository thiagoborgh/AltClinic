# 🎯 GUIA RÁPIDO: Validar Configurações Render

**Objetivo:** Verificar se o Render está configurado corretamente  
**Tempo:** 10-15 minutos  
**Nível:** Intermediário

---

## 📋 INÍCIO RÁPIDO

### 1️⃣ Acesse o Dashboard
```
https://dashboard.render.com → altclinic
```

### 2️⃣ Verifique as 3 Configurações Principais

#### ⚙️ Build Command
```bash
npm run build:linux
```

#### ▶️ Start Command
```bash
node src/app.js
```

#### 🔐 Environment Variables
```bash
NODE_ENV=production
JWT_SECRET=[64 chars aleatórios]
CORS_ORIGIN=https://altclinic.onrender.com
MASTER_DB_PATH=./data/master.db
```

### 3️⃣ Execute Verificação Automática

**No Shell do Render:**
```bash
bash verify-render-env.sh
```

---

## 📚 DOCUMENTAÇÃO COMPLETA

### 📖 Guias Disponíveis:

1. **`RENDER-CONFIG-VALIDATION.md`** (Completo)
   - 📋 Checklist detalhado
   - ⚙️ Configurações passo a passo
   - 🐛 Troubleshooting completo
   - 📊 Configuração ideal

2. **`RENDER-CHECKLIST-VISUAL.md`** (Interativo)
   - ✅ Checklist com checkboxes
   - 📍 8 seções organizadas
   - 🔍 Comandos de verificação
   - 🚨 Soluções para problemas

3. **`verify-render-env.sh`** (Automático)
   - 🔍 Verifica 11 pontos críticos
   - ✅ Identifica erros e avisos
   - 📊 Gera relatório completo
   - 🎯 Sugere próximas ações

---

## 🚀 CONFIGURAÇÃO MÍNIMA

Se você tem pouco tempo, configure pelo menos:

```yaml
# ESSENCIAL
Build Command: npm run build:linux
Start Command: node src/app.js
NODE_ENV: production
JWT_SECRET: [gere com: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"]

# RECOMENDADO
CORS_ORIGIN: https://altclinic.onrender.com
Disk Storage: 1 GB em /opt/render/project/src/data
Health Check: /api/health
```

---

## ✅ VALIDAÇÃO RÁPIDA

### Método 1: Via Browser (Mais Fácil)

1. **Teste o Health Check:**
   ```
   https://altclinic.onrender.com/api/health
   ```
   **Deve retornar:** `{"status":"ok",...}`

2. **Teste a Página de Diagnóstico:**
   ```
   https://altclinic.onrender.com/diagnostic-login.html
   ```
   **Deve carregar:** Interface de teste de login

3. **Teste o Frontend:**
   ```
   https://altclinic.onrender.com/
   ```
   **Deve carregar:** Página de login

---

### Método 2: Via PowerShell (Seu PC)

```powershell
# Health Check
Invoke-WebRequest -Uri "https://altclinic.onrender.com/api/health" | Select-Object -ExpandProperty Content

# Init Status
Invoke-WebRequest -Uri "https://altclinic.onrender.com/api/auth/init-status" | Select-Object -ExpandProperty Content

# Frontend
Invoke-WebRequest -Uri "https://altclinic.onrender.com/" | Select-Object StatusCode
```

---

### Método 3: Via Shell do Render

```bash
# Execute o script de verificação
bash verify-render-env.sh

# Ou verificações manuais
pwd
ls -la
cat package.json | grep "build:linux"
env | grep NODE_ENV
```

---

## 🐛 PROBLEMAS COMUNS

### ❌ Build Failed

**Sintoma:** Logs mostram "npm ERR! missing script: build"  
**Solução:** Altere Build Command para `npm run build:linux`

---

### ❌ Usuário Não Encontrado

**Sintoma:** Erro 401 no login  
**Solução:** 
1. Acesse: https://altclinic.onrender.com/diagnostic-login.html
2. Clique em "Testar Login (auto-detect)"
3. Ou execute no Shell: `node quick-init-production.js`

---

### ❌ CORS Error

**Sintoma:** Console mostra "CORS policy"  
**Solução:** Adicione `CORS_ORIGIN=https://altclinic.onrender.com` em Environment

---

### ❌ Database Locked

**Sintoma:** Erro "database is locked"  
**Solução:** Configure Disk Storage em `/opt/render/project/src/data`

---

## 📊 STATUS ESPERADO

### ✅ Tudo Certo Se:

- ✅ Build completa sem erros (3-5 min)
- ✅ Deploy inicia servidor na porta 10000
- ✅ `/api/health` retorna `{"status":"ok"}`
- ✅ `/api/auth/init-status` retorna `{"initialized":true}`
- ✅ Frontend carrega em `/`
- ✅ Logs não mostram erros críticos

### ⚠️ Atenção Se:

- ⚠️ Build demora mais de 10 minutos
- ⚠️ Logs mostram warnings (mas não errors)
- ⚠️ Banco de dados vazio (0 tenants)
- ⚠️ Frontend não carrega totalmente

### ❌ Problema Se:

- ❌ Build falha com erro
- ❌ Servidor não inicia
- ❌ `/api/health` retorna 404 ou 500
- ❌ CORS errors no console
- ❌ Database errors nos logs

---

## 🎯 PRÓXIMOS PASSOS

### Se TUDO estiver ✅:

1. ✅ **Inicializar sistema**
   - Acesse: https://altclinic.onrender.com/diagnostic-login.html
   - Ou Shell: `node quick-init-production.js`

2. ✅ **Testar login**
   - Use credenciais geradas
   - Ou tente auto-detect

3. ✅ **Validar funcionalidades**
   - AgendaLite
   - ModalListaEspera
   - ConfiguracaoGrade

4. ✅ **Criar tag v2.0.0**
   ```bash
   git tag -a v2.0.0 -m "Release v2.0.0: Sistema completo em produção"
   git push origin v2.0.0
   ```

---

### Se ALGO estiver ❌:

1. ❌ **Identifique o problema**
   - Consulte `RENDER-CONFIG-VALIDATION.md`
   - Execute `bash verify-render-env.sh` no Shell

2. ❌ **Corrija a configuração**
   - Siga o checklist em `RENDER-CHECKLIST-VISUAL.md`
   - Aplique as soluções sugeridas

3. ❌ **Execute Manual Deploy**
   - Settings → Manual Deploy
   - Aguarde conclusão

4. ❌ **Verifique logs**
   - Logs → Procure por erros
   - Confirme que não há mais problemas

5. ❌ **Teste novamente**
   - Repita a validação
   - Confirme que tudo está ✅

---

## 📞 SUPORTE

### Arquivos de Referência:

| Arquivo | Propósito | Quando Usar |
|---------|-----------|-------------|
| `RENDER-CONFIG-VALIDATION.md` | Guia completo | Configuração inicial |
| `RENDER-CHECKLIST-VISUAL.md` | Checklist interativo | Validação passo a passo |
| `verify-render-env.sh` | Script automático | Verificação rápida |
| `FIX-LOGIN-PRODUCAO-2025-10-13.md` | Correção de login | Erro de autenticação |
| `RENDER-INIT-GUIA-VISUAL.md` | Inicialização | Primeiro deploy |

---

## 🎉 RESUMO

**3 Arquivos Criados:**
- ✅ `RENDER-CONFIG-VALIDATION.md` (Completo)
- ✅ `RENDER-CHECKLIST-VISUAL.md` (Interativo)
- ✅ `verify-render-env.sh` (Automático)

**Commit:** `8addcd8`  
**Push:** ✅ Enviado para GitHub

**Agora você pode:**
1. 📖 Consultar a documentação completa
2. ✅ Seguir o checklist visual
3. 🔍 Executar verificação automática
4. 🚀 Validar configurações no Render

---

**👉 COMECE AQUI:**
1. Abra: https://dashboard.render.com
2. Siga: `RENDER-CHECKLIST-VISUAL.md`
3. Execute: `bash verify-render-env.sh` no Shell
4. Teste: https://altclinic.onrender.com/diagnostic-login.html

---

**Boa validação! 🚀**
