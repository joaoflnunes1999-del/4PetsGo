import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/Logo';
import { Button, Icon, Text, type IconName } from '@/components/ui';
import { colors, layout, radius, spacing } from '@/theme';

const PILLARS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'mci:paw', title: 'Un profil pour chaque animal', body: 'Photos, habitudes et soins réunis au même endroit, partagés uniquement avec son Pet Sitter.' },
  { icon: 'repeat', title: 'Un prix juste, négocié', body: 'Envoyez votre demande à plusieurs Pet Sitters et trouvez un accord en 3 échanges.' },
  { icon: 'shield', title: 'La confiance d’abord', body: 'Niveaux, Paw Points et avis vérifiés après chaque mission réelle.' },
];

export default function Welcome() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.hero, { paddingTop: insets.top + spacing.xxxl }]}>
        <Logo size={150} />
        <Text variant="title" color="primary" align="center">
          Your Pet, their care, one place!
        </Text>
      </View>
      <View style={styles.body}>
        {PILLARS.map((p) => (
          <View key={p.title} style={styles.pillar}>
            <View style={styles.pillarIcon}>
              <Icon name={p.icon} size={20} color="accentStrong" />
            </View>
            <View style={styles.pillarText}>
              <Text variant="bodyStrong">{p.title}</Text>
              <Text variant="callout" color="textMuted">
                {p.body}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Button label="Commencer" onPress={() => router.push('/onboarding/role')} testID="welcome-start" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: {
    backgroundColor: colors.primarySoft,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
    paddingHorizontal: layout.screenPadding,
  },
  body: {
    flex: 1,
    gap: spacing.xl,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xxl,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  pillar: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' },
  pillarIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarText: { flex: 1, gap: spacing.xxs },
  footer: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.md, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
});
