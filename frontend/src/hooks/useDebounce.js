import { useState, useEffect, useCallback } from 'react';

// Hook para debounce de valores
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook específico para busca de pacientes com debounce
export const usePacienteSearch = (searchTerm = '', delay = 300) => {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  const searchPacientes = useCallback(async (term) => {
    if (!term.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);

      const response = await fetch(`/api/pacientes/search?q=${encodeURIComponent(term)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Erro na busca');

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    searchPacientes(debouncedSearchTerm);
  }, [debouncedSearchTerm, searchPacientes]);

  return {
    debouncedSearchTerm,
    isSearching,
    results,
    error,
    clearResults: () => setResults([])
  };
};