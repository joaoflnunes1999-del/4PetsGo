import { Image } from 'expo-image';

/** The Paw Points currency coin (terracotta rim, gold face, paw). */
export function PawCoin({ size = 16 }: { size?: number }) {
  return (
    <Image
      source={require('@/assets/images/paw-coin.png')}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityLabel="Paw Points"
    />
  );
}
