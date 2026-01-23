const express = require('express');
const router = express.Router();
const firestoreService = require('../services/firestoreService');
const { authenticateToken } = require('./auth');

/**
 * @route GET /api/tenants-admin
 * @desc Listar todos os tenants (apenas para super admin)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Verificar se usuário é super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas super admins podem acessar esta rota.'
      });
    }

    const { status } = req.query;
    const filters = {};
    if (status) filters.status = status;

    const tenants = await firestoreService.getAllTenants(filters);

    res.json({
      success: true,
      data: tenants,
      total: tenants.length
    });

  } catch (error) {
    console.error('❌ Erro ao listar tenants:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar tenants',
      error: error.message
    });
  }
});

/**
 * @route GET /api/tenants-admin/:id
 * @desc Buscar tenant por ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar permissão: super admin ou admin do próprio tenant
    if (req.user.role !== 'super_admin' && req.user.tenantId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    const tenant = await firestoreService.getTenantById(id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant não encontrado'
      });
    }

    res.json({
      success: true,
      data: tenant
    });

  } catch (error) {
    console.error('❌ Erro ao buscar tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar tenant',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/tenants-admin/:id
 * @desc Atualizar tenant
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verificar permissão
    if (req.user.role !== 'super_admin' && req.user.tenantId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    // Verificar se tenant existe
    const tenant = await firestoreService.getTenantById(id);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant não encontrado'
      });
    }

    // Não permitir alterar slug por admins comuns
    if (req.user.role !== 'super_admin' && updates.slug) {
      delete updates.slug;
    }

    await firestoreService.updateTenant(id, updates);

    res.json({
      success: true,
      message: 'Tenant atualizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar tenant',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/tenants-admin/:id
 * @desc Deletar tenant (apenas super admin)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Apenas super admin pode deletar
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas super admins podem deletar tenants.'
      });
    }

    // Verificar se tenant existe
    const tenant = await firestoreService.getTenantById(id);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant não encontrado'
      });
    }

    await firestoreService.deleteTenant(id);

    res.json({
      success: true,
      message: 'Tenant deletado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao deletar tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar tenant',
      error: error.message
    });
  }
});

/**
 * @route PATCH /api/tenants-admin/:id/status
 * @desc Alterar status do tenant
 */
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Apenas super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    if (!['active', 'trial', 'suspended', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido. Use: active, trial, suspended ou cancelled'
      });
    }

    const tenant = await firestoreService.getTenantById(id);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant não encontrado'
      });
    }

    await firestoreService.updateTenant(id, { status });

    res.json({
      success: true,
      message: 'Status atualizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status',
      error: error.message
    });
  }
});

/**
 * @route GET /api/tenants-admin/:id/users
 * @desc Listar usuários do tenant
 */
router.get('/:id/users', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar permissão
    if (req.user.role !== 'super_admin' && req.user.tenantId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    const { status, role } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (role) filters.role = role;

    const users = await firestoreService.getUsers(id, filters);

    res.json({
      success: true,
      data: users,
      total: users.length
    });

  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar usuários',
      error: error.message
    });
  }
});

/**
 * @route GET /api/tenants-admin/slug/:slug
 * @desc Buscar tenant por slug
 */
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const tenant = await firestoreService.getTenantBySlug(slug);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant não encontrado'
      });
    }

    // Retornar apenas informações públicas
    res.json({
      success: true,
      data: {
        id: tenant.id,
        nome: tenant.nome,
        slug: tenant.slug,
        status: tenant.status,
        theme: tenant.theme || {}
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar tenant',
      error: error.message
    });
  }
});

module.exports = router;
