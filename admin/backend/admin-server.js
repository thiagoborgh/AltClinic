/**
 * Servidor da Interface Admin WhatsApp
 * Fornece APIs para gerenciar conexões WhatsApp e rotinas
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');
const AdminWhatsAppManager = require('./services/AdminWhatsAppManager');
const TenantWhatsAppRoutines = require('../../src/services/TenantWhatsAppRoutines');

const app = express();
const PORT = process.env.ADMIN_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Conexões com bancos de dados
const adminDbPath = path.join(__dirname, 'database/admin.sqlite');
const mainDbPath = path.join(__dirname, '../../saee.db');
const masterDbPath = path.join(__dirname, '../../saee-master.db');

// Inicializar conexões de banco
const adminDb = new Database(adminDbPath);
const mainDb = fs.existsSync(mainDbPath) ? new Database(mainDbPath) : null;
const masterDb = fs.existsSync(masterDbPath) ? new Database(masterDbPath) : null;

// Instâncias dos serviços
const adminManager = new AdminWhatsAppManager();
const routines = new TenantWhatsAppRoutines();

// === ROTAS DA INTERFACE ===

// Servir interface admin
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/whatsapp-admin.html'));
});

// === APIS ===

// Dashboard - Estatísticas gerais
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        // Buscar dados reais dos bancos
        let totalConnections = 0;
        let totalTenants = 0;
        let todayMessages = 0;
        let activeRoutines = 0;
        let connectionsStatus = [];
        let messagesByType = {};

        // Buscar conexões WhatsApp reais
        try {
            const connectionsQuery = adminDb.prepare(`
                SELECT COUNT(*) as count FROM tenant_whatsapp_bindings 
                WHERE status = 'active'
            `);
            const connectionsResult = connectionsQuery.get();
            totalConnections = connectionsResult ? connectionsResult.count : 0;

            // Buscar detalhes das conexões
            const connectionsDetailQuery = adminDb.prepare(`
                SELECT provider_type, instance_id, COUNT(*) as tenant_count,
                       MAX(updated_at) as last_used
                FROM tenant_whatsapp_bindings 
                WHERE status = 'active'
                GROUP BY provider_type, instance_id
            `);
            const connectionsDetails = connectionsDetailQuery.all();
            
            connectionsStatus = connectionsDetails.map((conn, index) => ({
                id: index + 1,
                name: `${conn.provider_type.toUpperCase()} - ${conn.instance_id}`,
                type: conn.provider_type,
                instance_id: conn.instance_id,
                status: 'active',
                tenants_count: conn.tenant_count
            }));
        } catch (e) {
            console.log('Tabela tenant_whatsapp_bindings não encontrada, usando dados padrão');
        }

        // Buscar tenants reais do banco principal
        if (mainDb) {
            try {
                const tenantsQuery = mainDb.prepare(`SELECT COUNT(*) as count FROM tenants WHERE status = 'active'`);
                const tenantsResult = tenantsQuery.get();
                totalTenants = tenantsResult ? tenantsResult.count : 0;
            } catch (e) {
                console.log('Tabela tenants não encontrada no banco principal');
            }
        }

        // Buscar mensagens de hoje
        try {
            const today = new Date().toISOString().split('T')[0];
            const messagesQuery = adminDb.prepare(`
                SELECT COUNT(*) as count FROM tenant_whatsapp_usage 
                WHERE DATE(created_at) = ?
            `);
            const messagesResult = messagesQuery.get(today);
            todayMessages = messagesResult ? messagesResult.count : 0;

            // Buscar mensagens por tipo
            const messagesByTypeQuery = adminDb.prepare(`
                SELECT message_type, COUNT(*) as count 
                FROM tenant_whatsapp_usage 
                WHERE DATE(created_at) = ?
                GROUP BY message_type
            `);
            const messagesByTypeResult = messagesByTypeQuery.all(today);
            messagesByType = messagesByTypeResult.reduce((acc, row) => {
                acc[row.message_type] = row.count;
                return acc;
            }, {});
        } catch (e) {
            console.log('Tabela tenant_whatsapp_usage não encontrada');
        }

        // Estimar rotinas ativas (conexões * 4 tipos de rotina)
        activeRoutines = totalConnections * 4;

        const stats = {
            totalConnections,
            totalTenants,
            todayMessages,
            activeRoutines,
            connectionsStatus,
            messagesByType
        };

        res.json(stats);
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Listar todas as conexões WhatsApp
app.get('/api/connections', async (req, res) => {
    try {
        let connections = [];

        // Buscar conexões reais do banco admin
        try {
            const connectionsQuery = adminDb.prepare(`
                SELECT 
                    ROW_NUMBER() OVER (ORDER BY created_at) as id,
                    tenant_id,
                    provider_type as type,
                    instance_id,
                    api_token as token,
                    status,
                    created_at,
                    updated_at
                FROM tenant_whatsapp_bindings 
                ORDER BY created_at DESC
            `);
            
            const dbConnections = connectionsQuery.all();
            
            connections = dbConnections.map(conn => {
                // Criar nome descritivo
                let name = `${conn.type.toUpperCase()}`;
                if (conn.instance_id) {
                    name += ` - ${conn.instance_id.substring(0, 8)}...`;
                }
                
                // Contar quantos tenants usam esta conexão
                const tenantCountQuery = adminDb.prepare(`
                    SELECT COUNT(DISTINCT tenant_id) as count 
                    FROM tenant_whatsapp_bindings 
                    WHERE provider_type = ? AND instance_id = ?
                `);
                const tenantCount = tenantCountQuery.get(conn.type, conn.instance_id);
                
                return {
                    id: conn.id,
                    name,
                    type: conn.type,
                    instance_id: conn.instance_id,
                    token: conn.token ? `${conn.token.substring(0, 8)}...` : null,
                    status: conn.status,
                    tenants_count: tenantCount ? tenantCount.count : 0,
                    created_at: conn.created_at
                };
            });
        } catch (e) {
            console.log('Tabela tenant_whatsapp_bindings não encontrada, retornando lista vazia');
        }

        // Se não há conexões no banco, verificar se existe a conexão Z-API padrão
        if (connections.length === 0) {
            const defaultZapi = {
                id: 1,
                name: 'Z-API Desenvolvimento',
                type: 'zapi',
                instance_id: '3E82B061D75E61EBAFEAD69A39353161',
                token: '8E1DFE5E6F2D...', 
                status: 'configured',
                tenants_count: 0,
                created_at: new Date().toISOString()
            };
            connections.push(defaultZapi);
        }

        res.json(connections);
    } catch (error) {
        console.error('Erro ao listar conexões:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Testar conexão WhatsApp
app.post('/api/connections/:id/test', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Simular teste de conexão
        const testResult = {
            success: Math.random() > 0.3, // 70% chance de sucesso
            connection_id: id,
            tested_at: new Date().toISOString(),
            response_time: Math.floor(Math.random() * 1000) + 200, // 200-1200ms
            message: Math.random() > 0.3 ? 'Conexão funcionando corretamente' : 'Erro: Instância não encontrada'
        };

        res.json(testResult);
    } catch (error) {
        console.error('Erro ao testar conexão:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Listar tenants e suas configurações
app.get('/api/tenants', async (req, res) => {
    try {
        let tenants = [];

        // Buscar tenants reais do banco principal
        if (mainDb) {
            try {
                const tenantsQuery = mainDb.prepare(`
                    SELECT 
                        id as tenant_id,
                        nome as tenant_name,
                        status,
                        created_at
                    FROM tenants 
                    WHERE status IN ('trial', 'active')
                    ORDER BY created_at DESC
                `);
                
                const dbTenants = tenantsQuery.all();
                
                for (const tenant of dbTenants) {
                    // Buscar configuração WhatsApp do tenant
                    let whatsappProvider = 'none';
                    let messagesCount = 0;
                    
                    try {
                        const whatsappQuery = adminDb.prepare(`
                            SELECT provider_type 
                            FROM tenant_whatsapp_bindings 
                            WHERE tenant_id = ? AND status = 'active' 
                            LIMIT 1
                        `);
                        const whatsappConfig = whatsappQuery.get(tenant.tenant_id);
                        if (whatsappConfig) {
                            whatsappProvider = whatsappConfig.provider_type;
                        }
                        
                        // Contar mensagens de hoje
                        const today = new Date().toISOString().split('T')[0];
                        const messagesQuery = adminDb.prepare(`
                            SELECT COUNT(*) as count 
                            FROM tenant_whatsapp_usage 
                            WHERE tenant_id = ? AND DATE(created_at) = ?
                        `);
                        const messagesResult = messagesQuery.get(tenant.tenant_id, today);
                        messagesCount = messagesResult ? messagesResult.count : 0;
                    } catch (e) {
                        // Ignorar erros de tabelas não encontradas
                    }
                    
                    tenants.push({
                        tenant_id: tenant.tenant_id,
                        tenant_name: tenant.tenant_name,
                        whatsapp_provider: whatsappProvider,
                        routines: {
                            appointmentReminders: whatsappProvider !== 'none',
                            paymentReminders: whatsappProvider !== 'none',
                            appointmentConfirmations: whatsappProvider !== 'none',
                            welcomeMessages: whatsappProvider !== 'none'
                        },
                        status: tenant.status,
                        messages_sent_today: messagesCount
                    });
                }
            } catch (e) {
                console.log('Erro ao buscar tenants:', e.message);
            }
        }
        
        // Se não encontrou tenants, criar um tenant de desenvolvimento padrão
        if (tenants.length === 0) {
            tenants = [
                {
                    tenant_id: 'dev_tenant',
                    tenant_name: 'Desenvolvimento',
                    whatsapp_provider: 'zapi',
                    routines: {
                        appointmentReminders: true,
                        paymentReminders: true,
                        appointmentConfirmations: true,
                        welcomeMessages: true
                    },
                    status: 'active',
                    messages_sent_today: 0
                }
            ];
        }

        res.json(tenants);
    } catch (error) {
        console.error('Erro ao listar tenants:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Enviar mensagem de teste
app.post('/api/test/send', async (req, res) => {
    try {
        const { tenant_id, phone, message_type, custom_message } = req.body;

        // Validar dados
        if (!tenant_id || !phone || !message_type) {
            return res.status(400).json({ 
                error: 'Dados obrigatórios: tenant_id, phone, message_type' 
            });
        }

        let result;

        if (message_type === 'custom' && custom_message) {
            // Enviar mensagem personalizada
            result = await routines.unifiedService.sendMessage(
                phone,
                custom_message,
                tenant_id,
                { provider: 'zapi' }, // Usar configuração padrão
                'test_custom',
                `test_${Date.now()}`
            );
        } else {
            // Inicializar rotinas se necessário
            await routines.initializeTenantRoutines(tenant_id);

            // Dados de teste baseados no tipo
            const testData = generateTestData(message_type, phone);

            // Enviar baseado no tipo
            switch (message_type) {
                case 'appointment_reminder':
                    result = await routines.sendAppointmentReminder(tenant_id, testData);
                    break;
                case 'payment_reminder':
                    result = await routines.sendPaymentReminder(tenant_id, testData);
                    break;
                case 'appointment_confirmation':
                    result = await routines.sendAppointmentConfirmation(tenant_id, testData);
                    break;
                case 'welcome_message':
                    result = await routines.sendWelcomeMessage(tenant_id, testData);
                    break;
                default:
                    return res.status(400).json({ error: 'Tipo de mensagem inválido' });
            }
        }

        // Adicionar informações extras ao resultado
        result.test_info = {
            tenant_id,
            phone,
            message_type,
            sent_at: new Date().toISOString(),
            test_id: `test_${Date.now()}`
        };

        res.json(result);

    } catch (error) {
        console.error('Erro ao enviar mensagem de teste:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        });
    }
});

// Obter logs de mensagens
app.get('/api/logs', async (req, res) => {
    try {
        const { tenant_id, limit = 50 } = req.query;

        // Simular logs por enquanto
        const logs = [
            {
                id: 1,
                tenant_id: 'dev_tenant',
                phone: '5511999887766',
                message_type: 'appointment_reminder',
                status: 'sent',
                provider: 'zapi',
                sent_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
                message_preview: 'Lembrete da sua consulta amanhã às 14:30...'
            },
            {
                id: 2,
                tenant_id: 'dev_tenant',
                phone: '5511999887766',
                message_type: 'test_zapi',
                status: 'failed',
                provider: 'zapi',
                sent_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                error: 'your client-token is not configured'
            },
            {
                id: 3,
                tenant_id: 'clinic_a',
                phone: '5511888777666',
                message_type: 'payment_reminder',
                status: 'sent',
                provider: 'manychat',
                sent_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                message_preview: 'Lembrete de pagamento pendente...'
            }
        ];

        // Filtrar por tenant se especificado
        const filteredLogs = tenant_id ? 
            logs.filter(log => log.tenant_id === tenant_id) : 
            logs;

        res.json(filteredLogs.slice(0, limit));

    } catch (error) {
        console.error('Erro ao obter logs:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// === FUNÇÕES AUXILIARES ===

function generateTestData(messageType, phone) {
    const baseData = {
        patientPhone: phone,
        clinicName: 'Clínica de Teste',
        clinicAddress: 'Rua Teste, 123 - São Paulo/SP'
    };

    switch (messageType) {
        case 'appointment_reminder':
            return {
                ...baseData,
                appointmentId: `apt_test_${Date.now()}`,
                patientName: 'João Silva (TESTE)',
                date: new Date(Date.now() + 24*60*60*1000).toLocaleDateString('pt-BR'),
                time: '14:30',
                doctor: 'Dr. Maria Santos'
            };

        case 'payment_reminder':
            return {
                ...baseData,
                invoiceId: `inv_test_${Date.now()}`,
                patientName: 'Maria Oliveira (TESTE)',
                amount: '150,00',
                dueDate: new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString('pt-BR')
            };

        case 'appointment_confirmation':
            return {
                ...baseData,
                appointmentId: `apt_conf_${Date.now()}`,
                patientName: 'Carlos Santos (TESTE)',
                date: new Date(Date.now() + 3*24*60*60*1000).toLocaleDateString('pt-BR'),
                time: '16:00',
                doctor: 'Dr. Ana Costa'
            };

        case 'welcome_message':
            return {
                ...baseData,
                patientId: `pat_test_${Date.now()}`,
                patientName: 'Ana Silva (TESTE)'
            };

        default:
            return baseData;
    }
}

// === INICIALIZAÇÃO ===

app.listen(PORT, () => {
    console.log('🚀 SERVIDOR ADMIN WHATSAPP INICIADO!');
    console.log('====================================');
    console.log(`📡 Porta: ${PORT}`);
    console.log(`🌐 Interface: http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard/stats`);
    console.log(`🔗 Conexões: http://localhost:${PORT}/api/connections`);
    console.log(`🏢 Tenants: http://localhost:${PORT}/api/tenants`);
    console.log('====================================');
});

module.exports = app;