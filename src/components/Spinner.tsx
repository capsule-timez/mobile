import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

export function Spinner({ size = 16, color }: { size?: number; color: string }) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 600, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [rotation]);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.spinner,
        { width: size, height: size, borderColor: color, borderRightColor: 'transparent', transform: [{ rotate }] },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  spinner: { borderWidth: 3 },
});
