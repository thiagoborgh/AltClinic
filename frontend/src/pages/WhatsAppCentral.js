import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Badge,
  Chip,
  CircularProgress,
  Avatar,
  Divider,
  Tabs,
  Tab,
  Tooltip,
  Button,
  Paper,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AIIcon,
  Close as CloseIcon,
  WhatsApp as WhatsAppIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { io } from 'socket.io-client';
import apiClient from '../services/api';

// TAG color map
const TAG_COLORS = {
  agendamento: 'primary',
  cobranca: 'error',
  crm: 'secondary',
  duvida: 'warning',
  outro: 'default',
  bot: 'success',
};

const TAG_LABELS = {
  agendamento: 'Agendamento',
  cobranca: 'Cobrança',
  crm: 'CRM',
  duvida: 'Dúvida',
  outro: 'Outro',
  bot: 'Bot',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

const STATUS_FILTER_MAP = {
  0: null,       // Todas
  1: 'aberta',   // Abertas
  2: 'bot',      // Bot
  3: 'transferida', // Transferidas
};

export default function WhatsAppCentral() {
  const [conversas, setConversas] = useState([]);
  const [conversaSelecionada, setConversaSelecionada] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [sugerindo, setSugerindo] = useState(false);
  const [texto, setTexto] = useState('');
  const [busca, setBusca] = useState('');
  const [tabFiltro, setTabFiltro] = useState(0);
  const [loadingConversas, setLoadingConversas] = useState(true);
  const [loadingMensagens, setLoadingMensagens] = useState(false);
  const mensagensEndRef = useRef(null);
  const socketRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const tenantId = user.tenant_id;

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    mensagensEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [mensagens, scrollToBottom]);

  // Load conversations
  const carregarConversas = useCallback(async (statusFiltro) => {
    try {
      setLoadingConversas(true);
      const params = statusFiltro ? `status=${statusFiltro}&limit=50` : 'limit=50';
      const { data } = await apiClient.get(`/whatsapp/conversas?${params}`);
      setConversas(Array.isArray(data) ? data : data.conversas || []);
    } catch (err) {
      console.error('Erro ao carregar conversas:', err);
    } finally {
      setLoadingConversas(false);
    }
  }, []);

  useEffect(() => {
    const statusFiltro = STATUS_FILTER_MAP[tabFiltro];
    carregarConversas(statusFiltro);
  }, [tabFiltro, carregarConversas]);

  // Load messages for selected conversation
  const carregarMensagens = useCallback(async (conversaId) => {
    try {
      setLoadingMensagens(true);
      const { data } = await apiClient.get(`/whatsapp/conversas/${conversaId}/mensagens?limit=30`);
      setMensagens(Array.isArray(data) ? data : data.mensagens || []);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    } finally {
      setLoadingMensagens(false);
    }
  }, []);

  // Socket.io setup
  useEffect(() => {
    if (!tenantId) return;

    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', `tenant:${tenantId}`);
    });

    socket.on('nova_mensagem', ({ conversa_id, mensagem, conversa_preview }) => {
      // Update conversation list
      setConversas((prev) => {
        const idx = prev.findIndex((c) => c.id === conversa_id);
        if (idx === -1) {
          // New conversation not in list; append with preview if available
          if (conversa_preview) return [conversa_preview, ...prev];
          return prev;
        }
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          ultima_mensagem_pre: conversa_preview?.ultima_mensagem_pre || mensagem?.conteudo || updated[idx].ultima_mensagem_pre,
          atualizado_em: conversa_preview?.atualizado_em || new Date().toISOString(),
          nao_lidas: conversaSelecionada?.id === conversa_id
            ? 0
            : (updated[idx].nao_lidas || 0) + 1,
        };
        // Move to top
        const [item] = updated.splice(idx, 1);
        return [item, ...updated];
      });

      // If this is the active conversation, append message
      setConversaSelecionada((sel) => {
        if (sel && sel.id === conversa_id && mensagem) {
          setMensagens((prev) => {
            const alreadyExists = prev.some((m) => m.id === mensagem.id);
            if (alreadyExists) return prev;
            return [...prev, mensagem];
          });
        }
        return sel;
      });
    });

    socket.on('conversa_classificada', ({ conversa_id, tag }) => {
      setConversas((prev) =>
        prev.map((c) => (c.id === conversa_id ? { ...c, tag } : c))
      );
      setConversaSelecionada((sel) =>
        sel && sel.id === conversa_id ? { ...sel, tag } : sel
      );
    });

    socket.on('bot_transferencia', ({ conversa_id, numero, motivo }) => {
      setConversas((prev) =>
        prev.map((c) =>
          c.id === conversa_id ? { ...c, status: 'transferida', tag: 'bot' } : c
        )
      );
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const selecionarConversa = useCallback(
    (conversa) => {
      setConversaSelecionada(conversa);
      setTexto('');
      carregarMensagens(conversa.id);
      // Mark as read locally
      setConversas((prev) =>
        prev.map((c) => (c.id === conversa.id ? { ...c, nao_lidas: 0 } : c))
      );
    },
    [carregarMensagens]
  );

  const enviarMensagem = async () => {
    if (!texto.trim() || !conversaSelecionada || enviando) return;
    const textoEnvio = texto.trim();
    setTexto('');
    setEnviando(true);

    // Optimistic add
    const mensagemOtimista = {
      id: `tmp-${Date.now()}`,
      direcao: 'saida',
      tipo: 'texto',
      conteudo: textoEnvio,
      criado_em: new Date().toISOString(),
      origem: 'atendente',
    };
    setMensagens((prev) => [...prev, mensagemOtimista]);

    try {
      const { data } = await apiClient.post(
        `/whatsapp/conversas/${conversaSelecionada.id}/mensagens`,
        { texto: textoEnvio }
      );
      // Replace optimistic with real
      setMensagens((prev) =>
        prev.map((m) => (m.id === mensagemOtimista.id ? { ...mensagemOtimista, ...data } : m))
      );
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      // Remove optimistic on error
      setMensagens((prev) => prev.filter((m) => m.id !== mensagemOtimista.id));
      setTexto(textoEnvio);
    } finally {
      setEnviando(false);
    }
  };

  const sugerirResposta = async () => {
    if (!conversaSelecionada || sugerindo) return;
    setSugerindo(true);
    try {
      const { data } = await apiClient.post(
        `/whatsapp/conversas/${conversaSelecionada.id}/sugerir-resposta`
      );
      if (data.sugestao) {
        setTexto(data.sugestao);
      }
    } catch (err) {
      console.error('Erro ao sugerir resposta:', err);
    } finally {
      setSugerindo(false);
    }
  };

  const encerrarConversa = async () => {
    if (!conversaSelecionada) return;
    try {
      await apiClient.patch(`/whatsapp/conversas/${conversaSelecionada.id}/encerrar`);
      setConversas((prev) =>
        prev.map((c) =>
          c.id === conversaSelecionada.id ? { ...c, status: 'encerrada' } : c
        )
      );
      setConversaSelecionada((sel) =>
        sel ? { ...sel, status: 'encerrada' } : sel
      );
    } catch (err) {
      console.error('Erro ao encerrar conversa:', err);
    }
  };

  const conversasFiltradas = conversas.filter((c) => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return (
      (c.numero || '').includes(q) ||
      (c.paciente_nome || '').toLowerCase().includes(q) ||
      (c.ultima_mensagem_pre || '').toLowerCase().includes(q)
    );
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'aberta': return 'success';
      case 'encerrada': return 'default';
      case 'bot': return 'info';
      case 'transferida': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'aberta': return 'Aberta';
      case 'encerrada': return 'Encerrada';
      case 'bot': return 'Bot';
      case 'transferida': return 'Transferida';
      default: return status || '';
    }
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* LEFT PANEL — Conversation list */}
      <Box
        sx={{
          width: '30%',
          minWidth: 260,
          maxWidth: 380,
          display: 'flex',
          flexDirection: 'column',
          borderRight: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <WhatsAppIcon color="success" />
            <Typography variant="h6" fontWeight={600}>
              Central de Atendimento
            </Typography>
          </Box>

          {/* Search */}
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar conversa..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />,
            }}
          />
        </Box>

        {/* Filter tabs */}
        <Tabs
          value={tabFiltro}
          onChange={(_, v) => setTabFiltro(v)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 36 }}
          TabIndicatorProps={{ style: { height: 2 } }}
        >
          <Tab label="Todas" sx={{ minHeight: 36, fontSize: '0.75rem', py: 0 }} />
          <Tab label="Abertas" sx={{ minHeight: 36, fontSize: '0.75rem', py: 0 }} />
          <Tab label="Bot" sx={{ minHeight: 36, fontSize: '0.75rem', py: 0 }} />
          <Tab label="Transferidas" sx={{ minHeight: 36, fontSize: '0.75rem', py: 0 }} />
        </Tabs>

        {/* List */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {loadingConversas ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : conversasFiltradas.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary" variant="body2">
                Nenhuma conversa encontrada.
              </Typography>
            </Box>
          ) : (
            conversasFiltradas.map((conversa) => {
              const isSelected = conversaSelecionada?.id === conversa.id;
              return (
                <Box
                  key={conversa.id}
                  onClick={() => selecionarConversa(conversa)}
                  sx={{
                    px: 2,
                    py: 1.5,
                    cursor: 'pointer',
                    bgcolor: isSelected ? 'action.selected' : 'transparent',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { bgcolor: isSelected ? 'action.selected' : 'action.hover' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Badge
                      badgeContent={conversa.nao_lidas || 0}
                      color="error"
                      invisible={!conversa.nao_lidas}
                    >
                      <Avatar sx={{ width: 36, height: 36, bgcolor: 'success.main', fontSize: '0.875rem' }}>
                        {(conversa.paciente_nome || conversa.numero || '?')[0].toUpperCase()}
                      </Avatar>
                    </Badge>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                          variant="body2"
                          fontWeight={conversa.nao_lidas ? 700 : 500}
                          noWrap
                          sx={{ maxWidth: '65%' }}
                        >
                          {conversa.paciente_nome || 'Desconhecido'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {timeAgo(conversa.atualizado_em)}
                        </Typography>
                      </Box>

                      <Typography variant="caption" color="text.secondary" display="block">
                        {conversa.numero}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        display="block"
                        sx={{ mt: 0.25 }}
                      >
                        {conversa.ultima_mensagem_pre || ''}
                      </Typography>

                      {conversa.tag && (
                        <Chip
                          label={TAG_LABELS[conversa.tag] || conversa.tag}
                          color={TAG_COLORS[conversa.tag] || 'default'}
                          size="small"
                          sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      {/* RIGHT PANEL — Active conversation */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!conversaSelecionada ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              gap: 1,
            }}
          >
            <WhatsAppIcon sx={{ fontSize: 64, opacity: 0.3 }} />
            <Typography variant="h6" color="text.secondary">
              Selecione uma conversa
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Clique em uma conversa na lista à esquerda para começar.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Conversation header */}
            <Box
              sx={{
                px: 3,
                py: 1.5,
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                bgcolor: 'background.paper',
              }}
            >
              <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                {(conversaSelecionada.paciente_nome || conversaSelecionada.numero || '?')[0].toUpperCase()}
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {conversaSelecionada.paciente_nome || 'Desconhecido'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {conversaSelecionada.numero}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={getStatusLabel(conversaSelecionada.status)}
                  color={getStatusColor(conversaSelecionada.status)}
                  size="small"
                />

                {conversaSelecionada.tag && (
                  <Chip
                    label={TAG_LABELS[conversaSelecionada.tag] || conversaSelecionada.tag}
                    color={TAG_COLORS[conversaSelecionada.tag] || 'default'}
                    size="small"
                  />
                )}

                {conversaSelecionada.status !== 'encerrada' && (
                  <Tooltip title="Encerrar conversa">
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<CloseIcon />}
                      onClick={encerrarConversa}
                    >
                      Encerrar
                    </Button>
                  </Tooltip>
                )}
              </Box>
            </Box>

            {/* Messages area */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                px: 3,
                py: 2,
                bgcolor: '#f0f4f8',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              {loadingMensagens ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : mensagens.length === 0 ? (
                <Box sx={{ textAlign: 'center', pt: 4 }}>
                  <Typography color="text.secondary" variant="body2">
                    Nenhuma mensagem ainda.
                  </Typography>
                </Box>
              ) : (
                mensagens.map((msg) => {
                  if (msg.direcao === 'sistema') {
                    return (
                      <Box key={msg.id} sx={{ textAlign: 'center', my: 0.5 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontStyle="italic"
                          sx={{
                            bgcolor: 'rgba(0,0,0,0.06)',
                            px: 2,
                            py: 0.5,
                            borderRadius: 2,
                            display: 'inline-block',
                          }}
                        >
                          {msg.conteudo}
                        </Typography>
                      </Box>
                    );
                  }

                  const isSaida = msg.direcao === 'saida';
                  return (
                    <Box
                      key={msg.id}
                      sx={{
                        display: 'flex',
                        justifyContent: isSaida ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          px: 1.5,
                          py: 1,
                          maxWidth: '70%',
                          borderRadius: isSaida ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                          bgcolor: isSaida ? '#dcf8c6' : '#ffffff',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {msg.conteudo}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', textAlign: 'right', mt: 0.25, fontSize: '0.65rem' }}
                        >
                          {msg.criado_em ? new Date(msg.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                          {msg.origem === 'atendente' ? ' ✓✓' : ''}
                        </Typography>
                      </Paper>
                    </Box>
                  );
                })
              )}
              <div ref={mensagensEndRef} />
            </Box>

            {/* Footer — send form */}
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderTop: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              {/* AI suggestion button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  startIcon={sugerindo ? <CircularProgress size={14} /> : <AIIcon />}
                  onClick={sugerirResposta}
                  disabled={sugerindo || conversaSelecionada.status === 'encerrada'}
                >
                  {sugerindo ? 'Sugerindo...' : 'Sugerir IA'}
                </Button>
              </Box>

              {/* Text input + send */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  size="small"
                  placeholder={
                    conversaSelecionada.status === 'encerrada'
                      ? 'Conversa encerrada'
                      : 'Digite uma mensagem...'
                  }
                  value={texto}
                  disabled={conversaSelecionada.status === 'encerrada'}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      enviarMensagem();
                    }
                  }}
                />
                <IconButton
                  color="success"
                  onClick={enviarMensagem}
                  disabled={!texto.trim() || enviando || conversaSelecionada.status === 'encerrada'}
                  sx={{ mb: 0.25 }}
                >
                  {enviando ? <CircularProgress size={22} /> : <SendIcon />}
                </IconButton>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
