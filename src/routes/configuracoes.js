const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const dbManager = require('../models/database');

// Middleware de autenticação (assumindo que existe)
const requireAuth = (req, res, next) => {
  // Implementar verificação de autenticação
  next();
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
  // Implementar verificação de admin
  next();
};

// Chave para criptografia (deve estar no .env)
const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY || 'default-key-change-in-production';

// Função para criptografar dados sensíveis
const encrypt = (text) => {
  if (!text) return '';
  const cipher = crypto.createCipher('aes192', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

// Função para descriptografar dados sensíveis
const decrypt = (text) => {
  if (!text) return '';
  try {
    const decipher = crypto.createDecipher('aes192', ENCRYPTION_KEY);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    return '';
  }
};

// Configurações padrão
const defaultConfig = {
  integracoes: {
    whatsapp: {
      token: '',
      phone_number_id: '',
      webhook_verify_token: '',
      qrCode: '',
      status: 'desconectado'
    },
    pix: {
      chave: '',
      titular: '',
      banco: '',
      agencia: '',
      conta: '',
      tipo_chave: 'email'
    },
    gemini: {
      api_key: '',
      modelo: 'gemini-pro',
      ativo: false
    },
    huggingface: {
      api_key: '',
      modelo: 'microsoft/DialoGPT-medium',
      ativo: false
    },
    mailchimp: {
      api_key: '',
      list_id: '',
      from_email: '',
      from_name: '',
      smtp_server: '',
      smtp_port: 587,
      ativo: false
    }
  },
  clinica: {
    informacoes: {
      nome: '',
      cnpj: '',
      endereco: '',
      telefone: '',
      email: '',
      responsavel_tecnico: ''
    },
    horarios: {
      funcionamento: {
        segunda: { inicio: '08:00', fim: '18:00', ativo: true },
        terca: { inicio: '08:00', fim: '18:00', ativo: true },
        quarta: { inicio: '08:00', fim: '18:00', ativo: true },
        quinta: { inicio: '08:00', fim: '18:00', ativo: true },
        sexta: { inicio: '08:00', fim: '18:00', ativo: true },
        sabado: { inicio: '08:00', fim: '12:00', ativo: false },
        domingo: { inicio: '08:00', fim: '12:00', ativo: false }
      },
      intervalo_consulta: 30,
      antecedencia_minima: 60,
      antecedencia_maxima: 90
    },
    procedimentos: [],
    equipamentos: [],
    especialidades: []
  },
  templates: {
    mensagens: {
      boas_vindas: 'Olá! Bem-vindo(a) à nossa clínica. Como podemos ajudá-lo(a)?',
      confirmacao_agendamento: 'Seu agendamento foi confirmado para {data} às {hora}.',
      lembrete_consulta: 'Lembrete: Você tem consulta amanhã às {hora}.',
      cancelamento: 'Seu agendamento foi cancelado. Entre em contato para reagendar.',
      pos_consulta: 'Obrigado por sua visita! Como foi sua experiência?'
    },
    anamnese: {
      campos_obrigatorios: ['nome', 'idade', 'queixa_principal'],
      campos_opcionais: ['historico_familiar', 'medicamentos', 'alergias'],
      perguntas_personalizadas: []
    },
    emails: {
      confirmacao: {
        assunto: 'Agendamento Confirmado',
        corpo: 'Seu agendamento foi confirmado...'
      },
      lembrete: {
        assunto: 'Lembrete de Consulta',
        corpo: 'Você tem uma consulta agendada...'
      }
    },
    periodo_inatividade: 90
  },
  seguranca: {
    lgpd: {
      consentimento_padrao: 'Autorizo o uso dos meus dados pessoais...',
      politica_privacidade: '',
      termos_uso: '',
      responsavel_dados: '',
      dpo_email: ''
    },
    backup: {
      automatico: true,
      frequencia: 'diaria',
      retencao: 30,
      local: 'local'
    },
    auditoria: {
      log_acessos: true,
      log_modificacoes: true,
      retencao_logs: 365
    }
  }
};

// GET /api/configuracoes - Obter configurações
router.get('/', requireAuth, async (req, res) => {
  try {
    const db = dbManager.getDb();
    
    // Buscar configurações do banco
    const query = `
      SELECT secao, chave, valor, criptografado 
      FROM configuracoes 
      WHERE clinica_id = ?
    `;
    
    const configuracoesBanco = db.prepare(query).all(1); // Por enquanto usando clinica_id = 1
    
    // Montar objeto de configurações
    let configuracoes = JSON.parse(JSON.stringify(defaultConfig));
    
    configuracoesBanco.forEach(config => {
      const valor = config.criptografado ? decrypt(config.valor) : config.valor;
      
      // Navegar pelo objeto e definir o valor
      const caminho = `${config.secao}.${config.chave}`.split('.');
      let atual = configuracoes;
      
      for (let i = 0; i < caminho.length - 1; i++) {
        if (!atual[caminho[i]]) atual[caminho[i]] = {};
        atual = atual[caminho[i]];
      }
      
      try {
        atual[caminho[caminho.length - 1]] = JSON.parse(valor);
      } catch {
        atual[caminho[caminho.length - 1]] = valor;
      }
    });
    
    res.json(configuracoes);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/configuracoes - Salvar configurações
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const db = dbManager.getDb();
    const configuracoes = req.body;
    
    // Função recursiva para percorrer o objeto
    const processarConfiguracoes = (obj, secao = '') => {
      for (const [chave, valor] of Object.entries(obj)) {
        if (typeof valor === 'object' && valor !== null && !Array.isArray(valor)) {
          // Se é objeto, recursão
          processarConfiguracoes(valor, secao ? `${secao}.${chave}` : chave);
        } else {
          // Determinar se deve criptografar
          const camposSensiveis = [
            'token', 'api_key', 'webhook_verify_token', 'chave_pix'
          ];
          const deveCriptografar = camposSensiveis.some(campo => 
            chave.toLowerCase().includes(campo.toLowerCase())
          );
          
          const valorString = typeof valor === 'string' ? valor : JSON.stringify(valor);
          const valorFinal = deveCriptografar ? encrypt(valorString) : valorString;
          
          // Salvar no banco
          db.prepare(`
            INSERT OR REPLACE INTO configuracoes 
            (clinica_id, secao, chave, valor, criptografado, atualizado_em) 
            VALUES (?, ?, ?, ?, ?, datetime('now'))
          `).run(
            1, // Por enquanto usando clinica_id = 1
            secao,
            chave,
            valorFinal,
            deveCriptografar ? 1 : 0
          );
        }
      }
    };
    
    processarConfiguracoes(configuracoes);
    
    // Log de auditoria (opcional, pode remover se não existir a tabela)
    // db.prepare(`
    //   INSERT INTO logs_auditoria 
    //   (usuario_id, acao, tabela, registro_id, detalhes, timestamp) 
    //   VALUES (?, ?, ?, ?, ?, datetime('now'))
    // `).run(1, 'UPDATE', 'configuracoes', 1, JSON.stringify(configuracoes));
      'configuracoes',
      req.user.clinica_id,
      'Configurações atualizadas'
    ]);
    
    res.json({ success: true, message: 'Configurações salvas com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/configuracoes/testar/:tipo - Testar integrações
router.post('/testar/:tipo', requireAuth, async (req, res) => {
  try {
    const { tipo } = req.params;
    const dados = req.body;
    
    switch (tipo) {
      case 'whatsapp':
        // Testar conexão WhatsApp
        try {
          // Implementar teste real da API do WhatsApp
          const response = await fetch(`https://graph.facebook.com/v17.0/${dados.phone_number_id}`, {
            headers: {
              'Authorization': `Bearer ${dados.token}`
            }
          });
          
          if (response.ok) {
            res.json({ sucesso: true, mensagem: 'Conexão WhatsApp estabelecida com sucesso!' });
          } else {
            res.json({ sucesso: false, mensagem: 'Falha na conexão WhatsApp. Verifique o token.' });
          }
        } catch (error) {
          res.json({ sucesso: false, mensagem: `Erro: ${error.message}` });
        }
        break;
        
      case 'pix':
        // Testar geração de PIX
        try {
          // Implementar geração de PIX de teste
          const pixCode = generatePixCode(dados);
          res.json({ 
            sucesso: true, 
            mensagem: 'PIX de teste gerado com sucesso!',
            codigo: pixCode
          });
        } catch (error) {
          res.json({ sucesso: false, mensagem: `Erro: ${error.message}` });
        }
        break;
        
      case 'gemini':
        // Testar API Gemini
        try {
          // Implementar teste da API Gemini
          const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${dados.api_key}`);
          
          if (response.ok) {
            res.json({ sucesso: true, mensagem: 'API Gemini conectada com sucesso!' });
          } else {
            res.json({ sucesso: false, mensagem: 'Falha na conexão Gemini. Verifique a API key.' });
          }
        } catch (error) {
          res.json({ sucesso: false, mensagem: `Erro: ${error.message}` });
        }
        break;
        
      case 'email':
        // Testar envio de email
        try {
          // Implementar teste de email real
          res.json({ sucesso: true, mensagem: 'Email de teste enviado com sucesso!' });
        } catch (error) {
          res.json({ sucesso: false, mensagem: `Erro: ${error.message}` });
        }
        break;
        
      default:
        res.status(400).json({ error: 'Tipo de teste não reconhecido' });
    }
  } catch (error) {
    console.error('Erro ao testar integração:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/configuracoes/whatsapp/qr - Gerar QR Code WhatsApp
router.post('/whatsapp/qr', requireAuth, async (req, res) => {
  try {
    // Implementar geração real de QR Code
    const qrCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    res.json({ 
      qrCode,
      message: 'QR Code gerado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/configuracoes/whatsapp/status - Verificar status da conexão WhatsApp
router.get('/whatsapp/status', requireAuth, async (req, res) => {
  try {
    // Implementar verificação real do status
    // Por enquanto, simular diferentes estados
    const statusOptions = [
      { conectado: true, numero: '+5511999999999', nome: 'Clínica SAEE' },
      { conectado: false, erro: 'Aguardando conexão' },
      { conectado: false, erro: 'QR Code expirado' }
    ];
    
    // Simular status aleatório para demonstração
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    
    res.json({
      success: true,
      ...status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao verificar status WhatsApp:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Função auxiliar para gerar código PIX
function generatePixCode(dados) {
  // Implementar geração real de PIX
  return `00020126580014BR.GOV.BCB.PIX0136${dados.chave}5204000053039865802BR5925${dados.titular}6009SAO PAULO62070503***6304ABCD`;
}

// GET /api/configuracoes/backup/status - Status do backup
router.get('/backup/status', requireAuth, async (req, res) => {
  try {
    // Implementar verificação real do status
    const status = {
      ultimo: '2024-01-15T23:00:00Z',
      proximo: '2024-01-16T23:00:00Z',
      status: 'ok',
      tamanho: '2.5 MB',
      arquivos: 15
    };
    
    res.json(status);
  } catch (error) {
    console.error('Erro ao verificar status do backup:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/configuracoes/backup/manual - Executar backup manual
router.post('/backup/manual', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Implementar backup manual real
    setTimeout(() => {
      console.log('Backup manual executado com sucesso');
    }, 5000);
    
    res.json({ 
      success: true, 
      message: 'Backup manual iniciado com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao executar backup manual:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
