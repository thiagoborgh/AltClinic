import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  GetApp as ExportIcon,
  History as HistoryIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function LogsAtendimento({
  pacienteId,
  logs,
  onExportarLogs,
  onAtualizarDados
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (pacienteId) {
      carregarLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId]);

  const carregarLogs = async () => {
    try {
      setCarregando(true);
      if (onAtualizarDados) {
        await onAtualizarDados();
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setCarregando(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getAcaoIcon = (acao) => {
    switch (acao) {
      case 'iniciar':
        return <PlayIcon color="success" />;
      case 'pausar':
        return <PauseIcon color="warning" />;
      case 'finalizar':
        return <StopIcon color="primary" />;
      case 'cancelar':
        return <CancelIcon color="error" />;
      default:
        return <HistoryIcon />;
    }
  };

  const getAcaoColor = (acao) => {
    switch (acao) {
      case 'iniciar':
        return 'success';
      case 'pausar':
        return 'warning';
      case 'finalizar':
        return 'primary';
      case 'cancelar':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredLogs = logs?.filter(log =>
    log.acao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.motivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.profissional?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const paginatedLogs = filteredLogs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          Logs de Atendimento
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={onExportarLogs}
            disabled={!logs || logs.length === 0}
          >
            Exportar
          </Button>
          <Button
            variant="contained"
            onClick={carregarLogs}
            disabled={carregando}
          >
            {carregando ? 'Carregando...' : 'Atualizar'}
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por ação, motivo ou profissional..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Tabela de Logs */}
      {filteredLogs.length > 0 ? (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Data/Hora</TableCell>
                  <TableCell>Ação</TableCell>
                  <TableCell>Motivo</TableCell>
                  <TableCell>Profissional</TableCell>
                  <TableCell>Observações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedLogs.map((log, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getAcaoIcon(log.acao)}
                        <Chip
                          label={log.acao}
                          color={getAcaoColor(log.acao)}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>{log.motivo}</TableCell>
                    <TableCell>{log.profissional || 'Sistema'}</TableCell>
                    <TableCell>
                      <Tooltip title={log.observacoes || 'Sem observações'}>
                        <Typography variant="body2" sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {log.observacoes || 'Sem observações'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredLogs.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Linhas por página"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count}`
            }
          />
        </>
      ) : (
        <Alert severity="info">
          Nenhum log de atendimento encontrado.
          {searchTerm && ' Tente ajustar os filtros de busca.'}
        </Alert>
      )}

      {/* Resumo */}
      {logs && logs.length > 0 && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Resumo dos Logs
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              label={`Total: ${logs.length}`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`Iniciados: ${logs.filter(l => l.acao === 'iniciar').length}`}
              color="success"
              variant="outlined"
            />
            <Chip
              label={`Pausados: ${logs.filter(l => l.acao === 'pausar').length}`}
              color="warning"
              variant="outlined"
            />
            <Chip
              label={`Finalizados: ${logs.filter(l => l.acao === 'finalizar').length}`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`Cancelados: ${logs.filter(l => l.acao === 'cancelar').length}`}
              color="error"
              variant="outlined"
            />
          </Box>
        </Paper>
      )}
    </Box>
  );
}
