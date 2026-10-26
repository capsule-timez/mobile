import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import type { CapsuleStatus, CapsuleSummary } from '../types/capsule';
import { colors, fonts, stroke, strokeThin } from '../theme/tokens';
import { getDeliveryProgress } from '../utils/capsuleList';
import { formatDateTime, formatRelativeTime, isInFuture } from '../utils/formatDate';
import { Badge, type BadgeTone } from './Badge';
import { Card } from './Card';
import { DashedDivider } from './DashedDivider';
import { Icon, type IconName } from './Icon';
import { PopIn, useReducedMotion } from './PopIn';
import { ShadowBox } from './ShadowBox';
import { Skeleton } from './Skeleton';

const STATUS_ICONS: Record<CapsuleStatus, IconName> = { SCHEDULED: 'lock', SENT: 'check', FAILED: 'alert' };
const STATUS_COLORS: Record<CapsuleStatus, string> = { SCHEDULED: colors.yellow, SENT: colors.green, FAILED: colors.red };
const STATUS_BADGES: Record<CapsuleStatus, { label: string; tone: BadgeTone; icon: IconName }> = {
  SCHEDULED: { label: 'Agendada', tone: 'warning', icon: 'lock' },
  SENT: { label: 'Enviada', tone: 'success', icon: 'check' },
  FAILED: { label: 'Falha no envio', tone: 'danger', icon: 'alert' },
};

export function CapsuleStatusBadge({ status }: { status: CapsuleStatus }) {
  const { label, tone, icon } = STATUS_BADGES[status];
  return <Badge tone={tone} icon={icon}>{label}</Badge>;
}

function getHighlight(capsule: CapsuleSummary): string {
  switch (capsule.status) {
    case 'SENT':
      return `Entregue ${formatRelativeTime(capsule.sentAt ?? capsule.scheduleDate)}`;
    case 'FAILED':
      return 'Não foi possível entregar esta cápsula';
    case 'SCHEDULED':
      return isInFuture(capsule.scheduleDate)
        ? `Será entregue ${formatRelativeTime(capsule.scheduleDate)}`
        : 'Entrega em andamento';
  }
}

function ProgressBar({ progress, index }: { progress: number; index: number }) {
  const reduced = useReducedMotion();
  const fill = useRef(new Animated.Value(reduced ? progress : 0)).current;

  useEffect(() => {
    if (reduced) {
      fill.setValue(progress);
      return;
    }
    const animation = Animated.timing(fill, {
      toValue: progress,
      duration: 900,
      delay: Math.min(index, 8) * 60 + 250,
      easing: Easing.bezier(0.2, 0.9, 0.3, 1),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [fill, progress, index, reduced]);

  const width = useMemo(() => fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), [fill]);
  const percent = Math.round(progress * 100);

  return (
    <View
      style={styles.progressRow}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Progresso até a entrega"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
    >
      <View style={styles.progress}>
        <Animated.View style={[styles.progressFill, { width }]}>
          <Svg width="100%" height="100%">
            <Defs>
              <Pattern id="progress-stripes" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <Rect x="6" width="3" height="9" fill="rgba(31, 19, 11, 0.22)" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#progress-stripes)" />
          </Svg>
        </Animated.View>
      </View>
      <Text style={styles.progressLabel}>{percent}%</Text>
    </View>
  );
}

interface CapsuleCardProps {
  capsule: CapsuleSummary;
  index?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  deleting?: boolean;
}

export function CapsuleCard({ capsule, index = 0, onPress, onLongPress, deleting = false }: CapsuleCardProps) {
  const statusColor = STATUS_COLORS[capsule.status];
  const progress = capsule.status === 'SCHEDULED' ? getDeliveryProgress(capsule) : null;
  const attachments = `${capsule.fileCount} ${capsule.fileCount === 1 ? 'anexo' : 'anexos'}`;
  const canDelete = capsule.status === 'SCHEDULED' && !!onLongPress && !deleting;

  return (
    <PopIn delay={Math.min(index, 8) * 60}>
      <Pressable
        accessibilityRole="button"
        accessibilityHint={canDelete ? 'Toque para abrir. Mantenha pressionado para excluir a cápsula agendada.' : 'Abre o detalhe da cápsula'}
        accessibilityState={{ disabled: deleting, busy: deleting }}
        accessibilityActions={canDelete ? [{ name: 'delete', label: 'Excluir cápsula agendada' }] : undefined}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'delete' && canDelete) onLongPress?.();
        }}
        disabled={deleting || (!onPress && !canDelete)}
        onPress={onPress}
        onLongPress={canDelete ? onLongPress : undefined}
        delayLongPress={500}
      >
        {({ pressed }) => (
          // Mesmo efeito do hover do card na web: o card sobe e a sombra cresce.
          <Card offset={pressed ? 11 : 8} style={styles.card} containerStyle={pressed && styles.cardPressed}>
            <View style={styles.top}>
              <ShadowBox offset={3} backgroundColor={statusColor} style={[styles.iconBox, pressed && styles.iconPressed]}>
                <Icon name={STATUS_ICONS[capsule.status]} size={20} />
              </ShadowBox>
              <CapsuleStatusBadge status={capsule.status} />
              {capsule.fileCount > 0 && (
                <View style={styles.files} accessible accessibilityLabel={attachments}>
                  <Icon name="paperclip" />
                  <Text style={styles.filesText}>{capsule.fileCount}</Text>
                </View>
              )}
            </View>

            <Text style={styles.title} numberOfLines={2} accessibilityRole="header">{capsule.title}</Text>
            <View style={[styles.highlight, { backgroundColor: statusColor }]}>
              <Text style={styles.highlightText}>{getHighlight(capsule)}</Text>
            </View>

            {progress !== null && <ProgressBar progress={progress} index={index} />}

            <DashedDivider style={styles.divider} />
            <View style={styles.meta}>
              <View style={styles.metaRow} accessible accessibilityLabel={`Data de entrega: ${formatDateTime(capsule.scheduleDate)}`}>
                <View style={styles.metaIcon}><Icon name="calendar" /></View>
                <Text style={styles.metaText}>{formatDateTime(capsule.scheduleDate)}</Text>
              </View>
              <View style={styles.metaRow} accessible accessibilityLabel={`Destinatário: ${capsule.recipientEmail}`}>
                <View style={styles.metaIcon}><Icon name="mail" /></View>
                <Text style={styles.metaText}>{capsule.recipientEmail}</Text>
              </View>
            </View>
          </Card>
        )}
      </Pressable>
    </PopIn>
  );
}

export function CapsuleCardSkeleton() {
  return (
    <Card offset={8} style={styles.card}>
      <View style={styles.top}>
        <Skeleton width={40} height={40} />
        <Skeleton width={88} height={22} />
      </View>
      <Skeleton width="70%" height={22} />
      <Skeleton width="45%" />
      <Skeleton width="80%" />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  cardPressed: { transform: [{ translateX: -3 }, { translateY: -3 }] },
  iconPressed: { transform: [{ rotate: '-8deg' }] },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { padding: 7 },
  files: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  filesText: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 13.6 },
  title: {
    marginTop: 4,
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 24,
  },
  highlight: { alignSelf: 'flex-start', paddingVertical: 2, paddingHorizontal: 8 },
  highlightText: {
    color: colors.ink,
    fontFamily: fonts.bodyBold,
    fontSize: 13.6,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progress: {
    flex: 1,
    height: 18,
    overflow: 'hidden',
    borderWidth: stroke,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
  },
  progressFill: {
    height: '100%',
    overflow: 'hidden',
    borderRightWidth: strokeThin,
    borderRightColor: colors.ink,
    backgroundColor: colors.yellow,
  },
  progressLabel: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 12.8, minWidth: 34, textAlign: 'right' },
  divider: { marginTop: 4 },
  meta: { gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  metaIcon: { marginTop: 3 },
  metaText: { flex: 1, color: colors.ink, fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 21 },
});
