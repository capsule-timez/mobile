import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, strokeThin } from '../theme/tokens';
import { formatDateTimeInput, parseDateTimeInput } from '../utils/capsuleValidation';
import { formatDateTimeFromDate } from '../utils/formatDate';
import { Button } from './Button';
import { FieldFrame, FormField, fieldInputStyle } from './FormField';
import { Icon } from './Icon';

interface DateTimeFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  minimumDate: Date;
  error?: string;
  hint?: string;
}

export function DateTimeField({ label, value, onChange, minimumDate, error, hint }: DateTimeFieldProps) {
  const [iosOpen, setIosOpen] = useState(false);
  const [webText, setWebText] = useState(value ? formatDateTimeInput(value) : '');

  useEffect(() => {
    if (Platform.OS === 'web') setWebText(value ? formatDateTimeInput(value) : '');
  }, [value]);

  if (Platform.OS === 'web') {
    return (
      <FormField
        label={label}
        value={webText}
        onChangeText={(text) => {
          setWebText(text);
          const parsed = parseDateTimeInput(text);
          if (parsed) onChange(parsed);
        }}
        placeholder="AAAA-MM-DD HH:mm"
        hint={hint ?? 'Use o formato AAAA-MM-DD HH:mm'}
        error={error}
        autoCapitalize="none"
        autoCorrect={false}
      />
    );
  }

  function openAndroid() {
    const base = value ?? minimumDate;
    DateTimePickerAndroid.open({
      value: base,
      mode: 'date',
      minimumDate,
      onValueChange: (_event, pickedDate) => {
        DateTimePickerAndroid.open({
          value: pickedDate,
          mode: 'time',
          is24Hour: true,
          onValueChange: (_timeEvent, pickedTime) => {
            const result = new Date(pickedDate);
            result.setHours(pickedTime.getHours(), pickedTime.getMinutes(), 0, 0);
            onChange(result);
          },
        });
      },
    });
  }

  function toggleIos() {
    if (!iosOpen && !value) onChange(minimumDate);
    setIosOpen((open) => !open);
  }

  const display = value ? formatDateTimeFromDate(value) : null;

  return (
    <View style={styles.wrapper}>
      <FieldFrame label={label} error={error} hint={hint} focused={iosOpen}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${display ?? 'não definida'}`}
          accessibilityHint="Abre o seletor de data e hora"
          onPress={Platform.OS === 'android' ? openAndroid : toggleIos}
          style={styles.trigger}
        >
          <Text style={[styles.value, !display && styles.placeholder]} numberOfLines={2}>
            {display ?? 'Toque para escolher'}
          </Text>
          <Icon name="calendar" size={20} />
        </Pressable>
      </FieldFrame>

      {Platform.OS === 'ios' && iosOpen && (
        <View style={styles.iosPicker}>
          <DateTimePicker
            value={value ?? minimumDate}
            mode="datetime"
            display="spinner"
            minimumDate={minimumDate}
            locale="pt-BR"
            themeVariant="light"
            onValueChange={(_event, date) => onChange(date)}
          />
          <Button size="sm" variant="dark" onPress={() => setIosOpen(false)}>Concluir</Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 12 },
  trigger: { ...fieldInputStyle, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  value: { flex: 1, color: colors.ink, fontFamily: fonts.bodyMedium, fontSize: 16 },
  placeholder: { color: colors.placeholder, fontFamily: fonts.body },
  iosPicker: {
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: strokeThin,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
  },
});
