// frontend/src/components/pasta/abas/RegistroCard.jsx
export default function RegistroCard({ registro, formDefinition, onExpand }) {
  const tipo = formDefinition?.type || 'registro';
  const TIPO_COLORS = {
    anamnese:     'bg-blue-50  border-blue-200  text-blue-700',
    evolucao:     'bg-green-50 border-green-200 text-green-700',
    laudo:        'bg-purple-50 border-purple-200 text-purple-700',
    formulario:   'bg-gray-50  border-gray-200  text-gray-700',
    ordem_servico:'bg-orange-50 border-orange-200 text-orange-700',
  };
  const colorClass = TIPO_COLORS[tipo] || TIPO_COLORS.formulario;

  return (
    <div
      className="border border-gray-200 rounded-lg p-4 cursor-pointer
                 hover:border-blue-300 hover:shadow-sm transition-all bg-white"
      onClick={() => onExpand(registro)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${colorClass}`}>
              {formDefinition?.name || 'Formulário'}
            </span>
            {registro.assinado && (
              <span className="text-xs bg-green-100 text-green-700 border border-green-200
                               rounded px-2 py-0.5">
                ✓ Assinado
              </span>
            )}
            {registro.tipo_registro === 'addendum' && (
              <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-200
                               rounded px-2 py-0.5">
                Addendum
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {registro.profissional_nome || 'Profissional'} •{' '}
            {new Date(registro.data_registro).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <span className="text-gray-400 text-lg">›</span>
      </div>
    </div>
  );
}
