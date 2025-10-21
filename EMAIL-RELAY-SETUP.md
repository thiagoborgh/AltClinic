# Email Relay Local

## Objetivo

Permitir que o backend hospedado no Render envie emails através de um serviço rodando em sua máquina (ou em outro servidor sob seu controle). O backend passa a chamar uma API HTTP ao invés de conectar diretamente no SMTP.

## Visão Geral

1. **Relay local** recebe requisições `POST /send-email`
2. Relay usa `nodemailer` com Gmail (ou outro SMTP) para disparar o email
3. Backend AltClinic envia requisições HTTP para o relay usando `EMAIL_API_URL`

## Passo a Passo

### 1. Preparar o Relay

```
cp tools/email-relay/.env.example tools/email-relay/.env
```

Edite `tools/email-relay/.env` com suas credenciais SMTP (pode ser Gmail App Password ou SendGrid, etc.).

Campos obrigatórios:

```
RELAY_PORT=4900
RELAY_API_KEY=chave-super-secreta
RELAY_SMTP_HOST=smtp.gmail.com
RELAY_SMTP_PORT=465
RELAY_SMTP_SECURE=true
RELAY_SMTP_USER=contatoaltclinic@gmail.com
RELAY_SMTP_PASS=app-password-ou-senha
RELAY_DEFAULT_FROM=AltClinic <contatoaltclinic@gmail.com>
```

### 2. Executar o Relay

Opção direta:

```
node tools/email-relay/email-relay-server.js
```

Ou use o orquestrador preparado em `tools/notebook-server` para subir relay, backend e ngrok de uma só vez:

```
cd tools/notebook-server
./start-services.ps1
```

Logs esperados (quando executado diretamente):

```
🚀 Email relay rodando em http://localhost:4900
📮 Endpoint: POST /send-email
🛡️ API Key ativa: sim
```

### 3. Configurar Backend (Render e local)

No backend AltClinic, adicione as variáveis:

```
EMAIL_API_URL=https://SEU_IP_PUBLICO:4900/send-email
EMAIL_API_KEY=chave-super-secreta
```

> 💡 Se for usar a própria máquina como relay, exponha a porta 4900 usando ngrok, tailscale ou tunnel da sua preferência.

### 4. Testar

- Acesse a API do AltClinic (Render)
- Acione uma funcionalidade de envio de email (Trial, Forgot Password, etc.)
- Verifique logs do relay para confirmar o disparo

### 5. Segurança

- Sempre defina `RELAY_API_KEY` e configure firewall/nat apenas para IPs esperados
- Se usar túnel (ngrok, Cloudflare), proteja com autenticação adicional
- SSL: preferencialmente exponha o relay atrás de HTTPS (reverse proxy + certificado)

## Payload Aceito

```
POST /send-email
Headers:
  Content-Type: application/json
  x-api-key: chave-super-secreta (opcional, mas recomendado)

Body:
{
  "to": "destinatario@exemplo.com",
  "subject": "Assunto",
  "html": "<p>Conteúdo</p>",
  "text": "Conteúdo em texto plano",
  "from": "AltClinic <contato@altclinic.com>" // opcional
}
```

## Logs do Relay

- Sucesso: `📧 Email enviado via relay`
- Falha: `❌ Erro no relay de email`

## Dicas Adicionais

- Para monitorar: use PM2 ou systemd para manter o relay online
- Snapshots: configure backup do arquivo `.env` do relay
- Escalabilidade: é possível hospedar o relay em um VPS (Lightsail, Droplet) e manter a mesma arquitetura

---

**Status:** Relay implementado e pronto para uso
