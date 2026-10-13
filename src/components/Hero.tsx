import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, stroke } from '../theme/tokens';
import { AnimatedNumber } from './AnimatedNumber';
import { PopIn } from './PopIn';
import { ShadowBox } from './ShadowBox';

interface HeroStat {
  label: string;
  value: number;
}

interface HeroProps {
  eyebrow: string;
  title: string;
  description?: string;
  stats?: HeroStat[];
}

export function Hero({ eyebrow, title, description, stats }: HeroProps) {
  return (
    <PopIn>
      <ShadowBox offset={12} backgroundColor={colors.orange} style={styles.hero}>
        <View>
          <View style={styles.eyebrowBox}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
          </View>
          <Text style={styles.title} accessibilityRole="header">{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>

        {stats && stats.length > 0 ? (
          <View style={styles.stats}>
            {stats.map((stat) => (
              <View
                key={stat.label}
                style={styles.statWrapper}
                accessible
                accessibilityLabel={`${stat.label}: ${stat.value}`}
              >
                <ShadowBox offset={4} shadowColor={colors.surface} backgroundColor={colors.ink} style={styles.stat}>
                  <AnimatedNumber value={stat.value} style={styles.statValue} />
                  <Text style={styles.statLabel} numberOfLines={1}>{stat.label}</Text>
                </ShadowBox>
              </View>
            ))}
          </View>
        ) : null}
      </ShadowBox>
    </PopIn>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 24, padding: 20, overflow: 'hidden' },
  eyebrowBox: { alignSelf: 'flex-start', marginBottom: 12, paddingVertical: 3, paddingHorizontal: 10, backgroundColor: colors.ink },
  eyebrow: {
    color: colors.yellow,
    fontFamily: fonts.bodyBold,
    fontSize: 12.8,
    letterSpacing: 1.28,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 30,
    textTransform: 'uppercase',
  },
  description: { marginTop: 12, color: colors.ink, fontFamily: fonts.bodyMedium, fontSize: 16.8, lineHeight: 25 },
  stats: { flexDirection: 'row', gap: 8 },
  statWrapper: { flex: 1 },
  stat: { flexDirection: 'column-reverse', paddingVertical: 12, paddingHorizontal: 12, borderWidth: stroke },
  statValue: { color: colors.yellow, fontFamily: fonts.display, fontSize: 33.6, lineHeight: 37 },
  statLabel: {
    color: colors.surface,
    fontFamily: fonts.bodyBold,
    fontSize: 11.2,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
});
