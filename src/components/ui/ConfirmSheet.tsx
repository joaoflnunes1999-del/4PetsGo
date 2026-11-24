import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { Button } from './Button';
import { Sheet } from './Sheet';
import { Text } from './Text';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmSheet({ visible, title, message, confirmLabel, destructive, onConfirm, onClose }: Props) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <Text variant="body" color="textMuted" align="center">
        {message}
      </Text>
      <View style={styles.actions}>
        <Button
          label={confirmLabel}
          variant={destructive ? 'danger' : 'primary'}
          onPress={() => {
            onClose();
            onConfirm();
          }}
        />
        <Button label="Annuler" variant="ghost" onPress={onClose} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({ actions: { gap: spacing.sm, marginTop: spacing.sm } });
