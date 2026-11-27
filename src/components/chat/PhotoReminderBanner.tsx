import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { isImage } from '@/features/chat/format';
import { currentPhotoSlot, photoSchedule } from '@/features/chat/photoSchedule';
import type { ChatParty, MissionChat } from '@/features/chat/types';
import { useNow } from '@/lib/useNow';
import { colors, radius, spacing } from '@/theme';

const fmt = (t: number) =>
  new Date(t).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

type Props = { chat: MissionChat; days: number; me: ChatParty; sitterName: string; onSendPhoto: () => void };

/** Pinned under the chat header during the mission: the 48 h photo schedule (PRD §3.9). */
export function PhotoReminderBanner({ chat, days, me, sitterName, onSendPhoto }: Props) {
  const realNow = useNow();
  if (chat.status !== 'in_progress' || !chat.startedAt) return null;
  const now = realNow + (chat.demoOffsetHours ?? 0) * 3600_000;
  const photoTimes = chat.messages
    .filter((m) => m.from === 'sitter' && m.kind === 'file' && m.file && isImage(m.file.mime))
    .map((m) => new Date(m.createdAt).getTime());
  const slots = photoSchedule({ startedAt: new Date(chat.startedAt).getTime(), days, photoTimes, now });
  if (slots.length === 0) return null;
  const current = currentPhotoSlot(slots);
  const late = slots.find((s) => s.status === 'late');
  const focus = late ?? current;

  let tone: 'due' | 'late' | 'calm' | 'done' = 'calm';
  let text: string;
  if (!focus) {
    tone = 'done';
    text = me === 'sitter' ? 'Toutes les photos prévues ont été envoyées. Merci !' : `${sitterName} a envoyé toutes les photos prévues.`;
  } else if (focus.status === 'late') {
    tone = 'late';
    text = me === 'sitter' ? `Photo du jour ${focus.day} en retard : envoyez-la dès que possible.` : `Photo du jour ${focus.day} pas encore reçue.`;
  } else if (focus.status === 'due') {
    tone = 'due';
    text = me === 'sitter' ? `Photo du jour ${focus.day} à envoyer avant ${fmt(focus.dueAt + 6 * 3600_000)}` : `${sitterName} enverra une photo de jour ${focus.day} d’ici ${fmt(focus.dueAt + 6 * 3600_000)}.`;
  } else {
    text = me === 'sitter' ? `Prochaine photo à envoyer : jour ${focus.day}, ${fmt(focus.dueAt)}` : `Prochaine photo de ${sitterName} : jour ${focus.day}, ${fmt(focus.dueAt)}`;
  }

  const bg = { due: colors.brandTint, late: colors.dangerSoft, calm: colors.surface, done: colors.successSoft }[tone];
  const iconColor = { due: 'primary', late: 'danger', calm: 'textMuted', done: 'success' }[tone] as 'primary' | 'danger' | 'textMuted' | 'success';
  return (
    <View style={[styles.banner, { backgroundColor: bg }]} testID={`photo-banner-${tone}`}>
      <Icon name={tone === 'done' ? 'check-circle' : 'camera'} size={18} color={iconColor} />
      <View style={styles.flex}>
        <Text variant="callout">{text}</Text>
        <View style={styles.dots}>
          {slots.map((s) => (
            <View key={s.index} style={[styles.dot, s.status === 'done' ? styles.dotDone : s.status === 'late' ? styles.dotLate : null]}>
              <Text variant="label" color={s.status === 'done' ? 'textInverse' : 'textMuted'}>
                J{s.day}
              </Text>
            </View>
          ))}
          <Text variant="caption" color="textMuted">
            1 photo toutes les 48 h
          </Text>
        </View>
      </View>
      {me === 'sitter' && (tone === 'due' || tone === 'late') ? (
        <Pressable accessibilityRole="button" onPress={onSendPhoto} style={styles.cta} testID="photo-banner-send">
          <Text variant="badge" color="textInverse">
            Envoyer
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  flex: { flex: 1, gap: spacing.xs },
  dots: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  dotDone: { backgroundColor: colors.success, borderColor: colors.success },
  dotLate: { borderColor: colors.danger },
  cta: { backgroundColor: colors.action, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill },
});
