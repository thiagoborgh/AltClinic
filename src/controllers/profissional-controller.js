const profissionalService = require('../services/profissional-service');
const { processarFoto, processarAssinatura } = require('../middleware/upload-profissional');

function getTenantSlug(req) {
  return req.usuario?.tenant_slug || req.user?.tenantId || req.tenantId;
}

async function listar(req, res) {
  try {
    const result = await profissionalService.listar(getTenantSlug(req), req.query);
    return res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[profissional] listar error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

async function buscarPorId(req, res) {
  try {
    const tenantSlug = getTenantSlug(req);
    const { id } = req.params;
    const perfil = req.usuario?.perfil || req.user?.role;
    const usuarioId = req.usuario?.id || req.user?.id;

    const profissional = await profissionalService.buscarPorId(tenantSlug, id);
    if (!profissional) return res.status(404).json({ error: 'Profissional não encontrado' });

    // Médico só pode ver seu próprio perfil
    if (perfil === 'medico' && String(profissional.usuario_id) !== String(usuarioId)) {
      return res.status(403).json({ error: 'Sem permissão para ver este profissional' });
    }

    return res.json({ data: profissional });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[profissional] buscarPorId error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

async function criar(req, res) {
  try {
    const tenantSlug = getTenantSlug(req);
    const dados = { ...req.body };

    // Parsear campos JSON enviados como string (multipart/form-data)
    for (const campo of ['especialidades', 'procedimentos', 'disponibilidade']) {
      if (typeof dados[campo] === 'string') {
        try { dados[campo] = JSON.parse(dados[campo]); } catch (_) { dados[campo] = []; }
      }
    }

    // Processar uploads
    let fotoUrl = null;
    let assinaturaUrl = null;
    let carimboUrl = null;
    const timestamp = Date.now();

    if (req.files?.foto?.[0]) {
      fotoUrl = await processarFoto(req.files.foto[0].buffer, tenantSlug, timestamp).catch(() => null);
    }
    if (req.files?.assinatura?.[0]) {
      assinaturaUrl = await processarAssinatura(req.files.assinatura[0].buffer, tenantSlug, timestamp).catch(() => null);
    }
    if (req.files?.carimbo?.[0]) {
      carimboUrl = await processarAssinatura(req.files.carimbo[0].buffer, tenantSlug, `carimbo_${timestamp}`).catch(() => null);
    }

    const profissional = await profissionalService.criar(tenantSlug, dados, fotoUrl);
    if (carimboUrl || assinaturaUrl) {
      // Atualizar com carimbo/assinatura após criação
      await profissionalService.atualizar(tenantSlug, profissional.id, {}, null, assinaturaUrl, carimboUrl);
    }

    return res.status(201).json({ data: profissional, message: 'Profissional cadastrado com sucesso' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[profissional] criar error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

async function atualizar(req, res) {
  try {
    const tenantSlug = getTenantSlug(req);
    const { id } = req.params;
    const dados = { ...req.body };
    const timestamp = Date.now();

    let fotoUrl = null;
    let assinaturaUrl = null;
    let carimboUrl = null;

    if (req.files?.foto?.[0]) {
      fotoUrl = await processarFoto(req.files.foto[0].buffer, tenantSlug, timestamp).catch(() => null);
    }
    if (req.files?.assinatura?.[0]) {
      assinaturaUrl = await processarAssinatura(req.files.assinatura[0].buffer, tenantSlug, timestamp).catch(() => null);
    }
    if (req.files?.carimbo?.[0]) {
      carimboUrl = await processarAssinatura(req.files.carimbo[0].buffer, tenantSlug, `carimbo_${timestamp}`).catch(() => null);
    }

    const profissional = await profissionalService.atualizar(tenantSlug, id, dados, fotoUrl, assinaturaUrl, carimboUrl);
    return res.json({ data: profissional, message: 'Profissional atualizado com sucesso' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[profissional] atualizar error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

async function atualizarStatus(req, res) {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status é obrigatório' });
    await profissionalService.atualizarStatus(getTenantSlug(req), req.params.id, status);
    return res.json({ message: 'Status atualizado' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[profissional] atualizarStatus error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

async function desativar(req, res) {
  try {
    await profissionalService.atualizarStatus(getTenantSlug(req), req.params.id, 'inativo');
    return res.json({ message: 'Profissional desativado' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[profissional] desativar error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

async function atualizarDisponibilidade(req, res) {
  try {
    const { disponibilidade } = req.body;
    if (!Array.isArray(disponibilidade)) {
      return res.status(400).json({ error: 'disponibilidade deve ser um array' });
    }
    await profissionalService.atualizarDisponibilidade(getTenantSlug(req), req.params.id, disponibilidade);
    return res.json({ message: 'Disponibilidade atualizada' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[profissional] atualizarDisponibilidade error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

async function criarBloqueio(req, res) {
  try {
    const { data_inicio, data_fim } = req.body;
    if (!data_inicio || !data_fim) {
      return res.status(400).json({ error: 'data_inicio e data_fim são obrigatórios' });
    }
    const bloqueio = await profissionalService.criarBloqueio(getTenantSlug(req), req.params.id, req.body);
    return res.status(201).json({ data: bloqueio });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[profissional] criarBloqueio error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

async function removerBloqueio(req, res) {
  try {
    await profissionalService.removerBloqueio(getTenantSlug(req), req.params.id, req.params.bloqueioId);
    return res.json({ message: 'Bloqueio removido' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[profissional] removerBloqueio error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

async function produtividade(req, res) {
  try {
    const now = new Date();
    const mes = parseInt(req.query.mes) || (now.getMonth() + 1);
    const ano = parseInt(req.query.ano) || now.getFullYear();
    const perfil = req.usuario?.perfil || req.user?.role;
    const usuarioId = req.usuario?.id || req.user?.id;

    if (perfil === 'medico') {
      const prof = await profissionalService.buscarPorId(getTenantSlug(req), req.params.id);
      if (!prof || String(prof.usuario_id) !== String(usuarioId)) {
        return res.status(403).json({ error: 'Sem permissão' });
      }
    }

    const data = await profissionalService.calcularProdutividade(getTenantSlug(req), req.params.id, mes, ano);
    return res.json({ data });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[profissional] produtividade error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

module.exports = {
  listar, buscarPorId, criar, atualizar, atualizarStatus, desativar,
  atualizarDisponibilidade, criarBloqueio, removerBloqueio, produtividade,
};
