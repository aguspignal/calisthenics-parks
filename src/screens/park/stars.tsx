import { Star } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

/** Five stars with `value` (rounded) filled in. Decorative: pair it with the number as text. */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const filled = Math.round(value);
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          size={size}
          color={index <= filled ? colors.accent : colors.textMuted}
          fill={index <= filled ? colors.accent : 'none'}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xxs / 2,
  },
});
