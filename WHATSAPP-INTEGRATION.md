# 📱 Integração WhatsApp - Guia Completo

O sistema oferece **duas formas** de enviar notificações via WhatsApp:

## 🎯 Opção 1: WhatsApp Web Manual (Recomendado para Iniciantes)

### Como Funciona

1. Sistema gera um link `wa.me` com a mensagem pré-formatada
2. Você clica no link
3. Abre o WhatsApp Web
4. Você revisa a mensagem e envia manualmente

### Vantagens

- ✅ Zero configuração
- ✅ Sem custos adicionais
- ✅ Funciona imediatamente
- ✅ Não precisa de servidor

### Como Usar

No painel de agendamentos, clique em **"Enviar WhatsApp"** e o sistema abrirá o link automaticamente.

**Exemplo de mensagem gerada:**

```
Olá Maria! 👋

Seu agendamento está confirmado:

📅 Data: 15/01/2026
🕐 Horário: 14:00
💆 Procedimento: Limpeza de Pele
👨‍⚕️ Profissional: Dra. Ana Silva

Aguardamos você! 😊

Clínica Bella Estética
```

---

## 🚀 Opção 2: Evolution API (Automação Total)

### O que é Evolution API?

Uma API open-source que permite automatizar o WhatsApp sem precisar de servidores caros.

### Vantagens

- ✅ Envio automático
- ✅ Lembretes programados
- ✅ Confirmação de leitura
- ✅ Baixo custo

### Desvantagens

- ⚠️ Requer instalação
- ⚠️ Precisa de um servidor ou computador rodando 24/7
- ⚠️ Configuração mais técnica

---

## 📦 Instalação Evolution API

### Opção A: Docker (Mais Fácil)

#### Pré-requisitos

- Docker instalado
- Porta 8080 disponível

#### Instalação

```bash
# 1. Criar pasta para Evolution API
mkdir evolution-api
cd evolution-api

# 2. Criar arquivo docker-compose.yml
cat > docker-compose.yml << EOF
version: '3'
services:
  evolution-api:
    image: atendai/evolution-api:latest
    ports:
      - "8080:8080"
    environment:
      - AUTHENTICATION_API_KEY=SUA_CHAVE_SUPER_SECRETA_AQUI
      - DEL_INSTANCE=false
      - DATABASE_ENABLED=true
      - DATABASE_CONNECTION_URI=sqlite:./evolution.db
    volumes:
      - ./evolution_instances:/evolution/instances
      - ./evolution_store:/evolution/store
    restart: always
EOF

# 3. Subir o container
docker-compose up -d

# 4. Verificar se está rodando
docker-compose logs -f
```

Acesse: http://localhost:8080

---

### Opção B: Instalação Manual (Node.js)

#### Pré-requisitos

- Node.js 18+ instalado
- Git instalado

#### Instalação

```bash
# 1. Clonar o repositório
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# 2. Instalar dependências
npm install

# 3. Copiar arquivo de ambiente
cp .env.example .env

# 4. Editar .env (use nano ou seu editor favorito)
nano .env

# Configure:
# AUTHENTICATION_API_KEY=SUA_CHAVE_SUPER_SECRETA
# SERVER_PORT=8080

# 5. Iniciar servidor
npm start
```

---

### Opção C: Serviços em Nuvem (Recomendado para Produção)

#### Railway (Mais Fácil)

1. Acesse https://railway.app
2. Crie conta gratuita (com GitHub)
3. Clique em "New Project"
4. Escolha "Deploy from GitHub repo"
5. Selecione `EvolutionAPI/evolution-api`
6. Configure variáveis:
   - `AUTHENTICATION_API_KEY`: sua chave secreta
7. Deploy automático!

**URL gerada:** `https://seu-projeto.railway.app`

#### Outras Opções

- **Heroku**: Até 1000h/mês gratuito
- **Render**: Plano gratuito disponível
- **DigitalOcean**: Droplet $5/mês
- **AWS EC2**: Free tier 1 ano

---

## 🔗 Conectar Evolution API ao Sistema

### 1. Configurar no Painel

Acesse **Configurações** → **WhatsApp** no seu painel:

- **Método**: Selecione "Evolution API"
- **URL da API**: `http://localhost:8080` (ou sua URL cloud)
- **API Key**: A chave que você definiu

### 2. Criar Instância WhatsApp

```bash
# Fazer requisição para criar instância
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: SUA_CHAVE_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "clinica_whatsapp",
    "qrcode": true
  }'
```

### 3. Conectar WhatsApp

1. Acesse: `http://localhost:8080/instance/qrcode/clinica_whatsapp`
2. Escaneie o QR Code com seu WhatsApp
3. Aguarde conexão

---

## 🧪 Testar Envio

```bash
curl -X POST http://localhost:8080/message/sendText/clinica_whatsapp \
  -H "apikey: SUA_CHAVE_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "text": "Olá! Este é um teste da Evolution API 🚀"
  }'
```

---

## 💡 Qual Escolher?

### Use WhatsApp Web Manual se:

- ⭐ Você está começando
- ⭐ Tem poucos agendamentos (até 20/dia)
- ⭐ Não quer complicação
- ⭐ Prefere controle total das mensagens

### Use Evolution API se:

- ⭐ Tem muitos agendamentos (50+/dia)
- ⭐ Quer automatizar lembretes
- ⭐ Tem conhecimento técnico ou pode pagar alguém para configurar
- ⭐ Quer confirmações automáticas

---

## 🆘 Problemas Comuns

### Evolution API não conecta

- ✅ Verifique se a porta 8080 está aberta
- ✅ Confirme que o Docker está rodando
- ✅ Teste com `curl http://localhost:8080`

### QR Code não aparece

- ✅ Limpe cache do navegador
- ✅ Use modo anônimo
- ✅ Tente outro navegador

### Mensagens não enviam

- ✅ Verifique se WhatsApp está conectado
- ✅ Confirme que o número tem DDD e DDI corretos
- ✅ Teste primeiro com seu próprio número

---

## 📚 Recursos

- [Evolution API - Documentação Oficial](https://doc.evolution-api.com/)
- [Evolution API - GitHub](https://github.com/EvolutionAPI/evolution-api)
- [Tutorial Vídeo - YouTube](https://youtube.com)

---

## 💰 Custos Estimados

| Opção                        | Custo/mês       | Dificuldade    |
| ---------------------------- | --------------- | -------------- |
| WhatsApp Web Manual          | R$ 0,00         | ⭐ Fácil       |
| Evolution + Computador Local | R$ 0,00         | ⭐⭐ Médio     |
| Evolution + Railway          | R$ 0,00 - R$ 20 | ⭐⭐ Médio     |
| Evolution + VPS              | R$ 20 - R$ 50   | ⭐⭐⭐ Difícil |

---

## 🎯 Recomendação Final

**Comece com WhatsApp Web Manual** e migre para Evolution API quando:

- Tiver mais de 30 agendamentos/dia
- Precisar de lembretes automáticos
- Tiver orçamento para contratar um técnico

**Não deixe a tecnologia te atrapalhar!** O importante é atender bem seus clientes, não importa como você envia a mensagem. 😊
