# ✅ Servidor do Notebook AltClinic - Rodando 100% Local

**Data de Configuração:** 21 de outubro de 2025  
**Status:** ✅ Operacional

## 🌐 URLs de Acesso

### Produção (Ngrok)

- **API Backend:** https://fdef11b73864.ngrok-free.app
- **Email Relay:** https://4f95973cd004.ngrok-free.app

### Local (Desenvolvimento)

- **API Backend:** http://localhost:3000
- **Email Relay:** http://localhost:4900
- **Ngrok Dashboard:** http://localhost:4040

⚠️ **Importante sobre URLs ngrok:**

- URLs mudam a cada reinicialização (plano gratuito)
- Para URLs fixas, upgrade para plano pago
- Primeira visita pede confirmação "Visit Site"

## 📊 Status dos Serviços

### Backend AltClinic

- **Porta Local:** 3000
- **PID:** 15880
- **Status:** ✅ Rodando
- **URL Pública:** https://fdef11b73864.ngrok-free.app
- **Log:** `C:\Users\thiag\saee\logs\notebook-server\backend-20251021-102454.log`

### Email Relay

- **Porta Local:** 4900
- **PID:** 5640
- **Status:** ✅ Rodando
- **URL Pública:** https://4f95973cd004.ngrok-free.app
- **API Key:** AltClinicRelay2025!
- **Log:** `C:\Users\thiag\saee\logs\notebook-server\relay-20251021-102454.log`

### Ngrok Tunnels

- **PID:** 20812
- **Status:** ✅ Rodando
- **Dashboard Local:** http://localhost:4040
- **Log:** `C:\Users\thiag\saee\logs\notebook-server\ngrok-20251021-101738.log`

## 🔄 Comandos Úteis

```powershell
cd C:\Users\thiag\saee\tools\notebook-server

# Verificar status
.\status.ps1

# Parar todos os serviços
.\stop-services.ps1

# Iniciar todos os serviços
.\start-services.ps1

# Reiniciar todos os serviços
.\restart-services.ps1

# Iniciar apenas alguns serviços
.\start-services.ps1 -SkipNgrok
.\start-services.ps1 -SkipBackend
.\start-services.ps1 -SkipRelay
```

## 🔧 Próximas Ações Necessárias

### ~~1. Atualizar Variáveis de Ambiente no Render~~ (NÃO MAIS NECESSÁRIO)

**Você não está mais usando o Render! Tudo roda 100% do seu notebook.**

### 1. Configurar Inicialização Automática ✅

**Já configurado!** A tarefa agendada já foi registrada e os serviços iniciarão automaticamente no logon.

Para verificar:

```powershell
Get-ScheduledTask -TaskName "AltClinic-Notebook-Server"
```

### 2. Configurações do Windows

#### Energia

1. Painel de Controle → Opções de Energia
2. Escolher "Alto desempenho" ou "Equilibrado"
3. Editar configurações do plano:
   - Desligar vídeo: Nunca
   - Suspender: Nunca
   - Hibernar: Nunca

#### Firewall

Certifique-se de que as portas 3000 e 4900 estejam permitidas caso precise acessar localmente de outros dispositivos.

### 4. Monitoramento

Verifique regularmente os logs em `C:\Users\thiag\saee\logs\notebook-server\` para garantir que os serviços estão funcionando corretamente.

**Testar API localmente:**

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health"
```

**Ver URLs atuais do ngrok:**

```powershell
Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" | Select-Object -ExpandProperty tunnels | Select-Object name, public_url
```

## 🎯 Como Acessar Sua Aplicação

1. **Pelo navegador:** Acesse https://fdef11b73864.ngrok-free.app
2. **Primeira visita:** Clique em "Visit Site" na página de aviso do ngrok
3. **Admin:** https://fdef11b73864.ngrok-free.app/admin
4. **API Docs:** https://fdef11b73864.ngrok-free.app/api/docs (se configurado)

## 🔒 Segurança

- ✅ Email relay protegido com API Key
- ✅ Ngrok com autenticação de token
- ⚠️ URLs ngrok públicas - considere upgrade para domínios reservados
- ⚠️ Mantenha o notebook em rede segura
- ✅ Logs locais para auditoria

## 📝 Notas

- Os logs são rotacionados automaticamente a cada inicialização
- PIDs são rastreados em `tools/notebook-server/runtime/`
- Configuração em `tools/notebook-server/config.ps1`
- Configuração ngrok em `tools/notebook-server/ngrok.yml`

---

**Servidor configurado e pronto para uso! 🚀**
