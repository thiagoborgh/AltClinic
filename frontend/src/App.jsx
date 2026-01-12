import { Route, Routes, Navigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import Agenda from './components/Agenda';
import Configuracoes from './components/Configuracoes';
import Login from './components/Login';
import Home from './components/Home';
import Agendamento from './components/Agendamento';
import PerfilProfissional from './components/PerfilProfissional';
import Navbar from './components/Navbar';
import Cadastro from './components/Cadastro'; // Crie este componente
import EsqueciSenha from './components/EsqueciSenha'; // Crie este componente

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) setToken(storedToken);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {token && <Navbar className="fixed w-full z-10" />} {/* Navbar só aparece se houver token */}
      <main className="flex-1 pt-16">
        <Routes>
          <Route path="/login" element={token ? <Navigate to="/configuracoes" /> : <Login setToken={setToken} />} />
          <Route path="/configuracoes" element={token ? <Configuracoes /> : <Navigate to="/login" />} />
          <Route path="/agenda" element={token ? <Agenda /> : <Navigate to="/login" />} />
          <Route path="/" element={token ? <Navigate to="/agenda" /> : <Navigate to="/login" />} />
          <Route path="/home" element={<Home />} />
          <Route path="/agendamento" element={<Agendamento />} />
          <Route path="/perfil-profissional/:id?" element={<PerfilProfissional />} />
          <Route path="/cadastros-gerais" element={<div>Cadastros Gerais (a implementar)</div>} />
          <Route path="/cadastro" element={<Cadastro />} /> {/* Nova rota */}
          <Route path="/esqueci-senha" element={<EsqueciSenha />} /> {/* Nova rota */}
        </Routes>
      </main>
    </div>
  );
}

export default App;