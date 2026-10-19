import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme/tokens';
import { DashedDivider } from './DashedDivider';
import { Logo } from './Logo';
import { PopIn } from './PopIn';
import { ShadowBox } from './ShadowBox';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  footer: ReactNode;
}

export function AuthCard({ title, subtitle, footer, children }: PropsWithChildren<AuthCardProps>) {
  return (
    <PopIn style={styles.wrapper}>
      <ShadowBox offset={12} style={styles.card}>
        <View style={styles.brand}>
          <Logo withText={false} />
        </View>
        <Text style={styles.title} accessibilityRole="header">{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.form}>{children}</View>
        <DashedDivider style={styles.divider} />
        <View style={styles.footer}>{footer}</View>
      </ShadowBox>

      <View style={styles.tag} pointerEvents="none">
        <ShadowBox offset={3} backgroundColor={colors.yellow} style={styles.tagBox}>
          <Text style={styles.tagText}>Acesso</Text>
        </ShadowBox>
      </View>
    </PopIn>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', maxWidth: 432, alignSelf: 'center' },
  card: { padding: 24 },
  brand: { marginBottom: 20, alignItems: 'flex-start' },
  title: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 33.6,
    lineHeight: 36,
    textTransform: 'uppercase',
  },
  subtitle: { marginTop: 8, color: colors.muted, fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 24 },
  form: { marginTop: 28, gap: 20 },
  divider: { marginTop: 24 },
  footer: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tag: { position: 'absolute', top: -16, right: -4, transform: [{ rotate: '4deg' }] },
  tagBox: { paddingVertical: 3, paddingHorizontal: 10 },
  tagText: {
    color: colors.ink,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.96,
    textTransform: 'uppercase',
  },
});
