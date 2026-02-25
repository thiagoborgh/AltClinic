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
  CreditCard as LicencasIcon,
  Analytics as AnalyticsIcon,
  ListAlt as CadastrosIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { isFeatureEnabled } from '../../config/features';

const DRAWER_WIDTH = 240;

// Menu principal do sistema
const menuItems = [
  {
    text: 'Agenda',
    icon: CalendarIcon,
    path: '/agenda-lite',
    feature: 'agenda'
  },
  {
    text: 'Cadastros',
    icon: CadastrosIcon,
    path: '/cadastros',
    feature: 'cadastros'
  },
  {
    text: 'Dashboard',
    icon: DashboardIcon,
    path: '/dashboard',
    feature: 'dashboard'
  },
  {
    text: 'Pacientes',
    icon: PeopleIcon,
    path: '/pacientes',
    feature: 'pacientes'
  },
  {
    text: 'Profissionais',
    icon: MedicosIcon,
    path: '/profissionais',
    feature: 'profissionais'
  },
  {
    text: 'Sala de Espera',
    icon: EsperaIcon,
    path: '/espera',
    feature: 'sala_espera'
  },
  {
    text: 'Financeiro',
    icon: FinanceiroIcon,
    path: '/financeiro',
    feature: 'financeiro'
  },
  {
    text: 'CRM',
    icon: CrmIcon,
    path: '/crm',
    feature: 'crm_avancado'
  },
  {
    text: 'WhatsApp',
    icon: WhatsAppIcon,
    path: '/whatsapp',
    feature: 'whatsapp'
  },
  {
    text: 'Relatórios',
    icon: RelatoriosIcon,
    path: '/relatorios',
    feature: 'relatorios'
  },
  {
    text: 'Licenças',
    icon: LicencasIcon,
    path: '/billing',
    feature: 'licencas'
  },
  {
    text: 'Analytics',
    icon: AnalyticsIcon,
    path: '/analytics',
    feature: 'analytics'
  },
  {
    text: 'Configurações',
    icon: ConfiguracoesIcon,
    path: '/configuracoes',
    feature: 'configuracoes'
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
          {menuItems
            .filter(item => isFeatureEnabled(item.feature))
            .map((item) => {
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