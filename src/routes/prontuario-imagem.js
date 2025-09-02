const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken } = require('../middleware/auth');
const { dbManager } = require('../models/database');
const { encryptionUtil } = require('../utils/encryption');

const router = express.Router();

// Configuração do multer para upload de imagens
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos'), false);
    }
  }
});

// Diretório para uploads
const uploadDir = path.join(__dirname, '../uploads/imagens');

/**
 * @route POST /api/prontuario/imagem/upload
 * @desc Upload de imagem para o prontuário
 */
router.post('/upload', authenticateToken, upload.single('imagem'), async (req, res) => {
  try {
    const { pacienteId, categoria, descricao, data, tags } = req.body;

    if (!pacienteId || !categoria) {
      return res.status(400).json({
        success: false,
        message: 'Paciente e categoria são obrigatórios'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Arquivo de imagem é obrigatório'
      });
    }

    // Verificar se paciente pertence à clínica
    const db = dbManager.getDb();
    const paciente = db.prepare(`
      SELECT id FROM paciente WHERE id = ? AND clinica_id = ?
    `).get(pacienteId, req.user.clinica_id);

    if (!paciente) {
      return res.status(403).json({
        success: false,
        message: 'Paciente não encontrado ou não pertence à sua clínica'
      });
    }

    // Garantir que o diretório existe
    await fs.mkdir(uploadDir, { recursive: true });

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileName = `${pacienteId}_${categoria.replace(/\s+/g, '_')}_${timestamp}.webp`;
    const filePath = path.join(uploadDir, fileName);

    // Processar imagem com Sharp
    await sharp(req.file.buffer)
      .resize(1920, 1080, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .webp({ quality: 85 })
      .toFile(filePath);

    // Criptografar o caminho do arquivo
    const imagemPathCriptografado = encryptionUtil.encryptFilePath(filePath);

    // Salvar no banco de dados
    const imagemId = db.prepare(`
      INSERT INTO prontuario_imagem (
        paciente_id, categoria, descricao, data_imagem, tags, 
        arquivo_path, arquivo_nome, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      pacienteId,
      categoria,
      descricao || null,
      data || new Date().toISOString().split('T')[0],
      tags ? JSON.stringify(JSON.parse(tags)) : null,
      imagemPathCriptografado,
      fileName
    ).lastInsertRowid;

    console.log(`📸 Imagem salva: ${fileName} para paciente ${pacienteId}`);

    res.status(201).json({
      success: true,
      message: 'Imagem salva com sucesso',
      id: imagemId,
      url: `/api/prontuario/imagem/view/${imagemId}`,
      fileName
    });

  } catch (error) {
    console.error('Erro no upload de imagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route GET /api/prontuario/imagem/paciente/:pacienteId
 * @desc Lista todas as imagens de um paciente
 */
router.get('/paciente/:pacienteId', authenticateToken, async (req, res) => {
  try {
    const { pacienteId } = req.params;

    // Verificar se paciente pertence à clínica
    const db = dbManager.getDb();
    const paciente = db.prepare(`
      SELECT id FROM paciente WHERE id = ? AND clinica_id = ?
    `).get(pacienteId, req.user.clinica_id);

    if (!paciente) {
      return res.status(403).json({
        success: false,
        message: 'Paciente não encontrado ou não pertence à sua clínica'
      });
    }

    // Buscar todas as imagens do paciente
    const imagens = db.prepare(`
      SELECT id, categoria, descricao, data_imagem, tags, arquivo_nome, created_at
      FROM prontuario_imagem
      WHERE paciente_id = ?
      ORDER BY data_imagem DESC, created_at DESC
    `).all(pacienteId);

    // Adicionar URL para cada imagem
    const imagensComUrl = imagens.map(imagem => ({
      ...imagem,
      url: `/api/prontuario/imagem/view/${imagem.id}`,
      tags: imagem.tags ? JSON.parse(imagem.tags) : []
    }));

    res.json({
      success: true,
      data: imagensComUrl
    });

  } catch (error) {
    console.error('Erro ao buscar imagens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /api/prontuario/imagem/view/:imagemId
 * @desc Serve imagem do prontuário
 */
router.get('/view/:imagemId', authenticateToken, async (req, res) => {
  try {
    const { imagemId } = req.params;

    const db = dbManager.getDb();
    
    // Buscar imagem e verificar permissão
    const imagem = db.prepare(`
      SELECT pi.arquivo_path, p.clinica_id
      FROM prontuario_imagem pi
      JOIN paciente p ON pi.paciente_id = p.id
      WHERE pi.id = ?
    `).get(imagemId);

    if (!imagem) {
      return res.status(404).json({
        success: false,
        message: 'Imagem não encontrada'
      });
    }

    if (imagem.clinica_id !== req.user.clinica_id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    // Descriptografar caminho e servir arquivo
    const caminhoReal = encryptionUtil.decryptFilePath(imagem.arquivo_path);
    
    // Verificar se arquivo existe
    await fs.access(caminhoReal);
    
    res.sendFile(path.resolve(caminhoReal));

  } catch (error) {
    console.error('Erro ao servir imagem:', error);
    res.status(404).json({
      success: false,
      message: 'Arquivo não encontrado'
    });
  }
});

/**
 * @route DELETE /api/prontuario/imagem/:imagemId
 * @desc Remove imagem do prontuário
 */
router.delete('/:imagemId', authenticateToken, async (req, res) => {
  try {
    const { imagemId } = req.params;

    const db = dbManager.getDb();
    
    // Buscar imagem e verificar permissão
    const imagem = db.prepare(`
      SELECT pi.arquivo_path, p.clinica_id
      FROM prontuario_imagem pi
      JOIN paciente p ON pi.paciente_id = p.id
      WHERE pi.id = ?
    `).get(imagemId);

    if (!imagem) {
      return res.status(404).json({
        success: false,
        message: 'Imagem não encontrada'
      });
    }

    if (imagem.clinica_id !== req.user.clinica_id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    // Remover arquivo físico
    try {
      const caminhoReal = encryptionUtil.decryptFilePath(imagem.arquivo_path);
      await fs.unlink(caminhoReal);
    } catch (error) {
      console.warn('Arquivo físico não encontrado:', error.message);
    }

    // Remover do banco de dados
    db.prepare(`DELETE FROM prontuario_imagem WHERE id = ?`).run(imagemId);

    res.json({
      success: true,
      message: 'Imagem removida com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover imagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route PUT /api/prontuario/imagem/:imagemId
 * @desc Atualiza metadados da imagem
 */
router.put('/:imagemId', authenticateToken, async (req, res) => {
  try {
    const { imagemId } = req.params;
    const { categoria, descricao, data, tags } = req.body;

    const db = dbManager.getDb();
    
    // Verificar se imagem existe e pertence à clínica
    const imagem = db.prepare(`
      SELECT pi.id, p.clinica_id
      FROM prontuario_imagem pi
      JOIN paciente p ON pi.paciente_id = p.id
      WHERE pi.id = ?
    `).get(imagemId);

    if (!imagem) {
      return res.status(404).json({
        success: false,
        message: 'Imagem não encontrada'
      });
    }

    if (imagem.clinica_id !== req.user.clinica_id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    // Atualizar metadados
    const updates = [];
    const params = [];

    if (categoria) {
      updates.push('categoria = ?');
      params.push(categoria);
    }

    if (descricao !== undefined) {
      updates.push('descricao = ?');
      params.push(descricao || null);
    }

    if (data) {
      updates.push('data_imagem = ?');
      params.push(data);
    }

    if (tags !== undefined) {
      updates.push('tags = ?');
      params.push(tags ? JSON.stringify(tags) : null);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(imagemId);

      db.prepare(`
        UPDATE prontuario_imagem 
        SET ${updates.join(', ')} 
        WHERE id = ?
      `).run(...params);
    }

    res.json({
      success: true,
      message: 'Imagem atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar imagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /api/prontuario/imagem/comparacao
 * @desc Gera comparação entre imagens
 */
router.post('/comparacao', authenticateToken, async (req, res) => {
  try {
    const { imagemIds, formato = 'grid' } = req.body;

    if (!imagemIds || !Array.isArray(imagemIds) || imagemIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'É necessário pelo menos 2 imagens para comparação'
      });
    }

    if (imagemIds.length > 4) {
      return res.status(400).json({
        success: false,
        message: 'Máximo 4 imagens para comparação'
      });
    }

    const db = dbManager.getDb();
    
    // Buscar imagens e verificar permissões
    const imagens = db.prepare(`
      SELECT pi.id, pi.categoria, pi.descricao, pi.data_imagem, pi.arquivo_path, p.clinica_id
      FROM prontuario_imagem pi
      JOIN paciente p ON pi.paciente_id = p.id
      WHERE pi.id IN (${imagemIds.map(() => '?').join(',')})
    `).all(...imagemIds);

    if (imagens.length !== imagemIds.length) {
      return res.status(404).json({
        success: false,
        message: 'Uma ou mais imagens não foram encontradas'
      });
    }

    // Verificar se todas as imagens pertencem à mesma clínica
    const clinicaId = imagens[0].clinica_id;
    if (imagens.some(img => img.clinica_id !== clinicaId) || clinicaId !== req.user.clinica_id) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado às imagens'
      });
    }

    // Preparar dados para comparação
    const dadosComparacao = {
      id: `comp_${Date.now()}`,
      formato,
      imagens: imagens.map(img => ({
        id: img.id,
        categoria: img.categoria,
        descricao: img.descricao,
        data: img.data_imagem,
        url: `/api/prontuario/imagem/view/${img.id}`
      })),
      criadoEm: new Date().toISOString()
    };

    res.json({
      success: true,
      data: dadosComparacao
    });

  } catch (error) {
    console.error('Erro ao gerar comparação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
