import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, controlSize, radius, spacing } from '@/theme';

import { Text } from './text';

export type OptionRowProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** `checkbox` for multi-select lists, `radio` for picking one option. */
  type?: 'checkbox' | 'radio';
};

/** Full-width row with a label and a checkbox or radio button at the end. */
export function OptionRow({ label, selected, onPress, type = 'checkbox' }: OptionRowProps) {
  const radio = type === 'radio';

  return (
    <Pressable
      accessibilityRole={type}
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceRaised }]}>
      <Text style={styles.label}>{label}</Text>
      {radio ? (
        <View style={[styles.indicator, styles.radio, selected && styles.radioSelected]}>
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
      ) : (
        <View style={[styles.indicator, selected && styles.checkboxSelected]}>
          {selected ? <Check size={16} color={colors.onAccent} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    minHeight: controlSize.m,
    borderRadius: radius.m,
  },
  label: {
    flex: 1,
  },
  indicator: {
    width: 22,
    height: 22,
    borderRadius: radius.s,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  radio: {
    borderRadius: radius.pill,
  },
  radioSelected: {
    borderColor: colors.accent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
});
