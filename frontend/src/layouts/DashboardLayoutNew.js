import React, { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import { PacienteProvider } from '../contexts/PacienteContext';

const DashboardLayoutContent = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMobileClose = () => {
    setMobileOpen(false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Navbar */}
      <Navbar onMenuClick={handleDrawerToggle} />
      
      {/* Sidebar */}
      <Sidebar 
        mobileOpen={mobileOpen} 
        onMobileClose={handleMobileClose}
      />
      
      {/* Conteúdo principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { 
            xs: '100%', 
            md: `calc(100% - 240px)` 
          },
          ml: { 
            xs: 0, 
            md: '240px' 
          },
          mt: 8, // Espaço para o Navbar
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: 'background.default',
          p: 3, // Padding interno para o conteúdo
          overflow: 'auto'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

const DashboardLayout = () => {
  return (
    <PacienteProvider>
      <DashboardLayoutContent />
    </PacienteProvider>
  );
};

export default DashboardLayout;
