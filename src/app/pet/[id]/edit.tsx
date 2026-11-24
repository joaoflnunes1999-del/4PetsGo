import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, ConfirmSheet, Icon, Input, Screen, SegmentedTabs, Text } from '@/components/ui';
import type { Medication, PetProfile } from '@/domain/types';
import { isoToFrench, parseFrenchDate } from '@/features/pets/age';
import { ENERGY, PERSONALITY_TRAITS } from '@/features/pets/labels';
import { newId } from '@/store/ids';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme';

type Section = 'about' | 'personality' | 'routine' | 'care';
const SECTIONS = [
  { value: 'about', label: 'Présentation' },
  { value: 'personality', label: 'Personnalité' },
  { value: 'routine', label: 'Routine' },
  { value: 'care', label: 'Soins' },
] as const;

const emptyMed = (): Medication => ({ id: newId('med'), name: '', dosage: '', route: '', frequency: '', schedule: '' });

export default function EditPet() {
  const { id, section } = useLocalSearchParams<{ id: string; section?: Section }>();
  const pet = useAppStore((s) => s.pets.find((p) => p.id === id));
  const updatePet = useAppStore((s) => s.updatePet);
  const deletePet = useAppStore((s) => s.deletePet);
  const [tab, setTab] = useState<Section>(section ?? 'about');
  const [draft, setDraft] = useState<PetProfile | undefined>(pet);
  const [birth, setBirth] = useState(isoToFrench(pet?.birthDate));
  const [weight, setWeight] = useState(pet?.weightKg ? String(pet.weightKg).replace('.', ',') : '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!pet || !draft) return null;

  const set = (patch: Partial<PetProfile>) => setDraft({ ...draft, ...patch });
  const setP = (patch: Partial<PetProfile['personality']>) => set({ personality: { ...draft.personality, ...patch } });
  const setR = (patch: Partial<PetProfile['routine']>) => set({ routine: { ...draft.routine, ...patch } });
  const setC = (patch: Partial<PetProfile['care']>) => set({ care: { ...draft.care, ...patch } });
  const setMed = (mid: string, patch: Partial<Medication>) =>
    setC({ medications: draft.care.medications.map((m) => (m.id === mid ? { ...m, ...patch } : m)) });

  const birthIso = birth ? parseFrenchDate(birth) : undefined;
  const weightKg = weight ? Number(weight.replace(',', '.')) : undefined;
  const birthError = birth && !birthIso ? 'Format JJ/MM/AAAA, date passée' : undefined;
  const weightError = weight && (!Number.isFinite(weightKg) || weightKg! <= 0 || weightKg! > 120) ? 'Poids invalide' : undefined;
  const valid = draft.name.trim().length > 0 && !birthError && !weightError;

  const save = () => {
    updatePet(pet.id, {
      ...draft,
      name: draft.name.trim(),
      birthDate: birth ? birthIso : undefined,
      estimatedAgeYears: birth ? undefined : draft.estimatedAgeYears,
      weightKg,
      care: { ...draft.care, medications: draft.care.medications.filter((m) => m.name.trim()) },
    });
    router.back();
  };

  return (
    <Screen
      back
      title="Modifier le profil"
      footer={<Button label="Enregistrer" disabled={!valid} onPress={save} testID="pet-save" />}>
      <SegmentedTabs options={SECTIONS} value={tab} onChange={setTab} scrollable />

      {tab === 'about' ? (
        <>
          <Input label="Nom" value={draft.name} onChangeText={(t) => set({ name: t })} testID="edit-name" />
          <Input
            label="Courte description"
            value={draft.bio ?? ''}
            onChangeText={(t) => set({ bio: t })}
            multiline
            maxLength={220}
            placeholder="Ce qui le rend unique, en une ou deux phrases"
            testID="edit-bio"
          />
          <Input label="Date de naissance" value={birth} onChangeText={setBirth} placeholder="JJ/MM/AAAA" error={birthError} />
          <Input label="Poids" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" suffix="kg" error={weightError} />
          <Text variant="title">Sexe</Text>
          <View style={styles.chips}>
            <Chip label="Mâle" selected={draft.sex === 'male'} onPress={() => set({ sex: 'male' })} />
            <Chip label="Femelle" selected={draft.sex === 'female'} onPress={() => set({ sex: 'female' })} />
          </View>
          <Button label={`Supprimer le profil de ${pet.name}`} variant="danger" icon="trash-2" onPress={() => setConfirmDelete(true)} />
        </>
      ) : null}

      {tab === 'personality' ? (
        <>
          <Text variant="title">Traits de personnalité</Text>
          <View style={styles.chips}>
            {PERSONALITY_TRAITS.map((t) => {
              const on = draft.personality.traits.includes(t);
              return (
                <Chip
                  key={t}
                  label={t}
                  selected={on}
                  onPress={() =>
                    setP({ traits: on ? draft.personality.traits.filter((x) => x !== t) : [...draft.personality.traits, t] })
                  }
                />
              );
            })}
          </View>
          <Text variant="title">Niveau d’énergie</Text>
          <View style={styles.chips}>
            {(Object.keys(ENERGY) as (keyof typeof ENERGY)[]).map((e) => (
              <Chip key={e} label={ENERGY[e]} selected={draft.personality.energy === e} onPress={() => setP({ energy: e })} />
            ))}
          </View>
          <Input label="Avec les autres animaux" value={draft.personality.withAnimals ?? ''} onChangeText={(t) => setP({ withAnimals: t })} multiline />
          <Input label="Avec les enfants" value={draft.personality.withChildren ?? ''} onChangeText={(t) => setP({ withChildren: t })} multiline />
          <Input label="Habitudes de socialisation" value={draft.personality.socialization ?? ''} onChangeText={(t) => setP({ socialization: t })} multiline />
          <Input label="Peurs et anxiétés" value={draft.personality.fears ?? ''} onChangeText={(t) => setP({ fears: t })} multiline placeholder="Orage, aspirateur, solitude…" />
          <Input label="Commandes connues" value={draft.personality.commands ?? ''} onChangeText={(t) => setP({ commands: t })} placeholder="Assis, pas bouger, au pied…" />
          <Input label="Autre chose à savoir" value={draft.personality.notes ?? ''} onChangeText={(t) => setP({ notes: t })} multiline />
        </>
      ) : null}

      {tab === 'routine' ? (
        <>
          <Input label="Habitudes alimentaires" value={draft.routine.feeding ?? ''} onChangeText={(t) => setR({ feeding: t })} multiline placeholder="Croquettes, quantités, horaires…" />
          <Input label="Promenades" value={draft.routine.walks ?? ''} onChangeText={(t) => setR({ walks: t })} multiline />
          <Input label="Sommeil" value={draft.routine.sleep ?? ''} onChangeText={(t) => setR({ sleep: t })} multiline />
          <Input label="Activités préférées" value={draft.routine.activities ?? ''} onChangeText={(t) => setR({ activities: t })} multiline />
          <Input label="Jouets favoris" value={draft.routine.toys ?? ''} onChangeText={(t) => setR({ toys: t })} />
          <Input label="Autres habitudes importantes" value={draft.routine.other ?? ''} onChangeText={(t) => setR({ other: t })} multiline />
        </>
      ) : null}

      {tab === 'care' ? (
        <>
          <Card tone="primarySoft" style={styles.notice}>
            <Icon name="lock" size={16} color="primary" />
            <Text variant="caption" color="primary" style={styles.flex}>
              Ces informations ne sont jamais publiques. Seul le Pet Sitter d’une mission confirmée y a accès, pendant la mission.
            </Text>
          </Card>
          <Input label="Nom du vétérinaire" value={draft.care.vetName ?? ''} onChangeText={(t) => setC({ vetName: t })} />
          <Input label="Téléphone du vétérinaire" value={draft.care.vetPhone ?? ''} onChangeText={(t) => setC({ vetPhone: t })} keyboardType="phone-pad" />
          <Input label="Adresse du vétérinaire (facultatif)" value={draft.care.vetAddress ?? ''} onChangeText={(t) => setC({ vetAddress: t })} />
          <Input label="Numéro de puce électronique" value={draft.care.microchip ?? ''} onChangeText={(t) => setC({ microchip: t })} keyboardType="number-pad" />
          <Text variant="title">Médicaments</Text>
          {draft.care.medications.map((m, i) => (
            <Card key={m.id} tone="muted" style={styles.med}>
              <View style={styles.medHeader}>
                <Text variant="bodyStrong" style={styles.flex}>
                  Traitement {i + 1}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Retirer le traitement ${i + 1}`}
                  onPress={() => setC({ medications: draft.care.medications.filter((x) => x.id !== m.id) })}>
                  <Icon name="x" color="textMuted" />
                </Pressable>
              </View>
              <Input label="Nom du médicament" value={m.name} onChangeText={(t) => setMed(m.id, { name: t })} />
              <Input label="Dosage" value={m.dosage} onChangeText={(t) => setMed(m.id, { dosage: t })} placeholder="Ex. 1/2 comprimé" />
              <Input label="Mode d’administration" value={m.route} onChangeText={(t) => setMed(m.id, { route: t })} placeholder="Oral, cutané…" />
              <Input label="Fréquence" value={m.frequency} onChangeText={(t) => setMed(m.id, { frequency: t })} placeholder="Ex. 2 fois par jour" />
              <Input label="Horaires" value={m.schedule} onChangeText={(t) => setMed(m.id, { schedule: t })} placeholder="Ex. 8 h et 20 h" />
            </Card>
          ))}
          <Button label="Ajouter un médicament" icon="plus" variant="secondary" onPress={() => setC({ medications: [...draft.care.medications, emptyMed()] })} />
        </>
      ) : null}


      <ConfirmSheet
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Supprimer ${pet.name} ?`}
        message="Son profil et toutes ses photos seront définitivement supprimés de cet appareil."
        confirmLabel="Supprimer définitivement"
        destructive
        onConfirm={() => {
          deletePet(pet.id);
          router.dismissAll();
          router.replace('/pets');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  notice: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', padding: spacing.md },
  flex: { flex: 1 },
  med: { gap: spacing.md },
  medHeader: { flexDirection: 'row', alignItems: 'center' },
});
