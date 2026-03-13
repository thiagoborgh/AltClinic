// frontend/src/pages/PacientePasta.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PastaHeader from '../components/pasta/PastaHeader';
import PastaNav from '../components/pasta/PastaNav';
import AbaPRONTUARIO from '../components/pasta/abas/AbaPRONTUARIO';
import AbaPRESCRICOES from '../components/pasta/abas/AbaPRESCRICOES';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function PacientePasta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [activeTab, setActiveTab] = useState('prontuario');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API}/api/pacientes/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => setPaciente(d.paciente || d))
      .catch(() => navigate('/pacientes'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Carregando pasta do paciente...
      </div>
    );
  }

  if (!paciente) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <PastaHeader paciente={paciente} />
      <PastaNav activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="max-w-6xl mx-auto">
        {activeTab === 'dados' && (
          <div className="p-6 text-sm text-gray-500 italic">
            Aba Dados — migrar componente existente de perfil do paciente aqui.
          </div>
        )}
        {activeTab === 'prontuario' && <AbaPRONTUARIO pacienteId={id} />}
        {activeTab === 'prescricoes' && <AbaPRESCRICOES pacienteId={id} />}
      </div>
    </div>
  );
}
