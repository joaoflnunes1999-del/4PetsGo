import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

import { useAppStore } from '@/store/useAppStore';

/** Camera / library import for a pet gallery. Permission prompts use the justifications set in app.json. */
export function usePhotoPicker(petId: string) {
  const addPhotos = useAppStore((s) => s.addPhotos);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const handle = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets?.length) return [];
    setBusy(true);
    try {
      return await addPhotos(
        petId,
        result.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height })),
      );
    } finally {
      setBusy(false);
    }
  };

  const fromLibrary = async () => {
    setError(undefined);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Autorisez l’accès à vos photos dans les Réglages pour importer des souvenirs.');
      return [];
    }
    return handle(
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 20,
        quality: 0.7,
        orderedSelection: true,
      }),
    );
  };

  const fromCamera = async () => {
    setError(undefined);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError('Autorisez l’accès à l’appareil photo dans les Réglages pour photographier votre animal.');
      return [];
    }
    return handle(await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 }));
  };

  return { fromLibrary, fromCamera, error, busy };
}
