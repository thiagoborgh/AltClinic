# 🧪 Guia de Testes Pós-Deploy

## Data: 13 de Outubro de 2025

## 📋 Checklist de Testes

### ✅ 1. Verificar servidores estão rodando

```powershell
# Backend (porta 3000)
cd c:\Users\thiag\saee
npm start

# Frontend (porta 3001)
cd c:\Users\thiag\saee\frontend
npm start

# Admin (porta 3002)
cd c:\Users\thiag\saee\admin\backend
node admin-server.js
```

### ✅ 2. Testar funcionalidades principais

#### **Login e Autenticação**
- [ ] Login com usuário existente
- [ ] Trial de 15 dias funcionando
- [ ] Mensagens de erro apropriadas
- [ ] Redirect após login

#### **AgendaLite**
- [ ] Visualização semanal carrega
- [ ] Botão "Configurar Grade" abre modal
- [ ] Botão "Lista de Espera" (HourglassEmpty) abre modal
- [ ] Agendamentos aparecem corretamente

#### **ModalListaEspera**
- [ ] Autocomplete de pacientes funciona
- [ ] Busca de pacientes por nome/CPF
- [ ] Checkbox "Novo Paciente" funciona
- [ ] Campo Procedimento carrega lista da API
- [ ] Validações: nome, telefone obrigatórios
- [ ] CPF obrigatório apenas para novos
- [ ] Campos opcionais: período, dias, convênio
- [ ] Botão "Adicionar à Lista" salva

#### **ConfiguracaoGrade**
- [ ] Modo embedded em ProfissionaisMedicos
- [ ] Modo modal em AgendaLite
- [ ] Salvar horários funciona
- [ ] Validações de conflito

#### **Professional Schedules**
- [ ] GET /api/professional/schedule retorna dados
- [ ] POST cria novos horários
- [ ] PUT atualiza horários
- [ ] DELETE remove horários
- [ ] Bulk-update funciona

### ✅ 3. Testar integrações WhatsApp

#### **Verificar configuração**
```powershell
# Testar endpoint de status
curl http://localhost:3000/api/whatsapp/status
```

- [ ] Status da conexão OK
- [ ] Credenciais configuradas
- [ ] Limites de mensagens corretos

#### **Testar envios**
- [ ] Confirmação de agendamento
- [ ] Lembrete de consulta
- [ ] Cobrança de pagamento
- [ ] Pesquisa de satisfação

### ✅ 4. Verificar banco de dados

```powershell
# Verificar estrutura do banco
node check-db.js
```

- [ ] Tabelas criadas corretamente
- [ ] Migrations executadas
- [ ] Dados de teste presentes

### ✅ 5. Testar APIs

```powershell
# Testar endpoint de procedimentos
curl http://localhost:3000/api/models/procedimentos

# Testar endpoint de pacientes
curl http://localhost:3000/api/pacientes

# Testar endpoint de agendamentos
curl http://localhost:3000/api/agendamentos
```

### ✅ 6. Verificar logs

```powershell
# Ver logs do backend
tail -f logs/app.log

# Verificar erros no navegador
# Abrir Console do navegador (F12)
```

## 🐛 Problemas Comuns e Soluções

### Backend não inicia
```powershell
# Verificar porta 3000 livre
netstat -ano | findstr :3000
# Se ocupada, matar processo
taskkill /PID <pid> /F
```

### Frontend não compila
```powershell
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Banco de dados travado
```powershell
# Fechar todas as conexões
taskkill /IM node.exe /F
# Deletar arquivos -wal e -shm
rm *.db-wal *.db-shm
```

### Erro de CORS
- Verificar `CORS_ORIGIN` em `.env`
- Deve ser `http://localhost:3001` em desenvolvimento

## 📊 Métricas de Sucesso

- ✅ Todos os servidores iniciando sem erros
- ✅ Frontend compila sem warnings críticos
- ✅ Todas as rotas principais respondem
- ✅ Nenhum erro no console do navegador
- ✅ Banco de dados acessível
- ✅ Login e autenticação funcionando
- ✅ Novas features (ModalListaEspera, AgendaLite) operacionais

## 🚀 Próximos Passos Após Testes

1. ✅ Todos os testes passaram → **Criar release/tag**
2. ⚠️ Alguns testes falharam → **Corrigir e re-testar**
3. 📝 Documentar issues encontrados
4. 🔄 Atualizar documentação se necessário

## 📝 Notas

- Sempre testar em ambiente de desenvolvimento primeiro
- Manter backup dos bancos de dados
- Documentar qualquer erro encontrado
- Atualizar este guia com novos testes

---

**Última atualização:** 13/10/2025
**Versão do sistema:** 2.0.0
**Commits testados:** ef8cc1a até 76ff6ef
