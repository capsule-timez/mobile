import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { SelectedImage } from '../hooks/useImageSelection';
import { colors, fonts, strokeThin } from '../theme/tokens';
import { toPickedImage, type PickedImage } from '../utils/imageValidation';
import { Button } from './Button';
import { Icon } from './Icon';
import { Spinner } from './Spinner';
import { useToast } from './Toast';

interface ImagePickerFieldProps {
  items: SelectedImage[];
  maxFiles: number;
  remaining: number;
  disabled?: boolean;
  onAdd: (images: PickedImage[]) => string[];
  onRemove: (key: string) => void;
}

export function ImagePickerField({ items, maxFiles, remaining, disabled = false, onAdd, onRemove }: ImagePickerFieldProps) {
  const toast = useToast();

  async function pick() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        // No iOS, converte HEIC para JPEG, que a API aceita.
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      if (result.canceled) return;
      const rejections = onAdd(result.assets.map(toPickedImage));
      if (rejections.length === 1) toast.error('Imagem recusada', { description: rejections[0] });
      else if (rejections.length > 1) toast.error(`${rejections.length} imagens recusadas`, { description: rejections.join('\n') });
    } catch {
      toast.error('Não foi possível abrir a galeria', { description: 'Verifique a permissão de acesso às fotos.' });
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>JPEG, PNG ou WebP, até 10 MB cada. {items.length}/{maxFiles}</Text>

      {items.length > 0 && (
        <View style={styles.grid}>
          {items.map((item) => (
            <View key={item.key} style={styles.thumb}>
              <Image
                source={{ uri: item.image.uri }}
                style={styles.image}
                resizeMode="cover"
                accessibilityLabel={item.image.name}
                accessibilityIgnoresInvertColors
              />
              {item.status === 'uploading' && (
                <View style={styles.overlay}><Spinner color={colors.surface} /></View>
              )}
              {item.status === 'error' && (
                <View style={[styles.overlay, styles.overlayError]}><Icon name="alert" size={20} color={colors.surface} /></View>
              )}
              {!disabled && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remover ${item.image.name}`}
                  hitSlop={8}
                  onPress={() => onRemove(item.key)}
                  style={styles.remove}
                >
                  <Icon name="close" size={14} color={colors.surface} />
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}

      {remaining > 0 && (
        <Button variant="secondary" size="sm" icon="plus" disabled={disabled} onPress={() => void pick()}>
          Adicionar imagens
        </Button>
      )}
    </View>
  );
}

const THUMB_SIZE = 88;

const styles = StyleSheet.create({
  container: { gap: 12, alignItems: 'flex-start' },
  hint: { color: colors.muted, fontFamily: fonts.bodyMedium, fontSize: 13.6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderWidth: strokeThin, borderColor: colors.ink, backgroundColor: colors.paper },
  image: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(31, 19, 11, 0.55)' },
  overlayError: { backgroundColor: 'rgba(232, 80, 63, 0.75)' },
  remove: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: strokeThin,
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
});
