import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Button,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Notifications,
  AccountCircle,
  Menu as MenuIcon,
  Logout,
  TrendingUp
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import Logo from './Logo';
import UpgradeDialog from '../UpgradeDialog';

const Navbar = ({ onMenuClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const { user: authUser } = useAuth();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationCount] = useState(3); // Simular notificações
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  // Verificar se é usuário trial
  const isTrialUser = authUser?.singleLicense?.plan === 'trial' || 
                     authUser?.tenant?.plano === 'trial';

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: 'background.paper',
        color: 'text.primary',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
      }}
    >
      <Toolbar>
        {/* Menu hamburger para mobile */}
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Logo */}
        <Box 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            alignItems: 'center',
            height: 40 
          }}
        >
          <Logo 
            variant="complete" 
            size="medium"
            sx={{ 
              height: '100%',
              maxWidth: '200px'
            }} 
          />
        </Box>

        {/* Espaçamento flexível */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Botão de Upgrade para usuários trial */}
        {isTrialUser && (
          <Button
            variant="contained"
            color="warning"
            size="small"
            onClick={() => setUpgradeDialogOpen(true)}
            startIcon={<TrendingUp />}
            sx={{ 
              mr: 2,
              fontWeight: 'bold',
              textTransform: 'none',
              '&:hover': {
                transform: 'scale(1.05)',
                transition: 'transform 0.2s'
              }
            }}
          >
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              Upgrade
            </Box>
            <Chip 
              label="30% OFF" 
              size="small" 
              color="error"
              sx={{ 
                ml: 1, 
                height: 20,
                '& .MuiChip-label': { fontSize: '0.7rem', px: 1 }
              }}
            />
          </Button>
        )}

        {/* Notificações */}
        <IconButton color="inherit" sx={{ mr: 1 }}>
          <Badge badgeContent={notificationCount} color="error">
            <Notifications />
          </Badge>
        </IconButton>

        {/* Menu do usuário */}
        <Box display="flex" alignItems="center">
          <IconButton
            onClick={handleMenuOpen}
            sx={{ p: 0 }}
          >
            <Avatar
              sx={{ bgcolor: 'primary.main' }}
              alt={user?.nome || 'Usuário'}
            >
              {user?.nome?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleMenuClose}>
              <AccountCircle sx={{ mr: 2 }} />
              Perfil
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 2 }} />
              Sair
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* Dialog de Upgrade */}
      <UpgradeDialog 
        open={upgradeDialogOpen}
        onClose={() => setUpgradeDialogOpen(false)}
        currentPlan={authUser?.singleLicense?.plan || authUser?.tenant?.plano || 'trial'}
      />
    </AppBar>
  );
};

export default Navbar;
