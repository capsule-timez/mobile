import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { colors, strokeThin } from '../theme/tokens';

export function DashedDivider({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.wrapper, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height={strokeThin}>
        <Line
          x1="0"
          y1={strokeThin / 2}
          x2="100%"
          y2={strokeThin / 2}
          stroke={colors.ink}
          strokeWidth={strokeThin}
          strokeDasharray="6,4"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { height: strokeThin, width: '100%' },
});
