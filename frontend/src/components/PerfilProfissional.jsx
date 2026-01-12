import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';
import { API_URL } from '../config';

function PerfilProfissional() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profissional, setProfissional] = useState({
    id: null,
    nome: '',
    especialidade: '',
    grade: [{ dia_semana: '', de: '', ate: '', gradeMin: '', local: '', maxRetornos: '', maxEncaminhamentos: '', vigenteDesde: '', vigenteAte: '', sempre: true }],
  });
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    if (id) {
      axios
        .get(`${API_URL}/profissionais/${id}`)
        .then(response => {
          setProfissional(response.data);
        })
        .catch(error => {
          console.error('Erro ao carregar profissional:', error);
          setMensagem('Erro ao carregar profissional.');
        });
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfissional(prev => ({ ...prev, [name]: value }));
  };

  const handleGradeChange = (index, e) => {
    const { name, value } = e.target;
    const newGrade = [...profissional.grade];
    newGrade[index] = { ...newGrade[index], [name]: value };
    setProfissional(prev => ({ ...prev, grade: newGrade }));
  };

  const addGrade = () => {
    setProfissional(prev => ({
      ...prev,
      grade: [...prev.grade, { dia_semana: '', de: '', ate: '', gradeMin: '', local: '', maxRetornos: '', maxEncaminhamentos: '', vigenteDesde: '', vigenteAte: '', sempre: true }],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (profissional.id) {
        await axios.put(`${API_URL}/profissionais/${profissional.id}`, profissional);
        setMensagem('Profissional atualizado com sucesso!');
      } else {
        const response = await axios.post(`${API_URL}/profissionais`, profissional);
        setProfissional(response.data);
        navigate(`/perfil-profissional/${response.data.id}`);
        setMensagem('Profissional cadastrado com sucesso!');
      }
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar profissional:', error);
      setMensagem('Erro ao salvar profissional.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Navbar />
      <main className="flex-1 p-6 overflow-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-700">{id ? 'Editar Profissional' : 'Cadastrar Novo Profissional'}</h2>
        {mensagem && (
          <p className={`mb-4 text-center text-sm font-medium ${mensagem.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>
            {mensagem}
          </p>
        )}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome</label>
              <input
                type="text"
                name="nome"
                value={profissional.nome}
                onChange={handleChange}
                className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Especialidade</label>
              <input
                type="text"
                name="especialidade"
                value={profissional.especialidade}
                onChange={handleChange}
                className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Grade de Horários</label>
              {profissional.grade.map((item, index) => (
                <div key={index} className="space-y-2 mt-2">
                  <select
                    name="dia_semana"
                    value={item.dia_semana}
                    onChange={(e) => handleGradeChange(index, e)}
                    className="p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione o dia</option>
                    <option value="segunda">Segunda</option>
                    <option value="terca">Terça</option>
                    <option value="quarta">Quarta</option>
                    <option value="quinta">Quinta</option>
                    <option value="sexta">Sexta</option>
                  </select>
                  <input
                    type="time"
                    name="de"
                    value={item.de}
                    onChange={(e) => handleGradeChange(index, e)}
                    className="p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="time"
                    name="ate"
                    value={item.ate}
                    onChange={(e) => handleGradeChange(index, e)}
                    className="p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    name="gradeMin"
                    value={item.gradeMin}
                    onChange={(e) => handleGradeChange(index, e)}
                    placeholder="Intervalo (min)"
                    className="p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    name="local"
                    value={item.local}
                    onChange={(e) => handleGradeChange(index, e)}
                    placeholder="Local"
                    className="p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    name="maxRetornos"
                    value={item.maxRetornos}
                    onChange={(e) => handleGradeChange(index, e)}
                    placeholder="Máx. Retornos"
                    className="p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    name="maxEncaminhamentos"
                    value={item.maxEncaminhamentos}
                    onChange={(e) => handleGradeChange(index, e)}
                    placeholder="Máx. Encaminhamentos"
                    className="p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    name="vigenteDesde"
                    value={item.vigenteDesde}
                    onChange={(e) => handleGradeChange(index, e)}
                    className="p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    name="vigenteAte"
                    value={item.vigenteAte}
                    onChange={(e) => handleGradeChange(index, e)}
                    className="p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="sempre"
                      checked={item.sempre}
                      onChange={(e) => handleGradeChange(index, { target: { name: 'sempre', value: e.target.checked } })}
                      className="mr-2"
                    />
                    Sempre
                  </label>
                </div>
              ))}
              <button
                type="button"
                onClick={addGrade}
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Adicionar Horário
              </button>
            </div>
            <button
              type="submit"
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Salvar
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default PerfilProfissional;