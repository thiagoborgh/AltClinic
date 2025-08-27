import toast from 'react-hot-toast';

export const useToast = () => {
  const showToast = (message, type = 'success', options = {}) => {
    const defaultOptions = {
      duration: 4000,
      position: 'top-right',
      ...options
    };

    switch (type) {
      case 'success':
        return toast.success(message, defaultOptions);
      case 'error':
        return toast.error(message, defaultOptions);
      case 'loading':
        return toast.loading(message, defaultOptions);
      case 'warning':
        return toast(message, {
          icon: '⚠️',
          ...defaultOptions
        });
      case 'info':
        return toast(message, {
          icon: 'ℹ️',
          ...defaultOptions
        });
      default:
        return toast(message, defaultOptions);
    }
  };

  const dismissToast = (toastId) => {
    toast.dismiss(toastId);
  };

  const dismissAllToasts = () => {
    toast.dismiss();
  };

  return {
    showToast,
    dismissToast,
    dismissAllToasts,
    // Métodos diretos para conveniência
    success: (message, options) => showToast(message, 'success', options),
    error: (message, options) => showToast(message, 'error', options),
    loading: (message, options) => showToast(message, 'loading', options),
    warning: (message, options) => showToast(message, 'warning', options),
    info: (message, options) => showToast(message, 'info', options)
  };
};
