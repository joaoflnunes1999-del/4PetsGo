import { Image } from 'expo-image';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import type { PetPhoto } from '@/domain/types';
import { colors, layout } from '@/theme';

type Props = { photos: PetPhoto[]; onOpen: (index: number) => void; mainPhotoId?: string };

/** Square 3-column grid (adapts to wider screens), newest first. */
export function GalleryGrid({ photos, onOpen }: Props) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, layout.maxContentWidth);
  const columns = contentWidth > 700 ? 4 : layout.galleryColumns;
  const size = (contentWidth - layout.galleryGap * (columns - 1)) / columns;
  return (
    <View style={[styles.grid, { gap: layout.galleryGap, width: contentWidth }]}>
      {photos.map((p, i) => (
        <Pressable
          key={p.id}
          testID={`gallery-photo-${i}`}
          accessibilityRole="imagebutton"
          accessibilityLabel={p.caption ? `Photo : ${p.caption}` : `Photo ${i + 1}`}
          onPress={() => onOpen(i)}>
          <Image
            source={{ uri: p.uri }}
            style={{ width: size, height: size, backgroundColor: colors.surfaceMuted }}
            contentFit="cover"
            transition={150}
            recyclingKey={p.id}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'center' } });
