import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { LevelIcon } from '@/components/levels/LevelIcon';
import { KeyTiles } from '@/components/sitters/KeyTiles';
import { LevelBadge } from '@/components/sitters/LevelBadge';
import { Rating } from '@/components/sitters/Rating';
import { SitterAvatar } from '@/components/sitters/SitterAvatar';
import { Badge, Button, Card, Chip, EmptyState, Icon, Screen, Text } from '@/components/ui';
import { levelProgress } from '@/features/levels/levels';
import { SERVICE_LABELS, SIZE_LABELS } from '@/features/pricing/pricing';
import { getCity } from '@/features/sitters/cities';
import { SERVICE_NAMES, sitterKeyTiles } from '@/features/sitters/facts';
import { distanceKm, formatDistance } from '@/features/sitters/geo';
import { NEW_SITTER_BOOST_MISSIONS } from '@/features/sitters/ranking';
import { findSitter, useAppStore } from '@/store/useAppStore';
import { useSearchStore } from '@/store/useSearchStore';
import { colors, radius, spacing } from '@/theme';

/**
 * Public sitter profile. Order (founder's request): identity (name, age, city) → 4 key tiles
 * (≈ 10 % of the screen: icon + short value) → about → services. No prices here:
 * the price is set per request and negotiated.
 */
export default function SitterProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mySitter = useAppStore((s) => s.mySitter);
  const owner = useAppStore((s) => s.owner);
  const role = useAppStore((s) => s.role);
  const sitter = findSitter(id, mySitter);
  const { service, selectedSitterIds, toggleSitter } = useSearchStore();

  if (!sitter) {
    return (
      <Screen back>
        <EmptyState icon="user-x" title="Profil introuvable" body="Ce Pet Sitter n’est plus disponible." />
      </Screen>
    );
  }

  const city = getCity(sitter.cityId);
  const ownerCity = owner ? getCity(owner.cityId) : undefined;
  const dist = ownerCity ? distanceKm(ownerCity, sitter.location) : undefined;
  const { level, next, remaining } = levelProgress(sitter.pawPoints);
  const boosted = sitter.identityVerified && sitter.completedMissions < NEW_SITTER_BOOST_MISSIONS;
  const offersService = sitter.services.some((s) => s.type === service);
  const selected = selectedSitterIds.includes(sitter.id);
  const isOwner = role === 'owner';

  return (
    <Screen
      back
      footer={
        isOwner && offersService ? (
          <>
            <Button
              label="Envoyer une demande"
              onPress={() => {
                if (!selected) toggleSitter(sitter.id);
                router.push('/request/new');
              }}
              testID="sitter-request"
            />
            <Button
              label={selected ? 'Retirer de ma sélection' : 'Ajouter à ma sélection'}
              variant="ghost"
              size="sm"
              icon={selected ? 'check' : 'plus'}
              onPress={() => toggleSitter(sitter.id)}
              testID="sitter-toggle"
            />
          </>
        ) : undefined
      }>
      <View style={styles.hero}>
        <SitterAvatar sitter={sitter} size={92} />
        <Text variant="displayM">{sitter.firstName}</Text>
        <Text variant="callout" color="textMuted">
          {sitter.age} ans · {city.name}
          {dist != null ? ` · ${formatDistance(dist)}` : ''}
        </Text>
        <View style={styles.badges}>
          <LevelBadge pawPoints={sitter.pawPoints} />
          {boosted ? <Badge label="NOUVEAU" tone="accent" icon="zap" /> : null}
          {sitter.identityVerified ? <Badge label="Identité vérifiée" tone="success" icon="check" textColor="text" sentenceCase /> : null}
        </View>
        <Rating sitter={sitter} />
      </View>

      <KeyTiles tiles={sitterKeyTiles(sitter)} />

      {sitter.bio ? (
        <View style={styles.section}>
          <Text variant="title">À propos de {sitter.firstName}</Text>
          <Text variant="body">{sitter.bio}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text variant="title">Services proposés</Text>
        {sitter.services.map((s) => {
          const meta = SERVICE_NAMES[s.type];
          const active = s.type === service;
          return (
            <Card key={s.type} tone={active ? 'primarySoft' : 'surface'} style={styles.service} testID={`service-${s.type}`}>
              <View style={styles.serviceIcon}>
                <Icon name={meta.icon} size={20} color="primary" />
              </View>
              <View style={styles.flex}>
                <Text variant="bodyStrong">{meta.title}</Text>
                <Text variant="caption" color="textMuted">
                  {meta.subtitle}
                </Text>
                {s.type === 'dogWalking' && (s.walkDurationsMin?.length || s.maxDogs) ? (
                  <Text variant="caption" color="textMuted">
                    {[s.walkDurationsMin?.map((d) => `${d} min`).join(' / '), s.maxDogs ? `${s.maxDogs} chien${s.maxDogs > 1 ? 's' : ''} max.` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                ) : null}
              </View>
              {active ? <Icon name="check-circle" size={18} color="primary" /> : null}
            </Card>
          );
        })}
        {!offersService && isOwner ? (
          <Text variant="caption" color="warning">
            {sitter.firstName} ne propose pas « {SERVICE_LABELS[service]} », le service que vous recherchez.
          </Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text variant="title">Animaux acceptés</Text>
        <View style={styles.chips}>
          {sitter.acceptedSizes.map((size) => (
            <Chip key={size} label={SIZE_LABELS[size]} icon={size === 'cat' ? 'mci:cat' : 'mci:dog'} />
          ))}
        </View>
      </View>

      <Card style={styles.levelCard}>
        <LevelIcon level={level.id} size={44} />
        <View style={styles.flex}>
          <Text variant="bodyStrong">
            Niveau {level.rank} · {level.name}
          </Text>
          <Text variant="caption" color="textMuted">
            {sitter.completedMissions} mission{sitter.completedMissions > 1 ? 's' : ''} réalisée{sitter.completedMissions > 1 ? 's' : ''}
            {next ? ` · encore ${remaining} Paw Points avant ${next.name}` : ''}
          </Text>
        </View>
      </Card>

      {sitter.certifications.length ? (
        <View style={styles.section}>
          <Text variant="title">Certifications & Qualifications</Text>
          {sitter.certifications.map((c) => (
            <View key={c.name} style={styles.cert}>
              <Icon name="award" size={16} color="primary" />
              <Text variant="body" style={styles.flex}>
                {c.name} ({c.country === 'FR' ? 'France' : 'Suisse'})
              </Text>
              <Badge
                label={c.status === 'verified' ? 'VÉRIFIÉ' : c.status === 'pending' ? 'EN ATTENTE' : 'NON VALIDÉ'}
                tone={c.status === 'verified' ? 'success' : c.status === 'pending' ? 'warning' : 'muted'}
              />
            </View>
          ))}
        </View>
      ) : null}

      <Text variant="caption" color="textMuted">
        Le tarif est proposé et négocié dans votre demande. L’adresse exacte n’est communiquée qu’après confirmation et paiement de la mission.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' },
  section: { gap: spacing.sm },
  service: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, gap: spacing.xxs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  levelCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cert: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
