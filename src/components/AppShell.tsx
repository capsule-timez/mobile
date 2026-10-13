import { useState, type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useUser } from '../auth/AuthProvider';
import { colors, fonts, stroke, strokeThin } from '../theme/tokens';
import { Logo } from './Logo';
import { PaperBackground } from './PaperBackground';
import { useToast } from './Toast';

function AppHeader() {
  const user = useUser();
  const { signOut } = useAuth();
  const toast = useToast();
  const [leaving, setLeaving] = useState(false);

  async function handleLogout() {
    if (leaving) return;
    const firstName = user?.name.split(' ')[0];
    setLeaving(true);
    try {
      await signOut();
      toast.info('Você saiu da conta', { description: firstName ? `Até logo, ${firstName}!` : undefined });
    } catch (error) {
      toast.error('Não foi possível sair', { description: error instanceof Error ? error.message : undefined });
    } finally {
      setLeaving(false);
    }
  }

  return (
    <View style={styles.header}>
      <Logo />
      <View style={styles.userRow}>
        <View style={styles.avatar} accessibilityLabel={user ? `Conta de ${user.name}` : undefined}>
          <Text style={styles.avatarText}>{user?.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
          accessibilityState={{ disabled: leaving, busy: leaving }}
          disabled={leaving}
          onPress={() => void handleLogout()}
          style={({ pressed }) => [styles.logout, (pressed || leaving) && { backgroundColor: colors.red }]}
        >
          <Text style={styles.logoutText}>{leaving ? 'Saindo…' : 'Sair'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function AppShell({ children }: PropsWithChildren) {
  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppHeader />
        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: stroke,
    borderBottomColor: colors.ink,
    backgroundColor: colors.surface,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    borderWidth: stroke,
    borderColor: colors.ink,
    backgroundColor: colors.yellow,
  },
  avatarText: { color: colors.ink, fontFamily: fonts.display, fontSize: 15 },
  logout: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: strokeThin,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
  },
  logoutText: {
    color: colors.ink,
    fontFamily: fonts.bodyBold,
    fontSize: 12.8,
    letterSpacing: 0.51,
    textTransform: 'uppercase',
  },
});
