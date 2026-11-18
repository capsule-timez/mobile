import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getApiErrorDetails, updateCapsule } from '../services/capsules';
import { colors, fonts } from '../theme/tokens';
import type { Capsule } from '../types/capsule';
import { capsuleChanges } from '../utils/capsuleEdit';
import {
  TEXT_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  getMinScheduleDate,
  validateCapsuleEdit,
  type CapsuleEditValues,
  type CapsuleFormErrors,
} from '../utils/capsuleValidation';
import { Alert } from './Alert';
import { Button } from './Button';
import { Card } from './Card';
import { DateTimeField } from './DateTimeField';
import { FormField } from './FormField';
import { useToast } from './Toast';

const FIELDS = ['title', 'text', 'recipientEmail', 'scheduleDate'] as const;

interface CapsuleEditFormProps {
  capsule: Capsule;
  onCancel: () => void;
  /** Chamado depois de salvar; recebe `true` quando a cápsula deixou de ser editável. */
  onDone: (notEditable?: boolean) => Promise<void> | void;
}

export function CapsuleEditForm({ capsule, onCancel, onDone }: CapsuleEditFormProps) {
  const toast = useToast();
  const [values, setValues] = useState<CapsuleEditValues>(() => ({
    title: capsule.title,
    text: capsule.text,
    recipientEmail: capsule.recipientEmail,
    scheduleDate: new Date(capsule.scheduleDate),
  }));
  const [errors, setErrors] = useState<CapsuleFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function change<K extends keyof CapsuleEditValues>(field: K, value: CapsuleEditValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function save() {
    if (saving) return;
    setFormError(null);
    const validationErrors = validateCapsuleEdit(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const input = capsuleChanges(capsule, values);
    if (Object.keys(input).length === 0) {
      onCancel();
      return;
    }

    setSaving(true);
    try {
      await updateCapsule(capsule.id, input);
      toast.success('Cápsula atualizada!');
      await onDone();
    } catch (error) {
      const details = getApiErrorDetails(error);
      if (details.code === 'CAPSULE_NOT_EDITABLE' || details.code === 'NOT_FOUND') {
        toast.error('Não foi possível salvar', { description: details.message });
        await onDone(true);
        return;
      }
      const apiErrors: CapsuleFormErrors = {};
      for (const field of FIELDS) {
        if (details.fieldErrors[field]) apiErrors[field] = details.fieldErrors[field];
      }
      if (Object.keys(apiErrors).length > 0) {
        setErrors(apiErrors);
        setFormError('Revise os campos destacados.');
      } else {
        setFormError(details.message);
      }
      setSaving(false);
    }
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.heading} accessibilityRole="header">Editar cápsula</Text>
      {formError && <Alert tone="error">{formError}</Alert>}
      <FormField
        label="Título"
        counter={`${values.title.length}/${TITLE_MAX_LENGTH}`}
        value={values.title}
        onChangeText={(value) => change('title', value)}
        maxLength={TITLE_MAX_LENGTH}
        error={errors.title}
        editable={!saving}
      />
      <FormField
        label="Mensagem"
        counter={`${values.text.length.toLocaleString('pt-BR')}/${TEXT_MAX_LENGTH.toLocaleString('pt-BR')}`}
        value={values.text}
        onChangeText={(value) => change('text', value)}
        maxLength={TEXT_MAX_LENGTH}
        multiline
        error={errors.text}
        editable={!saving}
      />
      <FormField
        label="E-mail do destinatário"
        value={values.recipientEmail}
        onChangeText={(value) => change('recipientEmail', value)}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        error={errors.recipientEmail}
        editable={!saving}
      />
      <DateTimeField
        label="Data e hora de entrega"
        value={values.scheduleDate}
        onChange={(date) => change('scheduleDate', date)}
        minimumDate={getMinScheduleDate()}
        error={errors.scheduleDate}
      />
      <View style={styles.actions}>
        <Button variant="ghost" onPress={onCancel} disabled={saving}>Cancelar</Button>
        <Button icon="check" loading={saving} onPress={() => void save()}>Salvar alterações</Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  heading: { color: colors.ink, fontFamily: fonts.display, fontSize: 22, lineHeight: 26, textTransform: 'uppercase' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 12 },
});
