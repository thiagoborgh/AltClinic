# Especificações Técnicas - Módulo CRM

## 🗄️ Estrutura de Banco de Dados

### Tabelas Principais

#### **1. crm_pacientes**

```sql
CREATE TABLE crm_pacientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefone VARCHAR(20),
    data_nascimento DATE,
    genero VARCHAR(10),
    profissao VARCHAR(50),
    endereco TEXT,
    cep VARCHAR(10),
    cidade VARCHAR(50),
    estado VARCHAR(2),
    cpf VARCHAR(14),
    rg VARCHAR(20),
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultima_consulta DATETIME,
    status VARCHAR(20) DEFAULT 'ativo', -- ativo, inativo, perdido
    opt_in_marketing BOOLEAN DEFAULT false,
    valor_total_gasto DECIMAL(10,2) DEFAULT 0,
    numero_consultas INTEGER DEFAULT 0,
    observacoes TEXT,
    tags TEXT, -- JSON array de tags
    segmento_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (segmento_id) REFERENCES crm_segmentos(id)
);
```

#### **2. crm_segmentos**

```sql
CREATE TABLE crm_segmentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(50) NOT NULL,
    descricao TEXT,
    criterios TEXT, -- JSON com critérios de segmentação
    tipo VARCHAR(20) DEFAULT 'manual', -- manual, automatico
    cor VARCHAR(7) DEFAULT '#2196F3',
    ativo BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### **3. crm_templates**

```sql
CREATE TABLE crm_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100) NOT NULL,
    assunto VARCHAR(200),
    conteudo TEXT NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- whatsapp, email, sms
    categoria VARCHAR(30), -- confirmacao, lembrete, pos_atendimento, reativacao
    placeholders TEXT, -- JSON array de placeholders disponíveis
    ativo BOOLEAN DEFAULT true,
    uso_ia BOOLEAN DEFAULT false,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### **4. crm_mensagens**

```sql
CREATE TABLE crm_mensagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL,
    template_id INTEGER,
    tipo VARCHAR(20) NOT NULL, -- whatsapp, email, sms
    assunto VARCHAR(200),
    conteudo TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente', -- pendente, enviado, entregue, lido, erro
    agendado_para DATETIME,
    enviado_em DATETIME,
    entregue_em DATETIME,
    lido_em DATETIME,
    respondido_em DATETIME,
    resposta TEXT,
    tentativas INTEGER DEFAULT 0,
    erro_detalhes TEXT,
    origem VARCHAR(20) DEFAULT 'manual', -- manual, automatico
    campanha_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES crm_pacientes(id),
    FOREIGN KEY (template_id) REFERENCES crm_templates(id),
    FOREIGN KEY (campanha_id) REFERENCES crm_campanhas(id)
);
```

#### **5. crm_campanhas**

```sql
CREATE TABLE crm_campanhas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(30), -- aniversario, reativacao, promocional, pos_atendimento
    status VARCHAR(20) DEFAULT 'rascunho', -- rascunho, agendada, executando, finalizada
    segmento_id INTEGER,
    template_id INTEGER,
    data_inicio DATETIME,
    data_fim DATETIME,
    total_destinatarios INTEGER DEFAULT 0,
    total_enviadas INTEGER DEFAULT 0,
    total_entregues INTEGER DEFAULT 0,
    total_lidas INTEGER DEFAULT 0,
    total_respostas INTEGER DEFAULT 0,
    taxa_abertura DECIMAL(5,2) DEFAULT 0,
    taxa_resposta DECIMAL(5,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (segmento_id) REFERENCES crm_segmentos(id),
    FOREIGN KEY (template_id) REFERENCES crm_templates(id)
);
```

#### **6. crm_interacoes**

```sql
CREATE TABLE crm_interacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL,
    tipo VARCHAR(30) NOT NULL, -- consulta, mensagem, ligacao, email
    descricao TEXT,
    data_interacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    origem VARCHAR(20), -- sistema, manual, automatico
    detalhes TEXT, -- JSON com detalhes específicos
    funcionario_id INTEGER,
    FOREIGN KEY (paciente_id) REFERENCES crm_pacientes(id)
);
```

#### **7. crm_automacoes**

```sql
CREATE TABLE crm_automacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    trigger_evento VARCHAR(50) NOT NULL, -- nova_consulta, consulta_cancelada, inatividade
    trigger_condicoes TEXT, -- JSON com condições
    acao_tipo VARCHAR(30) NOT NULL, -- enviar_mensagem, criar_tarefa, adicionar_tag
    acao_parametros TEXT, -- JSON com parâmetros da ação
    template_id INTEGER,
    ativo BOOLEAN DEFAULT true,
    delay_horas INTEGER DEFAULT 0,
    execucoes INTEGER DEFAULT 0,
    ultima_execucao DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES crm_templates(id)
);
```

---

## 🔗 APIs Backend

### **1. Rotas de Pacientes**

#### `GET /api/crm/pacientes`

```javascript
// Parâmetros de query
{
  page: 1,
  limit: 50,
  search: "nome do paciente",
  status: "ativo|inativo|perdido",
  segmento: "id_do_segmento",
  orderBy: "nome|ultima_consulta|valor_total",
  order: "asc|desc"
}

// Resposta
{
  data: [
    {
      id: 1,
      nome: "João Silva",
      email: "joao@email.com",
      telefone: "(11) 99999-9999",
      status: "ativo",
      ultima_consulta: "2024-01-15T10:30:00Z",
      valor_total_gasto: 1500.00,
      numero_consultas: 5,
      tags: ["VIP", "Botox"],
      segmento: {
        id: 1,
        nome: "Alto Valor",
        cor: "#4CAF50"
      }
    }
  ],
  pagination: {
    page: 1,
    limit: 50,
    total: 150,
    pages: 3
  }
}
```

#### `POST /api/crm/pacientes/:id/mensagem`

```javascript
// Body
{
  template_id: 1,
  conteudo_personalizado: "Olá {nome}, sua consulta...",
  tipo: "whatsapp",
  agendar_para: "2024-01-20T14:00:00Z" // opcional
}

// Resposta
{
  success: true,
  mensagem_id: 123,
  agendada: true,
  previsao_envio: "2024-01-20T14:00:00Z"
}
```

### **2. Rotas de Mensagens**

#### `GET /api/crm/mensagens`

```javascript
// Parâmetros
{
  paciente_id: 1,
  status: "enviado|entregue|lido",
  tipo: "whatsapp|email|sms",
  data_inicio: "2024-01-01",
  data_fim: "2024-01-31"
}

// Resposta
{
  data: [
    {
      id: 1,
      paciente: {
        id: 1,
        nome: "João Silva"
      },
      template: {
        id: 1,
        nome: "Confirmação de Consulta"
      },
      conteudo: "Olá João, sua consulta está confirmada...",
      status: "lido",
      enviado_em: "2024-01-15T09:00:00Z",
      lido_em: "2024-01-15T09:05:00Z",
      resposta: "Obrigado, estarei lá!"
    }
  ]
}
```

### **3. Rotas de Relatórios**

#### `GET /api/crm/relatorios/ativacao`

```javascript
// Resposta
{
  pacientes_inativos: [
    {
      id: 1,
      nome: "Maria Santos",
      ultima_consulta: "2023-10-15T10:30:00Z",
      dias_inativo: 95,
      valor_historico: 2300.00,
      propensao_retorno: 0.75, // Score IA
      sugestao_abordagem: "Oferta de desconto 20%",
      procedimentos_favoritos: ["Limpeza", "Botox"]
    }
  ],
  metricas: {
    total_inativos: 25,
    potencial_receita_perdida: 15000.00,
    taxa_reativacao_esperada: 0.30
  }
}
```

#### `GET /api/crm/relatorios/engajamento`

```javascript
// Resposta
{
  periodo: {
    inicio: "2024-01-01",
    fim: "2024-01-31"
  },
  metricas_gerais: {
    mensagens_enviadas: 450,
    taxa_entrega: 0.95,
    taxa_abertura: 0.72,
    taxa_resposta: 0.38,
    conversoes: 25
  },
  por_canal: {
    whatsapp: { enviadas: 300, abertura: 0.80, resposta: 0.45 },
    email: { enviadas: 120, abertura: 0.55, resposta: 0.20 },
    sms: { enviadas: 30, abertura: 0.90, resposta: 0.25 }
  },
  tendencia_mensal: [
    { mes: "2024-01", abertura: 0.68, resposta: 0.35 },
    { mes: "2024-02", abertura: 0.72, resposta: 0.38 }
  ]
}
```

---

## 🎨 Componentes Frontend

### **1. CRMDashboard.js**

```javascript
const CRMDashboard = () => {
  const { metrics, loading } = useCRMMetrics();

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        CRM Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Cards de Métricas */}
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Pacientes Ativos"
            value={metrics.pacientes_ativos}
            change={metrics.change_pacientes_ativos}
            icon={<People />}
            color="primary"
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <MetricCard
            title="Taxa de Engajamento"
            value={`${metrics.taxa_engajamento}%`}
            change={metrics.change_engajamento}
            icon={<TrendingUp />}
            color="success"
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <MetricCard
            title="Mensagens Enviadas"
            value={metrics.mensagens_mes}
            change={metrics.change_mensagens}
            icon={<Message />}
            color="info"
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <MetricCard
            title="Pacientes Inativos"
            value={metrics.pacientes_inativos}
            change={metrics.change_inativos}
            icon={<PersonOff />}
            color="warning"
          />
        </Grid>

        {/* Gráficos */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Engajamento por Canal
            </Typography>
            <EngagementChart data={metrics.engajamento_por_canal} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Ações Rápidas
            </Typography>
            <QuickActions />
          </Paper>
        </Grid>

        {/* Alerts e Notificações */}
        <Grid item xs={12}>
          <AlertsPanel alerts={metrics.alerts} />
        </Grid>
      </Grid>
    </Container>
  );
};
```

### **2. PacientesList.js**

```javascript
const PacientesList = () => {
  const [filters, setFilters] = useState({
    search: "",
    status: "todos",
    segmento: "",
    orderBy: "nome",
  });

  const { pacientes, loading, pagination } = usePacientes(filters);

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5">Pacientes</Typography>
        <Button variant="contained" startIcon={<Add />}>
          Novo Paciente
        </Button>
      </Box>

      {/* Filtros */}
      <PacienteFilters filters={filters} onChange={setFilters} />

      {/* Tabela */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Última Consulta</TableCell>
              <TableCell>Valor Gasto</TableCell>
              <TableCell>Segmento</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pacientes.map((paciente) => (
              <TableRow key={paciente.id}>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar sx={{ mr: 2 }}>{paciente.nome.charAt(0)}</Avatar>
                    <Box>
                      <Typography variant="body2">{paciente.nome}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {paciente.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <StatusChip status={paciente.status} />
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(paciente.ultima_consulta))}
                </TableCell>
                <TableCell>
                  {formatCurrency(paciente.valor_total_gasto)}
                </TableCell>
                <TableCell>
                  <Chip
                    label={paciente.segmento?.nome || "Sem segmento"}
                    size="small"
                    style={{ backgroundColor: paciente.segmento?.cor }}
                  />
                </TableCell>
                <TableCell>
                  <PacienteActions paciente={paciente} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginação */}
      <Pagination
        count={pagination.pages}
        page={pagination.page}
        onChange={handlePageChange}
      />
    </Paper>
  );
};
```

### **3. MessageComposer.js**

```javascript
const MessageComposer = ({ destinatarios = [], onSend, onClose }) => {
  const [template, setTemplate] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [tipo, setTipo] = useState("whatsapp");
  const [agendarPara, setAgendarPara] = useState(null);

  const { templates } = useTemplates(tipo);

  const handleTemplateChange = (templateId) => {
    const selectedTemplate = templates.find((t) => t.id === templateId);
    if (selectedTemplate) {
      setConteudo(selectedTemplate.conteudo);
    }
  };

  const handleSend = () => {
    const mensagem = {
      destinatarios: destinatarios.map((p) => p.id),
      template_id: template,
      conteudo,
      tipo,
      agendado_para: agendarPara,
    };

    onSend(mensagem);
  };

  return (
    <Dialog open maxWidth="md" fullWidth>
      <DialogTitle>
        Enviar Mensagem
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Mensagem</InputLabel>
              <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <MenuItem value="whatsapp">WhatsApp</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="sms">SMS</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Template</InputLabel>
              <Select
                value={template}
                onChange={(e) => handleTemplateChange(e.target.value)}
              >
                <MenuItem value="">Mensagem customizada</MenuItem>
                {templates.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Conteúdo da Mensagem"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Digite sua mensagem..."
            />
            <Typography variant="caption" color="textSecondary">
              Placeholders disponíveis: {nome}, {data_consulta}, {procedimento}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Agendar para (opcional)"
                value={agendarPara}
                onChange={setAgendarPara}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Destinatários ({destinatarios.length})
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {destinatarios.map((p) => (
                  <Chip
                    key={p.id}
                    label={p.nome}
                    size="small"
                    onDelete={() => removeDestinatario(p.id)}
                  />
                ))}
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <MessagePreview
              conteudo={conteudo}
              tipo={tipo}
              destinatario={destinatarios[0]}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={!conteudo || destinatarios.length === 0}
        >
          {agendarPara ? "Agendar Envio" : "Enviar Agora"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

---

## 🔄 Hooks Customizados

### **useCRM.js**

```javascript
export const useCRM = () => {
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await crmAPI.getMetrics();
      setMetrics(response.data);
    } catch (error) {
      console.error("Erro ao carregar métricas:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, refetch: fetchMetrics };
};
```

### **usePacientes.js**

```javascript
export const usePacientes = (filters = {}) => {
  const [pacientes, setPacientes] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchPacientes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await crmAPI.getPacientes(filters);
      setPacientes(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]);

  const sendMessage = async (pacienteId, mensagem) => {
    try {
      await crmAPI.sendMessage(pacienteId, mensagem);
      toast.success("Mensagem enviada com sucesso!");
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
    }
  };

  return {
    pacientes,
    pagination,
    loading,
    refetch: fetchPacientes,
    sendMessage,
  };
};
```

---

Esta documentação técnica fornece a base completa para implementação do módulo CRM. Quer que comecemos a implementar alguma parte específica? 🚀
