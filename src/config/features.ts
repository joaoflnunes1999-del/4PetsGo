/**
 * Feature switches. "Se connecter" (returning users) only appears once real accounts exist
 * (Supabase Auth, phase 2) — never a button that does nothing.
 */
export const FEATURES = {
  accountSignIn: false,
} as const;
