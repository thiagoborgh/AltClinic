import { Route, Routes, Navigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import Agenda from './components/Agenda';
import ConfiguracoesSaaS from './components/ConfiguracoesSaaS';
import Login from './components/Login';
import Agendamento from './components/Agendamento';
import PerfilProfissional from './components/PerfilProfissional';
import Navbar from './components/Navbar';
import Cadastro from './components/Cadastro';
import EsqueciSenha from './components/EsqueciSenha';

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
          <Route path="/cadastro" element={token ? <Navigate to="/configuracoes" /> : <Cadastro />} />
          <Route path="/configuracoes" element={token ? <ConfiguracoesSaaS /> : <Navigate to="/login" />} />
          <Route path="/agenda" element={token ? <Agenda /> : <Navigate to="/login" />} />
          <Route path="/agendamento" element={token ? <Agendamento /> : <Navigate to="/login" />} />
          <Route path="/perfil-profissional/:id?" element={token ? <PerfilProfissional /> : <Navigate to="/login" />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/" element={token ? <Navigate to="/configuracoes" /> : <Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;