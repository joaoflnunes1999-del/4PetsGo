import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, fontFamily } from '@/theme';

/** Brand lockup: house + paw mark, "4Pets" in forest green and "Go" in leaf green (as in the logo). */
export function Logo({ size = 120, wordmark = true }: { size?: number; wordmark?: boolean }) {
  return (
    <View style={styles.wrap} accessibilityRole="image" accessibilityLabel="4PetsGo">
      <Image source={require('@/assets/images/logo-mark.png')} style={{ width: size, height: size * (270 / 350) }} contentFit="contain" />
      {wordmark ? (
        <Text style={[styles.word, { fontSize: size * 0.34, lineHeight: size * 0.4 }]}>
          <Text style={[styles.word, styles.forest, { fontSize: size * 0.34 }]}>4Pets</Text>
          <Text style={[styles.word, styles.leaf, { fontSize: size * 0.34 }]}>Go</Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  word: { fontFamily: fontFamily.displayBold, letterSpacing: -0.5 },
  forest: { color: colors.primary },
  leaf: { color: colors.brand },
});
