import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: 'md' | 'sm';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
  accessibilityHint?: string;
};

const styleByVariant: Record<Variant, { bg: string; bgPressed: string; fg: keyof typeof colors; border?: string }> = {
  primary: { bg: colors.action, bgPressed: colors.actionPressed, fg: 'textInverse' },
  accent: { bg: colors.accent, bgPressed: colors.accentStrong, fg: 'text' },
  secondary: { bg: 'transparent', bgPressed: colors.brandTint, fg: 'primary', border: colors.primary },
  ghost: { bg: 'transparent', bgPressed: colors.surfaceMuted, fg: 'primary' },
  danger: { bg: colors.dangerSoft, bgPressed: colors.dangerSoft, fg: 'danger' },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  loading,
  fullWidth = true,
  style,
  testID,
  accessibilityHint,
}: Props) {
  const v = styleByVariant[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={() => {
        if (Platform.OS === 'ios') Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: pressed ? v.bgPressed : v.bg },
        v.border ? { borderWidth: 1, borderColor: v.border } : null,
        fullWidth ? styles.full : styles.auto,
        inactive ? styles.disabled : null,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={colors[v.fg]} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 18} color={v.fg} /> : null}
          <Text variant={size === 'sm' ? 'callout' : 'button'} color={v.fg}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  md: { minHeight: 54, paddingHorizontal: spacing.xl },
  sm: { minHeight: 36, paddingHorizontal: spacing.md },
  full: { alignSelf: 'stretch' },
  auto: { alignSelf: 'flex-start' },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  disabled: { opacity: 0.45 },
});
