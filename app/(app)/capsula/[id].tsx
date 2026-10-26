import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../../../src/components/AppShell';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { CapsuleStatusBadge } from '../../../src/components/CapsuleCard';
import { EmptyState } from '../../../src/components/EmptyState';
import { Icon } from '../../../src/components/Icon';
import { PageHeader } from '../../../src/components/PageHeader';
import { PopIn } from '../../../src/components/PopIn';
import { Skeleton } from '../../../src/components/Skeleton';
import { useToast } from '../../../src/components/Toast';
import { getApiErrorDetails, getCapsule } from '../../../src/services/capsules';
import { HttpError } from '../../../src/services/http';
import { colors, contentMaxWidth, fonts, stroke, strokeThin } from '../../../src/theme/tokens';
import type { Capsule, CapsuleFile } from '../../../src/types/capsule';
import { formatDateTime } from '../../../src/utils/formatDate';

type LoadState =
  | { status: 'loading' }
  | { status: 'success'; capsule: Capsule }
  | { status: 'not-found' }
  | { status: 'error'; message: string };

const sizeFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export default function CapsulaDetalheScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  return <CapsulaDetalhe key={id} id={id} />;
}

function CapsulaDetalhe({ id }: { id: string }) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const capsule = await getCapsule(id, signal);
      if (!signal?.aborted) setState({ status: 'success', capsule });
    } catch (error) {
      if (signal?.aborted) return;
      if (error instanceof HttpError && error.status === 404) {
        setState({ status: 'not-found' });
      } else {
        const message = getApiErrorDetails(error).message;
        setState((current) => (current.status === 'success' ? current : { status: 'error', message }));
      }
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      void load(controller.signal);
      return () => controller.abort();
    }, [load]),
  );

  function retry() {
    setState({ status: 'loading' });
    void load();
  }

  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Button variant="ghost" size="sm" onPress={() => router.navigate('/')}>Voltar para cápsulas</Button>

        {state.status === 'loading' && <DetailSkeleton />}
        {state.status === 'not-found' && (
          <EmptyState
            icon="alert"
            title="Cápsula não encontrada"
            description="Ela pode ter sido excluída ou pertencer a outra conta."
          />
        )}
        {state.status === 'error' && (
          <EmptyState
            icon="alert"
            title="Não foi possível carregar a cápsula"
            description={state.message}
            action={<Button variant="secondary" onPress={retry}>Tentar novamente</Button>}
          />
        )}
        {state.status === 'success' && <CapsuleDetail capsule={state.capsule} />}
      </ScrollView>
    </AppShell>
  );
}

function CapsuleDetail({ capsule }: { capsule: Capsule }) {
  return (
    <PopIn style={styles.sections}>
      <PageHeader title={capsule.title} />

      <Card style={styles.card}>
        <View style={styles.meta}>
          <MetaItem label="Destinatário">
            <Text style={styles.metaValue}>{capsule.recipientEmail}</Text>
          </MetaItem>
          <MetaItem label="Data de entrega">
            <Text style={styles.metaValue}>{formatDateTime(capsule.scheduleDate)}</Text>
          </MetaItem>
          <MetaItem label="Status">
            <CapsuleStatusBadge status={capsule.status} />
          </MetaItem>
        </View>
        <Text style={styles.heading} accessibilityRole="header">Mensagem</Text>
        <Text style={styles.message} selectable>{capsule.text}</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.heading} accessibilityRole="header">Anexos</Text>
        {capsule.files.length === 0
          ? <Text style={styles.body}>Nenhum anexo nesta cápsula.</Text>
          : <View style={styles.files}>{capsule.files.map((file) => <FileItem key={file.id} file={file} />)}</View>}
      </Card>
    </PopIn>
  );
}

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      {children}
    </View>
  );
}

function FileItem({ file }: { file: CapsuleFile }) {
  const toast = useToast();
  const [imageFailed, setImageFailed] = useState(false);
  const isImage = file.mimeType.startsWith('image/');
  const size = `${sizeFormatter.format(file.fileSize / 1024)} KB`;

  async function open() {
    if (!file.downloadUrl) return;
    try {
      await Linking.openURL(file.downloadUrl);
    } catch {
      toast.error('Não foi possível abrir o anexo', { description: 'Atualize a cápsula e tente novamente.' });
    }
  }

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${file.fileName}, ${size}`}
      accessibilityHint="Abre o anexo"
      disabled={!file.downloadUrl}
      onPress={() => void open()}
      style={({ pressed }) => [styles.file, pressed && styles.filePressed]}
    >
      {isImage && file.downloadUrl && !imageFailed ? (
        <Image
          source={{ uri: file.downloadUrl }}
          style={styles.image}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Icon name="paperclip" size={24} />
        </View>
      )}
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={2}>{file.fileName}</Text>
        <Text style={styles.fileSize}>{size}</Text>
      </View>
    </Pressable>
  );
}

function DetailSkeleton() {
  return (
    <View style={styles.sections} accessibilityState={{ busy: true }} accessibilityLabel="Carregando cápsula">
      <Skeleton width="75%" height={36} />
      <Card style={styles.card}>
        <View style={styles.meta}>
          {Array.from({ length: 3 }, (_, index) => (
            <View key={index} style={styles.metaItem}>
              <Skeleton width={110} height={14} />
              <Skeleton width="60%" />
            </View>
          ))}
        </View>
        <Skeleton width={120} height={22} />
        <Skeleton />
        <Skeleton width="85%" />
        <Skeleton width="60%" />
      </Card>
      <Card style={styles.card}>
        <Skeleton width={100} height={22} />
        <Skeleton width="50%" />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    gap: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sections: { gap: 28 },
  card: { gap: 12 },
  meta: { gap: 16, marginBottom: 8, paddingBottom: 20, borderBottomWidth: strokeThin, borderBottomColor: colors.ink },
  metaItem: { gap: 6, alignItems: 'flex-start' },
  metaLabel: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 15 },
  metaValue: { color: colors.ink, fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 24 },
  heading: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 26,
    textTransform: 'uppercase',
  },
  message: { color: colors.ink, fontFamily: fonts.body, fontSize: 16, lineHeight: 25 },
  body: { color: colors.ink, fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 24 },
  files: { gap: 12 },
  file: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 4 },
  filePressed: { backgroundColor: colors.yellowSoft },
  image: { width: 96, height: 96, borderWidth: strokeThin, borderColor: colors.ink, backgroundColor: colors.paper },
  imageFallback: { alignItems: 'center', justifyContent: 'center', borderWidth: stroke },
  fileInfo: { flex: 1, gap: 2 },
  fileName: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 21, textDecorationLine: 'underline' },
  fileSize: { color: colors.muted, fontFamily: fonts.bodyMedium, fontSize: 13.6 },
});
