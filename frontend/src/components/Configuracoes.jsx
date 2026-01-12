import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IMaskInput } from 'react-imask';
import { API_URL } from '../config';


function Configuracoes() {
  const [abaAtiva, setAbaAtiva] = useState('localatendimento');
  const [mensagem, setMensagem] = useState('');

  // Estado para Empresa Principal (Matriz)
  const [empresaMatriz, setEmpresaMatriz] = useState({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    cnes: '',
    cep: '',
    endereco: '',
    numero: '',
    compl: '',
    bairro: '',
    cidade: '',
    estado: '',
    telefone: '',
    celular: '',
    email: '',
    observacoes: '',
    fusoHorario: '-03:00',
    aplicarHorarioVerao: false,
    linkCoordenadas: '',
    dddAutomatico: '',
    site: '',
    exibirAgendamentoOnline: false,
    licencaId: '', // Vinculado à licença logada
  });

  // Estado para Empresas Filiais
  const [empresasFiliais, setEmpresasFiliais] = useState([]);
  const [novaFilial, setNovaFilial] = useState({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    cep: '',
    endereco: '',
    numero: '',
    compl: '',
    bairro: '',
    cidade: '',
    estado: '',
    telefone: '',
    celular: '',
    email: '',
    vinculadaMatriz: false, // Opção de vinculação
  });

  // Estado para Profissionais e Funcionários (compartilhado ou por filial)
  const [profissionais, setProfissionais] = useState([]);
  const [novoProfissional, setNovoProfissional] = useState({
    nome: '',
    email: '',
    telefone: '',
    filialId: null, // Vincula a uma filial ou null para matriz
    ativo: true,
  });

  // Estado para Local de Atendimento
  const [locais, setLocais] = useState([]);
  const [novoLocal, setNovoLocal] = useState({ tipo: 'consultorio', nome: '', filialId: null });

  // Estado para Procedimentos
  const [procedimentos, setProcedimentos] = useState([]);
  const [novoProcedimento, setNovoProcedimento] = useState({ nome: '', duracao: '', preco: '', filialId: null });

  // Estado para Formas de Recebimento
  const [formasRecebimento, setFormasRecebimento] = useState([]);
  const [novaForma, setNovaForma] = useState({ tipo: '', filialId: null });

  // Estado para Contrato/Proposta
  const [contratos, setContratos] = useState([]);
  const [novoContrato, setNovoContrato] = useState({ cliente: '', servico: '', valor: '', filialId: null, detalhes: '' });

  // Estado para Meu Perfil
  const [usuario, setUsuario] = useState({
    nome: 'Nome Fantasia - PANDA CLINIC',
    email: 'chamadas@feegow.feegowclinic',
    ultimoAcesso: '02/06/2025 05:14',
  });

  const token = localStorage.getItem('token');

  // Carregar dados iniciais
  useEffect(() => {
    axios.get(`${API_URL}/empresa-matriz`)
      .then(response => setEmpresaMatriz(response.data))
      .catch(error => setMensagem(`Erro ao carregar dados da matriz: ${error.message}`));

    axios.get(`${API_URL}/empresas-filiais`)
      .then(response => setEmpresasFiliais(response.data))
      .catch(error => setMensagem(`Erro ao carregar filiais: ${error.message}`));

    axios.get(`${API_URL}/profissionais`)
      .then(response => setProfissionais(response.data))
      .catch(error => setMensagem(`Erro ao carregar profissionais: ${error.message}`));

    axios.get(`${API_URL}/locais-atendimento`)
      .then(response => setLocais(response.data))
      .catch(error => setMensagem(`Erro ao carregar locais de atendimento: ${error.message}`));

    axios.get(`${API_URL}/procedimentos`)
      .then(response => setProcedimentos(response.data))
      .catch(error => setMensagem(`Erro ao carregar procedimentos: ${error.message}`));

    axios.get(`${API_URL}/formas-recebimento`)
      .then(response => setFormasRecebimento(response.data))
      .catch(error => setMensagem(`Erro ao carregar formas de recebimento: ${error.message}`));

    axios.get(`${API_URL}/contratos`)
      .then(response => setContratos(response.data))
      .catch(error => setMensagem(`Erro ao carregar contratos: ${error.message}`));
  }, []);

  // Funções para Empresa Matriz
  const handleMatrizChange = (e) => {
    const { name, value } = e.target;
    setEmpresaMatriz(prev => ({ ...prev, [name]: value }));
  };

  const handleCepMatrizChange = async (e) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
        if (!response.data.erro) {
          setEmpresaMatriz(prev => ({
            ...prev,
            cep: response.data.cep,
            endereco: response.data.logradouro || prev.endereco,
            bairro: response.data.bairro || prev.bairro,
            cidade: response.data.localidade || prev.cidade,
            estado: response.data.uf || prev.estado,
            fusoHorario: response.data.uf === 'AC' || response.data.uf === 'AM' || response.data.uf === 'RR' || response.data.uf === 'RO' ? '-04:00' : '-03:00',
            linkCoordenadas: `https://www.google.com/maps/search/?api=1&query=${response.data.localidade},${response.data.uf}`,
          }));
          const dddsPorEstado = {
            'SP': '011', 'RJ': '021', 'MG': '031', 'ES': '027', 'RS': '051', 'PR': '041', 'SC': '047',
            'BA': '071', 'PE': '081', 'CE': '085', 'PA': '091', 'MA': '098', 'PI': '086', 'RN': '084',
            'PB': '083', 'AL': '082', 'SE': '079', 'GO': '062', 'MT': '065', 'MS': '067', 'DF': '061',
            'AC': '068', 'AM': '092', 'RR': '095', 'RO': '069', 'TO': '063', 'AP': '096'
          };
          setEmpresaMatriz(prev => ({ ...prev, dddAutomatico: dddsPorEstado[response.data.uf] || '' }));
        } else {
          setMensagem('CEP não encontrado.');
        }
      } catch (error) {
        setMensagem(`Erro ao buscar CEP: ${error.message}`);
      }
    }
    handleMatrizChange(e);
  };

  const salvarMatriz = async () => {
    try {
      if (!token) throw new Error('Usuário não autenticado');
      await axios.post(`${API_URL}/empresa-matriz`, empresaMatriz, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Dados da matriz salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar matriz:', error.response?.data || error.message);
      alert('Erro ao salvar dados da matriz: ' + (error.response?.data?.erro || error.message));
    }
  };

  // Funções para Empresas Filiais
  const handleFilialChange = (e) => {
    const { name, value } = e.target;
    setNovaFilial(prev => ({ ...prev, [name]: value }));
  };

  const handleCepFilialChange = async (e) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
        if (!response.data.erro) {
          setNovaFilial(prev => ({
            ...prev,
            cep: response.data.cep,
            endereco: response.data.logradouro || prev.endereco,
            bairro: response.data.bairro || prev.bairro,
            cidade: response.data.localidade || prev.cidade,
            estado: response.data.uf || prev.estado,
          }));
        } else {
          setMensagem('CEP não encontrado.');
        }
      } catch (error) {
        setMensagem(`Erro ao buscar CEP: ${error.message}`);
      }
    }
    handleFilialChange(e);
  };

  const adicionarFilial = async (filial) => {
    try {
      if (!token) throw new Error('Usuário não autenticado');
      await axios.post(`${API_URL}/empresas-filiais`, filial, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmpresasFiliais([...empresasFiliais, filial]);
      alert('Filial salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar filial:', error.response?.data || error.message);
      alert('Erro ao salvar filial: ' + (error.response?.data?.erro || error.message));
    }
  };

  // Funções para Profissionais
  const handleProfissionalChange = (e) => {
    const { name, value } = e.target;
    setNovoProfissional(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProfissional = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/profissionais`, novoProfissional);
      setProfissionais([...profissionais, response.data]);
      setNovoProfissional({ nome: '', email: '', telefone: '', filialId: null, ativo: true });
      setMensagem('Profissional adicionado com sucesso!');
    } catch (error) {
      setMensagem(`Erro ao adicionar profissional: ${error.message}`);
    }
  };

  // Funções para Local de Atendimento
  const handleNovoLocalChange = (e) => {
    const { name, value } = e.target;
    setNovoLocal(prev => ({ ...prev, [name]: value }));
  };

  const handleAddLocal = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/locais-atendimento`, novoLocal);
      setLocais([...locais, response.data]);
      setNovoLocal({ tipo: 'consultorio', nome: '', filialId: null });
      setMensagem('Local de atendimento adicionado com sucesso!');
    } catch (error) {
      setMensagem(`Erro ao adicionar local de atendimento: ${error.message}`);
    }
  };

  // Funções para Procedimentos
  const handleNovoProcedimentoChange = (e) => {
    const { name, value } = e.target;
    setNovoProcedimento(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProcedimento = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/procedimentos`, novoProcedimento);
      setProcedimentos([...procedimentos, response.data]);
      setNovoProcedimento({ nome: '', duracao: '', preco: '', filialId: null });
      setMensagem('Procedimento adicionado com sucesso!');
    } catch (error) {
      setMensagem(`Erro ao adicionar procedimento: ${error.message}`);
    }
  };

  // Funções para Formas de Recebimento
  const handleNovaFormaChange = (e) => {
    setNovaForma({ tipo: e.target.value, filialId: null });
  };

  const handleAddForma = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/formas-recebimento`, novaForma);
      setFormasRecebimento([...formasRecebimento, response.data]);
      setNovaForma({ tipo: '', filialId: null });
      setMensagem('Forma de recebimento adicionada com sucesso!');
    } catch (error) {
      setMensagem(`Erro ao adicionar forma de recebimento: ${error.message}`);
    }
  };

  // Funções para Contrato/Proposta
  const handleNovoContratoChange = (e) => {
    const { name, value } = e.target;
    setNovoContrato(prev => ({ ...prev, [name]: value }));
  };

  const handleAddContrato = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/contratos`, novoContrato);
      setContratos([...contratos, response.data]);
      setNovoContrato({ cliente: '', servico: '', valor: '', filialId: null, detalhes: '' });
      setMensagem('Contrato/Proposta criado com sucesso!');
    } catch (error) {
      setMensagem(`Erro ao criar contrato/proposta: ${error.message}`);
    }
  };

  // Funções para Meu Perfil
  const handleUsuarioChange = (e) => {
    const { name, value } = e.target;
    setUsuario(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveUsuario = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/usuario`, usuario);
      setMensagem('Perfil atualizado com sucesso!');
    } catch (error) {
      setMensagem(`Erro ao atualizar perfil: ${error.message}`);
    }
  };

  const abas = [
    { nome: 'Empresa Matriz', id: 'empresamatriz' },
    { nome: 'Empresas Filiais', id: 'empresasfiliais' },
    { nome: 'Profissionais', id: 'profissionais' },
    { nome: 'Local de Atendimento', id: 'localatendimento' },
    { nome: 'Procedimentos', id: 'procedimentos' },
    { nome: 'Formas de Recebimento', id: 'formasderecebimento' },
    { nome: 'Contrato/Proposta', id: 'contratoproposta' },
    { nome: 'Meu Perfil', id: 'meuperfil' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <main className="flex-1 p-6 overflow-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-700">Configurações</h2>
        {mensagem && (
          <p className={`mb-4 text-center text-sm font-medium ${mensagem.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>
            {mensagem}
          </p>
        )}

        <div className="mb-6">
          <div className="hidden md:flex flex-wrap border-b">
            {abas.map(aba => (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                className={`px-4 py-2 mr-2 font-semibold text-sm rounded-t-md transition-colors duration-200 
                  ${abaAtiva === aba.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                {aba.nome}
              </button>
            ))}
          </div>
          <div className="md:hidden">
            <select
              value={abaAtiva}
              onChange={(e) => setAbaAtiva(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {abas.map(aba => (
                <option key={aba.id} value={aba.id}>{aba.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {abaAtiva === 'empresamatriz' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Empresa Matriz</h3>
            <form onSubmit={salvarMatriz} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Razão Social</label>
                <input
                  type="text"
                  name="razaoSocial"
                  value={empresaMatriz.razaoSocial}
                  onChange={handleMatrizChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
                <input
                  type="text"
                  name="nomeFantasia"
                  value={empresaMatriz.nomeFantasia}
                  onChange={handleMatrizChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                <IMaskInput
                  mask="00.000.000/0000-00"
                  name="cnpj"
                  value={empresaMatriz.cnpj}
                  onAccept={(value) => handleMatrizChange({ target: { name: 'cnpj', value } })}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CNES</label>
                <input
                  type="number"
                  name="cnes"
                  value={empresaMatriz.cnes}
                  onChange={handleMatrizChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CEP</label>
                <IMaskInput
                  mask="00000-000"
                  name="cep"
                  value={empresaMatriz.cep}
                  onAccept={(value) => handleCepMatrizChange({ target: { name: 'cep', value } })}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Endereço</label>
                <input
                  type="text"
                  name="endereco"
                  value={empresaMatriz.endereco}
                  onChange={handleMatrizChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Número</label>
                <input
                  type="number"
                  name="numero"
                  value={empresaMatriz.numero}
                  onChange={handleMatrizChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Complemento</label>
                <input
                  type="text"
                  name="compl"
                  value={empresaMatriz.compl}
                  onChange={handleMatrizChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bairro</label>
                <input
                  type="text"
                  name="bairro"
                  value={empresaMatriz.bairro}
                  onChange={handleMatrizChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cidade</label>
                <input
                  type="text"
                  name="cidade"
                  value={empresaMatriz.cidade}
                  onChange={handleMatrizChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <input
                  type="text"
                  name="estado"
                  value={empresaMatriz.estado}
                  onChange={handleMatrizChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                <IMaskInput
                  mask="(00) 0000-0000"
                  name="telefone"
                  value={empresaMatriz.telefone}
                  onAccept={(value) => handleMatrizChange({ target: { name: 'telefone', value } })}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Celular</label>
                <IMaskInput
                  mask="(00) 0 0000-0000"
                  name="celular"
                  value={empresaMatriz.celular}
                  onAccept={(value) => handleMatrizChange({ target: { name: 'celular', value } })}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">E-mail</label>
                <input
                  type="email"
                  name="email"
                  value={empresaMatriz.email}
                  onChange={handleMatrizChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Observações</label>
                <textarea
                  name="observacoes"
                  value={empresaMatriz.observacoes}
                  onChange={handleMatrizChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fuso Horário</label>
                <input
                  type="text"
                  name="fusoHorario"
                  value={empresaMatriz.fusoHorario}
                  onChange={handleMatrizChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Aplicar Horário de Verão</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="aplicarHorarioVerao"
                    checked={empresaMatriz.aplicarHorarioVerao}
                    onChange={(e) => handleMatrizChange({ target: { name: 'aplicarHorarioVerao', value: e.target.checked } })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Link das Coordenadas</label>
                <input
                  type="text"
                  name="linkCoordenadas"
                  value={empresaMatriz.linkCoordenadas}
                  onChange={handleMatrizChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">DDD Automático</label>
                <IMaskInput
                  mask="000"
                  name="dddAutomatico"
                  value={empresaMatriz.dddAutomatico}
                  onAccept={(value) => handleMatrizChange({ target: { name: 'dddAutomatico', value } })}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Site</label>
                <input
                  type="text"
                  name="site"
                  value={empresaMatriz.site}
                  onChange={handleMatrizChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Exibir no Agendamento Online</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="exibirAgendamentoOnline"
                    checked={empresaMatriz.exibirAgendamentoOnline}
                    onChange={(e) => handleMatrizChange({ target: { name: 'exibirAgendamentoOnline', value: e.target.checked } })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Licença ID</label>
                <input
                  type="text"
                  name="licencaId"
                  value={empresaMatriz.licencaId}
                  onChange={handleMatrizChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Salvar Matriz
                </button>
              </div>
            </form>
          </div>
        )}

        {abaAtiva === 'empresasfiliais' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Empresas Filiais</h3>
            <form onSubmit={handleAddFilial} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Razão Social</label>
                <input
                  type="text"
                  name="razaoSocial"
                  value={novaFilial.razaoSocial}
                  onChange={handleFilialChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
                <input
                  type="text"
                  name="nomeFantasia"
                  value={novaFilial.nomeFantasia}
                  onChange={handleFilialChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                <IMaskInput
                  mask="00.000.000/0000-00"
                  name="cnpj"
                  value={novaFilial.cnpj}
                  onAccept={(value) => handleFilialChange({ target: { name: 'cnpj', value } })}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CEP</label>
                <IMaskInput
                  mask="00000-000"
                  name="cep"
                  value={novaFilial.cep}
                  onAccept={(value) => handleCepFilialChange({ target: { name: 'cep', value } })}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Endereço</label>
                <input
                  type="text"
                  name="endereco"
                  value={novaFilial.endereco}
                  onChange={handleFilialChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Número</label>
                <input
                  type="number"
                  name="numero"
                  value={novaFilial.numero}
                  onChange={handleFilialChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Complemento</label>
                <input
                  type="text"
                  name="compl"
                  value={novaFilial.compl}
                  onChange={handleFilialChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bairro</label>
                <input
                  type="text"
                  name="bairro"
                  value={novaFilial.bairro}
                  onChange={handleFilialChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cidade</label>
                <input
                  type="text"
                  name="cidade"
                  value={novaFilial.cidade}
                  onChange={handleFilialChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <input
                  type="text"
                  name="estado"
                  value={novaFilial.estado}
                  onChange={handleFilialChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                <IMaskInput
                  mask="(00) 0000-0000"
                  name="telefone"
                  value={novaFilial.telefone}
                  onAccept={(value) => handleFilialChange({ target: { name: 'telefone', value } })}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Celular</label>
                <IMaskInput
                  mask="(00) 0 0000-0000"
                  name="celular"
                  value={novaFilial.celular}
                  onAccept={(value) => handleFilialChange({ target: { name: 'celular', value } })}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">E-mail</label>
                <input
                  type="email"
                  name="email"
                  value={novaFilial.email}
                  onChange={handleFilialChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vinculada à Matriz</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="vinculadaMatriz"
                    checked={novaFilial.vinculadaMatriz}
                    onChange={(e) => handleFilialChange({ target: { name: 'vinculadaMatriz', value: e.target.checked } })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Adicionar Filial
                </button>
              </div>
            </form>
            <div className="mt-6">
              <h4 className="text-md font-semibold mb-2">Filiais Cadastradas</h4>
              {empresasFiliais.length > 0 ? (
                <ul className="space-y-2">
                  {empresasFiliais.map(filial => (
                    <li key={filial.id} className="p-2 bg-gray-50 rounded-md">
                      {filial.nomeFantasia} - CNPJ: {filial.cnpj} {filial.vinculadaMatriz ? '(Vinculada)' : '(Independente)'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Nenhuma filial cadastrada.</p>
              )}
            </div>
          </div>
        )}

        {abaAtiva === 'profissionais' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Profissionais</h3>
            <form onSubmit={handleAddProfissional} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  name="nome"
                  value={novoProfissional.nome}
                  onChange={handleProfissionalChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">E-mail</label>
                <input
                  type="email"
                  name="email"
                  value={novoProfissional.email}
                  onChange={handleProfissionalChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                <IMaskInput
                  mask="(00) 0 0000-0000"
                  name="telefone"
                  value={novoProfissional.telefone}
                  onAccept={(value) => handleProfissionalChange({ target: { name: 'telefone', value } })}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Filial (Opcional)</label>
                <select
                  name="filialId"
                  value={novoProfissional.filialId || ''}
                  onChange={handleProfissionalChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Matriz ou Não Vinculado</option>
                  {empresasFiliais.map(filial => (
                    <option key={filial.id} value={filial.id}>{filial.nomeFantasia}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ativo</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="ativo"
                    checked={novoProfissional.ativo}
                    onChange={(e) => handleProfissionalChange({ target: { name: 'ativo', value: e.target.checked } })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Adicionar Profissional
              </button>
            </form>
            <div className="mt-6">
              <h4 className="text-md font-semibold mb-2">Profissionais Cadastrados</h4>
              {profissionais.length > 0 ? (
                <ul className="space-y-2">
                  {profissionais.map(prof => (
                    <li key={prof.id} className="p-2 bg-gray-50 rounded-md">
                      {prof.nome} - {prof.email} {prof.filialId ? `(Filial: ${empresasFiliais.find(f => f.id === prof.filialId)?.nomeFantasia})` : '(Matriz)'} {prof.ativo ? '(Ativo)' : '(Inativo)'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Nenhum profissional cadastrado.</p>
              )}
            </div>
          </div>
        )}

        {abaAtiva === 'localatendimento' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Local de Atendimento</h3>
            <form onSubmit={handleAddLocal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <select
                  name="tipo"
                  value={novoLocal.tipo}
                  onChange={handleNovoLocalChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="consultorio">Consultório</option>
                  <option value="sala">Sala</option>
                  <option value="maca">Maca</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  name="nome"
                  value={novoLocal.nome}
                  onChange={handleNovoLocalChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Filial (Opcional)</label>
                <select
                  name="filialId"
                  value={novoLocal.filialId || ''}
                  onChange={handleNovoLocalChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Matriz ou Não Vinculado</option>
                  {empresasFiliais.map(filial => (
                    <option key={filial.id} value={filial.id}>{filial.nomeFantasia}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Adicionar Local
              </button>
            </form>
            <div className="mt-6">
              <h4 className="text-md font-semibold mb-2">Locais Cadastrados</h4>
              {locais.length > 0 ? (
                <ul className="space-y-2">
                  {locais.map(local => (
                    <li key={local.id} className="p-2 bg-gray-50 rounded-md">
                      {local.tipo} - {local.nome} {local.filialId ? `(Filial: ${empresasFiliais.find(f => f.id === local.filialId)?.nomeFantasia})` : '(Matriz)'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Nenhum local cadastrado.</p>
              )}
            </div>
          </div>
        )}

        {abaAtiva === 'procedimentos' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Cadastro de Procedimentos</h3>
            <form onSubmit={handleAddProcedimento} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome do Procedimento</label>
                <input
                  type="text"
                  name="nome"
                  value={novoProcedimento.nome}
                  onChange={handleNovoProcedimentoChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duração (min)</label>
                <input
                  type="number"
                  name="duracao"
                  value={novoProcedimento.duracao}
                  onChange={handleNovoProcedimentoChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Preço (R$)</label>
                <input
                  type="number"
                  name="preco"
                  value={novoProcedimento.preco}
                  onChange={handleNovoProcedimentoChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Filial (Opcional)</label>
                <select
                  name="filialId"
                  value={novoProcedimento.filialId || ''}
                  onChange={handleNovoProcedimentoChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Matriz ou Não Vinculado</option>
                  {empresasFiliais.map(filial => (
                    <option key={filial.id} value={filial.id}>{filial.nomeFantasia}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Adicionar Procedimento
              </button>
            </form>
            <div className="mt-6">
              <h4 className="text-md font-semibold mb-2">Procedimentos Cadastrados</h4>
              {procedimentos.length > 0 ? (
                <ul className="space-y-2">
                  {procedimentos.map(proc => (
                    <li key={proc.id} className="p-2 bg-gray-50 rounded-md">
                      {proc.nome} - {proc.duracao} min - R${proc.preco} {proc.filialId ? `(Filial: ${empresasFiliais.find(f => f.id === proc.filialId)?.nomeFantasia})` : '(Matriz)'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Nenhum procedimento cadastrado.</p>
              )}
            </div>
          </div>
        )}

        {abaAtiva === 'formasderecebimento' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Formas de Recebimento</h3>
            <form onSubmit={handleAddForma} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de Pagamento</label>
                <select
                  name="tipo"
                  value={novaForma.tipo}
                  onChange={handleNovaFormaChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione uma forma</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Filial (Opcional)</label>
                <select
                  name="filialId"
                  value={novaForma.filialId || ''}
                  onChange={(e) => setNovaForma(prev => ({ ...prev, filialId: e.target.value || null }))}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Matriz ou Não Vinculado</option>
                  {empresasFiliais.map(filial => (
                    <option key={filial.id} value={filial.id}>{filial.nomeFantasia}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Adicionar Forma
              </button>
            </form>
            <div className="mt-6">
              <h4 className="text-md font-semibold mb-2">Formas Cadastradas</h4>
              {formasRecebimento.length > 0 ? (
                <ul className="space-y-2">
                  {formasRecebimento.map(forma => (
                    <li key={forma.id} className="p-2 bg-gray-50 rounded-md">
                      {forma.tipo} {forma.filialId ? `(Filial: ${empresasFiliais.find(f => f.id === forma.filialId)?.nomeFantasia})` : '(Matriz)'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Nenhuma forma de recebimento cadastrada.</p>
              )}
            </div>
          </div>
        )}

        {abaAtiva === 'contratoproposta' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Criação de Contrato/Proposta</h3>
            <form onSubmit={handleAddContrato} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cliente</label>
                <input
                  type="text"
                  name="cliente"
                  value={novoContrato.cliente}
                  onChange={handleNovoContratoChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Serviço</label>
                <input
                  type="text"
                  name="servico"
                  value={novoContrato.servico}
                  onChange={handleNovoContratoChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                <input
                  type="number"
                  name="valor"
                  value={novoContrato.valor}
                  onChange={handleNovoContratoChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Filial (Opcional)</label>
                <select
                  name="filialId"
                  value={novoContrato.filialId || ''}
                  onChange={handleNovoContratoChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Matriz ou Não Vinculado</option>
                  {empresasFiliais.map(filial => (
                    <option key={filial.id} value={filial.id}>{filial.nomeFantasia}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Detalhes</label>
                <textarea
                  name="detalhes"
                  value={novoContrato.detalhes}
                  onChange={handleNovoContratoChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Criar Contrato/Proposta
              </button>
            </form>
            <div className="mt-6">
              <h4 className="text-md font-semibold mb-2">Contratos/Propostas Criados</h4>
              {contratos.length > 0 ? (
                <ul className="space-y-2">
                  {contratos.map(contrato => (
                    <li key={contrato.id} className="p-2 bg-gray-50 rounded-md">
                      Cliente: {contrato.cliente} | Serviço: {contrato.servico} | Valor: R${contrato.valor} {contrato.filialId ? `(Filial: ${empresasFiliais.find(f => f.id === contrato.filialId)?.nomeFantasia})` : '(Matriz)'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Nenhum contrato/proposta criado.</p>
              )}
            </div>
          </div>
        )}

        {abaAtiva === 'meuperfil' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Meu Perfil</h3>
            <form onSubmit={handleSaveUsuario} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  name="nome"
                  value={usuario.nome}
                  onChange={handleUsuarioChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={usuario.email}
                  onChange={handleUsuarioChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Último Acesso</label>
                <input
                  type="text"
                  value={usuario.ultimoAcesso}
                  disabled
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Salvar Perfil
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default Configuracoes;