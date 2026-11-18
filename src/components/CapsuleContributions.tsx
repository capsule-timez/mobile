import { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useImageSelection } from '../hooks/useImageSelection';
import { contributeToCapsule, getApiErrorDetails } from '../services/capsules';
import { colors, fonts, strokeThin } from '../theme/tokens';
import type { Capsule, CapsuleContribution, CapsuleFile } from '../types/capsule';
import { isContributionOpen } from '../utils/capsuleGroup';
import { CONTRIBUTION_TEXT_MAX_LENGTH, validateContributionText } from '../utils/capsuleValidation';
import { formatDateTime } from '../utils/formatDate';
import { MAX_IMAGES_PER_CONTRIBUTION } from '../utils/imageValidation';
import { Button } from './Button';
import { Card } from './Card';
import { FormField } from './FormField';
import { ImagePickerField } from './ImagePickerField';
import { useToast } from './Toast';

interface CapsuleContributionsProps {
  capsule: Pick<Capsule, 'id' | 'status' | 'contributionDeadline' | 'contributions'>;
  onContributed: () => Promise<void>;
}

/** Contribuições da cápsula em grupo: todas ficam visíveis aos participantes e não podem ser alteradas. */
export function CapsuleContributions({ capsule, onContributed }: CapsuleContributionsProps) {
  const toast = useToast();
  const images = useImageSelection(MAX_IMAGES_PER_CONTRIBUTION);
  const [text, setText] = useState('');
  const [textError, setTextError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  const contributions = capsule.contributions ?? [];
  const isOpen = !deadlinePassed && isContributionOpen(capsule);

  async function submit() {
    if (submitting) return;
    const error = validateContributionText(text, images.items.length);
    setTextError(error);
    if (error) return;

    setSubmitting(true);
    try {
      await contributeToCapsule(capsule.id, {
        text: text.trim() || undefined,
        images: images.items.map((item) => item.image),
      });
      setText('');
      images.reset();
      toast.success('Contribuição enviada!');
      await onContributed();
    } catch (failure) {
      const details = getApiErrorDetails(failure);
      if (details.code === 'CONTRIBUTION_DEADLINE_PASSED') setDeadlinePassed(true);
      setTextError(details.fieldErrors.text);
      toast.error('Não foi possível enviar a contribuição', { description: details.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.heading} accessibilityRole="header">Contribuições</Text>
      {contributions.length === 0
        ? <Text style={styles.body}>Ninguém contribuiu ainda.</Text>
        : <View style={styles.list}>{contributions.map((item) => <ContributionItem key={item.id} contribution={item} />)}</View>}

      {isOpen ? (
        <View style={styles.form}>
          <Text style={styles.subheading} accessibilityRole="header">Nova contribuição</Text>
          <Text style={styles.hint}>
            Envie um texto, até {MAX_IMAGES_PER_CONTRIBUTION} imagens ou os dois. Você pode contribuir mais de uma vez
            até o prazo, e cada contribuição fica visível para os participantes e não pode ser alterada depois de enviada.
          </Text>
          <FormField
            label="Sua mensagem (opcional com imagens)"
            counter={`${text.length.toLocaleString('pt-BR')}/${CONTRIBUTION_TEXT_MAX_LENGTH.toLocaleString('pt-BR')}`}
            value={text}
            onChangeText={(value) => { setText(value); setTextError(undefined); }}
            maxLength={CONTRIBUTION_TEXT_MAX_LENGTH}
            multiline
            error={textError}
            editable={!submitting}
          />
          <ImagePickerField
            items={images.items}
            maxFiles={images.maxFiles}
            remaining={images.remaining}
            disabled={submitting}
            onAdd={(picked) => { setTextError(undefined); return images.add(picked); }}
            onRemove={images.remove}
          />
          <Button icon="send" loading={submitting} onPress={() => void submit()}>Enviar contribuição</Button>
        </View>
      ) : (
        <Text style={styles.hint}>O prazo para contribuições desta cápsula terminou.</Text>
      )}
    </Card>
  );
}

function ContributionItem({ contribution }: { contribution: CapsuleContribution }) {
  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.author}>{contribution.author.name}</Text>
        <Text style={styles.date}>{formatDateTime(contribution.createdAt)}</Text>
      </View>
      {contribution.text && <Text style={styles.text} selectable>{contribution.text}</Text>}
      {contribution.files.length > 0 && (
        <View style={styles.gallery}>
          {contribution.files.map((file) => <ContributionImage key={file.id} file={file} />)}
        </View>
      )}
    </View>
  );
}

function ContributionImage({ file }: { file: CapsuleFile }) {
  const [failed, setFailed] = useState(false);
  if (!file.downloadUrl || failed) {
    return <Text style={styles.date}>{file.fileName}</Text>;
  }
  const url = file.downloadUrl;
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={`Abrir ${file.fileName}`} onPress={() => void Linking.openURL(url)}>
      <Image
        source={{ uri: url }}
        style={styles.image}
        resizeMode="cover"
        accessibilityLabel={file.fileName}
        accessibilityIgnoresInvertColors
        onError={() => setFailed(true)}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  heading: { color: colors.ink, fontFamily: fonts.display, fontSize: 22, lineHeight: 26, textTransform: 'uppercase' },
  subheading: { color: colors.ink, fontFamily: fonts.display, fontSize: 18 },
  body: { color: colors.ink, fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 24 },
  hint: { color: colors.ink, fontFamily: fonts.bodyMedium, fontSize: 14.5, lineHeight: 21 },
  list: { gap: 16 },
  item: { gap: 8, paddingTop: 12, borderTopWidth: strokeThin, borderTopColor: colors.ink },
  itemHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  author: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 16 },
  date: { color: colors.muted, fontFamily: fonts.bodyMedium, fontSize: 13.6 },
  text: { color: colors.ink, fontFamily: fonts.body, fontSize: 16, lineHeight: 25 },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  image: { width: 96, height: 96, borderWidth: strokeThin, borderColor: colors.ink, backgroundColor: colors.paper },
  form: { gap: 12, paddingTop: 16, borderTopWidth: strokeThin, borderTopColor: colors.ink },
});
