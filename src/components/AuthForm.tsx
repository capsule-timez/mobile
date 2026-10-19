import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthProvider';
import { validateAuth } from '../auth/validation';
import { colors, fonts } from '../theme/tokens';
import { Alert } from './Alert';
import { AuthCard } from './AuthCard';
import { Button } from './Button';
import { FormField } from './FormField';
import { PaperBackground } from './PaperBackground';
import { useToast } from './Toast';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const registering = mode === 'register';
  const { authenticate } = useAuth();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmationRef = useRef<TextInput>(null);

  async function submit() {
    if (submitting.current) return;
    const validation = validateAuth(mode, { name, email, password, confirmation });
    setError(validation);
    if (validation) return;
    submitting.current = true;
    setBusy(true);
    try {
      await authenticate(mode, { name: name.trim(), email: email.trim().toLowerCase(), password });
      setPassword('');
      setConfirmation('');
      toast.success(
        registering ? 'Conta criada com sucesso!' : 'Bem-vindo de volta!',
        { description: registering ? 'Que tal escrever sua primeira cápsula?' : 'Suas cápsulas estão te esperando.' },
      );
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível continuar. Tente novamente.');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <PaperBackground>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <AuthCard
              title={registering ? 'Crie sua conta' : 'Bem-vindo de volta'}
              subtitle={registering ? 'Escreva hoje, receba no futuro.' : 'Entre para acompanhar suas cápsulas do tempo.'}
              footer={
                <>
                  <Text style={styles.footerText}>{registering ? 'Já tem conta?' : 'Ainda não tem conta?'}</Text>
                  <Link href={registering ? '/login' : '/cadastro'} replace asChild>
                    <Pressable disabled={busy} accessibilityRole="link" hitSlop={8}>
                      <Text style={styles.link}>{registering ? 'Fazer login' : 'Criar conta'}</Text>
                    </Pressable>
                  </Link>
                </>
              }
            >
              {error && <Alert tone="error">{error}</Alert>}
              {registering && (
                <FormField
                  label="Nome"
                  value={name}
                  onChangeText={setName}
                  editable={!busy}
                  placeholder="Como você se chama?"
                  autoComplete="name"
                  textContentType="name"
                  maxLength={100}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  submitBehavior="submit"
                />
              )}
              <FormField
                label="E-mail"
                inputRef={emailRef}
                value={email}
                onChangeText={setEmail}
                editable={!busy}
                placeholder="voce@exemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                maxLength={254}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                submitBehavior="submit"
              />
              <FormField
                label="Senha"
                inputRef={passwordRef}
                value={password}
                onChangeText={setPassword}
                editable={!busy}
                placeholder={registering ? 'Pelo menos 8 caracteres' : 'Sua senha'}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={registering ? 'new-password' : 'current-password'}
                textContentType={registering ? 'newPassword' : 'password'}
                returnKeyType={registering ? 'next' : 'go'}
                submitBehavior={registering ? 'submit' : 'blurAndSubmit'}
                onSubmitEditing={() => (registering ? confirmationRef.current?.focus() : void submit())}
              />
              {registering && (
                <FormField
                  label="Confirmar senha"
                  inputRef={confirmationRef}
                  value={confirmation}
                  onChangeText={setConfirmation}
                  editable={!busy}
                  placeholder="Repita sua senha"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="go"
                  onSubmitEditing={() => void submit()}
                />
              )}
              <Button fullWidth loading={busy} onPress={() => void submit()}>
                {busy ? (registering ? 'Criando conta…' : 'Entrando…') : registering ? 'Criar conta' : 'Entrar'}
              </Button>
              {Platform.OS === 'web' && (
                <Text style={styles.webNote}>No navegador, sua sessão dura até fechar ou recarregar esta página.</Text>
              )}
            </AuthCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 36, paddingLeft: 20, paddingRight: 28 },
  footerText: { color: colors.ink, fontFamily: fonts.bodyMedium, fontSize: 14.4 },
  link: {
    color: colors.ink,
    fontFamily: fonts.bodyBold,
    fontSize: 14.4,
    textDecorationLine: 'underline',
  },
  webNote: { color: colors.muted, fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
