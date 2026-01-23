const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin se ainda não foi
if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.join(__dirname, '..', 'services', 'firebase-service-account.json');
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin inicializado para tenant middleware');
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase Admin:', error);
  }
}

const db = admin.firestore();

/**
 * Middleware para extrair e validar tenant do Firestore
 */
const extractTenantFirestore = async (req, res, next) => {
  try {
    console.log('🔥 FIRESTORE TENANT MIDDLEWARE: Iniciando extração de tenant');
    console.log('🔥 Headers:', req.headers);
    console.log('🔥 URL:', req.url);
    
    let tenantId = null;
    
    // Opção 1: JWT Token (prioridade máxima)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.substring(7);
        const decoded = jwt.decode(token);
        if (decoded && decoded.tenantId) {
          tenantId = decoded.tenantId;
          console.log('🔥 Tenant encontrado no JWT:', tenantId);
        }
      } catch (error) {
        console.log('🔥 Erro ao decodificar JWT:', error.message);
      }
    }
    
    // Opção 2: Header personalizado
    if (!tenantId && req.headers['x-tenant-id']) {
      tenantId = req.headers['x-tenant-id'];
      console.log('🔥 Tenant encontrado no header X-Tenant-Id:', tenantId);
    }
    
    // Opção 3: Query parameter
    if (!tenantId && req.query.tenantId) {
      tenantId = req.query.tenantId;
      console.log('🔥 Tenant encontrado na query:', tenantId);
    }
    
    if (!tenantId) {
      return res.status(400).json({
        error: 'Tenant não especificado',
        message: 'Inclua tenantId no token JWT, header X-Tenant-Id ou query parameter'
      });
    }
    
    // Buscar tenant no Firestore
    console.log('🔥 Buscando tenant no Firestore:', tenantId);
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    
    if (!tenantDoc.exists) {
      console.log('🔥 Tenant não encontrado:', tenantId);
      return res.status(404).json({
        error: 'Clínica não encontrada',
        message: `Tenant '${tenantId}' não existe`
      });
    }
    
    const tenantData = tenantDoc.data();
    
    // Verificar se tenant está ativo
    if (tenantData.status !== 'active' && tenantData.status !== 'trial') {
      return res.status(403).json({
        error: 'Tenant inativo',
        message: `Tenant '${tenantId}' está com status: ${tenantData.status}`
      });
    }
    
    // Verificar se trial expirou
    if (tenantData.status === 'trial' && tenantData.trialExpireAt) {
      const trialExpire = tenantData.trialExpireAt.toDate();
      if (new Date() > trialExpire) {
        return res.status(402).json({
          error: 'Trial expirado',
          message: 'O período de teste expirou. Faça upgrade do seu plano.'
        });
      }
    }
    
    // Adicionar tenant ao request
    req.tenant = {
      id: tenantDoc.id,
      nome: tenantData.nome,
      email: tenantData.email,
      plano: tenantData.plano || 'free',
      status: tenantData.status,
      config: tenantData.config || {},
      billing: tenantData.billing || {},
      theme: tenantData.theme || {}
    };
    req.tenantId = tenantDoc.id;
    
    console.log('🔥 Tenant carregado com sucesso:', req.tenant.nome);
    
    next();
    
  } catch (error) {
    console.error('❌ Erro no middleware Firestore tenant:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Falha ao processar tenant'
    });
  }
};

module.exports = { extractTenantFirestore };
