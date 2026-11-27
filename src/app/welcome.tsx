import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/Logo';
import { Button, Icon, Text, type IconName } from '@/components/ui';
import { colors, layout, radius, shadow, spacing } from '@/theme';

const PILLARS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'mci:paw', title: 'Un profil pour chaque animal', body: 'Photos, habitudes et soins réunis au même endroit.' },
  { icon: 'repeat', title: 'Un prix juste, négocié', body: 'Une demande, plusieurs Pet Sitters, un accord en 3 échanges.' },
  { icon: 'shield', title: 'La confiance d’abord', body: 'Niveaux, Paw Points et avis vérifiés après chaque mission.' },
];

export default function Welcome() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.hero, { paddingTop: insets.top + spacing.xxxl }]}>
        <Logo size={170} />
        <Text variant="title" align="center" style={styles.tagline}>
          Your Pet, their care,{'\n'}one place!
        </Text>
      </View>
      <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={styles.pillars}>
          {PILLARS.map((p) => (
            <View key={p.title} style={styles.pillar}>
              <View style={styles.pillarIcon}>
                <Icon name={p.icon} size={20} color="primary" />
              </View>
              <View style={styles.pillarText}>
                <Text variant="bodyStrong">{p.title}</Text>
                <Text variant="caption" color="textMuted">
                  {p.body}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <Button label="Commencer" onPress={() => router.push('/onboarding/role')} testID="welcome-start" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.brandSurface },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: layout.screenPadding },
  tagline: { fontSize: 20, lineHeight: 27, color: colors.text },
  panel: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xxl,
    gap: spacing.xl,
    ...shadow.floating,
  },
  pillars: { gap: spacing.lg, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  pillar: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  pillarIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brandSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarText: { flex: 1, gap: 2 },
});
