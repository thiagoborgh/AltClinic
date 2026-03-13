// frontend/src/components/pasta/abas/AbaPRESCRICOES.jsx
import { useState, useEffect } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const ITEM_VAZIO = { medicamento: '', dose: '', frequencia: '', duracao: '', via: 'oral', observacoes: '' };

export default function AbaPRESCRICOES({ pacienteId }) {
  const [prescricoes, setPrescricoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNova, setShowNova] = useState(false);
  const [itens, setItens] = useState([{ ...ITEM_VAZIO }]);
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/prontuario/prescricoes/paciente/${pacienteId}`, { headers: auth() })
      .then(r => r.json())
      .then(d => setPrescricoes(d.prescricoes || []))
      .finally(() => setLoading(false));
  }, [pacienteId]);

  const addItem = () => setItens(prev => [...prev, { ...ITEM_VAZIO }]);
  const removeItem = (i) => setItens(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) =>
    setItens(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const salvar = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/prontuario/prescricoes`, {
        method: 'POST',
        headers: { ...auth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ paciente_id: pacienteId, itens_json: itens, observacoes }),
      });
      const data = await res.json();
      if (data.success) {
        setPrescricoes(prev => [data.prescricao, ...prev]);
        setShowNova(false);
        setItens([{ ...ITEM_VAZIO }]);
        setObservacoes('');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-400 text-sm">Carregando prescrições...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Prescrições ({prescricoes.length})
        </h3>
        <button
          onClick={() => setShowNova(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md font-medium"
        >
          + Nova Prescrição
        </button>
      </div>

      {prescricoes.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Nenhuma prescrição registrada.</p>
      ) : (
        <div className="space-y-3">
          {prescricoes.map(p => (
            <div key={p.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {new Date(p.data_prescricao).toLocaleDateString('pt-BR')}
                </span>
                <span className="text-xs text-gray-400">{p.profissional_nome}</span>
              </div>
              {(p.itens_json || []).map((item, i) => (
                <div key={i} className="text-sm text-gray-600 border-l-2 border-blue-200 pl-3 mb-1">
                  <span className="font-medium">{item.medicamento}</span>
                  {item.dose && ` ${item.dose}`}
                  {item.frequencia && ` — ${item.frequencia}`}
                  {item.duracao && ` por ${item.duracao}`}
                </div>
              ))}
              {p.observacoes && (
                <p className="text-xs text-gray-400 mt-2 italic">{p.observacoes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal nova prescrição */}
      {showNova && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between">
              <h2 className="text-lg font-semibold">Nova Prescrição</h2>
              <button onClick={() => setShowNova(false)} className="text-gray-400 text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              {itens.map((item, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Item {i + 1}</span>
                    {itens.length > 1 && (
                      <button onClick={() => removeItem(i)} className="text-red-400 text-sm hover:text-red-600">
                        Remover
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {['medicamento','dose','frequencia','duracao','via'].map(field => (
                      <input
                        key={field}
                        placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                        value={item[field]}
                        onChange={e => updateItem(i, field, e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 text-sm
                                   focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ))}
                  </div>
                </div>
              ))}

              <button onClick={addItem}
                className="text-blue-600 text-sm hover:text-blue-800 font-medium">
                + Adicionar medicamento
              </button>

              <textarea
                placeholder="Observações gerais..."
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex justify-end gap-3">
                <button onClick={() => setShowNova(false)} className="px-4 py-2 text-sm text-gray-600">
                  Cancelar
                </button>
                <button
                  onClick={salvar}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium"
                >
                  {saving ? 'Salvando...' : 'Salvar Prescrição'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
