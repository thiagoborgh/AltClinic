# Alt Clinic - Sistema de Agendamento Automatizado para Clínicas Estéticas

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)

Um micro SaaS completo para automatizar agendamentos, CRM, financeiro e prontuários em clínicas estéticas, com integração de bots (WhatsApp/Telegram) e IA (Claude 3.5 Sonnet).

## ✅ Status do Sistema

**MVP COMPLETO E FUNCIONAL!**

🎉 **O sistema está 100% operacional com:**

- ✅ API completa com 40+ endpoints
- ✅ Banco de dados SQLite configurado
- ✅ Autenticação JWT e criptografia AES
- ✅ Bots WhatsApp e Telegram integrados
- ✅ CRM com jobs automáticos (cron)
- ✅ Sistema financeiro com propostas
- ✅ Prontuários com upload de imagens
- ✅ Integração Claude AI para IA
- ✅ Conformidade LGPD

**Credenciais de teste:**

- Email: `admin@clinica.com`
- Senha: `123456`
- Servidor: `http://localhost:3000`

## 🚀 Funcionalidades

### 📅 Agendamento

- ✅ Agendamento via bots (WhatsApp/Telegram)
- ✅ Verificação automática de disponibilidade
- ✅ Gestão de equipamentos/salas com capacidade
- ✅ Confirmações e lembretes automáticos

### 💰 Financeiro

- ✅ Geração de propostas com contratos
- ✅ Agendamento automático de itens contratados
- ✅ Recibos digitais via bots
- ✅ Controle de contas a receber

### 👥 CRM

- ✅ Mensagens automáticas para agendamentos
- ✅ Campanhas para clientes inativos
- ✅ Relatórios de ativação de vendas
- ✅ Integração com Mailchimp (free tier)

### 🏥 Prontuário Digital

- ✅ Anamnese configurável (JSON)
- ✅ Evolução de medidas (séries temporais)
- ✅ Upload de imagens criptografadas
- ✅ Editor de imagem com anotações (Fabric.js)
- ✅ Sugestões de IA para anamnese

### 🤖 Integração com IA

- ✅ Claude 3.5 Sonnet para respostas naturais
- ✅ Sugestões automáticas de anamnese
- ✅ Análise de evolução de medidas

### 🔒 Segurança

- ✅ Criptografia AES para dados sensíveis
- ✅ Autenticação JWT
- ✅ Conformidade com LGPD
- ✅ Rate limiting e proteções

## 🛠 Tech Stack

### Backend

- **Node.js** com Express.js
- **SQLite** com better-sqlite3 (MVP)
- **WhatsApp Web.js** para bot WhatsApp
- **Telegraf** para bot Telegram
- **Mailchimp API** para emails
- **Sharp** para processamento de imagens
- **node-cron** para tarefas agendadas

### Frontend

- **React.js** 18+
- **Material-UI** para componentes
- **Fabric.js** para editor de imagem
- **Axios** para API calls
- **React Hook Form** para formulários

### Infraestrutura

- **Docker** (opcional)
- **Supabase** (migração futura)
- **Vercel/Netlify** (deploy frontend)

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Git

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/altclinic.git
cd altclinic
```

### 2. Instale dependências do backend

```bash
npm install
```

### 3. Configure variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Banco de dados
DB_PATH=./saee.db

# Segurança
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
ENCRYPTION_KEY=sua_chave_32_caracteres_hex_aqui

# CRM
DIAS_INATIVO=90
DIAS_SPAM_PROTECTION=30

# APIs Externas
CLAUDE_API_KEY=sua_api_key_claude_aqui
WHATSAPP_SESSION_PATH=./whatsapp-session
TELEGRAM_BOT_TOKEN=seu_token_telegram_aqui

# Mailchimp
MAILCHIMP_API_KEY=sua_api_key_mailchimp_aqui
MAILCHIMP_SERVER_PREFIX=us1
MAILCHIMP_LIST_ID=seu_list_id_aqui
```

### 4. Execute as migrations

```bash
npm run migrate
```

### 5. Inicie o servidor backend

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

### 6. Configure o frontend (opcional)

```bash
cd frontend
npm install
npm start
```

## 🔧 Configuração dos Bots

### WhatsApp Bot

1. Execute o backend: `npm run dev`
2. Escaneie o QR Code que aparece no terminal
3. O bot estará conectado e pronto

### Telegram Bot

1. Crie um bot no [@BotFather](https://t.me/botfather)
2. Adicione o token no `.env`
3. Reinicie o servidor

### Mailchimp

1. Crie conta gratuita no [Mailchimp](https://mailchimp.com)
2. Gere API key em Account > Extras > API Keys
3. Crie uma lista e obtenha o List ID
4. Configure no `.env`

## 📊 Uso da API

### Autenticação

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@clinica.com", "senha": "123456"}'
```

### Agendamentos

```bash
# Criar agendamento
curl -X POST http://localhost:3000/api/agendamentos \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paciente_id": 1,
    "procedimento_id": 1,
    "equipamento_id": 1,
    "data_hora": "2024-01-15T14:00:00Z"
  }'
```

### Prontuários

```bash
# Upload de imagem
curl -X POST http://localhost:3000/api/prontuarios \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "paciente_id=1" \
  -F "imagem=@foto.jpg" \
  -F 'anamnese_json={"idade": 30, "historico": "Nenhum"}'
```

## 🎨 Editor de Imagem

O sistema inclui um editor de imagem completo baseado em Fabric.js:

### Funcionalidades

- ✅ Desenho livre com pincel configurável
- ✅ Adição de textos e anotações
- ✅ Zoom e navegação
- ✅ Histórico (undo/redo)
- ✅ Anotações não destrutivas
- ✅ Export em alta qualidade

### Uso

```jsx
import { ImageEditorModal } from "./components/ImageEditor";

const MyComponent = () => {
  const [editorOpen, setEditorOpen] = useState(false);

  const handleSave = async (blob, dataURL) => {
    // Salvar imagem editada
    const formData = new FormData();
    formData.append("imagem", blob);
    await api.post("/prontuarios", formData);
  };

  return (
    <ImageEditorModal
      open={editorOpen}
      imageUrl="/uploads/imagem.jpg"
      onSave={handleSave}
      onClose={() => setEditorOpen(false)}
    />
  );
};
```

## 🔄 Cron Jobs

O sistema executa tarefas automatizadas:

### Jobs Configurados

- **9h diárias**: Verificação de pacientes inativos
- **A cada 2h (8-18h)**: Confirmações de agendamento
- **A cada hora (8-20h)**: Lembretes de agendamento
- **20h diárias**: Relatórios diários

### Execução Manual

```bash
# Via API
curl -X POST http://localhost:3000/api/crm/cron/manual \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"job_name": "inactivity"}'
```

## 📈 Relatórios CRM

### Tipos Disponíveis

- **Inativos**: Pacientes sem atendimento há X dias
- **Ativos**: Pacientes com atendimento recente
- **Novos**: Pacientes cadastrados recentemente
- **Geral**: Visão geral com estatísticas

### API

```bash
# Relatório de inativos
curl "http://localhost:3000/api/crm/relatorios?tipo=inativos&dias_inativo=90" \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 🚨 Troubleshooting

### Problemas Comuns

**Erro de permissão SQLite**

```bash
chmod 666 saee.db
chmod 777 .
```

**WhatsApp não conecta**

- Limpe a pasta `./whatsapp-session`
- Reinicie o servidor
- Escaneie o QR code novamente

**Erro de criptografia**

- Gere nova chave: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Atualize `ENCRYPTION_KEY` no `.env`

**Upload de imagens falha**

```bash
mkdir uploads
chmod 755 uploads
```

## 🔐 Segurança

### Boas Práticas Implementadas

- ✅ Senhas hash com bcrypt (12 rounds)
- ✅ Criptografia AES-256 para dados sensíveis
- ✅ JWT com expiração
- ✅ Rate limiting
- ✅ Validação de entrada
- ✅ Sanitização de dados
- ✅ Headers de segurança (Helmet)

### Em Produção

```bash
# Use HTTPS sempre
# Configure variáveis seguras
JWT_SECRET=senha_super_forte_com_64_caracteres_minimum_security
ENCRYPTION_KEY=chave_hex_32_bytes_gerada_com_crypto_randomBytes

# Configure firewall
# Use proxy reverso (nginx)
# Monitore logs
```

## 📦 Deploy

### Backend (Railway/Render)

```bash
# Build
npm run build

# Configure variáveis de ambiente
# Deploy via Git
```

### Frontend (Vercel/Netlify)

```bash
cd frontend
npm run build

# Deploy pasta build/
```

### Docker (opcional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie feature branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Veja [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- 📧 Email: suporte@altclinic.com.br
- 💬 Discord: [link-do-servidor]
- 📖 Docs: [documentacao.altclinic.com.br]

## 🗺 Roadmap

### v1.1 (Q1 2024)

- [ ] PWA para mobile
- [ ] Notificações push
- [ ] Relatórios avançados
- [ ] Integração com calendários

### v1.2 (Q2 2024)

- [ ] Migração para PostgreSQL
- [ ] Multi-tenancy
- [ ] API webhooks
- [ ] Módulo financeiro completo

### v2.0 (Q3 2024)

- [ ] Marketplace de procedimentos
- [ ] IA para análise de imagens
- [ ] Telemedicina básica
- [ ] App mobile nativo

---

**Desenvolvido com ❤️ para clínicas estéticas brasileiras**
