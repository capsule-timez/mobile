import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert as NativeAlert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CapsuleContributions } from '../../../src/components/CapsuleContributions';
import { CapsuleEditForm } from '../../../src/components/CapsuleEditForm';
import { CapsuleInvites } from '../../../src/components/CapsuleInvites';
import { ImagePickerField } from '../../../src/components/ImagePickerField';
import { AppShell } from '../../../src/components/AppShell';
import { Badge } from '../../../src/components/Badge';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { CapsuleStatusBadge, GroupBadge } from '../../../src/components/CapsuleCard';
import { EmptyState } from '../../../src/components/EmptyState';
import { Icon } from '../../../src/components/Icon';
import { InviteCodeCard } from '../../../src/components/InviteCodeCard';
import { PageHeader } from '../../../src/components/PageHeader';
import { PopIn } from '../../../src/components/PopIn';
import { Skeleton } from '../../../src/components/Skeleton';
import { useToast } from '../../../src/components/Toast';
import { useImageSelection } from '../../../src/hooks/useImageSelection';
import { deleteCapsule, getApiErrorDetails, getCapsule } from '../../../src/services/capsules';
import { HttpError } from '../../../src/services/http';
import { colors, contentMaxWidth, fonts, stroke, strokeThin } from '../../../src/theme/tokens';
import type { Capsule, CapsuleFile, CapsuleParticipant } from '../../../src/types/capsule';
import { isGroupCapsule, isGroupOwner } from '../../../src/utils/capsuleGroup';
import { formatDateTime } from '../../../src/utils/formatDate';
import { MAX_IMAGES_PER_CAPSULE } from '../../../src/utils/imageValidation';

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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
        {state.status === 'success' && (
          <CapsuleDetail
            capsule={state.capsule}
            onRefresh={() => load()}
            onReload={retry}
            onDeleted={() => router.navigate('/')}
          />
        )}
      </ScrollView>
    </AppShell>
  );
}

interface CapsuleDetailProps {
  capsule: Capsule;
  /** Recarrega sem voltar para o esqueleto. */
  onRefresh: () => Promise<void>;
  /** Recarrega do zero, quando o estado mudou na API. */
  onReload: () => void;
  onDeleted: () => void;
}

function CapsuleDetail({ capsule, onRefresh, onReload, onDeleted }: CapsuleDetailProps) {
  const toast = useToast();
  const isGroup = isGroupCapsule(capsule);
  const isOwner = isGroupOwner(capsule);
  // Na cápsula individual, quem vê o detalhe é sempre quem a criou.
  const canManage = !isGroup || isOwner;
  const scheduled = capsule.status === 'SCHEDULED';
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const images = useImageSelection(Math.max(MAX_IMAGES_PER_CAPSULE - capsule.files.length, 0));
  const [uploading, setUploading] = useState(false);

  async function handleEditDone(notEditable?: boolean) {
    setEditing(false);
    if (notEditable) onReload();
    else await onRefresh();
  }

  async function upload() {
    setUploading(true);
    const { sent, failed } = await images.upload(capsule.id);
    setUploading(false);
    if (sent > 0) await onRefresh();
    if (failed.length > 0) {
      toast.error(`${failed.length} ${failed.length === 1 ? 'imagem não foi enviada' : 'imagens não foram enviadas'}`, {
        description: `Não enviadas: ${failed.join(', ')}.`,
      });
    } else if (sent > 0) {
      toast.success(sent === 1 ? 'Imagem anexada!' : `${sent} imagens anexadas!`);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      await deleteCapsule(capsule.id);
      toast.success('Cápsula excluída com sucesso.');
      onDeleted();
    } catch (error) {
      const { code, message } = getApiErrorDetails(error);
      toast.error('Não foi possível excluir a cápsula', { description: message });
      setDeleting(false);
      // Status mudou (ex.: já enviada) ou a cápsula sumiu: recarrega para refletir o estado real.
      if (code === 'CAPSULE_NOT_EDITABLE' || code === 'NOT_FOUND') onReload();
    }
  }

  function confirmDelete() {
    NativeAlert.alert(
      'Excluir esta cápsula?',
      'A cápsula e seus anexos serão removidos e ela não será mais enviada. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => void remove() },
      ],
    );
  }

  return (
    <PopIn style={styles.sections}>
      <PageHeader title={capsule.title} />

      {editing ? (
        <CapsuleEditForm capsule={capsule} onCancel={() => setEditing(false)} onDone={handleEditDone} />
      ) : (
        <Card style={styles.card}>
          <View style={styles.meta}>
            <MetaItem label="Destinatário">
              <Text style={styles.metaValue}>{capsule.recipientEmail}</Text>
            </MetaItem>
            <MetaItem label="Data de entrega">
              <Text style={styles.metaValue}>{formatDateTime(capsule.scheduleDate)}</Text>
            </MetaItem>
            {isGroup && capsule.contributionDeadline && (
              <MetaItem label="Prazo para contribuições">
                <Text style={styles.metaValue}>{formatDateTime(capsule.contributionDeadline)}</Text>
              </MetaItem>
            )}
            <MetaItem label="Status">
              <View style={styles.badges}>
                <CapsuleStatusBadge status={capsule.status} />
                {isGroup && <GroupBadge />}
              </View>
            </MetaItem>
          </View>
          <Text style={styles.heading} accessibilityRole="header">Mensagem</Text>
          <Text style={styles.message} selectable>{capsule.text}</Text>
        </Card>
      )}

      {/* A API só envia o código ao criador: participantes nunca o recebem. */}
      {isOwner && capsule.inviteCode && (
        <InviteCodeCard
          heading="Convide mais pessoas"
          title={capsule.title}
          inviteCode={capsule.inviteCode}
          contributionDeadline={capsule.contributionDeadline}
        />
      )}
      {isOwner && <CapsuleInvites capsule={capsule} />}

      {isGroup && <ParticipantsCard participants={capsule.participants ?? []} />}
      {isGroup && <CapsuleContributions capsule={capsule} onContributed={onRefresh} />}

      {(canManage || capsule.files.length > 0) && (
        <Card style={styles.card}>
          <Text style={styles.heading} accessibilityRole="header">Anexos</Text>
          {capsule.files.length === 0
            ? <Text style={styles.body}>Nenhum anexo nesta cápsula.</Text>
            : <View style={styles.files}>{capsule.files.map((file) => <FileItem key={file.id} file={file} />)}</View>}
          {canManage && scheduled && images.maxFiles > 0 && (
            <>
              <ImagePickerField
                items={images.items}
                maxFiles={images.maxFiles}
                remaining={images.remaining}
                disabled={uploading}
                onAdd={images.add}
                onRemove={images.remove}
              />
              {images.items.length > 0 && (
                <Button icon="send" loading={uploading} onPress={() => void upload()}>Enviar imagens</Button>
              )}
            </>
          )}
        </Card>
      )}

      {canManage && scheduled && !editing && (
        <View style={styles.actions}>
          <Button variant="secondary" onPress={() => setEditing(true)} disabled={deleting}>Editar cápsula</Button>
          <Button variant="dark" icon="close" loading={deleting} onPress={confirmDelete}>Excluir cápsula</Button>
        </View>
      )}
    </PopIn>
  );
}

function ParticipantsCard({ participants }: { participants: CapsuleParticipant[] }) {
  // O criador vem primeiro; os demais mantêm a ordem da API (entrada).
  const ordered = [...participants].sort((a, b) => Number(b.role === 'OWNER') - Number(a.role === 'OWNER'));
  return (
    <Card style={styles.card}>
      <Text style={styles.heading} accessibilityRole="header">Participantes ({participants.length})</Text>
      {ordered.length === 0 && <Text style={styles.body}>Nenhum participante nesta cápsula.</Text>}
      <View style={styles.members}>
        {ordered.map((participant, index) => (
          <View key={`${participant.name}-${index}`} style={styles.member}>
            <View style={styles.memberIcon}><Icon name="user" size={16} /></View>
            <Text style={styles.memberName} numberOfLines={1}>{participant.name}</Text>
            {participant.role === 'OWNER' && <Badge tone="warning">Criador</Badge>}
            {participant.hasContributed && <Badge tone="success" icon="check">Contribuiu</Badge>}
          </View>
        ))}
      </View>
    </Card>
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
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  members: { gap: 10 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 12 },
  member: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  memberIcon: { padding: 6, borderWidth: strokeThin, borderColor: colors.ink, backgroundColor: colors.paper },
  memberName: { flex: 1, color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 16 },
  files: { gap: 12 },
  file: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 4 },
  filePressed: { backgroundColor: colors.yellowSoft },
  image: { width: 96, height: 96, borderWidth: strokeThin, borderColor: colors.ink, backgroundColor: colors.paper },
  imageFallback: { alignItems: 'center', justifyContent: 'center', borderWidth: stroke },
  fileInfo: { flex: 1, gap: 2 },
  fileName: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 21, textDecorationLine: 'underline' },
  fileSize: { color: colors.muted, fontFamily: fonts.bodyMedium, fontSize: 13.6 },
});
