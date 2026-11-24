import { router } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AddPetTile, PetTile } from '@/components/pets/PetTile';
import { Button, EmptyState, Screen, Text } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { layout, spacing } from '@/theme';

export default function PetsTab() {
  const pets = useAppStore((s) => s.pets);
  const owner = useAppStore((s) => s.owner);
  const { width } = useWindowDimensions();
  const content = Math.min(width, layout.maxContentWidth) - layout.screenPadding * 2;
  const tile = (content - layout.gridGap) / 2;

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="displayL">Mes animaux</Text>
        <Text variant="callout" color="textMuted">
          Bonjour {owner?.firstName ?? ''} 👋
        </Text>
      </View>
      {pets.length === 0 ? (
        <EmptyState icon="mci:paw" title="Aucun animal pour l’instant" body="Créez le profil de votre compagnon : photo, personnalité, routine et soins.">
          <Button label="Ajouter un animal" icon="plus" onPress={() => router.push('/pet/new')} testID="add-pet-empty" />
        </EmptyState>
      ) : (
        <View style={[styles.grid, { gap: layout.gridGap }]}>
          {pets.map((p) => (
            <PetTile key={p.id} pet={p} size={tile} onPress={() => router.push({ pathname: '/pet/[id]', params: { id: p.id } })} />
          ))}
          <AddPetTile size={tile} onPress={() => router.push('/pet/new')} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xxs, paddingTop: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.xl },
});
