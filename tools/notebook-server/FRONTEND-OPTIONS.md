# Frontend - Opções de Execução

## 🎯 Opção 1: Build Estático (Produção) - **ATIVO AGORA** ✅

O backend Express já serve o frontend buildado automaticamente.

### Como funciona:

- Frontend buildado está em `public/`
- Backend serve em `https://fdef11b73864.ngrok-free.app/`
- **Vantagem:** Um só servidor, menor uso de recursos
- **Desvantagem:** Precisa rebuild para ver mudanças

### Rebuild quando necessário:

```powershell
cd C:\Users\thiag\saee\frontend
npm run build
```

Depois copie para `public/`:

```powershell
cd C:\Users\thiag\saee
.\copy-build.ps1
```

---

## ⚡ Opção 2: Dev Server (Desenvolvimento)

React dev server com hot reload na porta 3001.

### Quando usar:

- Durante desenvolvimento ativo
- Precisa de hot reload
- Testando mudanças no frontend

### Iniciar frontend dev:

```powershell
cd C:\Users\thiag\saee\tools\notebook-server

# Iniciar APENAS o frontend dev
.\start-services.ps1 -SkipBackend -SkipRelay -SkipNgrok

# OU iniciar tudo incluindo frontend dev
.\start-services.ps1
```

### URLs quando dev server ativo:

- **Frontend Dev:** http://localhost:3001
- **API Backend:** http://localhost:3000
- **Frontend Prod:** https://fdef11b73864.ngrok-free.app

---

## 🔧 Configuração Atual

### Frontend buildado (.env no build):

```env
REACT_APP_API_URL=https://fdef11b73864.ngrok-free.app/api
```

### Frontend dev (.env.local):

```env
REACT_APP_API_URL=http://localhost:3000/api
```

---

## 📊 Comparação

| Aspecto            | Build Estático          | Dev Server      |
| ------------------ | ----------------------- | --------------- |
| **Porta**          | Mesma do backend (3000) | Separada (3001) |
| **Hot Reload**     | ❌ Não                  | ✅ Sim          |
| **Performance**    | ⚡ Rápido               | 🐌 Mais lento   |
| **Uso de Memória** | 💚 Baixo                | 🟡 Médio        |
| **Ideal para**     | Produção/Teste          | Desenvolvimento |

---

## 🎯 Recomendação

**Para o seu caso (notebook como servidor):**

- Use **Build Estático** (opção 1) - já está ativo! ✅
- Só inicie o dev server quando for editar o frontend
- Economiza recursos do notebook

**Status Atual:**
✅ Backend servindo frontend buildado
✅ Funcionando em https://fdef11b73864.ngrok-free.app
