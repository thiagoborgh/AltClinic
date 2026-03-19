const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const fetch = require('node-fetch');
const { validarCpf, formatarCpf } = require('../utils/validarCpf');
const { verificarDuplicata, buscarPacienteCompleto, listarPacientes } = require('../services/PacienteService');
const storageService = require('../services/storageService');
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/check-permission');
const { checkTenantLimits } = require('../middleware/tenant');
const auditLog = require('../middleware/audit-log');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas imagens são permitidas'), false);
    }
    cb(null, true);
  },
});

// Resolve tenant_id e db: suporta tanto req.tenantId (middleware legado) quanto req.usuario
function resolveTenant(req) {
  if (req.db && req.tenantId) {
    return { db: req.db, tenantId: req.tenantId };
  }
  const pool = require('../database/postgres');
  const { TenantDb } = require('../database/TenantDb');
  const slug = req.usuario?.tenant_slug || req.user?.tenantId;
  const schema = 'clinica_' + (slug || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
  return { db: new TenantDb(pool, schema), tenantId: slug };
}

// ── GET /api/pacientes ───────────────────────────────────────────────────────
router.get('/', authMiddleware, checkPermission('pacientes', 'read'), async (req, res) => {
  try {
    const { db, tenantId } = resolveTenant(req);
    const result = await listarPacientes(db, tenantId, req.query);
    return res.json(result);
  } catch (err) {
    console.error('[pacientes] GET error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// ── GET /api/pacientes/cep/:cep ─────────────────────────────────────────────
// Deve vir ANTES de /:id para não ser capturado como id
router.get('/cep/:cep', authMiddleware, async (req, res) => {
  const cep = req.params.cep.replace(/\D/g, '');
  if (!/^\d{8}$/.test(cep)) {
    return res.status(400).json({ error: 'CEP deve ter 8 dígitos' });
  }
  try {
    const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { timeout: 5000 });
    if (!resp.ok) return res.status(502).json({ error: 'ViaCEP indisponível' });
    const data = await resp.json();
    if (data.erro) return res.status(404).json({ error: 'CEP não encontrado' });
    return res.json({
      cep:        data.cep,
      logradouro: data.logradouro,
      bairro:     data.bairro,
      cidade:     data.localidade,
      estado:     data.uf,
    });
  } catch {
    return res.status(502).json({ error: 'Falha ao consultar ViaCEP' });
  }
});

// ── POST /api/pacientes ──────────────────────────────────────────────────────
router.post(
  '/',
  authMiddleware,
  checkPermission('pacientes', 'create'),
  checkTenantLimits('pacientes'),
  upload.single('foto'),
  async (req, res) => {
    try {
      const { db, tenantId } = resolveTenant(req);
      const {
        nome, cpf, data_nascimento, sexo, telefone, email,
        consentimento_lgpd, dados_clinicos, endereco,
        nome_social, estado_civil, profissao, como_conheceu,
        telefone_fixo, contato_emergencia_nome, contato_emergencia_telefone,
        convenio_id, carteirinha_numero, carteirinha_validade,
        profissional_referencia_id, observacoes,
        responsavel_nome, responsavel_cpf, responsavel_telefone,
      } = req.body;

      if (!nome?.trim() || !cpf || !data_nascimento || !sexo || !telefone) {
        return res.status(400).json({
          error: 'Campos obrigatórios ausentes',
          campos: ['nome', 'cpf', 'data_nascimento', 'sexo', 'telefone'],
        });
      }
      if (consentimento_lgpd !== true && consentimento_lgpd !== 'true') {
        return res.status(400).json({ error: 'Consentimento LGPD é obrigatório para cadastrar o paciente' });
      }
      if (!validarCpf(cpf)) {
        return res.status(422).json({ error: 'CPF inválido', message: 'Verifique os dígitos verificadores' });
      }

      const nascimento = new Date(data_nascimento);
      const idade = new Date().getFullYear() - nascimento.getFullYear();
      if (idade < 18 && !responsavel_nome) {
        return res.status(400).json({ error: 'Responsável legal obrigatório para pacientes menores de 18 anos' });
      }

      const duplicata = await verificarDuplicata(db, tenantId, cpf, nome);
      if (duplicata?.tipo === 'cpf_duplicado') {
        return res.status(409).json({
          error: 'CPF já cadastrado',
          message: 'Este CPF já está vinculado a um paciente desta clínica',
          paciente_id: duplicata.paciente.id,
        });
      }

      let foto_url = null;
      if (req.file) {
        try {
          const webpBuffer = await sharp(req.file.buffer)
            .resize(400, 400, { fit: 'cover', position: 'centre' })
            .webp({ quality: 80 })
            .toBuffer();
          foto_url = await storageService.uploadPacienteFoto(tenantId, webpBuffer, `foto_${Date.now()}.webp`);
        } catch (uploadErr) {
          console.warn('[pacientes] Upload de foto falhou, continuando sem foto:', uploadErr.message);
        }
      }

      const cpfFmt = formatarCpf(cpf);
      const usuarioId = req.usuario?.id || req.user?.id || null;

      const paciente = await db.transaction(async (client) => {
        const { rows } = await client.query(
          `INSERT INTO pacientes (
             tenant_id, nome, cpf, data_nascimento, sexo, nome_social, foto_url,
             estado_civil, profissao, como_conheceu, telefone, telefone_fixo, email,
             contato_emergencia_nome, contato_emergencia_telefone,
             convenio_id, carteirinha_numero, carteirinha_validade,
             profissional_referencia_id, observacoes,
             responsavel_nome, responsavel_cpf, responsavel_telefone,
             consentimento_lgpd, consentimento_lgpd_em, criado_por
           ) VALUES (
             $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
             $16,$17,$18,$19,$20,$21,$22,$23,TRUE,NOW(),$24
           ) RETURNING id`,
          [
            tenantId, nome.trim(), cpfFmt, data_nascimento, sexo,
            nome_social ?? null, foto_url, estado_civil ?? null,
            profissao ?? null, como_conheceu ?? null, telefone,
            telefone_fixo ?? null, email ?? null,
            contato_emergencia_nome ?? null, contato_emergencia_telefone ?? null,
            convenio_id ?? null, carteirinha_numero ?? null, carteirinha_validade ?? null,
            profissional_referencia_id ?? null, observacoes ?? null,
            responsavel_nome ?? null, responsavel_cpf ?? null, responsavel_telefone ?? null,
            usuarioId,
          ]
        );
        const pacienteId = rows[0].id;

        if (dados_clinicos) {
          const dc = typeof dados_clinicos === 'string' ? JSON.parse(dados_clinicos) : dados_clinicos;
          await client.query(
            `INSERT INTO pacientes_dados_clinicos
               (paciente_id, tenant_id, tipo_sanguineo, alergias, medicamentos, condicoes)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [pacienteId, tenantId, dc.tipo_sanguineo ?? null, dc.alergias ?? null,
             dc.medicamentos ?? null, dc.condicoes ?? null]
          );
        }

        if (endereco) {
          const end = typeof endereco === 'string' ? JSON.parse(endereco) : endereco;
          await client.query(
            `INSERT INTO pacientes_enderecos
               (paciente_id, tenant_id, cep, logradouro, numero, complemento, bairro, cidade, estado)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [pacienteId, tenantId, end.cep ?? null, end.logradouro ?? null,
             end.numero ?? null, end.complemento ?? null, end.bairro ?? null,
             end.cidade ?? null, end.estado ?? null]
          );
        }

        return rows[0];
      });

      return res.status(201).json({
        id: paciente.id,
        nome: nome.trim(),
        cpf: cpfFmt,
        message: 'Paciente cadastrado com sucesso',
        ...(duplicata?.tipo === 'nome_similar' && { aviso_duplicata: duplicata.pacientes }),
      });
    } catch (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Foto excede o limite de 5MB' });
      }
      console.error('[pacientes] POST error:', err);
      return res.status(500).json({ error: 'Erro interno' });
    }
  }
);

// ── GET /api/pacientes/:id ───────────────────────────────────────────────────
router.get('/:id', authMiddleware, checkPermission('pacientes', 'read'), auditLog('paciente', 'read'), async (req, res) => {
  try {
    const { db, tenantId } = resolveTenant(req);
    const perfil = req.usuario?.perfil || req.user?.role;
    const paciente = await buscarPacienteCompleto(db, tenantId, req.params.id, perfil);
    if (!paciente) return res.status(404).json({ error: 'Paciente não encontrado' });
    return res.json(paciente);
  } catch (err) {
    console.error('[pacientes] GET /:id error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// ── PUT /api/pacientes/:id ───────────────────────────────────────────────────
router.put(
  '/:id',
  authMiddleware,
  checkPermission('pacientes', 'update'),
  upload.single('foto'),
  async (req, res) => {
    try {
      const { db, tenantId } = resolveTenant(req);
      const { id } = req.params;

      const existente = await db.get(
        'SELECT id FROM pacientes WHERE id = $1 AND tenant_id = $2',
        [id, tenantId]
      );
      if (!existente) return res.status(404).json({ error: 'Paciente não encontrado' });

      const {
        nome, cpf, data_nascimento, sexo, telefone, email,
        nome_social, estado_civil, profissao, como_conheceu,
        telefone_fixo, contato_emergencia_nome, contato_emergencia_telefone,
        convenio_id, carteirinha_numero, carteirinha_validade,
        profissional_referencia_id, observacoes,
        responsavel_nome, responsavel_cpf, responsavel_telefone,
        dados_clinicos, endereco,
      } = req.body;

      if (cpf && !validarCpf(cpf)) {
        return res.status(422).json({ error: 'CPF inválido' });
      }
      if (cpf) {
        const dup = await verificarDuplicata(db, tenantId, cpf, nome || '', id);
        if (dup?.tipo === 'cpf_duplicado') {
          return res.status(409).json({ error: 'CPF já cadastrado em outro paciente', paciente_id: dup.paciente.id });
        }
      }

      let foto_url;
      if (req.file) {
        try {
          const webpBuffer = await sharp(req.file.buffer)
            .resize(400, 400, { fit: 'cover', position: 'centre' })
            .webp({ quality: 80 })
            .toBuffer();
          foto_url = await storageService.uploadPacienteFoto(tenantId, webpBuffer, `foto_${Date.now()}.webp`);
        } catch (e) {
          console.warn('[pacientes] Upload de foto falhou:', e.message);
        }
      }

      const sets = [];
      const params = [];
      const addField = (col, val) => { params.push(val); sets.push(`${col} = $${params.length}`); };

      if (nome)           addField('nome', nome.trim());
      if (cpf)            addField('cpf', formatarCpf(cpf));
      if (data_nascimento) addField('data_nascimento', data_nascimento);
      if (sexo)           addField('sexo', sexo);
      if (telefone)       addField('telefone', telefone);
      if (email !== undefined) addField('email', email);
      if (nome_social !== undefined) addField('nome_social', nome_social);
      if (estado_civil !== undefined) addField('estado_civil', estado_civil);
      if (profissao !== undefined) addField('profissao', profissao);
      if (como_conheceu !== undefined) addField('como_conheceu', como_conheceu);
      if (telefone_fixo !== undefined) addField('telefone_fixo', telefone_fixo);
      if (contato_emergencia_nome !== undefined) addField('contato_emergencia_nome', contato_emergencia_nome);
      if (contato_emergencia_telefone !== undefined) addField('contato_emergencia_telefone', contato_emergencia_telefone);
      if (convenio_id !== undefined) addField('convenio_id', convenio_id);
      if (carteirinha_numero !== undefined) addField('carteirinha_numero', carteirinha_numero);
      if (carteirinha_validade !== undefined) addField('carteirinha_validade', carteirinha_validade);
      if (profissional_referencia_id !== undefined) addField('profissional_referencia_id', profissional_referencia_id);
      if (observacoes !== undefined) addField('observacoes', observacoes);
      if (responsavel_nome !== undefined) addField('responsavel_nome', responsavel_nome);
      if (responsavel_cpf !== undefined) addField('responsavel_cpf', responsavel_cpf);
      if (responsavel_telefone !== undefined) addField('responsavel_telefone', responsavel_telefone);
      if (foto_url) addField('foto_url', foto_url);

      if (sets.length > 0) {
        params.push(id, tenantId);
        await db.query(
          `UPDATE pacientes SET ${sets.join(', ')}, atualizado_em = NOW()
           WHERE id = $${params.length - 1} AND tenant_id = $${params.length}`,
          params
        );
      }

      if (dados_clinicos) {
        const dc = typeof dados_clinicos === 'string' ? JSON.parse(dados_clinicos) : dados_clinicos;
        await db.query(
          `INSERT INTO pacientes_dados_clinicos (paciente_id, tenant_id, tipo_sanguineo, alergias, medicamentos, condicoes)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (paciente_id) DO UPDATE
           SET tipo_sanguineo=$3, alergias=$4, medicamentos=$5, condicoes=$6, atualizado_em=NOW()`,
          [id, tenantId, dc.tipo_sanguineo ?? null, dc.alergias ?? null, dc.medicamentos ?? null, dc.condicoes ?? null]
        );
      }

      if (endereco) {
        const end = typeof endereco === 'string' ? JSON.parse(endereco) : endereco;
        await db.query(
          `INSERT INTO pacientes_enderecos (paciente_id, tenant_id, cep, logradouro, numero, complemento, bairro, cidade, estado)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (paciente_id) DO UPDATE
           SET cep=$3, logradouro=$4, numero=$5, complemento=$6, bairro=$7, cidade=$8, estado=$9, atualizado_em=NOW()`,
          [id, tenantId, end.cep ?? null, end.logradouro ?? null, end.numero ?? null,
           end.complemento ?? null, end.bairro ?? null, end.cidade ?? null, end.estado ?? null]
        );
      }

      const perfil = req.usuario?.perfil || req.user?.role;
      const atualizado = await buscarPacienteCompleto(db, tenantId, id, perfil);
      return res.json(atualizado);
    } catch (err) {
      console.error('[pacientes] PUT error:', err);
      return res.status(500).json({ error: 'Erro interno' });
    }
  }
);

// ── PATCH /api/pacientes/:id/inativar ───────────────────────────────────────
router.patch('/:id/inativar', authMiddleware, checkPermission('pacientes', 'update'), async (req, res) => {
  try {
    const { db, tenantId } = resolveTenant(req);
    const { id } = req.params;

    const paciente = await db.get(
      'SELECT id FROM pacientes WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    if (!paciente) return res.status(404).json({ error: 'Paciente não encontrado' });

    await db.run(
      "UPDATE pacientes SET status = 'inativo', atualizado_em = NOW() WHERE id = $1 AND tenant_id = $2",
      [id, tenantId]
    );

    return res.json({ id, status: 'inativo', message: 'Paciente inativado com sucesso' });
  } catch (err) {
    console.error('[pacientes] PATCH inativar error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
