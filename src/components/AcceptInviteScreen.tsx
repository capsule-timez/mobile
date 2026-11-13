import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../auth/AuthProvider';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FormField } from '../components/FormField';
import { PageHeader } from '../components/PageHeader';
import { PaperBackground } from '../components/PaperBackground';
import { useToast } from '../components/Toast';
import { getApiErrorDetails } from '../services/capsules';
import { acceptInvite } from '../services/invites';
import { colors, contentMaxWidth, fonts } from '../theme/tokens';

export function AcceptInviteScreen({ linkToken }: { linkToken?: string }) {
  const router = useRouter();
  const user = useUser();
  const toast = useToast();
  const [input, setInput] = useState(linkToken ?? '');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const autoAttempted = useRef(false);
  const active = useRef(false);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  useEffect(() => {
    if (!user || !linkToken || autoAttempted.current) return;
    autoAttempted.current = true;
    void submit(linkToken);
  });

  async function submit(value: string) {
    const token = value.trim();
    if (!user || !token || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    try {
      const id = await acceptInvite(token);
      if (active.current) {
        toast.success('Convite aceito!');
        router.replace({ pathname: '/capsula/[id]', params: { id } });
      }
    } catch (error) {
      if (active.current) {
        toast.error('Não foi possível aceitar o convite', { description: getApiErrorDetails(error).message });
      }
    } finally {
      submitting.current = false;
      if (active.current) setBusy(false);
    }
  }

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Button variant="ghost" size="sm" onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace(user ? '/' : '/login');
          }}>Voltar</Button>
          <PageHeader title="Aceitar convite" />
          <Card style={styles.card}>
            {user ? (
              <>
                <FormField
                  label="Token do convite"
                  value={input}
                  onChangeText={setInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!busy}
                  returnKeyType="go"
                  onSubmitEditing={() => void submit(input)}
                />
                <Button loading={busy} disabled={!input.trim()} onPress={() => void submit(input)}>
                  Aceitar convite
                </Button>
              </>
            ) : (
              <>
                <Text style={styles.text}>Entre na sua conta para aceitar o convite.</Text>
                <Button onPress={() => router.push('/login')}>Entrar</Button>
              </>
            )}
          </Card>
        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', padding: 16, gap: 24 },
  card: { gap: 16 },
  text: { color: colors.ink, fontFamily: fonts.bodyMedium, fontSize: 16 },
});
