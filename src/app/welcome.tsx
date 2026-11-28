import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text } from '@/components/ui';
import { colors, fontFamily, layout, spacing } from '@/theme';

const LOGO_RATIO = 711 / 800;

/**
 * Cat peeking over the cream arc (founder's choice, 28/11/2026). Two layers cut from the same photo, in
 * crop pixels: the body sits BEHIND the arc, the hanging leg is drawn IN FRONT so the paw rests on the
 * right end of the "Se connecter" button.
 */
const CAT = {
  w: 291,
  h: 308,
  /** Where the body meets the edge it leans over (top of the arc). */
  edgeY: 130,
  /** Left edge of the hanging leg at that edge. */
  legX: 230,
  /** Centre of the paw. */
  pawX: 202,
  /** Middle of the head-and-leg span, under which the hill peaks. */
  peakX: 170,
};
const BUTTON_HEIGHT = 54;
/** How far the paw overlaps the top of the button. */
const PAW_REST = 8;

/** Entry screen, reproduced from the founder's reference mock-up (27/11/2026). */
export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const w = Math.min(width, layout.maxContentWidth + 40);
  // On short screens the logo shrinks so the accent strokes never touch the top edge.
  const logoWidth = Math.min(w * 0.8, (height - insets.top) * 0.36);
  const arc = w * 2.8;
  const r = arc / 2;

  // Paw centred on the rounded right end of the button.
  const actionsPad = layout.screenPadding + spacing.sm;
  const buttonRight = (width + Math.min(width, layout.maxContentWidth)) / 2 - actionsPad;
  const pawCx = buttonRight - BUTTON_HEIGHT / 2 - spacing.xs;
  const catW = Math.min(w * 0.5, (height - insets.top) * 0.26);
  const s = catW / CAT.w;
  const catLeft = pawCx - CAT.pawX * s;
  // The cream hill peaks under the cat so the edge it leans over stays almost flat.
  const arcCx = catLeft + CAT.peakX * s;
  /** Depth of the arc's top edge below its summit, at a given x. */
  const arcDrop = (x: number) => {
    const d = Math.min(Math.abs(x - arcCx), r);
    return r - Math.sqrt(r * r - d * d);
  };
  // The body's straight bottom edge sits on the arc where the leg starts: everything to its left is lower
  // than the arc (hidden), and the leg layer covers everything to its right.
  const edgeTop = arcDrop(catLeft + CAT.legX * s);
  const catTop = edgeTop - CAT.edgeY * s; // relative to the top of the arc
  const arcPad = edgeTop + (CAT.h - CAT.edgeY) * s - PAW_REST;
  const catStyle = { left: catLeft, top: catTop, width: catW, height: CAT.h * s };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.top, { paddingTop: insets.top + spacing.xxl, paddingBottom: Math.max(0, -catTop) + spacing.lg }]}>
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
          source={require('@/assets/images/cat-body.png')}
          style={[styles.cat, styles.catBehind, catStyle]}
          contentFit="contain"
          accessibilityLabel="Un chat penché qui tend la patte"
        />
        <View style={[styles.arcWrap, { paddingTop: arcPad, paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={[styles.arc, { width: arc, height: arc, borderRadius: r, left: arcCx - r }]} />
          <View style={styles.actions}>
            <Button label="Se connecter" onPress={() => router.push('/auth/sign-in')} testID="welcome-sign-in" />
            <Pressable accessibilityRole="button" onPress={() => router.push('/onboarding/role')} style={styles.signIn} testID="welcome-start">
              <Text variant="bodyStrong">Créer un compte</Text>
            </Pressable>
          </View>
        </View>
        <View pointerEvents="none" style={[styles.cat, styles.catFront, catStyle]}>
          <Image source={require('@/assets/images/cat-leg.png')} style={StyleSheet.absoluteFill} contentFit="contain" accessible={false} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.welcomeBackground },
  top: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: spacing.sm, paddingHorizontal: layout.screenPadding },
  tagline: { fontFamily: fontFamily.bodyMedium, fontSize: 20, lineHeight: 27, color: colors.wordmark, textAlign: 'center' },
  bottom: { width: '100%' },
  cat: { position: 'absolute' },
  catBehind: { zIndex: 0 },
  catFront: { zIndex: 2 },
  arcWrap: { zIndex: 1, width: '100%', overflow: 'hidden', minHeight: 150 },
  arc: { position: 'absolute', top: 0, backgroundColor: colors.background },
  actions: { paddingHorizontal: layout.screenPadding + spacing.sm, gap: spacing.md, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  signIn: { alignSelf: 'center', paddingVertical: spacing.sm },
});
