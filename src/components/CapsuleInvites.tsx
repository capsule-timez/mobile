import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getApiErrorDetails } from '../services/capsules';
import { listInvites, sendInvites, type CapsuleInvite } from '../services/invites';
import { colors, fonts } from '../theme/tokens';
import { Button } from './Button';
import { Card } from './Card';
import { FormField } from './FormField';
import { useToast } from './Toast';

const statusLabels: Readonly<Record<string, string>> = {
  PENDING: 'Pendente',
  ACCEPTED: 'Aceito',
  EXPIRED: 'Expirado',
};

export function CapsuleInvites({ capsuleId }: { capsuleId: string }) {
  const toast = useToast();
  const [input, setInput] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [invites, setInvites] = useState<CapsuleInvite[]>();
  const [listError, setListError] = useState<string>();
  const [sending, setSending] = useState(false);
  const submitting = useRef(false);
  const request = useRef<AbortController | null>(null);
  const focused = useRef(false);

  const load = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setListError(undefined);
    try {
      const result = await listInvites(capsuleId, controller.signal);
      if (!controller.signal.aborted) setInvites(result);
    } catch (error) {
      if (!controller.signal.aborted) setListError(getApiErrorDetails(error).message);
    }
  }, [capsuleId]);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    void load();
    return () => {
      focused.current = false;
      request.current?.abort();
    };
  }, [load]));

  async function submit() {
    if (submitting.current) return;
    const emails = [...new Set(input.toLowerCase().split(/[\s,;]+/).filter(Boolean))];
    if (!emails.length || emails.some((email) => email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      setFieldError('Informe um ou mais e-mails válidos.');
      return;
    }

    submitting.current = true;
    setSending(true);
    setFieldError(undefined);
    try {
      await sendInvites(capsuleId, emails);
      setInput('');
      toast.success('Convites enviados!');
      if (focused.current) await load();
    } catch (error) {
      toast.error('Não foi possível enviar os convites', { description: getApiErrorDetails(error).message });
    } finally {
      submitting.current = false;
      setSending(false);
    }
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.heading} accessibilityRole="header">Convidar por e-mail</Text>
      <FormField
        label="E-mails"
        hint="Separe os endereços por vírgula, espaço ou quebra de linha."
        value={input}
        onChangeText={(value) => { setInput(value); setFieldError(undefined); }}
        error={fieldError}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!sending}
        multiline
      />
      <Button loading={sending} onPress={() => void submit()}>Enviar convites</Button>
      <Text style={styles.heading} accessibilityRole="header">Convites enviados</Text>
      {listError && (
        <View style={styles.card}>
          <Text style={styles.text} accessibilityRole="alert">{listError}</Text>
          <Button variant="secondary" size="sm" onPress={() => void load()}>Atualizar convites</Button>
        </View>
      )}
      {!invites && !listError && <Text style={styles.text}>Carregando convites…</Text>}
      {invites?.length === 0 && !listError && <Text style={styles.text}>Nenhum convite enviado.</Text>}
      {invites?.map((invite) => (
        <View key={invite.id}>
          <Text style={styles.text}>{invite.email}</Text>
          <Text style={styles.status}>{Object.hasOwn(statusLabels, invite.status) ? statusLabels[invite.status] : invite.status}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  heading: { color: colors.ink, fontFamily: fonts.display, fontSize: 20 },
  text: { color: colors.ink, fontFamily: fonts.bodyMedium, fontSize: 16 },
  status: { color: colors.muted, fontFamily: fonts.bodyMedium, fontSize: 14 },
});
