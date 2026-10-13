import { StyleSheet, Text } from 'react-native';
import { colors, fonts, strokeThin } from '../theme/tokens';
import { Icon, type IconName } from './Icon';
import { ShadowBox } from './ShadowBox';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const TONE_BACKGROUND: Record<BadgeTone, string> = {
  neutral: colors.surface,
  info: colors.paper,
  success: colors.green,
  warning: colors.yellow,
  danger: colors.red,
};

interface BadgeProps {
  tone?: BadgeTone;
  icon?: IconName;
  children: string;
}

export function Badge({ tone = 'neutral', icon, children }: BadgeProps) {
  return (
    <ShadowBox
      offset={2}
      borderWidth={strokeThin}
      backgroundColor={TONE_BACKGROUND[tone]}
      containerStyle={styles.container}
      style={styles.box}
    >
      {icon && <Icon name={icon} size={14} />}
      <Text style={styles.label}>{children}</Text>
    </ShadowBox>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'flex-start' },
  box: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 2, paddingHorizontal: 8 },
  label: {
    color: colors.ink,
    fontFamily: fonts.bodyBold,
    fontSize: 11.5,
    letterSpacing: 0.7,
    lineHeight: 16,
    textTransform: 'uppercase',
  },
});
