import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

type Props = {
  children: ReactNode;
  title?: string;
  /** Show a back button in the header (uses router.back()). */
  back?: boolean;
  headerRight?: ReactNode;
  scroll?: boolean;
  /** Sticky content at the bottom (e.g. primary CTA). */
  footer?: ReactNode;
  padded?: boolean;
  /** Respect the top safe area (false inside tab screens that already render a large title). */
  edgeTop?: boolean;
};

export function Screen({ children, title, back, headerRight, scroll = true, footer, padded = true, edgeTop = true }: Props) {
  const insets = useSafeAreaInsets();
  const hasHeader = !!title || back || !!headerRight;
  const body = (
    <View style={[styles.inner, padded ? styles.padded : null]}>{children}</View>
  );
  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: edgeTop ? insets.top : 0 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {hasHeader ? (
        <View style={styles.header}>
          <View style={styles.headerSide}>
            {back ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Retour"
                hitSlop={layout.hitSlop}
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
                style={styles.backButton}>
                <Icon name="chevron-left" size={24} />
              </Pressable>
            ) : null}
          </View>
          <Text variant="title" numberOfLines={1} style={styles.headerTitle}>
            {title}
          </Text>
          <View style={[styles.headerSide, styles.headerRight]}>{headerRight}</View>
        </View>
      ) : null}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: footer ? spacing.xl : insets.bottom + spacing.xxl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {body}
        </ScrollView>
      ) : (
        <View style={styles.flex}>{body}</View>
      )}
      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>{footer}</View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  headerSide: { width: 72, flexDirection: 'row', alignItems: 'center' },
  headerRight: { justifyContent: 'flex-end', paddingRight: spacing.sm },
  headerTitle: { flex: 1, textAlign: 'center' },
  backButton: { padding: spacing.sm },
  scrollContent: { flexGrow: 1 },
  inner: { flex: 1, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  padded: { paddingHorizontal: layout.screenPadding, gap: spacing.lg },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
});
