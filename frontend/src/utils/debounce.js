/**
 * Utilitários para debounce e throttle para otimizar performance
 */
import { useState, useEffect } from 'react';

/**
 * Debounce - executa função após delay sem novas chamadas
 * @param {Function} func - Função a ser executada
 * @param {number} delay - Delay em milissegundos
 * @returns {Function} - Função com debounce aplicado
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Throttle - executa função no máximo uma vez por período
 * @param {Function} func - Função a ser executada
 * @param {number} delay - Período mínimo entre execuções
 * @returns {Function} - Função com throttle aplicado
 */
export const throttle = (func, delay) => {
  let lastExec = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastExec >= delay) {
      lastExec = now;
      func.apply(null, args);
    }
  };
};

/**
 * Hook para debounce de valores
 * @param {any} value - Valor a ser debounced
 * @param {number} delay - Delay em milissegundos
 * @returns {any} - Valor com debounce aplicado
 */
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

/**
 * Singleton para controlar execução única de funções
 */
class ExecutionController {
  constructor() {
    this.executing = new Set();
  }

  async execute(key, func) {
    if (this.executing.has(key)) {
      console.log(`⏳ Execução já em progresso para: ${key}`);
      return; // Retorna undefined em vez de null
    }

    this.executing.add(key);
    try {
      const result = await func();
      return result;
    } catch (error) {
      console.error(`Erro na execução de ${key}:`, error);
      throw error; // Re-throw para que o chamador possa tratar
    } finally {
      this.executing.delete(key);
    }
  }

  isExecuting(key) {
    return this.executing.has(key);
  }
}

export const executionController = new ExecutionController();