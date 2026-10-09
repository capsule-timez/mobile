import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthProvider';
import { validateAuth } from '../auth/validation';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const registering = mode === 'register';
  const { authenticate } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
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
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível continuar. Tente novamente.');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.content}>
            <Text style={styles.brand}>CÁPSULA</Text>
            <Text style={styles.title} accessibilityRole="header">{registering ? 'Comece sua história' : 'Que bom ter você aqui'}</Text>
            <Text style={styles.subtitle}>{registering ? 'Crie sua conta para guardar mensagens para o futuro.' : 'Entre para encontrar suas cápsulas e criar novas memórias.'}</Text>
            <View style={styles.form}>
              {registering && <View style={styles.field}>
                <Text style={styles.label}>Nome</Text>
                <TextInput accessibilityLabel="Nome" style={styles.input} value={name} onChangeText={setName}
                  editable={!busy} placeholder="Como você se chama?" placeholderTextColor="#74747c"
                  autoComplete="name" textContentType="name" maxLength={100} returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()} submitBehavior="submit" />
              </View>}
              <View style={styles.field}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput ref={emailRef} accessibilityLabel="E-mail" style={styles.input} value={email} onChangeText={setEmail}
                  editable={!busy} placeholder="voce@exemplo.com" placeholderTextColor="#74747c"
                  keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email"
                  textContentType="emailAddress" maxLength={254} returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()} submitBehavior="submit" />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Senha</Text>
                <TextInput ref={passwordRef} accessibilityLabel="Senha" style={styles.input} value={password} onChangeText={setPassword}
                  editable={!busy} placeholder={registering ? 'Pelo menos 8 caracteres' : 'Sua senha'}
                  placeholderTextColor="#74747c" secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false}
                  autoComplete={registering ? 'new-password' : 'current-password'}
                  textContentType={registering ? 'newPassword' : 'password'} returnKeyType={registering ? 'next' : 'go'}
                  submitBehavior={registering ? 'submit' : 'blurAndSubmit'}
                  onSubmitEditing={() => registering ? confirmationRef.current?.focus() : void submit()} />
              </View>
              {registering && <View style={styles.field}>
                <Text style={styles.label}>Confirmar senha</Text>
                <TextInput ref={confirmationRef} accessibilityLabel="Confirmar senha" style={styles.input}
                  value={confirmation} onChangeText={setConfirmation} editable={!busy} placeholder="Repita sua senha"
                  placeholderTextColor="#74747c" secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false}
                  autoComplete="new-password" textContentType="newPassword" returnKeyType="go"
                  onSubmitEditing={() => void submit()} />
              </View>}
              <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
                onPress={() => setVisible(!visible)} style={styles.toggle}>
                <Text style={styles.link}>{visible ? 'Ocultar senha' : 'Mostrar senha'}</Text>
              </Pressable>
              {error && <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">{error}</Text>}
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }}
                disabled={busy} onPress={() => void submit()} style={[styles.button, busy && styles.disabled]}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{registering ? 'Criar conta' : 'Entrar'}</Text>}
              </Pressable>
              <View style={styles.switch}>
                <Text style={styles.subtitle}>{registering ? 'Já tem uma conta?' : 'Ainda não tem conta?'}</Text>
                <Link href={registering ? '/login' : '/cadastro'} replace asChild>
                  <Pressable disabled={busy} accessibilityRole="link" style={styles.switchLink}>
                    <Text style={styles.link}>{registering ? 'Entrar' : 'Cadastre-se'}</Text>
                  </Pressable>
                </Link>
              </View>
              {Platform.OS === 'web' && <Text style={styles.webNote}>No navegador, sua sessão dura até fechar ou recarregar esta página.</Text>}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f7' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 36 },
  content: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  brand: { color: '#5950b5', fontSize: 14, fontWeight: '700', letterSpacing: 3, marginBottom: 24 },
  title: { color: '#1c1c1e', fontSize: 30, fontWeight: '700', marginBottom: 12 },
  subtitle: { color: '#61616b', fontSize: 15, lineHeight: 22 },
  form: { marginTop: 28, gap: 16 },
  field: { gap: 8 },
  label: { color: '#1c1c1e', fontSize: 14, fontWeight: '600' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d6d6df', borderRadius: 12, padding: 14, fontSize: 16, color: '#1c1c1e', minHeight: 50 },
  toggle: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  link: { color: '#5145a5', fontSize: 15, fontWeight: '600' },
  error: { color: '#a31d30', backgroundColor: '#ffebee', padding: 14, borderRadius: 10, lineHeight: 21 },
  button: { minHeight: 52, justifyContent: 'center', alignItems: 'center', padding: 14, backgroundColor: '#5145a5', borderRadius: 12 },
  disabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  switch: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  switchLink: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  webNote: { fontSize: 13, color: '#61616b', textAlign: 'center', lineHeight: 19 },
});
