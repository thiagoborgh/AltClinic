import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import { FaPlus, FaFilter, FaCalendarAlt } from 'react-icons/fa';


function Agenda() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [filtroData, setFiltroData] = useState('');
  const [filtroProfissional, setFiltroProfissional] = useState('');
  const [profissionais, setProfissionais] = useState([]);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    axios
      .get(`${API_URL}/agendamentos`)
      .then(response => {
        setAgendamentos(response.data);
      })
      .catch(error => {
        console.error('Erro ao carregar agendamentos:', error);
        setMensagem('Erro ao carregar agendamentos. Verifique se o backend está funcionando.');
      });

    axios
      .get(`${API_URL}/profissionais`)
      .then(response => {
        setProfissionais(response.data);
      })
      .catch(error => {
        console.error('Erro ao carregar profissionais:', error);
        setMensagem('Erro ao carregar profissionais.');
      });
  }, []);

  const agendamentosFiltrados = agendamentos.filter(agendamento => {
    const dataMatch = filtroData ? new Date(agendamento.data).toISOString().split('T')[0] === filtroData : true;
    const profissionalMatch = filtroProfissional ? agendamento.profissionalId === parseInt(filtroProfissional) : true;
    return dataMatch && profissionalMatch;
  });

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Agenda</h2>
          <Link
            to="/agendamento"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <FaPlus className="mr-2" /> Novo Agendamento
          </Link>
        </div>

        {mensagem && (
          <p className={`mb-4 text-center text-sm font-medium ${mensagem.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>
            {mensagem}
          </p>
        )}

        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="filtroData" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FaCalendarAlt className="mr-2" /> Filtrar por Data
              </label>
              <input
                type="date"
                id="filtroData"
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="filtroProfissional" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FaFilter className="mr-2" /> Filtrar por Profissional
              </label>
              <select
                id="filtroProfissional"
                value={filtroProfissional}
                onChange={(e) => setFiltroProfissional(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os Profissionais</option>
                {profissionais.map(profissional => (
                  <option key={profissional.id} value={profissional.id}>
                    {profissional.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Agendamentos</h3>
          {agendamentosFiltrados.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 text-sm font-semibold text-gray-600">Data</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Horário</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Profissional</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Paciente</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {agendamentosFiltrados.map(agendamento => (
                    <tr key={agendamento.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{new Date(agendamento.data).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3">{agendamento.horario}</td>
                      <td className="p-3">
                        {profissionais.find(p => p.id === agendamento.profissionalId)?.nome || 'Desconhecido'}
                      </td>
                      <td className="p-3">{agendamento.paciente || 'Não informado'}</td>
                      <td className="p-3">
                        <Link
                          to={`/agendamento?edit=${agendamento.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Nenhum agendamento encontrado.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default Agenda;