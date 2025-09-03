// Teste do Sistema de Sessões Inteligente
const axios = require('axios');

async function testarLogin() {
    try {
        console.log('🧪 TESTANDO SISTEMA DE SESSÕES INTELIGENTE');
        console.log('==========================================');
        
        // Dados do teste
        const baseURL = 'http://localhost:3000';
        const tenant = 'clinica-teste';
        const usuario = {
            email: 'joao@teste.com',
            senha: '123456'
        };

        console.log(`\n1️⃣ Testando login no tenant: ${tenant}`);
        console.log(`📧 Email: ${usuario.email}`);
        console.log(`🔑 Senha: ${usuario.senha}`);

        // Configurar axios com headers de tenant
        const api = axios.create({
            baseURL: `${baseURL}/api/t/${tenant}`,
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-Slug': tenant,
                'Host': `${tenant}.localhost:3000`  // Simular subdomínio
            }
        });

        // Teste 1: Primeiro login (mesmo IP)
        console.log('\n🔐 Fazendo primeiro login...');
        const login1 = await api.post('/auth/login', usuario);
        
        console.log('✅ Login 1 - Sucesso!');
        console.log('📊 Resposta:', {
            success: login1.data.success,
            sessionId: login1.data.sessionId ? '✅ Presente' : '❌ Ausente',
            sessionInfo: login1.data.sessionInfo || 'Não informado',
            token: login1.data.token ? '✅ Token gerado' : '❌ Sem token'
        });

        if (login1.data.sessionId) {
            console.log('🎉 SISTEMA DE SESSÕES FUNCIONANDO!');
            console.log(`🆔 Session ID: ${login1.data.sessionId}`);
            console.log(`📍 Ação: ${login1.data.sessionInfo?.action || 'N/A'}`);
            console.log(`💬 Mensagem: ${login1.data.sessionInfo?.message || 'N/A'}`);

            // Teste 2: Verificar sessões ativas
            console.log('\n📊 Verificando sessões ativas...');
            const sessoes = await api.get('/auth/sessions', {
                headers: { 'Authorization': `Bearer ${login1.data.token}` }
            });
            
            console.log('✅ Sessões encontradas:', sessoes.data.sessions?.length || 0);
            if (sessoes.data.sessions?.length > 0) {
                console.table(sessoes.data.sessions.map(s => ({
                    IP: s.ip,
                    'Último Acesso': s.lastActivity,
                    Dispositivo: s.userAgent,
                    Status: s.isActive ? 'Ativo' : 'Inativo'
                })));
            }

            // Teste 3: Segundo login do mesmo IP (deve permitir automaticamente)
            console.log('\n🔄 Testando segundo login do mesmo IP...');
            const login2 = await api.post('/auth/login', usuario);
            
            console.log('✅ Login 2 - Resultado:', {
                success: login2.data.success,
                sessionInfo: login2.data.sessionInfo,
                sessionId: login2.data.sessionId ? '✅ Novo session' : '❌ Sem session'
            });

        } else {
            console.log('⚠️  SessionId não encontrado na resposta');
            console.log('📋 Resposta completa:', JSON.stringify(login1.data, null, 2));
        }

    } catch (error) {
        console.error('❌ Erro no teste:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
    }
}

// Executar teste
testarLogin();
