// frontend/src/components/pasta/abas/AbaPRONTUARIO.jsx
import { useState, useEffect } from 'react';
import RegistroCard from './RegistroCard';
import FormRenderer from '../../prontuario/FormRenderer';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function AbaPRONTUARIO({ pacienteId }) {
  const [registros, setRegistros] = useState([]);
  const [formularios, setFormularios] = useState([]);
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [selectedFormDef, setSelectedFormDef] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/prontuario/registros/paciente/${pacienteId}`, { headers: auth(), signal }).then(r => r.json()),
      fetch(`${API}/api/prontuario/formularios`, { headers: auth(), signal }).then(r => r.json()),
      fetch(`${API}/api/prontuario/diagnosticos/paciente/${pacienteId}`, { headers: auth(), signal }).then(r => r.json()),
    ]).then(([reg, forms, diags]) => {
      setRegistros(reg.registros || []);
      setFormularios(forms.formularios || []);
      setDiagnosticos(diags.diagnosticos || []);
    }).catch(e => { if (e.name !== 'AbortError') console.error(e); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [pacienteId]);

  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const salvarRegistro = async () => {
    if (!selectedFormDef) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/prontuario/registros`, {
        method: 'POST',
        headers: { ...auth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paciente_id: pacienteId,
          form_definition_id: selectedFormDef.id,
          data_json: formData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRegistros(prev => [data.registro, ...prev]);
        setShowNovoModal(false);
        setSelectedFormDef(null);
        setFormData({});
        setSaveError(null);
      } else {
        setSaveError(data.error || 'Erro ao salvar registro.');
      }
    } catch (e) {
      setSaveError('Erro ao salvar registro.');
    } finally {
      setSaving(false);
    }
  };

  const getFormDef = (id) => formularios.find(f => f.id === id);

  if (loading) return <div className="p-6 text-gray-400 text-sm">Carregando prontuário...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Diagnósticos CID-10 */}
      {diagnosticos.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Diagnósticos Ativos
          </h3>
          <div className="flex flex-wrap gap-2">
            {diagnosticos.map(d => (
              <span key={d.id}
                className="text-xs bg-red-50 border border-red-200 text-red-700
                           rounded px-2 py-1 font-mono">
                {d.cid10_codigo} — {d.cid10_descricao}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Ação principal */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Registros ({registros.length})
        </h3>
        <button
          onClick={() => setShowNovoModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm
                     px-4 py-2 rounded-md font-medium transition-colors"
        >
          + Nova Anamnese / Evolução
        </button>
      </div>

      {/* Lista de registros */}
      {registros.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Nenhum registro encontrado.</p>
      ) : (
        <div className="space-y-3">
          {registros.map(r => (
            <RegistroCard
              key={r.id}
              registro={r}
              formDefinition={getFormDef(r.form_definition_id)}
              onExpand={() => {}}
            />
          ))}
        </div>
      )}

      {/* Modal: Selecionar template e preencher */}
      {showNovoModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between">
              <h2 className="text-lg font-semibold">
                {selectedFormDef ? selectedFormDef.name : 'Selecionar Formulário'}
              </h2>
              <button onClick={() => { setShowNovoModal(false); setSelectedFormDef(null); setFormData({}); setSaveError(null); }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="p-6">
              {!selectedFormDef ? (
                <div className="space-y-2">
                  {formularios.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFormDef(f)}
                      className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg
                                 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-sm text-gray-800">{f.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {f.specialty} • {f.type}
                        {f.is_system && ' • Template padrão'}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <FormRenderer
                    definition={selectedFormDef}
                    data={formData}
                    onChange={handleFieldChange}
                  />
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setSelectedFormDef(null)}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={salvarRegistro}
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2
                                 rounded-md text-sm font-medium disabled:opacity-50"
                    >
                      {saving ? 'Salvando...' : 'Salvar Registro'}
                    </button>
                  </div>
                  {saveError && <p className="text-sm text-red-600 mt-2">{saveError}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
