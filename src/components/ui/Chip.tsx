import { Pressable, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  testID?: string;
};

export function Chip({ label, selected, onPress, icon, testID }: Props) {
  const fg = selected ? 'selectedText' : 'text';
  return (
    <Pressable
      testID={testID}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={label}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.idle,
        pressed ? styles.pressed : null,
      ]}>
      {icon ? <Icon name={icon} size={15} color={fg} /> : null}
      <Text variant="callout" color={fg}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  idle: { backgroundColor: colors.field, borderColor: colors.border },
  selected: { backgroundColor: colors.selected, borderColor: colors.selectedBorder },
  pressed: { opacity: 0.8 },
});
