import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, radius, spacing } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Props = { visible: boolean; onClose: () => void; title?: string; children: ReactNode };

/** Bottom sheet built on Modal (works on iOS and web, unlike Alert with buttons). */
export function Sheet({ visible, onClose, title, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fermer" />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={styles.handle} />
        {title ? (
          <Text variant="title" align="center" style={styles.title}>
            {title}
          </Text>
        ) : null}
        {children}
      </View>
    </Modal>
  );
}

export type SheetAction = { label: string; icon?: IconName; onPress: () => void; destructive?: boolean; testID?: string };

export function ActionSheet({
  visible,
  onClose,
  title,
  actions,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  actions: SheetAction[];
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.actions}>
        {actions.map((a) => (
          <Pressable
            key={a.label}
            testID={a.testID}
            accessibilityRole="button"
            accessibilityLabel={a.label}
            onPress={() => {
              onClose();
              a.onPress();
            }}
            style={({ pressed }) => [styles.action, pressed ? styles.pressed : null]}>
            {a.icon ? <Icon name={a.icon} size={20} color={a.destructive ? 'danger' : 'text'} /> : null}
            <Text variant="bodyStrong" color={a.destructive ? 'danger' : 'text'}>
              {a.label}
            </Text>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" onPress={onClose} style={[styles.action, styles.cancel]}>
          <Text variant="bodyStrong" color="textMuted">
            Annuler
          </Text>
        </Pressable>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
    gap: spacing.md,
    width: '100%',
    maxWidth: layout.maxContentWidth + 40,
    alignSelf: 'center',
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border },
  title: { marginBottom: spacing.xs },
  actions: { gap: spacing.xs },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  cancel: { justifyContent: 'center' },
  pressed: { backgroundColor: colors.surfaceMuted },
});
