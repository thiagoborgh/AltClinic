export default function FieldRadio({ field, value, onChange, readOnly }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{field.label}</label>
      <div className="flex flex-wrap gap-3">
        {(field.options || []).map(opt => (
          <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input
              type="radio"
              name={field.id}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(field.id, opt)}
              disabled={readOnly}
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}
