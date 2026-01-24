import { test, expect } from '@playwright/test';

// Configurações dos testes E2E
const SAEE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'teste@clinicae2e.com',
  password: 'Teste123!',
  clinica: 'Clínica E2E Test'
};

const TEST_PATIENT = {
  nome: 'Paciente Teste E2E',
  email: 'paciente@teste.com',
  telefone: '11999999999',
  cpf: '12345678901'
};

test.describe('🚀 E2E - Fluxos Críticos do SAEE', () => {

  test.beforeEach(async ({ page }) => {
    // Configurar timeout maior para testes E2E
    test.setTimeout(120000); // 2 minutos

    // Limpar localStorage e cookies antes de cada teste
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('✅ Fluxo Completo de Onboarding', async ({ page }) => {
    // 1. Acessar landing page
    await page.goto(`${SAEE_URL}/landing`);
    await expect(page.locator('h1')).toContainText(/organize.*agenda/i);

    // 2. Clicar em "Comece agora"
    await page.click('a:has-text("Comece agora"), button:has-text("Comece agora")');

    // 3. Preencher cadastro
    await page.fill('[name="email"]', TEST_USER.email);
    await page.fill('[name="password"]', TEST_USER.password);
    await page.fill('[name="clinica"]', TEST_USER.clinica);
    await page.click('button:has-text("Cadastrar")');

    // 4. Aguardar redirecionamento e verificar onboarding wizard
    await page.waitForURL('**/agenda-lite**');
    await expect(page.locator('[data-testid="onboarding-wizard"]')).toBeVisible();

    // 5. Passo 1: Cadastro de Profissional
    await expect(page.getByText('Cadastro de Profissional')).toBeVisible();
    await page.fill('[name="nome"]', 'Dr. Teste E2E');
    await page.fill('[name="especialidade"]', 'Estética');
    await page.click('button:has-text("Próximo")');

    // 6. Passo 2: Definição de Horários
    await expect(page.getByText('Horários de Atendimento')).toBeVisible();
    await page.check('[name="dias"][value="segunda"]');
    await page.fill('[name="hora_inicio"]', '08:00');
    await page.fill('[name="hora_fim"]', '18:00');
    await page.click('button:has-text("Próximo")');

    // 7. Passo 3: Conexão WhatsApp
    await expect(page.getByText('Conectar WhatsApp')).toBeVisible();
    await page.click('button:has-text("Conectar WhatsApp")');

    // Aguardar QR Code aparecer
    await page.waitForSelector('[data-testid="qr-code"], [data-testid="whatsapp-connected"]', { timeout: 30000 });

    // Se QR Code apareceu, simular conexão (em ambiente real seria scan manual)
    const qrVisible = await page.locator('[data-testid="qr-code"]').isVisible();
    if (qrVisible) {
      // Em teste automatizado, vamos simular que o WhatsApp foi conectado
      await page.evaluate(() => {
        // Simular evento de conexão bem-sucedida
        window.dispatchEvent(new CustomEvent('whatsapp-connected'));
      });
    }

    await page.click('button:has-text("Próximo")');

    // 8. Passo 4: Mensagem de Teste
    await expect(page.getByText('Mensagem de Teste')).toBeVisible();
    await page.fill('[name="numero_teste"]', TEST_PATIENT.telefone);
    await page.click('button:has-text("Enviar Teste")');

    // Aguardar confirmação de envio
    await expect(page.getByText('Mensagem enviada')).toBeVisible();
    await page.click('button:has-text("Próximo")');

    // 9. Passo 5: Primeiro Agendamento
    await expect(page.getByText('Primeiro Agendamento')).toBeVisible();
    await page.fill('[name="paciente_nome"]', TEST_PATIENT.nome);
    await page.fill('[name="paciente_telefone"]', TEST_PATIENT.telefone);
    await page.fill('[name="data"]', '2025-01-30');
    await page.fill('[name="hora"]', '10:00');
    await page.selectOption('[name="profissional"]', 'Dr. Teste E2E');
    await page.click('button:has-text("Agendar")');

    // 10. Passo 6: Ativar Lembretes
    await expect(page.getByText('Ativar Lembretes')).toBeVisible();
    await page.check('[name="lembretes_ativos"]');
    await page.click('button:has-text("Concluir e Começar")');

    // 11. Verificar conclusão do onboarding
    await expect(page.locator('[data-testid="onboarding-wizard"]')).not.toBeVisible();
    await expect(page.getByText('Bem-vindo')).toBeVisible();
  });

  test('📱 Conexão e Desconexão WhatsApp', async ({ page }) => {
    // Login primeiro
    await page.goto(SAEE_URL);
    await page.fill('[name="email"]', TEST_USER.email);
    await page.fill('[name="password"]', TEST_USER.password);
    await page.click('button:has-text("Entrar")');

    // Navegar para configurações WhatsApp
    await page.click('a:has-text("Configurações")');
    await page.click('button:has-text("WhatsApp")');

    // Verificar status inicial
    await expect(page.locator('[data-testid="whatsapp-status"]')).toBeVisible();

    // Se desconectado, conectar
    const isConnected = await page.locator('[data-testid="whatsapp-connected"]').isVisible();

    if (!isConnected) {
      // Clicar para conectar
      await page.click('button:has-text("Conectar WhatsApp")');

      // Aguardar QR Code
      await page.waitForSelector('[data-testid="qr-code"]', { timeout: 10000 });

      // Simular conexão bem-sucedida
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('whatsapp-connected'));
      });

      // Verificar status conectado
      await expect(page.locator('[data-testid="whatsapp-connected"]')).toBeVisible();
    }

    // Testar desconexão
    await page.click('button:has-text("Desconectar")');

    // Confirmar desconexão
    await page.click('button:has-text("Confirmar")');

    // Verificar status desconectado
    await expect(page.locator('[data-testid="whatsapp-disconnected"]')).toBeVisible();
  });

  test('📅 Criação de Agendamento', async ({ page }) => {
    // Login
    await page.goto(SAEE_URL);
    await page.fill('[name="email"]', TEST_USER.email);
    await page.fill('[name="password"]', TEST_USER.password);
    await page.click('button:has-text("Entrar")');

    // Navegar para agenda
    await page.click('a:has-text("Agenda")');

    // Clicar em novo agendamento
    await page.click('button:has-text("Novo Agendamento")');

    // Preencher dados do paciente
    await page.fill('[name="paciente_nome"]', TEST_PATIENT.nome);
    await page.fill('[name="paciente_telefone"]', TEST_PATIENT.telefone);
    await page.fill('[name="paciente_email"]', TEST_PATIENT.email);

    // Selecionar data e hora
    await page.fill('[name="data"]', '2025-01-30');
    await page.fill('[name="hora"]', '14:00');

    // Selecionar profissional
    await page.selectOption('[name="profissional"]', 'Dr. Teste E2E');

    // Selecionar serviço
    await page.selectOption('[name="servico"]', 'Consulta');

    // Adicionar observações
    await page.fill('[name="observacoes"]', 'Agendamento criado via teste E2E');

    // Salvar agendamento
    await page.click('button:has-text("Salvar")');

    // Verificar se foi criado
    await expect(page.getByText(TEST_PATIENT.nome)).toBeVisible();
    await expect(page.getByText('14:00')).toBeVisible();

    // Verificar toast de sucesso
    await expect(page.getByText('Agendamento criado')).toBeVisible();
  });

  test('💬 Envio de Mensagem Teste', async ({ page }) => {
    // Login
    await page.goto(SAEE_URL);
    await page.fill('[name="email"]', TEST_USER.email);
    await page.fill('[name="password"]', TEST_USER.password);
    await page.click('button:has-text("Entrar")');

    // Navegar para configurações WhatsApp
    await page.click('a:has-text("Configurações")');
    await page.click('button:has-text("WhatsApp")');

    // Verificar se WhatsApp está conectado
    const isConnected = await page.locator('[data-testid="whatsapp-connected"]').isVisible();

    if (!isConnected) {
      // Conectar WhatsApp primeiro
      await page.click('button:has-text("Conectar WhatsApp")');
      await page.waitForSelector('[data-testid="qr-code"]');

      // Simular conexão
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('whatsapp-connected'));
      });
    }

    // Navegar para CRM
    await page.click('a:has-text("CRM")');

    // Clicar em enviar mensagem teste
    await page.click('button:has-text("Mensagem Teste")');

    // Preencher número
    await page.fill('[name="numero_teste"]', TEST_PATIENT.telefone);

    // Selecionar template
    await page.selectOption('[name="template"]', 'confirmacao');

    // Enviar mensagem
    await page.click('button:has-text("Enviar")');

    // Verificar confirmação
    await expect(page.getByText('Mensagem enviada')).toBeVisible();

    // Verificar log de mensagens
    await page.click('button:has-text("Histórico")');
    await expect(page.getByText(TEST_PATIENT.telefone)).toBeVisible();
  });

  test('🔄 Reenvio de Mensagem com Falha', async ({ page }) => {
    // Login
    await page.goto(SAEE_URL);
    await page.fill('[name="email"]', TEST_USER.email);
    await page.fill('[name="password"]', TEST_USER.password);
    await page.click('button:has-text("Entrar")');

    // Navegar para CRM
    await page.click('a:has-text("CRM")');

    // Verificar se há mensagens com falha
    const failedMessages = page.locator('[data-testid="mensagem-falha"]');

    if (await failedMessages.count() > 0) {
      // Clicar na primeira mensagem com falha
      await failedMessages.first().click();

      // Clicar em reenviar
      await page.click('button:has-text("Reenviar")');

      // Confirmar reenvio
      await page.click('button:has-text("Confirmar")');

      // Verificar sucesso
      await expect(page.getByText('Mensagem reenviada')).toBeVisible();
    } else {
      // Se não há mensagens com falha, criar uma situação de teste
      console.log('Nenhuma mensagem com falha encontrada - pulando teste de reenvio');
    }
  });

  test('📊 Verificação de Analytics', async ({ page }) => {
    // Login
    await page.goto(SAEE_URL);
    await page.fill('[name="email"]', TEST_USER.email);
    await page.fill('[name="password"]', TEST_USER.password);
    await page.click('button:has-text("Entrar")');

    // Verificar se menu Analytics está disponível
    const analyticsMenu = page.locator('a:has-text("Analytics")');

    if (await analyticsMenu.isVisible()) {
      // Navegar para Analytics
      await analyticsMenu.click();

      // Verificar dashboard
      await expect(page.locator('h1')).toContainText('Analytics');

      // Verificar métricas
      await expect(page.locator('[data-testid="metricas-onboarding"]')).toBeVisible();
      await expect(page.locator('[data-testid="metricas-whatsapp"]')).toBeVisible();

      // Verificar tabela de eventos
      await expect(page.locator('[data-testid="eventos-tabela"]')).toBeVisible();

      // Testar filtros
      await page.fill('[data-testid="filtro-evento"]', 'onboarding');
      await page.keyboard.press('Enter');

      // Verificar resultados filtrados
      const events = page.locator('[data-testid="evento-item"]');
      await expect(events.first()).toContainText('onboarding');
    } else {
      console.log('Menu Analytics não disponível - feature desabilitada');
    }
  });

  test('🔐 Validação de Segurança', async ({ page }) => {
    // Tentar acessar página protegida sem login
    await page.goto(`${SAEE_URL}/agenda-lite`);

    // Deve redirecionar para login
    await page.waitForURL('**/login**');
    await expect(page.locator('h1')).toContainText(/login|entrar/i);

    // Tentar login com dados inválidos
    await page.fill('[name="email"]', 'email@invalido');
    await page.fill('[name="password"]', '123');
    await page.click('button:has-text("Entrar")');

    // Verificar mensagem de erro
    await expect(page.getByText(/inválido|erro/i)).toBeVisible();

    // Login válido
    await page.fill('[name="email"]', TEST_USER.email);
    await page.fill('[name="password"]', TEST_USER.password);
    await page.click('button:has-text("Entrar")');

    // Verificar acesso à página protegida
    await page.waitForURL('**/agenda-lite**');
    await expect(page.locator('h1')).toContainText(/agenda|dashboard/i);
  });

  test('📱 Responsividade Mobile', async ({ page }) => {
    // Simular dispositivo mobile
    await page.setViewportSize({ width: 375, height: 667 });

    // Login
    await page.goto(SAEE_URL);
    await page.fill('[name="email"]', TEST_USER.email);
    await page.fill('[name="password"]', TEST_USER.password);
    await page.click('button:has-text("Entrar")');

    // Verificar menu mobile
    const menuButton = page.locator('[data-testid="menu-mobile"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();

      // Verificar sidebar mobile
      await expect(page.locator('[data-testid="sidebar-mobile"]')).toBeVisible();

      // Fechar menu
      await page.click('[data-testid="close-menu"]');
    }

    // Verificar se elementos se adaptam ao mobile
    await expect(page.locator('[data-testid="agenda-mobile"]')).toBeVisible();

    // Testar navegação por toque
    await page.click('[data-testid="agenda-item"]:first-child');
    await expect(page.locator('[data-testid="detalhes-agendamento"]')).toBeVisible();
  });

});