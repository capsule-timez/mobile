import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../auth/AuthProvider';
import { setPendingInvite } from '../auth/pendingInvite';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FormField } from '../components/FormField';
import { PageHeader } from '../components/PageHeader';
import { PaperBackground } from '../components/PaperBackground';
import { useToast } from '../components/Toast';
import { acceptInvite, describeAcceptError } from '../services/invites';
import { colors, contentMaxWidth, fonts } from '../theme/tokens';

type Failure = { message: string; retryable: boolean };

export function AcceptInviteScreen({ linkToken }: { linkToken?: string }) {
  const router = useRouter();
  const user = useUser();
  const toast = useToast();
  const [input, setInput] = useState(linkToken ?? '');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
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
    setFailure(null);
    try {
      const id = await acceptInvite(token);
      if (active.current) {
        toast.success('Você entrou na cápsula!', { description: 'Deixe sua contribuição antes do prazo.' });
        router.replace({ pathname: '/capsula/[id]', params: { id } });
      }
    } catch (error) {
      if (active.current) setFailure(describeAcceptError(error));
    } finally {
      submitting.current = false;
      if (active.current) setBusy(false);
    }
  }

  function signIn() {
    // Ao entrar, a lista de cápsulas consome o token e volta para este convite.
    if (input.trim()) setPendingInvite(input);
    router.push('/login');
  }

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Button variant="ghost" size="sm" onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace(user ? '/' : '/login');
          }}>Voltar</Button>
          <PageHeader title={failure && !failure.retryable ? 'Convite indisponível' : 'Aceitar convite'} />
          <Card style={styles.card}>
            {failure && (
              <>
                <Alert tone="error">{failure.message}</Alert>
                {!failure.retryable && (
                  <Text style={styles.text}>Se ainda quiser participar, peça um novo convite a quem criou a cápsula.</Text>
                )}
              </>
            )}
            {user ? (
              <>
                <FormField
                  label="Token do convite"
                  hint="É o final do link recebido por e-mail, depois de /convite/."
                  value={input}
                  onChangeText={(value) => { setInput(value); setFailure(null); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!busy}
                  returnKeyType="go"
                  onSubmitEditing={() => void submit(input)}
                />
                <Button loading={busy} disabled={!input.trim()} onPress={() => void submit(input)}>
                  {failure?.retryable ? 'Tentar novamente' : 'Aceitar convite'}
                </Button>
              </>
            ) : (
              <>
                <Text style={styles.text}>Entre na sua conta para aceitar o convite. Depois do login, voltamos para ele.</Text>
                <Button onPress={signIn}>Entrar</Button>
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
