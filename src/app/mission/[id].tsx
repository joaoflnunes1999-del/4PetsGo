import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatBubble, SystemChip } from '@/components/chat/ChatBubble';
import { ChatInputBar } from '@/components/chat/ChatInputBar';
import { MissionCodes } from '@/components/chat/MissionCodes';
import { PhotoReminderBanner } from '@/components/chat/PhotoReminderBanner';
import { ReviewCard, ReviewForm } from '@/components/chat/ReviewCard';
import { OwnerAvatar } from '@/components/owners/OwnerAvatar';
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
  const [reviewOpen, setReviewOpen] = useState(false);
  /** Dev-only: look at the same chat as the owner or as the sitter. */
  const [viewAs, setViewAs] = useState<ChatParty>();
  const owner = useAppStore((s) => s.owner);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const count = chat?.messages.length ?? 0;
  const fnuStatus = chat?.firstNight.status;

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [count, fnuStatus, chat?.status, chat?.reviews]);

  const sitter = request?.lockedSitterId ? findSitter(request.lockedSitterId, mySitter) : undefined;
  if (!request || !chat || !sitter) {
    return (
      <Screen back>
        <EmptyState icon="message-circle" title="Chat indisponible" body="Le chat s’ouvre une fois la mission confirmée." />
      </Screen>
    );
  }

  const me: ChatParty = viewAs ?? (role === 'sitter' ? 'sitter' : 'owner');
  const ownerName = owner?.firstName ?? 'Le propriétaire';
  const endDate = new Date(`${request.startDate}T12:00:00`);
  endDate.setDate(endDate.getDate() + (request.service === 'dogWalking' ? 0 : request.days - 1));
  const isLastDay = new Date().setHours(23, 59, 59, 999) >= endDate.getTime();
  const finishDropoff = (code: string) => {
    const r = useAppStore.getState().enterDropoffCode(id, code);
    if (r === 'started') setCodesOpen(false);
    return r;
  };
  const petName = pets.filter((p) => request.petIds.includes(p.id)).map((p) => p.name).join(' & ') || 'votre animal';

  const attach = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ALLOWED_FILES, copyToCacheDirectory: true, multiple: false });
    if (res.canceled || !res.assets?.length) return;
    const a = res.assets[0];
    if (a.size && a.size > 20 * 1024 * 1024) return;
    sendChatFile(id, me, { name: a.name, mime: a.mimeType ?? 'application/octet-stream', uri: a.uri, size: a.size });
  };
  const sendPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (res.canceled || !res.assets?.length) return;
    const a = res.assets[0];
    sendChatFile(id, me, { name: a.fileName ?? 'photo.jpg', mime: a.mimeType ?? 'image/jpeg', uri: a.uri, size: a.fileSize, width: a.width, height: a.height });
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
        {me === 'owner' ? <SitterAvatar sitter={sitter} size={38} /> : owner ? <OwnerAvatar owner={owner} size={38} /> : null}
        <View style={styles.flex}>
          <Text variant="title" numberOfLines={1}>
            {me === 'owner' ? sitter.firstName : ownerName}
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

      {__DEV__ ? (
        <View style={styles.viewBar}>
          <Text variant="label" color="info">
            MODE DÉMO · VUE
          </Text>
          {(['owner', 'sitter'] as const).map((v) => (
            <Pressable
              key={v}
              onPress={() => setViewAs(v)}
              style={[styles.viewChip, me === v ? styles.viewChipOn : null]}
              testID={`view-${v}`}
              accessibilityRole="button">
              <Text variant="badge" color={me === v ? 'textInverse' : 'info'}>
                {v === 'owner' ? `Owner (${ownerName})` : `Pet Sitter (${sitter.firstName})`}
              </Text>
            </Pressable>
          ))}
          {chat.status === 'in_progress' ? (
            <Pressable onPress={() => useAppStore.getState().advanceDemoClock(id, 24)} style={styles.viewChip} testID="demo-advance" accessibilityRole="button">
              <Text variant="badge" color="info">
                +24 h
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <PhotoReminderBanner chat={chat} days={request.days} me={me} sitterName={sitter.firstName} onSendPhoto={sendPhoto} />

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
                onAnswer={me === 'sitter' ? () => setFnuOpen(true) : undefined}
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
        {chat.status === 'completed' ? (
          <ReviewCard chat={chat} me={me} otherName={me === 'owner' ? sitter.firstName : ownerName} onReview={() => setReviewOpen(true)} />
        ) : null}
      </ScrollView>

      <ChatInputBar onSend={(t) => sendChatMessage(id, me, t)} onAttach={attach} onCamera={camera} />

      <Sheet visible={codesOpen} onClose={() => setCodesOpen(false)} title="Codes de la mission">
        <MissionCodes
          chat={chat}
          me={me}
          sitterName={sitter.firstName}
          ownerName={ownerName}
          petName={petName}
          isLastDay={isLastDay}
          onDropoff={finishDropoff}
          onGeneratePickup={(reason) => {
            const r = useAppStore.getState().generatePickupCode(id, reason);
            return r.ok ? r.code : undefined;
          }}
          onPickup={(code) => {
            const r = useAppStore.getState().enterPickupCode(id, code);
            if (r === 'completed') setCodesOpen(false);
            return r;
          }}
        />
        <Button label="Fermer" variant="ghost" onPress={() => setCodesOpen(false)} />
      </Sheet>

      <Sheet visible={reviewOpen} onClose={() => setReviewOpen(false)} title="Votre avis">
        <ReviewForm
          role={me}
          otherName={me === 'owner' ? sitter.firstName : ownerName}
          onSubmit={(criteria, comment) => {
            if (useAppStore.getState().submitReview(id, me, criteria, comment).ok) setReviewOpen(false);
          }}
        />
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
  viewBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, backgroundColor: colors.infoSoft },
  viewChip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs + 1, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.info },
  viewChipOn: { backgroundColor: colors.info },
  bodyContent: { paddingVertical: spacing.md, maxWidth: layout.maxContentWidth + 80, width: '100%', alignSelf: 'center' },
});
