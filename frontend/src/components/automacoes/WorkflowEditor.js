import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  IconButton
} from '@mui/material';
import { Close } from '@mui/icons-material';

const tiposGatilho = [
  { value: 'temporal', label: 'Temporal (baseado em datas)' },
  { value: 'acao', label: 'Ação (quando algo acontece)' },
  { value: 'segmento', label: 'Segmento (mudança de categoria)' }
];

const eventosTemporais = [
  { value: 'aniversario', label: 'Aniversário do paciente' },
  { value: 'consulta_agendada', label: 'Consulta agendada' },
  { value: 'consulta_realizada', label: 'Pós-consulta' },
  { value: 'inatividade', label: 'Paciente inativo' }
];

const WorkflowEditor = ({ open, onClose, onSalvar, workflowEdicao = null }) => {
  const [etapaAtiva, setEtapaAtiva] = useState(0);
  const [dados, setDados] = useState({
    nome: '',
    descricao: '',
    gatilho: { tipo: 'temporal', evento: 'aniversario', condicoes: {} },
    acoes: [{ tipo: 'mensagem', conteudo: { canal: 'whatsapp', template: '' }, intervalo_anterior: 0 }],
    status: 'ativo'
  });

  // Atualiza dados quando for fornecido workflowEdicao (edição)
  useEffect(() => {
    if (workflowEdicao) {
      setDados({
        nome: workflowEdicao.nome || '',
        descricao: workflowEdicao.descricao || '',
        gatilho: workflowEdicao.gatilho || { tipo: 'temporal', evento: 'aniversario', condicoes: {} },
        acoes: workflowEdicao.acoes || [{ tipo: 'mensagem', conteudo: { canal: 'whatsapp', template: '' }, intervalo_anterior: 0 }],
        status: workflowEdicao.status || 'ativo'
      });
    } else if (open) {
      // reset when opening for new
      setDados({
        nome: '',
        descricao: '',
        gatilho: { tipo: 'temporal', evento: 'aniversario', condicoes: {} },
        acoes: [{ tipo: 'mensagem', conteudo: { canal: 'whatsapp', template: '' }, intervalo_anterior: 0 }],
        status: 'ativo'
      });
    }
  }, [workflowEdicao, open]);

  const etapas = ['Básico', 'Gatilho', 'Ações', 'Revisão'];

  const handleProximo = () => {
    if (etapaAtiva < etapas.length - 1) {
      setEtapaAtiva(etapaAtiva + 1);
    }
  };

  const handleAnterior = () => {
    if (etapaAtiva > 0) {
      setEtapaAtiva(etapaAtiva - 1);
    }
  };

  const handleSalvar = () => {
    onSalvar(dados);
    handleClose();
  };

  const handleClose = () => {
    setEtapaAtiva(0);
    setDados({
      nome: '',
      descricao: '',
      gatilho: { tipo: 'temporal', evento: 'aniversario', condicoes: {} },
      acoes: [{ tipo: 'mensagem', conteudo: { canal: 'whatsapp', template: '' }, intervalo_anterior: 0 }],
      status: 'ativo'
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {workflowEdicao ? 'Editar Workflow' : 'Novo Workflow'}
        <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={etapaAtiva} sx={{ mb: 3 }}>
          {etapas.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Etapa 1: Informações Básicas */}
        {etapaAtiva === 0 && (
          <Box>
            <TextField
              label="Nome do Workflow"
              fullWidth
              margin="normal"
              value={dados.nome}
              onChange={(e) => setDados({...dados, nome: e.target.value})}
              placeholder="Ex: Lembrete de Consulta"
            />
            <TextField
              label="Descrição"
              fullWidth
              multiline
              rows={3}
              margin="normal"
              value={dados.descricao}
              onChange={(e) => setDados({...dados, descricao: e.target.value})}
              placeholder="Descreva o objetivo deste workflow"
            />
          </Box>
        )}

        {/* Etapa 2: Configuração do Gatilho */}
        {etapaAtiva === 1 && (
          <Box>
            <FormControl fullWidth margin="normal">
              <InputLabel>Tipo de Gatilho</InputLabel>
              <Select
                value={dados.gatilho.tipo}
                label="Tipo de Gatilho"
                onChange={(e) => setDados({
                  ...dados, 
                  gatilho: {...dados.gatilho, tipo: e.target.value}
                })}
              >
                {tiposGatilho.map(tipo => (
                  <MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {dados.gatilho.tipo === 'temporal' && (
              <FormControl fullWidth margin="normal">
                <InputLabel>Evento</InputLabel>
                <Select
                  value={dados.gatilho.evento}
                  label="Evento"
                  onChange={(e) => setDados({
                    ...dados, 
                    gatilho: {...dados.gatilho, evento: e.target.value}
                  })}
                >
                  {eventosTemporais.map(evento => (
                    <MenuItem key={evento.value} value={evento.value}>{evento.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        )}

        {/* Etapa 3: Configuração de Ações */}
        {etapaAtiva === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>Ações do Workflow</Typography>
            {dados.acoes.map((acao, index) => (
              <Box key={index} sx={{ border: 1, borderColor: 'divider', p: 2, mb: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Ação {index + 1}</Typography>
                <FormControl fullWidth margin="normal" size="small">
                  <InputLabel>Canal</InputLabel>
                  <Select
                    value={acao.conteudo.canal}
                    label="Canal"
                    onChange={(e) => {
                      const novasAcoes = [...dados.acoes];
                      novasAcoes[index].conteudo.canal = e.target.value;
                      setDados({...dados, acoes: novasAcoes});
                    }}
                  >
                    <MenuItem value="whatsapp">WhatsApp</MenuItem>
                    <MenuItem value="email">Email</MenuItem>
                    <MenuItem value="sms">SMS</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Mensagem"
                  fullWidth
                  multiline
                  rows={3}
                  margin="normal"
                  value={acao.conteudo.template}
                  onChange={(e) => {
                    const novasAcoes = [...dados.acoes];
                    novasAcoes[index].conteudo.template = e.target.value;
                    setDados({...dados, acoes: novasAcoes});
                  }}
                  placeholder="Use {nome} para inserir o nome do paciente"
                />
              </Box>
            ))}
          </Box>
        )}

        {/* Etapa 4: Revisão */}
        {etapaAtiva === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>Revisão do Workflow</Typography>
            <Typography variant="body1"><strong>Nome:</strong> {dados.nome}</Typography>
            <Typography variant="body1"><strong>Descrição:</strong> {dados.descricao}</Typography>
            <Typography variant="body1"><strong>Gatilho:</strong> {dados.gatilho.tipo} - {dados.gatilho.evento}</Typography>
            <Typography variant="body1"><strong>Ações:</strong> {dados.acoes.length}</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        {etapaAtiva > 0 && (
          <Button onClick={handleAnterior}>Anterior</Button>
        )}
        {etapaAtiva < etapas.length - 1 ? (
          <Button 
            variant="contained" 
            onClick={handleProximo}
            disabled={etapaAtiva === 0 && (!dados.nome || !dados.descricao)}
          >
            Próximo
          </Button>
        ) : (
          <Button variant="contained" onClick={handleSalvar}>
            Salvar Workflow
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default WorkflowEditor;
