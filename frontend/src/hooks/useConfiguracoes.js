import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';

// Hook para gerenciar configurações do sistema
export const useConfiguracoes = () => {
  const [configuracoes, setConfiguracoes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Configurações padrão - usando useMemo para evitar re-renders
  const configuracoesPadrao = useMemo(() => ({
    clinica: {
      nome: 'ALTCLINIC',
      cnpj: '',
      endereco: '',
      telefone: '',
      email: '',
      logo: null
    },
    sistema: {
      tema: 'light',
      idioma: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      formatoData: 'DD/MM/YYYY',
      formatoHora: 'HH:mm'
    },
    notificacoes: {
      email: {
        habilitado: true,
        lembretes: true,
        confirmacoes: true,
        cancelamentos: true
      },
      whatsapp: {
        habilitado: false,
        lembretes: false,
        confirmacoes: false
      },
      sms: {
        habilitado: false,
        lembretes: false
      }
    },
    integracoes: {
      whatsapp: {
        habilitado: false,
        numero: '',
        status: 'desconectado',
        qrCode: null
      },
      googleCalendar: {
        habilitado: false,
        calendarioId: ''
      },
      pagSeguro: {
        habilitado: false,
        email: '',
        token: ''
      }
    },
    agendamento: {
      duracaoPadrao: 60, // minutos
      intervaloEntreConsultas: 15, // minutos
      diasAntecedenciaMaxima: 90,
      horarioInicio: '08:00',
      horarioFim: '18:00',
      diasFuncionamento: [1, 2, 3, 4, 5], // segunda a sexta
      feriados: []
    },
    financeiro: {
      moeda: 'BRL',
      formaPagamentoPadrao: 'dinheiro',
      taxaCancelamento: 50,
      prazoPagamento: 30, // dias
      jurosMulta: 2 // %
    },
    privacidade: {
      lgpd: {
        consentimentoObrigatorio: true,
        retencaoDados: 5, // anos
        compartilhamentoDados: false
      },
      backup: {
        automatico: true,
        frequencia: 'diario',
        retencao: 30 // dias
      }
    }
  }), []);

  // Carregar configurações
  const carregarConfiguracoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulação de carregamento - em produção seria uma chamada real
      const response = await fetch('/api/configuracoes', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        // Se não conseguir carregar, usar configurações padrão
        setConfiguracoes(configuracoesPadrao);
        return;
      }

      const data = await response.json();
      setConfiguracoes({ ...configuracoesPadrao, ...data });

    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      setError(err.message);
      // Em caso de erro, usar configurações padrão
      setConfiguracoes(configuracoesPadrao);
    } finally {
      setLoading(false);
    }
  }, [configuracoesPadrao]);

  // Salvar configurações
  const salvarConfiguracoes = useCallback(async (novasConfiguracoes) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(novasConfiguracoes)
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar configurações');
      }

      const data = await response.json();
      setConfiguracoes(data);
      toast.success('Configurações salvas com sucesso!');

      return data;

    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      setError(err.message);
      toast.error('Erro ao salvar configurações');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Exportar configurações
  const exportarConfiguracoes = useCallback(async () => {
    try {
      const dataStr = JSON.stringify(configuracoes, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

      const exportFileDefaultName = `configuracoes-altclinic-${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      toast.success('Configurações exportadas com sucesso!');

    } catch (err) {
      console.error('Erro ao exportar configurações:', err);
      toast.error('Erro ao exportar configurações');
    }
  }, [configuracoes]);

  // Importar configurações
  const importarConfiguracoes = useCallback(async (arquivo) => {
    try {
      setLoading(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importedConfig = JSON.parse(e.target.result);

          // Validar estrutura básica
          if (!importedConfig || typeof importedConfig !== 'object') {
            throw new Error('Arquivo de configuração inválido');
          }

          // Mesclar com configurações padrão
          const configuracoesMescladas = { ...configuracoesPadrao, ...importedConfig };

          // Salvar as configurações importadas
          await salvarConfiguracoes(configuracoesMescladas);

          toast.success('Configurações importadas com sucesso!');

        } catch (parseErr) {
          console.error('Erro ao processar arquivo:', parseErr);
          toast.error('Arquivo de configuração inválido');
        } finally {
          setLoading(false);
        }
      };

      reader.readAsText(arquivo);

    } catch (err) {
      console.error('Erro ao importar configurações:', err);
      setError(err.message);
      toast.error('Erro ao importar configurações');
      setLoading(false);
    }
  }, [salvarConfiguracoes, configuracoesPadrao]);

  // Verificar status WhatsApp
  const verificarStatusWhatsApp = useCallback(async () => {
    try {
      const response = await fetch('/api/whatsapp/status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao verificar status do WhatsApp');
      }

      const status = await response.json();
      return status;

    } catch (err) {
      console.error('Erro ao verificar status WhatsApp:', err);
      throw err;
    }
  }, []);

  // Gerar QR Code WhatsApp
  const gerarQRCodeWhatsApp = useCallback(async () => {
    try {
      const response = await fetch('/api/whatsapp/qr', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar QR Code');
      }

      const qrData = await response.json();
      return qrData;

    } catch (err) {
      console.error('Erro ao gerar QR Code WhatsApp:', err);
      throw err;
    }
  }, []);

  // Carregar configurações na inicialização
  useEffect(() => {
    carregarConfiguracoes();
  }, [carregarConfiguracoes]);

  return {
    configuracoes,
    loading,
    error,
    salvarConfiguracoes,
    exportarConfiguracoes,
    importarConfiguracoes,
    verificarStatusWhatsApp,
    gerarQRCodeWhatsApp,
    carregarConfiguracoes
  };
};
