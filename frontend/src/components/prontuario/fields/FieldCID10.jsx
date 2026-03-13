import { useState, useCallback, useRef, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function FieldCID10({ field, value, onChange, readOnly }) {
  // value = { codigo: 'J45.0', descricao: 'Asma...' } | null
  const [query, setQuery] = useState(value ? `${value.codigo} — ${value.descricao}` : '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (value) {
      setQuery(`${value.codigo} — ${value.descricao}`);
    } else {
      setQuery('');
    }
  }, [value]);

  const search = useCallback((q) => {
    clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          `${API_BASE}/api/prontuario/cid10/buscar?q=${encodeURIComponent(q)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setResults(data.results || []);
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const select = (cid) => {
    setQuery(`${cid.codigo} — ${cid.descricao}`);
    setResults([]);
    onChange(field.id, { codigo: cid.codigo, descricao: cid.descricao });
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    onChange(field.id, null);
  };

  return (
    <div className="flex flex-col gap-1 relative">
      <label className="text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); search(e.target.value); }}
          disabled={readOnly}
          placeholder="Buscar por código ou descrição..."
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        {value && !readOnly && (
          <button onClick={clear} className="text-gray-400 hover:text-red-500 text-lg">&times;</button>
        )}
      </div>
      {value && (
        <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5 w-fit">
          {value.codigo} — {value.descricao}
        </span>
      )}
      {(results.length > 0 || loading) && (
        <ul className="absolute top-full mt-1 z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {loading && <li className="px-3 py-2 text-sm text-gray-400">Buscando...</li>}
          {results.map(cid => (
            <li
              key={cid.codigo}
              onClick={() => select(cid)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex gap-2"
            >
              <span className="font-mono font-semibold text-blue-600 whitespace-nowrap">{cid.codigo}</span>
              <span className="text-gray-700">{cid.descricao}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
