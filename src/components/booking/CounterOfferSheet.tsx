import { useState } from 'react';

import { Button, Input, Sheet, Text } from '@/components/ui';
import type { Currency } from '@/domain/types';
import { formatMoney, parseMoneyInput } from '@/features/pricing/pricing';

type Props = {
  visible: boolean;
  onClose: () => void;
  currency: Currency;
  floorCents: number;
  currentCents: number;
  offersLeft: number;
  title: string;
  onSubmit: (priceCents: number) => string | undefined; // returns an error message, if any
};

export function CounterOfferSheet({ visible, onClose, currency, floorCents, currentCents, offersLeft, title, onSubmit }: Props) {
  const [value, setValue] = useState('');
  const [serverError, setServerError] = useState<string>();
  const cents = value ? parseMoneyInput(value) : NaN;
  const localError =
    value && Number.isNaN(cents)
      ? 'Montant invalide'
      : value && cents < floorCents
        ? `Prix minimum : ${formatMoney(floorCents, currency)}`
        : undefined;

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <Text variant="callout" color="textMuted" align="center">
        Offre actuelle : {formatMoney(currentCents, currency)} · Il vous reste {offersLeft} proposition{offersLeft > 1 ? 's' : ''}
      </Text>
      <Input
        value={value}
        onChangeText={(t) => {
          setValue(t);
          setServerError(undefined);
        }}
        keyboardType="decimal-pad"
        placeholder={formatMoney(currentCents, currency)}
        suffix={currency === 'EUR' ? '€' : 'CHF'}
        error={localError ?? serverError}
        helper={`Prix minimum : ${formatMoney(floorCents, currency)}`}
        autoFocus
        testID="counter-input"
      />
      <Button
        label="Envoyer la contre-proposition"
        disabled={!value || !!localError}
        onPress={() => {
          const err = onSubmit(cents);
          if (err) setServerError(err);
          else {
            setValue('');
            onClose();
          }
        }}
        testID="counter-submit"
      />
    </Sheet>
  );
}
