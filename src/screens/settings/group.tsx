import { Host, Switch } from '@expo/ui';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Children, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors, controlSize, radius, spacing } from '@/theme';

/** A titled group of settings rows on one surface, separated by hairlines. */
export function Group({ title, footer, children }: { title: string; footer?: string; children: ReactNode }) {
  const rows = Children.toArray(children);
  return (
    <View style={styles.group}>
      <Text variant="caption" tone="muted" style={styles.title}>
        {title.toUpperCase()}
      </Text>
      <View style={styles.surface}>
        {rows.map((row, index) => (
          <View key={index} style={index > 0 && styles.separator}>
            {row}
          </View>
        ))}
      </View>
      {footer ? (
        <Text variant="caption" tone="muted" style={styles.footer}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

type RowProps = {
  label: string;
  value?: string;
  icon?: LucideIcon;
  iconColor?: string;
  onPress?: () => void;
  disabled?: boolean;
};

export function Row({ label, value, icon: Icon, iconColor = colors.textSecondary, onPress, disabled = false }: RowProps) {
  const content = (
    <>
      {Icon ? <Icon size={20} color={iconColor} /> : null}
      <Text style={styles.label}>{label}</Text>
      {value ? (
        <Text variant="notes" tone="muted">
          {value}
        </Text>
      ) : null}
      {onPress && !disabled ? <ChevronRight size={18} color={colors.textMuted} /> : null}
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, disabled && styles.disabled]}>
      {content}
    </Pressable>
  );
}

export function ToggleRow({
  label,
  value,
  onValueChange,
  disabled = false,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Host matchContents colorScheme="dark" seedColor={colors.accent}>
        <Switch value={value} onValueChange={onValueChange} disabled={disabled} />
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.xs,
  },
  title: {
    paddingHorizontal: spacing.m,
  },
  footer: {
    paddingHorizontal: spacing.m,
  },
  surface: {
    borderRadius: radius.l,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  separator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    minHeight: controlSize.m + spacing.xs,
    paddingHorizontal: spacing.m,
  },
  label: {
    flex: 1,
  },
  pressed: {
    backgroundColor: colors.surfaceRaised,
  },
  disabled: {
    opacity: 0.4,
  },
});
