import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as FinanceiroIcon,
  Chat as CrmIcon,
  WhatsApp as WhatsAppIcon,
  Assessment as RelatoriosIcon,
  Settings as ConfiguracoesIcon,
  LocalHospital as MedicosIcon,
  AccessTime as EsperaIcon,
  CreditCard as LicencasIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

const DRAWER_WIDTH = 240;

// Menu principal do sistema
const menuItems = [
  {
    text: 'Dashboard',
    icon: DashboardIcon,
    path: '/dashboard'
  },
  {
    text: 'Agenda',
    icon: CalendarIcon,
    path: '/agenda-lite'
  },
  {
    text: 'Pacientes',
    icon: PeopleIcon,
    path: '/pacientes'
  },
  {
    text: 'Profissionais',
    icon: MedicosIcon,
    path: '/profissionais'
  },
  {
    text: 'Sala de Espera',
    icon: EsperaIcon,
    path: '/espera'
  },
  {
    text: 'Financeiro',
    icon: FinanceiroIcon,
    path: '/financeiro'
  },
  {
    text: 'CRM',
    icon: CrmIcon,
    path: '/crm'
  },
  {
    text: 'WhatsApp',
    icon: WhatsAppIcon,
    path: '/whatsapp'
  },
  {
    text: 'Relatórios',
    icon: RelatoriosIcon,
    path: '/relatorios'
  },
  {
    text: 'Licenças',
    icon: LicencasIcon,
    path: '/billing'
  },
  {
    text: 'Configurações',
    icon: ConfiguracoesIcon,
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

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          SAEE
        </Typography>
      </Toolbar>
      
      <Divider />
      
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        <List>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    backgroundColor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'primary.contrastText' : 'inherit',
                    '&:hover': {
                      backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? 'primary.contrastText' : 'inherit',
                      minWidth: 40
                    }}
                  >
                    <item.icon />
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;