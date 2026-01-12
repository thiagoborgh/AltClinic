import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';

function Home() {
  const stats = [
    { title: 'Acessos do login', value: '327', subtext: 'Últ. acesso: 02/06/2025 05:14', icon: '👤' },
    { title: 'Produtos próximo a vencer', value: '0', icon: '📅', link: '/ver-produtos' },
    { title: 'Contas vencidas', value: '246', icon: '💰', link: '/contas-a-pagar' },
    { title: 'Itens abaixo do mínimo', value: '2', icon: '📦', link: '/controle-de-estoque' },
    { title: 'Novos pacientes', value: '8', subtext: '0 Homens | 0 Mulheres', icon: '👥' },
    { title: 'Boletos inadimplentes', value: '66', icon: '📜', link: '/ver-boletos' },
  ];

  const additionalResources = [
    { title: 'Telemedicina', icon: '💻', link: '/telemedicina' },
    { title: 'Chamadas na TV', icon: '📺', link: '/chamadas-na-tv' },
    { title: 'Cartão de Benefícios', icon: '💳', link: '/cartao-de-beneficios' },
    { title: 'E-mails!', icon: '✉️', link: '/emails' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Navbar />
      <main className="flex-1 p-6 overflow-auto">
        <h2 className="text-xl font-semibold mb-4">Bem-vindo ao Feegow Clinic / Resumo da semana</h2>
        <div className="bg-gradient-to-r from-blue-900 to-teal-600 p-6 rounded-lg text-white mb-6 relative">
          <h3 className="text-3xl font-bold">Adesão zero</h3>
          <button className="mt-4 px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-gray-100">+ Ver novidades</button>
          <button className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600">Acesse o blog Feegow</button>
          <div className="absolute top-4 right-4 text-sm text-gray-200">
            Oferta por tempo limitado! *Com exceção para o Módulo Laboratorial, TEF e BI.
          </div>
          <div className="absolute bottom-4 right-4">
            <button className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-gray-100">Saiba mais</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <div className="text-2xl mb-2">+ recursos adicionais.</div>
            {additionalResources.map((resource, index) => (
              <div key={index} className="flex items-center justify-center my-2">
                <span className="mr-2">{resource.icon}</span>
                <Link to={resource.link} className="text-blue-600 hover:text-blue-800">{resource.title}</Link>
              </div>
            ))}
          </div>
          {additionalResources.slice(0, 3).map((resource, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow-md text-center">
              <span className="text-2xl mb-2">{resource.icon}</span>
              <Link to={resource.link} className="text-blue-600 hover:text-blue-800 block mt-2">{resource.title}</Link>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow-md text-center">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.title}</div>
              {stat.subtext && <div className="text-xs text-gray-500 mt-1">{stat.subtext}</div>}
              {stat.link && (
                <Link to={stat.link} className="text-blue-600 text-sm mt-2 block hover:text-blue-800">
                  {stat.icon === '👤' ? '👤' : stat.icon === '📅' ? '📅 Ver os produtos' : stat.icon === '💰' ? '💰 Contas a pagar' : stat.icon === '📦' ? '📦 Controle de estoque' : '📜 Ver boletos'}
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/agendamento" className="bg-white p-4 rounded-lg shadow-md hover:bg-gray-50">
            <h3 className="text-lg font-semibold">Agendamento</h3>
            <p className="text-sm text-gray-600">Gerencie os agendamentos diários, semanais ou mensais.</p>
          </Link>
          <Link to="/perfil-profissional/novo" className="bg-white p-4 rounded-lg shadow-md hover:bg-gray-50">
            <h3 className="text-lg font-semibold">Cadastro de Profissional</h3>
            <p className="text-sm text-gray-600">Adicione e edite informações de profissionais.</p>
          </Link>
          <Link to="/configuracoes" className="bg-white p-4 rounded-lg shadow-md hover:bg-gray-50">
            <h3 className="text-lg font-semibold">Configurações Gerais</h3>
            <p className="text-sm text-gray-600">Gerencie unidades, permissões e mais.</p>
          </Link>
          <Link to="/cadastros-gerais" className="bg-white p-4 rounded-lg shadow-md hover:bg-gray-50">
            <h3 className="text-lg font-semibold">Cadastros Gerais</h3>
            <p className="text-sm text-gray-600">Cadastre procedimentos, itens de estoque e empresas conveniadas.</p>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default Home;