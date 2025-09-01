import React, { useState, useEffect } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  SwapHoriz as SwapIcon,
  Business as BusinessIcon,
  Check as CheckIcon,
  KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const LicenseSwitcher = () => {
  const { 
    tenant, 
    license, 
    switchLicense, 
    getUserLicenses
  } = useAuth();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [availableLicenses, setAvailableLicenses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const open = Boolean(anchorEl);

  // Carregar licenças disponíveis
  useEffect(() => {
    const loadLicenses = async () => {
      try {
        const licenses = await getUserLicenses();
        setAvailableLicenses(licenses.filter(l => l.id !== license?.id));
      } catch (error) {
        console.error('Erro ao carregar licenças:', error);
      }
    };

    if (open) {
      loadLicenses();
    }
  }, [open, license?.id, getUserLicenses]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSwitchLicense = async (newLicenseId) => {
    try {
      setLoading(true);
      
      const result = await switchLicense(newLicenseId);
      
      if (result.success) {
        toast.success('Clínica alterada com sucesso!');
        handleClose();
        // Página será recarregada automaticamente devido à mudança no contexto
      } else {
        toast.error(result.message || 'Erro ao trocar clínica');
      }
    } catch (error) {
      toast.error('Erro inesperado ao trocar clínica');
    } finally {
      setLoading(false);
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

  // Se usuário tem apenas uma licença, não mostrar o switcher
  if (!tenant || availableLicenses.length === 0) {
    return null;
  }

  return (
    <Box>
      <Tooltip title="Trocar clínica">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.2)'
            }
          }}
        >
          <Badge badgeContent={availableLicenses.length} color="secondary">
            <SwapIcon sx={{ color: 'white' }} />
          </Badge>
          <ArrowDownIcon sx={{ color: 'white', ml: 0.5 }} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 400,
            mt: 1
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Clínica Atual */}
        <MenuItem disabled sx={{ opacity: 1, bgcolor: 'action.selected' }}>
          <ListItemIcon>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              <BusinessIcon fontSize="small" />
            </Avatar>
          </ListItemIcon>
          <ListItemText>
            <Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {tenant.nome}
                </Typography>
                <CheckIcon color="success" fontSize="small" />
              </Box>
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <Chip
                  label={tenant.plano.toUpperCase()}
                  size="small"
                  color={getPlanColor(tenant.plano)}
                  variant="outlined"
                />
                <Chip
                  label={getRoleLabel(license.role)}
                  size="small"
                  color="secondary"
                  variant="filled"
                />
              </Box>
              <Typography variant="caption" color="success.main" sx={{ mt: 0.5 }}>
                ● Clínica atual
              </Typography>
            </Box>
          </ListItemText>
        </MenuItem>

        {availableLicenses.length > 0 && <Divider />}

        {/* Outras Licenças */}
        {availableLicenses.map((licenseItem) => (
          <MenuItem
            key={licenseItem.id}
            onClick={() => handleSwitchLicense(licenseItem.id)}
            disabled={loading}
            sx={{
              py: 1.5,
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <ListItemIcon>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                <BusinessIcon fontSize="small" />
              </Avatar>
            </ListItemIcon>
            <ListItemText>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  {licenseItem.tenant.nome}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  <Chip
                    label={licenseItem.tenant.plano.toUpperCase()}
                    size="small"
                    color={getPlanColor(licenseItem.tenant.plano)}
                    variant="outlined"
                  />
                  <Chip
                    label={getRoleLabel(licenseItem.role)}
                    size="small"
                    color="secondary"
                    variant="filled"
                  />
                </Box>
                {licenseItem.lastAccess && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Último acesso: {new Date(licenseItem.lastAccess).toLocaleDateString('pt-BR')}
                  </Typography>
                )}
              </Box>
            </ListItemText>
          </MenuItem>
        ))}

        {availableLicenses.length === 0 && (
          <MenuItem disabled>
            <ListItemText>
              <Typography variant="body2" color="text.secondary" align="center">
                Nenhuma outra clínica disponível
              </Typography>
            </ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default LicenseSwitcher;
