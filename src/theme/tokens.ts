/**
 * 4PetsGo design tokens — the single source of truth for the visual identity.
 * Never hard-code a colour, font size, spacing or radius in a screen: import from `@/theme`.
 */

export const palette = {
  // Brand
  pine900: '#12342A',
  pine700: '#1F4D3F', // primary
  pine500: '#3E7A66',
  pine100: '#E3EEE9',
  apricot600: '#D9823B',
  apricot500: '#EE9A52', // accent
  apricot100: '#FCEBDC',

  // Neutrals (warm)
  ink: '#1A1D1B',
  slate: '#5E6661',
  stone: '#9AA19C',
  sand: '#E9E3D8',
  linen: '#F4EFE7',
  cream: '#FBF8F3',
  white: '#FFFFFF',

  // Feedback
  success: '#2F8A5B',
  successSoft: '#E1F2E8',
  warning: '#B7791F',
  warningSoft: '#FBF0DA',
  danger: '#C2413A',
  dangerSoft: '#F8E3E1',
  info: '#2F6E9E',
  infoSoft: '#E1ECF5',
} as const;

export const colors = {
  background: palette.cream,
  surface: palette.white,
  surfaceMuted: palette.linen,
  border: palette.sand,
  text: palette.ink,
  textMuted: palette.slate,
  textSubtle: palette.stone,
  textInverse: palette.white,
  primary: palette.pine700,
  primaryPressed: palette.pine900,
  primarySoft: palette.pine100,
  accent: palette.apricot500,
  accentStrong: palette.apricot600,
  accentSoft: palette.apricot100,
  success: palette.success,
  successSoft: palette.successSoft,
  warning: palette.warning,
  warningSoft: palette.warningSoft,
  danger: palette.danger,
  dangerSoft: palette.dangerSoft,
  info: palette.info,
  infoSoft: palette.infoSoft,
  overlay: 'rgba(18, 22, 20, 0.92)',
  photoBackdrop: palette.white,
} as const;

/** 4-pt spacing scale. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const fontFamily = {
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

/** Type scale. `display*` variants use the serif (emotional: pet names, titles); the rest use Inter. */
export const typography = {
  displayL: { fontFamily: fontFamily.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.4 },
  displayM: { fontFamily: fontFamily.display, fontSize: 26, lineHeight: 32, letterSpacing: -0.3 },
  displayS: { fontFamily: fontFamily.display, fontSize: 21, lineHeight: 27, letterSpacing: -0.2 },
  title: { fontFamily: fontFamily.bodySemiBold, fontSize: 17, lineHeight: 23 },
  body: { fontFamily: fontFamily.body, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fontFamily.bodySemiBold, fontSize: 15, lineHeight: 22 },
  callout: { fontFamily: fontFamily.bodyMedium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fontFamily.body, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fontFamily.bodySemiBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
  number: { fontFamily: fontFamily.bodyBold, fontSize: 17, lineHeight: 22 },
} as const;

export type TypographyVariant = keyof typeof typography;

export const shadow = {
  card: {
    shadowColor: '#2B2118',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#2B2118',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

export const layout = {
  screenPadding: spacing.lg,
  maxContentWidth: 560,
  galleryColumns: 3,
  galleryGap: 2,
  hitSlop: 8,
} as const;
