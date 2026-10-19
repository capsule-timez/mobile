import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, type DimensionValue } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { colors, strokeThin } from '../theme/tokens';
import { useReducedMotion } from './PopIn';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
}

export function Skeleton({ width = '100%', height = 16 }: SkeletonProps) {
  const reduced = useReducedMotion();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.55, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, pulse]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.box, { width, height, opacity: pulse }]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="stripes" width="28.28" height="28.28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <Rect width="14.14" height="28.28" fill={colors.paperDark} />
            <Rect x="14.14" width="14.14" height="28.28" fill={colors.paper} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#stripes)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', borderWidth: strokeThin, borderColor: colors.ink },
});
