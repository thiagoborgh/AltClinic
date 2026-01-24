import React, { Suspense } from 'react';
import { Dialog, CircularProgress, Box } from '@mui/material';

// Componente base para lazy loading de modais
const LazyModal = ({ open, onClose, children, maxWidth = 'sm', fullWidth = true, ...props }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      {...props}
    >
      <Suspense fallback={
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200,
          p: 3
        }}>
          <CircularProgress />
        </Box>
      }>
        {children}
      </Suspense>
    </Dialog>
  );
};

// Lazy loaded components
export const LazyModalAgendamento = React.lazy(() =>
  import('../ModalAgendamento').then(module => ({ default: module.default }))
);

export const LazyModalListaEspera = React.lazy(() =>
  import('../ModalListaEspera').then(module => ({ default: module.default }))
);

export const LazyConfiguracaoGrade = React.lazy(() =>
  import('../ConfiguracaoGrade').then(module => ({ default: module.default }))
);

export default LazyModal;