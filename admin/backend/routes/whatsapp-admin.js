// Admin routes para gerenciamento WhatsApp
const express = require('express');
const router = express.Router();
const AdminWhatsAppManager = require('../services/AdminWhatsAppManager');

const adminWhatsApp = new AdminWhatsAppManager();

// Middleware de autenticação admin (implementar conforme seu sistema)
const requireAdminAuth = (req, res, next) => {
    // TODO: Implementar verificação de admin
    req.admin = { id: 1, name: 'Admin' }; // Mock
    next();
};

// === ROTAS DE CONEXÕES WHATSAPP ===

// Listar todas as conexões WhatsApp
router.get('/connections', requireAdminAuth, async (req, res) => {
    try {
        const connections = await adminWhatsApp.listWhatsAppConnections();
        res.json({
            success: true,
            data: connections
        });
    } catch (error) {
        console.error('Erro ao listar conexões:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Criar nova conexão WhatsApp
router.post('/connections', requireAdminAuth, async (req, res) => {
    try {
        const { name, type, credentials, config } = req.body;
        
        if (!name || !type || !credentials) {
            return res.status(400).json({
                success: false,
                error: 'Nome, tipo e credenciais são obrigatórios'
            });
        }

        const connection = await adminWhatsApp.createWhatsAppConnection({
            name,
            type,
            credentials,
            config: config || {},
            created_by: req.admin.id
        });

        res.status(201).json({
            success: true,
            data: connection
        });
    } catch (error) {
        console.error('Erro ao criar conexão:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Obter detalhes de uma conexão específica
router.get('/connections/:id', requireAdminAuth, async (req, res) => {
    try {
        const connection = await adminWhatsApp.getWhatsAppConnection(req.params.id);
        
        if (!connection) {
            return res.status(404).json({
                success: false,
                error: 'Conexão não encontrada'
            });
        }

        // Remover credenciais sensíveis da resposta
        const safeConnection = {
            ...connection,
            credentials: Object.keys(connection.credentials).reduce((acc, key) => {
                acc[key] = key.includes('token') || key.includes('key') ? '***' : connection.credentials[key];
                return acc;
            }, {})
        };

        res.json({
            success: true,
            data: safeConnection
        });
    } catch (error) {
        console.error('Erro ao obter conexão:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// === ROTAS DE VINCULAÇÕES TENANT ===

// Listar vinculações tenant-WhatsApp
router.get('/tenants/bindings', requireAdminAuth, async (req, res) => {
    try {
        const bindings = await adminWhatsApp.listTenantBindings();
        res.json({
            success: true,
            data: bindings
        });
    } catch (error) {
        console.error('Erro ao listar vinculações:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Vincular tenant a uma conexão WhatsApp OU configurar API própria
router.post('/tenants/bind', requireAdminAuth, async (req, res) => {
    try {
        const {
            tenant_id,
            tenant_name,
            // Opção 1: Usar conexão admin
            whatsapp_connection_id,
            // Opção 2: Usar API própria
            use_own_api,
            own_api_type,
            own_api_credentials,
            own_api_config,
            // Configurações comuns
            phone_number,
            business_name,
            enabled_automations
        } = req.body;

        if (!tenant_id || !tenant_name) {
            return res.status(400).json({
                success: false,
                error: 'tenant_id e tenant_name são obrigatórios'
            });
        }

        // Validar configuração
        if (use_own_api) {
            if (!own_api_type || !own_api_credentials) {
                return res.status(400).json({
                    success: false,
                    error: 'Para usar API própria, own_api_type e own_api_credentials são obrigatórios'
                });
            }
        } else {
            if (!whatsapp_connection_id) {
                return res.status(400).json({
                    success: false,
                    error: 'whatsapp_connection_id é obrigatório quando não usar API própria'
                });
            }
        }

        const binding = await adminWhatsApp.bindTenantToWhatsApp({
            tenant_id,
            tenant_name,
            whatsapp_connection_id: use_own_api ? null : whatsapp_connection_id,
            phone_number: phone_number || null,
            business_name: business_name || tenant_name,
            enabled_automations: enabled_automations || {
                appointment_confirmations: true,
                appointment_reminders: true,
                payment_requests: false,
                satisfaction_surveys: false
            },
            assigned_by: req.admin.id,
            // Campos de API própria
            own_api_enabled: use_own_api || false,
            own_api_type: use_own_api ? own_api_type : null,
            own_api_credentials: use_own_api ? own_api_credentials : null,
            own_api_config: use_own_api ? (own_api_config || {}) : null
        });

        res.status(201).json({
            success: true,
            data: binding
        });
    } catch (error) {
        console.error('Erro ao vincular tenant:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro interno do servidor'
        });
    }
});

// Obter configuração WhatsApp de um tenant
router.get('/tenants/:tenant_id/whatsapp', requireAdminAuth, async (req, res) => {
    try {
        const config = await adminWhatsApp.getTenantWhatsAppConfig(req.params.tenant_id);
        
        if (!config) {
            return res.status(404).json({
                success: false,
                error: 'Tenant não possui configuração WhatsApp'
            });
        }

        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Erro ao obter configuração tenant:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// === ROTAS DE ESTATÍSTICAS E LOGS ===

// Estatísticas de uso de um tenant
router.get('/tenants/:tenant_id/usage-stats', requireAdminAuth, async (req, res) => {
    try {
        const period = req.query.period || '30 days';
        const stats = await adminWhatsApp.getTenantUsageStats(req.params.tenant_id, period);
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// === ROTAS DE TEMPLATES ===

// Listar templates de mensagem
router.get('/templates', requireAdminAuth, async (req, res) => {
    try {
        const { type, category } = req.query;
        const templates = await adminWhatsApp.getMessageTemplates(type, category);
        
        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        console.error('Erro ao listar templates:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// === ENDPOINTS PARA TENANTS ACESSAREM (sem auth admin) ===

// Endpoint público para tenants obterem sua configuração WhatsApp
router.get('/tenant-config/:tenant_id', async (req, res) => {
    try {
        // TODO: Implementar autenticação de tenant
        const config = await adminWhatsApp.getTenantWhatsAppConfig(req.params.tenant_id);
        
        if (!config) {
            return res.status(404).json({
                success: false,
                error: 'Configuração WhatsApp não encontrada para este tenant'
            });
        }

        // Retornar apenas dados necessários para o tenant
        const tenantConfig = {
            has_whatsapp: true,
            connection_type: config.connection.type,
            business_name: config.business_name,
            phone_number: config.phone_number,
            enabled_automations: config.automations,
            limits: config.limits
        };

        res.json({
            success: true,
            data: tenantConfig
        });
    } catch (error) {
        console.error('Erro ao obter config tenant:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Endpoint para tenants enviarem mensagens através do admin
router.post('/tenant-send/:tenant_id', async (req, res) => {
    try {
        // TODO: Implementar autenticação de tenant
        const { message_type, recipient_phone, message_data } = req.body;
        
        if (!message_type || !recipient_phone || !message_data) {
            return res.status(400).json({
                success: false,
                error: 'message_type, recipient_phone e message_data são obrigatórios'
            });
        }

        // Obter configuração do tenant
        const config = await adminWhatsApp.getTenantWhatsAppConfig(req.params.tenant_id);
        
        if (!config) {
            return res.status(404).json({
                success: false,
                error: 'Tenant não configurado para WhatsApp'
            });
        }

        // Verificar se automação está habilitada
        if (!config.automations[message_type]) {
            return res.status(403).json({
                success: false,
                error: `Automação '${message_type}' não está habilitada para este tenant`
            });
        }

        // Verificar limites
        if (config.limits.current_usage >= config.limits.monthly_limit) {
            return res.status(429).json({
                success: false,
                error: 'Limite mensal de mensagens excedido'
            });
        }

        // TODO: Implementar envio baseado no tipo de conexão
        // Por enquanto, simular sucesso
        const logData = {
            tenant_id: req.params.tenant_id,
            whatsapp_connection_id: config.connection.id,
            message_type,
            recipient_phone,
            message_content: JSON.stringify(message_data),
            external_message_id: `sim_${Date.now()}`,
            cost_cents: 5 // Simular custo
        };

        const result = await adminWhatsApp.logMessageSent(logData);

        res.json({
            success: true,
            data: {
                message_id: result.log_id,
                status: 'sent',
                remaining_limit: config.limits.monthly_limit - config.limits.current_usage - 1
            }
        });
    } catch (error) {
        console.error('Erro ao enviar mensagem via tenant:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

module.exports = router;