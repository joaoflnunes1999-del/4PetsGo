import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PetCard } from '@/components/pets/PetCard';
import { Button, EmptyState, Screen, Text } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme';

export default function PetsTab() {
  const pets = useAppStore((s) => s.pets);
  const owner = useAppStore((s) => s.owner);
  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="callout" color="textMuted">
          Bonjour {owner?.firstName ?? ''}
        </Text>
        <Text variant="displayL">Mes animaux</Text>
      </View>
      {pets.length === 0 ? (
        <EmptyState
          icon="mci:paw"
          title="Aucun animal pour l’instant"
          body="Créez le profil de votre compagnon : photo, personnalité, routine et soins.">
          <Button label="Ajouter un animal" icon="plus" onPress={() => router.push('/pet/new')} testID="add-pet-empty" />
        </EmptyState>
      ) : (
        <>
          {pets.map((p) => (
            <PetCard key={p.id} pet={p} onPress={() => router.push({ pathname: '/pet/[id]', params: { id: p.id } })} />
          ))}
          <Button label="Ajouter un animal" icon="plus" variant="secondary" onPress={() => router.push('/pet/new')} testID="add-pet" />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({ header: { gap: spacing.xxs, paddingTop: spacing.md } });
