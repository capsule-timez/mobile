import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, stroke } from '../theme/tokens';

interface ShadowBoxProps {
  offset?: number;
  shadowVisible?: boolean;
  shadowColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export function ShadowBox({
  offset = 0,
  shadowVisible = true,
  shadowColor = colors.ink,
  backgroundColor = colors.surface,
  borderColor = colors.ink,
  borderWidth = stroke,
  borderRadius = 0,
  style,
  containerStyle,
  children,
}: PropsWithChildren<ShadowBoxProps>) {
  return (
    <View style={[{ paddingRight: offset, paddingBottom: offset }, containerStyle]}>
      {offset > 0 && shadowVisible && (
        <View
          pointerEvents="none"
          style={[styles.shadow, { left: offset, top: offset, backgroundColor: shadowColor, borderRadius }]}
        />
      )}
      <View style={[{ backgroundColor, borderColor, borderWidth, borderRadius }, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { position: 'absolute', right: 0, bottom: 0 },
});
