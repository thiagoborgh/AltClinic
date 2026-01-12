# 🔄 Guia de Migração - Sistema Antigo → SaaS

## 📋 O que mudou?

### Antes (Sistema Monolítico)

- ❌ Um sistema por clínica
- ❌ Instalação complexa
- ❌ Gestão complicada de filiais
- ❌ WhatsApp não integrado

### Agora (SaaS Multi-Tenant)

- ✅ Um sistema para múltiplas clínicas
- ✅ Cadastro online simples
- ✅ Estrutura simplificada
- ✅ WhatsApp integrado (2 opções)
- ✅ R$ 19,90/mês para até 3 usuários

---

## 🚀 Como Migrar

### Opção 1: Começar do Zero (Recomendado)

Se você está começando ou tem poucos dados:

1. **Parar o servidor antigo:**

```bash
# No terminal do Backend antigo
Ctrl + C
```

2. **Iniciar novo servidor SaaS:**

```bash
cd Backend
node server-saas.js
```

3. **Acessar o frontend:**

```bash
cd frontend
npm run dev
```

4. **Criar nova conta:**

- Acesse http://localhost:5173/cadastro
- Preencha os dados da clínica
- Ganhe 30 dias de teste grátis

---

### Opção 2: Migrar Dados Existentes

Se você já tem agendamentos e profissionais cadastrados:

#### Passo 1: Backup do banco antigo

```bash
cp Backend/agendamentos.db Backend/agendamentos-backup.db
```

#### Passo 2: Script de Migração

Crie o arquivo `Backend/migrate.js`:

```javascript
const sqlite3 = require("sqlite3").verbose();

// Banco antigo
const dbOld = new sqlite3.Database("./agendamentos.db");

// Banco novo
const dbNew = new sqlite3.Database("./clinica-saas.db");

console.log("🔄 Iniciando migração...\n");

// 1. Criar tenant (clínica)
dbNew.run(
  `
  INSERT INTO tenants (nome, email, plano, status, dataExpiracao, maxUsuarios, ativo)
  VALUES ('Minha Clínica', 'contato@clinica.com', 'starter', 'trial', datetime('now', '+30 days'), 3, 1)
`,
  function (err) {
    if (err) {
      console.error("Erro ao criar tenant:", err);
      return;
    }

    const tenantId = this.lastID;
    console.log(`✅ Tenant criado: ID ${tenantId}`);

    // 2. Migrar profissionais
    dbOld.all("SELECT * FROM profissionais", [], (err, profissionais) => {
      if (err) {
        console.error("Erro ao ler profissionais:", err);
        return;
      }

      profissionais.forEach((prof, index) => {
        dbNew.run(
          `
        INSERT INTO usuarios (nome, email, senha, papel, tenantId, especialidade, procedimentos, grade, ativo)
        VALUES (?, ?, ?, 'profissional', ?, ?, ?, ?, ?)
      `,
          [
            prof.nome,
            prof.email || `prof${index}@clinica.com`,
            prof.senha || "$2b$10$defaulthash",
            tenantId,
            prof.especialidade,
            prof.procedimentos,
            prof.grade,
            prof.ativo,
          ]
        );
      });

      console.log(`✅ ${profissionais.length} profissionais migrados`);

      // 3. Migrar agendamentos
      dbOld.all("SELECT * FROM agendamentos", [], (err, agendamentos) => {
        if (err) {
          console.error("Erro ao ler agendamentos:", err);
          return;
        }

        agendamentos.forEach((ag) => {
          // Extrair nome e telefone do cliente (assumindo formato "Nome - Telefone")
          const [clienteNome, clienteTelefone] = ag.cliente.split(" - ");

          dbNew.run(
            `
          INSERT INTO agendamentos (clienteNome, clienteTelefone, profissionalId, procedimento, data, horario, status, tenantId)
          VALUES (?, ?, ?, ?, ?, ?, 'confirmado', ?)
        `,
            [
              clienteNome || ag.cliente,
              clienteTelefone || "00000000000",
              ag.profissionalId,
              ag.procedimento,
              ag.data,
              ag.horario,
              tenantId,
            ]
          );
        });

        console.log(`✅ ${agendamentos.length} agendamentos migrados`);
        console.log("\n✨ Migração concluída com sucesso!");

        dbOld.close();
        dbNew.close();
      });
    });
  }
);
```

#### Passo 3: Executar migração

```bash
cd Backend
node migrate.js
```

---

## 📁 Estrutura de Arquivos

### Arquivos Antigos (podem ser mantidos como backup)

```
Backend/
  ├── server.js              # ❌ Servidor antigo
  ├── agendamentos.db        # ❌ Banco antigo
  └── database.js            # ❌ Não usado mais
```

### Arquivos Novos (usar a partir de agora)

```
Backend/
  ├── server-saas.js         # ✅ Novo servidor SaaS
  ├── clinica-saas.db        # ✅ Novo banco multi-tenant
  └── migrate.js             # 🔄 Script de migração (opcional)
```

---

## 🎯 Checklist de Migração

- [ ] Backup do banco de dados antigo
- [ ] Instalar dependências (npm install)
- [ ] Criar arquivo .env com JWT_SECRET
- [ ] Executar server-saas.js
- [ ] Criar conta no /cadastro
- [ ] (Opcional) Migrar dados antigos
- [ ] Configurar WhatsApp (manual ou Evolution API)
- [ ] Testar criação de agendamento
- [ ] Testar envio de notificação WhatsApp

---

## ⚙️ Configuração .env

Crie ou atualize o arquivo `Backend/.env`:

```env
# JWT Secret (crie uma chave forte)
JWT_SECRET=sua_chave_secreta_super_segura_aqui_123

# Porta do servidor
PORT=3000

# Banco de dados
DB_FILE=./clinica-saas.db

# Opcional: Evolution API (se for usar)
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua_chave_evolution
```

---

## 🐛 Problemas Comuns

### "Erro: JWT_SECRET não definido"

**Solução:** Crie o arquivo `.env` com `JWT_SECRET=suachave123`

### "Tabela não encontrada"

**Solução:** Delete `clinica-saas.db` e reinicie o servidor para recriar tabelas

### "Email já cadastrado"

**Solução:** Use outro email ou delete o banco e recrie

### Frontend não conecta

**Solução:**

1. Verifique se o backend está rodando (http://localhost:3000)
2. Confirme que o frontend está em http://localhost:5173
3. Verifique CORS no server-saas.js

---

## 📱 Diferenças de Interface

### Antes

- Configurações complexas (10+ abas)
- Empresa Matriz/Filiais
- Muitos campos obrigatórios

### Agora

- 3 abas simples: Geral, WhatsApp, Usuários
- Foco no essencial
- Cadastro rápido

---

## 💡 Dicas

1. **Teste primeiro localmente** antes de colocar em produção
2. **Mantenha backup** do banco antigo por 30 dias
3. **Comece com WhatsApp manual** e migre para Evolution depois
4. **Cadastre usuários aos poucos** (limite de 3)
5. **Configure agendamentos de teste** antes de usar com clientes reais

---

## 🆘 Precisa de Ajuda?

1. Leia o [README.md](README.md) completo
2. Consulte [WHATSAPP-INTEGRATION.md](WHATSAPP-INTEGRATION.md)
3. Verifique os logs do servidor
4. Teste as rotas com Postman/Insomnia

---

## 🎉 Próximos Passos

Após a migração:

1. ✅ Testar todos os fluxos principais
2. 🎨 Personalizar nome e logo da clínica
3. 👥 Adicionar profissionais (até 3)
4. 📅 Criar procedimentos
5. 📱 Configurar WhatsApp
6. 🚀 Começar a usar!

**Boa sorte! 🚀**
