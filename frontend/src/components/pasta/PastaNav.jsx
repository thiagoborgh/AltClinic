// frontend/src/components/pasta/PastaNav.jsx
const TABS = [
  { id: 'dados',       label: 'Dados',        icon: '👤' },
  { id: 'prontuario',  label: 'Prontuário',    icon: '📋' },
  { id: 'prescricoes', label: 'Prescrições',   icon: '💊' },
  { id: 'documentos',  label: 'Documentos',    icon: '📁', disabled: true },
  { id: 'financeiro',  label: 'Financeiro',    icon: '💰', disabled: true },
  { id: 'historico',   label: 'Histórico',     icon: '🕐', disabled: true },
];

export default function PastaNav({ activeTab, onTabChange }) {
  return (
    <div className="bg-white border-b border-gray-200">
      <nav className="flex overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            className={`
              flex items-center gap-1.5 px-5 py-3 text-sm font-medium whitespace-nowrap
              border-b-2 transition-colors
              ${activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.disabled && (
              <span className="text-xs text-gray-400 ml-1">(em breve)</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
