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
            <img src="/logo.png" alt="Logo Panda Clinic" className="w-16 h-16 object-cover rounded" />
          </div>
          <h2 className="text-2xl font-bold text-gray-700 text-center mb-6">Acesse sua Conta</h2>
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
              <p className="text-sm text-gray-600">© 2025 Panda Clinic. Todos os direitos reservados.</p>
            </div>
            <div className="text-center mt-2">
              <a href="/cadastro" className="text-blue-600 hover:underline">Criar Nova Conta</a>
            </div>
          </form>
        </div>

        {/* Espaço para Propaganda (Direita em desktop, abaixo em mobile) */}
        <div className="w-full md:w-1/2 p-6 flex flex-col items-center justify-center relative bg-gray-200">
          <img src="/propaganda.jpg" alt="Promoção Panda Clinic" className="w-full h-64 object-cover rounded-lg" />
          <div className="text-center mt-4">
            <a href="#" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Saiba Mais</a>
          </div>
          <button className="absolute top-4 right-4 text-gray-700 hover:text-gray-900 md:hidden" onClick={() => {}}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;