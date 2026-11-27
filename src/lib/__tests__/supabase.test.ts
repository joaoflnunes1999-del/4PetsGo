import { AUTH_NOT_CONFIGURED, isSupabaseConfigured, isValidEmail, sendEmailCode } from '../supabase';

jest.mock('@react-native-async-storage/async-storage', () => ({}));

describe('auth helpers', () => {
  it('validates e-mail addresses', () => {
    expect(isValidEmail('julie@exemple.fr')).toBe(true);
    expect(isValidEmail(' julie@exemple.fr ')).toBe(true);
    expect(isValidEmail('julie@')).toBe(false);
    expect(isValidEmail('julie exemple.fr')).toBe(false);
  });
  it('reports a clear message when Supabase is not configured', async () => {
    if (isSupabaseConfigured) return;
    expect(await sendEmailCode('julie@exemple.fr')).toBe(AUTH_NOT_CONFIGURED);
  });
});
