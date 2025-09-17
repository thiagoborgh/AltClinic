const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

console.log('🔄 Admin-auth router inicializando...');

// Middleware de log para todas as requisições de admin-auth
router.use((req, res, next) => {
    console.log(`🔍 Admin-auth: ${req.method} ${req.path} - IP: ${req.ip}`);
    console.log('🔍 Headers:', req.headers);
    next();
});

// Login endpoint
router.post('/login', (req, res) => {
    console.log('🔐 Tentativa de login admin:', req.body);
    
    try {
        const { email, password } = req.body;
        
        // Validação simples
        if (!email || !password) {
            console.log('❌ Email ou senha em branco');
            return res.status(400).json({
                success: false,
                message: 'Email e senha são obrigatórios'
            });
        }
        
        // Verificação de credenciais (hardcoded para teste)
        if (email === 'admin@altclinic.com' && password === 'admin123') {
            const token = jwt.sign(
                { 
                    id: 1, 
                    email: email,
                    role: 'admin',
                    type: 'admin'
                }, 
                process.env.JWT_SECRET || 'admin-secret-key-2024',
                { expiresIn: '24h' }
            );
            
            console.log('✅ Login admin realizado com sucesso');
            res.json({
                success: true,
                message: 'Login realizado com sucesso',
                data: {
                    token: token,
                    user: {
                        id: 1,
                        email: email,
                        role: 'admin'
                    }
                }
            });
        } else {
            console.log('❌ Credenciais inválidas:', { email, password });
            res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }
    } catch (error) {
        console.error('❌ Erro no login admin:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Verificação de token
router.get('/me', (req, res) => {
    console.log('🔍 Verificação de token admin');
    
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token não fornecido'
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'admin-secret-key-2024');
        
        res.json({
            success: true,
            data: {
                user: decoded
            }
        });
    } catch (error) {
        console.error('❌ Erro na verificação do token:', error);
        res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
});

// Logout
router.post('/logout', (req, res) => {
    console.log('🚪 Logout admin');
    res.json({
        success: true,
        message: 'Logout realizado com sucesso'
    });
});

console.log('✅ Admin-auth router configurado com rotas:', router.stack.map(layer => {
    if (layer.route) {
        return `${Object.keys(layer.route.methods)[0].toUpperCase()} ${layer.route.path}`;
    }
    return 'middleware';
}));

module.exports = router;
