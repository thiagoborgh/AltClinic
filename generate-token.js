const multiTenantDb = require('./src/models/MultiTenantDatabase');
const jwt = require('jsonwebtoken');

try {
    console.log('=== Gerando token válido ===');
    
    // Buscar usuário no tenant test-tenant-1
    const tenantDb = multiTenantDb.getTenantDb('test-tenant-1');
    const user = tenantDb.prepare("SELECT * FROM usuarios WHERE status = 'active' LIMIT 1").get();
    
    if (!user) {
        console.log('❌ Nenhum usuário ativo encontrado no tenant');
        return;
    }
    
    console.log('✅ Usuário encontrado:', {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role
    });
    
    // Gerar token com o secret correto
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
    console.log('🔑 Secret usado:', jwtSecret.substring(0, 20) + '...');
    
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 horas
        iss: 'saee-system'
    };
    
    const token = jwt.sign(payload, jwtSecret);
    
    console.log('✅ Token gerado com sucesso!');
    console.log('🎫 Token:', token);
    
    // Verificar se o token funciona
    const decoded = jwt.verify(token, jwtSecret);
    console.log('✅ Token verificado com sucesso!');
    console.log('📋 Payload decodificado:', decoded);
    
} catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
}