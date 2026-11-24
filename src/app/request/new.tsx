import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PetAvatar } from '@/components/pets/PetAvatar';
import { SitterAvatar } from '@/components/sitters/SitterAvatar';
import { Button, Card, EmptyState, Icon, Input, Screen, Text } from '@/components/ui';
import { floorFor, sitterListedPrice, travelFee } from '@/features/booking/requestPricing';
import { SERVICE_LABELS, currencyFor, formatMoney, parseMoneyInput } from '@/features/pricing/pricing';
import { getCity } from '@/features/sitters/cities';
import { formatRange } from '@/lib/dates';
import { findSitter, useAppStore } from '@/store/useAppStore';
import { useSearchStore } from '@/store/useSearchStore';
import { spacing } from '@/theme';

export default function NewRequest() {
  const owner = useAppStore((s) => s.owner);
  const allPets = useAppStore((s) => s.pets);
  const mySitter = useAppStore((s) => s.mySitter);
  const sendRequest = useAppStore((s) => s.sendRequest);
  const { service, petIds, startDate, days, selectedSitterIds, clearSelection } = useSearchStore();
  const [proposal, setProposal] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string>();

  const pets = allPets.filter((p) => petIds.includes(p.id));
  const sitters = selectedSitterIds.map((id) => findSitter(id, mySitter)).filter((s) => !!s);
  if (!owner || pets.length === 0 || sitters.length === 0) {
    return (
      <Screen back>
        <EmptyState icon="users" title="Aucun Pet Sitter sélectionné" body="Retournez à la recherche pour choisir un ou plusieurs profils.">
          <Button label="Rechercher" onPress={() => router.replace('/search')} />
        </EmptyState>
      </Screen>
    );
  }

  const city = getCity(owner.cityId);
  const country = city.country;
  const currency = currencyFor(country);
  const floor = floorFor({ service, country, pets, days });
  const proposalCents = proposal ? parseMoneyInput(proposal) : undefined;
  const proposalError =
    proposalCents === undefined
      ? undefined
      : Number.isNaN(proposalCents) || proposalCents <= 0
        ? 'Montant invalide'
        : proposalCents < floor
          ? `Prix minimum : ${formatMoney(floor, currency)}`
          : undefined;

  const send = () => {
    const initialPrices: Record<string, number> = {};
    for (const s of sitters) {
      initialPrices[s.id] = proposalCents ?? sitterListedPrice({ sitter: s, service, country, pets, days }) ?? floor;
    }
    const res = sendRequest({ petIds: pets.map((p) => p.id), service, startDate, days, initialPrices, floorCents: floor, note: note.trim() || undefined });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    clearSelection();
    router.dismissAll();
    router.replace({ pathname: '/request/[id]', params: { id: res.id } });
  };

  return (
    <Screen
      back
      title="Votre demande"
      footer={
        <>
          {error ? (
            <Text variant="caption" color="danger" align="center">
              {error}
            </Text>
          ) : null}
          <Button
            label={`Envoyer à ${sitters.length} Pet Sitter${sitters.length > 1 ? 's' : ''}`}
            onPress={send}
            disabled={!!proposalError}
            testID="request-send"
          />
        </>
      }>
      <Card style={styles.gap}>
        <View style={styles.row}>
          <Icon name="briefcase" size={18} color="primary" />
          <Text variant="bodyStrong">{SERVICE_LABELS[service]}</Text>
        </View>
        <View style={styles.row}>
          <Icon name="calendar" size={18} color="primary" />
          <Text variant="body">
            {formatRange(startDate, service === 'dogWalking' ? 1 : days)}
            {service === 'dogWalking' ? ` · ${days} promenade${days > 1 ? 's' : ''}` : ` · ${days} jour${days > 1 ? 's' : ''}`}
          </Text>
        </View>
        <View style={styles.pets}>
          {pets.map((p) => (
            <View key={p.id} style={styles.row}>
              <PetAvatar pet={p} size={36} />
              <Text variant="callout">{p.name}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Text variant="title">Pet Sitters contactés</Text>
      {sitters.map((s) => {
        const listed = sitterListedPrice({ sitter: s, service, country, pets, days }) ?? floor;
        const km = travelFee({ service, country, origin: city, sitter: s, days });
        return (
          <View key={s.id} style={styles.sitterRow}>
            <SitterAvatar sitter={s} size={40} />
            <Text variant="bodyStrong" style={styles.flex}>
              {s.firstName}
            </Text>
            <View style={styles.right}>
              <Text variant="number">{formatMoney(proposalCents && !proposalError ? proposalCents : listed, currency)}</Text>
              {km ? (
                <Text variant="caption" color="textMuted">
                  + {formatMoney(km, currency)} de déplacement
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}

      <Card tone="muted" style={styles.gap}>
        <Text variant="bodyStrong">Proposer votre prix (facultatif)</Text>
        <Text variant="callout" testID="request-floor">
          Prix minimum : {formatMoney(floor, currency)}
        </Text>
        <Input
          value={proposal}
          onChangeText={setProposal}
          keyboardType="decimal-pad"
          placeholder={formatMoney(floor, currency)}
          suffix={currency === 'EUR' ? '€' : 'CHF'}
          error={proposalError}
          testID="request-proposal"
        />
      </Card>

      <Input
        label="Message (facultatif)"
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={400}
        placeholder="Présentez votre animal et vos attentes en quelques mots"
      />
      <Text variant="caption" color="textMuted">
        Dès qu’un Pet Sitter et vous êtes d’accord, la mission est verrouillée : les autres propositions sont automatiquement clôturées.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xs },
  sitterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  right: { alignItems: 'flex-end' },
});
