import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { API_URL } from '../config';

function Agendamento() {
  const [profissionais, setProfissionais] = useState([]);
  const [formData, setFormData] = useState({
    cliente: '',
    profissionalId: '',
    procedimento: '',
    data: '',
    horario: '',
  });
  const [mensagem, setMensagem] = useState('');
  const [datasDisponiveis, setDatasDisponiveis] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [procedimentos, setProcedimentos] = useState([]);
  const navigate = useNavigate();

  // Carregar profissionais
  useEffect(() => {
    axios
      .get(`${API_URL}/profissionais`)
      .then(response => {
        console.log('Dados recebidos de /profissionais:', response.data);
        const profissionaisFormatados = response.data.map(prof => ({
          ...prof,
          procedimentos: typeof prof.procedimentos === 'string' ? JSON.parse(prof.procedimentos) : prof.procedimentos,
          grade: typeof prof.grade === 'string' ? JSON.parse(prof.grade) : prof.grade,
        }));
        console.log('Profissionais formatados:', profissionaisFormatados);
        setProfissionais(profissionaisFormatados);
      })
      .catch(error => {
        console.error('Erro ao carregar profissionais:', error);
        console.log('Detalhes do erro:', error.response);
        setMensagem('Erro ao carregar profissionais.');
      });
  }, []);

  // Carregar datas disponíveis quando o profissional mudar
  useEffect(() => {
    if (formData.profissionalId) {
      axios
        .get(`${API_URL}/datas-disponiveis`, {
          params: {
            'profissional-id': formData.profissionalId,
          },
        })
        .then(response => {
          console.log('Datas disponíveis recebidas do backend:', response.data);
          setDatasDisponiveis(response.data);
          if (!response.data.includes(formData.data)) {
            setFormData(prev => ({ ...prev, data: '' }));
          }
        })
        .catch(error => {
          console.error('Erro ao carregar datas disponíveis:', error);
          setMensagem('Erro ao carregar datas disponíveis.');
        });
    } else {
      setDatasDisponiveis([]);
      console.log('Nenhum profissional selecionado, datasDisponiveis resetado');
    }
  }, [formData.profissionalId]);

  // Carregar horários disponíveis e procedimentos quando profissional ou data mudar
  useEffect(() => {
    if (formData.profissionalId && formData.data) {
      // Carregar horários
      axios
        .get(`${API_URL}/horarios-disponiveis`, {
          params: {
            data: formData.data,
            'profissional-id': formData.profissionalId,
            intervalo_entre_horarios: '30', // Valor fixo por enquanto; pode ser dinâmico no futuro
          },
        })
        .then(response => {
          console.log('Horários recebidos:', response.data);
          setHorarios(response.data);
          if (!response.data.includes(formData.horario)) {
            setFormData(prev => ({ ...prev, horario: '' }));
          }
        })
        .catch(error => {
          console.error('Erro ao carregar horários:', error);
          setMensagem('Erro ao carregar horários.');
        });

      // Carregar procedimentos (já estava no useEffect separado)
      axios
        .get(`${API_URL}/profissional-procedimentos/${formData.profissionalId}`)
        .then(response => {
          setProcedimentos(response.data);
        })
        .catch(error => {
          console.error('Erro ao buscar procedimentos:', error);
          setMensagem('Erro ao carregar procedimentos.');
        });
    } else {
      setHorarios([]);
      setProcedimentos([]);
    }
  }, [formData.profissionalId, formData.data]);

  // Manipular mudanças no formulário
  const handleChange = e => {
    const { name, value } = e.target;
    console.log(`Mudança em ${name}: ${value}`);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Manipular mudança na data com o DatePicker
  const handleDataChange = (date) => {
    const dataFormatada = date ? date.toISOString().split('T')[0] : '';
    console.log('Data selecionada:', dataFormatada);
    setFormData(prev => ({ ...prev, data: dataFormatada }));
  };

  // Converter datas disponíveis para objetos Date
  const datasPermitidas = datasDisponiveis.map(data => new Date(data));

  // Manipular envio do formulário
  const handleSubmit = async e => {
    e.preventDefault();
    const { cliente, profissionalId, procedimento, data, horario } = formData;

    // Validação mais robusta
    if (!cliente || !profissionalId || !procedimento || !data || !horario) {
      setMensagem('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (!datasDisponiveis.includes(data)) {
      setMensagem('A data selecionada não está disponível.');
      return;
    }
    if (!horarios.includes(horario)) {
      setMensagem('O horário selecionado não está disponível.');
      return;
    }

    try {
      // Salvar o agendamento no backend
      const response = await axios.post(`${API_URL}/agendamentos`, {
        cliente,
        profissionalId,
        procedimento,
        data,
        horario,
      });

      setMensagem('Agendamento realizado com sucesso!');
      setFormData({ cliente: '', profissionalId: '', procedimento: '', data: '', horario: '' });
      setTimeout(() => navigate('/lista-agendamentos'), 2000);
    } catch (error) {
      setMensagem(error.response?.data?.erro || 'Erro ao realizar agendamento. Tente novamente.');
      console.error('Erro:', error);
    }
  };

  return (
    <main className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-700">Agendar Serviço</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="cliente" className="block font-bold text-gray-700">
            Nome do Cliente:
          </label>
          <input
            type="text"
            id="cliente"
            name="cliente"
            value={formData.cliente}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite o nome do cliente"
          />
        </div>
        <div>
          <label htmlFor="profissionalId" className="block font-bold text-gray-700">
            Profissional:
          </label>
          <select
            id="profissionalId"
            name="profissionalId"
            value={formData.profissionalId}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione um profissional</option>
            {profissionais.map(prof => (
              <option key={prof.id} value={prof.id}>
                {prof.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="procedimento" className="block font-bold text-gray-700">
            Procedimento:
          </label>
          <select
            id="procedimento"
            name="procedimento"
            value={formData.procedimento}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione um procedimento</option>
            {procedimentos.map((procedimento, index) => (
              <option key={index} value={procedimento}>
                {procedimento}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="data" className="block font-bold text-gray-700">
            Data:
          </label>
          <DatePicker
            selected={formData.data ? new Date(formData.data) : null}
            onChange={handleDataChange}
            includeDates={datasPermitidas} // Apenas essas datas serão clicáveis
            dateFormat="dd/MM/yyyy"
            placeholderText="Selecione uma data disponível"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {datasDisponiveis.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">Selecione um profissional para ver as datas disponíveis.</p>
          )}
        </div>
        <div>
          <label htmlFor="horario" className="block font-bold text-gray-700">
            Horário:
          </label>
          <select
            id="horario"
            name="horario"
            value={formData.horario}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione um horário</option>
            {horarios.map(horario => (
              <option key={horario} value={horario}>
                {horario}
              </option>
            ))}
          </select>
          {horarios.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">Selecione uma data para ver os horários disponíveis.</p>
          )}
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Agendar
        </button>
      </form>
      {mensagem && (
        <p className={`mt-4 text-center font-bold ${mensagem.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>
          {mensagem}
        </p>
      )}
    </main>
  );
}

export default Agendamento;