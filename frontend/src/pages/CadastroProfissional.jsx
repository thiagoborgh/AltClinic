import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPlus, FaTrash, FaCopy, FaCheckCircle } from 'react-icons/fa';
import { API_URL } from '../config';

function CadastroProfissional() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    procedimentos: [],
    intervalo_entre_horarios: '30',
    grade: [
      { dia_semana: 'segunda', disponivel: false, horario_inicio: '', horario_fim: '', pausas: [] },
      { dia_semana: 'terça', disponivel: false, horario_inicio: '', horario_fim: '', pausas: [] },
      { dia_semana: 'quarta', disponivel: false, horario_inicio: '', horario_fim: '', pausas: [] },
      { dia_semana: 'quinta', disponivel: false, horario_inicio: '', horario_fim: '', pausas: [] },
      { dia_semana: 'sexta', disponivel: false, horario_inicio: '', horario_fim: '', pausas: [] },
      { dia_semana: 'sábado', disponivel: false, horario_inicio: '', horario_fim: '', pausas: [] },
      { dia_semana: 'domingo', disponivel: false, horario_inicio: '', horario_fim: '', pausas: [] },
    ],
  });
  const [mensagem, setMensagem] = useState('');
  const [copiarDia, setCopiarDia] = useState('');
  const [diasParaCopiar, setDiasParaCopiar] = useState([]);

  // Lista de procedimentos disponíveis (pode ser obtida de uma API ou banco de dados no futuro)
  const procedimentosDisponiveis = [
    'Massagem Relaxante',
    'Limpeza de Pele',
    'Corte de Cabelo',
    'Manicure',
    'Pedicure',
    'Depilação',
    'Maquiagem',
    'Design de Sobrancelha',
  ];

  useEffect(() => {
    if (id) {
      axios
        .get(`${API_URL}/profissionais`)
        .then(response => {
          const profissional = response.data.find(p => p.id === parseInt(id));
          if (profissional) {
            const procedimentos = typeof profissional.procedimentos === 'string' ? JSON.parse(profissional.procedimentos) : profissional.procedimentos;
            const grade = typeof profissional.grade === 'string' ? JSON.parse(profissional.grade) : profissional.grade;
            const diasSemana = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
            const gradeCompleta = diasSemana.map(dia => {
              const gradeDia = grade.find(g => g.dia_semana === dia) || {};
              return {
                dia_semana: dia,
                disponivel: gradeDia.disponivel || false,
                horario_inicio: gradeDia.horario_inicio || '',
                horario_fim: gradeDia.horario_fim || '',
                pausas: gradeDia.pausas || (gradeDia.intervalos || []),
              };
            });
            setFormData({
              nome: profissional.nome,
              procedimentos: procedimentos || [],
              intervalo_entre_horarios: '30',
              grade: gradeCompleta,
            });
          }
        })
        .catch(error => {
          console.error('Erro ao carregar profissional:', error);
          setMensagem('Erro ao carregar profissional.');
        });
    }
  }, [id]);

  const handleChange = (e, index) => {
    const { name, value, type, checked, options } = e.target;

    if (name === 'procedimentos') {
      const selectedOptions = Array.from(options)
        .filter(option => option.selected)
        .map(option => option.value);
      setFormData(prev => ({
        ...prev,
        procedimentos: selectedOptions,
      }));
    } else if (name === 'intervalo_entre_horarios') {
      setFormData(prev => ({
        ...prev,
        intervalo_entre_horarios: value,
      }));
    } else if (name.startsWith('grade')) {
      const [field, dayIndex, subField] = name.split('.');
      const updatedGrade = [...formData.grade];
      if (subField === 'disponivel') {
        updatedGrade[dayIndex][subField] = checked;
        if (!checked) {
          updatedGrade[dayIndex].horario_inicio = '';
          updatedGrade[dayIndex].horario_fim = '';
          updatedGrade[dayIndex].pausas = [];
        }
      } else if (subField === 'pausas') {
        const [intervalIndex, intervalField] = value.split('-');
        const updatedPausas = [...updatedGrade[dayIndex].pausas];
        if (intervalField === 'remove') {
          updatedPausas.splice(intervalIndex, 1);
        } else {
          const [start, end] = value.split('-')[1].split(':');
          if (!updatedPausas[intervalIndex]) updatedPausas[intervalIndex] = { inicio: '', fim: '' };
          updatedPausas[intervalIndex][intervalField] = start || end;
        }
        updatedGrade[dayIndex].pausas = updatedPausas;
      } else {
        updatedGrade[dayIndex][subField] = value;
      }
      setFormData(prev => ({
        ...prev,
        grade: updatedGrade,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const addPausa = (index) => {
    const updatedGrade = [...formData.grade];
    updatedGrade[index].pausas.push({ inicio: '', fim: '' });
    setFormData(prev => ({ ...prev, grade: updatedGrade }));
  };

  const handleCopiarDiasChange = (e) => {
    const dia = e.target.value;
    if (e.target.checked) {
      setDiasParaCopiar(prev => [...prev, dia]);
    } else {
      setDiasParaCopiar(prev => prev.filter(d => d !== dia));
    }
  };

  const copiarConfiguracao = () => {
    if (!copiarDia || diasParaCopiar.length === 0) {
      setMensagem('Selecione um dia para copiar e pelo menos um dia para aplicar a configuração.');
      return;
    }

    const diaOrigem = formData.grade.find(g => g.dia_semana === copiarDia);
    const updatedGrade = formData.grade.map(dia => {
      if (diasParaCopiar.includes(dia.dia_semana)) {
        return {
          ...dia,
          disponivel: diaOrigem.disponivel,
          horario_inicio: diaOrigem.horario_inicio,
          horario_fim: diaOrigem.horario_fim,
          pausas: JSON.parse(JSON.stringify(diaOrigem.pausas)),
        };
      }
      return dia;
    });

    setFormData(prev => ({ ...prev, grade: updatedGrade }));
    setMensagem('Configuração copiada com sucesso!');
    setDiasParaCopiar([]);
    setCopiarDia('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const { nome, procedimentos, grade } = formData;

    if (!nome || !procedimentos.length || !grade.some(g => g.disponivel)) {
      setMensagem('Preencha todos os campos obrigatórios e selecione pelo menos um dia disponível.');
      return;
    }

    try {
      if (id) {
        await axios.put(`${API_URL}/profissionais/${id}`, {
          nome,
          procedimentos,
          grade,
        });
        setMensagem('Profissional atualizado com sucesso!');
      } else {
        const response = await axios.post(`${API_URL}/profissionais`, {
          nome,
          procedimentos,
          grade,
        });
        setMensagem('Profissional cadastrado com sucesso! ID: ' + response.data.id);
      }
      setTimeout(() => navigate('/lista-profissionais'), 2000);
    } catch (error) {
      setMensagem(error.response?.data?.erro || 'Erro ao salvar profissional.');
      console.error('Erro:', error);
    }
  };

  return (
    <main className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        {id ? 'Editar Profissional' : 'Cadastrar Profissional'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nome e Procedimentos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
              Nome:
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite o nome do profissional"
            />
          </div>
          <div>
            <label htmlFor="procedimentos" className="block text-sm font-medium text-gray-700 mb-1">
              Procedimentos:
            </label>
            <select
              id="procedimentos"
              name="procedimentos"
              multiple
              value={formData.procedimentos}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
            >
              {procedimentosDisponiveis.map((procedimento, index) => (
                <option key={index} value={procedimento}>
                  {procedimento}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Segure Ctrl (ou Cmd no Mac) para selecionar múltiplos procedimentos.
            </p>
          </div>
        </div>

        {/* Intervalo entre Horários */}
        <div>
          <label htmlFor="intervalo_entre_horarios" className="block text-sm font-medium text-gray-700 mb-1">
            Intervalo entre horários:
          </label>
          <select
            name="intervalo_entre_horarios"
            value={formData.intervalo_entre_horarios}
            onChange={handleChange}
            className="w-full md:w-48 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="15">15 minutos</option>
            <option value="30">30 minutos</option>
            <option value="45">45 minutos</option>
            <option value="60">60 minutos</option>
          </select>
        </div>

        {/* Grade de Horários */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Grade de Horários</h3>
          {formData.grade.map((dia, index) => (
            <div key={dia.dia_semana} className="bg-gray-50 p-4 rounded-lg shadow-sm mb-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name={`grade.${index}.disponivel`}
                  checked={dia.disponivel}
                  onChange={e => handleChange(e, index)}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="capitalize text-gray-800 font-medium">{dia.dia_semana}</label>
              </div>
              {dia.disponivel && (
                <div className="mt-3 space-y-3">
                  {/* Horário de Início e Fim */}
                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Início:</label>
                      <input
                        type="time"
                        name={`grade.${index}.horario_inicio`}
                        value={dia.horario_inicio}
                        onChange={e => handleChange(e, index)}
                        required
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <span className="text-gray-600 mt-6">até</span>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Fim:</label>
                      <input
                        type="time"
                        name={`grade.${index}.horario_fim`}
                        value={dia.horario_fim}
                        onChange={e => handleChange(e, index)}
                        required
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Pausas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pausas:</label>
                    {dia.pausas.length > 0 ? (
                      <div className="border rounded-md">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="p-2 text-left">Início</th>
                              <th className="p-2 text-left">Fim</th>
                              <th className="p-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {dia.pausas.map((pausa, i) => (
                              <tr key={i} className="border-t">
                                <td className="p-2">
                                  <input
                                    type="time"
                                    value={pausa.inicio}
                                    onChange={e => handleChange({ target: { name: `grade.${index}.pausas.${i}-inicio`, value: e.target.value } }, index)}
                                    className="w-full p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="time"
                                    value={pausa.fim}
                                    onChange={e => handleChange({ target: { name: `grade.${index}.pausas.${i}-fim`, value: e.target.value } }, index)}
                                    className="w-full p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleChange({ target: { name: `grade.${index}.pausas.${i}-remove` } }, index)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <FaTrash />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Nenhuma pausa adicionada.</p>
                    )}
                    <button
                      type="button"
                      onClick={() => addPausa(index)}
                      className="mt-2 flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <FaPlus className="mr-1" /> Adicionar Pausa
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Copiar Configuração */}
        <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Copiar Configuração para Outros Dias</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Copiar de:</label>
              <select
                value={copiarDia}
                onChange={e => setCopiarDia(e.target.value)}
                className="w-full md:w-48 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um dia</option>
                {formData.grade.map(dia => (
                  <option key={dia.dia_semana} value={dia.dia_semana} disabled={!dia.disponivel}>
                    {dia.dia_semana.charAt(0).toUpperCase() + dia.dia_semana.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aplicar em:</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {formData.grade.map(dia => (
                  <div key={dia.dia_semana} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={dia.dia_semana}
                      checked={diasParaCopiar.includes(dia.dia_semana)}
                      onChange={handleCopiarDiasChange}
                      disabled={dia.dia_semana === copiarDia}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="capitalize text-gray-700">{dia.dia_semana}</label>
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={copiarConfiguracao}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <FaCopy className="mr-2" /> Aplicar Configuração
            </button>
          </div>
        </div>

        {/* Botão de Submit */}
        <button
          type="submit"
          className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <FaCheckCircle className="mr-2" /> {id ? 'Atualizar Profissional' : 'Cadastrar Profissional'}
        </button>
      </form>

      {/* Mensagem de Feedback */}
      {mensagem && (
        <p className={`mt-4 text-center text-sm font-medium ${mensagem.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>
          {mensagem}
        </p>
      )}
    </main>
  );
}

export default CadastroProfissional;