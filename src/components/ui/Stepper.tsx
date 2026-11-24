import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

type Props = { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string };

export function Stepper({ label, value, onChange, min = 1, max = 60, unit }: Props) {
  return (
    <View style={styles.row}>
      <Text variant="bodyStrong" style={styles.label}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Diminuer ${label}`}
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - 1))}
        style={[styles.btn, value <= min ? styles.off : null]}>
        <Icon name="minus" size={18} />
      </Pressable>
      <Text variant="number" style={styles.value}>
        {value}
        {unit ? ` ${unit}` : ''}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Augmenter ${label}`}
        disabled={value >= max}
        onPress={() => onChange(Math.min(max, value + 1))}
        style={[styles.btn, value >= max ? styles.off : null]}>
        <Icon name="plus" size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  label: { flex: 1 },
  btn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  off: { opacity: 0.35 },
  value: { minWidth: 64, textAlign: 'center' },
});
