// Setup global para testes
require('@testing-library/jest-dom');

const fs = require('fs');
const path = require('path');

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock de fetch
global.fetch = jest.fn();

// Setup inicial
beforeAll(async () => {
  // Garantir que o diretório de bancos de dados existe
  const dbDir = path.join(__dirname, '..', 'databases');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Limpar bancos de dados de teste anteriores
  try {
    const files = fs.readdirSync(dbDir);
    files.forEach(file => {
      if (file.startsWith('tenant_') && file.includes('test')) {
        const filePath = path.join(dbDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });
  } catch (error) {
    console.log('Erro ao limpar bancos de teste:', error.message);
  }
});

// Mock de console.error para testes mais limpos
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (args[0]?.includes?.('Warning:')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Reset de mocks e limpeza após cada teste
afterEach(async () => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  localStorage.clear();

  // Forçar garbage collection se disponível
  if (global.gc) {
    global.gc();
  }

  // Limpar bancos de dados de teste
  try {
    const dbDir = path.join(__dirname, '..', 'databases');
    if (fs.existsSync(dbDir)) {
      const files = fs.readdirSync(dbDir);
      files.forEach(file => {
        if (file.startsWith('tenant_') && file.includes('test')) {
          const filePath = path.join(dbDir, file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      });
    }
  } catch (error) {
    console.log('Erro ao limpar bancos de teste:', error.message);
  }
});
