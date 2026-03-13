// src/middleware/prontuarioRoles.js
const ROLES_PRONTUARIO = {
  ver:             ['owner', 'admin_clinica', 'medico', 'tecnico'],
  escrever:        ['owner', 'admin_clinica', 'medico', 'tecnico'],
  assinar:         ['owner', 'admin_clinica', 'medico'],
  prescricoes:     ['owner', 'admin_clinica', 'medico'],
  gerir_templates: ['owner', 'admin_clinica', 'medico'],
};

function requireProntuarioRole(permissao) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    const allowed = ROLES_PRONTUARIO[permissao] || [];
    if (!allowed.includes(role)) {
      return res.status(403).json({
        error: 'ACESSO_NEGADO',
        message: `Permissão '${permissao}' requer role: ${allowed.join(', ')}`
      });
    }
    next();
  };
}

module.exports = { requireProntuarioRole };
