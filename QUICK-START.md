# 🚀 Início Rápido - 5 Minutos

## Passo 1: Preparar Backend (2 min)

```bash
# Abra um terminal e navegue até a pasta Backend
cd Backend

# Instale as dependências
npm install

# Configure variável de ambiente
# Windows (PowerShell):
echo "JWT_SECRET=minha_chave_secreta_123" > .env

# Inicie o servidor
npm start
```

✅ Você verá: "Servidor SaaS rodando em http://localhost:3000"

---

## Passo 2: Preparar Frontend (2 min)

```bash
# Abra OUTRO terminal e navegue até a pasta frontend
cd frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

✅ Você verá: "Local: http://localhost:5173"

---

## Passo 3: Criar Sua Conta (1 min)

1. Abra o navegador em: **http://localhost:5173/cadastro**

2. Preencha:

   - **Nome da Clínica:** Ex: Clínica Bella
   - **Seu Nome:** Ex: Maria Silva
   - **E-mail:** seu@email.com
   - **Telefone:** (11) 99999-9999
   - **Senha:** mínimo 6 caracteres

3. Clique em **"Criar Conta"**

4. 🎉 **Pronto!** Configure o pagamento para ativar o sistema!

---

## Passo 4: Explorar o Sistema

### Acessar a Agenda

- URL: http://localhost:5173/agenda
- Aqui você gerencia seus agendamentos

### Configurar WhatsApp

1. Vá em **Configurações** → **WhatsApp**
2. Escolha uma opção:
   - ✅ **Manual** (clique e envia) - Recomendado!
   - 🚀 **Evolution API** (automático) - Ver [guia](WHATSAPP-INTEGRATION.md)

### Adicionar Usuários

- Configurações → Usuários
- Adicione até 3 profissionais

---

## 🎯 Próximos Passos

1. ✅ Cadastrar procedimentos
2. ✅ Configurar horários de atendimento
3. ✅ Criar primeiro agendamento
4. ✅ Testar envio de WhatsApp

---

## ⚡ Comandos Úteis

```bash
# Parar servidores
Ctrl + C (em cada terminal)

# Reiniciar backend
cd Backend
npm start

# Reiniciar frontend
cd frontend
npm run dev

# Ver logs de erro
# (olhe no terminal onde rodou npm start)
```

---

## 🐛 Problemas?

### Backend não inicia

- ✅ Verifique se a porta 3000 está livre
- ✅ Confirme que o arquivo .env existe
- ✅ Rode `npm install` novamente

### Frontend não carrega

- ✅ Verifique se a porta 5173 está livre
- ✅ Confirme que o backend está rodando
- ✅ Limpe cache do navegador (Ctrl + Shift + Del)

### Erro "JWT_SECRET não definido"

- ✅ Crie o arquivo Backend/.env com JWT_SECRET

---

## 📱 Testar no Celular

1. Descubra seu IP local:

```bash
# Windows
ipconfig
# Procure por "IPv4" (ex: 192.168.1.100)

# Mac/Linux
ifconfig
# Procure por "inet" (ex: 192.168.1.100)
```

2. No celular, acesse:
   - `http://SEU_IP:5173`
   - Ex: `http://192.168.1.100:5173`

---

## 💰 Lembretes

- ✅ **R$ 19,90/mês** pagamento mensal
- ✅ **Até 3 usuários** no plano
- ✅ **WhatsApp incluído** (manual ou API)

---

## 📚 Documentação Completa

- [README.md](README.md) - Visão geral do projeto
- [WHATSAPP-INTEGRATION.md](WHATSAPP-INTEGRATION.md) - Configurar WhatsApp
- [MIGRATION-GUIDE.md](MIGRATION-GUIDE.md) - Migrar sistema antigo

---

**Pronto para começar? 🚀**

Qualquer dúvida, consulte os arquivos de documentação ou revise os passos acima.

**Boa sorte com sua clínica! 💆‍♀️✨**
