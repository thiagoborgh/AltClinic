# ✅ Checklist de Deploy - Passo a Passo

## 🎯 Objetivo

Subir o sistema SaaS para produção com **Railway** (grátis para começar)

---

## Fase 1: Preparação Local ✅

- [x] Backend existe e funciona
- [x] Frontend existe e funciona
- [x] .env configurado com JWT_SECRET
- [ ] Testar backend localmente
- [ ] Testar frontend localmente
- [ ] Testar cadastro funciona
- [ ] Testar login funciona

---

## Fase 2: Preparar para Deploy

### 2.1 Atualizar Frontend para usar variável de ambiente

- [ ] Criar `frontend/src/config.js`
- [ ] Criar `frontend/.env.production`
- [ ] Atualizar todos os componentes para usar API_URL
- [ ] Testar localmente com variável

### 2.2 Otimizar Backend

- [ ] Verificar `package.json` tem script "start"
- [ ] Adicionar `"engines": { "node": ">=18.0.0" }`
- [ ] Atualizar CORS para produção
- [ ] Criar `.gitignore` correto

### 2.3 Git

- [ ] Inicializar repositório Git
- [ ] Fazer commit inicial
- [ ] Criar repositório no GitHub
- [ ] Push para GitHub

---

## Fase 3: Deploy Railway

### 3.1 Criar Conta

- [ ] Acessar https://railway.app
- [ ] Login com GitHub
- [ ] Verificar conta criada

### 3.2 Deploy Backend

- [ ] "New Project" → "Deploy from GitHub repo"
- [ ] Selecionar repositório
- [ ] Aguardar build
- [ ] Adicionar variáveis:
  - [ ] JWT_SECRET
  - [ ] PORT=3000
  - [ ] NODE_ENV=production
- [ ] Copiar URL gerada

### 3.3 Deploy Frontend

- [ ] Railway detecta pasta frontend/
- [ ] Configurar variável VITE_API_URL
- [ ] Aguardar build
- [ ] Copiar URL frontend

---

## Fase 4: Testes em Produção

- [ ] Acessar URL do frontend
- [ ] HTTPS funcionando (cadeado verde)
- [ ] Página carrega sem erros
- [ ] Criar conta de teste
- [ ] Fazer login
- [ ] Criar agendamento
- [ ] Gerar link WhatsApp
- [ ] Testar no celular

---

## Fase 5: Configurações Finais

- [ ] Configurar domínio próprio (opcional)
- [ ] Configurar monitoramento (UptimeRobot)
- [ ] Fazer backup do banco
- [ ] Documentar URLs de produção
- [ ] Preparar suporte para clientes

---

## Fase 6: Lançamento

- [ ] Criar landing page (opcional)
- [ ] Preparar materiais de marketing
- [ ] Definir estratégia de aquisição
- [ ] Buscar primeiros clientes
- [ ] 🎉 Sistema no ar e faturando!

---

## 🚨 Em caso de problemas

### Backend não inicia

1. Verificar logs no Railway
2. Verificar variáveis de ambiente
3. Testar localmente primeiro

### Frontend não conecta

1. Verificar VITE_API_URL
2. Verificar CORS no backend
3. Verificar console do navegador

### Banco não persiste

1. Railway cria volume automático
2. Verificar logs de erro
3. Checar permissões

---

## 💡 Dicas

- **Comece simples:** Railway é perfeito para MVP
- **Teste local primeiro:** Nunca pule essa etapa
- **Monitore:** Configure alertas desde o dia 1
- **Backup:** Faça backup do .db semanalmente
- **Custos:** Railway free tier tem 500h/mês

---

## 📞 Suporte

- Railway Docs: https://docs.railway.app
- Deploy Guide: [DEPLOY.md](DEPLOY.md)
- Troubleshooting: [FAQ.md](FAQ.md)

---

**Vamos começar?** 🚀

Diga "sim" e vamos para o Passo 1!
