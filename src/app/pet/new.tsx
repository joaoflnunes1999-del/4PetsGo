import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BreedImage } from '@/components/pets/BreedImage';
import { Button, Card, Chip, Icon, Input, Screen, SegmentedTabs, Text } from '@/components/ui';
import type { Sex, Species } from '@/domain/types';
import { parseFrenchDate } from '@/features/pets/age';
import { getBreed, searchBreeds } from '@/features/pets/breeds';
import { SIZE_LABELS, sizeCategoryFor } from '@/features/pricing/pricing';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';

type Step = 'species' | 'breed' | 'details';

export default function NewPet() {
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const addPet = useAppStore((s) => s.addPet);
  const [step, setStep] = useState<Step>('species');
  const [species, setSpecies] = useState<Species>('dog');
  const [query, setQuery] = useState('');
  const [breedId, setBreedId] = useState<string>();
  const [name, setName] = useState('');
  const [ageMode, setAgeMode] = useState<'birth' | 'estimate'>('birth');
  const [birth, setBirth] = useState('');
  const [estimate, setEstimate] = useState('');
  const [sex, setSex] = useState<Sex>();
  const [weight, setWeight] = useState('');

  const breeds = useMemo(() => searchBreeds(species, query), [species, query]);
  const birthIso = birth ? parseFrenchDate(birth) : undefined;
  const weightKg = weight ? Number(weight.replace(',', '.')) : undefined;
  const estimateYears = estimate ? Number(estimate.replace(',', '.')) : undefined;
  const errors = {
    birth: birth && !birthIso ? 'Format JJ/MM/AAAA, date passée' : undefined,
    weight: weight && (!Number.isFinite(weightKg) || weightKg! <= 0 || weightKg! > 120) ? 'Poids invalide' : undefined,
    estimate: estimate && (!Number.isFinite(estimateYears) || estimateYears! < 0 || estimateYears! > 30) ? 'Âge invalide' : undefined,
  };
  // A dog's weight is mandatory: it sets the size category, hence the minimum price.
  const weightMissing = species === 'dog' && !weight.trim();
  const valid = name.trim().length >= 1 && !!breedId && !weightMissing && !errors.birth && !errors.weight && !errors.estimate;

  const create = () => {
    const id = addPet({
      name: name.trim(),
      species,
      breedId: breedId!,
      birthDate: ageMode === 'birth' ? birthIso : undefined,
      estimatedAgeYears: ageMode === 'estimate' ? estimateYears : undefined,
      sex,
      weightKg,
      personality: { traits: [] },
      routine: {},
      care: { medications: [] },
    });
    router.replace({ pathname: '/pet/[id]', params: { id, created: '1' } });
  };

  if (step === 'species') {
    return (
      <Screen back={!onboarding}>
        <Text variant="displayM">Votre compagnon est…</Text>
        <View style={styles.speciesRow}>
          {(['dog', 'cat'] as const).map((sp) => (
            <Pressable
              key={sp}
              testID={`species-${sp}`}
              accessibilityRole="button"
              accessibilityLabel={sp === 'dog' ? 'Un chien' : 'Un chat'}
              onPress={() => {
                setSpecies(sp);
                setBreedId(undefined);
                setQuery('');
                setStep('breed');
              }}
              style={({ pressed }) => [styles.speciesCard, pressed ? styles.pressed : null]}>
              <BreedImage breedId={sp === 'dog' ? 'dog-mixed' : 'cat-mixed'} species={sp} size={120} rounded={60} />
              <Text variant="displayS">{sp === 'dog' ? 'Un chien' : 'Un chat'}</Text>
            </Pressable>
          ))}
        </View>
      </Screen>
    );
  }

  if (step === 'breed') {
    return (
      <Screen
        back={false}
        headerRight={null}
        footer={
          <Button label="Continuer" disabled={!breedId} onPress={() => setStep('details')} testID="breed-continue" />
        }>
        <Pressable accessibilityRole="button" onPress={() => setStep('species')} style={styles.backLink}>
          <Icon name="chevron-left" size={18} color="primary" />
          <Text variant="callout" color="primary">
            {species === 'dog' ? 'Chien' : 'Chat'}
          </Text>
        </Pressable>
        <Text variant="displayM">Quelle est sa race ?</Text>
        {breedId ? (
          <Card style={styles.preview}>
            <BreedImage breedId={breedId} species={species} size={96} rounded={48} />
            <View style={styles.flex}>
              <Text variant="bodyStrong">{getBreed(breedId).name}</Text>
              <Text variant="caption" color="textMuted">
                Cette image sera sa photo de profil par défaut. Vous pourrez la remplacer à tout moment par une de vos photos.
              </Text>
            </View>
          </Card>
        ) : null}
        <Input value={query} onChangeText={setQuery} placeholder="Rechercher une race" autoCorrect={false} testID="breed-search" />
        <View style={styles.list}>
          {breeds.map((b) => {
            const selected = b.id === breedId;
            return (
              <Pressable
                key={b.id}
                testID={`breed-${b.id}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={b.name}
                onPress={() => setBreedId(b.id)}
                style={[styles.breedRow, selected ? styles.breedSelected : null]}>
                <BreedImage breedId={b.id} species={species} size={44} rounded={22} />
                <Text variant="body" style={styles.flex}>
                  {b.name}
                </Text>
                {selected ? <Icon name="check" color="primary" /> : null}
              </Pressable>
            );
          })}
          {breeds.length === 0 ? (
            <Text variant="callout" color="textMuted">
              Aucune race trouvée. Choisissez « {species === 'dog' ? 'Croisé / race inconnue' : 'Européen / race inconnue'} ».
            </Text>
          ) : null}
        </View>
      </Screen>
    );
  }

  return (
    <Screen footer={<Button label="Créer son profil" disabled={!valid} onPress={create} testID="pet-create" />}>
      <Pressable accessibilityRole="button" onPress={() => setStep('breed')} style={styles.backLink}>
        <Icon name="chevron-left" size={18} color="primary" />
        <Text variant="callout" color="primary">
          {getBreed(breedId!).name}
        </Text>
      </Pressable>
      <View style={styles.center}>
        <BreedImage breedId={breedId!} species={species} size={140} rounded={70} />
      </View>
      <Input label="Nom" value={name} onChangeText={setName} placeholder="Ex. Pistache" autoCapitalize="words" testID="pet-name" />
      <Text variant="title">Âge</Text>
      <SegmentedTabs
        options={[
          { value: 'birth', label: 'Date de naissance' },
          { value: 'estimate', label: 'Âge estimé' },
        ]}
        value={ageMode}
        onChange={setAgeMode}
      />
      {ageMode === 'birth' ? (
        <Input value={birth} onChangeText={setBirth} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" error={errors.birth} />
      ) : (
        <Input value={estimate} onChangeText={setEstimate} placeholder="Ex. 4" keyboardType="decimal-pad" suffix="ans" error={errors.estimate} />
      )}
      <Text variant="title">Sexe</Text>
      <View style={styles.chips}>
        <Chip label="Mâle" selected={sex === 'male'} onPress={() => setSex('male')} />
        <Chip label="Femelle" selected={sex === 'female'} onPress={() => setSex('female')} />
      </View>
      <Input
        label={species === 'dog' ? 'Poids (obligatoire)' : 'Poids'}
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        suffix="kg"
        error={errors.weight}
        helper={
          species === 'dog'
            ? weightKg && !errors.weight
              ? `Catégorie : ${SIZE_LABELS[sizeCategoryFor('dog', weightKg)]}. Sert à calculer le tarif minimum.`
              : 'Indispensable pour calculer le tarif minimum de garde.'
            : undefined
        }
        testID="pet-weight"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  speciesRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  speciesCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.85 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, paddingTop: spacing.md },
  preview: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  list: { gap: spacing.xs },
  breedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  breedSelected: { backgroundColor: colors.primarySoft },
  flex: { flex: 1, gap: spacing.xxs },
  center: { alignItems: 'center', paddingVertical: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
