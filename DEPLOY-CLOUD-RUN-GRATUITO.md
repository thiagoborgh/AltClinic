# 🚀 Deploy Backend no Cloud Run (100% GRATUITO)

## ✨ Por que Cloud Run?

O Google Cloud Run é **completamente gratuito** para pequenas aplicações:

### 💰 Tier Gratuito (Permanente)

- ✅ **2 milhões de requisições/mês** grátis
- ✅ **360,000 GB-segundos** de memória grátis
- ✅ **180,000 vCPU-segundos** grátis
- ✅ **Escala automaticamente** (inclusive para zero quando não está em uso)
- ✅ **SSL/HTTPS automático**
- ✅ **Integração perfeita com Firebase**

Para uma clínica com 50 agendamentos/dia:

- ~1,500 agendamentos/mês
- ~10,000 requisições/mês (agendamentos + listagens + login)
- **Custo: R$ 0,00** ✅

---

## 📋 Pré-requisitos

### 1. Instalar Google Cloud SDK

**Opção A - Chocolatey (Recomendado no Windows):**

```powershell
choco install gcloudsdk
```

**Opção B - Download direto:**

1. Acesse: https://cloud.google.com/sdk/docs/install
2. Baixe o instalador para Windows
3. Execute e siga as instruções
4. Reinicie o PowerShell

### 2. Verificar instalação

```powershell
gcloud --version
```

### 3. Fazer login no Google Cloud

```powershell
gcloud auth login
```

- Abrirá o navegador
- Faça login com sua conta Google (a mesma do Firebase)
- Autorize o acesso

---

## 🚀 Deploy em 3 Passos

### Passo 1: Executar script de deploy

```powershell
cd C:\Projetos\clinica-estetica-mvp
.\cloudrun-deploy.ps1
```

O script irá:

1. ✅ Verificar se Google Cloud SDK está instalado
2. ✅ Verificar autenticação
3. ✅ Perguntar qual projeto Firebase usar
4. ✅ Habilitar APIs necessárias (Cloud Run, Cloud Build, Artifact Registry)
5. ✅ Construir imagem Docker do backend
6. ✅ Fazer deploy no Cloud Run
7. ✅ Fornecer a URL do backend

**Tempo estimado:** 5-7 minutos na primeira vez

### Passo 2: Testar backend

```powershell
# A URL será mostrada no final do deploy, algo como:
# https://altclinic-backend-xxx-uc.a.run.app

# Testar health check:
curl https://altclinic-backend-xxx-uc.a.run.app/health
```

Resposta esperada:

```json
{ "status": "ok", "timestamp": "2026-01-16T..." }
```

### Passo 3: Atualizar frontend

```powershell
# Editar frontend\.env.production:
# REACT_APP_API_URL=https://altclinic-backend-xxx-uc.a.run.app/api

# Rebuild frontend:
cd frontend
npm run build
cd ..

# Copiar para public:
Copy-Item -Path "frontend\build\*" -Destination "public\" -Recurse -Force

# Deploy frontend:
firebase deploy --only hosting
```

---

## 🎯 Vantagens Cloud Run vs Outras Opções

| Característica            | Cloud Run              | Render.com        | Firebase Functions |
| ------------------------- | ---------------------- | ----------------- | ------------------ |
| **Custo (tier gratuito)** | R$ 0,00                | R$ 0,00           | R$ 5-20/mês\*      |
| **Requisições grátis**    | 2 milhões/mês          | Ilimitado\*\*     | 2 milhões/mês      |
| **Cold start\***          | ~1s                    | ~30s              | ~2-3s              |
| **Sempre online**         | Não (escala para zero) | Não (dorme 15min) | Não                |
| **SQLite suportado**      | ✅ Sim                 | ✅ Sim            | ⚠️ Limitado        |
| **Integração Firebase**   | ✅ Perfeita            | ❌ Não            | ✅ Nativa          |
| **SSL/HTTPS**             | ✅ Automático          | ✅ Automático     | ✅ Automático      |
| **Região Brasil**         | ❌ Não                 | ❌ Não            | ❌ Não             |

\* Firebase Functions requer plano Blaze (pago)
\*\* Render free tier tem limite de 750 horas/mês e dorme após 15min inatividade
\*\*\* Cold start = tempo para primeira requisição após período de inatividade

---

## 🔧 Configurações do Cloud Run

O backend será deployado com:

- **Memória:** 512 MB (suficiente para SQLite + Express)
- **CPU:** 1 vCPU
- **Min instâncias:** 0 (escala para zero = custo zero quando não está em uso)
- **Max instâncias:** 1 (suficiente para início)
- **Timeout:** 300s (5 minutos)
- **Concorrência:** 80 requisições simultâneas por instância

---

## 📊 Monitoramento de Uso

### Ver métricas de uso:

```powershell
gcloud run services describe altclinic-backend --region=us-central1
```

### Ver logs em tempo real:

```powershell
gcloud run logs read altclinic-backend --region=us-central1 --limit=50
```

### Ver custos (deve ser R$ 0,00):

1. Acesse: https://console.cloud.google.com/billing
2. Selecione seu projeto
3. Verifique "Cloud Run" nas métricas

---

## 🆘 Troubleshooting

### Erro: "Billing account not configured"

**Solução:** Mesmo usando tier gratuito, precisa adicionar cartão de crédito:

1. Acesse: https://console.cloud.google.com/billing
2. Clique em "Adicionar conta de faturamento"
3. Adicione cartão (não será cobrado enquanto estiver no tier gratuito)
4. Associe ao projeto

⚠️ **Tranquilidade:** Google Cloud avisa antes de cobrar qualquer coisa.

### Erro: "Permission denied"

**Solução:**

```powershell
gcloud auth application-default login
```

### Erro: "Service account does not have permission"

**Solução:** Habilitar APIs manualmente:

```powershell
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### Backend dá erro 500

**Verificar logs:**

```powershell
gcloud run logs read altclinic-backend --region=us-central1 --limit=100
```

### SQLite não persiste dados

⚠️ **Importante:** Cloud Run é stateless (sem estado persistente).

**Soluções:**

1. **Curto prazo:** Usar volume persistente (adiciona custo mínimo)
2. **Longo prazo:** Migrar para Cloud SQL ou Firestore (recomendado)

Para adicionar volume persistente:

```powershell
gcloud run services update altclinic-backend `
    --region=us-central1 `
    --add-volume=name=database,type=cloud-storage,bucket=altclinic-db-bucket `
    --add-volume-mount=volume=database,mount-path=/app/data
```

---

## 🚦 Status do Deploy

### ✅ Arquivos Criados:

- `Dockerfile` - Container do backend
- `.dockerignore` - Arquivos a ignorar no build
- `cloudrun-deploy.ps1` - Script automatizado de deploy

### 📝 Checklist:

- [ ] Instalar Google Cloud SDK
- [ ] Fazer login: `gcloud auth login`
- [ ] Verificar projeto Firebase
- [ ] Executar `.\cloudrun-deploy.ps1`
- [ ] Copiar URL do backend
- [ ] Atualizar `frontend\.env.production`
- [ ] Rebuild frontend
- [ ] Deploy frontend
- [ ] Testar login em produção

---

## 💡 Próximos Passos (Opcional)

### 1. Configurar domínio customizado

```powershell
gcloud run services update altclinic-backend `
    --region=us-central1 `
    --custom-domain=api.seudominio.com.br
```

### 2. Adicionar monitoramento

- Google Cloud Monitoring (gratuito dentro dos limites)
- Alertas de erro/downtime

### 3. Configurar CI/CD

- GitHub Actions para deploy automático
- Toda vez que fizer push, deploy automático

### 4. Aumentar limite de instâncias (se necessário)

```powershell
gcloud run services update altclinic-backend `
    --region=us-central1 `
    --max-instances=3
```

---

## 📞 Suporte

**Documentação oficial:** https://cloud.google.com/run/docs

**Comparação de custos:** https://cloud.google.com/run/pricing

**Status do serviço:** https://status.cloud.google.com

---

**💰 Resumo de Custos:**

- Backend no Cloud Run: **R$ 0,00** (tier gratuito)
- Frontend no Firebase Hosting: **R$ 0,00** (sempre gratuito)
- **Total: R$ 0,00/mês** ✅

Para crescer além do tier gratuito:

- 2M-10M requisições/mês: ~R$ 10-30/mês
- 10M-50M requisições/mês: ~R$ 30-100/mês

**Recomendação:** Começar no Cloud Run (grátis), migrar dados para Firestore quando escalar.
