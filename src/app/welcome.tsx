import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text } from '@/components/ui';
import { FEATURES } from '@/config/features';
import { colors, fontFamily, layout, spacing } from '@/theme';

const DOG_RATIO = 469 / 640;

/** Entry screen, reproduced from the founder's reference mock-up (27/11/2026). */
export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const w = Math.min(width, layout.maxContentWidth + 40);
  const dogWidth = w * 0.72;
  const arc = w * 1.9;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.top, { paddingTop: insets.top + spacing.xxl }]}>
        <Image
          source={require('@/assets/images/welcome-house.png')}
          style={{ width: w * 0.36, height: w * 0.36 }}
          contentFit="contain"
          accessibilityLabel="Logo 4PetsGo"
        />
        <Text style={[styles.wordmark, { fontSize: w * 0.155, lineHeight: w * 0.18 }]} accessibilityRole="header">
          4PetsGo
        </Text>
        <Text style={styles.tagline}>Your Pet, their care,{'\n'}one place!</Text>
      </View>

      <View style={styles.bottom}>
        <Image
          source={require('@/assets/images/welcome-dog.png')}
          style={[styles.dog, { width: dogWidth, height: dogWidth * DOG_RATIO }]}
          contentFit="contain"
          accessibilityLabel="Un bouledogue français"
        />
        <View style={[styles.arcWrap, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={[styles.arc, { width: arc, height: arc, borderRadius: arc / 2, left: (width - arc) / 2 }]} />
          <View style={styles.actions}>
            <Button label="Commencer" onPress={() => router.push('/onboarding/role')} testID="welcome-start" />
            {FEATURES.accountSignIn ? (
              <Pressable accessibilityRole="button" style={styles.signIn} testID="welcome-sign-in">
                <Text variant="bodyStrong">Se connecter</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.welcomeBackground },
  top: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: spacing.sm, paddingHorizontal: layout.screenPadding, paddingBottom: spacing.xl },
  wordmark: { fontFamily: fontFamily.displayBold, color: colors.wordmark, letterSpacing: -1.5, textAlign: 'center' },
  tagline: { fontFamily: fontFamily.bodyMedium, fontSize: 20, lineHeight: 27, color: colors.wordmark, textAlign: 'center' },
  bottom: { alignItems: 'center' },
  dog: { zIndex: 2, marginBottom: -18 },
  arcWrap: { width: '100%', paddingTop: spacing.xxxl + spacing.sm, overflow: 'hidden', minHeight: 150 },
  arc: { position: 'absolute', top: 0, backgroundColor: colors.background },
  actions: { paddingHorizontal: layout.screenPadding + spacing.sm, gap: spacing.md, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  signIn: { alignSelf: 'center', paddingVertical: spacing.sm },
});
