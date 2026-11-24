import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { SitterCard } from '@/components/sitters/SitterCard';
import { Button, Chip, EmptyState, Screen, SegmentedTabs, Stepper, Text } from '@/components/ui';
import type { ServiceType } from '@/domain/types';
import { petSizes, sitterListedPrice, travelFee } from '@/features/booking/requestPricing';
import { currencyFor } from '@/features/pricing/pricing';
import { getCity } from '@/features/sitters/cities';
import { datesCovered, rankSitters } from '@/features/sitters/ranking';
import { formatDay, nextDays } from '@/lib/dates';
import { allSitters, useAppStore } from '@/store/useAppStore';
import { useSearchStore } from '@/store/useSearchStore';
import { spacing } from '@/theme';

const SERVICE_TABS = [
  { value: 'boarding', label: 'Garde' },
  { value: 'homeVisits', label: 'Visites' },
  { value: 'dogWalking', label: 'Promenade' },
] as const;

const SERVICE_HINT: Record<ServiceType, string> = {
  boarding: 'Votre animal est accueilli chez le Pet Sitter.',
  homeVisits: 'Le Pet Sitter passe chez vous s’occuper de votre animal.',
  dogWalking: 'Promenades : frais de déplacement calculés automatiquement, prix négociable.',
};

export default function SearchTab() {
  const owner = useAppStore((s) => s.owner);
  const pets = useAppStore((s) => s.pets);
  const mySitter = useAppStore((s) => s.mySitter);
  const { service, petIds, startDate, days, selectedSitterIds, set, toggleSitter } = useSearchStore();
  const days30 = nextDays(30);

  const eligiblePets = pets.filter((p) => service !== 'dogWalking' || p.species === 'dog');
  const chosenIds = petIds.filter((id) => eligiblePets.some((p) => p.id === id));
  const effectiveIds = chosenIds.length ? chosenIds : eligiblePets.slice(0, 1).map((p) => p.id);
  const chosen = pets.filter((p) => effectiveIds.includes(p.id));
  const city = owner ? getCity(owner.cityId) : undefined;
  const country = city?.country ?? 'FR';
  const currency = currencyFor(country);

  // React Compiler memoizes this computation.
  const results =
    !city || chosen.length === 0
      ? []
      : rankSitters(allSitters(mySitter), {
          service,
          species: [...new Set(chosen.map((p) => p.species))],
          sizes: petSizes(chosen),
          dates: datesCovered(startDate, days),
          origin: city,
        }).filter((r) => getCity(r.sitter.cityId).country === country);

  if (pets.length === 0) {
    return (
      <Screen>
        <Text variant="displayL" style={styles.title}>
          Rechercher
        </Text>
        <EmptyState icon="mci:paw" title="Commencez par votre animal" body="Le profil de votre animal permet de trouver des Pet Sitters compatibles et de calculer le bon tarif.">
          <Button label="Créer son profil" onPress={() => router.push('/pet/new')} />
        </EmptyState>
      </Screen>
    );
  }

  const togglePet = (id: string) => {
    const next = effectiveIds.includes(id) ? effectiveIds.filter((x) => x !== id) : [...effectiveIds, id];
    if (next.length) set({ petIds: next });
  };

  return (
    <Screen
      footer={
        selectedSitterIds.length ? (
          <Button
            testID="send-request"
            label={`Envoyer ma demande à ${selectedSitterIds.length} Pet Sitter${selectedSitterIds.length > 1 ? 's' : ''}`}
            onPress={() => {
              useSearchStore.setState({ petIds: effectiveIds });
              router.push('/request/new');
            }}
          />
        ) : undefined
      }>
      <Text variant="displayL" style={styles.title}>
        Rechercher
      </Text>
      <SegmentedTabs options={SERVICE_TABS} value={service} onChange={(v) => set({ service: v })} />
      <Text variant="caption" color="textMuted">
        {SERVICE_HINT[service]}
      </Text>

      <View style={styles.block}>
        <Text variant="label" color="textMuted">
          POUR
        </Text>
        <View style={styles.chips}>
          {eligiblePets.map((p) => (
            <Chip
              key={p.id}
              label={p.name}
              icon={p.species === 'cat' ? 'mci:cat' : 'mci:dog'}
              selected={effectiveIds.includes(p.id)}
              onPress={() => togglePet(p.id)}
              testID={`search-pet-${p.name}`}
            />
          ))}
        </View>
        {eligiblePets.length === 0 ? (
          <Text variant="caption" color="textMuted">
            La promenade concerne uniquement les chiens.
          </Text>
        ) : null}
      </View>

      <View style={styles.block}>
        <Text variant="label" color="textMuted">
          À PARTIR DU
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
          {days30.map((d) => (
            <Chip key={d} label={formatDay(d)} selected={d === startDate} onPress={() => set({ startDate: d })} />
          ))}
        </ScrollView>
      </View>
      <Stepper
        label={service === 'dogWalking' ? 'Nombre de promenades' : 'Nombre de jours'}
        value={days}
        onChange={(v) => set({ days: v })}
        min={1}
        max={30}
      />

      <Text variant="title" style={styles.resultsTitle}>
        {results.length} Pet Sitter{results.length > 1 ? 's' : ''} disponible{results.length > 1 ? 's' : ''} près de {city?.name}
      </Text>
      {results.length > 0 ? (
        <Text variant="caption" color="textMuted">
          Sélectionnez un ou plusieurs profils pour envoyer une seule demande.
        </Text>
      ) : (
        <EmptyState icon="calendar" title="Personne pour ces critères" body="Essayez d’autres dates, un autre service ou une durée plus courte." />
      )}
      {results.map((r) => (
        <SitterCard
          key={r.sitter.id}
          sitter={r.sitter}
          distanceKm={r.distanceKm}
          boosted={r.boosted}
          currency={currency}
          priceCents={sitterListedPrice({ sitter: r.sitter, service, country, pets: chosen, days })}
          extraCents={city ? travelFee({ service, country, origin: city, sitter: r.sitter, days }) : 0}
          selected={selectedSitterIds.includes(r.sitter.id)}
          onToggle={() => toggleSitter(r.sitter.id)}
          onPress={() => {
            useSearchStore.setState({ petIds: effectiveIds });
            router.push({ pathname: '/sitter/[id]', params: { id: r.sitter.id } });
          }}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingTop: spacing.md },
  block: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  resultsTitle: { marginTop: spacing.md },
});
