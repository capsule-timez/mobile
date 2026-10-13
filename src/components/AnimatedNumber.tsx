import { useEffect, useRef, useState } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useReducedMotion } from './PopIn';

const DURATION_MS = 700;

export function AnimatedNumber({ value, style }: { value: number; style?: StyleProp<TextStyle> }) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    if (reduced) {
      current.current = value;
      setDisplay(value);
      return;
    }
    const from = current.current;
    const start = Date.now();
    let frame = 0;
    const tick = () => {
      const progress = Math.min((Date.now() - start) / DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      current.current = Math.round(from + (value - from) * eased);
      setDisplay(current.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced]);

  return <Text style={style}>{display}</Text>;
}
