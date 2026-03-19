import { useState, useEffect, useRef } from 'react';

export function useFilaEspera(profissionalId) {
  const [fila, setFila] = useState([]);
  const [meta, setMeta] = useState(null);
  const eventSourceRef = useRef(null);

  const fetchFila = async () => {
    const params = profissionalId ? `?profissional_id=${profissionalId}` : '';
    const res = await fetch(`/api/fila${params}`, {
      headers: {
        Authorization:  `Bearer ${localStorage.getItem('token')}`,
        'X-Tenant-Slug': window.__TENANT_SLUG__,
      },
    });
    const json = await res.json();
    if (json.success) {
      setFila(json.data);
      setMeta(json.meta);
    }
  };

  useEffect(() => {
    fetchFila();

    const sseSupported = typeof EventSource !== 'undefined';
    if (sseSupported) {
      const params = profissionalId ? `?profissional_id=${profissionalId}` : '';
      const es = new EventSource(`/api/fila/events${params}`, { withCredentials: false });

      es.onmessage = (e) => {
        const evento = JSON.parse(e.data);
        if (evento.tipo !== 'heartbeat') {
          fetchFila();
        }
      };

      es.onerror = () => {
        es.close();
        const interval = setInterval(fetchFila, 30_000);
        return () => clearInterval(interval);
      };

      eventSourceRef.current = es;
      return () => es.close();
    } else {
      const interval = setInterval(fetchFila, 30_000);
      return () => clearInterval(interval);
    }
  }, [profissionalId]);

  return { fila, meta, refetch: fetchFila };
}
