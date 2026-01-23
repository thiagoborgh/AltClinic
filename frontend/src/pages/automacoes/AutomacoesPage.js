import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Chip,
  Switch,
  IconButton,
  Fab
} from '@mui/material';
import { Add, Edit, PlayArrow, Pause, Delete } from '@mui/icons-material';
import useAutomacoes from '../../hooks/automacoes/useAutomacoes';
import WorkflowEditor from '../../components/automacoes/WorkflowEditor';

const AutomacoesPage = () => {
  const [modalNovoWorkflow, setModalNovoWorkflow] = useState(false);
  const { workflows, toggleWorkflow, excluirWorkflow, adicionarWorkflow, atualizarWorkflow } = useAutomacoes();
  const [editingWorkflow, setEditingWorkflow] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ativo': return 'success';
      case 'pausado': return 'warning';
      case 'inativo': return 'default';
      default: return 'default';
    }
  };

  const handleSalvarWorkflow = (dadosWorkflow) => {
    if (editingWorkflow) {
      atualizarWorkflow(editingWorkflow.id, dadosWorkflow);
      setEditingWorkflow(null);
    } else {
      adicionarWorkflow(dadosWorkflow);
    }
    setModalNovoWorkflow(false);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h5">Automações e Workflows</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => setModalNovoWorkflow(true)}
        >
          Novo Workflow
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Workflows Configurados
        </Typography>
        
        {workflows.length === 0 ? (
          <Typography variant="body1" color="textSecondary" sx={{ py: 4, textAlign: 'center' }}>
            Nenhum workflow configurado ainda.
            <br />
            Crie seu primeiro workflow para automatizar a comunicação com pacientes.
          </Typography>
        ) : (
          <List>
            {workflows.map((workflow) => (
              <ListItem
                key={workflow.id}
                secondaryAction={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Switch
                      checked={workflow.status === 'ativo'}
                      onChange={() => toggleWorkflow(workflow.id)}
                      size="small"
                    />
                    <IconButton size="small" onClick={() => { setEditingWorkflow(workflow); setModalNovoWorkflow(true); }}>
                      <Edit />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => excluirWorkflow(workflow.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="subtitle1">{workflow.nome}</Typography>
                      <Chip
                        label={workflow.status}
                        color={getStatusColor(workflow.status)}
                        size="small"
                      />
                      <Chip
                        label={workflow.gatilho.tipo}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2">{workflow.descricao}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {workflow.metricas.execucoes} execuções • 
                        {workflow.metricas.sucesso} sucessos • 
                        {workflow.acoes.length} ações
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Botão flutuante para criar workflow */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setModalNovoWorkflow(true)}
      >
        <Add />
      </Fab>

      {/* TODO: Modal do editor de workflow */}
      <WorkflowEditor
        open={modalNovoWorkflow}
        onClose={() => { setModalNovoWorkflow(false); setEditingWorkflow(null); }}
        onSalvar={handleSalvarWorkflow}
        workflowEdicao={editingWorkflow}
      />
    </Box>
  );
};

export default AutomacoesPage;
