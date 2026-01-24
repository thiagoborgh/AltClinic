import React from 'react';
import {
  Button,
  CircularProgress
} from '@mui/material';

// Componente de botão com loading state integrado
const LoadingButton = ({
  loading = false,
  loadingText = 'Carregando...',
  disabled,
  children,
  startIcon,
  endIcon,
  ...buttonProps
}) => {
  const isDisabled = disabled || loading;

  return (
    <Button
      {...buttonProps}
      disabled={isDisabled}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : startIcon}
      endIcon={loading ? undefined : endIcon}
    >
      {loading ? loadingText : children}
    </Button>
  );
};

export default LoadingButton;