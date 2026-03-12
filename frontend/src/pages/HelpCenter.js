/**
 * Central de Ajuda — AltClinic
 * Issue #30
 */
import React, { useState } from 'react';
import {
  Box, Container, Typography, TextField, InputAdornment,
  Accordion, AccordionSummary, AccordionDetails, Grid, Card,
  CardContent, CardActionArea, Button, Chip
} from '@mui/material';
import { Search, ExpandMore, WhatsApp, CalendarToday, Person, BarChart, Settings, CreditCard } from '@mui/icons-material';

const CATEGORIAS = [
  { icon: <CalendarToday color="primary" />, label: 'Agendamentos',  key: 'agenda' },
  { icon: <WhatsApp sx={{ color: '#25D366' }} />, label: 'WhatsApp',  key: 'whatsapp' },
  { icon: <Person color="secondary" />,     label: 'Pacientes',      key: 'pacientes' },
  { icon: <BarChart color="warning" />,     label: 'Relatórios',     key: 'relatorios' },
  { icon: <Settings color="action" />,      label: 'Configurações',  key: 'config' },
  { icon: <CreditCard color="error" />,     label: 'Planos e cobrança', key: 'billing' },
];

const ARTIGOS = [
  {
    categoria: 'agenda',
    titulo: 'Como criar um agendamento',
    conteudo: `1. Acesse a tela de Agenda no menu lateral.\n2. Clique em um horário vazio na grade ou no botão "Novo agendamento".\n3. Preencha os dados: paciente, médico, data, horário e tipo de consulta.\n4. Clique em Salvar. O paciente receberá uma confirmação automática via WhatsApp (se configurado).`,
  },
  {
    categoria: 'agenda',
    titulo: 'Como confirmar presença de um paciente',
    conteudo: `O sistema envia automaticamente uma mensagem de confirmação 2 dias antes (D-2) e 1 dia antes (D-1) da consulta.\n\nO status do agendamento muda para:\n• ⏳ Aguardando confirmação\n• ✅ Confirmado (quando o paciente responde SIM)\n• ❌ Cancelado (quando responde NÃO)\n\nVocê também pode confirmar manualmente clicando no agendamento → Confirmar presença.`,
  },
  {
    categoria: 'whatsapp',
    titulo: 'Como conectar o WhatsApp',
    conteudo: `1. Acesse Configurações → WhatsApp.\n2. Clique em "Gerar QR Code".\n3. Abra o WhatsApp no celular → toque no ícone ⋮ (3 pontos) → Aparelhos conectados → Conectar aparelho.\n4. Escaneie o QR Code exibido na tela.\n5. Aguarde a confirmação de conexão (pode levar até 30 segundos).\n\n⚠️ Mantenha o celular conectado à internet para o WhatsApp funcionar.`,
  },
  {
    categoria: 'whatsapp',
    titulo: 'Como configurar mensagens automáticas',
    conteudo: `Acesse Configurações → Automações WhatsApp.\n\nVocê pode personalizar:\n• 📅 Confirmação de consulta (D-2 e D-1)\n• 🔄 Lembrete de retorno\n• 🎂 Mensagem de aniversário\n• ⭐ Pesquisa NPS pós-consulta\n\nPara cada automação, edite o template de mensagem usando as variáveis: {nome}, {data}, {hora}, {medico}, {clinica}.`,
  },
  {
    categoria: 'pacientes',
    titulo: 'Como cadastrar um paciente',
    conteudo: `1. Acesse Pacientes → Novo paciente.\n2. Preencha: nome completo, telefone (com DDD) e data de nascimento.\n3. Os campos CPF, email e endereço são opcionais.\n4. Clique em Salvar.\n\n💡 O telefone deve estar no formato (11) 99999-9999 para o WhatsApp funcionar corretamente.`,
  },
  {
    categoria: 'pacientes',
    titulo: 'Como preencher o prontuário eletrônico',
    conteudo: `1. Acesse o cadastro do paciente → aba Prontuário.\n2. Clique em "Novo atendimento".\n3. Preencha: queixa principal, anamnese, exame físico, diagnóstico (CID-10) e conduta.\n4. Clique em Salvar rascunho para editar depois ou Assinar para finalizar.\n\n⚠️ Prontuários assinados não podem ser editados (exigência CFM 1821/2007).`,
  },
  {
    categoria: 'relatorios',
    titulo: 'Como ver os relatórios financeiros',
    conteudo: `Acesse Financeiro no menu lateral.\n\nDisponíveis:\n• 💰 Receita por período\n• 👨‍⚕️ Produção por médico\n• 📊 Tipos de consulta mais realizados\n• 📉 Taxa de no-show\n\nUse os filtros de data para selecionar o período desejado. Clique em Exportar para baixar em CSV.`,
  },
  {
    categoria: 'config',
    titulo: 'Como adicionar um novo médico',
    conteudo: `1. Acesse Configurações → Equipe.\n2. Clique em "Adicionar médico".\n3. Preencha nome, CRM, especialidade e email.\n4. O médico receberá um email com os dados de acesso.\n\n⚠️ O número de médicos é limitado pelo seu plano. Plano Starter: 1 médico. Plano Pro: até 5. Enterprise: ilimitado.`,
  },
  {
    categoria: 'billing',
    titulo: 'Como fazer upgrade de plano',
    conteudo: `1. Acesse Configurações → Plano e cobrança.\n2. Clique em "Fazer upgrade".\n3. Escolha o novo plano.\n4. Realize o pagamento via Pix, boleto ou cartão.\n5. O upgrade é ativado automaticamente após a confirmação do pagamento (geralmente em minutos).`,
  },
  {
    categoria: 'billing',
    titulo: 'Meu trial expirou — o que acontece com meus dados?',
    conteudo: `Quando o trial de 14 dias expira:\n• Seu acesso ao sistema é suspenso temporariamente.\n• Seus dados ficam preservados por 30 dias.\n• Para reativar, escolha um plano em Configurações → Plano e cobrança.\n\nSe não reativar em 30 dias, os dados são removidos permanentemente. Recomendamos exportar seus dados antes do vencimento.`,
  },
];

export default function HelpCenter() {
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);
  const [expandido, setExpandido] = useState(false);

  const artigosFiltrados = ARTIGOS.filter(a => {
    const matchBusca = !busca || a.titulo.toLowerCase().includes(busca.toLowerCase()) || a.conteudo.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = !categoriaAtiva || a.categoria === categoriaAtiva;
    return matchBusca && matchCategoria;
  });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'primary.main', py: { xs: 6, md: 8 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight={800} color="#fff" gutterBottom>
            Central de Ajuda
          </Typography>
          <Typography color="rgba(255,255,255,0.8)" sx={{ mb: 4 }}>
            Como podemos ajudar você hoje?
          </Typography>
          <TextField
            fullWidth value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar artigos... Ex: como agendar, WhatsApp, prontuário"
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary' }} /></InputAdornment>,
              sx: { bgcolor: '#fff', borderRadius: 3, '& fieldset': { border: 'none' } }
            }}
          />
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 6 }}>
        {/* Categorias */}
        {!busca && (
          <Box sx={{ mb: 5 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Categorias</Typography>
            <Grid container spacing={2}>
              {CATEGORIAS.map(({ icon, label, key }) => (
                <Grid item xs={6} sm={4} key={key}>
                  <Card sx={{
                    borderRadius: 3, cursor: 'pointer',
                    border: '2px solid', borderColor: categoriaAtiva === key ? 'primary.main' : 'transparent',
                    boxShadow: categoriaAtiva === key ? '0 4px 20px rgba(25,118,210,0.2)' : 1,
                  }}>
                    <CardActionArea onClick={() => setCategoriaAtiva(categoriaAtiva === key ? null : key)} sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {icon}
                        <Typography variant="body2" fontWeight={600}>{label}</Typography>
                      </Box>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
            {categoriaAtiva && (
              <Button size="small" onClick={() => setCategoriaAtiva(null)} sx={{ mt: 1 }}>
                Limpar filtro
              </Button>
            )}
          </Box>
        )}

        {/* Artigos */}
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {busca ? `Resultados para "${busca}"` : categoriaAtiva ? CATEGORIAS.find(c => c.key === categoriaAtiva)?.label : 'Artigos populares'}
          <Chip label={artigosFiltrados.length} size="small" sx={{ ml: 1 }} />
        </Typography>

        {artigosFiltrados.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">Nenhum artigo encontrado.</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Fale conosco pelo WhatsApp para suporte direto.
            </Typography>
          </Box>
        ) : (
          artigosFiltrados.map((artigo, i) => (
            <Accordion key={i} expanded={expandido === i} onChange={() => setExpandido(expandido === i ? false : i)}
              sx={{ mb: 1.5, borderRadius: '12px !important', border: '1px solid', borderColor: 'divider', '&:before': { display: 'none' }, boxShadow: 'none' }}>
              <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 3 }}>
                <Typography fontWeight={600}>{artigo.titulo}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                  {artigo.conteudo}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))
        )}

        {/* Contato */}
        <Card sx={{ mt: 5, borderRadius: 3, bgcolor: '#e8f5e9', border: '1px solid #c8e6c9' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <WhatsApp sx={{ fontSize: 40, color: '#25D366', mb: 1 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>Não encontrou o que precisava?</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>Nosso suporte responde em até 4 horas em dias úteis.</Typography>
            <Button variant="contained" startIcon={<WhatsApp />}
              sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1da851' } }}
              href="https://wa.me/5511999999999?text=Olá! Preciso de ajuda com o AltClinic." target="_blank">
              Falar com suporte
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
