import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SitterAvatar } from '@/components/sitters/SitterAvatar';
import { Badge, Button, Card, Icon, Text } from '@/components/ui';
import type { BookingRequest, NegotiationThread, OfferParty, OfferStatus, SitterProfile, ThreadStatus } from '@/domain/types';
import { currentOffer, offersLeft, turnOf, type NegotiationAction } from '@/features/booking/negotiation';
import { formatMoney } from '@/features/pricing/pricing';
import { formatDateTime, formatTimeLeft } from '@/lib/dates';
import { colors, radius, spacing } from '@/theme';

import { CounterOfferSheet } from './CounterOfferSheet';

const THREAD_BADGE: Record<ThreadStatus, { label: string; tone: 'primary' | 'success' | 'muted' | 'warning' | 'danger' }> = {
  negotiating: { label: 'EN NÉGOCIATION', tone: 'primary' },
  agreed: { label: 'ACCORD', tone: 'success' },
  declined: { label: 'REFUSÉE', tone: 'danger' },
  expired: { label: 'EXPIRÉE', tone: 'warning' },
  closed: { label: 'CLÔTURÉE', tone: 'muted' },
};

const OFFER_STATUS: Record<OfferStatus, string> = {
  pending: 'en attente',
  countered: 'contre-proposée',
  accepted: 'acceptée',
  declined: 'refusée',
  expired: 'expirée',
  superseded: 'clôturée',
};

type Props = {
  request: BookingRequest;
  thread: NegotiationThread;
  sitter: SitterProfile;
  /** Who is using the app. */
  viewer: OfferParty;
  floorCents: number;
  onAction: (party: OfferParty, action: NegotiationAction) => string | undefined;
  /** Phase 1 only: lets the tester answer on behalf of the demo sitter. */
  demo?: boolean;
};

export function ThreadCard({ request, thread, sitter, viewer, floorCents, onAction, demo }: Props) {
  const [counterFor, setCounterFor] = useState<OfferParty>();
  const [error, setError] = useState<string>();
  const offer = currentOffer(thread);
  const turn = turnOf(thread);
  const cur = request.currency;
  const label = (by: OfferParty) => (by === viewer ? 'Vous' : by === 'sitter' ? sitter.firstName : 'Le propriétaire');
  const run = (party: OfferParty, action: NegotiationAction) => {
    const e = onAction(party, action);
    setError(e);
    return e;
  };

  const actionsFor = (party: OfferParty, isDemo: boolean) => (
    <View style={[styles.actions, isDemo ? styles.demo : null]}>
      {isDemo ? (
        <View style={styles.demoHead}>
          <Icon name="tool" size={14} color="info" />
          <Text variant="label" color="info">
            MODE DÉMO · RÉPONDRE EN TANT QUE {sitter.firstName.toUpperCase()}
          </Text>
        </View>
      ) : null}
      <Button
        label={`Accepter ${formatMoney(offer!.priceCents, cur)}`}
        icon="check"
        onPress={() => run(party, { type: 'accept' })}
        testID={`${isDemo ? 'demo' : 'me'}-accept-${sitter.id}`}
      />
      <View style={styles.row}>
        <Button
          label="Contre-proposer"
          variant="secondary"
          size="sm"
          disabled={offersLeft(thread, party) === 0}
          onPress={() => setCounterFor(party)}
          style={styles.flex}
          testID={`${isDemo ? 'demo' : 'me'}-counter-${sitter.id}`}
        />
        <Button
          label="Refuser"
          variant="ghost"
          size="sm"
          onPress={() => run(party, { type: 'decline' })}
          style={styles.flex}
          testID={`${isDemo ? 'demo' : 'me'}-decline-${sitter.id}`}
        />
      </View>
      {offersLeft(thread, party) === 0 ? (
        <Text variant="caption" color="textMuted" align="center">
          Nombre maximum de propositions atteint : acceptez ou refusez la dernière offre.
        </Text>
      ) : null}
    </View>
  );

  return (
    <Card style={[styles.card, thread.status === 'agreed' ? styles.agreed : null]}>
      <View style={styles.head}>
        <SitterAvatar sitter={sitter} size={44} />
        <View style={styles.flex}>
          <Text variant="title">{sitter.firstName}</Text>
          {offer ? (
            <Text variant="caption" color="textMuted">
              Dernière offre : {formatMoney(offer.priceCents, cur)}
            </Text>
          ) : null}
        </View>
        <Badge label={THREAD_BADGE[thread.status].label} tone={THREAD_BADGE[thread.status].tone} />
      </View>

      <View style={styles.timeline}>
        {thread.offers.map((o, i) => (
          <View key={o.id} style={styles.offer}>
            <View style={[styles.dot, o.status === 'accepted' ? styles.dotOn : null]} />
            <View style={styles.flex}>
              <Text variant="callout">
                <Text variant="bodyStrong">{label(o.by)}</Text>
                {i === 0 ? ' · demande initiale' : ' · contre-proposition'} · {formatMoney(o.priceCents, cur)}
              </Text>
              <Text variant="caption" color="textMuted">
                {formatDateTime(o.createdAt)} · {o.status === 'pending' ? formatTimeLeft(o.expiresAt) : OFFER_STATUS[o.status]}
              </Text>
              {o.message ? (
                <Text variant="caption" color="textMuted" numberOfLines={3}>
                  « {o.message} »
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      {turn === viewer && offer ? actionsFor(viewer, false) : null}
      {turn && turn !== viewer && offer ? (
        <Text variant="caption" color="textMuted">
          En attente de la réponse de {turn === 'sitter' ? sitter.firstName : 'du propriétaire'} · {formatTimeLeft(offer.expiresAt)}
        </Text>
      ) : null}
      {demo && turn && turn !== viewer && offer ? actionsFor(turn, true) : null}
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}

      {offer && counterFor ? (
        <CounterOfferSheet
          visible={!!counterFor}
          onClose={() => setCounterFor(undefined)}
          currency={cur}
          floorCents={floorCents}
          currentCents={offer.priceCents}
          offersLeft={offersLeft(thread, counterFor)}
          title={counterFor === viewer ? 'Votre contre-proposition' : `Contre-proposition de ${sitter.firstName}`}
          onSubmit={(priceCents) => run(counterFor, { type: 'counter', priceCents })}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  agreed: { borderWidth: 1.5, borderColor: colors.success },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.sm },
  timeline: { gap: spacing.md, paddingLeft: spacing.xs },
  offer: { flexDirection: 'row', gap: spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border, marginTop: 6 },
  dotOn: { backgroundColor: colors.success },
  actions: { gap: spacing.sm },
  demo: { backgroundColor: colors.infoSoft, padding: spacing.md, borderRadius: radius.md },
  demoHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
