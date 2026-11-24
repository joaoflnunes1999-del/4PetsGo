import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import type { SitterProfile } from '@/domain/types';
import { palette } from '@/theme';

/** Initials avatars stay within the brand palette (terracotta dominant, other tones for variety). */
const TONES = [
  [palette.terracotta[100], palette.terracotta[700]],
  [palette.sand[300], palette.clay[500]],
  [palette.blue[100], palette.blue[700]],
  [palette.sage[100], palette.sage[700]],
] as const;

export function SitterAvatar({ sitter, size }: { sitter: SitterProfile; size: number }) {
  if (sitter.photoUri) {
    return <Image source={{ uri: sitter.photoUri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  const [bg, fg] = TONES[sitter.avatarSeed % TONES.length];
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text variant="displayS" style={{ color: fg, fontSize: size * 0.42, lineHeight: size * 0.5 }}>
        {sitter.firstName.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({ circle: { alignItems: 'center', justifyContent: 'center' } });
