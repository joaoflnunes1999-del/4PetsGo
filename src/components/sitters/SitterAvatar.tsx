import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import type { SitterProfile } from '@/domain/types';
import { palette } from '@/theme';

const TONES = [
  [palette.mint300, palette.forest800],
  [palette.honey100, palette.honey600],
  ['#E6E1F2', '#5A4A8C'],
  ['#E1ECF5', '#2F6E9E'],
  ['#F5E3E8', '#9C3D5A'],
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
