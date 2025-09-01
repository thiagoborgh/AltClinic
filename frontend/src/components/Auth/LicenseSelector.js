import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Typography,
  Box,
  Chip,
  Divider,
  Card,
  CardContent,
  CardActionArea,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Business as BusinessIcon,
  AccessTime as AccessTimeIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const LicenseSelector = ({ 
  open, 
  onClose, 
  licenses = [], 
  user, 
  onSelectLicense,
  loading = false 
}) => {
  const [selectedLicense, setSelectedLicense] = useState(null);

  const handleSelectLicense = async () => {
    if (selectedLicense && onSelectLicense) {
      await onSelectLicense(selectedLicense);
    }
  };

  const getPlanColor = (plano) => {
    const colors = {
      trial: 'default',
      starter: 'primary',
      professional: 'secondary',
      enterprise: 'warning'
    };
    return colors[plano] || 'default';
  };

  const getRoleLabel = (role) => {
    const labels = {
      owner: 'Proprietário',
      admin: 'Administrador',
      doctor: 'Médico',
      assistant: 'Assistente',
      receptionist: 'Recepcionista'
    };
    return labels[role] || role;
  };

  const formatLastAccess = (date) => {
    if (!date) return 'Nunca acessou';
    
    const now = new Date();
    const accessDate = new Date(date);
    const diffInHours = (now - accessDate) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(accessDate, "'Hoje às' HH:mm", { locale: ptBR });
    } else if (diffInHours < 48) {
      return format(accessDate, "'Ontem às' HH:mm", { locale: ptBR });
    } else {
      return format(accessDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 3,
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Selecionar Clínica
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Olá, {user?.nome}! Escolha qual clínica deseja acessar:
            </Typography>
          </Box>
          <Tooltip title="Atualizar lista">
            <IconButton onClick={() => window.location.reload()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {licenses.map((license) => (
            <Card 
              key={license.id}
              variant={selectedLicense?.id === license.id ? "outlined" : "elevation"}
              sx={{ 
                cursor: 'pointer',
                border: selectedLicense?.id === license.id ? 2 : 1,
                borderColor: selectedLicense?.id === license.id ? 'primary.main' : 'divider',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: 3,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <CardActionArea onClick={() => setSelectedLicense(license)}>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar 
                        sx={{ 
                          width: 56, 
                          height: 56,
                          bgcolor: 'primary.main'
                        }}
                      >
                        <BusinessIcon fontSize="large" />
                      </Avatar>
                      
                      <Box>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Typography variant="h6" fontWeight="bold">
                            {license.tenant.nome}
                          </Typography>
                          {selectedLicense?.id === license.id && (
                            <CheckCircleIcon color="primary" fontSize="small" />
                          )}
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Chip 
                            label={license.tenant.plano.toUpperCase()}
                            size="small"
                            color={getPlanColor(license.tenant.plano)}
                            variant="outlined"
                          />
                          <Chip 
                            label={getRoleLabel(license.role)}
                            size="small"
                            color="secondary"
                            variant="filled"
                          />
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <AccessTimeIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {formatLastAccess(license.lastAccess)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {license.lastAccess && new Date() - new Date(license.lastAccess) < 24 * 60 * 60 * 1000 && (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <StarIcon color="warning" fontSize="small" />
                        <Typography variant="caption" color="warning.main">
                          Recente
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>

        {licenses.length === 0 && (
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            py={4}
          >
            <BusinessIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhuma clínica encontrada
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Você não possui acesso a nenhuma clínica no momento.<br />
              Entre em contato com o administrador.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={onClose}
          color="inherit"
          size="large"
        >
          Cancelar
        </Button>
        
        <Button
          onClick={handleSelectLicense}
          variant="contained"
          disabled={!selectedLicense || loading}
          size="large"
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Entrando...' : 'Acessar Clínica'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LicenseSelector;
