import { useState } from 'react';

// Estrutura de mensagem: { id, pacienteId, canal, mensagem, data, status, modo }
const useMensagens = () => {
  const [mensagens, setMensagens] = useState([]);

  const enviarMensagemManual = ({ pacienteId, canal, mensagem, modo = 'manual' }) => {
    const novaMsg = {
      id: Date.now(),
      pacienteId,
      canal,
      mensagem,
      data: new Date().toISOString(),
      status: modo === 'api' ? 'enviado_api' : 'enviado',
      modo
    };
    setMensagens(prev => [novaMsg, ...prev]);
  };

  const listarMensagens = (filtro = {}) => {
    return mensagens.filter(msg => {
      if (filtro.pacienteId && msg.pacienteId !== filtro.pacienteId) return false;
      if (filtro.canal && msg.canal !== filtro.canal) return false;
      return true;
    });
  };

  return {
    mensagens,
    enviarMensagemManual,
    listarMensagens
  };
};
export default useMensagens;
