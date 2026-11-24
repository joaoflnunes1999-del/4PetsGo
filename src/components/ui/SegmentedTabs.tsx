import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

import { Text } from './Text';

type Props<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  scrollable?: boolean;
};

/** Underlined text tabs (marketplace style): active tab in brand green with a 2 px indicator. */
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
        <Text variant={active ? 'bodyStrong' : 'callout'} color={active ? 'primary' : 'textMuted'} numberOfLines={1}>
          {o.label}
        </Text>
      </Pressable>
    );
  });
  if (scrollable) {
    return (
      <View style={styles.track}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {items}
        </ScrollView>
      </View>
    );
  }
  return <View style={[styles.track, styles.row]}>{items}</View>;
}

const styles = StyleSheet.create({
  track: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  row: { flexDirection: 'row' },
  scroll: { gap: spacing.lg },
  item: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -StyleSheet.hairlineWidth,
  },
  itemFlex: { flex: 1 },
  active: { borderBottomColor: colors.action },
});
