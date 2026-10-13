import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../theme/tokens';
import { ShadowBox } from './ShadowBox';

export function Logo({ withText = true }: { withText?: boolean }) {
  return (
    <View style={styles.row} accessible accessibilityRole="image" accessibilityLabel="Cápsula do Tempo">
      <ShadowBox offset={3} backgroundColor={colors.yellow} style={styles.mark}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M7 3h10M7 21h10M8 3v3.5a4 4 0 0 0 1.6 3.2L12 12l-2.4 2.3A4 4 0 0 0 8 17.5V21m8-18v3.5a4 4 0 0 1-1.6 3.2L12 12l2.4 2.3a4 4 0 0 1 1.6 3.2V21"
            stroke={colors.ink}
            strokeWidth={2.5}
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </Svg>
      </ShadowBox>
      {withText && <Text style={styles.text} numberOfLines={1}>Cápsula do Tempo</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  mark: { padding: 5.6 },
  text: {
    flexShrink: 1,
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 17.6,
    letterSpacing: -0.18,
    textTransform: 'uppercase',
  },
});
