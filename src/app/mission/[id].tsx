import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatBubble, SystemChip } from '@/components/chat/ChatBubble';
import { ChatInputBar } from '@/components/chat/ChatInputBar';
import { FirstNightCard, FirstNightForm } from '@/components/chat/FirstNightCard';
import { SitterAvatar } from '@/components/sitters/SitterAvatar';
import { Button, EmptyState, Icon, Screen, Sheet, Text } from '@/components/ui';
import { dayLabel } from '@/features/chat/format';
import type { ChatParty } from '@/features/chat/types';
import { formatRange } from '@/lib/dates';
import { findSitter, useAppStore } from '@/store/useAppStore';
import { colors, layout, radius, spacing } from '@/theme';

const ALLOWED_FILES = [
  'application/pdf',
  'image/*',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

/** Mission chat (WhatsApp-like). Messages are append-only: no edit, no delete. */
export default function MissionChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const request = useAppStore((s) => s.requests.find((r) => r.id === id));
  const chat = useAppStore((s) => s.chats[id]);
  const pets = useAppStore((s) => s.pets);
  const role = useAppStore((s) => s.role);
  const mySitter = useAppStore((s) => s.mySitter);
  const { sendChatMessage, sendChatFile, answerFirstNight } = useAppStore.getState();
  const [codesOpen, setCodesOpen] = useState(false);
  const [fnuOpen, setFnuOpen] = useState(false);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const count = chat?.messages.length ?? 0;
  const fnuStatus = chat?.firstNight.status;

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [count, fnuStatus]);

  const sitter = request?.lockedSitterId ? findSitter(request.lockedSitterId, mySitter) : undefined;
  if (!request || !chat || !sitter) {
    return (
      <Screen back>
        <EmptyState icon="message-circle" title="Chat indisponible" body="Le chat s’ouvre une fois la mission confirmée." />
      </Screen>
    );
  }

  const me: ChatParty = role === 'sitter' ? 'sitter' : 'owner';
  const petName = pets.filter((p) => request.petIds.includes(p.id)).map((p) => p.name).join(' & ') || 'votre animal';

  const attach = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ALLOWED_FILES, copyToCacheDirectory: true, multiple: false });
    if (res.canceled || !res.assets?.length) return;
    const a = res.assets[0];
    if (a.size && a.size > 20 * 1024 * 1024) return;
    sendChatFile(id, me, { name: a.name, mime: a.mimeType ?? 'application/octet-stream', uri: a.uri, size: a.size });
  };
  const camera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (res.canceled || !res.assets?.length) return;
    const a = res.assets[0];
    sendChatFile(id, me, { name: a.fileName ?? 'photo.jpg', mime: a.mimeType ?? 'image/jpeg', uri: a.uri, size: a.fileSize, width: a.width, height: a.height });
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" hitSlop={layout.hitSlop} onPress={() => router.back()}>
          <Icon name="chevron-left" size={26} />
        </Pressable>
        <SitterAvatar sitter={sitter} size={38} />
        <View style={styles.flex}>
          <Text variant="title" numberOfLines={1}>
            {sitter.firstName}
          </Text>
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {request.id} · {formatRange(request.startDate, request.service === 'dogWalking' ? 1 : request.days)}
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Codes de remise" onPress={() => setCodesOpen(true)} style={styles.codesBtn} testID="chat-codes">
          <Icon name="key" size={18} color="primary" />
          <Text variant="badge" color="primary">
            Codes
          </Text>
        </Pressable>
      </View>

      <ScrollView ref={scrollRef} style={styles.body} contentContainerStyle={styles.bodyContent} testID="chat-scroll">
        <SystemChip icon="lock" text="Messages et fichiers visibles uniquement par vous deux. Ils ne peuvent être ni modifiés ni supprimés." />
        {chat.messages.map((m, i) => {
          const day = dayLabel(m.createdAt);
          const sep = i === 0 || dayLabel(chat.messages[i - 1].createdAt) !== day ? <SystemChip key={`d-${m.id}`} text={day} /> : null;
          let content;
          if (m.kind === 'event') content = <SystemChip key={m.id} icon="check" text={m.body ?? ''} />;
          else if (m.kind === 'firstNight')
            content = (
              <FirstNightCard
                key={m.id}
                update={chat.firstNight}
                petName={petName}
                sitterName={sitter.firstName}
                viewer={me}
                onAnswer={me === 'sitter' || __DEV__ ? () => setFnuOpen(true) : undefined}
              />
            );
          else content = <ChatBubble key={m.id} message={m} mine={m.from === me} />;
          return (
            <View key={`w-${m.id}`}>
              {sep}
              {content}
            </View>
          );
        })}
      </ScrollView>

      <ChatInputBar onSend={(t) => sendChatMessage(id, me, t)} onAttach={attach} onCamera={camera} />

      <Sheet visible={codesOpen} onClose={() => setCodesOpen(false)} title="Code de remise">
        {me === 'owner' ? (
          <View style={styles.codeBox}>
            <Text variant="caption" color="textMuted" align="center">
              À donner à {sitter.firstName} au moment où vous lui confiez {petName}
            </Text>
            <Text style={styles.code} testID="dropoff-code">
              {chat.dropoffCode.slice(0, 3)} {chat.dropoffCode.slice(3)}
            </Text>
            <View style={styles.disclaimer}>
              <Icon name="alert-triangle" size={16} color="warning" />
              <Text variant="caption" style={styles.flex}>
                Ce code ne doit être donné qu’au moment de la remise de votre animal au Pet Sitter.
              </Text>
            </View>
          </View>
        ) : (
          <Text variant="body" color="textMuted">
            Saisissez le code que le propriétaire vous donne à la remise de l’animal.
          </Text>
        )}
        <Button label="Fermer" variant="ghost" onPress={() => setCodesOpen(false)} />
      </Sheet>

      <Sheet visible={fnuOpen} onClose={() => setFnuOpen(false)} title="First Night Update">
        <FirstNightForm
          onSubmit={(a) => {
            const res = answerFirstNight(id, a);
            if (res.ok) setFnuOpen(false);
          }}
        />
      </Sheet>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.chatBackground },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  flex: { flex: 1 },
  codesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTint,
  },
  body: { flex: 1 },
  bodyContent: { paddingVertical: spacing.md, maxWidth: layout.maxContentWidth + 80, width: '100%', alignSelf: 'center' },
  codeBox: { gap: spacing.md, alignItems: 'center' },
  code: { fontSize: 40, lineHeight: 48, letterSpacing: 6, fontFamily: 'Inter_700Bold', color: colors.text },
  disclaimer: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: colors.warningSoft,
    padding: spacing.md,
    borderRadius: radius.md,
  },
});
