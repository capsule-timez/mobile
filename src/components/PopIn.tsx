import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { AccessibilityInfo, Animated, Easing, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { motion } from '../theme/tokens';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (active) setReduced(value); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { active = false; subscription.remove(); };
  }, []);
  return reduced;
}

interface PopInProps {
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
}

export function PopIn({ delay = 0, duration = motion.slow, style, onLayout, children }: PropsWithChildren<PopInProps>) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const translateX = useMemo(() => progress.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }), [progress]);
  const translateY = useMemo(() => progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }), [progress]);

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.bezier(0.2, 0.9, 0.3, 1),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [reduced, progress, delay, duration]);

  return (
    <Animated.View
      onLayout={onLayout}
      style={[
        style,
        {
          opacity: progress,
          transform: [{ translateX }, { translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
