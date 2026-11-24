import { StyleSheet, View } from 'react-native';

import { Divider, Text } from '@/components/ui';
import type { Quote } from '@/features/pricing/pricing';
import { formatMoney } from '@/features/pricing/pricing';
import { spacing } from '@/theme';

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.line}>
      <Text variant={strong ? 'bodyStrong' : 'callout'} color={strong ? 'text' : 'textMuted'} style={styles.label}>
        {label}
      </Text>
      <Text variant={strong ? 'number' : 'callout'}>{value}</Text>
    </View>
  );
}

/** Owner-side price summary. */
export function PriceBreakdown({ q }: { q: Quote }) {
  const m = (c: number) => formatMoney(c, q.currency);
  return (
    <View style={styles.wrap}>
      <Line label="Prix du service" value={m(q.servicePriceCents)} />
      {q.kmFeeCents > 0 ? <Line label="Frais de déplacement (aller-retour)" value={m(q.kmFeeCents)} /> : null}
      <Line label="Frais de service 4PetsGo (5 %)" value={m(q.ownerFeeCents)} />
      <Divider />
      <Line label="Total" value={m(q.ownerTotalCents)} strong />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  label: { flex: 1 },
});
