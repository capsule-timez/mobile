import { useRouter } from 'expo-router';
import { useRef, useState, type PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type TextInput,
} from 'react-native';
import { useUser } from '../../src/auth/AuthProvider';
import { Alert } from '../../src/components/Alert';
import { AppShell } from '../../src/components/AppShell';
import { Button } from '../../src/components/Button';
import { DateTimeField } from '../../src/components/DateTimeField';
import { FormField } from '../../src/components/FormField';
import { Icon, type IconName } from '../../src/components/Icon';
import { PageHeader } from '../../src/components/PageHeader';
import { PopIn } from '../../src/components/PopIn';
import { ShadowBox } from '../../src/components/ShadowBox';
import { useToast } from '../../src/components/Toast';
import { createCapsule, getApiErrorDetails } from '../../src/services/capsules';
import { colors, contentMaxWidth, fonts, stroke, strokeThin } from '../../src/theme/tokens';
import {
  SCHEDULE_PRESETS,
  TEXT_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  applySchedulePreset,
  getMinScheduleDate,
  validateCapsuleForm,
  validateScheduleDate,
  type CapsuleFormErrors,
  type CapsuleFormField,
  type CapsuleFormValues,
  type RecipientMode,
} from '../../src/utils/capsuleValidation';
import { formatDateTimeFromDate, formatRelativeTime } from '../../src/utils/formatDate';

const INITIAL_VALUES: CapsuleFormValues = {
  title: '',
  text: '',
  scheduleDate: null,
  recipientMode: 'self',
  recipientEmail: '',
};

type Step = 1 | 2 | 3;

const FIELD_ORDER: CapsuleFormField[] = ['title', 'text', 'scheduleDate', 'recipientEmail'];
const FIELD_STEP: Record<CapsuleFormField, Step> = { title: 1, text: 1, scheduleDate: 2, recipientEmail: 3 };

const RECIPIENT_OPTIONS: { mode: RecipientMode; label: string; description: string; icon: IconName }[] = [
  { mode: 'self', label: 'Para mim', description: 'Chega no seu e-mail', icon: 'user' },
  { mode: 'other', label: 'Para outra pessoa', description: 'Escolha o destinatário', icon: 'send' },
];

function StepCard({
  number,
  title,
  highlight = false,
  delay,
  onLayout,
  children,
}: PropsWithChildren<{ number: Step; title: string; highlight?: boolean; delay: number; onLayout: (event: LayoutChangeEvent) => void }>) {
  return (
    <PopIn delay={delay} onLayout={onLayout}>
      <ShadowBox
        offset={8}
        backgroundColor={highlight ? colors.yellow : colors.surface}
        style={styles.step}
      >
        <View style={styles.stepTitle} accessibilityRole="header">
          <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View>
          <Text style={styles.stepTitleText}>{title}</Text>
        </View>
        {children}
      </ShadowBox>
    </PopIn>
  );
}

export default function NovaCapsulaScreen() {
  const router = useRouter();
  const user = useUser();
  const toast = useToast();
  const [values, setValues] = useState<CapsuleFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<CapsuleFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const scrollRef = useRef<ScrollView>(null);
  const titleRef = useRef<TextInput>(null);
  const textRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const stepY = useRef<Partial<Record<Step, number>>>({});

  // Recalculada a cada renderização: o mínimo avança junto com o relógio.
  const minScheduleDate = getMinScheduleDate();
  const scheduleError = errors.scheduleDate;
  const schedulePreview = values.scheduleDate && !scheduleError && !validateScheduleDate(values.scheduleDate)
    ? values.scheduleDate.toISOString()
    : null;

  function clearError(field: CapsuleFormField) {
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }

  function setScheduleDate(date: Date) {
    setValues((current) => ({ ...current, scheduleDate: date }));
    // Data no passado é sinalizada assim que escolhida, sem esperar o envio.
    setErrors((current) => ({ ...current, scheduleDate: validateScheduleDate(date) }));
  }

  function handleRecipientModeChange(mode: RecipientMode) {
    setValues((current) => ({ ...current, recipientMode: mode }));
    clearError('recipientEmail');
  }

  function focusFirstError(fieldErrors: CapsuleFormErrors) {
    const first = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (!first) return;
    const y = stepY.current[FIELD_STEP[first]];
    if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(y - 16, 0), animated: true });
    if (first === 'title') titleRef.current?.focus();
    else if (first === 'text') textRef.current?.focus();
    else if (first === 'recipientEmail') emailRef.current?.focus();
  }

  // As abas ficam montadas: limpa o rascunho ao sair, para a próxima cápsula começar em branco.
  function leave() {
    setValues(INITIAL_VALUES);
    setErrors({});
    setFormError(null);
    router.navigate('/(app)/index');
  }

  async function handleSubmit() {
    if (submittingRef.current) return;
    setFormError(null);

    const validationErrors = validateCapsuleForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      focusFirstError(validationErrors);
      return;
    }

    const recipientEmail = values.recipientMode === 'self' ? (user?.email ?? '') : values.recipientEmail.trim();
    if (!recipientEmail || !values.scheduleDate) {
      setFormError('Não foi possível identificar o destinatário. Entre novamente.');
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const capsule = await createCapsule({
        title: values.title.trim(),
        text: values.text.trim(),
        recipientEmail,
        scheduleDate: values.scheduleDate.toISOString(),
      });
      toast.success('Cápsula agendada!', {
        description: `“${capsule.title}” será entregue ${formatRelativeTime(capsule.scheduleDate)}.`,
      });
      leave();
    } catch (error) {
      const details = getApiErrorDetails(error);

      if (details.code === 'VALIDATION_ERROR' && Object.keys(details.fieldErrors).length > 0) {
        const apiErrors: CapsuleFormErrors = {};
        for (const field of FIELD_ORDER) {
          if (details.fieldErrors[field]) apiErrors[field] = details.fieldErrors[field];
        }
        setErrors(apiErrors);
        focusFirstError(apiErrors);
        setFormError('Revise os campos destacados.');
      } else if (details.code === 'UNAUTHORIZED' || details.code === 'TOKEN_EXPIRED') {
        // A sessão já foi encerrada pelo cliente HTTP; o app volta ao login.
        setFormError('Sessão inválida ou expirada. Faça login novamente.');
      } else {
        setFormError(details.message);
        toast.error('Não foi possível criar a cápsula', { description: details.message });
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const trackStep = (step: Step) => (event: LayoutChangeEvent) => {
    stepY.current[step] = event.nativeEvent.layout.y;
  };

  return (
    <AppShell>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.content, { paddingBottom: 32 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <PopIn>
            <PageHeader
              title="Nova cápsula"
              description="Escreva hoje, entregue no futuro. Ela fica lacrada até o momento escolhido."
            />
          </PopIn>

          {formError && <Alert tone="error">{formError}</Alert>}

          <StepCard number={1} title="Escreva a mensagem" delay={0} onLayout={trackStep(1)}>
            <FormField
              label="Título"
              counter={`${values.title.length}/${TITLE_MAX_LENGTH}`}
              inputRef={titleRef}
              value={values.title}
              onChangeText={(title) => { setValues((current) => ({ ...current, title })); clearError('title'); }}
              maxLength={TITLE_MAX_LENGTH}
              placeholder="Para mim daqui a um ano"
              error={errors.title}
              editable={!submitting}
              returnKeyType="next"
              onSubmitEditing={() => textRef.current?.focus()}
              submitBehavior="submit"
            />
            <FormField
              label="Mensagem"
              counter={`${values.text.length.toLocaleString('pt-BR')}/${TEXT_MAX_LENGTH.toLocaleString('pt-BR')}`}
              inputRef={textRef}
              value={values.text}
              onChangeText={(text) => { setValues((current) => ({ ...current, text })); clearError('text'); }}
              maxLength={TEXT_MAX_LENGTH}
              multiline
              placeholder="O que você quer dizer ao futuro?"
              error={errors.text}
              editable={!submitting}
            />
          </StepCard>

          <StepCard number={2} title="Quando entregar?" highlight delay={80} onLayout={trackStep(2)}>
            <View style={styles.presets} accessibilityRole="toolbar" accessibilityLabel="Atalhos de data">
              {SCHEDULE_PRESETS.map((preset) => (
                <Pressable
                  key={preset.label}
                  accessibilityRole="button"
                  disabled={submitting}
                  onPress={() => setScheduleDate(applySchedulePreset(preset.apply))}
                >
                  {({ pressed }) => (
                    <ShadowBox
                      offset={3}
                      shadowVisible={!pressed}
                      backgroundColor={pressed ? colors.orange : colors.surface}
                      style={[styles.preset, pressed && styles.presetPressed]}
                    >
                      <Text style={styles.presetText}>{preset.label}</Text>
                    </ShadowBox>
                  )}
                </Pressable>
              ))}
            </View>
            <DateTimeField
              label="Data e hora de entrega"
              value={values.scheduleDate}
              onChange={setScheduleDate}
              minimumDate={minScheduleDate}
              error={scheduleError}
            />
            {schedulePreview && (
              <PopIn key={schedulePreview} duration={180}>
                <View style={styles.preview}>
                  <View style={styles.previewIcon}><Icon name="lock" size={16} color={colors.surface} /></View>
                  <Text style={styles.previewText}>
                    Lacrada até <Text style={styles.previewStrong}>{formatDateTimeFromDate(new Date(schedulePreview))}</Text>
                    {' '}({formatRelativeTime(schedulePreview)})
                  </Text>
                </View>
              </PopIn>
            )}
          </StepCard>

          <StepCard number={3} title="Para quem?" delay={160} onLayout={trackStep(3)}>
            <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel="Destinatário">
              {RECIPIENT_OPTIONS.map((option) => {
                const selected = values.recipientMode === option.mode;
                return (
                  <Pressable
                    key={option.mode}
                    accessibilityRole="radio"
                    accessibilityState={{ selected, checked: selected, disabled: submitting }}
                    accessibilityLabel={`${option.label}. ${option.description}`}
                    disabled={submitting}
                    onPress={() => handleRecipientModeChange(option.mode)}
                  >
                    {({ pressed }) => (
                      <ShadowBox
                        offset={4}
                        shadowVisible={selected}
                        backgroundColor={selected ? colors.orange : pressed ? colors.yellowSoft : colors.surface}
                        style={[styles.option, selected && styles.optionSelected]}
                      >
                        <View style={[styles.optionIcon, selected && { backgroundColor: colors.ink }]}>
                          <Icon name={option.icon} size={20} color={selected ? colors.orange : colors.ink} />
                        </View>
                        <View style={styles.optionText}>
                          <Text style={styles.optionLabel}>{option.label}</Text>
                          <Text style={styles.optionDescription}>{option.description}</Text>
                        </View>
                      </ShadowBox>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {values.recipientMode === 'self' ? (
              <View style={styles.self}>
                <View style={styles.selfIcon}><Icon name="mail" size={16} /></View>
                <Text style={styles.selfText}>
                  Será entregue em <Text style={styles.selfStrong}>{user?.email}</Text>
                </Text>
              </View>
            ) : (
              <FormField
                label="E-mail do destinatário"
                inputRef={emailRef}
                value={values.recipientEmail}
                onChangeText={(recipientEmail) => { setValues((current) => ({ ...current, recipientEmail })); clearError('recipientEmail'); }}
                placeholder="pessoa@exemplo.com"
                error={errors.recipientEmail}
                editable={!submitting}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                maxLength={254}
                returnKeyType="done"
                onSubmitEditing={() => void handleSubmit()}
              />
            )}
          </StepCard>

          <View style={styles.actions}>
            <Button variant="ghost" onPress={leave} disabled={submitting}>Cancelar</Button>
            <Button icon="lock" loading={submitting} onPress={() => void handleSubmit()}>
              {submitting ? 'Lacrando…' : 'Lacrar cápsula'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', gap: 32, paddingHorizontal: 16, paddingTop: 24 },
  step: { gap: 20, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 20 },
  stepTitle: {
    position: 'absolute',
    top: -18,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    backgroundColor: colors.paper,
  },
  stepNumber: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    borderWidth: stroke,
    borderColor: colors.ink,
    backgroundColor: colors.orange,
  },
  stepNumberText: { color: colors.ink, fontFamily: fonts.display, fontSize: 14 },
  stepTitleText: { color: colors.ink, fontFamily: fonts.display, fontSize: 18.4, textTransform: 'uppercase' },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  preset: { paddingVertical: 6, paddingHorizontal: 13, minHeight: 38, justifyContent: 'center' },
  presetPressed: { transform: [{ translateX: 3 }, { translateY: 3 }] },
  presetText: {
    color: colors.ink,
    fontFamily: fonts.bodyBold,
    fontSize: 12.8,
    letterSpacing: 0.51,
    textTransform: 'uppercase',
  },
  preview: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: colors.ink },
  previewIcon: { marginTop: 3 },
  previewText: { flex: 1, color: colors.surface, fontFamily: fonts.bodyMedium, fontSize: 14.8, lineHeight: 22 },
  previewStrong: { color: colors.yellow, fontFamily: fonts.bodyBold },
  options: { gap: 12 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  optionSelected: { transform: [{ translateX: -2 }, { translateY: -2 }] },
  optionIcon: { padding: 7, borderWidth: strokeThin, borderColor: colors.ink, backgroundColor: colors.paper },
  optionText: { flex: 1 },
  optionLabel: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 16, textTransform: 'uppercase' },
  optionDescription: { color: colors.ink, fontFamily: fonts.bodyMedium, fontSize: 13.6 },
  self: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  selfIcon: { marginTop: 3 },
  selfText: { flex: 1, color: colors.ink, fontFamily: fonts.bodyMedium, fontSize: 14.8, lineHeight: 22 },
  selfStrong: { fontFamily: fonts.bodyBold },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 16 },
});
