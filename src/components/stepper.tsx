import { Minus, Plus, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, controlSize, radius, spacing } from '@/theme';

import { Text } from './text';

export type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Names the value for screen readers, e.g. "Pull-up bar quantity". */
  accessibilityLabel: string;
};

/** Minus / value / plus control for small whole numbers. Screen readers adjust it with swipe up and down. */
export function Stepper({ value, onChange, min = 0, max = Number.MAX_SAFE_INTEGER, accessibilityLabel }: StepperProps) {
  const change = (next: number) => onChange(Math.min(max, Math.max(min, next)));

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => change(event.nativeEvent.actionName === 'increment' ? value + 1 : value - 1)}
      style={styles.container}>
      <StepButton icon={Minus} disabled={value <= min} onPress={() => change(value - 1)} />
      <Text style={styles.value}>{value}</Text>
      <StepButton icon={Plus} disabled={value >= max} onPress={() => change(value + 1)} />
    </View>
  );
}

function StepButton({ icon: Icon, disabled, onPress }: { icon: LucideIcon; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? colors.surfaceRaised : colors.surface, opacity: disabled ? 0.4 : 1 },
      ]}>
      <Icon size={18} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  button: {
    width: controlSize.s,
    height: controlSize.s,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    minWidth: spacing.xl,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
