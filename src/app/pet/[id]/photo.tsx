import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet, Button, ConfirmSheet, Icon, Input, Sheet, Text } from '@/components/ui';
import type { PetPhoto } from '@/domain/types';
import { formatDateTime } from '@/lib/dates';
import { useAppStore } from '@/store/useAppStore';
import { colors, layout, spacing } from '@/theme';

/** Full-screen viewer with swipe between photos (newest first, same order as the grid). */
export default function PhotoViewer() {
  const { id, index } = useLocalSearchParams<{ id: string; index?: string }>();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pet = useAppStore((s) => s.pets.find((p) => p.id === id));
  const allPhotos = useAppStore((s) => s.photos);
  const { setMainPhoto, updatePhoto, deletePhoto } = useAppStore.getState();
  const photos = useMemo(
    () => allPhotos.filter((p) => p.petId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allPhotos, id],
  );
  const start = Math.min(Number(index ?? 0), Math.max(photos.length - 1, 0));
  const [current, setCurrent] = useState(start);
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState('');
  const [confirm, setConfirm] = useState(false);
  const listRef = useRef<FlatList<PetPhoto>>(null);


  const photo = photos[current];
  if (!pet || !photo) {
    return (
      <View style={[styles.root, styles.center]}>
        <Button label="Fermer" variant="secondary" fullWidth={false} onPress={() => router.back()} />
      </View>
    );
  }
  const isMain = pet.mainPhotoId === photo.id;

  return (
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        data={photos}
        keyExtractor={(p) => p.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={start}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        scrollEventThrottle={32}
        onScroll={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          if (i !== current && i >= 0 && i < photos.length) setCurrent(i);
        }}
        renderItem={({ item }) => (
          <View style={{ width, height }}>
            <Image source={{ uri: item.uri }} style={styles.image} contentFit="contain" accessibilityLabel={item.caption} />
          </View>
        )}
      />

      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer" hitSlop={layout.hitSlop} onPress={() => router.back()} testID="viewer-close">
          <Icon name="x" size={26} color="textInverse" />
        </Pressable>
        <Text variant="callout" color="textInverse">
          {current + 1} / {photos.length}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Options de la photo" hitSlop={layout.hitSlop} onPress={() => setMenu(true)} testID="viewer-menu">
          <Icon name="more-horizontal" size={26} color="textInverse" />
        </Pressable>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}>
        {isMain ? (
          <View style={styles.mainTag}>
            <Icon name="star" size={12} color="accent" />
            <Text variant="label" color="accent">
              PHOTO PRINCIPALE
            </Text>
          </View>
        ) : null}
        {photo.caption ? (
          <Text variant="body" color="textInverse">
            {photo.caption}
          </Text>
        ) : null}
        <Text variant="caption" color="textSubtle">
          Ajoutée le {formatDateTime(photo.createdAt)}
        </Text>
      </View>

      <ActionSheet
        visible={menu}
        onClose={() => setMenu(false)}
        actions={[
          ...(!isMain
            ? [{ label: 'Définir comme photo principale', icon: 'star' as const, onPress: () => setMainPhoto(pet.id, photo.id), testID: 'viewer-set-main' }]
            : []),
          {
            label: photo.caption ? 'Modifier la légende' : 'Ajouter une légende',
            icon: 'edit-3',
            onPress: () => {
              setCaption(photo.caption ?? '');
              setEditing(true);
            },
            testID: 'viewer-caption',
          },
          { label: 'Supprimer la photo', icon: 'trash-2', destructive: true, onPress: () => setConfirm(true), testID: 'viewer-delete' },
        ]}
      />

      <Sheet visible={editing} onClose={() => setEditing(false)} title="Légende">
        <Input value={caption} onChangeText={setCaption} placeholder="Un souvenir, un lieu, un moment…" maxLength={200} multiline autoFocus testID="caption-input" />
        <Button
          label="Enregistrer"
          onPress={() => {
            updatePhoto(photo.id, { caption: caption.trim() || undefined });
            setEditing(false);
          }}
          testID="caption-save"
        />
      </Sheet>

      <ConfirmSheet
        visible={confirm}
        onClose={() => setConfirm(false)}
        title="Supprimer cette photo ?"
        message="Elle sera retirée de la galerie. Cette action est définitive."
        confirmLabel="Supprimer"
        destructive
        onConfirm={() => {
          const remaining = photos.length - 1;
          deletePhoto(photo.id);
          if (remaining <= 0) router.back();
          else setCurrent(Math.min(current, remaining - 1));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.overlay },
  center: { alignItems: 'center', justifyContent: 'center' },
  image: { flex: 1 },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
  },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: layout.screenPadding, gap: spacing.xs },
  mainTag: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
