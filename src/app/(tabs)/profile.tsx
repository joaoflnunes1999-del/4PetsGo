import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { CityPicker } from '@/components/CityPicker';
import { LevelIcon } from '@/components/levels/LevelIcon';
import { LevelsInfoSheet } from '@/components/levels/LevelsInfoSheet';
import { OwnerAvatar } from '@/components/owners/OwnerAvatar';
import { LevelBadge } from '@/components/sitters/LevelBadge';
import { SitterAvatar } from '@/components/sitters/SitterAvatar';
import { Button, Card, ConfirmSheet, Icon, InfoRow, Screen, Sheet, Text } from '@/components/ui';
import { LEVELS, levelProgress } from '@/features/levels/levels';
import { getCity } from '@/features/sitters/cities';
import { useAppStore } from '@/store/useAppStore';
import { colors, spacing } from '@/theme';

export default function ProfileTab() {
  const role = useAppStore((s) => s.role);
  const owner = useAppStore((s) => s.owner);
  const mySitter = useAppStore((s) => s.mySitter);
  const pets = useAppStore((s) => s.pets);
  const resetAll = useAppStore((s) => s.resetAll);
  const [confirmReset, setConfirmReset] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [levelsInfo, setLevelsInfo] = useState(false);

  const name = role === 'sitter' ? mySitter?.firstName : owner?.firstName;
  const cityId = role === 'sitter' ? mySitter?.cityId : owner?.cityId;
  const city = cityId ? getCity(cityId) : undefined;

  return (
    <Screen>
      <Text variant="displayL" style={styles.title}>
        Profil
      </Text>
      <Card style={styles.gap}>
        <View style={styles.row}>
          {role === 'sitter' && mySitter ? (
            <SitterAvatar sitter={mySitter} size={56} />
          ) : (
            owner ? <OwnerAvatar owner={owner} size={64} /> : null
          )}
          <View style={styles.flex}>
            <Text variant="displayS">{name}</Text>
            <Text variant="callout" color="textMuted">
              {role === 'sitter' ? 'Pet Sitter' : `Propriétaire · ${pets.length} animal${pets.length > 1 ? 'aux' : ''}`}
            </Text>
            {role === 'owner' && owner?.ownerClub ? (
              <Text variant="caption" color="accentStrong">
                Membre Owner Club
              </Text>
            ) : null}
          </View>
        </View>
        <InfoRow icon="map-pin" label="Ville" value={city ? `${city.name} (${city.country === 'FR' ? 'France' : 'Suisse'})` : undefined} />
        {role === 'owner' ? <Button label="Changer de ville" variant="ghost" size="sm" fullWidth={false} onPress={() => setCityOpen(true)} /> : null}
      </Card>

      {role === 'sitter' && mySitter ? (
        <>
          <Card style={styles.gap}>
            <LevelBadge pawPoints={mySitter.pawPoints} />
            {(() => {
              const { level, next, progress, remaining } = levelProgress(mySitter.pawPoints);
              return (
                <>
                  <Text variant="body">
                    Niveau {level.rank} · {level.name}
                  </Text>
                  {next ? (
                    <>
                      <View style={styles.track}>
                        <View style={[styles.fill, { width: `${Math.max(4, progress * 100)}%` }]} />
                      </View>
                      <Text variant="caption" color="textMuted">
                        Encore {remaining} Paw Points pour atteindre {next.name}.
                      </Text>
                    </>
                  ) : null}
                </>
              );
            })()}
            <View style={styles.levels}>
              {LEVELS.map((l) => (
                <View
                  key={l.id}
                  style={[styles.levelItem, l.id === levelProgress(mySitter.pawPoints).level.id ? null : styles.levelOther]}
                  testID={`level-${l.id}`}>
                  <LevelIcon level={l.id} size={40} />
                  <Text variant="caption">{l.name}</Text>
                </View>
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Avantages de chaque niveau"
              onPress={() => setLevelsInfo(true)}
              style={styles.infoButton}
              testID="levels-info">
              <Icon name="info" size={18} color="primary" />
              <Text variant="callout" color="primary">
                Avantages de chaque niveau
              </Text>
            </Pressable>
          </Card>
          <LevelsInfoSheet visible={levelsInfo} onClose={() => setLevelsInfo(false)} current={levelProgress(mySitter.pawPoints).level.id} />
          <Button label="Voir mon profil public" variant="secondary" icon="eye" onPress={() => router.push({ pathname: '/sitter/[id]', params: { id: mySitter.id } })} />
        </>
      ) : null}

      {__DEV__ && role === 'owner' && owner ? (
        <Card tone="muted" style={styles.demo}>
          <View style={styles.flex}>
            <Text variant="label" color="info">
              MODE DÉMO
            </Text>
            <Text variant="callout">Simuler l’abonnement Owner Club</Text>
          </View>
          <Switch
            value={owner.ownerClub}
            onValueChange={(v) => useAppStore.getState().setOwnerClubDemo(v)}
            trackColor={{ true: colors.action, false: colors.border }}
            accessibilityLabel="Simuler l’abonnement Owner Club"
            testID="demo-owner-club"
          />
        </Card>
      ) : null}

      <Card tone="muted" style={styles.gap}>
        <Text variant="bodyStrong">Données de cet appareil</Text>
        <Text variant="caption" color="textMuted">
          Vos profils, photos et demandes sont enregistrés uniquement sur cet appareil.
        </Text>
        <Button label="Effacer mes données" variant="danger" icon="trash-2" onPress={() => setConfirmReset(true)} testID="reset" />
      </Card>

      <ConfirmSheet
        visible={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Tout effacer ?"
        message="Profils, animaux, photos et demandes seront supprimés de cet appareil. Cette action est définitive."
        confirmLabel="Tout effacer"
        destructive
        onConfirm={() => {
          resetAll();
          router.replace('/welcome');
        }}
      />
      <Sheet visible={cityOpen} onClose={() => setCityOpen(false)} title="Votre ville">
        <CityPicker
          value={owner?.cityId}
          onChange={(id) => {
            useAppStore.setState((s) => (s.owner ? { owner: { ...s.owner, cityId: id } } : s));
            setCityOpen(false);
          }}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingTop: spacing.md },
  gap: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.accent },
  levels: { flexDirection: 'row', justifyContent: 'space-between' },
  levelItem: { alignItems: 'center', gap: spacing.xxs },
  /** Levels not yet reached are dimmed; the current one stays fully visible. */
  levelOther: { opacity: 0.45 },
  demo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  infoButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
});
