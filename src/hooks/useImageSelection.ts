import { useCallback, useRef, useState } from 'react';
import { getApiErrorDetails, uploadCapsuleFile } from '../services/capsules';
import { MAX_IMAGES_PER_CAPSULE, validateImage, type PickedImage } from '../utils/imageValidation';

export type ImageStatus = 'pending' | 'uploading' | 'error';

export interface SelectedImage {
  key: string;
  image: PickedImage;
  status: ImageStatus;
  error?: string;
}

export interface UploadResult {
  sent: number;
  /** Nomes das imagens que não foram enviadas, para avisar o usuário. */
  failed: string[];
}

/**
 * Controla as imagens escolhidas para uma cápsula: valida ao adicionar e envia
 * uma a uma. Imagens enviadas com sucesso saem da lista; as que falharam ficam,
 * com o erro da API.
 */
export function useImageSelection(maxFiles = MAX_IMAGES_PER_CAPSULE) {
  const [items, setItems] = useState<SelectedImage[]>([]);
  const itemsRef = useRef<SelectedImage[]>([]);
  const nextKey = useRef(0);

  const commit = useCallback((next: SelectedImage[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  /** Adiciona as imagens válidas e devolve as mensagens das recusadas. */
  const add = useCallback(
    (images: PickedImage[]): string[] => {
      const accepted: SelectedImage[] = [];
      const rejections: string[] = [];
      let slots = maxFiles - itemsRef.current.length;

      for (const image of images) {
        const problem = validateImage(image);
        if (problem) {
          rejections.push(problem);
        } else if (slots <= 0) {
          rejections.push(`“${image.name}” não foi adicionada: o limite é de ${maxFiles} imagens por cápsula.`);
        } else {
          slots -= 1;
          accepted.push({ key: String(nextKey.current++), image, status: 'pending' });
        }
      }

      if (accepted.length > 0) commit([...itemsRef.current, ...accepted]);
      return rejections;
    },
    [maxFiles, commit],
  );

  const remove = useCallback(
    (key: string) => commit(itemsRef.current.filter((item) => item.key !== key)),
    [commit],
  );

  const reset = useCallback(() => commit([]), [commit]);

  const patch = useCallback(
    (key: string, changes: Partial<SelectedImage>) => {
      commit(itemsRef.current.map((item) => (item.key === key ? { ...item, ...changes } : item)));
    },
    [commit],
  );

  /** Envia as imagens da lista em sequência (a API aceita um arquivo por requisição). */
  const upload = useCallback(
    async (capsuleId: string): Promise<UploadResult> => {
      let sent = 0;
      const failed: string[] = [];
      for (const { key, image } of [...itemsRef.current]) {
        patch(key, { status: 'uploading', error: undefined });
        try {
          await uploadCapsuleFile(capsuleId, image);
          commit(itemsRef.current.filter((item) => item.key !== key));
          sent += 1;
        } catch (error) {
          patch(key, { status: 'error', error: getApiErrorDetails(error).message });
          failed.push(image.name);
        }
      }
      return { sent, failed };
    },
    [commit, patch],
  );

  return { items, remaining: maxFiles - items.length, maxFiles, add, remove, reset, upload };
}
