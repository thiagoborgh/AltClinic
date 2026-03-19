import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Tab, Tabs, Grid,
  TextField, Switch, FormControlLabel, Button, Alert,
  CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, FormGroup,
  Checkbox, Tooltip, Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SupportAgent as SupportAgentIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import apiClient from '../../services/api';

// ─── API helpers ──────────────────────────────────────────────────────────────

const botApi = {
  getConfig:  ()         => apiClient.get('/whatsapp/bot/config').then(r => r.data),
  saveConfig: (data)     => apiClient.put('/whatsapp/bot/config', data).then(r => r.data),
  listFaq:    ()         => apiClient.get('/whatsapp/bot/faq?ativo=todos').then(r => r.data),
  createFaq:  (data)     => apiClient.post('/whatsapp/bot/faq', data).then(r => r.data),
  updateFaq:  (id, data) => apiClient.put(`/whatsapp/bot/faq/${id}`, data).then(r => r.data),
  deleteFaq:  (id)       => apiClient.delete(`/whatsapp/bot/faq/${id}`).then(r => r.data),
  listSessoes:()         => apiClient.get('/whatsapp/bot/sessoes').then(r => r.data),
  transferir: (id)       => apiClient.post(`/whatsapp/bot/sessoes/${id}/transferir`).then(r => r.data),
};

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const ESTADO_LABEL = {
  inicial:                    { label: 'Inicial',          color: 'default' },
  menu_principal:             { label: 'Menu',             color: 'primary' },
  agendamento_especialidade:  { label: 'Especialidade',    color: 'info' },
  agendamento_profissional:   { label: 'Profissional',     color: 'info' },
  agendamento_periodo:        { label: 'Período',          color: 'info' },
  agendamento_horario:        { label: 'Horário',          color: 'info' },
  agendamento_dados_nome:     { label: 'Coletando nome',   color: 'warning' },
  agendamento_dados_cpf:      { label: 'Coletando CPF',    color: 'warning' },
  agendamento_confirmacao:    { label: 'Confirmação',      color: 'warning' },
  cancelamento_busca:         { label: 'Cancelamento',     color: 'warning' },
  cancelamento_confirmacao:   { label: 'Conf. cancelar',   color: 'warning' },
  faq_respondido:             { label: 'FAQ',              color: 'success' },
  transferido_humano:         { label: 'Transferido',      color: 'error' },
  encerrado:                  { label: 'Encerrado',        color: 'default' },
};

// ─── Aba Configuração ─────────────────────────────────────────────────────────

function TabConfiguracao() {
  const [config, setConfig] = useState({
    ativo: false, nome_bot: 'Assistente',
    horario_inicio: '07:00', horario_fim: '22:00',
    dias_semana: [1, 2, 3, 4, 5, 6],
    sla_inatividade: 30, max_tentativas: 3,
    mensagens: { saudacao: '', menu_principal: '', transferencia: '', nao_entendeu: '' },
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    botApi.getConfig()
      .then(data => {
        setConfig(prev => ({
          ...prev, ...data,
          mensagens: { saudacao: '', menu_principal: '', transferencia: '', nao_entendeu: '', ...(data.mensagens || {}) },
          dias_semana: Array.isArray(data.dias_semana) ? data.dias_semana : [1,2,3,4,5,6],
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleDia = (dia) => {
    setConfig(prev => ({
      ...prev,
      dias_semana: prev.dias_semana.includes(dia)
        ? prev.dias_semana.filter(d => d !== dia)
        : [...prev.dias_semana, dia].sort(),
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true); setError(null); setSuccess(false);
      await botApi.saveConfig(config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      {success && <Alert severity="success" sx={{ mb: 2 }}>Configuração salva!</Alert>}
      {error   && <Alert severity="error"   sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Ativar bot */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={config.ativo}
                onChange={e => setConfig(p => ({ ...p, ativo: e.target.checked }))}
                color="success"
              />
            }
            label={<Typography variant="subtitle1" fontWeight="bold">Bot de agendamento {config.ativo ? 'ativo' : 'inativo'}</Typography>}
          />
          {config.ativo && (
            <Alert severity="success" sx={{ mt: 1 }}>
              Bot respondendo automaticamente fora do horário de atendimento humano
            </Alert>
          )}
        </Grid>

        {/* Nome e horário */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth label="Nome do bot"
            value={config.nome_bot}
            onChange={e => setConfig(p => ({ ...p, nome_bot: e.target.value }))}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth label="Horário início" type="time"
            value={config.horario_inicio}
            onChange={e => setConfig(p => ({ ...p, horario_inicio: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth label="Horário fim" type="time"
            value={config.horario_fim}
            onChange={e => setConfig(p => ({ ...p, horario_fim: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Dias da semana */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>Dias de atendimento</Typography>
          <FormGroup row>
            {DIAS.map((dia, idx) => (
              <FormControlLabel
                key={idx}
                control={
                  <Checkbox
                    checked={config.dias_semana.includes(idx)}
                    onChange={() => toggleDia(idx)}
                  />
                }
                label={dia}
              />
            ))}
          </FormGroup>
        </Grid>

        {/* SLA e tentativas */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth label="Inatividade para encerrar sessão (min)"
            type="number" inputProps={{ min: 5, max: 120 }}
            value={config.sla_inatividade}
            onChange={e => setConfig(p => ({ ...p, sla_inatividade: parseInt(e.target.value) || 30 }))}
            helperText="Sessão encerrada automaticamente após este tempo sem resposta"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth label="Máx. tentativas antes de transferir"
            type="number" inputProps={{ min: 1, max: 10 }}
            value={config.max_tentativas}
            onChange={e => setConfig(p => ({ ...p, max_tentativas: parseInt(e.target.value) || 3 }))}
            helperText="Após N erros seguidos, transfere para atendente humano"
          />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" gutterBottom>Mensagens personalizadas (deixe em branco para usar o padrão)</Typography>
        </Grid>

        {/* Mensagens */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth multiline rows={3} label="Saudação inicial"
            placeholder={`Olá! Sou ${config.nome_bot}, assistente virtual da clínica. Como posso ajudar?`}
            value={config.mensagens.saudacao}
            onChange={e => setConfig(p => ({ ...p, mensagens: { ...p.mensagens, saudacao: e.target.value } }))}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth multiline rows={3} label="Menu principal"
            placeholder={'1️⃣ Agendar consulta\n2️⃣ Ver/Cancelar agendamento\n3️⃣ Procedimentos e valores\n4️⃣ Horários e endereço\n5️⃣ Falar com atendente'}
            value={config.mensagens.menu_principal}
            onChange={e => setConfig(p => ({ ...p, mensagens: { ...p.mensagens, menu_principal: e.target.value } }))}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth multiline rows={2} label="Mensagem ao transferir para humano"
            placeholder="Transferindo para um atendente. Em breve você será atendido! 👋"
            value={config.mensagens.transferencia}
            onChange={e => setConfig(p => ({ ...p, mensagens: { ...p.mensagens, transferencia: e.target.value } }))}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth multiline rows={2} label="Mensagem quando não entende"
            placeholder="Desculpe, não entendi. Gostaria de falar com um atendente? (SIM/NÃO)"
            value={config.mensagens.nao_entendeu}
            onChange={e => setConfig(p => ({ ...p, mensagens: { ...p.mensagens, nao_entendeu: e.target.value } }))}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained" startIcon={<SaveIcon />}
            onClick={handleSave} disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar configuração'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}

// ─── Aba FAQ ──────────────────────────────────────────────────────────────────

const FAQ_VAZIO = { pergunta: '', resposta: '', palavras_chave: '', categoria: '', ativo: true };

function TabFaq() {
  const [faqs, setFaqs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [dialog, setDialog]     = useState(null); // null | { mode: 'create'|'edit', data: {} }

  const load = useCallback(() => {
    setLoading(true);
    botApi.listFaq()
      .then(setFaqs)
      .catch(() => setError('Erro ao carregar FAQ'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    try {
      const payload = {
        ...data,
        palavras_chave: data.palavras_chave
          ? data.palavras_chave.split(',').map(p => p.trim().toLowerCase()).filter(Boolean)
          : [],
      };
      if (dialog.mode === 'create') await botApi.createFaq(payload);
      else                          await botApi.updateFaq(dialog.data.id, payload);
      setDialog(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar FAQ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Desativar este FAQ?')) return;
    try { await botApi.deleteFaq(id); load(); }
    catch { setError('Erro ao desativar FAQ'); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1">
          {faqs.filter(f => f.ativo).length} FAQ(s) ativo(s)
        </Typography>
        <Button
          variant="contained" startIcon={<AddIcon />}
          onClick={() => setDialog({ mode: 'create', data: { ...FAQ_VAZIO } })}
        >
          Novo FAQ
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Pergunta</TableCell>
              <TableCell>Resposta (preview)</TableCell>
              <TableCell>Palavras-chave</TableCell>
              <TableCell>Uso</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {faqs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Nenhum FAQ cadastrado. Clique em "Novo FAQ" para adicionar.
                </TableCell>
              </TableRow>
            ) : faqs.map(faq => (
              <TableRow key={faq.id} sx={{ opacity: faq.ativo ? 1 : 0.5 }}>
                <TableCell sx={{ maxWidth: 200 }}>
                  <Typography variant="body2" noWrap>{faq.pergunta}</Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 250 }}>
                  <Typography variant="body2" noWrap color="text.secondary">
                    {faq.resposta?.slice(0, 80)}{faq.resposta?.length > 80 ? '…' : ''}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(Array.isArray(faq.palavras_chave) ? faq.palavras_chave : []).slice(0, 4).map(p => (
                      <Chip key={p} label={p} size="small" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>{faq.uso_count}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={faq.ativo ? 'Ativo' : 'Inativo'}
                    color={faq.ativo ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => setDialog({
                      mode: 'edit',
                      data: {
                        ...faq,
                        palavras_chave: Array.isArray(faq.palavras_chave)
                          ? faq.palavras_chave.join(', ')
                          : faq.palavras_chave,
                      },
                    })}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {faq.ativo && (
                    <Tooltip title="Desativar">
                      <IconButton size="small" color="error" onClick={() => handleDelete(faq.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {dialog && (
        <FaqDialog
          mode={dialog.mode}
          data={dialog.data}
          onClose={() => setDialog(null)}
          onSave={handleSave}
        />
      )}
    </Box>
  );
}

function FaqDialog({ mode, data, onClose, onSave }) {
  const [form, setForm] = useState(data);

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{mode === 'create' ? 'Novo FAQ' : 'Editar FAQ'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth label="Pergunta (título canônico)"
              value={form.pergunta}
              onChange={e => setForm(p => ({ ...p, pergunta: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth multiline rows={4} label="Resposta"
              value={form.resposta}
              onChange={e => setForm(p => ({ ...p, resposta: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth label="Palavras-chave (separadas por vírgula)"
              placeholder="horario, funcionamento, atendimento, abre"
              value={form.palavras_chave}
              onChange={e => setForm(p => ({ ...p, palavras_chave: e.target.value }))}
              helperText="Mín. 2 palavras devem estar na mensagem para acionar este FAQ"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth label="Categoria (opcional)"
              placeholder="horarios, procedimentos, convenios"
              value={form.categoria || ''}
              onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
            />
          </Grid>
          {mode === 'edit' && (
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.ativo}
                    onChange={e => setForm(p => ({ ...p, ativo: e.target.checked }))}
                  />
                }
                label="Ativo"
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={() => onSave(form)}
          disabled={!form.pergunta || !form.resposta}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Aba Sessões ──────────────────────────────────────────────────────────────

function TabSessoes() {
  const [sessoes, setSessoes]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    botApi.listSessoes()
      .then(setSessoes)
      .catch(() => setError('Erro ao carregar sessões'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTransferir = async (id) => {
    if (!window.confirm('Transferir sessão para atendente humano?')) return;
    try {
      await botApi.transferir(id);
      load();
    } catch {
      setError('Erro ao transferir sessão');
    }
  };

  const minutosAtras = (dt) => {
    const mins = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
    if (mins < 1)  return 'agora';
    if (mins < 60) return `${mins}min atrás`;
    return `${Math.floor(mins / 60)}h atrás`;
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">
          {sessoes.filter(s => !['encerrado','transferido_humano'].includes(s.estado)).length} sessão(ões) ativa(s)
        </Typography>
        <IconButton onClick={load} size="small"><RefreshIcon /></IconButton>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Paciente</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Última interação</TableCell>
              <TableCell>Tentativas falha</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Nenhuma sessão ativa no momento.
                </TableCell>
              </TableRow>
            ) : sessoes.map(s => {
              const estadoInfo = ESTADO_LABEL[s.estado] || { label: s.estado, color: 'default' };
              return (
                <TableRow key={s.id}>
                  <TableCell>{s.numero}</TableCell>
                  <TableCell>{s.paciente_nome || <em style={{ color: '#999' }}>não identificado</em>}</TableCell>
                  <TableCell>
                    <Chip size="small" label={estadoInfo.label} color={estadoInfo.color} />
                  </TableCell>
                  <TableCell>{minutosAtras(s.ultima_interacao)}</TableCell>
                  <TableCell>
                    {s.tentativas_falha > 0 && (
                      <Chip size="small" label={s.tentativas_falha} color="warning" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {!['transferido_humano', 'encerrado'].includes(s.estado) && (
                      <Tooltip title="Transferir para atendente humano">
                        <IconButton
                          size="small" color="warning"
                          onClick={() => handleTransferir(s.id)}
                        >
                          <SupportAgentIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function WhatsAppBot() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="h6">🤖 Bot de Agendamento Automático</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure o bot para responder automaticamente fora do horário de atendimento,
        agendar consultas e responder dúvidas frequentes sem intervenção humana.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Configuração" />
        <Tab label="FAQ / Base de conhecimento" />
        <Tab label="Sessões ativas" />
      </Tabs>

      <TabPanel value={tab} index={0}><TabConfiguracao /></TabPanel>
      <TabPanel value={tab} index={1}><TabFaq /></TabPanel>
      <TabPanel value={tab} index={2}><TabSessoes /></TabPanel>
    </Box>
  );
}
