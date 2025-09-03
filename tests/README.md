# 🧪 Documentação do Sistema de Testes Automatizados

# SAEE & Intranet Altclinic

## 📋 Visão Geral

Este sistema de testes automatizados foi criado para garantir a qualidade e confiabilidade dos sistemas SAEE (Sistema de Atendimento e Agendamento) e da Intranet Administrativa da Altclinic.

## 🏗️ Arquitetura dos Testes

### Estrutura de Diretórios

```
tests/
├── package.json              # Configuração Jest e dependências
├── setup.js                  # Setup global dos testes
├── playwright.config.js      # Configuração Playwright (E2E)
├── run-tests.sh              # Script execução (Linux/Mac)
├── run-tests.bat             # Script execução (Windows)
├── api/
│   ├── saee-api.test.js      # Testes API do SAEE
│   └── admin-api.test.js     # Testes API da Intranet
├── frontend/
│   ├── saee-frontend.test.js # Testes Frontend SAEE
│   └── admin-frontend.test.js# Testes Frontend Intranet
├── integration/
│   └── system-integration.test.js # Testes Integração
└── e2e/
    └── complete-system.spec.js    # Testes End-to-End
```

## 🎯 Tipos de Testes

### 1. **Testes de API** (`tests/api/`)

- **Propósito**: Validar endpoints, autenticação, CRUD operations
- **Framework**: Jest + Supertest
- **Cobertura**:
  - SAEE: Configurações, WhatsApp, Pacientes, Agendamentos
  - Admin: Autenticação, Licenças, Dashboard, Sincronização

### 2. **Testes de Frontend** (`tests/frontend/`)

- **Propósito**: Validar componentes React, interações do usuário
- **Framework**: Jest + React Testing Library
- **Cobertura**:
  - Renderização de componentes
  - Interações do usuário
  - Responsividade
  - Estados da aplicação

### 3. **Testes de Integração** (`tests/integration/`)

- **Propósito**: Validar comunicação entre sistemas
- **Framework**: Jest
- **Cobertura**:
  - Sincronização de dados SAEE ↔ Admin
  - Segurança e autenticação
  - Performance e rate limiting

### 4. **Testes End-to-End** (`tests/e2e/`)

- **Propósito**: Validar fluxos completos do usuário
- **Framework**: Playwright
- **Cobertura**:
  - Jornadas completas do usuário
  - Compatibilidade cross-browser
  - Testes em dispositivos móveis

## 🚀 Como Executar

### Método 1: Script Automatizado (Recomendado)

#### Windows:

```cmd
# Navegar para o diretório do projeto
cd c:\Users\thiag\saee

# Executar script de testes
tests\run-tests.bat
```

#### Linux/Mac:

```bash
# Navegar para o diretório do projeto
cd /path/to/saee

# Dar permissão ao script
chmod +x tests/run-tests.sh

# Executar script de testes
./tests/run-tests.sh
```

### Método 2: Comandos Individuais

```bash
# Navegar para diretório de testes
cd tests

# Instalar dependências
npm install

# Executar tipos específicos de teste
npm run test:api          # Testes de API
npm run test:frontend     # Testes de Frontend
npm run test:integration  # Testes de Integração
npm run test:e2e         # Testes End-to-End
npm run test:coverage    # Relatório de cobertura
npm run test:all         # Todos os testes
```

## 📊 Relatórios e Métricas

### Cobertura de Código

- **Meta**: 80% cobertura mínima
- **Relatório**: Gerado automaticamente em `coverage/`
- **Visualização**: `coverage/lcov-report/index.html`

### Métricas Monitoradas

- ✅ Cobertura de linhas de código
- ✅ Cobertura de branches
- ✅ Cobertura de funções
- ✅ Tempo de execução dos testes
- ✅ Performance das APIs
- ✅ Compatibilidade de browsers

## 🔧 Configuração de Ambiente

### Pré-requisitos

- Node.js (v14 ou superior)
- NPM ou Yarn
- Sistemas rodando nas portas corretas:
  - SAEE: `http://localhost:3000`
  - Admin Backend: `http://localhost:3001`
  - Admin Frontend: `http://localhost:3002`

### Variáveis de Ambiente

```env
# Testes API
SAEE_API_URL=http://localhost:3000
ADMIN_API_URL=http://localhost:3001

# Testes E2E
SAEE_FRONTEND_URL=http://localhost:3000
ADMIN_FRONTEND_URL=http://localhost:3002

# Configurações de teste
TEST_TIMEOUT=30000
TEST_PARALLEL=true
```

## 🧪 Estrutura dos Testes

### Padrão de Nomenclatura

```javascript
describe("Componente/Funcionalidade", () => {
  beforeAll(() => {
    // Setup antes de todos os testes
  });

  beforeEach(() => {
    // Setup antes de cada teste
  });

  describe("Cenário específico", () => {
    test("deve fazer algo específico", async () => {
      // Arrange - Preparar
      // Act - Executar
      // Assert - Verificar
    });
  });

  afterEach(() => {
    // Cleanup após cada teste
  });

  afterAll(() => {
    // Cleanup após todos os testes
  });
});
```

### Mocks e Fixtures

- **Localização**: `tests/setup.js`
- **APIs Mockadas**: WhatsApp Web.js, File System, External APIs
- **Dados de Teste**: Pacientes, configurações, licenças fictícias

## 🔍 Depuração de Testes

### Logs e Debug

```bash
# Executar com logs detalhados
npm run test:api -- --verbose

# Executar teste específico
npm run test:api -- --testNamePattern="login"

# Executar em modo watch
npm run test:frontend -- --watch

# Debug com Node.js
node --inspect-brk node_modules/.bin/jest
```

### Estratégias de Depuração

1. **Isolamento**: Executar teste individual
2. **Logging**: Adicionar console.log temporários
3. **Snapshots**: Usar Jest snapshots para componentes
4. **Screenshots**: Playwright captura automática em falhas

## 📈 Integração Contínua

### GitHub Actions (Configuração Futura)

```yaml
# .github/workflows/tests.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:all
```

### Webhook de Qualidade

- **Badge de Status**: Gerado automaticamente
- **Notificações**: Slack/Teams em falhas
- **Reports**: Enviados para dashboard de qualidade

## 🛡️ Testes de Segurança

### Validações Implementadas

- ✅ Autenticação JWT
- ✅ Rate Limiting
- ✅ Sanitização de inputs
- ✅ CORS policies
- ✅ LGPD compliance

### Testes de Penetração

- SQL Injection attempts
- XSS prevention
- CSRF protection
- Authorization bypass attempts

## 📱 Testes de Responsividade

### Dispositivos Testados

- **Desktop**: 1920x1080, 1366x768
- **Tablet**: iPad, Android tablets
- **Mobile**: iPhone, Android phones
- **Browsers**: Chrome, Firefox, Safari, Edge

## 🔄 Ciclo de Vida dos Testes

### 1. **Desenvolvimento**

```bash
# Executar testes em watch mode
npm run test:watch
```

### 2. **Pull Request**

```bash
# Executar suite completa
npm run test:all
```

### 3. **Deploy**

```bash
# Testes de produção
npm run test:production
```

### 4. **Monitoramento**

```bash
# Testes de saúde contínuos
npm run test:health
```

## 📞 Suporte e Manutenção

### Contatos

- **Desenvolvedor Principal**: Thiag
- **Documentação**: Este arquivo
- **Issues**: GitHub Issues (quando configurado)

### Atualizações

- **Frequência**: A cada nova feature
- **Versionamento**: Seguir SemVer
- **Compatibilidade**: Manter retrocompatibilidade

---

## 🎉 Conclusão

Este sistema de testes automatizados garante:

✅ **Qualidade**: Detecção precoce de bugs
✅ **Confiabilidade**: Validação contínua do sistema
✅ **Manutenibilidade**: Refatoração segura
✅ **Performance**: Monitoramento de tempo de resposta
✅ **Segurança**: Validação de controles de acesso
✅ **Experiência**: Testes de UX/UI

**Para executar agora:**

```cmd
# Windows
tests\run-tests.bat

# Linux/Mac
./tests/run-tests.sh
```

🚀 **Sistema pronto para produção com confiança total!**
