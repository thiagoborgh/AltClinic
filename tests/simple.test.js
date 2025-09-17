// 🧪 Teste Simples de Configuração
// Verificar se Jest está funcionando corretamente

describe('Configuração do Jest', () => {
  test('deve estar funcionando corretamente', () => {
    expect(true).toBe(true);
  });

  test('deve ter acesso aos mocks globais', () => {
    expect(jest).toBeDefined();
    expect(global.fetch).toBeDefined();
  });

  test('deve ter acesso ao global', () => {
    expect(global).toBeDefined();
    expect(typeof global.setTimeout).toBe('function');
  });
});
