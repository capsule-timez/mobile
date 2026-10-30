// Limites espelhados do contrato da API (backend src/lib/upload.ts e capsule.service.ts).
export const MAX_IMAGES_PER_CAPSULE = 5;
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const TYPES_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/** Imagem escolhida no aparelho, no formato que o upload multipart do React Native espera. */
export interface PickedImage {
  uri: string;
  name: string;
  type: string;
  /** Alguns aparelhos não informam o tamanho; nesse caso quem valida é a API. */
  size?: number;
}

/** Subconjunto do ImagePickerAsset do expo-image-picker usado aqui. */
export interface PickerAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
}

/** Normaliza o asset do picker: completa nome e tipo a partir da URI quando o aparelho não informa. */
export function toPickedImage(asset: PickerAsset): PickedImage {
  const fromUri = decodeURIComponent(asset.uri.split(/[?#]/)[0].split('/').pop() ?? '');
  const name = asset.fileName || fromUri || 'imagem';
  const extension = name.split('.').pop()?.toLowerCase() ?? '';
  return {
    uri: asset.uri,
    name,
    type: asset.mimeType || TYPES_BY_EXTENSION[extension] || 'application/octet-stream',
    ...(typeof asset.fileSize === 'number' ? { size: asset.fileSize } : {}),
  };
}

/** Valida tipo e tamanho antes de enviar; devolve a mensagem de erro ou `null`. */
export function validateImage(image: PickedImage): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
    return `“${image.name}” não é um tipo aceito. Use JPEG, PNG ou WebP.`;
  }
  if (image.size !== undefined && image.size > MAX_IMAGE_SIZE_BYTES) {
    return `“${image.name}” excede o limite de 10 MB.`;
  }
  if (image.size === 0) {
    return `“${image.name}” está vazio.`;
  }
  return null;
}
