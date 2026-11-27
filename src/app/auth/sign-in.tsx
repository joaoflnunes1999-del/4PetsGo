import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Button, Input, Screen, Text } from '@/components/ui';
import { isValidEmail, sendEmailCode, signInWithAppleToken, verifyEmailCode } from '@/lib/supabase';
import { colors, radius, spacing } from '@/theme';

/** "Se connecter": Sign in with Apple (iOS) or a 6-digit code sent by e-mail (Supabase Auth). */
export default function SignIn() {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const afterSignIn = () => router.replace('/');

  const send = async () => {
    setBusy(true);
    setError(undefined);
    const e = await sendEmailCode(email);
    setBusy(false);
    if (e) setError(e);
    else setStep('code');
  };
  const verify = async () => {
    setBusy(true);
    setError(undefined);
    const e = await verifyEmailCode(email, code);
    setBusy(false);
    if (e) setError(e);
    else afterSignIn();
  };
  const apple = async () => {
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      if (!cred.identityToken) return;
      const e = await signInWithAppleToken(cred.identityToken);
      if (e) setError(e);
      else afterSignIn();
    } catch (err) {
      if ((err as { code?: string }).code !== 'ERR_REQUEST_CANCELED') setError('La connexion avec Apple a échoué.');
    }
  };

  return (
    <Screen back>
      <Text variant="displayL">Se connecter</Text>
      <Text variant="body" color="textMuted">
        Retrouvez vos animaux, vos missions et vos messages.
      </Text>

      {Platform.OS === 'ios' ? (
        <>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={radius.pill}
            style={styles.apple}
            onPress={apple}
          />
          <View style={styles.or}>
            <View style={styles.line} />
            <Text variant="caption" color="textMuted">
              ou par e-mail
            </Text>
            <View style={styles.line} />
          </View>
        </>
      ) : null}

      {step === 'email' ? (
        <>
          <Input
            label="Adresse e-mail"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError(undefined);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="vous@exemple.fr"
            testID="signin-email"
          />
          <Button label="Recevoir un code" disabled={!isValidEmail(email)} loading={busy} onPress={send} testID="signin-send" />
        </>
      ) : (
        <>
          <Text variant="callout">
            Un code à 6 chiffres a été envoyé à <Text variant="bodyStrong">{email.trim()}</Text>.
          </Text>
          <Input value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} placeholder="000000" testID="signin-code" />
          <Button label="Se connecter" disabled={code.trim().length !== 6} loading={busy} onPress={verify} testID="signin-verify" />
          <Button label="Changer d’adresse e-mail" variant="ghost" size="sm" onPress={() => setStep('email')} />
        </>
      )}

      {error ? (
        <Text variant="caption" color="danger" testID="signin-error">
          {error}
        </Text>
      ) : null}

      <Button label="Pas encore de compte ? Créer un compte" variant="ghost" size="sm" onPress={() => router.replace('/onboarding/role')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  apple: { height: 54, width: '100%' },
  or: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
