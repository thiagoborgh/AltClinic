export default function FieldDate({ field, value, onChange, readOnly }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="date"
        value={value || ''}
        onChange={e => onChange(field.id, e.target.value)}
        disabled={readOnly}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>
  );
}
