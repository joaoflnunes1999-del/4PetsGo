import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client. Only the PUBLIC values live in the app (project URL + anon/publishable key, protected by RLS);
 * secret keys stay in Edge Functions. Set them in `.env` (not committed):
 *   EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!url && !!anonKey;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    })
  : null;

export const AUTH_NOT_CONFIGURED =
  'La connexion n’est pas encore configurée sur cette version de développement (projet Supabase manquant).';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isValidEmail = (email: string) => EMAIL_RE.test(email.trim());

/** Sends a 6-digit sign-in code by e-mail (Supabase Auth OTP). */
export async function sendEmailCode(email: string): Promise<string | undefined> {
  if (!supabase) return AUTH_NOT_CONFIGURED;
  const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true } });
  return error ? 'Impossible d’envoyer le code. Vérifiez l’adresse e-mail et réessayez.' : undefined;
}

export async function verifyEmailCode(email: string, code: string): Promise<string | undefined> {
  if (!supabase) return AUTH_NOT_CONFIGURED;
  const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
  return error ? 'Code incorrect ou expiré.' : undefined;
}

/** Sign in with Apple (iOS): the identity token from Apple is exchanged for a Supabase session. */
export async function signInWithAppleToken(identityToken: string): Promise<string | undefined> {
  if (!supabase) return AUTH_NOT_CONFIGURED;
  const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: identityToken });
  return error ? 'La connexion avec Apple a échoué.' : undefined;
}
