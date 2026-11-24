import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PriceBreakdown } from '@/components/booking/PriceBreakdown';
import { ThreadCard } from '@/components/booking/ThreadCard';
import { PawCoin } from '@/components/levels/PawCoin';
import { PetAvatar } from '@/components/pets/PetAvatar';
import { Badge, Button, Card, ConfirmSheet, EmptyState, Icon, Screen, Text } from '@/components/ui';
import type { OfferParty } from '@/domain/types';
import { REQUEST_BADGE } from '@/features/booking/labels';
import { agreedOffer } from '@/features/booking/negotiation';
import { floorFor, quoteFor } from '@/features/booking/requestPricing';
import { missionPawPoints } from '@/features/levels/levels';
import { SERVICE_LABELS } from '@/features/pricing/pricing';
import { getCity } from '@/features/sitters/cities';
import { formatRange } from '@/lib/dates';
import { findSitter, useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme';


export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const request = useAppStore((s) => s.requests.find((r) => r.id === id));
  const allPets = useAppStore((s) => s.pets);
  const owner = useAppStore((s) => s.owner);
  const role = useAppStore((s) => s.role);
  const mySitter = useAppStore((s) => s.mySitter);
  const { respondToOffer, cancel, refreshExpiry } = useAppStore.getState();
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    refreshExpiry();
    const t = setInterval(refreshExpiry, 60_000);
    return () => clearInterval(t);
  }, [refreshExpiry]);

  if (!request || !owner) {
    return (
      <Screen back>
        <EmptyState icon="inbox" title="Demande introuvable" body="Elle a peut-être été supprimée de cet appareil." />
      </Screen>
    );
  }

  const viewer: OfferParty = role === 'sitter' ? 'sitter' : 'owner';
  const pets = allPets.filter((p) => request.petIds.includes(p.id));
  const floor = floorFor({ service: request.service, country: request.country, pets, days: request.days });
  const origin = getCity(owner.cityId);
  const lockedSitter = request.lockedSitterId ? findSitter(request.lockedSitterId, mySitter) : undefined;
  const agreed = agreedOffer(request);
  const q = lockedSitter && agreed ? quoteFor({ request, sitter: lockedSitter, priceCents: agreed.priceCents, origin }) : undefined;
  const threads =
    viewer === 'sitter' ? request.threads.filter((t) => t.sitterId === mySitter?.id) : request.threads;
  // Agreed thread first, then active ones.
  const order = { agreed: 0, negotiating: 1, declined: 2, expired: 3, closed: 4 } as const;
  const sorted = [...threads].sort((a, b) => order[a.status] - order[b.status]);
  const badge = REQUEST_BADGE[request.status];

  return (
    <Screen back title="Mission">
      <View style={styles.idRow}>
        <View style={styles.flex}>
          <Text variant="label" color="textMuted">
            IDENTIFIANT DE MISSION
          </Text>
          <Text variant="displayS" selectable testID="mission-id">
            {request.id}
          </Text>
        </View>
        <Badge label={badge.label} tone={badge.tone} />
      </View>

      <Card style={styles.gap}>
        <View style={styles.row}>
          <Icon name="briefcase" size={16} color="primary" />
          <Text variant="bodyStrong">{SERVICE_LABELS[request.service]}</Text>
        </View>
        <View style={styles.row}>
          <Icon name="calendar" size={16} color="primary" />
          <Text variant="callout">
            {formatRange(request.startDate, request.service === 'dogWalking' ? 1 : request.days)}
            {request.service === 'dogWalking' ? ` · ${request.days} promenade${request.days > 1 ? 's' : ''}` : ` · ${request.days} jour${request.days > 1 ? 's' : ''}`}
          </Text>
        </View>
        <View style={styles.pets}>
          {pets.map((p) => (
            <View key={p.id} style={styles.row}>
              <PetAvatar pet={p} size={30} />
              <Text variant="callout">{p.name}</Text>
            </View>
          ))}
        </View>
      </Card>

      {request.status === 'locked' && lockedSitter && q ? (
        <Card tone="primarySoft" style={styles.gap} testID="locked-card">
          <View style={styles.row}>
            <Icon name="lock" size={18} color="primary" />
            <Text variant="title">Accord trouvé avec {lockedSitter.firstName}</Text>
          </View>
          <Text variant="callout" color="textMuted">
            La mission est verrouillée : aucun autre Pet Sitter ne peut plus l’accepter et les autres propositions ont été clôturées.
          </Text>
          <PriceBreakdown q={q} />
          <View style={styles.row}>
            <PawCoin size={18} />
            <Text variant="caption" color="textMuted" style={styles.flex}>
              {lockedSitter.firstName} gagnera {missionPawPoints({ ownerClub: owner.ownerClub, firstMission: lockedSitter.completedMissions === 0 })} Paw Points à la fin de la mission.
            </Text>
          </View>
        </Card>
      ) : null}

      {request.status === 'expired' ? (
        <Card tone="muted">
          <Text variant="callout">Aucun accord n’a été trouvé dans les délais. Vous pouvez lancer une nouvelle recherche.</Text>
        </Card>
      ) : null}

      <Text variant="title">{viewer === 'owner' ? 'Propositions des Pet Sitters' : 'Votre négociation'}</Text>
      {sorted.map((t) => {
        const sitter = findSitter(t.sitterId, mySitter);
        if (!sitter) return null;
        return (
          <ThreadCard
            key={t.sitterId}
            request={request}
            thread={t}
            sitter={sitter}
            viewer={viewer}
            floorCents={floor}
            demo={__DEV__ && viewer === 'owner' && sitter.id !== mySitter?.id}
            onAction={(party, action) => {
              const res = respondToOffer({ requestId: request.id, sitterId: t.sitterId, party, action, floorCents: floor });
              return res.ok ? undefined : res.error;
            }}
          />
        );
      })}

      {request.status === 'open' && viewer === 'owner' ? (
        <Button label="Annuler la demande" variant="ghost" icon="x-circle" onPress={() => setConfirmCancel(true)} testID="request-cancel" />
      ) : null}
      {request.status !== 'open' ? (
        <Button label="Voir mes missions" variant="secondary" onPress={() => router.replace('/missions')} />
      ) : null}

      <ConfirmSheet
        visible={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Annuler cette demande ?"
        message="Toutes les propositions en cours seront clôturées."
        confirmLabel="Annuler la demande"
        destructive
        onConfirm={() => cancel(request.id)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  idRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  gap: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
