import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, strokeThin } from '../theme/tokens';
import { Icon } from './Icon';
import { PopIn } from './PopIn';
import { ShadowBox } from './ShadowBox';

interface AlertProps {
  tone: 'success' | 'error';
  children: string;
  onDismiss?: () => void;
}

export function Alert({ tone, children, onDismiss }: AlertProps) {
  return (
    <PopIn duration={180}>
      <ShadowBox
        offset={4}
        backgroundColor={tone === 'error' ? colors.red : colors.green}
        style={styles.box}
      >
        <View style={styles.icon}>
          <Icon name={tone === 'error' ? 'alert' : 'check'} size={18} />
        </View>
        <Text
          style={styles.text}
          accessibilityRole={tone === 'error' ? 'alert' : undefined}
          accessibilityLiveRegion="polite"
        >
          {children}
        </Text>
        {onDismiss && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar aviso"
            onPress={onDismiss}
            hitSlop={8}
            style={({ pressed }) => [styles.close, pressed && { backgroundColor: colors.yellow }]}
          >
            <Icon name="close" size={16} />
          </Pressable>
        )}
      </ShadowBox>
    </PopIn>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  icon: { marginTop: 2 },
  text: { flex: 1, color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 23 },
  close: {
    padding: 3,
    borderWidth: strokeThin,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
  },
});
