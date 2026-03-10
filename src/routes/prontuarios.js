const express = require('express');
const router = express.Router();
const multer = require('multer');
// const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const PacienteModel = require('../models/Paciente');
const authUtil = require('../utils/auth');
const encryptionUtil = require('../utils/encryption');
const claudeService = require('../utils/claude');

// Configuração do multer para upload de imagens
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.'), false);
    }
  }
});

/**
 * @route POST /prontuarios
 * @desc Cria/atualiza prontuário
 */
router.post('/', authUtil.authenticate, upload.single('imagem'), async (req, res) => {
  try {
    const {
      paciente_id,
      anamnese_json,
      medidas_json
    } = req.body;

    if (!paciente_id) {
      return res.status(400).json({
        success: false,
        message: 'ID do paciente é obrigatório'
      });
    }

    // Verificar se paciente pertence à clínica
    if (!PacienteModel.belongsToClinica(paciente_id, req.user.clinica_id)) {
      return res.status(403).json({
        success: false,
        message: 'Paciente não pertence à sua clínica'
      });
    }

    let imagemPath = null;

    // Processar upload de imagem se houver
    if (req.file) {
      try {
        // Garantir que o diretório existe
        await fs.mkdir(uploadDir, { recursive: true });

        // Gerar nome único para o arquivo
        const timestamp = Date.now();
        const fileName = `${paciente_id}_${timestamp}.webp`;
        const filePath = path.join(uploadDir, fileName);

        // Processar imagem com Sharp (redimensionar e otimizar)
        await sharp(req.file.buffer)
          .resize(1920, 1080, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 85 })
          .toFile(filePath);

        // Criptografar o caminho do arquivo
        imagemPath = encryptionUtil.encryptFilePath(filePath);

        console.log(`📸 Imagem salva: ${fileName}`);

      } catch (error) {
        console.error('Erro ao processar imagem:', error.message);
        return res.status(500).json({
          success: false,
          message: 'Erro ao processar imagem'
        });
      }
    }

    // Validar e processar JSONs
    let anamneseData = null;
    let medidasData = null;

    if (anamnese_json) {
      try {
        anamneseData = typeof anamnese_json === 'string' ?
          JSON.parse(anamnese_json) : anamnese_json;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Anamnese deve ser um JSON válido'
        });
      }
    }

    if (medidas_json) {
      try {
        medidasData = typeof medidas_json === 'string' ?
          JSON.parse(medidas_json) : medidas_json;

        // Adicionar timestamp às medidas
        if (medidasData && !medidasData.data_medicao) {
          medidasData.data_medicao = new Date().toISOString();
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Medidas devem ser um JSON válido'
        });
      }
    }

    // Verificar se já existe prontuário para o paciente
    const prontuarioExistente = await req.db.get(`
      SELECT id FROM prontuario WHERE paciente_id = $1
    `, [paciente_id]);

    let prontuarioId;

    if (prontuarioExistente) {
      // Atualizar prontuário existente
      const updates = [];
      const params = [];
      let paramIndex = 1;

      if (anamneseData) {
        updates.push(`anamnese_json = $${paramIndex++}`);
        params.push(anamneseData);
      }

      if (medidasData) {
        // Buscar medidas existentes e adicionar nova
        const prontuario = await req.db.get('SELECT medidas_json FROM prontuario WHERE id = $1', [prontuarioExistente.id]);
        let medidasExistentes = [];

        if (prontuario.medidas_json) {
          medidasExistentes = Array.isArray(prontuario.medidas_json)
            ? prontuario.medidas_json
            : [prontuario.medidas_json];
        }

        medidasExistentes.push(medidasData);
        updates.push(`medidas_json = $${paramIndex++}`);
        params.push(medidasExistentes);
      }

      if (imagemPath) {
        updates.push(`imagem_path = $${paramIndex++}`);
        params.push(imagemPath);
      }

      if (updates.length > 0) {
        updates.push(`updated_at = NOW()`);
        params.push(prontuarioExistente.id);

        await req.db.run(`
          UPDATE prontuario SET ${updates.join(', ')} WHERE id = $${paramIndex}
        `, params);
      }

      prontuarioId = prontuarioExistente.id;

    } else {
      // Criar novo prontuário
      const medidasArray = medidasData ? [medidasData] : null;

      const result = await req.db.run(`
        INSERT INTO prontuario (paciente_id, anamnese_json, medidas_json, imagem_path)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [
        paciente_id,
        anamneseData || null,
        medidasArray || null,
        imagemPath
      ]);

      prontuarioId = result.lastID;
    }

    // Buscar prontuário completo para retorno
    const prontuario = await req.db.get(`
      SELECT p.*, pac.nome as paciente_nome
      FROM prontuario p
      LEFT JOIN paciente pac ON p.paciente_id = pac.id
      WHERE p.id = $1
    `, [prontuarioId]);

    // Descriptografar caminho da imagem para retorno (se houver)
    let imagemUrl = null;
    if (prontuario.imagem_path) {
      try {
        const caminhoReal = encryptionUtil.decryptFilePath(prontuario.imagem_path);
        const nomeArquivo = path.basename(caminhoReal);
        imagemUrl = `/uploads/${nomeArquivo}`;
      } catch (error) {
        console.error('Erro ao descriptografar caminho da imagem:', error.message);
      }
    }

    res.status(prontuarioExistente ? 200 : 201).json({
      success: true,
      message: prontuarioExistente ? 'Prontuário atualizado com sucesso' : 'Prontuário criado com sucesso',
      data: {
        ...prontuario,
        imagem_url: imagemUrl
      }
    });

  } catch (error) {
    console.error('Erro ao salvar prontuário:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /prontuarios/paciente/:paciente_id
 * @desc Busca prontuário do paciente
 */
router.get('/paciente/:paciente_id', authUtil.authenticate, async (req, res) => {
  try {
    const { paciente_id } = req.params;

    // Verificar se paciente pertence à clínica
    if (!PacienteModel.belongsToClinica(paciente_id, req.user.clinica_id)) {
      return res.status(403).json({
        success: false,
        message: 'Paciente não pertence à sua clínica'
      });
    }

    const prontuario = await req.db.get(`
      SELECT p.*, pac.nome as paciente_nome, pac.telefone as paciente_telefone
      FROM prontuario p
      LEFT JOIN paciente pac ON p.paciente_id = pac.id
      WHERE p.paciente_id = $1
    `, [paciente_id]);

    if (!prontuario) {
      return res.status(404).json({
        success: false,
        message: 'Prontuário não encontrado'
      });
    }

    // Descriptografar caminho da imagem
    let imagemUrl = null;
    if (prontuario.imagem_path) {
      try {
        const caminhoReal = encryptionUtil.decryptFilePath(prontuario.imagem_path);
        const nomeArquivo = path.basename(caminhoReal);
        imagemUrl = `/uploads/${nomeArquivo}`;
      } catch (error) {
        console.error('Erro ao descriptografar imagem:', error.message);
      }
    }

    res.json({
      success: true,
      data: {
        ...prontuario,
        imagem_url: imagemUrl
      }
    });

  } catch (error) {
    console.error('Erro ao buscar prontuário:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /prontuarios/anamnese/sugestoes
 * @desc Gera sugestões de anamnese com IA
 */
router.get('/anamnese/sugestoes', authUtil.authenticate, async (req, res) => {
  try {
    const { paciente_id, tipo_procedimento = 'geral' } = req.query;

    if (!paciente_id) {
      return res.status(400).json({
        success: false,
        message: 'ID do paciente é obrigatório'
      });
    }

    // Verificar se paciente pertence à clínica
    if (!PacienteModel.belongsToClinica(paciente_id, req.user.clinica_id)) {
      return res.status(403).json({
        success: false,
        message: 'Paciente não pertence à sua clínica'
      });
    }

    const paciente = PacienteModel.findById(paciente_id);

    try {
      const sugestoes = await claudeService.gerarSugestoesAnamnese(paciente, tipo_procedimento);

      res.json({
        success: true,
        data: sugestoes
      });

    } catch (error) {
      console.error('Erro ao gerar sugestões:', error.message);

      // Fallback com anamnese básica
      const anamneseBasica = {
        perguntas: [
          {
            categoria: 'dados_pessoais',
            pergunta: 'Confirme seus dados pessoais (nome, idade, profissão)',
            tipo: 'texto'
          },
          {
            categoria: 'historico_medico',
            pergunta: 'Possui alguma condição médica relevante?',
            tipo: 'texto'
          },
          {
            categoria: 'medicamentos',
            pergunta: 'Faz uso de algum medicamento atualmente?',
            tipo: 'texto'
          },
          {
            categoria: 'alergias',
            pergunta: 'Possui alguma alergia conhecida?',
            tipo: 'sim_nao'
          },
          {
            categoria: 'procedimentos_anteriores',
            pergunta: 'Já realizou procedimentos estéticos anteriormente?',
            tipo: 'sim_nao'
          },
          {
            categoria: 'expectativas',
            pergunta: 'Quais são suas expectativas com o tratamento?',
            tipo: 'texto'
          }
        ]
      };

      res.json({
        success: true,
        data: anamneseBasica,
        fallback: true
      });
    }

  } catch (error) {
    console.error('Erro ao obter sugestões de anamnese:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /prontuarios/medidas/analise
 * @desc Analisa evolução de medidas com IA
 */
router.post('/medidas/analise', authUtil.authenticate, async (req, res) => {
  try {
    const { paciente_id } = req.body;

    if (!paciente_id) {
      return res.status(400).json({
        success: false,
        message: 'ID do paciente é obrigatório'
      });
    }

    // Verificar se paciente pertence à clínica
    if (!PacienteModel.belongsToClinica(paciente_id, req.user.clinica_id)) {
      return res.status(403).json({
        success: false,
        message: 'Paciente não pertence à sua clínica'
      });
    }

    const prontuario = await req.db.get(`
      SELECT medidas_json FROM prontuario WHERE paciente_id = $1
    `, [paciente_id]);

    if (!prontuario || !prontuario.medidas_json) {
      return res.status(404).json({
        success: false,
        message: 'Medidas não encontradas para análise'
      });
    }

    // JSONB já vem parseado — sem JSON.parse
    const medidas = prontuario.medidas_json;

    try {
      const analise = await claudeService.analisarEvolucaoMedidas(medidas);

      res.json({
        success: true,
        data: analise
      });

    } catch (error) {
      console.error('Erro na análise de medidas:', error.message);

      // Fallback com análise básica
      const analiseBasica = {
        insights: [
          `Histórico de ${medidas.length} medição(ões) registrada(s)`,
          'Para uma análise mais detalhada, continue registrando medidas'
        ],
        recomendacoes: [
          'Mantenha regularidade nas medições',
          'Registre medidas sempre no mesmo horário'
        ]
      };

      res.json({
        success: true,
        data: analiseBasica,
        fallback: true
      });
    }

  } catch (error) {
    console.error('Erro ao analisar medidas:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /prontuarios/imagem/:paciente_id
 * @desc Serve imagem do prontuário (com autenticação)
 */
router.get('/imagem/:paciente_id', authUtil.authenticate, async (req, res) => {
  try {
    const { paciente_id } = req.params;

    // Verificar se paciente pertence à clínica
    if (!PacienteModel.belongsToClinica(paciente_id, req.user.clinica_id)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    const prontuario = await req.db.get(`
      SELECT imagem_path FROM prontuario WHERE paciente_id = $1
    `, [paciente_id]);

    if (!prontuario || !prontuario.imagem_path) {
      return res.status(404).json({
        success: false,
        message: 'Imagem não encontrada'
      });
    }

    try {
      const caminhoReal = encryptionUtil.decryptFilePath(prontuario.imagem_path);

      // Verificar se arquivo existe
      await fs.access(caminhoReal);

      res.sendFile(path.resolve(caminhoReal));

    } catch (error) {
      console.error('Erro ao servir imagem:', error.message);
      res.status(404).json({
        success: false,
        message: 'Arquivo de imagem não encontrado'
      });
    }

  } catch (error) {
    console.error('Erro ao buscar imagem:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route DELETE /prontuarios/imagem/:paciente_id
 * @desc Remove imagem do prontuário
 */
router.delete('/imagem/:paciente_id', authUtil.authenticate, async (req, res) => {
  try {
    const { paciente_id } = req.params;

    // Verificar se paciente pertence à clínica
    if (!PacienteModel.belongsToClinica(paciente_id, req.user.clinica_id)) {
      return res.status(403).json({
        success: false,
        message: 'Paciente não pertence à sua clínica'
      });
    }

    const prontuario = await req.db.get(`
      SELECT imagem_path FROM prontuario WHERE paciente_id = $1
    `, [paciente_id]);

    if (!prontuario || !prontuario.imagem_path) {
      return res.status(404).json({
        success: false,
        message: 'Imagem não encontrada'
      });
    }

    try {
      // Descriptografar e remover arquivo
      const caminhoReal = encryptionUtil.decryptFilePath(prontuario.imagem_path);
      await fs.unlink(caminhoReal);

      // Remover referência do banco
      await req.db.run(`
        UPDATE prontuario SET imagem_path = NULL, updated_at = NOW()
        WHERE paciente_id = $1
      `, [paciente_id]);

      res.json({
        success: true,
        message: 'Imagem removida com sucesso'
      });

    } catch (error) {
      console.error('Erro ao remover imagem:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erro ao remover imagem'
      });
    }

  } catch (error) {
    console.error('Erro ao processar remoção:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /prontuarios
 * @desc Lista prontuários da clínica
 */
router.get('/', authUtil.authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const prontuarios = await req.db.all(`
      SELECT p.id, p.paciente_id, p.data_registro, p.updated_at,
             pac.nome as paciente_nome,
             CASE WHEN p.anamnese_json IS NOT NULL THEN 1 ELSE 0 END as tem_anamnese,
             CASE WHEN p.medidas_json IS NOT NULL THEN 1 ELSE 0 END as tem_medidas,
             CASE WHEN p.imagem_path IS NOT NULL THEN 1 ELSE 0 END as tem_imagem
      FROM prontuario p
      LEFT JOIN paciente pac ON p.paciente_id = pac.id
      WHERE pac.clinica_id = $1
      ORDER BY p.updated_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.clinica_id, parseInt(limit), (page - 1) * limit]);

    const totalRow = await req.db.get(`
      SELECT COUNT(*) as count
      FROM prontuario p
      LEFT JOIN paciente pac ON p.paciente_id = pac.id
      WHERE pac.clinica_id = $1
    `, [req.user.clinica_id]);
    const total = totalRow.count;

    res.json({
      success: true,
      data: prontuarios,
      pagination: {
        current_page: parseInt(page),
        total_items: total,
        items_per_page: parseInt(limit),
        total_pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar prontuários:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
