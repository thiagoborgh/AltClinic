# Feature: Modal de Lista de Espera

## 📋 Resumo

Implementação de modal para adicionar pacientes à lista de espera com funcionalidades de busca de paciente existente, cadastro automático de novos pacientes e preferências de agendamento.

---

## 🎯 Requisitos Atendidos

### ✅ Funcionalidades Implementadas

1. **Busca de Paciente Existente**
   - Autocomplete com lista de pacientes cadastrados
   - Busca automática por CPF
   - Preenchimento automático dos dados quando encontrado

2. **Cadastro de Novo Paciente**
   - Campos obrigatórios: Nome e Telefone
   - CPF obrigatório APENAS para novos cadastros (evita duplicação)
   - E-mail opcional
   - Detecção automática se paciente já existe no sistema

3. **Preferências de Agendamento (Opcionais)**
   - Procedimento desejado
   - Período(s) preferido(s): Manhã, Tarde, Noite
   - Dias da semana preferidos
   - Campo de observações livre

4. **Validações Inteligentes**
   - Nome e telefone sempre obrigatórios
   - CPF obrigatório APENAS se for criar novo paciente
   - Pacientes existentes não precisam de CPF repetido
   - Busca automática por CPF para evitar duplicação

---

## 🏗️ Arquitetura

### Componente Principal

**Arquivo:** `frontend/src/components/ModalListaEspera.js`

### Props do Componente

```javascript
ModalListaEspera({
  open: boolean,              // Controla abertura do modal
  onClose: function,          // Callback ao fechar
  professionalId: string,     // ID do profissional selecionado
  onSave: function           // Callback após salvar com sucesso
})
```

### Estado do Formulário

```javascript
{
  // Dados do Paciente (Obrigatórios)
  nome: '',                   // * Obrigatório
  telefone: '',               // * Obrigatório
  cpf: '',                    // * Obrigatório apenas para novos
  email: '',                  // Opcional
  
  // Preferências (Todas Opcionais)
  profissionalId: '',
  procedimento: '',
  periodo: [],                // ['manha', 'tarde', 'noite']
  diasSemana: [],            // ['segunda', 'terca', ...]
  observacoes: '',
  
  // Controle Interno
  pacienteExistente: null,   // Objeto do paciente se encontrado
  criarNovoPaciente: false   // Flag para novo cadastro
}
```

---

## 🎨 Interface do Usuário

### Seções do Modal

#### 1. **Buscar Paciente Existente**
- Autocomplete com lista completa de pacientes
- Exibe: "Nome - CPF"
- Ao selecionar, preenche automaticamente todos os campos
- Desabilita edição dos dados pessoais

#### 2. **Dados do Paciente**
- **Nome Completo*** - TextField obrigatório
- **Telefone*** - TextField com máscara `(00) 00000-0000`
- **CPF** - TextField com máscara `000.000.000-00`
  - Busca automática ao completar 11 dígitos
  - Obrigatório apenas para novos cadastros
- **E-mail** - TextField opcional

#### 3. **Status do Paciente**
Alertas dinâmicos:
- 🔍 **Buscando...** - Enquanto busca por CPF
- ⚠️ **Novo paciente** - Quando CPF não encontrado
- ✅ **Encontrado** - Toast quando paciente localizado

#### 4. **Preferências de Agendamento**
Todos os campos são opcionais:

- **Procedimento** - TextField livre
- **Período Preferido** - Select múltiplo com chips
  - Manhã (8h-12h)
  - Tarde (12h-18h)
  - Noite (18h-20h)
- **Dias da Semana** - Select múltiplo com chips
  - Segunda a Sábado
- **Observações** - TextField multiline (3 linhas)

#### 5. **Informativo**
Alert com explicação sobre funcionamento da lista de espera

---

## 🔄 Fluxo de Funcionamento

### Cenário 1: Paciente Existente (via Autocomplete)

```
1. Usuário seleciona paciente no autocomplete
   ↓
2. Sistema preenche: nome, telefone, CPF, e-mail
   ↓
3. Campos são desabilitados (não editáveis)
   ↓
4. Usuário preenche preferências (opcional)
   ↓
5. Clica em "Adicionar à Lista"
   ↓
6. Sistema salva com pacienteId existente
```

### Cenário 2: Paciente Existente (via CPF)

```
1. Usuário digita CPF
   ↓
2. Sistema busca automaticamente ao completar 11 dígitos
   ↓
3. Se encontrado:
   - Preenche dados automaticamente
   - Desabilita campos
   - Mostra toast de sucesso
   ↓
4. Usuário preenche preferências
   ↓
5. Salva na lista de espera
```

### Cenário 3: Novo Paciente

```
1. Usuário digita CPF (ou deixa em branco)
   ↓
2. Sistema busca e não encontra
   ↓
3. Mostra alert: "Novo paciente será cadastrado"
   ↓
4. Usuário preenche nome* e telefone*
   ↓
5. CPF se torna obrigatório (validação)
   ↓
6. Preenche preferências (opcional)
   ↓
7. Clica em "Adicionar à Lista"
   ↓
8. Sistema:
   - Cria novo paciente
   - Adiciona à lista de espera
```

---

## 🔒 Validações

### Regras de Validação

```javascript
// Sempre obrigatórios
✓ Nome não pode estar vazio
✓ Telefone não pode estar vazio

// Condicional
✓ CPF obrigatório SE for criar novo paciente
✓ CPF opcional SE for paciente existente

// Formato
✓ Telefone: (00) 00000-0000
✓ CPF: 000.000.000-00
✓ E-mail: validação básica de formato
```

### Mensagens de Erro

```javascript
errors = {
  nome: 'Nome é obrigatório',
  telefone: 'Telefone é obrigatório',
  cpf: 'CPF é obrigatório para cadastrar novo paciente'
}
```

---

## 📡 Integração com API

### Endpoints Utilizados

#### 1. Buscar Pacientes (Autocomplete)
```javascript
GET /api/pacientes
Response: Array<Paciente>
```

#### 2. Buscar por CPF
```javascript
GET /api/pacientes/buscar-cpf/:cpf
Response: Paciente | null
```

#### 3. Salvar na Lista de Espera
```javascript
POST /api/lista-espera
Body: {
  pacienteId: number | null,
  nome: string,
  telefone: string,
  cpf: string,
  email: string,
  profissionalId: string,
  procedimento: string,
  periodo: string[],
  diasSemana: string[],
  observacoes: string,
  criarPaciente: boolean,
  status: 'aguardando',
  dataInclusao: ISO8601
}
Response: ListaEspera
```

---

## 🎛️ Integração com AgendaLite

### Modificações em AgendaLite.js

#### 1. Imports Adicionados
```javascript
import ModalListaEspera from '../components/ModalListaEspera';
```

#### 2. Estado Adicionado
```javascript
const [listaEsperaOpen, setListaEsperaOpen] = useState(false);
```

#### 3. Botão Atualizado
```javascript
<Tooltip title="Lista de Espera">
  <IconButton 
    size="small"
    onClick={() => {
      console.log('📋 Abrindo lista de espera');
      setListaEsperaOpen(true);
    }}
  >
    <HourglassEmpty />
  </IconButton>
</Tooltip>
```

#### 4. Modal Renderizado
```javascript
<ModalListaEspera
  open={listaEsperaOpen}
  onClose={() => setListaEsperaOpen(false)}
  professionalId={selectedProfessional}
  onSave={(data) => {
    console.log('📋 Paciente adicionado:', data);
  }}
/>
```

---

## 🎨 Componentes Visuais

### Máscaras de Entrada

#### Telefone
```javascript
<TextMaskPhone />
Formato: (00) 00000-0000
```

#### CPF
```javascript
<TextMaskCPF />
Formato: 000.000.000-00
```

### Chips para Múltipla Seleção

Usados em:
- Período preferido
- Dias da semana

```javascript
<Chip label="Manhã (8h-12h)" size="small" />
<Chip label="Segunda" size="small" />
```

### Alerts Dinâmicos

1. **Info** - Buscando paciente
2. **Warning** - Novo paciente será criado
3. **Info** - Explicação de funcionamento

---

## 🧪 Casos de Teste

### Teste 1: Buscar Paciente por Autocomplete
```
1. Abrir modal
2. Digitar nome no autocomplete
3. Selecionar paciente
✓ Campos preenchidos automaticamente
✓ Campos desabilitados
✓ Pode preencher preferências
✓ Salva com sucesso
```

### Teste 2: Buscar por CPF Existente
```
1. Abrir modal
2. Digitar CPF de paciente existente
3. Aguardar busca automática
✓ Toast "Paciente encontrado"
✓ Dados preenchidos
✓ Campos desabilitados
✓ Salva com sucesso
```

### Teste 3: Novo Paciente com CPF
```
1. Abrir modal
2. Digitar CPF não cadastrado
✓ Alert "Novo paciente será cadastrado"
3. Preencher nome e telefone
✓ CPF obrigatório (validação)
4. Salvar
✓ Cria paciente e adiciona à lista
```

### Teste 4: Novo Paciente sem CPF Inicial
```
1. Abrir modal
2. Preencher nome e telefone
3. Deixar CPF vazio
4. Tentar salvar
✓ Erro: "CPF é obrigatório para novo cadastro"
5. Preencher CPF
6. Salvar
✓ Sucesso
```

### Teste 5: Preferências Opcionais
```
1. Abrir modal
2. Selecionar paciente
3. Selecionar períodos: Manhã e Tarde
4. Selecionar dias: Segunda, Quarta, Sexta
5. Preencher procedimento
6. Adicionar observações
7. Salvar
✓ Todos os dados salvos corretamente
```

### Teste 6: Apenas Obrigatórios
```
1. Abrir modal
2. Selecionar paciente
3. Não preencher preferências
4. Salvar
✓ Salva apenas com nome e telefone
✓ Preferências ficam vazias/null
```

---

## 📊 Estrutura de Dados Salva

### Exemplo de Payload

```json
{
  "pacienteId": 123,
  "nome": "João Silva",
  "telefone": "11999887766",
  "cpf": "12345678900",
  "email": "joao@email.com",
  "profissionalId": "1",
  "procedimento": "Consulta de Rotina",
  "periodo": ["manha", "tarde"],
  "diasSemana": ["segunda", "quarta", "sexta"],
  "observacoes": "Paciente prefere horários após 10h",
  "criarPaciente": false,
  "status": "aguardando",
  "dataInclusao": "2025-10-13T14:30:00.000Z"
}
```

---

## 🚀 Próximos Passos (Backend)

### APIs a Implementar

1. **GET /api/lista-espera**
   - Listar pacientes na fila
   - Filtros por status, profissional, período

2. **POST /api/lista-espera**
   - Salvar novo registro
   - Criar paciente se necessário
   - Validar duplicação

3. **PUT /api/lista-espera/:id**
   - Atualizar status (aguardando → agendado → atendido)
   - Editar preferências

4. **DELETE /api/lista-espera/:id**
   - Remover da fila

5. **POST /api/lista-espera/:id/notificar**
   - Enviar notificação para paciente
   - WhatsApp/SMS/E-mail

---

## 📝 Melhorias Futuras

1. **Priorização**
   - Campo de prioridade (baixa, média, alta, urgente)
   - Ordenação automática por prioridade

2. **Tempo de Espera**
   - Cálculo automático de dias aguardando
   - Alertas para pacientes há muito tempo

3. **Match Automático**
   - Sugestão de horários disponíveis
   - Notificação automática quando vaga abre

4. **Histórico**
   - Quantas vezes paciente entrou na lista
   - Taxa de conversão lista → agendamento

5. **Relatórios**
   - Tempo médio de espera
   - Taxa de conversão
   - Horários mais procurados

---

## ✅ Status

**Implementado e Pronto para Uso**

- ✅ Componente ModalListaEspera criado
- ✅ Integração com AgendaLite
- ✅ Validações implementadas
- ✅ Busca de paciente funcional
- ✅ Máscaras de input configuradas
- ✅ Interface responsiva
- ⏳ Backend pendente (APIs)

---

## 📚 Arquivos Modificados

```
frontend/src/components/ModalListaEspera.js     [CRIADO]
frontend/src/pages/AgendaLite.js                [MODIFICADO]
```

---

*Feature implementada em 13 de Outubro de 2025*
