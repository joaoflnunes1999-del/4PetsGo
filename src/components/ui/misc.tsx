import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text variant="displayS" style={styles.flex}>
        {children}
      </Text>
      {action}
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function InfoRow({
  icon,
  label,
  value,
  labelWidth = 130,
}: {
  icon?: IconName;
  label: string;
  value?: string | null;
  labelWidth?: number;
}) {
  return (
    <View style={styles.infoRow}>
      {icon ? <Icon name={icon} size={18} color="textMuted" /> : null}
      <Text variant="callout" color="textMuted" style={{ width: labelWidth }}>
        {label}
      </Text>
      <Text variant="callout" style={styles.infoValue}>
        {value && value.trim() ? value : '—'}
      </Text>
    </View>
  );
}

export function EmptyState({ icon, title, body, children }: { icon: IconName; title: string; body: string; children?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={30} color="primary" />
      </View>
      <Text variant="displayS" align="center">
        {title}
      </Text>
      <Text variant="body" color="textMuted" align="center">
        {body}
      </Text>
      {children ? <View style={styles.emptyActions}>{children}</View> : null}
    </View>
  );
}

type BadgeTone = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
const badgeTone: Record<BadgeTone, { bg: string; fg: keyof typeof colors }> = {
  primary: { bg: colors.primarySoft, fg: 'primary' },
  accent: { bg: colors.accentSoft, fg: 'accentStrong' },
  success: { bg: colors.successSoft, fg: 'success' },
  warning: { bg: colors.warningSoft, fg: 'warning' },
  danger: { bg: colors.dangerSoft, fg: 'danger' },
  info: { bg: colors.infoSoft, fg: 'info' },
  muted: { bg: colors.surfaceMuted, fg: 'textMuted' },
};

export function Badge({ label, tone = 'primary', icon }: { label: string; tone?: BadgeTone; icon?: IconName }) {
  const t = badgeTone[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      {icon ? <Icon name={icon} size={12} color={t.fg} /> : null}
      <Text variant="label" color={t.fg}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.xs },
  infoValue: { flex: 1 },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActions: { alignSelf: 'stretch', marginTop: spacing.sm, gap: spacing.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs + 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 1,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
});
