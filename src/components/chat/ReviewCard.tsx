import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Icon, Input, Text } from '@/components/ui';
import type { ChatParty, MissionChat } from '@/features/chat/types';
import { REVIEW_CRITERIA, REVIEW_PUBLISH_DAYS } from '@/features/reviews/criteria';
import { colors, radius, spacing } from '@/theme';

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <View style={styles.stars} accessibilityLabel={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name={i <= Math.round(value) ? 'mci:star' : 'mci:star-outline'} size={size} color="accent" />
      ))}
    </View>
  );
}

type CardProps = { chat: MissionChat; me: ChatParty; otherName: string; onReview: () => void };

/** Shown in the chat once the mission is completed. Reviews stay hidden until both are in (or 14 days). */
export function ReviewCard({ chat, me, otherName, onReview }: CardProps) {
  const mine = chat.reviews?.[me];
  const theirs = chat.reviews?.[me === 'owner' ? 'sitter' : 'owner'];
  return (
    <View style={styles.wrap}>
      <View style={styles.card} testID={mine && theirs ? 'review-published' : mine ? 'review-waiting' : 'review-todo'}>
        <View style={styles.head}>
          <View style={styles.icon}>
            <Icon name="mci:star-outline" size={20} color="accentStrong" />
          </View>
          <Text variant="title" style={styles.flex}>
            {mine && theirs ? 'Avis publiés' : `Votre avis sur ${otherName}`}
          </Text>
        </View>
        {!mine ? (
          <>
            <Text variant="callout" color="textMuted">
              Comment s’est passée la mission ? Votre avis restera masqué jusqu’à ce que {otherName} donne le sien, ou pendant{' '}
              {REVIEW_PUBLISH_DAYS} jours.
            </Text>
            <Button label="Donner mon avis" icon="star" size="sm" onPress={onReview} testID="review-open" />
          </>
        ) : !theirs ? (
          <>
            <View style={styles.row}>
              <Text variant="callout">Votre note</Text>
              <Stars value={mine.rating} />
            </View>
            <Text variant="callout" color="textMuted">
              Votre avis est enregistré. Il sera visible quand {otherName} aura donné le sien, ou dans {REVIEW_PUBLISH_DAYS} jours.
            </Text>
          </>
        ) : (
          <>
            <View style={styles.row}>
              <Text variant="callout">Votre note pour {otherName}</Text>
              <Stars value={mine.rating} />
            </View>
            <View style={styles.row}>
              <Text variant="callout">Note de {otherName}</Text>
              <Stars value={theirs.rating} />
            </View>
            {theirs.comment ? (
              <Text variant="body" style={styles.comment}>
                « {theirs.comment} »
              </Text>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

/** Review form: 4 criteria with tappable stars + optional comment. */
export function ReviewForm({ role, otherName, onSubmit }: { role: ChatParty; otherName: string; onSubmit: (c: Record<string, number>, comment: string) => void }) {
  const [criteria, setCriteria] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const items = REVIEW_CRITERIA[role];
  const complete = items.every((c) => criteria[c.key]);
  return (
    <View style={styles.form}>
      <Text variant="callout" color="textMuted" align="center">
        Notez {otherName} de 1 à 5 sur chaque critère.
      </Text>
      {items.map((c) => (
        <View key={c.key} style={styles.criterion}>
          <Text variant="bodyStrong" style={styles.flex}>
            {c.label}
          </Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={`${c.label} : ${i} sur 5`}
                hitSlop={4}
                onPress={() => setCriteria({ ...criteria, [c.key]: i })}
                testID={`review-${c.key}-${i}`}>
                <Icon name={i <= (criteria[c.key] ?? 0) ? 'mci:star' : 'mci:star-outline'} size={28} color="accent" />
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      <Input label="Commentaire (facultatif)" value={comment} onChangeText={setComment} multiline maxLength={1000} testID="review-comment" />
      <Button label="Publier mon avis" disabled={!complete} onPress={() => onSubmit(criteria, comment)} testID="review-submit" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md, marginVertical: spacing.sm, alignItems: 'center' },
  card: { width: '100%', maxWidth: 420, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  stars: { flexDirection: 'row', gap: 2 },
  comment: { fontStyle: 'italic' },
  form: { gap: spacing.lg },
  criterion: { gap: spacing.sm },
});
