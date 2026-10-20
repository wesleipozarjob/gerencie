/**
 * Utilitários para processamento e compressão de imagens
 * Converte imagens para formato WebP/JPEG em Base64 compacto (binário codificado)
 * reduzindo fotos pesadas para ~10-25KB antes de gravar no banco Supabase.
 */

export const compressImage = (file, { maxWidth = 320, maxHeight = 320, quality = 0.82 } = {}) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      reject(new Error('O arquivo selecionado não é uma imagem válida.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem.'));
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Erro ao carregar a imagem para processamento.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Manter proporção limitando largura e altura máximas
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // Suavização de alta qualidade
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Tenta exportar em WebP (máxima compressão com excelente nitidez)
        let compressedDataUrl = canvas.toDataURL('image/webp', quality);

        // Fallback para JPEG se o navegador não suportar WebP no canvas
        if (!compressedDataUrl.startsWith('data:image/webp')) {
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(compressedDataUrl);
      };
      img.src = readerEvent.target.result;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Conversão entre Data URL (usada no navegador) e BYTEA (binário puro no Postgres).
 * O PostgREST/Supabase troca BYTEA como string hexadecimal no formato "\x89504e47...".
 * No banco, a imagem fica gravada como bytes crus (~25% menor que Base64 em TEXT).
 */

// Data URL (data:image/webp;base64,....) -> "\x...." para gravar em coluna BYTEA
export const toDbLogo = (dataUrl) => {
  if (!dataUrl) return null;
  if (!dataUrl.startsWith('data:')) return dataUrl; // já está em hex
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  let hex = '';
  for (let i = 0; i < binary.length; i++) {
    hex += binary.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return '\\x' + hex;
};

// Detecta o tipo da imagem pelos primeiros bytes (assinatura do arquivo)
const detectMime = (bytes) => {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'image/webp';
  return 'image/webp';
};

// "\x...." vindo do BYTEA -> Data URL para exibir no <img>
export const fromDbLogo = (value) => {
  if (!value || typeof value !== 'string') return null;
  if (value.startsWith('data:')) return value; // compatibilidade com dados antigos em TEXT
  const hex = value.startsWith('\\x') ? value.slice(2) : value;
  if (!hex || hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${detectMime(bytes)};base64,${btoa(binary)}`;
};
