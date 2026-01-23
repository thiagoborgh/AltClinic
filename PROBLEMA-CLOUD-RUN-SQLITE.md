# ⚠️ PROBLEMA IDENTIFICADO: Cloud Run + SQLite

## 🔴 O Problema

O **Cloud Run é STATELESS** (sem estado persistente). Isso significa:

1. ✅ Você cria um registro → banco SQLite criado em `/app/data/`
2. ⏱️ Cloud Run desliga a instância após alguns minutos de inatividade (economia de recursos)
3. ❌ Quando você tenta fazer login → nova instância inicia → `/app/data/` está vazio!
4. 💥 **Resultado:** Usuário não encontrado (porque o banco foi perdido)

**Logs confirmam:**

```
UsuarioMultiTenant.authenticate: User not found
```

## 💡 Soluções

### Opção 1: Usar Cloud Storage para SQLite (TEMPORÁRIO)

Montar um bucket do Google Cloud Storage para persistir os bancos:

```powershell
# Criar bucket
gsutil mb -l us-central1 gs://altclinic-databases

# Atualizar Cloud Run para usar o bucket
gcloud run services update altclinic-backend `
  --region=us-central1 `
  --add-volume=name=database,type=cloud-storage,bucket=altclinic-databases `
  --add-volume-mount=volume=database,mount-path=/app/data
```

**Custo:** ~R$ 1-5/mês para poucos GB
**Limitação:** Cloud Storage não é ideal para SQLite (problemas de lock)

---

### Opção 2: PostgreSQL no Google Cloud SQL ✅ **RECOMENDADO**

Usar banco de dados gerenciado (persistente):

**1. Criar instância PostgreSQL:**

```powershell
gcloud sql instances create altclinic-db `
  --database-version=POSTGRES_15 `
  --tier=db-f1-micro `
  --region=us-central1
```

**Custo:** R$ 0-30/mês (tier gratuito: ~25h/dia)

**2. Criar banco:**

```powershell
gcloud sql databases create altclinic --instance=altclinic-db
```

**3. Atualizar código:**

- Instalar: `npm install pg`
- Migrar de `better-sqlite3` para `pg` (PostgreSQL)
- Atualizar variáveis de ambiente no Cloud Run

---

### Opção 3: Firebase Firestore ✅ **MAIS SIMPLES**

Usar Firestore (NoSQL do Firebase - já está no projeto):

**Vantagens:**

- ✅ Já configurado no projeto
- ✅ GRATUITO (até 50k reads/day)
- ✅ Zero manutenção
- ✅ Escalável automaticamente
- ✅ Backups automáticos

**Desvantagens:**

- 🔄 Requer refatoração do código (SQLite → Firestore)
- 📚 Estrutura NoSQL diferente de SQL

**Esforço:** ~4-6 horas de refatoração

---

### Opção 4: Supabase (PostgreSQL Gratuito) ✅ **BARATO E RÁPIDO**

PostgreSQL gerenciado com tier gratuito generoso:

**1. Criar projeto:** https://supabase.com
**2. Obter connection string**
**3. Atualizar variáveis de ambiente:**

```powershell
gcloud run services update altclinic-backend `
  --region=us-central1 `
  --update-env-vars="DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"
```

**Custo:** R$ 0/mês (500MB storage, 2GB transfer)
**Migração:** Instalar `pg`, adaptar queries

---

### Opção 5: Render.com (BACKEND + POSTGRES TUDO JUNTO) ✅ **MAIS FÁCIL**

Mudar backend do Cloud Run para Render.com:

**Vantagens:**

- ✅ PostgreSQL grátis incluído
- ✅ Persistência garantida
- ✅ Deploy automático via Git
- ✅ 750 horas grátis/mês
- ✅ Não dorme se tiver tráfego

**Desvantagens:**

- ⏱️ Cold start de ~30s após 15min inatividade
- 🌎 Sem região Brasil (mais latência)

---

## 🎯 Recomendação Imediata

### Para TESTAR AGORA (solução temporária):

**Aumentar min-instances para 1** (Cloud Run sempre ligado, banco não é perdido):

```powershell
gcloud run services update altclinic-backend `
  --region=us-central1 `
  --min-instances=1
```

**Custo:** ~R$ 30-50/mês (instância sempre rodando)
**Uso:** Apenas para testes/desenvolvimento

### Para PRODUÇÃO:

**Migrar para Supabase (PostgreSQL):**

1. Criar conta: https://supabase.com
2. Criar projeto
3. Obter connection string
4. Instalar `pg`: `npm install pg`
5. Adaptar código (posso ajudar!)
6. Deploy

**Custo:** R$ 0/mês (tier gratuito)
**Escalabilidade:** Até 500MB + 2GB transfer grátis

---

## ⚡ Ação Rápida - Teste Agora

Vou configurar **min-instances=1** para você testar imediatamente:

```powershell
# Manter 1 instância sempre ativa (banco não será perdido)
gcloud run services update altclinic-backend `
  --region=us-central1 `
  --min-instances=1 `
  --max-instances=3

# Fazer um novo registro de teste
# Login funcionará até a instância reiniciar
```

**Depois** decidimos qual solução permanente usar (recomendo Supabase).

---

## 📊 Comparação de Custos

| Solução                   | Custo Mensal | Persistência | Complexidade |
| ------------------------- | ------------ | ------------ | ------------ |
| Cloud Run min-instances=1 | ~R$ 40       | ✅ Sim\*     | Fácil        |
| Cloud Storage + SQLite    | ~R$ 5        | ⚠️ Limitado  | Média        |
| Cloud SQL (PostgreSQL)    | ~R$ 30       | ✅ Sim       | Média        |
| Supabase                  | **R$ 0**     | ✅ Sim       | Média        |
| Render.com                | **R$ 0**     | ✅ Sim       | Fácil        |
| Firestore                 | **R$ 0**     | ✅ Sim       | Alta         |

\* Enquanto instância não reiniciar

---

## 🛠️ O que fazer AGORA?

1. ⚡ **Teste imediato:** min-instances=1 (R$ 40/mês)
2. 🎯 **Produção:** Supabase PostgreSQL (R$ 0/mês)
3. 🔄 **Alternativa:** Render.com (R$ 0/mês, mais simples)

**Qual você prefere?**
