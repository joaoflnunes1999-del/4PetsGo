import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';

type Props = { onSend: (text: string) => void; onAttach: () => void; onCamera: () => void };

/** WhatsApp-like composer: attach + camera on the left of a rounded field, round send button on the right. */
export function ChatInputBar({ onSend, onAttach, onCamera }: Props) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0;
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={styles.field}>
        <Pressable accessibilityRole="button" accessibilityLabel="Joindre un fichier" onPress={onAttach} hitSlop={8} testID="chat-attach">
          <Icon name="paperclip" size={20} color="textMuted" />
        </Pressable>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message"
          placeholderTextColor={colors.textSubtle}
          multiline
          style={styles.input}
          accessibilityLabel="Message"
          testID="chat-input"
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Prendre une photo" onPress={onCamera} hitSlop={8}>
          <Icon name="camera" size={20} color="textMuted" />
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Envoyer"
        disabled={!canSend}
        onPress={() => {
          onSend(text);
          setText('');
        }}
        style={[styles.send, !canSend ? styles.sendIdle : null]}
        testID="chat-send">
        <Icon name="send" size={18} color="textInverse" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    backgroundColor: colors.chatBackground,
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    minHeight: 46,
  },
  input: { flex: 1, ...typography.body, color: colors.text, paddingVertical: spacing.sm, maxHeight: 120 },
  send: { width: 46, height: 46, borderRadius: radius.pill, backgroundColor: colors.sendButton, alignItems: 'center', justifyContent: 'center' },
  sendIdle: { opacity: 0.55 },
});
