import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaCog, FaBars, FaSearch, FaTimes } from 'react-icons/fa';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const user = {
    nome: 'Nome Fantasia - PANDA CLINIC',
    email: 'chamadas@feegow.feegowclinic',
    ultimoAcesso: '02/06/2025 05:14',
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleSearch = () => setIsSearchOpen(!isSearchOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  return (
    <nav className="bg-white shadow-md p-4">
      <div className="flex justify-between items-center">
        {/* Logo ou Ícone de Menu Hambúrguer */}
        <div className="flex items-center">
          <button className="md:hidden text-gray-600 focus:outline-none" onClick={toggleMenu}>
            {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
          <div className="hidden md:flex space-x-6">
            <Link to="/agenda" className="text-blue-600 hover:text-blue-800">Agenda</Link>
            <Link to="/espera" className="text-blue-600 hover:text-blue-800">Espera</Link>
            <Link to="/pacientes" className="text-blue-600 hover:text-blue-800">Pacientes</Link>
            <Link to="/estoque" className="text-blue-600 hover:text-blue-800">Estoque</Link>
            <Link to="/financeiro" className="text-blue-600 hover:text-blue-800">Financeiro</Link>
            <Link to="/relatorios" className="text-blue-600 hover:text-blue-800">Relatórios</Link>
          </div>
        </div>

        {/* Busca e Informações do Usuário */}
        <div className="flex items-center space-x-4">
          {/* Campo de Busca */}
          <div className="relative">
            <button className="md:hidden text-gray-600 focus:outline-none" onClick={toggleSearch}>
              <FaSearch size={20} />
            </button>
            <input
              type="text"
              placeholder="Busca rápida..."
              className={`p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 
                ${isSearchOpen ? 'block w-48 absolute right-0 top-10 z-10 md:static md:w-auto' : 'hidden md:block'}`}
            />
          </div>

          {/* Informações do Usuário */}
          <div className="relative">
            <button className="flex items-center space-x-2 focus:outline-none" onClick={toggleUserMenu}>
              <FaUser className="text-gray-600" />
              <span className="hidden md:inline">{user.nome}</span>
            </button>
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div className="p-3">
                  <p className="text-sm font-medium">{user.nome}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400">Últ. acesso: {user.ultimoAcesso}</p>
                  <Link to="/configuracoes" className="flex items-center mt-2 text-blue-600 hover:text-blue-800">
                    <FaCog className="mr-2" /> Configurações
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu Hambúrguer (visível apenas em telas pequenas) */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 bg-white border-t border-gray-200">
          <div className="flex flex-col space-y-2 p-4">
            <Link to="/agenda" className="text-blue-600 hover:text-blue-800" onClick={toggleMenu}>Agenda</Link>
            <Link to="/espera" className="text-blue-600 hover:text-blue-800" onClick={toggleMenu}>Espera</Link>
            <Link to="/pacientes" className="text-blue-600 hover:text-blue-800" onClick={toggleMenu}>Pacientes</Link>
            <Link to="/estoque" className="text-blue-600 hover:text-blue-800" onClick={toggleMenu}>Estoque</Link>
            <Link to="/financeiro" className="text-blue-600 hover:text-blue-800" onClick={toggleMenu}>Financeiro</Link>
            <Link to="/relatorios" className="text-blue-600 hover:text-blue-800" onClick={toggleMenu}>Relatórios</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;