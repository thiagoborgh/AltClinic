import React from 'react';
import {
  Alert,
  AlertTitle,
  Typography,
  Button,
  Stack,
  Divider
} from '@mui/material';
import {
  ErrorOutline,
  LockOutlined,
  PersonOutline,
  BusinessOutlined,
  ContactSupportOutlined,
  RefreshOutlined
} from '@mui/icons-material';

const LoginErrorAlert = ({ error, onRetry, onForgotPassword, onContactSupport }) => {
  if (!error) return null;

  const getErrorConfig = () => {
    switch (error.errorType) {
      case 'INVALID_PASSWORD':
        return {
          severity: 'warning',
          icon: <LockOutlined />,
          title: 'Senha Incorreta',
          message: error.message || 'A senha informada está incorreta.',
          hint: error.hint || 'Verifique se a senha está correta. Lembre-se que ela é case-sensitive.',
          actions: [
            {
              label: 'Esqueci minha senha',
              action: onForgotPassword,
              variant: 'contained',
              color: 'primary'
            },
            {
              label: 'Tentar novamente',
              action: onRetry,
              variant: 'outlined'
            }
          ]
        };

      case 'USER_NOT_FOUND':
        return {
          severity: 'error',
          icon: <PersonOutline />,
          title: 'Usuário Não Encontrado',
          message: error.message || 'Email não encontrado em nenhuma clínica.',
          hint: error.hint || 'Verifique se o email está correto ou se você tem acesso ao sistema.',
          actions: [
            {
              label: 'Contatar Suporte',
              action: onContactSupport,
              variant: 'contained',
              color: 'primary'
            },
            {
              label: 'Tentar novamente',
              action: onRetry,
              variant: 'outlined'
            }
          ]
        };

      case 'TENANT_NOT_FOUND':
        return {
          severity: 'error',
          icon: <BusinessOutlined />,
          title: 'Clínica Não Encontrada',
          message: error.message || 'A clínica especificada não foi encontrada.',
          hint: error.hint || 'A clínica pode estar inativa ou o link pode estar incorreto.',
          actions: [
            {
              label: 'Contatar Suporte',
              action: onContactSupport,
              variant: 'contained',
              color: 'primary'
            }
          ]
        };

      default:
        return {
          severity: 'error',
          icon: <ErrorOutline />,
          title: 'Erro de Login',
          message: error.message || 'Erro inesperado ao fazer login.',
          hint: 'Tente novamente ou entre em contato com o suporte.',
          actions: [
            {
              label: 'Tentar novamente',
              action: onRetry,
              variant: 'contained',
              color: 'primary'
            },
            {
              label: 'Contatar Suporte',
              action: onContactSupport,
              variant: 'outlined'
            }
          ]
        };
    }
  };

  const config = getErrorConfig();

  return (
    <Alert 
      severity={config.severity}
      icon={config.icon}
      sx={{ 
        mb: 2,
        '& .MuiAlert-message': {
          width: '100%'
        }
      }}
    >
      <AlertTitle sx={{ fontWeight: 600 }}>
        {config.title}
      </AlertTitle>
      
      <Typography variant="body2" sx={{ mb: 1 }}>
        {config.message}
      </Typography>
      
      {config.hint && (
        <>
          <Divider sx={{ my: 1, opacity: 0.3 }} />
          <Typography 
            variant="body2" 
            sx={{ 
              fontStyle: 'italic',
              color: 'text.secondary',
              mb: 2
            }}
          >
            💡 {config.hint}
          </Typography>
        </>
      )}
      
      {config.actions && config.actions.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {config.actions.map((action, index) => (
            <Button
              key={index}
              size="small"
              variant={action.variant}
              color={action.color || 'inherit'}
              onClick={action.action}
              startIcon={
                action.label.includes('Suporte') ? <ContactSupportOutlined /> :
                action.label.includes('novamente') ? <RefreshOutlined /> : null
              }
            >
              {action.label}
            </Button>
          ))}
        </Stack>
      )}
    </Alert>
  );
};

export default LoginErrorAlert;