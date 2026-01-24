// Utilitários para compressão de imagens
export const imageUtils = {
  // Comprime imagem mantendo qualidade aceitável
  compressImage: async (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Desenhar e comprimir
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Criar novo arquivo com o blob comprimido
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Falha na compressão'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = URL.createObjectURL(file);
    });
  },

  // Valida tamanho do arquivo (max 200KB)
  validateImageSize: (file, maxSizeKB = 200) => {
    const maxSizeBytes = maxSizeKB * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`Imagem muito grande. Máximo ${maxSizeKB}KB permitido.`);
    }
    return true;
  },

  // Processa imagem completa (validação + compressão)
  processImage: async (file, options = {}) => {
    const {
      maxWidth = 800,
      maxHeight = 800,
      quality = 0.8,
      maxSizeKB = 200
    } = options;

    // Validar tamanho original
    imageUtils.validateImageSize(file, maxSizeKB);

    // Se já é pequena, retorna original
    if (file.size <= maxSizeKB * 1024 * 0.8) {
      return file;
    }

    // Comprimir
    try {
      const compressed = await imageUtils.compressImage(file, maxWidth, maxHeight, quality);

      // Validar tamanho após compressão
      imageUtils.validateImageSize(compressed, maxSizeKB);

      return compressed;
    } catch (error) {
      // Se compressão falhar, tenta com qualidade menor
      if (quality > 0.5) {
        return imageUtils.processImage(file, { ...options, quality: quality - 0.2 });
      }
      throw error;
    }
  },

  // Converte bytes para formato legível
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

export default imageUtils;