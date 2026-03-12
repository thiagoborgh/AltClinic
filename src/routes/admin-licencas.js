const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getMasterDb } = require('../database/MultiTenantPostgres');
const { sendTempPassword } = require('../services/emailService');

/**
 * POST /api/admin/licencas
 * Criar nova licença completa
 */
router.post('/', async (req, res) => {
    try {
        const {
            nomeClinica,
            cnpjCpf,
            tipoLicenca,
            responsavel,
            whatsapp,
            apis,
            plano,
            pix,
            templates,
            sendTempPassword: shouldSendPassword = true
        } = req.body;

        // Validações
        if (!nomeClinica || !cnpjCpf || !responsavel?.nome || !responsavel?.email) {
            return res.status(400).json({
                success: false,
                message: 'Campos obrigatórios não preenchidos'
            });
        }

        const masterDb = getMasterDb();

        // Verificar se CNPJ/CPF já existe
        const existingLicenca = await masterDb.get(
            'SELECT id FROM tenants WHERE cnpj_cpf = $1',
            [cnpjCpf]
        );

        if (existingLicenca) {
            return res.status(409).json({
                success: false,
                message: 'CNPJ/CPF já cadastrado'
            });
        }

        // Gerar chave de licença única
        const chaveLicenca = `LIC-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        // Gerar slug único
        const baseSlug = nomeClinica
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 30);

        let slug = baseSlug;
        let counter = 1;
        while (await masterDb.get('SELECT id FROM tenants WHERE slug = $1', [slug])) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        // Data de expiração para trial
        let trialExpireAt = null;
        if (tipoLicenca === 'freemium') {
            trialExpireAt = new Date();
            trialExpireAt.setDate(trialExpireAt.getDate() + 15);
        }

        // Configurações padrão
        const defaultConfig = {
            whatsapp_enabled: whatsapp?.status || false,
            whatsapp_token: whatsapp?.token || null,
            email_enabled: true,
            sms_enabled: false,
            timezone: 'America/Sao_Paulo',
            currency: 'BRL',
            language: 'pt-BR',
            gemini_api_key: apis?.gemini || null,
            mailchimp_api_key: apis?.mailchimp || null,
            huggingface_api_key: apis?.huggingface || null,
            templates: templates || {}
        };

        const defaultBilling = {
            plan: tipoLicenca,
            status: tipoLicenca === 'freemium' ? 'trial' : 'active',
            valor_mensal: plano?.valor || 0,
            recorrencia: plano?.recorrencia || 'mensal',
            pix_chave: pix?.chave || null,
            pix_titular: pix?.titular || null,
            pix_banco: pix?.banco || null,
            trial_started_at: tipoLicenca === 'freemium' ? new Date().toISOString() : null,
            trial_expire_at: trialExpireAt ? trialExpireAt.toISOString() : null
        };

        // Criar tenant no database master
        const tenantId = crypto.randomUUID();
        const databaseName = `tenant_${slug}_${Date.now()}`;

        // Inserir tenant
        await masterDb.run(
            `INSERT INTO tenants (
        id, slug, nome, email, telefone, plano, status,
        trial_expire_at, database_name, config, billing, theme,
        cnpj_cpf, chave_licenca, responsavel_nome, responsavel_email,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
            [
                tenantId,
                slug,
                nomeClinica,
                responsavel.email,
                responsavel.telefone || '',
                tipoLicenca,
                tipoLicenca === 'freemium' ? 'trial' : 'active',
                trialExpireAt ? trialExpireAt.toISOString() : null,
                databaseName,
                JSON.stringify(defaultConfig),
                JSON.stringify(defaultBilling),
                JSON.stringify({}),
                cnpjCpf,
                chaveLicenca,
                responsavel.nome,
                responsavel.email,
                new Date().toISOString(),
                new Date().toISOString()
            ]
        );

        // Criar usuário admin para o tenant
        const bcrypt = require('bcryptjs');

        // Gerar senha
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        await req.db.run(
            `INSERT INTO usuarios (
        tenant_id, nome, email, senha_hash, role, status,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                tenantId,
                responsavel.nome,
                responsavel.email,
                hashedPassword,
                'owner',
                'active',
                new Date().toISOString(),
                new Date().toISOString()
            ]
        );

        // Enviar email com senha se solicitado
        let emailSent = false;
        if (shouldSendPassword) {
            try {
                const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?tenant=${slug}`;

                await sendTempPassword({
                    to: responsavel.email,
                    nome: responsavel.nome,
                    clinica: nomeClinica,
                    tempPassword: tempPassword,
                    loginUrl: loginUrl,
                    tenantSlug: slug,
                    createdByAdmin: true
                });

                emailSent = true;
                console.log(`✅ Email enviado para ${responsavel.email} - Licença: ${chaveLicenca}`);
            } catch (emailError) {
                console.error('❌ Erro ao enviar email:', emailError);
            }
        }

        // Log de auditoria
        console.log(`🎯 Licença criada: ${nomeClinica} (${chaveLicenca}) - Tipo: ${tipoLicenca}`);

        res.status(201).json({
            success: true,
            message: `Licença criada com sucesso!${emailSent ? ' Email enviado.' : ''}`,
            licenca: {
                id: tenantId,
                chave: chaveLicenca,
                slug: slug,
                nome: nomeClinica,
                tipo: tipoLicenca,
                status: tipoLicenca === 'freemium' ? 'trial' : 'active',
                responsavel: {
                    nome: responsavel.nome,
                    email: responsavel.email
                },
                trial_expire_at: trialExpireAt ? trialExpireAt.toISOString() : null
            },
            credentials: shouldSendPassword ? {
                email: responsavel.email,
                temp_password: tempPassword,
                login_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?tenant=${slug}`
            } : null,
            email_sent: emailSent
        });

    } catch (error) {
        console.error('Erro ao criar licença:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/admin/whatsapp/generate-qr
 * Gerar QR Code para WhatsApp
 */
router.post('/whatsapp/generate-qr', async (req, res) => {
    try {
        // Simulação de geração de QR Code
        // Em produção, isso se conectaria com a API do WhatsApp Business
        const qrCode = `whatsapp-qr-${Date.now()}`;
        const token = `token-${crypto.randomBytes(16).toString('hex')}`;

        res.json({
            success: true,
            qrCode: qrCode,
            token: token,
            message: 'QR Code gerado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao gerar QR Code'
        });
    }
});

/**
 * POST /api/admin/test-api/:service
 * Testar conexão com APIs externas
 */
router.post('/test-api/:service', async (req, res) => {
    try {
        const { service } = req.params;
        const { key } = req.body;

        if (!key) {
            return res.status(400).json({
                success: false,
                message: 'Chave da API é obrigatória'
            });
        }

        // Simulação de teste de API
        // Em produção, isso faria chamadas reais para as APIs
        let isValid = false;

        switch (service) {
            case 'gemini':
                // Simular teste da API Gemini
                isValid = key.startsWith('AIza') && key.length > 20;
                break;
            case 'mailchimp':
                // Simular teste da API Mailchimp
                isValid = key.includes('-us') && key.length > 30;
                break;
            case 'huggingface':
                // Simular teste da API Hugging Face
                isValid = key.startsWith('hf_') && key.length > 20;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Serviço não suportado'
                });
        }

        res.json({
            success: isValid,
            message: isValid ? 'Conexão bem-sucedida' : 'Chave inválida ou serviço indisponível'
        });

    } catch (error) {
        console.error('Erro ao testar API:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao testar conexão'
        });
    }
});

/**
 * GET /api/admin/licencas
 * Listar todas as licenças
 */
router.get('/', async (req, res) => {
    try {
        const masterDb = getMasterDb();

        const licencas = await masterDb.all(`
      SELECT
        id, slug, nome, email, telefone, plano, status,
        trial_expire_at, chave_licenca, cnpj_cpf,
        responsavel_nome, responsavel_email,
        created_at, updated_at
      FROM tenants
      ORDER BY created_at DESC
    `);

        // Formatar resposta
        const formattedLicencas = licencas.map(licenca => ({
            id: licenca.id,
            chave: licenca.chave_licenca,
            slug: licenca.slug,
            nome: licenca.nome,
            cnpjCpf: licenca.cnpj_cpf,
            tipo: licenca.plano,
            status: licenca.status,
            responsavel: {
                nome: licenca.responsavel_nome,
                email: licenca.responsavel_email
            },
            trial_expire_at: licenca.trial_expire_at,
            created_at: licenca.created_at
        }));

        res.json({
            success: true,
            licencas: formattedLicencas
        });

    } catch (error) {
        console.error('Erro ao listar licenças:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar licenças'
        });
    }
});

module.exports = router;
