import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

function ListaAgendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [mensagem, setMensagem] = useState('');

  // Carregar agendamentos e profissionais
  useEffect(() => {
    // Carregar profissionais
    axios
      .get(`${API_URL}/profissionais`)
      .then(response => {
        const profissionaisFormatados = response.data.map(prof => ({
          ...prof,
          servicos: typeof prof.servicos === 'string' ? JSON.parse(prof.servicos) : prof.servicos,
          grade: typeof prof.grade === 'string' ? JSON.parse(prof.grade) : prof.grade,
        }));
        setProfissionais(profissionaisFormatados);
      })
      .catch(error => {
        console.error('Erro ao carregar profissionais:', error);
        setMensagem('Erro ao carregar profissionais.');
      });

    // Carregar agendamentos
    axios
      .get(`${API_URL}/agendamentos`)
      .then(response => {
        setAgendamentos(response.data);
      })
      .catch(error => {
        console.error('Erro ao carregar agendamentos:', error);
        setMensagem('Erro ao carregar agendamentos.');
      });
  }, []);

  // Excluir agendamento
  const handleDelete = async (id) => {
    if (window.confirm('Deseja excluir este agendamento?')) {
      try {
        const response = await axios.delete(`${API_URL}/agendamentos/${id}`);
        setMensagem(response.data.mensagem || 'Agendamento excluído com sucesso!');
        const updated = await axios.get(`${API_URL}/agendamentos`);
        setAgendamentos(updated.data);
      } catch (error) {
        setMensagem(error.response?.data?.erro || 'Erro ao excluir agendamento.');
        console.error('Erro ao excluir:', error);
      }
    }
  };

  // Obter o nome do profissional pelo ID
  const getNomeProfissional = (profissionalId) => {
    const profissional = profissionais.find(prof => prof.id === parseInt(profissionalId));
    return profissional ? profissional.nome : 'Desconhecido';
  };

  return (
    <main className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-700">Lista de Agendamentos</h2>
      {mensagem && (
        <p className={`mb-4 text-center font-bold ${mensagem.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>
          {mensagem}
        </p>
      )}
      {agendamentos.length === 0 ? (
        <p className="text-gray-600">Nenhum agendamento encontrado.</p>
      ) : (
        <ul className="space-y-2">
          {agendamentos.map(agendamento => (
            <li
              key={agendamento.id}
              className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-md"
            >
              <div>
                <strong className="text-gray-800">{agendamento.cliente}</strong> - 
                Profissional: {getNomeProfissional(agendamento.profissionalId)} - 
                Serviço: {agendamento.servico} - 
                Data: {agendamento.data} - 
                Horário: {agendamento.horario}
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => handleDelete(agendamento.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700"
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default ListaAgendamentos;