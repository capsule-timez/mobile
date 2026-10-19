import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, stroke } from '../theme/tokens';
import { ShadowBox } from './ShadowBox';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ label, options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <View style={styles.group} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            accessibilityLabel={option.count !== undefined ? `${option.label}, ${option.count}` : option.label}
            onPress={() => onChange(option.value)}
          >
            {({ pressed }) => (
              <ShadowBox
                offset={4}
                shadowVisible={selected}
                backgroundColor={selected ? colors.orange : pressed ? colors.yellow : colors.surface}
                borderWidth={stroke}
                style={[styles.option, selected && styles.selected]}
              >
                <Text style={styles.label}>{option.label}</Text>
                {option.count !== undefined && (
                  <View style={styles.count}>
                    <Text style={styles.countText}>{option.count}</Text>
                  </View>
                )}
              </ShadowBox>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 14, minHeight: 40 },
  selected: { transform: [{ translateX: -2 }, { translateY: -2 }] },
  label: {
    color: colors.ink,
    fontFamily: fonts.bodyBold,
    fontSize: 13.6,
    letterSpacing: 0.54,
    textTransform: 'uppercase',
  },
  count: { minWidth: 22, paddingHorizontal: 5, backgroundColor: colors.ink },
  countText: { color: colors.surface, fontFamily: fonts.bodyBold, fontSize: 12, textAlign: 'center' },
});
