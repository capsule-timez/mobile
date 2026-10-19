import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, strokeThin } from '../theme/tokens';
import { Icon, type IconName } from './Icon';
import { useReducedMotion } from './PopIn';
import { ShadowBox } from './ShadowBox';

type ToastTone = 'success' | 'error' | 'info';

interface ToastData {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
  duration: number;
}

interface ToastOptions {
  description?: string;
  duration?: number;
}

interface ToastApi {
  success: (title: string, options?: ToastOptions) => void;
  error: (title: string, options?: ToastOptions) => void;
  info: (title: string, options?: ToastOptions) => void;
}

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 5000;
const ERROR_DURATION = 7000;

const TONE_BACKGROUND: Record<ToastTone, string> = {
  success: colors.green,
  error: colors.red,
  info: colors.yellow,
};
const TONE_ICON: Record<ToastTone, IconName> = { success: 'check', error: 'alert', info: 'hourglass' };

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const nextId = useRef(0);

  const push = useCallback((tone: ToastTone, title: string, options: ToastOptions = {}) => {
    const toast: ToastData = {
      id: ++nextId.current,
      tone,
      title,
      description: options.description,
      duration: options.duration ?? (tone === 'error' ? ERROR_DURATION : DEFAULT_DURATION),
    };
    setToasts((current) => [...current, toast].slice(-MAX_VISIBLE));
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (title, options) => push('success', title, options),
      error: (title, options) => push('error', title, options),
      info: (title, options) => push('info', title, options),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <View
        pointerEvents="box-none"
        accessibilityLabel="Notificações"
        style={[styles.viewport, { bottom: Math.max(insets.bottom, 16), left: 16 + insets.left, right: 16 + insets.right }]}
      >
        {toasts.map((toast) => <ToastItem key={toast.id} toast={toast} onRemove={remove} />)}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast deve ser usado dentro de ToastProvider');
  return context;
}

function ToastItem({ toast, onRemove }: { toast: ToastData; onRemove: (id: number) => void }) {
  const reduced = useReducedMotion();
  const enter = useRef(new Animated.Value(0)).current;
  const countdown = useRef(new Animated.Value(1)).current;
  const leaving = useRef(false);

  const dismiss = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    countdown.stopAnimation();
    Animated.timing(enter, { toValue: 0, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      .start(() => onRemove(toast.id));
  }, [countdown, enter, onRemove, toast.id]);

  useEffect(() => {
    Animated.spring(enter, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 160, mass: 0.8 }).start();
    Animated.timing(countdown, { toValue: 0, duration: toast.duration, easing: Easing.linear, useNativeDriver: false })
      .start(({ finished }) => { if (finished) dismiss(); });
    return () => { enter.stopAnimation(); countdown.stopAnimation(); };
  }, [enter, countdown, toast.duration, dismiss]);

  const background = TONE_BACKGROUND[toast.tone];

  return (
    <Animated.View
      accessibilityRole={toast.tone === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
      style={{
        opacity: enter,
        transform: [{ translateX: enter.interpolate({ inputRange: [0, 1], outputRange: [48, 0] }) }],
      }}
    >
      <ShadowBox offset={8} backgroundColor={background} style={styles.toast}>
        <View style={styles.content}>
          <View style={[styles.icon, { backgroundColor: colors.ink }]}>
            <Icon name={TONE_ICON[toast.tone]} size={18} strokeWidth={2.5} color={background} />
          </View>
          <View style={styles.body}>
            <Text style={styles.title}>{toast.title}</Text>
            {toast.description ? <Text style={styles.description}>{toast.description}</Text> : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar notificação"
            onPress={dismiss}
            hitSlop={8}
            style={({ pressed }) => [styles.close, pressed && { backgroundColor: colors.ink }]}
          >
            {({ pressed }) => <Icon name="close" size={16} color={pressed ? colors.surface : colors.ink} />}
          </Pressable>
        </View>
        {!reduced && (
          <Animated.View
            style={[
              styles.progress,
              { width: countdown.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
            ]}
          />
        )}
      </ShadowBox>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  viewport: { position: 'absolute', gap: 6, zIndex: 100 },
  toast: { overflow: 'hidden' },
  content: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingTop: 14, paddingBottom: 18, paddingLeft: 14, paddingRight: 12 },
  icon: { padding: 6 },
  body: { flex: 1, minWidth: 0 },
  title: {
    marginTop: 2,
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 15.2,
    textTransform: 'uppercase',
  },
  description: { marginTop: 3, color: colors.ink, fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 },
  close: { padding: 3, borderWidth: strokeThin, borderColor: colors.ink, backgroundColor: colors.surface },
  progress: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 8,
    borderTopWidth: strokeThin,
    borderTopColor: colors.ink,
    backgroundColor: colors.ink,
  },
});
