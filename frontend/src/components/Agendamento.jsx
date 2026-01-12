import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaClock, FaUser, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Navbar from './Navbar';
import { API_URL } from '../config';

function Agendamento() {
  const [profissionais, setProfissionais] = useState([]);
  const [profissionalSelecionado, setProfissionalSelecionado] = useState('');
  const [grade, setGrade] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [mensagem, setMensagem] = useState('');
  const [viewMode, setViewMode] = useState('mensal');

  useEffect(() => {
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

  useEffect(() => {
    if (profissionalSelecionado) {
      const profissional = profissionais.find(p => p.id === parseInt(profissionalSelecionado));
      if (profissional && profissional.grade) {
        const gradeData = typeof profissional.grade === 'string' ? JSON.parse(profissional.grade) : profissional.grade;
        setGrade(gradeData);
      } else {
        setGrade([]);
      }
      setDataSelecionada(new Date());
      setHorariosDisponiveis([]);
    }
  }, [profissionalSelecionado, profissionais]);

  const getHorariosDia = (date) => {
    if (!grade || grade.length === 0) return { disponivel: false, horarios: [] };

    const diaSemana = date.toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
    const diaGrade = grade.find(g => g.dia_semana === diaSemana.split('-')[0]);

    if (!diaGrade || !diaGrade.de || !diaGrade.ate) return { disponivel: false, horarios: [] };

    const dataAtual = date;
    const vigenteDesde = diaGrade.vigenteDesde ? new Date(diaGrade.vigenteDesde) : null;
    const vigenteAte = diaGrade.vigenteAte ? new Date(diaGrade.vigenteAte) : null;

    if (!diaGrade.sempre) {
      if (vigenteDesde && dataAtual < vigenteDesde) return { disponivel: false, horarios: [] };
      if (vigenteAte && dataAtual > vigenteAte) return { disponivel: false, horarios: [] };
    }

    const [horaInicio, minutoInicio] = diaGrade.de.split(':').map(Number);
    const [horaFim, minutoFim] = diaGrade.ate.split(':').map(Number);
    const intervaloMinutos = parseInt(diaGrade.gradeMin);

    const horarios = [];
    let horaAtual = horaInicio * 60 + minutoInicio;
    const horaFimTotal = horaFim * 60 + minutoFim;

    while (horaAtual + intervaloMinutos <= horaFimTotal) {
      const hora = Math.floor(horaAtual / 60);
      const minuto = horaAtual % 60;
      const horarioFormatado = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
      horarios.push(horarioFormatado);
      horaAtual += intervaloMinutos;
    }

    return { disponivel: true, horarios };
  };

  useEffect(() => {
    if (viewMode !== 'diaria') return;
    const { horarios } = getHorariosDia(dataSelecionada);
    setHorariosDisponiveis(horarios);
  }, [dataSelecionada, grade, viewMode]);

  const renderCalendarioMensal = () => {
    const hoje = new Date();
    const mesAtual = dataSelecionada.getMonth();
    const anoAtual = dataSelecionada.getFullYear();
    const primeiroDia = new Date(anoAtual, mesAtual, 1);
    const ultimoDia = new Date(anoAtual, mesAtual + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaInicio = primeiroDia.getDay();

    const dias = [];
    for (let i = 0; i < diaInicio; i++) {
      dias.push(<div key={`empty-${i}`} className="p-4"></div>);
    }

    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dataAtual = new Date(anoAtual, mesAtual, dia);
      const { disponivel } = getHorariosDia(dataAtual);
      const isSelecionada = dataAtual.toDateString() === dataSelecionada.toDateString();
      const isPassado = dataAtual < hoje.setHours(0, 0, 0, 0);

      dias.push(
        <button
          key={dia}
          disabled={!disponivel || isPassado}
          onClick={() => {
            setDataSelecionada(new Date(anoAtual, mesAtual, dia));
            setViewMode('diaria');
          }}
          className={`p-4 rounded-md text-lg font-medium transition-all duration-200 
            ${isSelecionada ? 'bg-blue-500 text-white' : disponivel && !isPassado ? 'bg-green-100 hover:bg-green-200 text-green-800' : 'text-gray-400 cursor-not-allowed'}`}
        >
          {dia}
        </button>
      );
    }

    return dias;
  };

  const renderCalendarioSemanal = () => {
    const hoje = new Date();
    const inicioSemana = new Date(dataSelecionada);
    const diaSemana = dataSelecionada.getDay();
    inicioSemana.setDate(dataSelecionada.getDate() - diaSemana);

    const diasSemana = [];
    for (let i = 0; i < 7; i++) {
      const dataAtual = new Date(inicioSemana);
      dataAtual.setDate(inicioSemana.getDate() + i);
      const { disponivel, horarios } = getHorariosDia(dataAtual);
      const isSelecionada = dataAtual.toDateString() === dataSelecionada.toDateString();
      const isPassado = dataAtual < hoje.setHours(0, 0, 0, 0);

      diasSemana.push(
        <div key={i} className="flex-1 border-r last:border-r-0">
          <button
            onClick={() => {
              setDataSelecionada(dataAtual);
              setViewMode('diaria');
            }}
            className={`w-full p-2 text-center font-semibold ${isSelecionada ? 'bg-blue-500 text-white' : 'bg-gray-50'}`}
          >
            {dataAtual.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })}
          </button>
          <div className="p-2">
            {disponivel && !isPassado ? (
              horarios.map((horario, index) => (
                <button
                  key={index}
                  onClick={() => handleAgendar(horario, dataAtual)}
                  className="block w-full text-left p-1 text-sm text-blue-800 hover:bg-blue-100 rounded"
                >
                  {horario}
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-400">Indisponível</p>
            )}
          </div>
        </div>
      );
    }

    return diasSemana;
  };

  const renderCalendarioDiaria = () => {
    const hoje = new Date();
    const isPassado = dataSelecionada < hoje.setHours(0, 0, 0, 0);
    const { disponivel } = getHorariosDia(dataSelecionada);

    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setDataSelecionada(new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth(), dataSelecionada.getDate() - 1))}
            className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
          >
            <FaChevronLeft />
          </button>
          <span className="text-xl font-semibold">
            {dataSelecionada.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => setDataSelecionada(new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth(), dataSelecionada.getDate() + 1))}
            className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
          >
            <FaChevronRight />
          </button>
        </div>
        <div className="mt-4">
          {disponivel && !isPassado ? (
            horariosDisponiveis.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {horariosDisponiveis.map((horario, index) => (
                  <button
                    key={index}
                    onClick={() => handleAgendar(horario, dataSelecionada)}
                    className="p-3 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  >
                    {horario}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhum horário disponível para este dia.</p>
            )
          ) : (
            <p className="text-sm text-gray-500">Dia indisponível.</p>
          )}
        </div>
      </div>
    );
  };

  const handleAgendar = async (horario, data) => {
    const profissional = profissionais.find(p => p.id === parseInt(profissionalSelecionado));
    const novoAgendamento = {
      data: data.toISOString().split('T')[0],
      horario,
      profissionalId: parseInt(profissionalSelecionado),
      paciente: "Paciente Exemplo",
    };

    try {
      await axios.post(`${API_URL}/agendamentos`, novoAgendamento);
      setMensagem(`Agendamento confirmado para ${data.toLocaleDateString('pt-BR')} às ${horario} com o profissional ${profissional.nome}.`);
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      setMensagem('Erro ao salvar agendamento.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Navbar />
      <main className="flex-1 p-6 overflow-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-700">Agendamento</h2>
        {mensagem && (
          <p className={`mb-6 text-center text-sm font-medium ${mensagem.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>
            {mensagem}
          </p>
        )}
        <div className="flex flex-col lg:flex-row gap-6">
          {profissionalSelecionado && (
            <div className="lg:w-2/3">
              <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewMode('mensal')}
                    className={`px-4 py-2 rounded-md ${viewMode === 'mensal' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Mensal
                  </button>
                  <button
                    onClick={() => setViewMode('semanal')}
                    className={`px-4 py-2 rounded-md ${viewMode === 'semanal' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Semanal
                  </button>
                  <button
                    onClick={() => setViewMode('diaria')}
                    className={`px-4 py-2 rounded-md ${viewMode === 'diaria' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Diária
                  </button>
                </div>
                {viewMode !== 'diaria' && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setDataSelecionada(
                          viewMode === 'mensal'
                            ? new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth() - 1, 1)
                            : new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth(), dataSelecionada.getDate() - 7)
                        )
                      }
                      className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
                    >
                      <FaChevronLeft />
                    </button>
                    <span className="text-xl font-semibold">
                      {viewMode === 'mensal'
                        ? dataSelecionada.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                        : `${dataSelecionada.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })} - ${(new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth(), dataSelecionada.getDate() + 6)).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                    </span>
                    <button
                      onClick={() =>
                        setDataSelecionada(
                          viewMode === 'mensal'
                            ? new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth() + 1, 1)
                            : new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth(), dataSelecionada.getDate() + 7)
                        )
                      }
                      className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                )}
              </div>

              {viewMode === 'mensal' && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, index) => (
                      <div key={index} className="py-2 font-semibold text-gray-600 border-b">
                        {dia}
                      </div>
                    ))}
                    {renderCalendarioMensal()}
                  </div>
                </div>
              )}

              {viewMode === 'semanal' && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex border-b">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, index) => (
                      <div key={index} className="flex-1 text-center py-2 font-semibold text-gray-600">
                        {dia}
                      </div>
                    ))}
                  </div>
                  <div className="flex">{renderCalendarioSemanal()}</div>
                </div>
              )}

              {viewMode === 'diaria' && renderCalendarioDiaria()}
            </div>
          )}

          <div className="lg:w-1/3 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <label htmlFor="profissional" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FaUser className="mr-2" /> Profissional
              </label>
              <select
                id="profissional"
                value={profissionalSelecionado}
                onChange={(e) => setProfissionalSelecionado(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um profissional</option>
                {profissionais.map(profissional => (
                  <option key={profissional.id} value={profissional.id}>
                    {profissional.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Agendamento;