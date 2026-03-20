/**
 * detectarImpersonacao — middleware que detecta sessões de impersonação
 * e aplica restrições em operações destrutivas sobre configurações.
 */
function detectarImpersonacao(req, res, next) {
  const usuario = req.usuario || req.user;
  const isImpersonando = usuario?.impersonando === true;

  if (isImpersonando) {
    req.isImpersonando = true;

    // Bloquear DELETE e PATCH em rotas de configurações
    const rota = req.path || '';
    const isConfiguracoes = rota.includes('/configuracoes');

    if (isConfiguracoes && (req.method === 'DELETE' || req.method === 'PATCH')) {
      return res.status(403).json({
        error: 'Operação não permitida durante impersonação',
        motivo: 'DELETE e PATCH em /configuracoes são bloqueados para sessões de impersonação'
      });
    }
  } else {
    req.isImpersonando = false;
  }

  next();
}

module.exports = detectarImpersonacao;
