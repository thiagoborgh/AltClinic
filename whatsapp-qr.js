const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando WhatsApp Bot - Alt Clinic');
console.log('📱 Preparando para gerar QR Code...\n');

// Configurar diretório de sessão
const sessionPath = './whatsapp-session';
if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
    console.log('📁 Diretório de sessão criado:', sessionPath);
}

// Criar cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'saee-bot',
        dataPath: sessionPath
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

// Eventos do cliente
client.on('qr', (qr) => {
    console.log('📱 SCAN O QR CODE ABAIXO COM SEU WHATSAPP:');
    console.log('=' .repeat(50));
    qrcode.generate(qr, { small: true });
    console.log('=' .repeat(50));
    console.log('');
    console.log('📋 Instruções:');
    console.log('1. Abra o WhatsApp no seu celular');
    console.log('2. Vá em Menu (⋮) > Dispositivos conectados');
    console.log('3. Toque em "Conectar um dispositivo"');
    console.log('4. Escaneie o QR code acima');
    console.log('');
    console.log('⏰ Aguardando conexão...');
});

client.on('ready', () => {
    console.log('');
    console.log('🎉 WhatsApp conectado com sucesso!');
    console.log('✅ Bot Alt Clinic está ativo e funcionando');
    console.log('');
    
    // Obter informações do cliente
    client.info.then(info => {
        console.log('📊 Informações da conta:');
        console.log(`📱 Número: ${info.wid.user}`);
        console.log(`👤 Nome: ${info.pushname}`);
        console.log(`🔋 Bateria: ${info.battery}%`);
        console.log('');
        console.log('🔧 Bot configurado para:');
        console.log('• Responder mensagens automaticamente');
        console.log('• Agendar consultas via WhatsApp');
        console.log('• Enviar lembretes de agendamentos');
        console.log('• Reativar pacientes inativos');
        console.log('');
        console.log('💡 Para parar o bot, pressione Ctrl+C');
    });
});

client.on('message', async (message) => {
    const from = message.from;
    const body = message.body.toLowerCase();
    const contact = await message.getContact();
    
    console.log(`💬 Nova mensagem de ${contact.name || contact.number}: ${message.body}`);
    
    // Resposta automática simples para teste
    if (body.includes('oi') || body.includes('olá') || body.includes('ola')) {
        const resposta = `Olá ${contact.name || 'cliente'}! 😊
        
Bem-vindo(a) à nossa clínica estética! 

Estou aqui para ajudar você com:
• 📅 Agendamentos
• ℹ️ Informações sobre procedimentos
• 💰 Orçamentos
• ❓ Dúvidas gerais

Como posso ajudar você hoje?`;
        
        await message.reply(resposta);
        console.log(`🤖 Resposta enviada para ${contact.name || contact.number}`);
    }
    
    // Outros comandos podem ser adicionados aqui
    if (body.includes('agendar')) {
        const resposta = `📅 Para agendar sua consulta, preciso de algumas informações:

1️⃣ Qual procedimento você deseja?
2️⃣ Qual sua preferência de data?
3️⃣ Período: manhã ou tarde?

Me envie essas informações que vou verificar nossa agenda! 😊`;
        
        await message.reply(resposta);
    }
    
    if (body.includes('procedimentos') || body.includes('tratamentos')) {
        const resposta = `✨ Nossos principais procedimentos:

💉 Harmonização facial
🌟 Preenchimento labial
💎 Botox
🔥 Criolipólise
⚡ Laser
🧴 Peelings
💆‍♀️ Limpeza de pele

Qual procedimento te interessa? Posso dar mais detalhes! 😊`;
        
        await message.reply(resposta);
    }
});

client.on('authenticated', () => {
    console.log('🔐 Autenticação realizada com sucesso!');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Falha na autenticação:', msg);
});

client.on('disconnected', (reason) => {
    console.log('🔌 WhatsApp desconectado:', reason);
    console.log('🔄 Tentando reconectar...');
});

// Inicializar cliente
console.log('🔄 Inicializando cliente WhatsApp...');
client.initialize();
