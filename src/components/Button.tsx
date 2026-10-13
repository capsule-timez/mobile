import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, stroke } from '../theme/tokens';
import { Icon, type IconName } from './Icon';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark';

interface ButtonProps {
  children: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'md' | 'sm';
  fullWidth?: boolean;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

const SHADOW_OFFSET = 4;

const VARIANTS: Record<
  Variant,
  { background: string; pressedBackground: string; text: string; shadow: string | null; border: string }
> = {
  primary: { background: colors.orange, pressedBackground: colors.orangeHover, text: colors.ink, shadow: colors.ink, border: colors.ink },
  secondary: { background: colors.surface, pressedBackground: colors.yellow, text: colors.ink, shadow: colors.ink, border: colors.ink },
  dark: { background: colors.ink, pressedBackground: colors.ink, text: colors.surface, shadow: colors.yellow, border: colors.ink },
  ghost: { background: 'transparent', pressedBackground: colors.yellow, text: colors.ink, shadow: null, border: 'transparent' },
};

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  loading = false,
  disabled = false,
  accessibilityLabel,
}: ButtonProps) {
  const inactive = disabled || loading;
  const palette = VARIANTS[variant];
  const small = size === 'sm';
  const hasShadow = palette.shadow !== null && !inactive;
  const offset = palette.shadow !== null ? SHADOW_OFFSET : 0;

  const textColor = inactive && variant !== 'ghost' ? colors.disabledText : palette.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={fullWidth ? styles.full : styles.auto}
    >
      {({ pressed }) => (
        <View style={{ paddingRight: offset, paddingBottom: offset }}>
          {hasShadow && !pressed && (
            <View
              pointerEvents="none"
              style={[styles.shadow, { left: offset, top: offset, backgroundColor: palette.shadow ?? colors.ink }]}
            />
          )}
          <View
            style={[
              styles.box,
              small ? styles.boxSmall : styles.boxMedium,
              {
                backgroundColor: inactive && variant !== 'ghost'
                  ? colors.disabledBg
                  : pressed ? palette.pressedBackground : palette.background,
                borderColor: inactive && variant !== 'ghost'
                  ? colors.disabledBorder
                  : pressed && variant === 'ghost' ? colors.ink : palette.border,
                transform: pressed && hasShadow ? [{ translateX: offset }, { translateY: offset }] : [],
              },
            ]}
          >
            {loading
              ? <Spinner size={small ? 12 : 14} color={textColor} />
              : icon && <Icon name={icon} size={small ? 14 : 16} color={textColor} />}
            <Text
              style={[
                styles.label,
                small && styles.labelSmall,
                { color: textColor },
                variant === 'ghost' && styles.labelGhost,
              ]}
            >
              {children}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  auto: { alignSelf: 'flex-start' },
  full: { alignSelf: 'stretch' },
  shadow: { position: 'absolute', right: 0, bottom: 0 },
  box: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: stroke },
  boxMedium: { paddingVertical: 11, paddingHorizontal: 20, minHeight: 48 },
  boxSmall: { paddingVertical: 6, paddingHorizontal: 12, minHeight: 36 },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 14.4,
    letterSpacing: 0.58,
    lineHeight: 17,
    textTransform: 'uppercase',
  },
  labelSmall: { fontSize: 12.8, letterSpacing: 0.51 },
  labelGhost: { textDecorationLine: 'underline' },
});
