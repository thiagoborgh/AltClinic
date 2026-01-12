import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const Cadastro = () => {
  const [nomeClinica, setNomeClinica] = useState('');
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCadastro = async (e) => {
    e.preventDefault();
    
    // Validações
    if (senha !== confirmarSenha) {
      alert('As senhas não coincidem!');
      return;
    }

    if (senha.length < 6) {
      alert('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/cadastro`, {
        nomeClinica,
        nomeUsuario,
        email,
        telefone,
        senha
      });

      // Armazenar token
      localStorage.setItem('token', response.data.token);
      
      alert(`✅ Cadastro realizado com sucesso!\n\n🎉 Bem-vindo(a) ao ${nomeClinica}!\n\n💳 Configure o pagamento de R$ 19,90/mês para ativar todas as funcionalidades.`);
      
      // Redirecionar para configurações de pagamento
      navigate('/configuracoes');
    } catch (error) {
      console.error('Erro no cadastro:', error.response?.data || error.message);
      alert('Erro no cadastro: ' + (error.response?.data?.erro || 'Erro ao processar cadastro'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        {/* Logo e Título */}
        <div className="text-center mb-6">
          <div className="inline-block bg-blue-600 rounded-full p-3 mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Crie sua Conta</h2>
          <p className="text-gray-600">R$ 19,90/mês • Até 3 usuários</p>
        </div>

        {/* Benefícios */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 font-semibold mb-2">✨ O que você ganha:</p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>📅 Agenda completa para agendamentos</li>
            <li>👥 Até 3 usuários no plano</li>
            <li>📱 Notificações por WhatsApp</li>
            <li>💳 R$ 19,90/mês - Pagamento mensal</li>
          </ul>
        </div>

        {/* Formulário */}
        <form onSubmit={handleCadastro} className="space-y-4">
          <div>
            <label htmlFor="nomeClinica" className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Clínica *
            </label>
            <input
              type="text"
              id="nomeClinica"
              value={nomeClinica}
              onChange={(e) => setNomeClinica(e.target.value)}
              placeholder="Ex: Clínica Bella Estética"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="nomeUsuario" className="block text-sm font-medium text-gray-700 mb-1">
              Seu Nome *
            </label>
            <input
              type="text"
              id="nomeUsuario"
              value={nomeUsuario}
              onChange={(e) => setNomeUsuario(e.target.value)}
              placeholder="Ex: Maria Silva"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-mail *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">
              Telefone/WhatsApp
            </label>
            <input
              type="tel"
              id="telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
              Senha * (mínimo 6 caracteres)
            </label>
            <input
              type="password"
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Senha *
            </label>
            <input
              type="password"
              id="confirmarSenha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Criando conta...' : 'Criar Conta Grátis →'}
          </button>

          <div className="text-center text-xs text-gray-500 mt-4">
            Ao criar sua conta, você concorda com nossos{' '}
            <a href="#" className="text-blue-600 hover:underline">Termos de Uso</a> e{' '}
            <a href="#" className="text-blue-600 hover:underline">Política de Privacidade</a>
          </div>

          <div className="text-center mt-4 pt-4 border-t border-gray-200">
            <span className="text-gray-600">Já tem uma conta? </span>
            <a href="/login" className="text-blue-600 hover:underline font-semibold">
              Fazer login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Cadastro;