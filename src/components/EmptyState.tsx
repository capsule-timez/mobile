import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme/tokens';
import { Icon, type IconName } from './Icon';
import { PopIn, useReducedMotion } from './PopIn';
import { ShadowBox } from './ShadowBox';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const reduced = useReducedMotion();
  const wiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(wiggle, { toValue: -1, duration: 120, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: 1, duration: 240, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: 0, duration: 120, easing: Easing.linear, useNativeDriver: true }),
        Animated.delay(1320),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, wiggle]);

  const rotate = useMemo(() => wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-6deg', '6deg'] }), [wiggle]);

  return (
    <PopIn>
      <ShadowBox offset={8} style={styles.box}>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ShadowBox offset={4} backgroundColor={colors.yellow} style={styles.iconBox}>
            <Icon name={icon} size={28} />
          </ShadowBox>
        </Animated.View>
        <Text style={styles.title} accessibilityRole="header">{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        {action ? <View style={styles.action}>{action}</View> : null}
      </ShadowBox>
    </PopIn>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: 8, paddingVertical: 40, paddingHorizontal: 24 },
  iconBox: { padding: 18 },
  title: {
    marginTop: 12,
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 27,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  description: {
    maxWidth: 448,
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  action: { marginTop: 8 },
});
