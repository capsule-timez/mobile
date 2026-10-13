import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useUser } from '../../src/auth/AuthProvider';
import { AppShell } from '../../src/components/AppShell';
import { Button } from '../../src/components/Button';
import { CapsuleCard, CapsuleCardSkeleton } from '../../src/components/CapsuleCard';
import { EmptyState } from '../../src/components/EmptyState';
import { Hero } from '../../src/components/Hero';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { useToast } from '../../src/components/Toast';
import { getApiErrorDetails, listCapsules } from '../../src/services/capsules';
import { colors, contentMaxWidth, fonts, stroke } from '../../src/theme/tokens';
import type { CapsuleStatus, CapsuleSummary } from '../../src/types/capsule';
import { countByStatus, sortCapsules } from '../../src/utils/capsuleList';
import { formatDateTime, formatRelativeTime, isInFuture } from '../../src/utils/formatDate';

type StatusFilter = 'ALL' | CapsuleStatus;

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; capsules: CapsuleSummary[] };

const SKELETON_COUNT = 3;

export default function ListaCapsulasScreen() {
  const router = useRouter();
  const user = useUser();
  const toast = useToast();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const mounted = useRef(true);

  /** Busca a lista na API. Devolve a mensagem de erro, ou null em caso de sucesso. */
  const load = useCallback(async (signal?: AbortSignal): Promise<string | null> => {
    try {
      const capsules = await listCapsules(signal);
      if (signal?.aborted) return null;
      setState({ status: 'success', capsules: sortCapsules(capsules) });
      return null;
    } catch (error) {
      if (signal?.aborted) return null;
      const message = getApiErrorDetails(error).message;
      // Se já havia uma lista na tela, uma falha ao atualizar não a apaga.
      setState((current) => (current.status === 'success' ? current : { status: 'error', message }));
      return message;
    }
  }, []);

  // Carrega ao abrir a tela e recarrega (sem piscar) ao voltar da criação.
  useFocusEffect(
    useCallback(() => {
      mounted.current = true;
      const controller = new AbortController();
      setState((current) => (current.status === 'error' ? { status: 'loading' } : current));
      void load(controller.signal);
      return () => {
        mounted.current = false;
        controller.abort();
      };
    }, [load]),
  );

  function retry() {
    setState({ status: 'loading' });
    void load();
  }

  async function refresh() {
    setRefreshing(true);
    const message = await load();
    if (mounted.current) setRefreshing(false);
    if (message && mounted.current) toast.error('Não foi possível atualizar', { description: message });
  }

  const capsules = useMemo(() => (state.status === 'success' ? state.capsules : []), [state]);
  const visibleCapsules = useMemo(
    () => (filter === 'ALL' ? capsules : capsules.filter((capsule) => capsule.status === filter)),
    [capsules, filter],
  );

  const nextCapsule = capsules.find((capsule) => capsule.status === 'SCHEDULED' && isInFuture(capsule.scheduleDate));
  const firstName = user?.name.split(' ')[0];
  const hasCapsules = state.status === 'success' && capsules.length > 0;

  const header = (
    <View style={styles.header}>
      <Hero
        eyebrow={firstName ? `Olá, ${firstName}` : 'Olá'}
        title={
          nextCapsule
            ? `“${nextCapsule.title}” chega ${formatRelativeTime(nextCapsule.scheduleDate)}`
            : 'Guarde algo para o futuro'
        }
        description={
          nextCapsule
            ? `Lacrada até ${formatDateTime(nextCapsule.scheduleDate)}.`
            : 'Escreva uma mensagem hoje e deixe que ela chegue quando o momento certo vier.'
        }
        stats={
          hasCapsules
            ? [
                { label: 'Agendadas', value: countByStatus(capsules, 'SCHEDULED') },
                { label: 'Enviadas', value: countByStatus(capsules, 'SENT') },
                { label: 'Total', value: capsules.length },
              ]
            : undefined
        }
      />

      {hasCapsules && (
        <View style={styles.toolbar}>
          <Text style={styles.heading} accessibilityRole="header">Suas cápsulas</Text>
          <SegmentedControl<StatusFilter>
            label="Filtrar por status"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'ALL', label: 'Todas', count: capsules.length },
              { value: 'SCHEDULED', label: 'Agendadas', count: countByStatus(capsules, 'SCHEDULED') },
              { value: 'SENT', label: 'Enviadas', count: countByStatus(capsules, 'SENT') },
              { value: 'FAILED', label: 'Com falha', count: countByStatus(capsules, 'FAILED') },
            ]}
          />
        </View>
      )}
    </View>
  );

  const empty = (() => {
    if (state.status === 'loading') {
      return (
        <View style={styles.list} accessibilityState={{ busy: true }} accessibilityLabel="Carregando cápsulas">
          {Array.from({ length: SKELETON_COUNT }, (_, index) => <CapsuleCardSkeleton key={index} />)}
        </View>
      );
    }
    if (state.status === 'error') {
      return (
        <EmptyState
          icon="alert"
          title="Não foi possível carregar suas cápsulas"
          description={state.message}
          action={<Button variant="secondary" onPress={retry}>Tentar novamente</Button>}
        />
      );
    }
    if (capsules.length === 0) {
      return (
        <EmptyState
          icon="hourglass"
          title="Nenhuma cápsula por aqui ainda"
          description="Escreva uma mensagem hoje e deixe que ela chegue no futuro."
          action={<Button icon="plus" onPress={() => router.push('/nova')}>Criar primeira cápsula</Button>}
        />
      );
    }
    return (
      <EmptyState
        icon="mail"
        title="Nenhuma cápsula neste filtro"
        action={<Button variant="secondary" onPress={() => setFilter('ALL')}>Ver todas</Button>}
      />
    );
  })();

  return (
    <AppShell>
      <FlatList
        data={state.status === 'success' ? visibleCapsules : []}
        extraData={filter}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <CapsuleCard capsule={item} index={index} />}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={[styles.content, { paddingBottom: 32 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={colors.ink}
            colors={[colors.orange]}
            progressBackgroundColor={colors.surface}
          />
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </AppShell>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 24 },
  header: { gap: 28, marginBottom: 28 },
  toolbar: { gap: 12, paddingBottom: 16, borderBottomWidth: stroke, borderBottomColor: colors.ink },
  heading: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 31,
    textTransform: 'uppercase',
  },
  list: { gap: 28 },
  separator: { height: 28 },
});
