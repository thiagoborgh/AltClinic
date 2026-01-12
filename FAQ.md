# ❓ Perguntas Frequentes (FAQ)

## 📦 Sobre o Sistema

### O que é este sistema?

Um **SaaS** (Software as a Service) para gestão de clínicas de estética, com foco em:

- Agendamentos
- Notificações WhatsApp
- Gestão de profissionais
- Interface simples e moderna

### Quanto custa?

- **30 dias grátis** para testar
- **R$ 19,90/mês** depois do trial
- Até **3 usuários** inclusos

### Posso usar sem pagar?

Sim! Você tem **30 dias de teste gratuito** a partir do cadastro.

---

## 🚀 Instalação e Uso

### Preciso ser programador?

Para **usar** o sistema: **NÃO**
Para **instalar** localmente: precisa saber o básico de terminal/comandos

### Como instalo?

1. Baixe Node.js (https://nodejs.org)
2. Siga o [QUICK-START.md](QUICK-START.md)
3. Leva ~5 minutos

### Funciona no celular?

✅ Sim! A interface é **responsiva** e funciona perfeitamente no navegador mobile.

### Posso acessar de qualquer lugar?

Se você **hospedar** em um servidor (VPS, Heroku, etc), sim!
Se rodar **localmente**, só na sua rede local.

---

## 👥 Usuários e Limites

### Quantos usuários posso ter?

**3 usuários** no plano de R$ 19,90

### O que conta como "usuário"?

Cada pessoa que faz **login** no sistema (profissionais, admin, etc)

### E se eu precisar de mais?

Fale com o desenvolvedor para criar planos maiores (futuro)

### Posso remover um usuário?

Sim, nas Configurações → Usuários

---

## 📱 WhatsApp

### Preciso instalar alguma coisa?

**Não**, se escolher a opção **Manual** (wa.me)

**Sim**, se quiser automação total com Evolution API

### Qual método de WhatsApp escolher?

#### Use **Manual** (wa.me) se:

- ⭐ Está começando
- ⭐ Tem poucos agendamentos (até 30/dia)
- ⭐ Não quer complicação

#### Use **Evolution API** se:

- ⭐ Tem muitos agendamentos (50+/dia)
- ⭐ Quer envio automático
- ⭐ Tem conhecimento técnico

### Como funciona o método Manual?

1. Sistema gera link `https://wa.me/...`
2. Você clica no link
3. Abre WhatsApp Web
4. Você revisa e envia manualmente

### O Evolution API é grátis?

A **API em si é grátis** (open-source), mas você precisa de um **servidor** para rodar:

- Computador local: R$ 0
- VPS na nuvem: R$ 20-50/mês

### Posso trocar depois?

✅ Sim! Você pode mudar em Configurações → WhatsApp a qualquer momento.

---

## 💳 Pagamento e Assinatura

### Preciso cadastrar cartão de crédito?

**Não** no trial de 30 dias.
Depois sim, para continuar usando.

### Como funciona o pagamento? (futuro)

Integração com Stripe ou Mercado Pago (em desenvolvimento)

### Posso cancelar a qualquer momento?

Sim, sem multas ou taxas.

### O que acontece se eu cancelar?

- Dados ficam salvos por 30 dias
- Depois, são deletados permanentemente

---

## 🔒 Segurança e Privacidade

### Meus dados estão seguros?

✅ Senhas criptografadas com bcrypt
✅ JWT para autenticação
✅ Isolamento multi-tenant (cada clínica separada)

### Vocês vendem meus dados?

**NÃO**. Seus dados são seus e não são compartilhados.

### Onde ficam armazenados os dados?

No banco SQLite local ou no servidor que você escolher hospedar.

### Posso fazer backup?

✅ Sim! Basta copiar o arquivo `clinica-saas.db`

---

## 🐛 Problemas Comuns

### "Erro: JWT_SECRET não definido"

**Solução:**

```bash
cd Backend
echo "JWT_SECRET=chave123" > .env
```

### "Porta 3000 já está em uso"

**Solução:**

1. Feche outros servidores rodando
2. Ou mude a porta no `.env`: `PORT=3001`

### "Email já cadastrado"

**Solução:**

1. Use outro email, OU
2. Delete o banco: `Backend/clinica-saas.db` e reinicie

### Frontend não conecta no backend

**Soluções:**

1. Verifique se backend está rodando: http://localhost:3000
2. Verifique CORS no server-saas.js
3. Limpe cache do navegador

### WhatsApp não abre

**Soluções:**

1. Verifique se o número tem DDD correto
2. Teste com seu próprio número primeiro
3. Use navegador atualizado (Chrome/Edge)

---

## 📈 Funcionalidades

### Posso agendar consultas recorrentes?

Ainda não. Feature planejada para versão futura.

### Tem relatórios financeiros?

Ainda não. Planejado para versão futura.

### Posso personalizar o logo?

Em desenvolvimento (WhiteLabel).

### Tem app mobile nativo?

Não, mas a interface web funciona perfeitamente no mobile.

### Integra com Google Calendar?

Não ainda. Planejado para futuro.

---

## 🔧 Técnico

### Qual banco de dados usa?

**SQLite** - simples, leve, sem servidor externo necessário.

### Posso mudar para PostgreSQL/MySQL?

Sim, o Sequelize suporta. Precisa ajustar a configuração.

### Como faço deploy em produção?

#### Opção 1: VPS (DigitalOcean, Linode)

```bash
# Instalar Node.js no servidor
# Clonar repositório
git clone seu-repo
cd clinica-estetica-mvp

# Backend
cd Backend
npm install
npm start

# Frontend (build)
cd frontend
npm install
npm run build
# Servir com nginx ou similar
```

#### Opção 2: Plataformas (Heroku, Railway)

1. Conecte seu GitHub
2. Escolha o repositório
3. Deploy automático!

### Como atualizar o sistema?

```bash
git pull origin main
cd Backend && npm install
cd ../frontend && npm install
```

---

## 🤝 Suporte

### Onde encontro mais ajuda?

- [QUICK-START.md](QUICK-START.md) - Início rápido
- [README.md](README.md) - Visão geral
- [WHATSAPP-INTEGRATION.md](WHATSAPP-INTEGRATION.md) - Config WhatsApp
- [MIGRATION-GUIDE.md](MIGRATION-GUIDE.md) - Migração
- [CHANGELOG.md](CHANGELOG.md) - Resumo completo

### Encontrei um bug, o que faço?

1. Verifique os logs no terminal
2. Consulte esta FAQ
3. Leia a documentação
4. Abra uma issue no GitHub

### Posso contribuir com o código?

Sim! Pull requests são bem-vindos.

### Posso revender este sistema?

Depende da licença. Consulte o desenvolvedor.

---

## 💡 Dicas

### Melhores práticas

1. ✅ **Teste primeiro** com dados falsos
2. ✅ **Faça backup** do banco regularmente
3. ✅ **Use senhas fortes** (mín 8 caracteres)
4. ✅ **Comece com WhatsApp manual** e migre depois
5. ✅ **Configure apenas** o essencial no início

### Performance

- SQLite aguenta **milhares** de agendamentos
- Limite de 3 usuários é mais que suficiente para pequenas clínicas
- WhatsApp manual é mais rápido que configurar API

### Escalabilidade

Se sua clínica crescer:

1. Migre para PostgreSQL
2. Use servidor dedicado
3. Configure Evolution API
4. Contrate plano maior (futuro)

---

## 🎯 Casos de Uso

### Clínica pequena (1-2 profissionais)

- ✅ Use WhatsApp manual
- ✅ 1 usuário admin + 1 profissional
- ✅ Hospede localmente ou VPS barato

### Clínica média (3 profissionais)

- ✅ WhatsApp manual ou Evolution API
- ✅ 3 usuários no plano
- ✅ VPS com domínio próprio

### Múltiplas clínicas

- ✅ Cada clínica = 1 tenant separado
- ✅ Cadastre cada uma separadamente
- ✅ R$ 19,90 × número de clínicas

---

## 📞 Contato

Para dúvidas não respondidas aqui:

- Consulte a documentação completa
- Abra uma issue no repositório
- Entre em contato com o desenvolvedor

---

**Última atualização:** 12/01/2026
**Versão:** 2.0.0
