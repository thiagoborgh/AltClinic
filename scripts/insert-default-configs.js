const dbManager = require('../src/models/database');

try {
  const db = dbManager.getDb();
  
  console.log('📝 Inserindo configurações padrão...');
  
  // Verificar se existe clinica_id = 1
  const clinica = db.prepare('SELECT id FROM clinica LIMIT 1').get();
  const clinicaId = clinica ? clinica.id : 1;
  
  console.log(`🏥 Usando clínica ID: ${clinicaId}`);
  
  const configuracoesPadrao = [
    { secao: 'whatsapp', chave: 'api_token', valor: '', descricao: 'Token da API do WhatsApp Business', tipo_valor: 'string' },
    { secao: 'whatsapp', chave: 'webhook_url', valor: '', descricao: 'URL do webhook para receber mensagens', tipo_valor: 'string' },
    { secao: 'pix', chave: 'chave_pix', valor: '', descricao: 'Chave PIX da clínica', tipo_valor: 'string' },
    { secao: 'pix', chave: 'nome_titular', valor: '', descricao: 'Nome do titular da conta PIX', tipo_valor: 'string' },
    { secao: 'pix', chave: 'banco', valor: '', descricao: 'Banco da conta PIX', tipo_valor: 'string' },
    { secao: 'ai', chave: 'gemini_api_key', valor: '', descricao: 'Chave da API do Google Gemini', tipo_valor: 'string' },
    { secao: 'ai', chave: 'huggingface_api_key', valor: '', descricao: 'Chave da API do Hugging Face', tipo_valor: 'string' },
    { secao: 'email', chave: 'mailchimp_api_key', valor: '', descricao: 'Chave da API do Mailchimp', tipo_valor: 'string' },
    { secao: 'email', chave: 'smtp_host', valor: '', descricao: 'Servidor SMTP', tipo_valor: 'string' },
    { secao: 'email', chave: 'smtp_port', valor: '587', descricao: 'Porta do servidor SMTP', tipo_valor: 'number' },
    { secao: 'crm', chave: 'periodo_inatividade', valor: '90', descricao: 'Dias para considerar paciente inativo', tipo_valor: 'number' },
    { secao: 'lgpd', chave: 'texto_consentimento', valor: 'Autorizo o uso dos meus dados para fins de atendimento médico e comunicação.', descricao: 'Texto padrão para consentimento LGPD', tipo_valor: 'string' }
  ];
  
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO configuracoes 
    (clinica_id, secao, chave, valor, descricao, tipo_valor) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  db.transaction(() => {
    configuracoesPadrao.forEach((config, index) => {
      stmt.run(clinicaId, config.secao, config.chave, config.valor, config.descricao, config.tipo_valor);
      console.log(`✅ Configuração ${index + 1}/${configuracoesPadrao.length}: ${config.secao}.${config.chave}`);
    });
  })();
  
  console.log('\n✅ Configurações padrão inseridas com sucesso!');
  
  // Verificar configurações inseridas
  const configs = db.prepare('SELECT * FROM configuracoes WHERE clinica_id = ?').all(clinicaId);
  console.log(`\n📊 Total de configurações: ${configs.length}`);
  
  // Agrupar por seção
  const porSecao = configs.reduce((acc, config) => {
    acc[config.secao] = (acc[config.secao] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n📋 Configurações por seção:');
  Object.entries(porSecao).forEach(([secao, count]) => {
    console.log(`  - ${secao}: ${count} configurações`);
  });
  
} catch (error) {
  console.error('❌ Erro:', error.message);
}
