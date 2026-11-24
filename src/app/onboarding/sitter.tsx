import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { CityPicker } from '@/components/CityPicker';
import { Button, Card, Chip, Input, Screen, Stepper, Text } from '@/components/ui';
import type { HomeDetails, ServiceType, SitterProfile, SitterService, SizeCategory, Species } from '@/domain/types';
import { MIN_DAILY_PRICE } from '@/features/pricing/config';
import { SERVICE_LABELS, SIZE_LABELS, currencyFor, formatMoney, parseMoneyInput } from '@/features/pricing/pricing';
import { getCity } from '@/features/sitters/cities';
import { useAppStore } from '@/store/useAppStore';
import { colors, spacing } from '@/theme';

const SERVICES: ServiceType[] = ['boarding', 'homeVisits', 'dogWalking'];
const DOG_SIZES: SizeCategory[] = ['dogSmall', 'dogMedium', 'dogLarge', 'dogXL'];
const RADII = [5, 10, 15, 20, 30];
const GARDEN: { value: HomeDetails['garden']; label: string }[] = [
  { value: 'none', label: 'Pas de jardin' },
  { value: 'fenced', label: 'Jardin clôturé' },
  { value: 'partlyFenced', label: 'Partiellement clôturé' },
  { value: 'open', label: 'Jardin ouvert' },
];

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggle}>
      <Text variant="body" style={styles.flex}>
        {label}
      </Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.border }} accessibilityLabel={label} />
    </View>
  );
}

export default function SitterOnboarding() {
  const complete = useAppStore((s) => s.completeSitterOnboarding);
  const [firstName, setFirstName] = useState('');
  const [ageText, setAgeText] = useState('');
  const [cityId, setCityId] = useState<string>();
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState(1);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [species, setSpecies] = useState<Species[]>(['dog', 'cat']);
  const [dogSizes, setDogSizes] = useState<SizeCategory[]>(['dogSmall', 'dogMedium']);
  const [rates, setRates] = useState<Partial<Record<SizeCategory, string>>>({});
  const [walkPrice, setWalkPrice] = useState('');
  const [radius, setRadius] = useState(10);
  const [home, setHome] = useState<HomeDetails>({
    housing: 'apartment',
    surfaceM2: 50,
    balcony: false,
    garden: 'none',
    children: false,
    canSeparate: true,
  });
  const [surface, setSurface] = useState('50');

  const country = cityId ? getCity(cityId).country : 'FR';
  const currency = currencyFor(country);
  const sizes: SizeCategory[] = useMemo(
    () => [...(species.includes('cat') ? (['cat'] as const) : []), ...(species.includes('dog') ? dogSizes : [])],
    [species, dogSizes],
  );
  const daily = services.includes('boarding') || services.includes('homeVisits');
  const walking = services.includes('dogWalking');

  const rateErrors: Partial<Record<SizeCategory, string>> = {};
  if (daily) {
    for (const s of sizes) {
      const raw = rates[s];
      if (!raw) continue;
      const c = parseMoneyInput(raw);
      if (Number.isNaN(c)) rateErrors[s] = 'Montant invalide';
      else if (c < MIN_DAILY_PRICE[country][s]) rateErrors[s] = `Minimum ${formatMoney(MIN_DAILY_PRICE[country][s], currency)}`;
    }
  }
  const walkCents = parseMoneyInput(walkPrice);
  const age = Number(ageText);
  const ageError = ageText && (!Number.isInteger(age) || age < 18 || age > 99) ? 'Vous devez avoir au moins 18 ans' : undefined;
  const valid =
    firstName.trim().length >= 2 &&
    !!ageText &&
    !ageError &&
    !!cityId &&
    services.length > 0 &&
    sizes.length > 0 &&
    (!walking || species.includes('dog')) &&
    Object.keys(rateErrors).length === 0 &&
    (!walking || (Number.isFinite(walkCents) && walkCents > 0));

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const submit = () => {
    const dailyRates: Partial<Record<SizeCategory, number>> = {};
    for (const s of sizes) {
      const c = parseMoneyInput(rates[s] ?? '');
      dailyRates[s] = Number.isFinite(c) ? c : MIN_DAILY_PRICE[country][s];
    }
    const svc: SitterService[] = services.map((type) =>
      type === 'dogWalking' ? { type, walkPrice: walkCents, walkDurationsMin: [30, 60], maxDogs: 2 } : { type, dailyRates },
    );
    const city = getCity(cityId!);
    const profile: SitterProfile = {
      id: 'sitter-me',
      firstName: firstName.trim(),
      age,
      avatarSeed: 1,
      cityId: city.id,
      location: { lat: city.lat, lng: city.lng },
      radiusKm: radius,
      bio: bio.trim(),
      experienceYears: experience,
      acceptedSpecies: species,
      acceptedSizes: sizes,
      services: svc,
      home: services.includes('boarding') ? { ...home, surfaceM2: Number(surface) || 0 } : undefined,
      certifications: [],
      pawPoints: 0,
      completedMissions: 0,
      reviewCount: 0,
      identityVerified: false,
      unavailableDates: [],
      joinedAt: new Date().toISOString().slice(0, 10),
    };
    complete(profile);
    router.replace('/missions');
  };

  return (
    <Screen back footer={<Button label="Publier mon profil" disabled={!valid} onPress={submit} testID="sitter-submit" />}>
      <Text variant="displayM">Votre profil Pet Sitter</Text>
      <Input label="Prénom" value={firstName} onChangeText={setFirstName} autoCapitalize="words" testID="sitter-firstname" />
      <Input label="Âge" value={ageText} onChangeText={setAgeText} keyboardType="number-pad" suffix="ans" error={ageError} testID="sitter-age" />
      <Text variant="title">Ville</Text>
      <CityPicker value={cityId} onChange={setCityId} />
      <Input
        label="Présentation"
        value={bio}
        onChangeText={setBio}
        multiline
        placeholder="Votre expérience, votre cadre de vie, ce qui vous rend unique…"
      />
      <Stepper label="Années d’expérience" value={experience} onChange={setExperience} min={0} max={40} />

      <Text variant="title">Services proposés</Text>
      <View style={styles.chips}>
        {SERVICES.map((s) => (
          <Chip key={s} label={SERVICE_LABELS[s]} selected={services.includes(s)} onPress={() => setServices(toggle(services, s))} testID={`svc-${s}`} />
        ))}
      </View>

      <Text variant="title">Animaux acceptés</Text>
      <View style={styles.chips}>
        <Chip label="Chiens" icon="mci:dog" selected={species.includes('dog')} onPress={() => setSpecies(toggle(species, 'dog'))} />
        <Chip label="Chats" icon="mci:cat" selected={species.includes('cat')} onPress={() => setSpecies(toggle(species, 'cat'))} />
      </View>
      {species.includes('dog') ? (
        <View style={styles.chips}>
          {DOG_SIZES.map((s) => (
            <Chip key={s} label={SIZE_LABELS[s]} selected={dogSizes.includes(s)} onPress={() => setDogSizes(toggle(dogSizes, s))} />
          ))}
        </View>
      ) : null}

      {daily && sizes.length ? (
        <Card style={styles.gap}>
          <Text variant="title">Tarif par jour et par animal</Text>
          <Text variant="caption" color="textMuted">
            Garde et visites. Laissez vide pour appliquer le prix minimum 4PetsGo.
          </Text>
          {sizes.map((s) => (
            <Input
              key={s}
              label={SIZE_LABELS[s]}
              value={rates[s] ?? ''}
              onChangeText={(t) => setRates({ ...rates, [s]: t })}
              keyboardType="decimal-pad"
              placeholder={formatMoney(MIN_DAILY_PRICE[country][s], currency)}
              suffix={currency === 'EUR' ? '€' : 'CHF'}
              error={rateErrors[s]}
              helper={`Minimum ${formatMoney(MIN_DAILY_PRICE[country][s], currency)}`}
            />
          ))}
        </Card>
      ) : null}

      {walking ? (
        <Input
          label="Prix d’une promenade"
          value={walkPrice}
          onChangeText={setWalkPrice}
          keyboardType="decimal-pad"
          suffix={currency === 'EUR' ? '€' : 'CHF'}
          helper={`Négociable. Les frais de déplacement (${country === 'FR' ? '0,37 €' : '0,45 CHF'}/km aller-retour) sont calculés automatiquement.`}
          testID="sitter-walk-price"
        />
      ) : null}

      {services.some((s) => s !== 'boarding') ? (
        <>
          <Text variant="title">Rayon de déplacement</Text>
          <View style={styles.chips}>
            {RADII.map((r) => (
              <Chip key={r} label={`${r} km`} selected={radius === r} onPress={() => setRadius(r)} />
            ))}
          </View>
        </>
      ) : null}

      {services.includes('boarding') ? (
        <Card style={styles.gap}>
          <Text variant="title">My Home & Environment</Text>
          <View style={styles.chips}>
            <Chip label="Appartement" selected={home.housing === 'apartment'} onPress={() => setHome({ ...home, housing: 'apartment' })} />
            <Chip label="Maison" selected={home.housing === 'house'} onPress={() => setHome({ ...home, housing: 'house' })} />
          </View>
          <Input label="Surface" value={surface} onChangeText={setSurface} keyboardType="number-pad" suffix="m²" />
          <View style={styles.chips}>
            {GARDEN.map((g) => (
              <Chip key={g.value} label={g.label} selected={home.garden === g.value} onPress={() => setHome({ ...home, garden: g.value })} />
            ))}
          </View>
          <ToggleRow label="Balcon" value={home.balcony} onChange={(v) => setHome({ ...home, balcony: v })} />
          <ToggleRow label="Enfants au domicile" value={home.children} onChange={(v) => setHome({ ...home, children: v })} />
          <ToggleRow label="Possibilité de séparer les animaux" value={home.canSeparate} onChange={(v) => setHome({ ...home, canSeparate: v })} />
          <Input
            label="Animaux résidents"
            value={home.residentAnimals ?? ''}
            onChangeText={(t) => setHome({ ...home, residentAnimals: t })}
            placeholder="Espèce, race, âge, tempérament"
          />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gap: { gap: spacing.md },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
});
