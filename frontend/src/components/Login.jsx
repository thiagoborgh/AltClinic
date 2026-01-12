import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/login`, { email, senha });
      const token = response.data.token;
      localStorage.setItem('token', token);
      setToken(token);
      alert('Login bem-sucedido!');
    } catch (error) {
      console.error('Erro no login:', error.response?.data || error.message);
      alert('Erro no login: ' + (error.response?.data?.erro || error.message));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl flex flex-col md:flex-row">
        {/* Formulário de Login (Esquerda) */}
        <div className="w-full md:w-1/2 p-6">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              AC
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-700 text-center mb-6">AltClinic SaaS</h2>
          <p className="text-center text-sm text-gray-600 mb-4">Gestão de Clínicas Estéticas</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Usuário</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu usuário"
                className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700">Senha</label>
              <input
                type="password"
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <label className="flex items-center">
                <input type="checkbox" className="mr-1" /> Manter conectado
              </label>
              <a href="/esqueci-senha" className="text-blue-600 hover:underline">Recuperar Senha</a>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Acessar →
            </button>
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">© 2026 AltClinic SaaS. Todos os direitos reservados.</p>
            </div>
            <div className="text-center mt-2">
              <a href="/cadastro" className="text-blue-600 hover:underline font-semibold">Criar Nova Conta • R$ 19,90/mês</a>
            </div>
          </form>
        </div>

        {/* Benefícios do Sistema (Direita) */}
        <div className="w-full md:w-1/2 p-8 bg-gradient-to-br from-blue-600 to-blue-800 text-white flex flex-col justify-center">
          <h3 className="text-2xl font-bold mb-6">Sistema Completo para sua Clínica</h3>
          <ul className="space-y-4">
            <li className="flex items-start">
              <span className="text-2xl mr-3">📅</span>
              <div>
                <strong>Agenda Inteligente</strong>
                <p className="text-sm text-blue-100">Controle total de horários e profissionais</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-2xl mr-3">💬</span>
              <div>
                <strong>WhatsApp Integrado</strong>
                <p className="text-sm text-blue-100">Links diretos para confirmação</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-2xl mr-3">👥</span>
              <div>
                <strong>Multi-usuário</strong>
                <p className="text-sm text-blue-100">Até 3 usuários inclusos</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-2xl mr-3">💰</span>
              <div>
                <strong>R$ 19,90/mês</strong>
                <p className="text-sm text-blue-100">Sem taxa de adesão • Cancele quando quiser</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;