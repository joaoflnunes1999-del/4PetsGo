import { router } from 'expo-router';
import { useState } from 'react';

import { CityPicker } from '@/components/CityPicker';
import { Button, Input, Screen, Text } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';

export default function OwnerOnboarding() {
  const complete = useAppStore((s) => s.completeOwnerOnboarding);
  const [firstName, setFirstName] = useState('');
  const [cityId, setCityId] = useState<string>();
  const valid = firstName.trim().length >= 2 && !!cityId;

  return (
    <Screen
      back
      footer={
        <Button
          testID="owner-continue"
          label="Créer le profil de mon animal"
          disabled={!valid}
          onPress={() => {
            complete({ firstName, cityId: cityId! });
            router.replace({ pathname: '/pet/new', params: { onboarding: '1' } });
          }}
        />
      }>
      <Text variant="displayM">Faisons connaissance</Text>
      <Text variant="body" color="textMuted">
        Votre ville sert à trouver des Pet Sitters près de chez vous. Votre adresse exacte n’est jamais affichée publiquement.
      </Text>
      <Input label="Prénom" value={firstName} onChangeText={setFirstName} placeholder="Ex. Julie" autoCapitalize="words" testID="owner-firstname" />
      <Text variant="title">Votre ville</Text>
      <CityPicker value={cityId} onChange={setCityId} />
    </Screen>
  );
}
