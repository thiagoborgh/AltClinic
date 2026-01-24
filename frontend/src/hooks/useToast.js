// Hook personalizado para feedback visual humanizado
// Substitui alerts por toasts coloridos com mensagens amigáveis

import toast, { Toaster } from 'react-hot-toast';
import { CheckCircle, Error, Warning, Info } from '@mui/icons-material';

// Tipos de toast disponíveis
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  LOADING: 'loading'
};

// Mapeamento de mensagens técnicas para mensagens humanizadas
const ERROR_MESSAGES = {
  // Erros de rede
  'Network Error': 'Sem conexão com a internet. Verifique sua conexão e tente novamente.',
  'timeout': 'A operação demorou muito para responder. Tente novamente.',
  'ECONNREFUSED': 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.',

  // Erros HTTP
  '400': 'Dados inválidos. Verifique as informações e tente novamente.',
  '401': 'Sessão expirada. Faça login novamente.',
  '403': 'Você não tem permissão para esta ação.',
  '404': 'Recurso não encontrado.',
  '409': 'Este item já existe ou foi modificado por outra pessoa.',
  '422': 'Dados inválidos. Verifique as informações preenchidas.',
  '429': 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
  '500': 'Erro interno do servidor. Nossa equipe foi notificada.',
  '502': 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.',
  '503': 'Serviço em manutenção. Tente novamente em alguns minutos.',

  // Erros específicos do WhatsApp
  'Session not found': 'WhatsApp desconectado. Reconecte na tela de configurações.',
  'Not connected': 'WhatsApp não está conectado. Verifique a conexão.',
  'QR Code expired': 'Código QR expirou. Gere um novo código.',
  'Invalid phone number': 'Número de telefone inválido. Verifique o formato.',
  'Message too long': 'Mensagem muito longa. Limite de 300 caracteres.',

  // Erros de validação
  'Validation failed': 'Alguns campos estão incorretos. Verifique os dados.',
  'Required field': 'Campo obrigatório não preenchido.',
  'Invalid format': 'Formato inválido. Verifique o campo.',
  'Duplicate entry': 'Este item já existe no sistema.',

  // Erros de agendamento
  'Time conflict': 'Horário indisponível. Escolha outro horário.',
  'Professional unavailable': 'Profissional indisponível neste horário.',
  'Past date': 'Não é possível agendar para datas passadas.',
  'Invalid time range': 'Horário fora do expediente.',

  // Erros genéricos
  'Unknown error': 'Algo deu errado. Tente novamente.',
  'Operation failed': 'Operação não pôde ser concluída. Tente novamente.',
  'Save failed': 'Não conseguimos salvar. Verifique os dados e tente novamente.',
  'Delete failed': 'Não conseguimos excluir. Tente novamente.',
  'Load failed': 'Não conseguimos carregar os dados. Tente recarregar a página.'
};

// Função para humanizar mensagens de erro
const humanizeError = (error) => {
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error;
  }

  if (error?.response?.data?.message) {
    const apiMessage = error.response.data.message;
    return ERROR_MESSAGES[apiMessage] || apiMessage;
  }

  if (error?.response?.status) {
    const statusCode = error.response.status.toString();
    return ERROR_MESSAGES[statusCode] || `Erro ${statusCode}. Tente novamente.`;
  }

  if (error?.message) {
    return ERROR_MESSAGES[error.message] || error.message;
  }

  return ERROR_MESSAGES['Unknown error'];
};

// Hook principal para feedback visual
export const useToast = () => {
  // Toast de sucesso
  const showSuccess = (message, options = {}) => {
    toast.success(message, {
      duration: 4000,
      position: 'top-right',
      icon: <CheckCircle sx={{ color: '#4caf50' }} />,
      style: {
        background: '#e8f5e8',
        color: '#2e7d32',
        border: '1px solid #4caf50',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 500,
      },
      ...options
    });
  };

  // Toast de erro
  const showError = (error, options = {}) => {
    const humanizedMessage = humanizeError(error);
    toast.error(humanizedMessage, {
      duration: 6000,
      position: 'top-right',
      icon: <Error sx={{ color: '#f44336' }} />,
      style: {
        background: '#ffebee',
        color: '#c62828',
        border: '1px solid #f44336',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 500,
      },
      ...options
    });
  };

  // Toast de aviso
  const showWarning = (message, options = {}) => {
    toast(message, {
      duration: 5000,
      position: 'top-right',
      icon: <Warning sx={{ color: '#ff9800' }} />,
      style: {
        background: '#fff3e0',
        color: '#e65100',
        border: '1px solid #ff9800',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 500,
      },
      ...options
    });
  };

  // Toast informativo
  const showInfo = (message, options = {}) => {
    toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: <Info sx={{ color: '#2196f3' }} />,
      style: {
        background: '#e3f2fd',
        color: '#0d47a1',
        border: '1px solid #2196f3',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 500,
      },
      ...options
    });
  };

  // Toast de loading (retorna ID para dismiss)
  const showLoading = (message = 'Carregando...', options = {}) => {
    return toast.loading(message, {
      position: 'top-center',
      style: {
        background: '#f5f5f5',
        color: '#424242',
        border: '1px solid #bdbdbd',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 500,
      },
      ...options
    });
  };

  // Dismiss toast específico
  const dismiss = (toastId) => {
    toast.dismiss(toastId);
  };

  // Dismiss todos os toasts
  const dismissAll = () => {
    toast.dismiss();
  };

  // Método compatibilidade com versão anterior
  const showToast = (message, type = 'success', options = {}) => {
    switch (type) {
      case 'success':
        return showSuccess(message, options);
      case 'error':
        return showError(message, options);
      case 'warning':
        return showWarning(message, options);
      case 'info':
        return showInfo(message, options);
      case 'loading':
        return showLoading(message, options);
      default:
        return showInfo(message, options);
    }
  };

  return {
    // Métodos novos
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    dismiss,
    dismissAll,

    // Método de compatibilidade
    showToast,
    dismissToast: dismiss,
    dismissAllToasts: dismissAll,

    // Métodos diretos para conveniência (compatibilidade)
    success: showSuccess,
    error: showError,
    loading: showLoading,
    warning: showWarning,
    info: showInfo
  };
};

// Componente Toaster para ser incluído no App
export const ToastContainer = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Configurações padrão para todos os toasts
        duration: 4000,
        style: {
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 500,
        },
      }}
    />
  );
};
