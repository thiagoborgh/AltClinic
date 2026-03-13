export default function FieldCheck({ field, value, onChange, readOnly }) {
  const selected = Array.isArray(value) ? value : [];
  const toggle = (opt) => {
    const next = selected.includes(opt)
      ? selected.filter(v => v !== opt)
      : [...selected, opt];
    onChange(field.id, next);
  };
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{field.label}</label>
      <div className="flex flex-wrap gap-2">
        {(field.options || []).map(opt => (
          <label key={opt} className="flex items-center gap-1 cursor-pointer text-sm">
            <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} disabled={readOnly} />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}
