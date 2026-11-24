import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { formatFileSize, formatTime, isImage } from '@/features/chat/format';
import type { ChatMessage } from '@/features/chat/types';
import { colors, radius, spacing } from '@/theme';

/** WhatsApp-like bubble: own messages on the right (terracotta tint), the other party on the left (white). */
export function ChatBubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  const file = message.file;
  const image = file && isImage(file.mime);
  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowOther]}>
      <View
        style={[styles.bubble, mine ? styles.mine : styles.other, image ? styles.imageBubble : null]}
        testID={`chat-msg-${message.kind}`}>
        {image ? (
          <Image source={{ uri: file.uri }} style={styles.image} contentFit="cover" accessibilityLabel={file.name} />
        ) : file ? (
          <View style={styles.file}>
            <View style={styles.fileIcon}>
              <Icon name={file.mime === 'application/pdf' ? 'mci:file-pdf-box' : 'file-text'} size={22} color="primary" />
            </View>
            <View style={styles.flex}>
              <Text variant="callout" numberOfLines={1}>
                {file.name}
              </Text>
              <Text variant="caption" color="textMuted">
                {[file.mime === 'application/pdf' ? 'PDF' : 'Document', formatFileSize(file.size)].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>
        ) : null}
        {message.body ? <Text variant="body">{message.body}</Text> : null}
        <View style={[styles.meta, image ? styles.metaOnImage : null]}>
          <Text variant="caption" style={[styles.time, image ? styles.timeOnImage : null]}>
            {formatTime(message.createdAt)}
          </Text>
          {mine ? <Icon name="mci:check-all" size={15} color={image ? 'textInverse' : 'readTicks'} /> : null}
        </View>
      </View>
    </View>
  );
}

/** Centered system chip (mission events), like WhatsApp's encryption / date notices. */
export function SystemChip({ text, icon }: { text: string; icon?: 'lock' | 'calendar' | 'check' }) {
  return (
    <View style={styles.chipRow}>
      <View style={styles.chip}>
        {icon ? <Icon name={icon} size={12} color="textMuted" /> : null}
        <Text variant="caption" color="textMuted" align="center">
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: spacing.md, marginVertical: 2 },
  rowMine: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs, borderRadius: radius.lg, gap: spacing.xs },
  mine: { backgroundColor: colors.bubbleOwn, borderTopRightRadius: radius.xs },
  other: { backgroundColor: colors.bubbleOther, borderTopLeftRadius: radius.xs },
  imageBubble: { padding: spacing.xs, paddingBottom: spacing.xs },
  image: { width: 220, height: 220, borderRadius: radius.md },
  file: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minWidth: 200 },
  fileIcon: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.brandTint, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-end' },
  metaOnImage: { position: 'absolute', right: spacing.md, bottom: spacing.sm },
  time: { fontSize: 11, lineHeight: 14, color: colors.textMuted },
  timeOnImage: { color: colors.textInverse },
  chipRow: { alignItems: 'center', marginVertical: spacing.sm, paddingHorizontal: spacing.xl },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
});
