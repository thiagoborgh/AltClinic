module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  verbose: true,
  testTimeout: 30000,
  // Ignorar pastas problemáticas
  testPathIgnorePatterns: [
    '/node_modules/',
    '/backend/',
    '/admin/',
    '/frontend/',
    '/public/'
  ],
  modulePathIgnorePatterns: [
    '/backend/',
    '/admin/',
    '/frontend/',
    '/public/'
  ],
  // Configurações para detectar vazamentos
  detectOpenHandles: true,
  forceExit: true,
  // Configurações de limpeza
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Configurações de paralelização
  maxWorkers: 1, // Evitar conflitos de banco de dados
  // Configurações de relatório
  reporters: [
    'default'
  ]
};