import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { LevelBadge } from '@/components/sitters/LevelBadge';
import { Rating } from '@/components/sitters/Rating';
import { SitterAvatar } from '@/components/sitters/SitterAvatar';
import { Badge, Button, Card, EmptyState, Icon, InfoRow, Screen, Text } from '@/components/ui';
import type { HomeDetails, ServiceType } from '@/domain/types';
import { levelProgress } from '@/features/levels/levels';
import { MIN_DAILY_PRICE } from '@/features/pricing/config';
import { SERVICE_LABELS, SIZE_LABELS, currencyFor, formatMoney } from '@/features/pricing/pricing';
import { getCity } from '@/features/sitters/cities';
import { distanceKm, formatDistance } from '@/features/sitters/geo';
import { NEW_SITTER_BOOST_MISSIONS } from '@/features/sitters/ranking';
import { findSitter, useAppStore } from '@/store/useAppStore';
import { useSearchStore } from '@/store/useSearchStore';
import { colors, radius, spacing } from '@/theme';

const GARDEN: Record<HomeDetails['garden'], string> = {
  none: 'Pas de jardin',
  fenced: 'Jardin clôturé',
  partlyFenced: 'Jardin partiellement clôturé',
  open: 'Jardin ouvert',
};

const SERVICE_ICON: Record<ServiceType, 'home' | 'key' | 'mci:walk'> = { boarding: 'home', homeVisits: 'key', dogWalking: 'mci:walk' };

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
  const country = city.country;
  const currency = currencyFor(country);
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
        <SitterAvatar sitter={sitter} size={96} />
        <Text variant="displayM">{sitter.firstName}</Text>
        <Text variant="callout" color="textMuted">
          {city.name}, {city.region}
          {dist != null ? ` · ${formatDistance(dist)}` : ''}
        </Text>
        <View style={styles.badges}>
          <LevelBadge pawPoints={sitter.pawPoints} />
          {boosted ? <Badge label="NOUVEAU SUR 4PETSGO" tone="accent" icon="zap" /> : null}
          {sitter.identityVerified ? <Badge label="IDENTITÉ VÉRIFIÉE" tone="success" icon="check" /> : null}
        </View>
        <Rating sitter={sitter} />
      </View>

      <Card style={styles.gap}>
        <View style={styles.levelRow}>
          <View style={styles.levelIcon}>
            <Icon name={level.icon} size={26} color="primary" />
          </View>
          <View style={styles.flex}>
            <Text variant="bodyStrong">
              Niveau {level.name} · {level.animal}
            </Text>
            <Text variant="caption" color="textMuted">
              {sitter.completedMissions} mission{sitter.completedMissions > 1 ? 's' : ''} réalisée{sitter.completedMissions > 1 ? 's' : ''} · {sitter.experienceYears} an
              {sitter.experienceYears > 1 ? 's' : ''} d’expérience
            </Text>
            {next ? (
              <Text variant="caption" color="textMuted">
                Encore {remaining} Paw Points avant {next.name}
              </Text>
            ) : null}
          </View>
        </View>
      </Card>

      {sitter.bio ? (
        <View style={styles.gapSm}>
          <Text variant="title">À propos</Text>
          <Text variant="body">{sitter.bio}</Text>
        </View>
      ) : null}

      <View style={styles.gapSm}>
        <Text variant="title">Services et tarifs</Text>
        {sitter.services.map((s) => (
          <Card key={s.type} tone={s.type === service ? 'primarySoft' : 'surface'} style={styles.gapSm}>
            <View style={styles.serviceHead}>
              <Icon name={SERVICE_ICON[s.type]} size={18} color="primary" />
              <Text variant="bodyStrong">{SERVICE_LABELS[s.type]}</Text>
            </View>
            {s.type === 'dogWalking' ? (
              <>
                <InfoRow label="Promenade" value={`${formatMoney(s.walkPrice ?? 0, currency)} · négociable`} />
                <InfoRow label="Durées" value={s.walkDurationsMin?.map((d) => `${d} min`).join(', ')} />
                <InfoRow label="Chiens en même temps" value={s.maxDogs ? String(s.maxDogs) : undefined} />
                <Text variant="caption" color="textMuted">
                  + frais de déplacement aller-retour : {country === 'FR' ? '0,37 €' : '0,45 CHF'}/km
                </Text>
              </>
            ) : (
              sitter.acceptedSizes.map((size) => (
                <InfoRow
                  key={size}
                  labelWidth={190}
                  label={SIZE_LABELS[size]}
                  value={`${formatMoney(Math.max(s.dailyRates?.[size] ?? 0, MIN_DAILY_PRICE[country][size]), currency)} / jour`}
                />
              ))
            )}
          </Card>
        ))}
        {!offersService && isOwner ? (
          <Text variant="caption" color="warning">
            Ce Pet Sitter ne propose pas le service « {SERVICE_LABELS[service]} » que vous recherchez.
          </Text>
        ) : null}
      </View>

      {sitter.home && sitter.services.some((s) => s.type === 'boarding') ? (
        <View style={styles.gapSm}>
          <Text variant="title">My Home & Environment</Text>
          <Card style={styles.gapSm}>
            <InfoRow icon="home" label="Logement" value={`${sitter.home.housing === 'house' ? 'Maison' : 'Appartement'} · ${sitter.home.surfaceM2} m²`} />
            <InfoRow icon="sun" label="Extérieur" value={[sitter.home.balcony ? 'Balcon' : null, GARDEN[sitter.home.garden]].filter(Boolean).join(' · ')} />
            <InfoRow icon="smile" label="Enfants" value={sitter.home.children ? 'Oui' : 'Non'} />
            <InfoRow icon="mci:paw" label="Animaux résidents" value={sitter.home.residentAnimals || 'Aucun'} />
            <InfoRow icon="git-branch" label="Séparation possible" value={sitter.home.canSeparate ? 'Oui' : 'Non'} />
          </Card>
        </View>
      ) : null}

      {sitter.certifications.length ? (
        <View style={styles.gapSm}>
          <Text variant="title">Certifications & Qualifications</Text>
          {sitter.certifications.map((c) => (
            <View key={c.name} style={styles.serviceHead}>
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
        L’adresse exacte n’est communiquée qu’après confirmation et paiement de la mission.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' },
  gap: { gap: spacing.md },
  gapSm: { gap: spacing.sm },
  levelRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  levelIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  serviceHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
