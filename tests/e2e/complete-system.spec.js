import { test, expect } from '@playwright/test';

// Configurações dos testes E2E
const SAEE_URL = 'http://localhost:3000';
const ADMIN_URL = 'http://localhost:3002';
const API_URL = 'http://localhost:3001';

test.describe('🎭 E2E - Sistema SAEE Completo', () => {
  
  test('Deve navegar pelo dashboard principal', async ({ page }) => {
    await page.goto(SAEE_URL);
    
    // Verificar se carregou o dashboard
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Verificar cards de estatísticas
    await expect(page.locator('[data-testid="total-pacientes"]')).toBeVisible();
    await expect(page.locator('[data-testid="agendamentos-hoje"]')).toBeVisible();
    
    // Verificar menu lateral
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText('Pacientes')).toBeVisible();
    await expect(page.getByText('Agendamentos')).toBeVisible();
    await expect(page.getByText('Configurações')).toBeVisible();
  });

  test('Deve gerenciar pacientes', async ({ page }) => {
    await page.goto(`${SAEE_URL}/pacientes`);
    
    // Aguardar carregamento da página
    await page.waitForSelector('[data-testid="pacientes-lista"]');
    
    // Clicar em novo paciente
    await page.click('button:has-text("Novo Paciente")');
    
    // Preencher formulário
    await page.fill('[name="nome"]', 'Paciente Teste E2E');
    await page.fill('[name="email"]', 'teste-e2e@email.com');
    await page.fill('[name="telefone"]', '11999999999');
    await page.fill('[name="cpf"]', '12345678901');
    
    // Salvar
    await page.click('button:has-text("Salvar")');
    
    // Verificar se foi criado
    await expect(page.getByText('Paciente Teste E2E')).toBeVisible();
  });

  test('Deve configurar WhatsApp', async ({ page }) => {
    await page.goto(`${SAEE_URL}/configuracoes`);
    
    // Navegar para aba WhatsApp
    await page.click('button:has-text("WhatsApp")');
    
    // Verificar status
    await expect(page.locator('[data-testid="whatsapp-status"]')).toBeVisible();
    
    // Se desconectado, gerar QR Code
    const isConnected = await page.locator('[data-testid="whatsapp-connected"]').isVisible();
    
    if (!isConnected) {
      await page.click('button:has-text("Conectar WhatsApp")');
      await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
    }
  });

  test('Deve realizar fluxo completo de atendimento', async ({ page }) => {
    await page.goto(`${SAEE_URL}/pacientes`);
    
    // Selecionar um paciente
    await page.click('[data-testid="paciente-item"]:first-child');
    
    // Iniciar atendimento
    await page.click('button:has-text("Iniciar Atendimento")');
    
    // Verificar modal de atendimento
    await expect(page.locator('[data-testid="atendimento-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="cronometro"]')).toBeVisible();
    
    // Verificar botões de controle
    await expect(page.locator('button:has-text("Pausar")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancelar")')).toBeVisible();
    
    // Simular pausa
    await page.click('button:has-text("Pausar")');
    await expect(page.locator('button:has-text("Retomar")')).toBeVisible();
    
    // Finalizar atendimento
    await page.click('button:has-text("Finalizar")');
    await expect(page.locator('[data-testid="atendimento-modal"]')).not.toBeVisible();
  });
});

test.describe('🏢 E2E - Intranet Altclinic', () => {
  
  test('Deve fazer login na intranet', async ({ page }) => {
    await page.goto(ADMIN_URL);
    
    // Verificar formulário de login
    await expect(page.locator('h1')).toContainText('Login');
    
    // Fazer login
    await page.fill('[name="email"]', 'admin@altclinic.com');
    await page.fill('[name="password"]', 'Admin123!');
    await page.click('button:has-text("Entrar")');
    
    // Verificar redirecionamento para dashboard
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.getByText('admin@altclinic.com')).toBeVisible();
  });

  test('Deve navegar pelo dashboard admin', async ({ page }) => {
    // Login primeiro
    await page.goto(ADMIN_URL);
    await page.fill('[name="email"]', 'admin@altclinic.com');
    await page.fill('[name="password"]', 'Admin123!');
    await page.click('button:has-text("Entrar")');
    
    // Verificar métricas
    await expect(page.locator('[data-testid="total-licencas"]')).toBeVisible();
    await expect(page.locator('[data-testid="licencas-ativas"]')).toBeVisible();
    await expect(page.locator('[data-testid="faturamento-mensal"]')).toBeVisible();
    
    // Verificar gráficos
    await expect(page.locator('[data-testid="grafico-faturamento"]')).toBeVisible();
    await expect(page.locator('[data-testid="grafico-licencas"]')).toBeVisible();
    
    // Verificar alertas
    await expect(page.locator('[data-testid="alertas-sistema"]')).toBeVisible();
  });

  test('Deve gerenciar licenças', async ({ page }) => {
    // Login
    await page.goto(ADMIN_URL);
    await page.fill('[name="email"]', 'admin@altclinic.com');
    await page.fill('[name="password"]', 'Admin123!');
    await page.click('button:has-text("Entrar")');
    
    // Navegar para licenças
    await page.click('a:has-text("Licenças")');
    
    // Verificar lista
    await expect(page.locator('[data-testid="licencas-tabela"]')).toBeVisible();
    
    // Testar busca
    await page.fill('[data-testid="busca-licencas"]', 'Clínica');
    await page.keyboard.press('Enter');
    
    // Criar nova licença
    await page.click('button:has-text("Nova Licença")');
    
    await page.fill('[name="id"]', 'lic_e2e_001');
    await page.fill('[name="nome_clinica"]', 'Clínica E2E Test');
    await page.fill('[name="email"]', 'admin@clinicae2e.com');
    await page.selectOption('[name="plano"]', 'basic');
    await page.fill('[name="valor_mensal"]', '199.90');
    
    await page.click('button:has-text("Salvar")');
    
    // Verificar se foi criada
    await expect(page.getByText('Clínica E2E Test')).toBeVisible();
  });

  test('Deve configurar licença específica', async ({ page }) => {
    // Login
    await page.goto(ADMIN_URL);
    await page.fill('[name="email"]', 'admin@altclinic.com');
    await page.fill('[name="password"]', 'Admin123!');
    await page.click('button:has-text("Entrar")');
    
    // Navegar para configurações
    await page.click('a:has-text("Configurações")');
    
    // Selecionar licença
    await page.click('[data-testid="select-licenca"]');
    await page.click('li:has-text("Clínica")'); // Primeira opção
    
    // Aguardar carregamento das configurações
    await page.waitForSelector('[data-testid="config-sections"]');
    
    // Navegar pelas abas
    await page.click('button:has-text("Email")');
    await expect(page.locator('[name="smtp_host"]')).toBeVisible();
    
    await page.click('button:has-text("WhatsApp")');
    await expect(page.locator('[data-testid="whatsapp-config"]')).toBeVisible();
    
    // Fazer uma alteração
    await page.click('button:has-text("Sistema")');
    await page.check('[name="debug_mode"]');
    await page.click('button:has-text("Salvar")');
    
    // Verificar mensagem de sucesso
    await expect(page.getByText('Configurações salvas')).toBeVisible();
  });

  test('Deve gerar relatórios', async ({ page }) => {
    // Login
    await page.goto(ADMIN_URL);
    await page.fill('[name="email"]', 'admin@altclinic.com');
    await page.fill('[name="password"]', 'Admin123!');
    await page.click('button:has-text("Entrar")');
    
    // Navegar para relatórios
    await page.click('a:has-text("Relatórios")');
    
    // Selecionar tipo de relatório
    await page.selectOption('[name="tipo"]', 'geral');
    await page.selectOption('[name="periodo"]', 'month');
    
    // Gerar relatório
    await page.click('button:has-text("Gerar Relatório")');
    
    // Verificar loading
    await expect(page.locator('[data-testid="loading-relatorio"]')).toBeVisible();
    
    // Aguardar conclusão
    await page.waitForSelector('[data-testid="relatorio-gerado"]', { timeout: 10000 });
    
    // Verificar se pode baixar
    await expect(page.locator('button:has-text("Download")')).toBeVisible();
  });
});

test.describe('🔄 E2E - Integração SAEE x Admin', () => {
  
  test('Deve sincronizar configurações entre sistemas', async ({ page, context }) => {
    // Abrir duas abas: SAEE e Admin
    const adminPage = await context.newPage();
    const saeePage = page;
    
    // Login no admin
    await adminPage.goto(ADMIN_URL);
    await adminPage.fill('[name="email"]', 'admin@altclinic.com');
    await adminPage.fill('[name="password"]', 'Admin123!');
    await adminPage.click('button:has-text("Entrar")');
    
    // Navegar para configurações no admin
    await adminPage.click('a:has-text("Configurações")');
    await adminPage.click('[data-testid="select-licenca"]');
    await adminPage.click('li:first-child');
    
    // Alterar configuração SMTP
    await adminPage.click('button:has-text("Email")');
    await adminPage.fill('[name="smtp_host"]', 'smtp.integration-test.com');
    await adminPage.click('button:has-text("Salvar")');
    
    // Verificar no SAEE se a alteração foi aplicada
    await saeePage.goto(`${SAEE_URL}/configuracoes`);
    await saeePage.click('button:has-text("Email")');
    
    // Aguardar a sincronização
    await saeePage.waitForTimeout(2000);
    
    // Verificar se a configuração foi atualizada
    const hostValue = await saeePage.inputValue('[name="smtp_host"]');
    expect(hostValue).toBe('smtp.integration-test.com');
  });

  test('Deve monitorar WhatsApp globalmente', async ({ page }) => {
    // Login no admin
    await page.goto(ADMIN_URL);
    await page.fill('[name="email"]', 'admin@altclinic.com');
    await page.fill('[name="password"]', 'Admin123!');
    await page.click('button:has-text("Entrar")');
    
    // Verificar dashboard com status global
    await expect(page.locator('[data-testid="whatsapp-global-status"]')).toBeVisible();
    
    // Navegar para monitoramento detalhado
    await page.click('[data-testid="whatsapp-global-status"]');
    
    // Verificar lista de sessões
    await expect(page.locator('[data-testid="sessoes-whatsapp"]')).toBeVisible();
    
    // Verificar se pode controlar sessões individualmente
    await expect(page.locator('button:has-text("Desconectar")')).toBeVisible();
    await expect(page.locator('button:has-text("Gerar QR")')).toBeVisible();
  });
});

test.describe('📱 E2E - Responsividade', () => {
  
  test('Deve funcionar em dispositivos móveis', async ({ page }) => {
    // Simular viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(SAEE_URL);
    
    // Verificar se menu mobile funciona
    await page.click('[data-testid="menu-mobile"]');
    await expect(page.locator('[data-testid="sidebar-mobile"]')).toBeVisible();
    
    // Verificar se cards se adaptam
    const cards = page.locator('[data-testid="dashboard-card"]');
    const cardCount = await cards.count();
    
    for (let i = 0; i < cardCount; i++) {
      await expect(cards.nth(i)).toBeVisible();
    }
  });

  test('Deve funcionar em tablets', async ({ page }) => {
    // Simular viewport tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto(ADMIN_URL);
    
    // Login
    await page.fill('[name="email"]', 'admin@altclinic.com');
    await page.fill('[name="password"]', 'Admin123!');
    await page.click('button:has-text("Entrar")');
    
    // Verificar layout tablet
    await expect(page.locator('[data-testid="dashboard-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
  });
});

test.describe('🔒 E2E - Segurança', () => {
  
  test('Deve proteger rotas administrativas', async ({ page }) => {
    // Tentar acessar admin sem login
    await page.goto(`${ADMIN_URL}/dashboard`);
    
    // Deve redirecionar para login
    await expect(page.locator('h1')).toContainText('Login');
  });

  test('Deve fazer logout corretamente', async ({ page }) => {
    // Login
    await page.goto(ADMIN_URL);
    await page.fill('[name="email"]', 'admin@altclinic.com');
    await page.fill('[name="password"]', 'Admin123!');
    await page.click('button:has-text("Entrar")');
    
    // Fazer logout
    await page.click('[data-testid="user-menu"]');
    await page.click('button:has-text("Sair")');
    
    // Verificar redirecionamento
    await expect(page.locator('h1')).toContainText('Login');
    
    // Tentar acessar página protegida
    await page.goto(`${ADMIN_URL}/dashboard`);
    await expect(page.locator('h1')).toContainText('Login');
  });

  test('Deve validar formulários', async ({ page }) => {
    await page.goto(ADMIN_URL);
    
    // Tentar login com dados inválidos
    await page.fill('[name="email"]', 'email-invalido');
    await page.fill('[name="password"]', '123');
    await page.click('button:has-text("Entrar")');
    
    // Verificar mensagens de erro
    await expect(page.getByText('Email inválido')).toBeVisible();
    await expect(page.getByText('Senha muito curta')).toBeVisible();
  });
});
