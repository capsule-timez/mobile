import * as Clipboard from 'expo-clipboard';
import { Share, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, stroke } from '../theme/tokens';
import { formatDateTime } from '../utils/formatDate';
import { Button } from './Button';
import { ShadowBox } from './ShadowBox';
import { useToast } from './Toast';

interface InviteCodeCardProps {
  title: string;
  inviteCode: string;
  contributionDeadline?: string;
  onDone: () => void;
}

export function buildInviteMessage(title: string, inviteCode: string, contributionDeadline?: string): string {
  const deadline = contributionDeadline ? ` Dá para contribuir até ${formatDateTime(contributionDeadline)}.` : '';
  return `Participe da cápsula “${title}”! Use o código de convite ${inviteCode} no app.${deadline}`;
}

export function InviteCodeCard({ title, inviteCode, contributionDeadline, onDone }: InviteCodeCardProps) {
  const toast = useToast();

  async function handleShare() {
    try {
      await Share.share({ message: buildInviteMessage(title, inviteCode, contributionDeadline) });
    } catch {
      toast.error('Não foi possível compartilhar o código');
    }
  }

  async function handleCopy() {
    try {
      await Clipboard.setStringAsync(inviteCode);
      toast.success('Código copiado');
    } catch {
      toast.error('Não foi possível copiar o código');
    }
  }

  return (
    <ShadowBox offset={8} backgroundColor={colors.yellow} style={styles.card}>
      <Text style={styles.heading} accessibilityRole="header">Cápsula em grupo criada!</Text>
      <Text style={styles.body}>
        Compartilhe o código abaixo para outras pessoas entrarem em <Text style={styles.strong}>“{title}”</Text>.
      </Text>

      <View style={styles.code} accessible accessibilityLabel={`Código de convite: ${inviteCode.split('').join(' ')}`}>
        <Text style={styles.codeText} selectable>{inviteCode}</Text>
      </View>

      {contributionDeadline && (
        <Text style={styles.body}>
          Contribuições abertas até <Text style={styles.strong}>{formatDateTime(contributionDeadline)}</Text>.
        </Text>
      )}

      <View style={styles.actions}>
        <Button icon="send" onPress={() => void handleShare()}>Compartilhar</Button>
        <Button variant="secondary" icon="copy" onPress={() => void handleCopy()}>Copiar</Button>
      </View>
      <Button variant="ghost" onPress={onDone}>Concluir</Button>
    </ShadowBox>
  );
}

const styles = StyleSheet.create({
  card: { gap: 16, padding: 20 },
  heading: { color: colors.ink, fontFamily: fonts.display, fontSize: 20, textTransform: 'uppercase' },
  body: { color: colors.ink, fontFamily: fonts.bodyMedium, fontSize: 14.8, lineHeight: 22 },
  strong: { fontFamily: fonts.bodyBold },
  code: {
    alignItems: 'center',
    paddingVertical: 16,
    borderWidth: stroke,
    borderColor: colors.ink,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
  },
  codeText: { color: colors.ink, fontFamily: fonts.display, fontSize: 32, letterSpacing: 6 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
