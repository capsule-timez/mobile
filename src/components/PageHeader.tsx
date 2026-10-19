import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, stroke } from '../theme/tokens';

interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title} accessibilityRole="header">{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: 8, paddingBottom: 16, borderBottomWidth: stroke, borderBottomColor: colors.ink },
  title: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 39,
    textTransform: 'uppercase',
  },
  description: { color: colors.muted, fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 24 },
});
