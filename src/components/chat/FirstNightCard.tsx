import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PawCoin } from '@/components/levels/PawCoin';
import { Button, Chip, Icon, Input, Text } from '@/components/ui';
import { formatTime } from '@/features/chat/format';
import { MORNING_LABELS, NIGHT_LABELS, type FirstNightUpdate, type MorningAnswer, type NightAnswer } from '@/features/chat/types';
import { colors, radius, spacing } from '@/theme';

type Props = {
  update: FirstNightUpdate;
  petName: string;
  sitterName: string;
  /** Who looks at the card. */
  viewer: 'owner' | 'sitter';
  /** Sitter action (or demo action for the owner in dev builds). */
  onAnswer?: () => void;
};

/**
 * First Night Update card inside the chat.
 * Pending: neutral card with an "En attente" tag. Answered: answers + a green check and the Paw Points reward
 * in the top-right corner.
 */
export function FirstNightCard({ update, petName, sitterName, viewer, onAnswer }: Props) {
  const answered = update.status === 'answered';
  return (
    <View style={styles.wrap}>
      <View style={[styles.card, answered ? styles.cardDone : null]} testID={answered ? 'fnu-answered' : 'fnu-pending'}>
        <View style={styles.head}>
          <View style={[styles.moon, answered ? styles.moonDone : null]}>
            <Icon name="moon" size={18} color={answered ? 'success' : 'primary'} />
          </View>
          <View style={styles.flex}>
            <Text variant="title">First Night Update</Text>
            <Text variant="caption" color="textMuted">
              Première nuit de {petName}
            </Text>
          </View>
          {answered ? (
            <View style={styles.corner} testID="fnu-reward">
              <View style={styles.reward}>
                <PawCoin size={18} />
                <Text variant="badge" color="text">
                  +{update.rewardPoints}
                </Text>
              </View>
              <View style={styles.check}>
                <Icon name="check" size={16} color="textInverse" />
              </View>
            </View>
          ) : (
            <View style={styles.pendingTag}>
              <Icon name="clock" size={12} color="accentStrong" />
              <Text variant="badge" color="accentStrong">
                En attente
              </Text>
            </View>
          )}
        </View>

        {answered ? (
          <View style={styles.answers}>
            <QA q="Comment a-t-il passé sa première nuit ?" a={NIGHT_LABELS[update.night!]} />
            <QA q="Comment se comporte-t-il ce matin ?" a={MORNING_LABELS[update.morning!]} />
            {update.comment ? (
              <Text variant="body" style={styles.comment}>
                « {update.comment} »
              </Text>
            ) : null}
            {update.photo ? <Image source={{ uri: update.photo.uri }} style={styles.photo} contentFit="cover" /> : null}
            <Text variant="caption" color="textMuted" align="right">
              Envoyé par {sitterName} à {formatTime(update.answeredAt!)}
            </Text>
          </View>
        ) : (
          <View style={styles.answers}>
            <Text variant="callout" color="textMuted">
              {viewer === 'owner'
                ? `Dès demain matin, ${sitterName} vous dira comment ${petName} a passé sa première nuit…`
                : `Racontez au propriétaire comment ${petName} a passé sa première nuit. Deux questions, 30 secondes.`}
            </Text>
            {onAnswer ? (
              <Button
                label={viewer === 'sitter' ? 'Remplir le First Night Update' : `Mode démo · répondre en tant que ${sitterName}`}
                variant={viewer === 'sitter' ? 'primary' : 'secondary'}
                size="sm"
                icon={viewer === 'sitter' ? 'edit-3' : 'tool'}
                onPress={onAnswer}
                testID="fnu-answer"
              />
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

function QA({ q, a }: { q: string; a: string }) {
  return (
    <View style={styles.qa}>
      <Text variant="caption" color="textMuted">
        {q}
      </Text>
      <Text variant="bodyStrong">{a}</Text>
    </View>
  );
}

/** The sitter's form (2 questions, optional comment + photo). */
export function FirstNightForm({
  onSubmit,
  onPickPhoto,
}: {
  onSubmit: (a: { night: NightAnswer; morning: MorningAnswer; comment?: string }) => void;
  onPickPhoto?: () => void;
}) {
  const [night, setNight] = useState<NightAnswer>();
  const [morning, setMorning] = useState<MorningAnswer>();
  const [comment, setComment] = useState('');
  return (
    <View style={styles.form}>
      <Text variant="bodyStrong">Comment a-t-il passé sa première nuit ?</Text>
      <View style={styles.chips}>
        {(Object.keys(NIGHT_LABELS) as NightAnswer[]).map((k) => (
          <Chip key={k} label={NIGHT_LABELS[k]} selected={night === k} onPress={() => setNight(k)} testID={`fnu-night-${k}`} />
        ))}
      </View>
      <Text variant="bodyStrong">Comment se comporte-t-il ce matin ?</Text>
      <View style={styles.chips}>
        {(Object.keys(MORNING_LABELS) as MorningAnswer[]).map((k) => (
          <Chip key={k} label={MORNING_LABELS[k]} selected={morning === k} onPress={() => setMorning(k)} testID={`fnu-morning-${k}`} />
        ))}
      </View>
      <Input label="Commentaire (facultatif)" value={comment} onChangeText={setComment} multiline maxLength={300} testID="fnu-comment" />
      {onPickPhoto ? <Button label="Ajouter une photo (facultatif)" variant="ghost" size="sm" icon="camera" onPress={onPickPhoto} /> : null}
      <Button label="Envoyer le rapport" disabled={!night || !morning} onPress={() => onSubmit({ night: night!, morning: morning!, comment })} testID="fnu-submit" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md, marginVertical: spacing.sm, alignItems: 'center' },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardDone: { borderColor: colors.success },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  moon: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.brandTint, alignItems: 'center', justifyContent: 'center' },
  moonDone: { backgroundColor: colors.successSoft },
  flex: { flex: 1 },
  corner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start' },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 1,
    borderRadius: radius.pill,
  },
  check: { width: 28, height: 28, borderRadius: radius.pill, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  pendingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 1,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  answers: { gap: spacing.md },
  qa: { gap: 2 },
  comment: { fontStyle: 'italic' },
  photo: { width: '100%', height: 180, borderRadius: radius.md },
  form: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
