const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/check-permission');
const { upload } = require('../middleware/upload-profissional');
const ProfissionalController = require('../controllers/profissional-controller');

router.use(authMiddleware);

router.get('/',
  checkPermission('profissionais', 'read'),
  ProfissionalController.listar
);

router.get('/:id/produtividade',
  checkPermission('profissionais', 'read'),
  ProfissionalController.produtividade
);

router.get('/:id',
  checkPermission('profissionais', 'read'),
  ProfissionalController.buscarPorId
);

router.post('/',
  checkPermission('profissionais', 'create'),
  upload.fields([
    { name: 'foto', maxCount: 1 },
    { name: 'assinatura', maxCount: 1 },
    { name: 'carimbo', maxCount: 1 },
  ]),
  ProfissionalController.criar
);

router.put('/:id',
  checkPermission('profissionais', 'update'),
  upload.fields([
    { name: 'foto', maxCount: 1 },
    { name: 'assinatura', maxCount: 1 },
    { name: 'carimbo', maxCount: 1 },
  ]),
  ProfissionalController.atualizar
);

router.patch('/:id/status',
  checkPermission('profissionais', 'update'),
  ProfissionalController.atualizarStatus
);

router.delete('/:id',
  checkPermission('profissionais', 'delete'),
  ProfissionalController.desativar
);

router.put('/:id/disponibilidade',
  checkPermission('profissionais', 'update'),
  ProfissionalController.atualizarDisponibilidade
);

router.post('/:id/bloqueios',
  checkPermission('profissionais', 'update'),
  ProfissionalController.criarBloqueio
);

router.delete('/:id/bloqueios/:bloqueioId',
  checkPermission('profissionais', 'update'),
  ProfissionalController.removerBloqueio
);

module.exports = router;
