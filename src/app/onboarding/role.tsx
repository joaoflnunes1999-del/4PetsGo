import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card, Icon, Screen, Text, type IconName } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

function RoleCard({ icon, title, body, onPress, testID }: { icon: IconName; title: string; body: string; onPress: () => void; testID: string }) {
  return (
    <Card onPress={onPress} style={styles.card} testID={testID} accessibilityLabel={title}>
      <View style={styles.icon}>
        <Icon name={icon} size={30} color="primary" />
      </View>
      <View style={styles.text}>
        <Text variant="displayS">{title}</Text>
        <Text variant="callout" color="textMuted">
          {body}
        </Text>
      </View>
      <Icon name="chevron-right" color="textSubtle" />
    </Card>
  );
}

export default function RoleScreen() {
  return (
    <Screen back>
      <Text variant="displayM">Comment allez-vous utiliser 4PetsGo ?</Text>
      <Text variant="body" color="textMuted">
        Vous pourrez proposer vos services plus tard depuis le même compte.
      </Text>
      <View style={styles.list}>
        <RoleCard
          testID="role-owner"
          icon="mci:dog"
          title="J’ai un animal"
          body="Créez le profil de votre compagnon et trouvez le bon Pet Sitter."
          onPress={() => router.push('/onboarding/owner')}
        />
        <RoleCard
          testID="role-sitter"
          icon="mci:hand-heart"
          title="Je suis Pet Sitter"
          body="Proposez la garde, les visites ou la promenade, et progressez de Beginner à Master."
          onPress={() => router.push('/onboarding/sitter')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, marginTop: spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl },
  icon: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: spacing.xs },
});
