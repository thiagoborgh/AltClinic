const multer = require('multer');
const sharp = require('sharp');
const storageService = require('../services/storageService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return cb(new Error('Apenas imagens JPEG, PNG e WebP são aceitas'));
    }
    cb(null, true);
  },
});

async function processarFoto(buffer, tenantId, filename) {
  const webp = await sharp(buffer)
    .resize(512, 512, { fit: 'cover', position: 'center' })
    .webp({ quality: 85 })
    .toBuffer();
  return storageService.uploadPacienteFoto(tenantId, webp, `profissional_foto_${filename}.webp`);
}

async function processarAssinatura(buffer, tenantId, filename) {
  const png = await sharp(buffer)
    .resize(800, 200, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();
  return storageService.uploadPacienteFoto(tenantId, png, `profissional_assinatura_${filename}.png`);
}

module.exports = { upload, processarFoto, processarAssinatura };
