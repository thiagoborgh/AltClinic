import { useState, useCallback, useEffect } from 'react';

export const useConfiguracoes = () => {
  const [configuracoes, setConfiguracoes] = useState({
    // Integrações Externas
    integracoes: {
      whatsapp: {
        token: '',
        phone_number_id: '',
        webhook_verify_token: '',
        qrCode: '',
        status: 'desconectado' // desconectado, conectando, conectado, erro
      },
      pix: {
        chave: '',
        titular: '',
        banco: '',
        agencia: '',
        conta: '',
        tipo_chave: 'email' // email, telefone, cpf, cnpj, aleatoria
      },
      gemini: {
        api_key: '',
        modelo: 'gemini-pro',
        ativo: false
      },
      huggingface: {
        api_key: '',
        modelo: 'microsoft/DialoGPT-medium',
        ativo: false
      },
      mailchimp: {
        api_key: '',
        list_id: '',
        from_email: '',
        from_name: '',
        smtp_server: '',
        smtp_port: 587,
        ativo: false
      }
    },
    
    // Clínica e Operações
    clinica: {
      informacoes: {
        nome: '',
        cnpj: '',
        endereco: '',
        telefone: '',
        email: '',
        responsavel_tecnico: ''
      },
      horarios: {
        funcionamento: {
          segunda: { inicio: '08:00', fim: '18:00', ativo: true },
          terca: { inicio: '08:00', fim: '18:00', ativo: true },
          quarta: { inicio: '08:00', fim: '18:00', ativo: true },
          quinta: { inicio: '08:00', fim: '18:00', ativo: true },
          sexta: { inicio: '08:00', fim: '18:00', ativo: true },
          sabado: { inicio: '08:00', fim: '12:00', ativo: false },
          domingo: { inicio: '08:00', fim: '12:00', ativo: false }
        },
        intervalo_consulta: 30, // minutos
        antecedencia_minima: 60, // minutos
        antecedencia_maxima: 90 // dias
      },
      procedimentos: [],
      equipamentos: [],
      especialidades: []
    },
    
    // Templates e CRM
    templates: {
      mensagens: {
        boas_vindas: 'Olá! Bem-vindo(a) à nossa clínica. Como podemos ajudá-lo(a)?',
        confirmacao_agendamento: 'Seu agendamento foi confirmado para {data} às {hora}.',
        lembrete_consulta: 'Lembrete: Você tem consulta amanhã às {hora}.',
        cancelamento: 'Seu agendamento foi cancelado. Entre em contato para reagendar.',
        pos_consulta: 'Obrigado por sua visita! Como foi sua experiência?'
      },
      anamnese: {
        campos_obrigatorios: ['nome', 'idade', 'queixa_principal'],
        campos_opcionais: ['historico_familiar', 'medicamentos', 'alergias'],
        perguntas_personalizadas: []
      },
      emails: {
        confirmacao: {
          assunto: 'Agendamento Confirmado',
          corpo: 'Seu agendamento foi confirmado...'
        },
        lembrete: {
          assunto: 'Lembrete de Consulta',
          corpo: 'Você tem uma consulta agendada...'
        }
      },
      periodo_inatividade: 90 // dias
    },
    
    // Segurança e Privacidade
    seguranca: {
      lgpd: {
        consentimento_padrao: 'Autorizo o uso dos meus dados pessoais...',
        politica_privacidade: '',
        termos_uso: '',
        responsavel_dados: '',
        dpo_email: ''
      },
      backup: {
        automatico: true,
        frequencia: 'diaria', // diaria, semanal, mensal
        retencao: 30, // dias
        local: 'local' // local, nuvem
      },
      auditoria: {
        log_acessos: true,
        log_modificacoes: true,
        retencao_logs: 365 // dias
      }
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Função para mapear dados da API para a estrutura frontend
  const mapearDadosAPI = (dadosAPI) => {
    console.log('🔍 Mapeando dados da API:', dadosAPI);
    
    if (!dadosAPI || !dadosAPI.data) {
      console.warn('⚠️ Dados da API vazios ou inválidos');
      return;
    }
    
    const { ai, whatsapp, pix, clinica } = dadosAPI.data;
    console.log('📊 Seções disponíveis:', { ai: !!ai, whatsapp: !!whatsapp, pix: !!pix, clinica: !!clinica });
    
    setConfiguracoes(prev => ({
      ...prev,
      integracoes: {
        ...prev.integracoes,
        whatsapp: {
          ...prev.integracoes.whatsapp,
          token: whatsapp?.api_token?.valor || '',
          phone_number_id: whatsapp?.numero_telefone?.valor || '',
          webhook_verify_token: whatsapp?.webhook_token?.valor || ''
        },
        pix: {
          ...prev.integracoes.pix,
          chave: pix?.chave_pix?.valor || '',
          titular: pix?.titular?.valor || '',
          banco: pix?.banco?.valor || ''
        },
        gemini: {
          ...prev.integracoes.gemini,
          api_key: ai?.gemini_api_key?.valor || '',
          ativo: Boolean(ai?.gemini_api_key?.valor)
        },
        huggingface: {
          ...prev.integracoes.huggingface,
          api_key: ai?.huggingface_api_key?.valor || '',
          ativo: Boolean(ai?.huggingface_api_key?.valor)
        }
      },
      clinica: {
        ...prev.clinica,
        informacoes: {
          ...prev.clinica.informacoes,
          nome: clinica?.nome?.valor || '',
          cnpj: clinica?.cnpj?.valor || '',
          endereco: clinica?.endereco?.valor || '',
          telefone: clinica?.telefone?.valor || '',
          email: clinica?.email?.valor || ''
        }
      }
    }));
  };

  // Carregar configurações do servidor
  const carregarConfiguracoes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/configuracoes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar configurações');
      }
      
      const data = await response.json();
      console.log('Dados carregados da API:', data);
      mapearDadosAPI(data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar configurações:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // useEffect para carregar configurações ao montar o componente
  useEffect(() => {
    carregarConfiguracoes();
  }, [carregarConfiguracoes]);

  // Salvar configurações no servidor
  const salvarConfiguracoes = useCallback(async (novasConfiguracoes = configuracoes) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/configuracoes', {
        method: 'POST',
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
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [configuracoes]);

  // Atualizar uma seção específica das configurações
  const atualizarSecao = useCallback((secao, dados) => {
    setConfiguracoes(prev => ({
      ...prev,
      [secao]: {
        ...prev[secao],
        ...dados
      }
    }));
  }, []);

  // Atualizar um campo específico
  const atualizarCampo = useCallback((caminho, valor) => {
    setConfiguracoes(prev => {
      const novasConfiguracoes = { ...prev };
      const caminhoArray = caminho.split('.');
      let atual = novasConfiguracoes;
      
      for (let i = 0; i < caminhoArray.length - 1; i++) {
        if (!atual[caminhoArray[i]]) {
          atual[caminhoArray[i]] = {};
        }
        atual = atual[caminhoArray[i]];
      }
      
      atual[caminhoArray[caminhoArray.length - 1]] = valor;
      return novasConfiguracoes;
    });
  }, []);

  // Testar integrações
  const testarIntegracao = useCallback(async (tipo, dados) => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/configuracoes/testar/${tipo}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(dados)
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao testar ${tipo}`);
      }
      
      const resultado = await response.json();
      return resultado;
    } catch (err) {
      throw new Error(`Falha no teste de ${tipo}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Verificar status da conexão WhatsApp
  const verificarStatusWhatsApp = useCallback(async () => {
    try {
      const response = await fetch('/api/configuracoes/whatsapp/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao verificar status');
      }
      
      const data = await response.json();
      
      // Atualizar status nas configurações
      if (data.conectado) {
        setConfiguracoes(prev => ({
          ...prev,
          integracoes: {
            ...prev.integracoes,
            whatsapp: {
              ...prev.integracoes.whatsapp,
              status: 'conectado',
              numero: data.numero,
              nome: data.nome,
              qrCode: '' // Limpar QR code quando conectado
            }
          }
        }));
      } else {
        setConfiguracoes(prev => ({
          ...prev,
          integracoes: {
            ...prev.integracoes,
            whatsapp: {
              ...prev.integracoes.whatsapp,
              status: 'desconectado',
              erro: data.erro
            }
          }
        }));
      }
      
      return data;
    } catch (err) {
      throw new Error(`Erro ao verificar status: ${err.message}`);
    }
  }, []);

  // Gerar QR Code para WhatsApp
  const gerarQRCodeWhatsApp = useCallback(async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/configuracoes/whatsapp/qr', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao gerar QR Code');
      }
      
      const data = await response.json();
      
      // Atualizar QR Code nas configurações
      setConfiguracoes(prev => ({
        ...prev,
        integracoes: {
          ...prev.integracoes,
          whatsapp: {
            ...prev.integracoes.whatsapp,
            qrCode: data.qrCode,
            status: 'conectando'
          }
        }
      }));
      
      return data.qrCode;
    } catch (err) {
      atualizarCampo('integracoes.whatsapp.status', 'erro');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [atualizarCampo]);

  // Exportar configurações
  const exportarConfiguracoes = useCallback(async () => {
    try {
      // Remover dados sensíveis para exportação
      const configuracoesExportacao = {
        ...configuracoes,
        integracoes: {
          ...configuracoes.integracoes,
          whatsapp: {
            ...configuracoes.integracoes.whatsapp,
            token: '***',
            webhook_verify_token: '***'
          },
          gemini: {
            ...configuracoes.integracoes.gemini,
            api_key: '***'
          },
          huggingface: {
            ...configuracoes.integracoes.huggingface,
            api_key: '***'
          },
          mailchimp: {
            ...configuracoes.integracoes.mailchimp,
            api_key: '***'
          }
        }
      };
      
      return {
        ...configuracoesExportacao,
        export_info: {
          data: new Date().toISOString(),
          versao: '1.0.0',
          tipo: 'configuracoes_saee'
        }
      };
    } catch (err) {
      throw new Error(`Erro ao exportar configurações: ${err.message}`);
    }
  }, [configuracoes]);

  // Importar configurações
  const importarConfiguracoes = useCallback(async (dadosImportacao) => {
    try {
      // Validar formato
      if (!dadosImportacao.export_info || dadosImportacao.export_info.tipo !== 'configuracoes_saee') {
        throw new Error('Arquivo de configuração inválido');
      }
      
      // Remover informações de exportação
      const { export_info, ...configuracaoImportada } = dadosImportacao;
      
      // Mesclar com configurações atuais (não sobrescrever chaves de API por segurança)
      const novasConfiguracoes = {
        ...configuracoes,
        ...configuracaoImportada,
        integracoes: {
          ...configuracoes.integracoes,
          ...configuracaoImportada.integracoes,
          // Manter chaves atuais se estiverem mascaradas na importação
          whatsapp: {
            ...configuracaoImportada.integracoes?.whatsapp,
            token: configuracaoImportada.integracoes?.whatsapp?.token === '***' 
              ? configuracoes.integracoes.whatsapp.token 
              : configuracaoImportada.integracoes?.whatsapp?.token || '',
            webhook_verify_token: configuracaoImportada.integracoes?.whatsapp?.webhook_verify_token === '***'
              ? configuracoes.integracoes.whatsapp.webhook_verify_token
              : configuracaoImportada.integracoes?.whatsapp?.webhook_verify_token || ''
          }
        }
      };
      
      // Salvar configurações importadas
      await salvarConfiguracoes(novasConfiguracoes);
      
      return novasConfiguracoes;
    } catch (err) {
      throw new Error(`Erro ao importar configurações: ${err.message}`);
    }
  }, [configuracoes, salvarConfiguracoes]);

  return {
    configuracoes,
    loading,
    error,
    carregarConfiguracoes,
    salvarConfiguracoes,
    atualizarSecao,
    atualizarCampo,
    testarIntegracao,
    verificarStatusWhatsApp,
    gerarQRCodeWhatsApp,
    exportarConfiguracoes,
    importarConfiguracoes
  };
};
