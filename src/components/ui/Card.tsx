import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radius, shadow, spacing } from '@/theme';

type Props = ViewProps & { onPress?: () => void; padded?: boolean; tone?: 'surface' | 'muted' | 'primarySoft' | 'accentSoft' };

export function Card({ onPress, padded = true, tone = 'surface', style, children, ...rest }: Props) {
  const toneStyle = {
    surface: { backgroundColor: colors.surface, ...shadow.card },
    muted: { backgroundColor: colors.surfaceMuted },
    primarySoft: { backgroundColor: colors.primarySoft },
    accentSoft: { backgroundColor: colors.accentSoft },
  }[tone];
  const content = [styles.base, toneStyle, padded ? styles.padded : null, style];
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [content, pressed ? styles.pressed : null]}
        {...rest}>
        {children}
      </Pressable>
    );
  }
  return (
    <View style={content} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.lg },
  padded: { padding: spacing.lg },
  pressed: { opacity: 0.8 },
});
