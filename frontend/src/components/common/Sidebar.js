import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  CalendarMonth,
  AttachMoney,
  People,
  Chat,
  Settings,
  Assessment
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

const DRAWER_WIDTH = 240;

const menuItems = [
  {
    text: 'Dashboard',
    icon: DashboardIcon,
    path: '/dashboard'
  },
  {
    text: 'Agenda',
    icon: CalendarMonth,
    path: '/agendamentos'
  },
  {
    text: 'Financeiro',
    icon: AttachMoney,
    path: '/financeiro'
  },
  {
    text: 'CRM',
    icon: Chat,
    path: '/crm'
  },
  {
    text: 'Pacientes',
    icon: People,
    path: '/pacientes'
  },
  {
    text: 'Relatórios',
    icon: Assessment,
    path: '/relatorios'
  }
];

const configItems = [
  {
    text: 'Configurações',
    icon: Settings,
    path: '/configuracoes'
  }
];

const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  const renderMenuItems = (items) => (
    <List>
      {items.map((item) => {
        const isActive = location.pathname === item.path;
        
        return (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                mx: 1,
                borderRadius: 1,
                backgroundColor: isActive ? 'primary.main' : 'transparent',
                color: isActive ? 'white' : 'inherit',
                '&:hover': {
                  backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive ? 'white' : 'inherit',
                  minWidth: 40
                }}
              >
                <item.icon />
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 400
                }}
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );

  const drawerContent = (
    <Box sx={{ overflow: 'auto', height: '100%' }}>
      <Box sx={{ height: 64 }} /> {/* Espaço para o Navbar */}
      
      {/* Menu principal */}
      {renderMenuItems(menuItems)}
      
      <Divider sx={{ my: 2 }} />
      
      {/* Menu de configurações */}
      {renderMenuItems(configItems)}
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true, // Melhor performance no mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: DRAWER_WIDTH 
          },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: DRAWER_WIDTH 
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
