import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  AutoAwesome,
  Settings,
  Analytics,
  Group
} from '@mui/icons-material';
import SegmentacaoAutomatica from '../../components/crm/segmentacao/SegmentacaoAutomatica';

const SegmentacaoPage = () => {
  const [tabAtiva, setTabAtiva] = useState(0);

  const handleChangeTab = (event, newValue) => {
    setTabAtiva(newValue);
  };

  const TabPanel = ({ children, value, index, ...other }) => {
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`segmentacao-tabpanel-${index}`}
        aria-labelledby={`segmentacao-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ py: 3 }}>
            {children}
          </Box>
        )}
      </div>
    );
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sistema de Segmentação
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gerencie e analise segmentos de pacientes com inteligência artificial
        </Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabAtiva}
            onChange={handleChangeTab}
            aria-label="Tabs de segmentação"
          >
            <Tab
              icon={<AutoAwesome />}
              label="Segmentação Automática"
              id="segmentacao-tab-0"
              aria-controls="segmentacao-tabpanel-0"
            />
            <Tab
              icon={<Settings />}
              label="Segmentos Personalizados"
              id="segmentacao-tab-1"
              aria-controls="segmentacao-tabpanel-1"
            />
            <Tab
              icon={<Analytics />}
              label="Análise de Segmentos"
              id="segmentacao-tab-2"
              aria-controls="segmentacao-tabpanel-2"
            />
            <Tab
              icon={<Group />}
              label="Campanhas por Segmento"
              id="segmentacao-tab-3"
              aria-controls="segmentacao-tabpanel-3"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabAtiva} index={0}>
          <SegmentacaoAutomatica />
        </TabPanel>

        <TabPanel value={tabAtiva} index={1}>
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary">
              Segmentos Personalizados
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Funcionalidade em desenvolvimento
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tabAtiva} index={2}>
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary">
              Análise de Segmentos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Funcionalidade em desenvolvimento
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tabAtiva} index={3}>
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary">
              Campanhas por Segmento
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Funcionalidade em desenvolvimento
            </Typography>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default SegmentacaoPage;
