import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import {
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  MedicalServices as ProcedimentoIcon,
  Biotech as EquipamentoIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker as MUITimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';

const ClinicaOperacoes = ({ configuracoes, onSalvar }) => {
  const [modalProcedimento, setModalProcedimento] = useState({ open: false, dados: {} });
  const [modalEquipamento, setModalEquipamento] = useState({ open: false, dados: {} });

  const diasSemana = [
    { key: 'segunda', label: 'Segunda-feira' },
    { key: 'terca', label: 'Terça-feira' },
    { key: 'quarta', label: 'Quarta-feira' },
    { key: 'quinta', label: 'Quinta-feira' },
    { key: 'sexta', label: 'Sexta-feira' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
  ];

  const handleSalvarProcedimento = () => {
    // Implementar salvamento de procedimento
    setModalProcedimento({ open: false, dados: {} });
  };

  const handleSalvarEquipamento = () => {
    // Implementar salvamento de equipamento
    setModalEquipamento({ open: false, dados: {} });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Clínica & Operações
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure informações da clínica, horários de funcionamento, procedimentos e equipamentos.
        </Typography>

        <Grid container spacing={3}>
          {/* Informações da Clínica */}
          <Grid item xs={12}>
            <Card>
              <CardHeader
                avatar={<BusinessIcon />}
                title="Informações da Clínica"
                subheader="Dados básicos da clínica"
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Nome da Clínica"
                      value={configuracoes.clinica?.informacoes?.nome || ''}
                      onChange={(e) => {
                        // Implementar atualização
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="CNPJ"
                      value={configuracoes.clinica?.informacoes?.cnpj || ''}
                      onChange={(e) => {
                        // Implementar atualização
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Endereço Completo"
                      value={configuracoes.clinica?.informacoes?.endereco || ''}
                      onChange={(e) => {
                        // Implementar atualização
                      }}
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Telefone"
                      value={configuracoes.clinica?.informacoes?.telefone || ''}
                      onChange={(e) => {
                        // Implementar atualização
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={configuracoes.clinica?.informacoes?.email || ''}
                      onChange={(e) => {
                        // Implementar atualização
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Responsável Técnico"
                      value={configuracoes.clinica?.informacoes?.responsavel_tecnico || ''}
                      onChange={(e) => {
                        // Implementar atualização
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Horários de Funcionamento */}
          <Grid item xs={12}>
            <Card>
              <CardHeader
                avatar={<ScheduleIcon />}
                title="Horários de Funcionamento"
                subheader="Configure os horários de atendimento"
              />
              <CardContent>
                <Grid container spacing={2}>
                  {diasSemana.map((dia) => (
                    <Grid item xs={12} key={dia.key}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={configuracoes.clinica?.horarios?.funcionamento?.[dia.key]?.ativo || false}
                              onChange={(e) => {
                                // Implementar atualização
                              }}
                            />
                          }
                          label={dia.label}
                          sx={{ minWidth: 150 }}
                        />
                        
                        {configuracoes.clinica?.horarios?.funcionamento?.[dia.key]?.ativo && (
                          <>
                            <MUITimePicker
                              label="Abertura"
                              value={new Date(`2000-01-01T${configuracoes.clinica?.horarios?.funcionamento?.[dia.key]?.inicio || '08:00'}:00`)}
                              onChange={(newValue) => {
                                // Implementar atualização
                              }}
                              renderInput={(params) => <TextField {...params} size="small" />}
                            />
                            <MUITimePicker
                              label="Fechamento"
                              value={new Date(`2000-01-01T${configuracoes.clinica?.horarios?.funcionamento?.[dia.key]?.fim || '18:00'}:00`)}
                              onChange={(newValue) => {
                                // Implementar atualização
                              }}
                              renderInput={(params) => <TextField {...params} size="small" />}
                            />
                          </>
                        )}
                      </Box>
                    </Grid>
                  ))}
                  
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      Configurações de Agendamento
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Intervalo entre Consultas (min)"
                      type="number"
                      value={configuracoes.clinica?.horarios?.intervalo_consulta || 30}
                      onChange={(e) => {
                        // Implementar atualização
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Antecedência Mínima (min)"
                      type="number"
                      value={configuracoes.clinica?.horarios?.antecedencia_minima || 60}
                      onChange={(e) => {
                        // Implementar atualização
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Antecedência Máxima (dias)"
                      type="number"
                      value={configuracoes.clinica?.horarios?.antecedencia_maxima || 90}
                      onChange={(e) => {
                        // Implementar atualização
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Procedimentos */}
          <Grid item xs={12}>
            <Card>
              <CardHeader
                avatar={<ProcedimentoIcon />}
                title="Procedimentos"
                subheader="Gerencie os procedimentos oferecidos"
                action={
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setModalProcedimento({ open: true, dados: {} })}
                  >
                    Novo Procedimento
                  </Button>
                }
              />
              <CardContent>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nome</TableCell>
                        <TableCell>Duração (min)</TableCell>
                        <TableCell>Valor (R$)</TableCell>
                        <TableCell>Categoria</TableCell>
                        <TableCell>Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(configuracoes.clinica?.procedimentos || []).map((procedimento, index) => (
                        <TableRow key={index}>
                          <TableCell>{procedimento.nome}</TableCell>
                          <TableCell>{procedimento.duracao}</TableCell>
                          <TableCell>R$ {procedimento.valor?.toFixed(2)}</TableCell>
                          <TableCell>
                            <Chip label={procedimento.categoria} size="small" />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => setModalProcedimento({ open: true, dados: procedimento })}>
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!configuracoes.clinica?.procedimentos || configuracoes.clinica.procedimentos.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography color="text.secondary">
                              Nenhum procedimento cadastrado
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Equipamentos */}
          <Grid item xs={12}>
            <Card>
              <CardHeader
                avatar={<EquipamentoIcon />}
                title="Equipamentos"
                subheader="Gerencie salas e equipamentos"
                action={
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setModalEquipamento({ open: true, dados: {} })}
                  >
                    Novo Equipamento
                  </Button>
                }
              />
              <CardContent>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nome</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Capacidade</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(configuracoes.clinica?.equipamentos || []).map((equipamento, index) => (
                        <TableRow key={index}>
                          <TableCell>{equipamento.nome}</TableCell>
                          <TableCell>{equipamento.tipo}</TableCell>
                          <TableCell>{equipamento.capacidade} pacientes</TableCell>
                          <TableCell>
                            <Chip 
                              label={equipamento.ativo ? 'Ativo' : 'Inativo'}
                              color={equipamento.ativo ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => setModalEquipamento({ open: true, dados: equipamento })}>
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!configuracoes.clinica?.equipamentos || configuracoes.clinica.equipamentos.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography color="text.secondary">
                              Nenhum equipamento cadastrado
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Modal Procedimento */}
        <Dialog open={modalProcedimento.open} onClose={() => setModalProcedimento({ open: false, dados: {} })} maxWidth="md" fullWidth>
          <DialogTitle>
            {modalProcedimento.dados.id ? 'Editar Procedimento' : 'Novo Procedimento'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome do Procedimento"
                  value={modalProcedimento.dados.nome || ''}
                  onChange={(e) => setModalProcedimento(prev => ({
                    ...prev,
                    dados: { ...prev.dados, nome: e.target.value }
                  }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Categoria"
                  value={modalProcedimento.dados.categoria || ''}
                  onChange={(e) => setModalProcedimento(prev => ({
                    ...prev,
                    dados: { ...prev.dados, categoria: e.target.value }
                  }))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Duração (minutos)"
                  type="number"
                  value={modalProcedimento.dados.duracao || ''}
                  onChange={(e) => setModalProcedimento(prev => ({
                    ...prev,
                    dados: { ...prev.dados, duracao: parseInt(e.target.value) }
                  }))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Valor (R$)"
                  type="number"
                  value={modalProcedimento.dados.valor || ''}
                  onChange={(e) => setModalProcedimento(prev => ({
                    ...prev,
                    dados: { ...prev.dados, valor: parseFloat(e.target.value) }
                  }))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={modalProcedimento.dados.ativo || false}
                      onChange={(e) => setModalProcedimento(prev => ({
                        ...prev,
                        dados: { ...prev.dados, ativo: e.target.checked }
                      }))}
                    />
                  }
                  label="Ativo"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrição"
                  multiline
                  rows={3}
                  value={modalProcedimento.dados.descricao || ''}
                  onChange={(e) => setModalProcedimento(prev => ({
                    ...prev,
                    dados: { ...prev.dados, descricao: e.target.value }
                  }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Instruções de Preparo"
                  multiline
                  rows={2}
                  value={modalProcedimento.dados.preparo || ''}
                  onChange={(e) => setModalProcedimento(prev => ({
                    ...prev,
                    dados: { ...prev.dados, preparo: e.target.value }
                  }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalProcedimento({ open: false, dados: {} })}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarProcedimento} variant="contained">
              Salvar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal Equipamento */}
        <Dialog open={modalEquipamento.open} onClose={() => setModalEquipamento({ open: false, dados: {} })} maxWidth="sm" fullWidth>
          <DialogTitle>
            {modalEquipamento.dados.id ? 'Editar Equipamento' : 'Novo Equipamento'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome do Equipamento/Sala"
                  value={modalEquipamento.dados.nome || ''}
                  onChange={(e) => setModalEquipamento(prev => ({
                    ...prev,
                    dados: { ...prev.dados, nome: e.target.value }
                  }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tipo"
                  value={modalEquipamento.dados.tipo || ''}
                  onChange={(e) => setModalEquipamento(prev => ({
                    ...prev,
                    dados: { ...prev.dados, tipo: e.target.value }
                  }))}
                  placeholder="Ex: Sala de Consulta, Equipamento Laser"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Capacidade"
                  type="number"
                  value={modalEquipamento.dados.capacidade || ''}
                  onChange={(e) => setModalEquipamento(prev => ({
                    ...prev,
                    dados: { ...prev.dados, capacidade: parseInt(e.target.value) }
                  }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrição"
                  multiline
                  rows={3}
                  value={modalEquipamento.dados.descricao || ''}
                  onChange={(e) => setModalEquipamento(prev => ({
                    ...prev,
                    dados: { ...prev.dados, descricao: e.target.value }
                  }))}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={modalEquipamento.dados.ativo || false}
                      onChange={(e) => setModalEquipamento(prev => ({
                        ...prev,
                        dados: { ...prev.dados, ativo: e.target.checked }
                      }))}
                    />
                  }
                  label="Ativo"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalEquipamento({ open: false, dados: {} })}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarEquipamento} variant="contained">
              Salvar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ClinicaOperacoes;
