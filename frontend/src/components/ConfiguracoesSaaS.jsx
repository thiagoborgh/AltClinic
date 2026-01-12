import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

function ConfiguracoesSaaS() {
  const [abaAtiva, setAbaAtiva] = useState('geral');
  const [mensagem, setMensagem] = useState('');
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estado para configurações gerais
  const [config, setConfig] = useState({
    nome: '',
    telefone: '',
    whatsappMethod: 'manual', // manual ou evolution
    evolutionApiUrl: '',
    evolutionApiKey: ''
  });

  const token = localStorage.getItem('token');

  // Carregar dados do tenant
  useEffect(() => {
    carregarTenant();
  }, []);

  const carregarTenant = async () => {
    try {
      const response = await axios.get(`${API_URL}/tenant`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTenant(response.data);
      setConfig({
        nome: response.data.nome,
        telefone: response.data.telefone || '',
        whatsappMethod: response.data.whatsappMethod || 'manual',
        evolutionApiUrl: response.data.evolutionApiUrl || '',
        evolutionApiKey: response.data.evolutionApiKey || ''
      });
    } catch (error) {
      console.error('Erro ao carregar tenant:', error);
      setMensagem('Erro ao carregar informações');
    }
  };

  const salvarConfiguracoes = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.put(`${API_URL}/tenant`, config, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMensagem('✅ Configurações salvas com sucesso!');
      carregarTenant();
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMensagem('❌ Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const testarEvolutionAPI = async () => {
    if (!config.evolutionApiUrl || !config.evolutionApiKey) {
      alert('Por favor, preencha a URL e a API Key primeiro');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${config.evolutionApiUrl}/instance/fetchInstances`, {
        headers: { apikey: config.evolutionApiKey }
      });
      alert('✅ Conexão com Evolution API estabelecida com sucesso!\n\nInstâncias encontradas: ' + response.data.length);
    } catch (error) {
      alert('❌ Erro ao conectar com Evolution API\n\n' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Configurações</h1>
          <p className="text-gray-600">Gerencie sua clínica e integrações</p>
          
          {/* Status da Conta */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-800 font-semibold">Status da Conta</p>
                <p className="text-lg font-bold text-blue-900">
                  {tenant.status === 'trial' ? '🎁 Trial' : 
                   tenant.status === 'active' ? '✅ Ativo' : 
                   tenant.status === 'suspended' ? '⚠️ Suspenso' : '❌ Cancelado'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-800">Dias restantes</p>
                <p className="text-2xl font-bold text-blue-900">{tenant.diasRestantes}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-blue-700">Usuários: {tenant.totalUsuarios}/{tenant.limiteUsuarios}</span>
              <span className="text-blue-700">Plano: R$ 19,90/mês</span>
            </div>
          </div>
        </div>

        {/* Abas */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setAbaAtiva('geral')}
              className={`px-6 py-3 font-semibold ${
                abaAtiva === 'geral'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Geral
            </button>
            <button
              onClick={() => setAbaAtiva('whatsapp')}
              className={`px-6 py-3 font-semibold ${
                abaAtiva === 'whatsapp'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              WhatsApp
            </button>
            <button
              onClick={() => setAbaAtiva('usuarios')}
              className={`px-6 py-3 font-semibold ${
                abaAtiva === 'usuarios'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Usuários
            </button>
          </div>

          <div className="p-6">
            {/* Mensagem de Feedback */}
            {mensagem && (
              <div className={`mb-4 p-4 rounded-lg ${
                mensagem.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {mensagem}
              </div>
            )}

            {/* Aba Geral */}
            {abaAtiva === 'geral' && (
              <form onSubmit={salvarConfiguracoes}>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Informações da Clínica</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Clínica
                    </label>
                    <input
                      type="text"
                      value={config.nome}
                      onChange={(e) => setConfig({ ...config, nome: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone/WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={config.telefone}
                      onChange={(e) => setConfig({ ...config, telefone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            )}

            {/* Aba WhatsApp */}
            {abaAtiva === 'whatsapp' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Integração WhatsApp</h3>
                
                {/* Seletor de Método */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Como você quer enviar notificações?
                  </label>
                  
                  <div className="space-y-3">
                    {/* Opção Manual */}
                    <div
                      onClick={() => setConfig({ ...config, whatsappMethod: 'manual' })}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        config.whatsappMethod === 'manual'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="mt-1">
                          <input
                            type="radio"
                            checked={config.whatsappMethod === 'manual'}
                            onChange={() => {}}
                            className="w-4 h-4 text-blue-600"
                          />
                        </div>
                        <div className="ml-3">
                          <p className="font-semibold text-gray-800">📱 WhatsApp Web Manual</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Sistema gera link e você clica para enviar pelo WhatsApp Web
                          </p>
                          <div className="mt-2 flex gap-2 text-xs">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">✅ Grátis</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">✅ Simples</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">✅ Sem configuração</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Opção Evolution API */}
                    <div
                      onClick={() => setConfig({ ...config, whatsappMethod: 'evolution' })}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        config.whatsappMethod === 'evolution'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="mt-1">
                          <input
                            type="radio"
                            checked={config.whatsappMethod === 'evolution'}
                            onChange={() => {}}
                            className="w-4 h-4 text-blue-600"
                          />
                        </div>
                        <div className="ml-3">
                          <p className="font-semibold text-gray-800">🚀 Evolution API (Automático)</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Envio automático e programado de mensagens
                          </p>
                          <div className="mt-2 flex gap-2 text-xs">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">⚡ Automático</span>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">⚙️ Requer instalação</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configurações Evolution API */}
                {config.whatsappMethod === 'evolution' && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">Configurações Evolution API</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          URL da API
                        </label>
                        <input
                          type="url"
                          value={config.evolutionApiUrl}
                          onChange={(e) => setConfig({ ...config, evolutionApiUrl: e.target.value })}
                          placeholder="http://localhost:8080 ou https://sua-api.com"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          API Key
                        </label>
                        <input
                          type="password"
                          value={config.evolutionApiKey}
                          onChange={(e) => setConfig({ ...config, evolutionApiKey: e.target.value })}
                          placeholder="Sua chave de API"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={testarEvolutionAPI}
                          disabled={loading}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                        >
                          🧪 Testar Conexão
                        </button>
                        <button
                          type="button"
                          onClick={salvarConfiguracoes}
                          disabled={loading}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          💾 Salvar
                        </button>
                      </div>

                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>📚 Precisa de ajuda?</strong><br />
                          Consulte o guia de instalação do Evolution API no arquivo{' '}
                          <code className="bg-yellow-100 px-1 rounded">WHATSAPP-INTEGRATION.md</code>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {config.whatsappMethod === 'manual' && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>✅ Pronto para usar!</strong><br />
                      Quando você criar um agendamento, o sistema irá gerar um link. 
                      Basta clicar e a mensagem será aberta no WhatsApp Web para você enviar.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Aba Usuários */}
            {abaAtiva === 'usuarios' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Gerenciar Usuários</h3>
                <p className="text-gray-600 mb-4">
                  Você pode adicionar até {tenant.limiteUsuarios} usuários no seu plano.
                  Atualmente você tem {tenant.totalUsuarios} usuário(s).
                </p>
                {tenant.podeCriarUsuario ? (
                  <button
                    onClick={() => alert('Funcionalidade em desenvolvimento')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    + Adicionar Usuário
                  </button>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800">
                      ⚠️ Limite de usuários atingido. Faça upgrade do plano para adicionar mais usuários.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfiguracoesSaaS;
