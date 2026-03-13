export default function FieldMemo({ field, value, onChange, readOnly }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        value={value || ''}
        onChange={e => onChange(field.id, e.target.value)}
        disabled={readOnly}
        placeholder={field.placeholder || ''}
        rows={4}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>
  );
}
