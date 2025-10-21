# Notebook Server Toolkit

Scripts that help keep the AltClinic backend, email relay, and ngrok tunnel running on your notebook when acting as a temporary server.

## 1. Preparar configuração

1. Copie `config.example.ps1` para `config.ps1`.
2. Ajuste os caminhos conforme seu ambiente:
   - `ProjectRoot`: pasta do repositório.
   - `NodeExecutable`: caminho completo do `node.exe` (opcional se estiver no PATH).
   - `NgrokExecutable`: caminho completo do `ngrok.exe` (opcional se estiver no PATH).
   - `NgrokConfigFile`: caminho para o arquivo `ngrok.yml` (veja abaixo).
   - `BackendEntrypoint` e `EmailRelayScript`: mantenha os valores padrão a menos que altere as rotas.
3. Crie o arquivo `ngrok.yml` a partir de `ngrok.yml.example` e configure token, região e domínios.

## 2. Estrutura de pastas gerada

- `runtime/`: arquivos `.pid` com o processo atual de cada serviço (backend, relay, ngrok).
- `logs/notebook-server/`: logs rotacionados automaticamente a cada inicialização (`backend-AAAAmmdd-HHmmss.log`).

## 3. Scripts disponíveis

- `start-services.ps1`: inicia backend, relay e ngrok. Use `-SkipBackend`, `-SkipRelay` ou `-SkipNgrok` se precisar pular algum serviço.
- `stop-services.ps1`: encerra os serviços. Aceita `-BackendOnly`, `-RelayOnly`, `-NgrokOnly` para desligar de forma seletiva.
- `restart-services.ps1`: reinicia serviços com os mesmos parâmetros de `start` (por exemplo `-SkipNgrok`).
- `status.ps1`: mostra PID e último log conhecido de cada serviço.
- `register-startup.ps1`: cria (ou remove com `-Remove`) uma tarefa agendada que dispara `start-services.ps1` a cada logon.

Execute os scripts abrindo um PowerShell com privilégios suficientes e navegue até `tools/notebook-server`:

```powershell
cd C:\Users\thiag\saee\tools\notebook-server
./start-services.ps1
```

## 4. Requisitos adicionais

- Certifique-se de que `tools/email-relay/.env` está preenchido com as credenciais SMTP.
- Confirme que o `ngrok.yml` aponta para as portas corretas (`4900` para o relay, `3000` para a API) e que o token reservado pertence ao plano escolhido.
- Ajuste o firewall do Windows para permitir as portas configuradas.

## 5. Monitoramento rápido

Use `./status.ps1` para conferir se os processos estão de pé. Os logs ficam em `logs/notebook-server/` com timestamps para facilitar auditoria e troubleshooting.
