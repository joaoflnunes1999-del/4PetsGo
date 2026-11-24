import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { Text } from './Text';

type Props<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  scrollable?: boolean;
};

export function SegmentedTabs<T extends string>({ options, value, onChange, scrollable }: Props<T>) {
  const items = options.map((o) => {
    const active = o.value === value;
    return (
      <Pressable
        key={o.value}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={o.label}
        onPress={() => onChange(o.value)}
        style={[styles.item, scrollable ? null : styles.itemFlex, active ? styles.active : null]}>
        <Text variant="callout" color={active ? 'text' : 'textMuted'} numberOfLines={1}>
          {o.label}
        </Text>
      </Pressable>
    );
  });
  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.track}>
        {items}
      </ScrollView>
    );
  }
  return <View style={styles.track}>{items}</View>;
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  item: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  itemFlex: { flex: 1 },
  active: { backgroundColor: colors.surface },
});
