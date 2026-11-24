import { Platform } from 'react-native';

/**
 * Copies a picked image into the app's document directory so it survives cache purges (iOS).
 * Web keeps the original data/blob URI. Phase 2 uploads to Supabase Storage instead.
 */
export async function persistPhoto(uri: string, id: string): Promise<string> {
  if (Platform.OS === 'web') return uri;
  try {
    const { Directory, File, Paths } = await import('expo-file-system');
    const dir = new Directory(Paths.document, 'pet-photos');
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
    const src = new File(uri);
    const ext = src.extension || '.jpg';
    const dest = new File(dir, `${id}${ext}`);
    src.copy(dest);
    return dest.uri;
  } catch {
    return uri;
  }
}

export async function deletePhotoFile(uri: string): Promise<void> {
  if (Platform.OS === 'web' || !uri.startsWith('file://')) return;
  try {
    const { File } = await import('expo-file-system');
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // best effort
  }
}
