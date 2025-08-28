import React, { useState, useMemo } from 'react';
import {
  Paper,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Chip,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  MoreVert,
  Message,
  Phone,
  Email,
  Visibility,
  Edit,
  Delete,
  PersonAdd
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePacientes } from '../../../hooks/crm/useCRM';
import { formatCurrency, formatPhone, getStatusColor } from '../../../data/crm/mockCRMData';
import PerfilPacienteModal from './PerfilPacienteModal';

// Componente de Chip de Status
const StatusChip = ({ status }) => {
  const getStatusProps = (status) => {
    const props = {
      'ativo': { color: 'success', label: 'Ativo' },
      'inativo': { color: 'warning', label: 'Inativo' },
      'perdido': { color: 'error', label: 'Perdido' }
    };
    return props[status] || { color: 'default', label: 'Indefinido' };
  };

  const statusProps = getStatusProps(status);
  
  return (
    <Chip
      label={statusProps.label}
      color={statusProps.color}
      size="small"
      variant="outlined"
    />
  );
};

// Componente de Ações do Paciente
const PacienteActions = ({ paciente, onAction }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => {
    if (onAction) {
      onAction(action, paciente);
    }
    handleClose();
  };

  const actions = [
    { 
      label: 'Ver Perfil', 
      icon: <Visibility fontSize="small" />, 
      action: 'view',
      color: 'primary'
    },
    { 
      label: 'Enviar Mensagem', 
      icon: <Message fontSize="small" />, 
      action: 'message',
      color: 'secondary'
    },
    { 
      label: 'Ligar', 
      icon: <Phone fontSize="small" />, 
      action: 'call',
      color: 'info'
    },
    { 
      label: 'Enviar Email', 
      icon: <Email fontSize="small" />, 
      action: 'email',
      color: 'warning'
    },
    { 
      label: 'Editar', 
      icon: <Edit fontSize="small" />, 
      action: 'edit',
      color: 'default'
    },
    { 
      label: 'Excluir', 
      icon: <Delete fontSize="small" />, 
      action: 'delete',
      color: 'error'
    }
  ];

  return (
    <Box>
      {/* Ações rápidas visíveis */}
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Enviar Mensagem">
          <IconButton 
            size="small" 
            color="primary"
            onClick={() => handleAction('message')}
          >
            <Message fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Ver Perfil">
          <IconButton 
            size="small" 
            color="secondary"
            onClick={() => handleAction('view')}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
        
        {/* Menu de mais ações */}
        <IconButton
          size="small"
          onClick={handleClick}
          aria-label="mais ações"
        >
          <MoreVert fontSize="small" />
        </IconButton>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {actions.map((action) => (
          <MenuItem 
            key={action.action}
            onClick={() => handleAction(action.action)}
            sx={{ 
              color: action.color !== 'default' ? `${action.color}.main` : 'inherit',
              '&:hover': {
                backgroundColor: action.color !== 'default' ? `${action.color}.light` : 'action.hover'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {action.icon}
              {action.label}
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

// Componente Principal da Lista de Pacientes
const PacientesList = ({ filters = {}, onFiltersChange }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [perfilModalOpen, setPerfilModalOpen] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  
  // Combinar filtros com paginação usando useMemo para evitar re-renders desnecessários
  const combinedFilters = useMemo(() => ({
    ...filters,
    page: page + 1,
    limit: rowsPerPage
  }), [filters, page, rowsPerPage]);

  const { pacientes, pagination, loading, error, sendMessage } = usePacientes(combinedFilters);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handlePacienteAction = async (action, paciente) => {
    console.log(`Ação ${action} para paciente:`, paciente.nome);
    
    switch (action) {
      case 'view':
        // Abrir modal do perfil do paciente
        setPacienteSelecionado(paciente);
        setPerfilModalOpen(true);
        break;
        
      case 'message':
        // Aqui abriremos o modal de envio de mensagem
        console.log('Enviar mensagem para:', paciente.nome);
        try {
          await sendMessage(paciente.id, {
            tipo: 'whatsapp',
            conteudo: `Olá ${paciente.nome}, como está?`
          });
        } catch (error) {
          console.error('Erro ao enviar mensagem:', error);
        }
        break;
        
      case 'call':
        // Aqui podemos integrar com sistema de telefonia
        window.open(`tel:${paciente.telefone}`);
        break;
        
      case 'email':
        // Abrir cliente de email
        window.open(`mailto:${paciente.email}`);
        break;
        
      case 'edit':
        // Aqui abriremos o modal de edição
        console.log('Editar paciente:', paciente.nome);
        break;
        
      case 'delete':
        // Aqui abriremos confirmação de exclusão
        console.log('Excluir paciente:', paciente.nome);
        break;
        
      default:
        console.log('Ação não implementada:', action);
    }
  };

  const handleNewPatient = () => {
    console.log('Adicionar novo paciente');
    // Aqui implementaremos o modal de novo paciente
  };

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Cabeçalho */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Pacientes
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {loading ? 'Carregando...' : `${pagination.total || 0} pacientes encontrados`}
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={handleNewPatient}
            disabled={loading}
          >
            Novo Paciente
          </Button>
        </Box>
      </Box>

      {/* Tabela */}
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Paciente</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Última Consulta</TableCell>
              <TableCell>Valor Gasto</TableCell>
              <TableCell>Segmento</TableCell>
              <TableCell>Consultas</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {loading ? (
              // Loading skeleton
              Array.from(new Array(rowsPerPage)).map((_, index) => (
                <TableRow key={index}>
                  {Array.from(new Array(7)).map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <CircularProgress size={20} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              pacientes.map((paciente) => (
                <TableRow 
                  key={paciente.id}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  {/* Informações do Paciente */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: getStatusColor(paciente.status) }}>
                        {paciente.nome.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {paciente.nome}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {paciente.email}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="textSecondary">
                          {formatPhone(paciente.telefone)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  {/* Status */}
                  <TableCell>
                    <StatusChip status={paciente.status} />
                  </TableCell>
                  
                  {/* Última Consulta */}
                  <TableCell>
                    <Typography variant="body2">
                      {paciente.ultima_consulta ? 
                        formatDistanceToNow(new Date(paciente.ultima_consulta), { 
                          addSuffix: true,
                          locale: ptBR 
                        }) : 
                        'Nunca'
                      }
                    </Typography>
                  </TableCell>
                  
                  {/* Valor Gasto */}
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(paciente.valor_total_gasto)}
                    </Typography>
                  </TableCell>
                  
                  {/* Segmento */}
                  <TableCell>
                    {paciente.segmento ? (
                      <Chip
                        label={paciente.segmento.nome}
                        size="small"
                        sx={{ 
                          backgroundColor: paciente.segmento.cor,
                          color: 'white',
                          fontWeight: 'medium'
                        }}
                      />
                    ) : (
                      <Typography variant="caption" color="textSecondary">
                        Sem segmento
                      </Typography>
                    )}
                  </TableCell>
                  
                  {/* Número de Consultas */}
                  <TableCell>
                    <Typography variant="body2">
                      {paciente.numero_consultas}
                    </Typography>
                  </TableCell>
                  
                  {/* Ações */}
                  <TableCell>
                    <PacienteActions 
                      paciente={paciente} 
                      onAction={handlePacienteAction}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginação */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={pagination.total || 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Linhas por página:"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
        }
        disabled={loading}
      />

      {/* Modal de Perfil do Paciente */}
      <PerfilPacienteModal
        open={perfilModalOpen}
        onClose={() => setPerfilModalOpen(false)}
        paciente={pacienteSelecionado}
      />
    </Paper>
  );
};

export default PacientesList;
