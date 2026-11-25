import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Input, Text } from '@/components/ui';
import { spacing } from '@/theme';

type Props = { onSubmit: (code: string) => 'started' | 'invalid' | 'locked_out'; label?: string; testPrefix?: string };

/** The sitter types the owner's 6-digit code at hand-over (5 attempts). */
export function DropoffCodeEntry({ onSubmit, label = 'Valider la remise', testPrefix = 'dropoff' }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const digits = code.replace(/\D/g, '');
  return (
    <View style={styles.wrap}>
      <Input
        value={code}
        onChangeText={(t) => {
          setCode(t);
          setError(undefined);
        }}
        keyboardType="number-pad"
        maxLength={7}
        placeholder="000 000"
        error={error}
        testID={`${testPrefix}-input`}
      />
      <Button
        label={label}
        disabled={digits.length !== 6}
        onPress={() => {
          const r = onSubmit(digits);
          if (r === 'invalid') setError('Code incorrect.');
          if (r === 'locked_out') setError('Trop d’essais. Contactez le support 4PetsGo.');
        }}
        testID={`${testPrefix}-submit`}
      />
      <Text variant="caption" color="textMuted" align="center">
        5 essais maximum.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { gap: spacing.sm } });
