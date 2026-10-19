import { useEffect, useRef, useState, type PropsWithChildren, type Ref } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, strokeThin } from '../theme/tokens';
import { PopIn, useReducedMotion } from './PopIn';
import { ShadowBox } from './ShadowBox';

interface FieldFrameProps {
  label: string;
  error?: string;
  hint?: string;
  counter?: string;
  focused?: boolean;
}

export function FieldFrame({ label, error, hint, counter, focused = false, children }: PropsWithChildren<FieldFrameProps>) {
  const reduced = useReducedMotion();
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!error || reduced) return;
    const animation = Animated.sequence([
      Animated.timing(shake, { toValue: -5, duration: 80, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 5, duration: 80, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [error, reduced, shake]);

  const invalid = !!error;

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {counter ? <Text style={styles.counter}>{counter}</Text> : null}
      </View>

      <Animated.View style={{ transform: [{ translateX: shake }] }}>
        <ShadowBox
          offset={4}
          shadowColor={invalid ? colors.errorText : colors.ink}
          borderColor={invalid ? colors.errorText : colors.ink}
          backgroundColor={focused ? colors.yellowSoft : colors.surface}
        >
          {children}
        </ShadowBox>
      </Animated.View>

      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? (
        <PopIn duration={180}>
          <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">{error}</Text>
        </PopIn>
      ) : null}
    </View>
  );
}

interface FormFieldProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'>, Omit<FieldFrameProps, 'focused'> {
  inputRef?: Ref<TextInput>;
}

export function FormField({
  label,
  error,
  hint,
  counter,
  inputRef,
  secureTextEntry,
  multiline,
  editable = true,
  onFocus,
  onBlur,
  ...inputProps
}: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isPassword = !!secureTextEntry;

  return (
    <FieldFrame label={label} error={error} hint={hint} counter={counter} focused={focused}>
      <TextInput
        ref={inputRef}
        accessibilityLabel={label}
        accessibilityHint={hint}
        style={[
          styles.input,
          multiline && styles.multiline,
          isPassword && styles.inputWithReveal,
          !editable && styles.readonly,
        ]}
        placeholderTextColor={colors.placeholder}
        selectionColor={colors.orange}
        cursorColor={colors.ink}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        editable={editable}
        secureTextEntry={isPassword && !revealed}
        onFocus={(event) => { setFocused(true); onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); onBlur?.(event); }}
        {...inputProps}
      />
      {isPassword && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={revealed ? 'Ocultar senha' : 'Mostrar senha'}
          accessibilityState={{ selected: revealed }}
          onPress={() => setRevealed((current) => !current)}
          hitSlop={8}
          style={({ pressed }) => [styles.reveal, pressed && { backgroundColor: colors.yellow }]}
        >
          <Text style={styles.revealText}>{revealed ? 'Ocultar' : 'Mostrar'}</Text>
        </Pressable>
      )}
    </FieldFrame>
  );
}

export const fieldInputStyle = {
  minHeight: 48,
  paddingVertical: 10,
  paddingHorizontal: 14,
  fontFamily: fonts.bodyMedium,
  fontSize: 16,
  color: colors.ink,
} as const;

const styles = StyleSheet.create({
  field: { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 },
  label: {
    color: colors.ink,
    fontFamily: fonts.bodyBold,
    fontSize: 12.8,
    letterSpacing: 0.77,
    textTransform: 'uppercase',
  },
  counter: {
    paddingHorizontal: 6,
    backgroundColor: colors.ink,
    color: colors.surface,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  input: { ...fieldInputStyle },
  multiline: { minHeight: 160, paddingTop: 12, lineHeight: 25 },
  inputWithReveal: { paddingRight: 92 },
  readonly: { color: colors.muted },
  reveal: {
    position: 'absolute',
    top: '50%',
    right: 10,
    marginTop: -15,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: strokeThin,
    borderColor: colors.ink,
    backgroundColor: colors.paper,
  },
  revealText: {
    color: colors.ink,
    fontFamily: fonts.bodyBold,
    fontSize: 11.2,
    letterSpacing: 0.56,
    textTransform: 'uppercase',
  },
  hint: { color: colors.muted, fontFamily: fonts.bodyMedium, fontSize: 13 },
  error: {
    color: colors.errorText,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
