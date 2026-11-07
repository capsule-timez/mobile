import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { AppShell } from '../../src/components/AppShell';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { FormField } from '../../src/components/FormField';
import { PageHeader } from '../../src/components/PageHeader';
import { PopIn } from '../../src/components/PopIn';
import { useToast } from '../../src/components/Toast';
import { getApiErrorDetails, joinCapsule } from '../../src/services/capsules';
import { contentMaxWidth } from '../../src/theme/tokens';
import { INVITE_CODE_MAX_LENGTH, validateInviteCode } from '../../src/utils/inviteCode';

export default function EntrarComCodigoScreen() {
  const router = useRouter();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  // As telas ficam montadas: limpa o campo ao sair, para a próxima visita começar em branco.
  useFocusEffect(
    useCallback(() => () => {
      setCode('');
      setError(undefined);
    }, []),
  );

  async function handleSubmit() {
    if (submittingRef.current) return;

    const validationError = validateInviteCode(code);
    if (validationError) {
      setError(validationError);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const capsule = await joinCapsule(code);
      toast.success('Você entrou na cápsula!', { description: `“${capsule.title}” agora aparece nas suas cápsulas.` });
      router.replace({ pathname: '/capsula/[id]', params: { id: capsule.id } });
    } catch (failure) {
      const details = getApiErrorDetails(failure);
      if (details.code === 'UNAUTHORIZED' || details.code === 'TOKEN_EXPIRED') {
        // A sessão já foi encerrada pelo cliente HTTP; o app volta ao login.
        setError('Sessão inválida ou expirada. Faça login novamente.');
      } else {
        // Código inexistente (404) ou prazo encerrado (409): a API explica o motivo.
        setError(details.fieldErrors.inviteCode ?? details.message);
        toast.error('Não foi possível entrar na cápsula', { description: details.message });
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Button variant="ghost" size="sm" onPress={() => router.navigate('/')} disabled={submitting}>
            Voltar para cápsulas
          </Button>

          <PopIn>
            <PageHeader
              title="Entrar com código"
              description="Recebeu um código de convite? Use-o para participar de uma cápsula em grupo."
            />
          </PopIn>

          <PopIn delay={80}>
            <Card style={styles.card}>
              <FormField
                label="Código de convite"
                value={code}
                onChangeText={(text) => { setCode(text); setError(undefined); }}
                placeholder="Ex.: K7Q2ZX"
                error={error}
                editable={!submitting}
                autoCapitalize="characters"
                autoCorrect={false}
                autoComplete="off"
                maxLength={INVITE_CODE_MAX_LENGTH}
                returnKeyType="go"
                onSubmitEditing={() => void handleSubmit()}
              />
              <View style={styles.actions}>
                <Button icon="users" loading={submitting} onPress={() => void handleSubmit()}>
                  {submitting ? 'Entrando…' : 'Entrar'}
                </Button>
              </View>
            </Card>
          </PopIn>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    gap: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  card: { gap: 16 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
});
