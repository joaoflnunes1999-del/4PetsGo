import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Icon, Screen, Text, type IconName } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

const PILLARS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'mci:paw', title: 'Un profil pour chaque animal', body: 'Photos, habitudes et soins réunis au même endroit, partagés uniquement avec son Pet Sitter.' },
  { icon: 'repeat', title: 'Un prix juste, négocié', body: 'Envoyez votre demande à plusieurs Pet Sitters et trouvez un accord en 3 échanges.' },
  { icon: 'shield', title: 'La confiance d’abord', body: 'Niveaux, Paw Points et avis vérifiés après chaque mission réelle.' },
];

export default function Welcome() {
  return (
    <Screen
      footer={<Button label="Commencer" onPress={() => router.push('/onboarding/role')} testID="welcome-start" />}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Icon name="mci:paw" size={34} color="textInverse" />
        </View>
        <Text variant="displayL" align="center">
          4PetsGo
        </Text>
        <Text variant="title" color="textMuted" align="center">
          Your Pet, their care, one place!
        </Text>
      </View>
      <View style={styles.pillars}>
        {PILLARS.map((p) => (
          <View key={p.title} style={styles.pillar}>
            <View style={styles.pillarIcon}>
              <Icon name={p.icon} size={20} color="primary" />
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xxxl, paddingBottom: spacing.xl },
  logo: {
    width: 76,
    height: 76,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  pillars: { gap: spacing.xl },
  pillar: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' },
  pillarIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarText: { flex: 1, gap: spacing.xxs },
});
