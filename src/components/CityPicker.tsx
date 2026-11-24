import { StyleSheet, View } from 'react-native';

import { Chip, Text } from '@/components/ui';
import type { Country } from '@/domain/types';
import { CITIES } from '@/features/sitters/cities';
import { spacing } from '@/theme';

const LABEL: Record<Country, string> = { FR: '🇫🇷  France', CH: '🇨🇭  Suisse' };

export function CityPicker({ value, onChange }: { value?: string; onChange: (id: string) => void }) {
  return (
    <View style={styles.wrap}>
      {(['FR', 'CH'] as const).map((country) => (
        <View key={country} style={styles.group}>
          <Text variant="label" color="textMuted">
            {LABEL[country].toUpperCase()}
          </Text>
          <View style={styles.chips}>
            {CITIES.filter((c) => c.country === country).map((c) => (
              <Chip key={c.id} label={c.name} selected={value === c.id} onPress={() => onChange(c.id)} testID={`city-${c.id}`} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  group: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
