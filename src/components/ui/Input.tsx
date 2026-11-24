import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

import { Text } from './Text';

type Props = TextInputProps & { label?: string; helper?: string; error?: string; suffix?: string };

export function Input({ label, helper, error, suffix, multiline, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="label" color="textMuted" style={styles.label}>
          {label.toUpperCase()}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          multiline ? styles.multiline : null,
          focused ? styles.focused : null,
          error ? styles.errored : null,
        ]}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textSubtle}
          multiline={multiline}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[styles.input, multiline ? styles.inputMultiline : null, style]}
        />
        {suffix ? (
          <Text variant="callout" color="textMuted">
            {suffix}
          </Text>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : helper ? (
        <Text variant="caption" color="textMuted">
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { marginLeft: spacing.xxs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  multiline: { alignItems: 'flex-start', paddingVertical: spacing.md },
  focused: { borderColor: colors.primary },
  errored: { borderColor: colors.danger },
  input: { flex: 1, ...typography.body, color: colors.text, paddingVertical: spacing.sm },
  inputMultiline: { minHeight: 84, textAlignVertical: 'top', paddingVertical: 0 },
});
