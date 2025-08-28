import { useState, useEffect } from 'react';

// Hook para configuração e status da integração API
const useConfiguracaoAPI = () => {
  const [apiAtiva, setApiAtiva] = useState(false);
  const [chaveAPI, setChaveAPI] = useState('');
  const [statusConexao, setStatusConexao] = useState('desconectado'); // desconectado, conectando, conectado, erro

  // Carregar configuração do localStorage
  useEffect(() => {
    const config = localStorage.getItem('configAPI');
    if (config) {
      const { ativa, chave } = JSON.parse(config);
      setApiAtiva(ativa);
      setChaveAPI(chave);
      if (ativa && chave) {
        verificarConexao(chave);
      }
    }
  }, []);

  const verificarConexao = async (chave) => {
    setStatusConexao('conectando');
    try {
      // Simulação de verificação da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Mock: se chave tem mais de 10 caracteres, considera válida
      if (chave && chave.length > 10) {
        setStatusConexao('conectado');
      } else {
        setStatusConexao('erro');
      }
    } catch (error) {
      setStatusConexao('erro');
    }
  };

  const salvarConfiguracao = (chave, ativa) => {
    setChaveAPI(chave);
    setApiAtiva(ativa);
    
    const config = { ativa, chave };
    localStorage.setItem('configAPI', JSON.stringify(config));
    
    if (ativa && chave) {
      verificarConexao(chave);
    } else {
      setStatusConexao('desconectado');
    }
  };

  const desativarAPI = () => {
    salvarConfiguracao('', false);
  };

  return {
    apiAtiva,
    chaveAPI,
    statusConexao,
    salvarConfiguracao,
    desativarAPI,
    verificarConexao
  };
};

export default useConfiguracaoAPI;
