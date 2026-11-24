import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge, Button, Card, EmptyState, Icon, Screen, Text } from '@/components/ui';
import { REQUEST_BADGE } from '@/features/booking/labels';
import { agreedOffer, currentOffer, turnOf } from '@/features/booking/negotiation';
import { SERVICE_LABELS, formatMoney } from '@/features/pricing/pricing';
import { formatRange } from '@/lib/dates';
import { findSitter, useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme';

export default function MissionsTab() {
  const role = useAppStore((s) => s.role);
  const requests = useAppStore((s) => s.requests);
  const pets = useAppStore((s) => s.pets);
  const mySitter = useAppStore((s) => s.mySitter);
  const refreshExpiry = useAppStore((s) => s.refreshExpiry);
  useEffect(() => refreshExpiry(), [refreshExpiry]);

  const isSitter = role === 'sitter';
  const visible = isSitter ? requests.filter((r) => r.threads.some((t) => t.sitterId === mySitter?.id)) : requests;

  return (
    <Screen>
      <Text variant="displayL" style={styles.title}>
        {isSitter ? 'Demandes' : 'Missions'}
      </Text>
      {visible.length === 0 ? (
        isSitter ? (
          <EmptyState
            icon="inbox"
            title="Aucune demande pour l’instant"
            body="Les demandes des propriétaires apparaissent ici. Vous pourrez accepter, refuser ou faire jusqu’à 3 contre-propositions."
          />
        ) : (
          <EmptyState icon="calendar" title="Aucune mission" body="Trouvez un Pet Sitter et envoyez votre première demande.">
            <Button label="Rechercher un Pet Sitter" onPress={() => router.push('/search')} testID="missions-search" />
          </EmptyState>
        )
      ) : (
        visible.map((r) => {
          const badge = REQUEST_BADGE[r.status];
          const names = pets.filter((p) => r.petIds.includes(p.id)).map((p) => p.name).join(', ');
          const locked = r.lockedSitterId ? findSitter(r.lockedSitterId, mySitter) : undefined;
          const agreed = agreedOffer(r);
          const waitingOnMe = r.threads.filter((t) => turnOf(t) === (isSitter ? 'sitter' : 'owner')).length;
          const best = r.threads
            .map((t) => currentOffer(t))
            .filter((o) => o && o.status === 'pending')
            .sort((a, b) => a!.priceCents - b!.priceCents)[0];
          return (
            <Card key={r.id} onPress={() => router.push({ pathname: '/request/[id]', params: { id: r.id } })} style={styles.card} testID={`mission-${r.id}`}>
              <View style={styles.row}>
                <Text variant="label" color="textMuted" style={styles.flex}>
                  {r.id}
                </Text>
                <Badge label={badge.label} tone={badge.tone} />
              </View>
              <Text variant="title">
                {SERVICE_LABELS[r.service]} · {names}
              </Text>
              <Text variant="caption" color="textMuted">
                {formatRange(r.startDate, r.service === 'dogWalking' ? 1 : r.days)}
              </Text>
              {locked && agreed ? (
                <View style={styles.row}>
                  <Icon name="lock" size={14} color="success" />
                  <Text variant="callout">
                    Avec {locked.firstName} · {formatMoney(agreed.priceCents, r.currency)}
                  </Text>
                </View>
              ) : r.status === 'open' ? (
                <Text variant="callout" color={waitingOnMe ? 'accentStrong' : 'textMuted'}>
                  {waitingOnMe
                    ? `${waitingOnMe} réponse${waitingOnMe > 1 ? 's' : ''} attend${waitingOnMe > 1 ? 'ent' : ''} votre décision`
                    : `${r.threads.length} Pet Sitter${r.threads.length > 1 ? 's' : ''} contacté${r.threads.length > 1 ? 's' : ''}`}
                  {best ? ` · dès ${formatMoney(best.priceCents, r.currency)}` : ''}
                </Text>
              ) : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingTop: spacing.md },
  card: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});
