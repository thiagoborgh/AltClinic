import React from 'react';
import { Drawer, Box } from '@mui/material';

const DRAWER_WIDTH = 240;

const Sidebar = ({ mobileOpen, onMobileClose }) => {
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
        <Box p={2}>
          <h3>SAEE - Menu</h3>
          <p>Dashboard</p>
          <p>Agenda</p>
          <p>Pacientes</p>
          <p>Financeiro</p>
          <p>CRM</p>
          <p>Relatórios</p>
        </Box>
      </Drawer>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
          },
        }}
      >
        <Box p={2}>
          <h3>SAEE - Menu</h3>
          <p>Dashboard</p>
          <p>Agenda</p>
          <p>Pacientes</p>
          <p>Financeiro</p>
          <p>CRM</p>
          <p>Relatórios</p>
        </Box>
      </Drawer>
    </>
  );
};

export default Sidebar;
