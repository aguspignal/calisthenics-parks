import { useState } from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { colors, controlSize, radius, spacing, typography } from '@/theme';

import { Text } from './text';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Shown under the field, such as a hint or a character count. */
  hint?: string;
  /** Layout overrides only (margins, flex). */
  style?: StyleProp<ViewStyle>;
};

/** Labeled text input on a `surface` background, outlined in the accent while focused. */
export function TextField({ label, hint, multiline, style, onFocus, onBlur, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <Text variant="text_bold">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        cursorColor={colors.accent}
        selectionHandleColor={colors.accent}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[styles.input, multiline && styles.multiline, focused && styles.focused]}
        {...rest}
      />
      {hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  input: {
    minHeight: controlSize.m,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.s,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: typography.text.fontFamily,
    fontSize: typography.text.fontSize,
    fontWeight: typography.text.fontWeight,
  },
  multiline: {
    minHeight: controlSize.m * 2.5,
    lineHeight: typography.text.lineHeight,
  },
  focused: {
    borderColor: colors.accent,
  },
});
