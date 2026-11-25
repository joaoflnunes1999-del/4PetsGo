import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Icon, Text } from '@/components/ui';
import { PICKUP_REASON_LABELS, type ChatParty, type MissionChat, type PickupReason } from '@/features/chat/types';
import { colors, radius, spacing } from '@/theme';

import { DropoffCodeEntry } from './DropoffCodeEntry';

type Props = {
  chat: MissionChat;
  me: ChatParty;
  sitterName: string;
  ownerName: string;
  petName: string;
  isLastDay: boolean;
  onDropoff: (code: string) => 'started' | 'invalid' | 'locked_out';
  onGeneratePickup: (reason?: PickupReason) => string | undefined;
  onPickup: (code: string) => 'completed' | 'invalid';
};

const EARLY_CONSEQUENCE: Record<'early_owner' | 'early_sitter', string> = {
  early_owner: 'Aucun remboursement pour le propriétaire.',
  early_sitter: 'Le propriétaire ne paiera que les jours effectués.',
};

function BigCode({ code, testID }: { code: string; testID: string }) {
  return (
    <Text style={styles.code} testID={testID}>
      {code.slice(0, 3)} {code.slice(3)}
    </Text>
  );
}

/** Content of the "Codes" sheet, by mission status and by who is looking. */
export function MissionCodes({ chat, me, sitterName, ownerName, petName, isLastDay, onDropoff, onGeneratePickup, onPickup }: Props) {
  const [reason, setReason] = useState<'early_owner' | 'early_sitter'>();

  if (chat.status === 'completed') {
    return (
      <View style={styles.box}>
        <Icon name="check-circle" size={28} color="success" />
        <Text variant="body" align="center">
          Mission terminée. {petName} a été récupéré.
        </Text>
      </View>
    );
  }

  // ---- Before the hand-over ----
  if (chat.status === 'confirmed') {
    if (me === 'owner') {
      return (
        <View style={styles.box}>
          <Text variant="caption" color="textMuted" align="center">
            À donner à {sitterName} au moment où vous lui confiez {petName}
          </Text>
          <BigCode code={chat.dropoffCode} testID="dropoff-code" />
          <View style={styles.warning}>
            <Icon name="alert-triangle" size={16} color="warning" />
            <Text variant="caption" style={styles.flex}>
              Ce code ne doit être donné qu’au moment de la remise de votre animal au Pet Sitter.
            </Text>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.box}>
        <Text variant="title" align="center">
          Remise de {petName}
        </Text>
        <Text variant="callout" color="textMuted" align="center">
          Saisissez le code que {ownerName} vous donne au moment où il vous confie {petName}. Votre rémunération sera alors réservée
          jusqu’à la fin de la mission.
        </Text>
        <DropoffCodeEntry onSubmit={onDropoff} />
      </View>
    );
  }

  // ---- During the mission ----
  if (me === 'sitter') {
    if (chat.pickupCode) {
      return (
        <View style={styles.box}>
          <Text variant="caption" color="textMuted" align="center">
            Donnez ce code à {ownerName} quand il récupère {petName}
          </Text>
          <BigCode code={chat.pickupCode} testID="pickup-code" />
          <Text variant="caption" color="textMuted" align="center">
            {PICKUP_REASON_LABELS[chat.pickupReason!]}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.box}>
        <Text variant="title" align="center">
          Code de fin de mission
        </Text>
        {isLastDay ? (
          <Text variant="callout" color="textMuted" align="center">
            Générez le code au moment où {ownerName} vient chercher {petName}.
          </Text>
        ) : (
          <>
            <Text variant="callout" color="textMuted" align="center">
              La mission n’est pas encore terminée. Pourquoi se termine-t-elle plus tôt ?
            </Text>
            {(['early_owner', 'early_sitter'] as const).map((r) => (
              <Pressable
                key={r}
                accessibilityRole="radio"
                accessibilityState={{ checked: reason === r }}
                onPress={() => setReason(r)}
                style={[styles.option, reason === r ? styles.optionOn : null]}
                testID={`pickup-reason-${r}`}>
                <Text variant="bodyStrong">{PICKUP_REASON_LABELS[r]}</Text>
                <Text variant="caption" color="textMuted">
                  {EARLY_CONSEQUENCE[r]}
                </Text>
              </Pressable>
            ))}
          </>
        )}
        <Button
          label="Générer le code de remise"
          icon="key"
          disabled={!isLastDay && !reason}
          onPress={() => onGeneratePickup(isLastDay ? undefined : reason)}
          testID="pickup-generate"
        />
      </View>
    );
  }

  return (
    <View style={styles.box}>
      {chat.pickupCode ? (
        <>
          <Text variant="title" align="center">
            Récupérer {petName}
          </Text>
          <Text variant="callout" color="textMuted" align="center">
            {PICKUP_REASON_LABELS[chat.pickupReason!]}. Saisissez le code que {sitterName} vous donne pour valider la fin de la mission.
          </Text>
          <DropoffCodeEntry
            onSubmit={(c) => (onPickup(c) === 'completed' ? 'started' : 'invalid')}
            label="Valider la fin de mission"
            testPrefix="pickup"
          />
        </>
      ) : (
        <Text variant="body" color="textMuted" align="center">
          Quand vous récupérerez {petName}, {sitterName} vous donnera un code de fin de mission à saisir ici.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.md },
  flex: { flex: 1 },
  code: { textAlign: 'center', fontSize: 40, lineHeight: 48, letterSpacing: 6, fontFamily: 'Inter_700Bold', color: colors.text },
  warning: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', backgroundColor: colors.warningSoft, padding: spacing.md, borderRadius: radius.md },
  option: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: 2 },
  optionOn: { borderColor: colors.selectedBorder, backgroundColor: colors.selected },
});
