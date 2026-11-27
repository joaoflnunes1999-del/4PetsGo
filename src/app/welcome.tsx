import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text } from '@/components/ui';
import { FEATURES } from '@/config/features';
import { colors, fontFamily, layout, spacing } from '@/theme';

const DOG_RATIO = 469 / 640;
const LOGO_RATIO = 711 / 800;

/** Entry screen, reproduced from the founder's reference mock-up (27/11/2026). */
export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const w = Math.min(width, layout.maxContentWidth + 40);
  // On short screens the logo shrinks so the accent strokes never touch the top edge.
  const logoWidth = Math.min(w * 0.8, (height - insets.top) * 0.36);
  const dogWidth = w * 0.72;
  const arc = w * 1.9;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.top, { paddingTop: insets.top + spacing.xxl }]}>
        <Image
          source={require('@/assets/images/logo-welcome.png')}
          style={{ width: logoWidth, height: logoWidth * LOGO_RATIO }}
          contentFit="contain"
          accessibilityRole="header"
          accessibilityLabel="4PetsGo"
        />
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
  tagline: { fontFamily: fontFamily.bodyMedium, fontSize: 20, lineHeight: 27, color: colors.wordmark, textAlign: 'center' },
  bottom: { alignItems: 'center' },
  dog: { zIndex: 2, marginBottom: -18 },
  arcWrap: { width: '100%', paddingTop: spacing.xxxl + spacing.sm, overflow: 'hidden', minHeight: 150 },
  arc: { position: 'absolute', top: 0, backgroundColor: colors.background },
  actions: { paddingHorizontal: layout.screenPadding + spacing.sm, gap: spacing.md, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  signIn: { alignSelf: 'center', paddingVertical: spacing.sm },
});
