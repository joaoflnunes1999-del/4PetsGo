import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import type { OwnerProfile } from '@/domain/types';
import { crownPlacement } from '@/features/owners/crown';
import { colors } from '@/theme';

type Props = { owner: Pick<OwnerProfile, 'firstName' | 'ownerClub'> & { photoUri?: string }; size: number };

/**
 * Circular owner photo (initials until a photo exists). Owner Club members unlock a permanent skin:
 * a filled Muted Gold crown on the rim, ≈ 30° clockwise from the top.
 */
export function OwnerAvatar({ owner, size }: Props) {
  const crown = owner.ownerClub ? crownPlacement(size) : undefined;
  return (
    <View style={{ width: size, height: size }} accessibilityLabel={owner.ownerClub ? `${owner.firstName}, membre Owner Club` : owner.firstName}>
      {owner.photoUri ? (
        <Image source={{ uri: owner.photoUri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text variant="displayS" color="primary" style={{ fontSize: size * 0.42, lineHeight: size * 0.5 }}>
            {owner.firstName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      {crown ? (
        <View
          testID="owner-club-crown"
          pointerEvents="none"
          style={[styles.crown, { left: crown.left, top: crown.top, transform: [{ rotate: `${crown.rotateDeg}deg` }] }]}>
          <Icon name="mci:crown" size={crown.crownSize} color="accent" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  crown: { position: 'absolute' },
});
