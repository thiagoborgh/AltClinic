const crypto = require('crypto');

// Middleware para log de auditoria
const auditMiddleware = (acao) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log apenas se a operação foi bem-sucedida
      if (res.statusCode < 400) {
        logAuditoria(req, acao, data);
      }
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Função para registrar logs de auditoria
const logAuditoria = async (req, acao, dados = null) => {
  try {
    if (!req.db || !req.user) return;
    
    const detalhes = {
      rota: req.route?.path || req.path,
      metodo: req.method,
      params: req.params,
      query: req.query,
      body: sanitizeBody(req.body),
      response: sanitizeResponse(dados)
    };
    
    await req.db.run(`
      INSERT INTO logs_auditoria 
      (usuario_id, acao, tabela, registro_id, detalhes, ip_address, user_agent, timestamp) 
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      req.user.id,
      acao,
      extrairTabela(req.path),
      extrairRegistroId(req.params),
      JSON.stringify(detalhes),
      req.ip || req.connection?.remoteAddress,
      req.get('User-Agent')
    ]);
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
  }
};

// Sanitizar dados sensíveis do body
const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  const camposSensiveis = [
    'password', 'senha', 'token', 'api_key', 'secret', 'private_key',
    'webhook_verify_token', 'chave_pix'
  ];
  
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      } else if (camposSensiveis.some(campo => key.toLowerCase().includes(campo))) {
        obj[key] = '***MASCARADO***';
      }
    }
  };
  
  sanitizeObject(sanitized);
  return sanitized;
};

// Sanitizar resposta
const sanitizeResponse = (response) => {
  if (!response) return null;
  
  try {
    const parsed = typeof response === 'string' ? JSON.parse(response) : response;
    return {
      success: parsed.success,
      message: parsed.message,
      recordCount: Array.isArray(parsed.data) ? parsed.data.length : (parsed.data ? 1 : 0)
    };
  } catch {
    return { type: typeof response };
  }
};

// Extrair tabela da rota
const extrairTabela = (path) => {
  const match = path.match(/\/api\/(\w+)/);
  return match ? match[1] : null;
};

// Extrair ID do registro dos parâmetros
const extrairRegistroId = (params) => {
  return params.id || params.clinicaId || params.usuarioId || null;
};

// Função para criptografar dados sensíveis
const criptografar = (texto, chave = null) => {
  if (!texto) return '';
  
  const chaveEncriptacao = chave || process.env.CONFIG_ENCRYPTION_KEY || 'chave-padrao-trocar-em-producao';
  const cipher = crypto.createCipher('aes192', chaveEncriptacao);
  let encrypted = cipher.update(texto, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

// Função para descriptografar dados sensíveis
const descriptografar = (textoCriptografado, chave = null) => {
  if (!textoCriptografado) return '';
  
  try {
    const chaveEncriptacao = chave || process.env.CONFIG_ENCRYPTION_KEY || 'chave-padrao-trocar-em-producao';
    const decipher = crypto.createDecipher('aes192', chaveEncriptacao);
    let decrypted = decipher.update(textoCriptografado, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    return '';
  }
};

// Função para mascarar dados sensíveis na exibição
const mascararDados = (valor, tipo = 'default') => {
  if (!valor) return '';
  
  switch (tipo) {
    case 'email':
      const [nome, dominio] = valor.split('@');
      if (!dominio) return '***';
      return `${nome.charAt(0)}***@${dominio}`;
      
    case 'telefone':
      return valor.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-****');
      
    case 'cpf':
      return valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.$3-**');
      
    case 'cnpj':
      return valor.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.***.***/$4-**');
      
    case 'cartao':
      return valor.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 **** **** $4');
      
    case 'token':
    case 'api_key':
      if (valor.length <= 8) return '***';
      return `${valor.substring(0, 4)}***${valor.substring(valor.length - 4)}`;
      
    default:
      if (valor.length <= 4) return '***';
      return `${valor.substring(0, 2)}***${valor.substring(valor.length - 2)}`;
  }
};

// Função para validar configurações
const validarConfiguracoes = (configuracoes) => {
  const erros = [];
  
  // Validar integração WhatsApp
  if (configuracoes.integracoes?.whatsapp?.ativo) {
    if (!configuracoes.integracoes.whatsapp.token) {
      erros.push('Token do WhatsApp é obrigatório quando a integração está ativa');
    }
    if (!configuracoes.integracoes.whatsapp.phone_number_id) {
      erros.push('Phone Number ID do WhatsApp é obrigatório quando a integração está ativa');
    }
  }
  
  // Validar PIX
  if (configuracoes.integracoes?.pix?.chave) {
    const { chave, tipo_chave } = configuracoes.integracoes.pix;
    
    switch (tipo_chave) {
      case 'email':
        if (!/\S+@\S+\.\S+/.test(chave)) {
          erros.push('Formato de email inválido para chave PIX');
        }
        break;
      case 'cpf':
        if (!/^\d{11}$/.test(chave.replace(/\D/g, ''))) {
          erros.push('Formato de CPF inválido para chave PIX');
        }
        break;
      case 'cnpj':
        if (!/^\d{14}$/.test(chave.replace(/\D/g, ''))) {
          erros.push('Formato de CNPJ inválido para chave PIX');
        }
        break;
      case 'telefone':
        if (!/^\d{10,11}$/.test(chave.replace(/\D/g, ''))) {
          erros.push('Formato de telefone inválido para chave PIX');
        }
        break;
    }
  }
  
  // Validar informações da clínica
  if (configuracoes.clinica?.informacoes) {
    const { email, telefone, cnpj } = configuracoes.clinica.informacoes;
    
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      erros.push('Formato de email inválido nas informações da clínica');
    }
    
    if (cnpj && !/^\d{14}$/.test(cnpj.replace(/\D/g, ''))) {
      erros.push('Formato de CNPJ inválido nas informações da clínica');
    }
    
    if (telefone && !/^\d{10,11}$/.test(telefone.replace(/\D/g, ''))) {
      erros.push('Formato de telefone inválido nas informações da clínica');
    }
  }
  
  // Validar horários de funcionamento
  if (configuracoes.clinica?.horarios?.funcionamento) {
    const horarios = configuracoes.clinica.horarios.funcionamento;
    
    for (const [dia, horario] of Object.entries(horarios)) {
      if (horario.ativo) {
        if (!horario.inicio || !horario.fim) {
          erros.push(`Horário de ${dia} deve ter início e fim definidos quando ativo`);
        }
        
        if (horario.inicio >= horario.fim) {
          erros.push(`Horário de início deve ser menor que o fim em ${dia}`);
        }
      }
    }
  }
  
  return erros;
};

// Função para gerar backup das configurações
const gerarBackupConfiguracoes = async (db, clinicaId, usuarioId) => {
  try {
    // Buscar todas as configurações
    const configuracoes = await db.all(
      'SELECT * FROM configuracoes WHERE clinica_id = ?',
      [clinicaId]
    );
    
    // Buscar dados relacionados
    const procedimentos = await db.all(
      'SELECT * FROM procedimentos WHERE clinica_id = ?',
      [clinicaId]
    );
    
    const especialidades = await db.all(
      'SELECT * FROM especialidades WHERE clinica_id = ?',
      [clinicaId]
    );
    
    const equipamentos = await db.all(
      'SELECT * FROM equipamentos WHERE clinica_id = ?',
      [clinicaId]
    );
    
    const templates = await db.all(
      'SELECT * FROM templates_mensagens WHERE clinica_id = ?',
      [clinicaId]
    );
    
    const campos = await db.all(
      'SELECT * FROM campos_anamnese WHERE clinica_id = ?',
      [clinicaId]
    );
    
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      clinica_id: clinicaId,
      data: {
        configuracoes: configuracoes.map(config => ({
          ...config,
          valor: config.criptografado ? '***CRIPTOGRAFADO***' : config.valor
        })),
        procedimentos,
        especialidades,
        equipamentos,
        templates_mensagens: templates,
        campos_anamnese: campos
      }
    };
    
    const dadosBackup = JSON.stringify(backup, null, 2);
    const nomeArquivo = `backup_configuracoes_${clinicaId}_${Date.now()}.json`;
    
    // Salvar registro do backup
    await db.run(`
      INSERT INTO backup_configuracoes 
      (clinica_id, nome_arquivo, dados_backup, tamanho, criado_por) 
      VALUES (?, ?, ?, ?, ?)
    `, [
      clinicaId,
      nomeArquivo,
      dadosBackup,
      Buffer.byteLength(dadosBackup, 'utf8'),
      usuarioId
    ]);
    
    return {
      success: true,
      arquivo: nomeArquivo,
      tamanho: Buffer.byteLength(dadosBackup, 'utf8'),
      dados: dadosBackup
    };
    
  } catch (error) {
    console.error('Erro ao gerar backup:', error);
    throw error;
  }
};

// Função para importar backup
const importarBackupConfiguracoes = async (db, clinicaId, dadosBackup, usuarioId) => {
  try {
    const backup = JSON.parse(dadosBackup);
    
    if (!backup.data) {
      throw new Error('Formato de backup inválido');
    }
    
    // Iniciar transação
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Restaurar configurações (exceto as criptografadas)
      if (backup.data.configuracoes) {
        for (const config of backup.data.configuracoes) {
          if (config.valor !== '***CRIPTOGRAFADO***') {
            await db.run(`
              INSERT OR REPLACE INTO configuracoes 
              (clinica_id, secao, chave, valor, criptografado) 
              VALUES (?, ?, ?, ?, ?)
            `, [
              clinicaId,
              config.secao,
              config.chave,
              config.valor,
              config.criptografado
            ]);
          }
        }
      }
      
      // Restaurar outros dados...
      // (implementar conforme necessário)
      
      await db.run('COMMIT');
      
      // Log de auditoria
      await db.run(`
        INSERT INTO logs_auditoria 
        (usuario_id, acao, tabela, registro_id, detalhes) 
        VALUES (?, ?, ?, ?, ?)
      `, [
        usuarioId,
        'IMPORT_BACKUP',
        'configuracoes',
        clinicaId,
        `Backup importado: ${backup.version}`
      ]);
      
      return { success: true };
      
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Erro ao importar backup:', error);
    throw error;
  }
};

module.exports = {
  auditMiddleware,
  logAuditoria,
  criptografar,
  descriptografar,
  mascararDados,
  validarConfiguracoes,
  gerarBackupConfiguracoes,
  importarBackupConfiguracoes
};
