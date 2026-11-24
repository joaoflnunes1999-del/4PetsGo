import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { GalleryGrid } from '@/components/pets/GalleryGrid';
import { PetAvatar } from '@/components/pets/PetAvatar';
import { usePhotoPicker } from '@/components/pets/usePhotoPicker';
import {
  ActionSheet,
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  InfoRow,
  Screen,
  SegmentedTabs,
  Text,
} from '@/components/ui';
import type { PetProfile } from '@/domain/types';
import { formatAge, isoToFrench } from '@/features/pets/age';
import { getBreed } from '@/features/pets/breeds';
import { ENERGY, VISIBILITY } from '@/features/pets/labels';
import { useAppStore } from '@/store/useAppStore';
import { colors, layout, radius, spacing } from '@/theme';

type Tab = 'gallery' | 'about' | 'personality' | 'routine' | 'care';
const TABS = [
  { value: 'gallery', label: 'Galerie' },
  { value: 'about', label: 'Présentation' },
  { value: 'personality', label: 'Personnalité' },
  { value: 'routine', label: 'Routine' },
  { value: 'care', label: 'Soins' },
] as const;

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="number">{value}</Text>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
    </View>
  );
}

function Section({ pet, tab }: { pet: PetProfile; tab: Exclude<Tab, 'gallery'> }) {
  const edit = () => router.push({ pathname: '/pet/[id]/edit', params: { id: pet.id, section: tab } });
  const p = pet.personality;
  const r = pet.routine;
  const c = pet.care;
  const content = {
    about: (
      <>
        <InfoRow icon="tag" label="Espèce" value={pet.species === 'dog' ? 'Chien' : 'Chat'} />
        <InfoRow icon="award" label="Race" value={getBreed(pet.breedId).name} />
        <InfoRow
          icon="gift"
          label={pet.birthDate ? 'Naissance' : 'Âge estimé'}
          value={pet.birthDate ? isoToFrench(pet.birthDate) : formatAge(pet)}
        />
        <InfoRow icon="heart" label="Sexe" value={pet.sex ? (pet.sex === 'male' ? 'Mâle' : 'Femelle') : undefined} />
        <InfoRow icon="activity" label="Poids" value={pet.weightKg ? `${String(pet.weightKg).replace('.', ',')} kg` : undefined} />
      </>
    ),
    personality: (
      <>
        {p.traits.length ? (
          <View style={styles.traits}>
            {p.traits.map((t) => (
              <Badge key={t} label={t} tone="accent" />
            ))}
          </View>
        ) : null}
        <InfoRow icon="zap" label="Énergie" value={p.energy ? ENERGY[p.energy] : undefined} />
        <InfoRow icon="mci:dog-side" label="Avec les animaux" value={p.withAnimals} />
        <InfoRow icon="smile" label="Avec les enfants" value={p.withChildren} />
        <InfoRow icon="users" label="Socialisation" value={p.socialization} />
        <InfoRow icon="alert-circle" label="Peurs, anxiétés" value={p.fears} />
        <InfoRow icon="volume-2" label="Commandes connues" value={p.commands} />
        <InfoRow icon="edit-3" label="À savoir" value={p.notes} />
      </>
    ),
    routine: (
      <>
        <InfoRow icon="coffee" label="Alimentation" value={r.feeding} />
        <InfoRow icon="mci:walk" label="Promenades" value={r.walks} />
        <InfoRow icon="moon" label="Sommeil" value={r.sleep} />
        <InfoRow icon="sun" label="Activités" value={r.activities} />
        <InfoRow icon="mci:toy-brick-outline" label="Jouets favoris" value={r.toys} />
        <InfoRow icon="list" label="Autres habitudes" value={r.other} />
      </>
    ),
    care: (
      <>
        <Card tone="primarySoft" style={styles.notice}>
          <Icon name="lock" size={16} color="primary" />
          <Text variant="caption" color="primary" style={styles.flex}>
            Informations sensibles : jamais publiques. Visibles uniquement par vous et par le Pet Sitter d’une mission confirmée, pendant la mission.
          </Text>
        </Card>
        <InfoRow icon="user" label="Vétérinaire" value={c.vetName} />
        <InfoRow icon="phone" label="Téléphone" value={c.vetPhone} />
        <InfoRow icon="map-pin" label="Adresse" value={c.vetAddress} />
        <InfoRow icon="cpu" label="Puce électronique" value={c.microchip} />
        <Text variant="title" style={styles.subTitle}>
          Médicaments
        </Text>
        {c.medications.length === 0 ? (
          <Text variant="callout" color="textMuted">
            Aucun traitement en cours.
          </Text>
        ) : (
          c.medications.map((m) => (
            <Card key={m.id} tone="muted" style={styles.med}>
              <Text variant="bodyStrong">{m.name}</Text>
              <Text variant="caption" color="textMuted">
                {[m.dosage, m.route, m.frequency, m.schedule].filter(Boolean).join(' · ')}
              </Text>
            </Card>
          ))
        )}
      </>
    ),
  }[tab];
  return (
    <Card style={styles.section}>
      {content}
      <Button label="Modifier" icon="edit-2" variant="ghost" size="sm" fullWidth={false} onPress={edit} />
    </Card>
  );
}

export default function PetProfileScreen() {
  const { id, created } = useLocalSearchParams<{ id: string; created?: string }>();
  const pet = useAppStore((s) => s.pets.find((p) => p.id === id));
  const allPhotos = useAppStore((s) => s.photos);
  const photos = useMemo(
    () => allPhotos.filter((p) => p.petId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allPhotos, id],
  );
  const [tab, setTab] = useState<Tab>('gallery');
  const [sheet, setSheet] = useState(false);
  const [showCreated, setShowCreated] = useState(created === '1');
  const picker = usePhotoPicker(id);

  if (!pet) {
    return (
      <Screen back>
        <EmptyState icon="search" title="Profil introuvable" body="Cet animal a peut-être été supprimé.">
          <Button label="Retour à mes animaux" onPress={() => router.replace('/pets')} />
        </EmptyState>
      </Screen>
    );
  }

  const age = formatAge(pet);
  const breed = getBreed(pet.breedId);
  const vis = VISIBILITY[pet.photoVisibility];
  const openViewer = (index: number) => router.push({ pathname: '/pet/[id]/photo', params: { id: pet.id, index: String(index) } });

  return (
    <Screen
      back
      title={pet.name}
      padded={false}
      headerRight={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Modifier le profil"
          hitSlop={layout.hitSlop}
          onPress={() => router.push({ pathname: '/pet/[id]/edit', params: { id: pet.id, section: 'about' } })}>
          <Icon name="edit-2" size={20} />
        </Pressable>
      }>
      <View style={styles.padded}>
        {showCreated ? (
          <Card tone="accentSoft" style={styles.created}>
            <Text variant="bodyStrong">Le profil de {pet.name} est prêt 🐾</Text>
            <Text variant="callout" color="textMuted">
              Ajoutez ses premières photos et complétez sa personnalité, sa routine et ses soins : son futur Pet Sitter saura tout de lui.
            </Text>
            <View style={styles.row}>
              <Button label="Trouver un Pet Sitter" size="sm" fullWidth={false} onPress={() => router.replace('/search')} testID="created-search" />
              <Button label="Plus tard" size="sm" variant="ghost" fullWidth={false} onPress={() => setShowCreated(false)} />
            </View>
          </Card>
        ) : null}

        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Changer la photo principale"
            onPress={() => setSheet(true)}>
            <PetAvatar pet={pet} size={92} />
            <View style={styles.avatarBadge}>
              <Icon name="camera" size={13} color="textInverse" />
            </View>
          </Pressable>
          <View style={styles.stats}>
            <Stat value={String(photos.length)} label={photos.length > 1 ? 'photos' : 'photo'} />
            <Stat value={age ?? '—'} label="âge" />
            <Stat value={pet.weightKg ? `${String(pet.weightKg).replace('.', ',')} kg` : '—'} label="poids" />
          </View>
        </View>
        <View style={styles.identity}>
          <Text variant="displayM">{pet.name}</Text>
          <Text variant="callout" color="textMuted">
            {breed.name}
            {pet.sex ? ` · ${pet.sex === 'male' ? 'Mâle' : 'Femelle'}` : ''}
          </Text>
          {pet.bio ? <Text variant="body">{pet.bio}</Text> : null}
        </View>
        <View style={styles.row}>
          <Button
            label="Ajouter des photos"
            icon="plus"
            onPress={() => setSheet(true)}
            loading={picker.busy}
            style={styles.flex}
            testID="add-photos"
          />
        </View>
        {picker.error ? (
          <Text variant="caption" color="danger">
            {picker.error}
          </Text>
        ) : null}
        <SegmentedTabs options={TABS} value={tab} onChange={setTab} scrollable />
      </View>

      {tab === 'gallery' ? (
        <View style={styles.galleryWrap}>
          <View style={[styles.padded, styles.visRow]}>
            <Icon name={vis.icon} size={14} color="textMuted" />
            <Text variant="caption" color="textMuted" style={styles.flex}>
              Photos : {vis.label}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/pet/[id]/edit', params: { id: pet.id, section: 'privacy' } })}>
              <Text variant="caption" color="primary">
                Modifier
              </Text>
            </Pressable>
          </View>
          {picker.busy ? <ActivityIndicator color={colors.primary} /> : null}
          {photos.length === 0 ? (
            <View style={styles.padded}>
              <EmptyState icon="image" title="Sa galerie est vide" body="Importez plusieurs photos d’un coup ou prenez-en une maintenant." />
            </View>
          ) : (
            <GalleryGrid photos={photos} onOpen={openViewer} />
          )}
        </View>
      ) : (
        <View style={styles.padded}>
          <Section pet={pet} tab={tab} />
        </View>
      )}

      <ActionSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title="Ajouter des photos"
        actions={[
          { label: 'Prendre une photo', icon: 'camera', onPress: picker.fromCamera, testID: 'sheet-camera' },
          { label: 'Choisir dans la photothèque', icon: 'image', onPress: picker.fromLibrary, testID: 'sheet-library' },
          ...(pet.mainPhotoId
            ? [{ label: `Revenir à l’image ${breed.name}`, icon: 'rotate-ccw' as const, onPress: () => useAppStore.getState().setMainPhoto(pet.id, undefined) }]
            : []),
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  padded: { paddingHorizontal: layout.screenPadding, gap: spacing.lg },
  created: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, paddingTop: spacing.sm },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: spacing.xxs },
  identity: { gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  flex: { flex: 1 },
  galleryWrap: { gap: spacing.md, marginTop: spacing.lg },
  visRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  section: { gap: spacing.sm, marginTop: spacing.lg },
  traits: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs },
  notice: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', padding: spacing.md },
  subTitle: { marginTop: spacing.sm },
  med: { gap: spacing.xxs, padding: spacing.md },
});
