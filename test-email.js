const { EmailService } = require('./src/services/emailService');

console.log('Testando substituição de variáveis no template...');

const emailSvc = new EmailService();
const template = emailSvc.loadTemplate('first-access');
console.log('Template carregado com sucesso');

const data = {
  userName: 'João Silva',
  tenantName: 'Clínica Teste',
  email: 'joao@teste.com',
  tempPassword: 'senha123',
  loginUrl: 'http://localhost:3000/login/teste',
  trialExpireAt: '<p>Expira em 10/09/2025</p>'
};

const processed = emailSvc.replaceVariables(template, data);
console.log('Template processado com sucesso');

// Verificar se as variáveis foram substituídas
const hasUnreplacedVars = processed.includes('{userName}') || processed.includes('{tenantName}');
console.log('Variáveis não substituídas encontradas:', hasUnreplacedVars);

if (hasUnreplacedVars) {
  console.log('ERRO: Algumas variáveis não foram substituídas!');
  console.log('Conteúdo do template processado (primeiras 300 chars):');
  console.log(processed.substring(0, 300));
} else {
  console.log('✅ Todas as variáveis foram substituídas corretamente!');
}
