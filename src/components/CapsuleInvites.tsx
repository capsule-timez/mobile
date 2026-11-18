import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getApiErrorDetails } from '../services/capsules';
import { listInvites, sendInvites, type CapsuleInvite, type InviteResult } from '../services/invites';
import { colors, fonts, strokeThin } from '../theme/tokens';
import type { Capsule } from '../types/capsule';
import { isContributionOpen } from '../utils/capsuleGroup';
import { formatDateTime } from '../utils/formatDate';
import { MAX_INVITES_PER_REQUEST, parseInviteEmails, validateInviteEmails } from '../utils/inviteEmails';
import { Badge, type BadgeTone } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { FormField } from './FormField';
import { useToast } from './Toast';

const STATUS_BADGES: Readonly<Record<string, { label: string; tone: BadgeTone }>> = {
  PENDING: { label: 'Pendente', tone: 'warning' },
  ACCEPTED: { label: 'Aceito', tone: 'success' },
  EXPIRED: { label: 'Expirado', tone: 'neutral' },
};

function emailsOf(results: InviteResult[], result: InviteResult['result']) {
  return results.filter((item) => item.result === result).map((item) => item.email);
}

interface CapsuleInvitesProps {
  capsule: Pick<Capsule, 'id' | 'status' | 'contributionDeadline'>;
}

export function CapsuleInvites({ capsule }: CapsuleInvitesProps) {
  const toast = useToast();
  const [input, setInput] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [invites, setInvites] = useState<CapsuleInvite[]>();
  const [listError, setListError] = useState<string>();
  const [sending, setSending] = useState(false);
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  const submitting = useRef(false);
  const request = useRef<AbortController | null>(null);
  const focused = useRef(false);
  const isOpen = !deadlinePassed && isContributionOpen(capsule);

  const load = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setListError(undefined);
    try {
      const result = await listInvites(capsule.id, controller.signal);
      if (!controller.signal.aborted) setInvites(result);
    } catch (error) {
      if (!controller.signal.aborted) setListError(getApiErrorDetails(error).message);
    }
  }, [capsule.id]);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    void load();
    return () => {
      focused.current = false;
      request.current?.abort();
    };
  }, [load]));

  function reportResults(results: InviteResult[]) {
    const sent = emailsOf(results, 'SENT');
    const failed = emailsOf(results, 'EMAIL_FAILED');
    const members = emailsOf(results, 'ALREADY_MEMBER');
    const membersNote = members.length
      ? `${members.join(', ')} já ${members.length === 1 ? 'participa' : 'participam'} da cápsula.`
      : undefined;

    if (sent.length) {
      toast.success(sent.length === 1 ? 'Convite enviado!' : `${sent.length} convites enviados!`, { description: membersNote });
    } else if (!failed.length && membersNote) {
      toast.info('Nenhum convite novo', { description: membersNote });
    }
    if (failed.length) {
      toast.error(`Não foi possível enviar ${failed.length} ${failed.length === 1 ? 'e-mail' : 'e-mails'} de convite`, {
        description: `O convite para ${failed.join(', ')} ficou registrado. Tente enviar de novo mais tarde.`,
      });
    }
  }

  async function submit() {
    if (submitting.current) return;
    const emails = parseInviteEmails(input);
    const error = validateInviteEmails(emails);
    if (error) {
      setFieldError(error);
      return;
    }

    submitting.current = true;
    setSending(true);
    setFieldError(undefined);
    try {
      reportResults(await sendInvites(capsule.id, emails));
      setInput('');
      if (focused.current) await load();
    } catch (failure) {
      const { code, message, fieldErrors } = getApiErrorDetails(failure);
      if (code === 'CONTRIBUTION_DEADLINE_PASSED') setDeadlinePassed(true);
      const emailsError = Object.entries(fieldErrors).find(([field]) => field.startsWith('emails'))?.[1];
      setFieldError(emailsError);
      toast.error('Não foi possível enviar os convites', { description: emailsError ?? message });
    } finally {
      submitting.current = false;
      setSending(false);
    }
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.heading} accessibilityRole="header">Convidar por e-mail</Text>
      {isOpen ? (
        <>
          <FormField
            label="E-mails"
            hint={`Separe os endereços por vírgula, espaço ou quebra de linha (até ${MAX_INVITES_PER_REQUEST} por vez). O convite vale até o prazo para contribuições.`}
            value={input}
            onChangeText={(value) => { setInput(value); setFieldError(undefined); }}
            error={fieldError}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!sending}
            multiline
          />
          <Button icon="send" loading={sending} onPress={() => void submit()}>Enviar convites</Button>
        </>
      ) : (
        <Text style={styles.text}>O prazo para entrar nesta cápsula terminou, então não é possível enviar novos convites.</Text>
      )}
      <Text style={styles.heading} accessibilityRole="header">Convites enviados</Text>
      {listError && (
        <View style={styles.card}>
          <Text style={styles.text} accessibilityRole="alert">{listError}</Text>
          <Button variant="secondary" size="sm" onPress={() => void load()}>Atualizar convites</Button>
        </View>
      )}
      {!invites && !listError && <Text style={styles.text}>Carregando convites…</Text>}
      {invites?.length === 0 && !listError && <Text style={styles.text}>Nenhum convite enviado.</Text>}
      {!listError && invites?.map((invite) => {
        const badge = STATUS_BADGES[invite.status] ?? { label: invite.status, tone: 'neutral' as const };
        return (
          <View key={invite.email} style={styles.invite}>
            <View style={styles.inviteInfo}>
              <Text style={styles.text}>{invite.email}</Text>
              {invite.sentAt && <Text style={styles.sentAt}>Enviado em {formatDateTime(invite.sentAt)}</Text>}
            </View>
            <Badge tone={badge.tone}>{badge.label}</Badge>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  heading: { color: colors.ink, fontFamily: fonts.display, fontSize: 20 },
  text: { color: colors.ink, fontFamily: fonts.bodyMedium, fontSize: 16 },
  invite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: strokeThin,
    borderTopColor: colors.ink,
  },
  inviteInfo: { flex: 1, gap: 2 },
  sentAt: { color: colors.muted, fontFamily: fonts.bodyMedium, fontSize: 13.6 },
});
