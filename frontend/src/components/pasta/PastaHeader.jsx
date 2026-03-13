// frontend/src/components/pasta/PastaHeader.jsx
export default function PastaHeader({ paciente }) {
  if (!paciente) return null;

  const idade = paciente.data_nascimento
    ? Math.floor((Date.now() - new Date(paciente.data_nascimento)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center
                        text-blue-600 font-semibold text-lg flex-shrink-0">
          {paciente.nome?.charAt(0).toUpperCase()}
        </div>

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-gray-900 truncate">{paciente.nome}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
            {idade && <span>{idade} anos</span>}
            {paciente.cpf && <span>CPF: {paciente.cpf}</span>}
            {paciente.numero_prontuario && (
              <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                Pront. #{paciente.numero_prontuario}
              </span>
            )}
          </div>
        </div>

        {/* Alertas */}
        {paciente.observacoes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2
                          text-sm text-yellow-800 max-w-xs">
            ⚠️ {paciente.observacoes}
          </div>
        )}
      </div>
    </div>
  );
}
