/**
 * 4PetsGo design tokens — the single source of truth for the visual identity.
 * Never hard-code a colour, font size, spacing or radius in a screen: import from `@/theme`.
 */

export const palette = {
  // Brand — aloe vera green
  aloe800: '#24603F',
  aloe700: '#367F5C', // primary actions (white text ≥ 4.8:1)
  aloe500: '#5FA57F', // brand aloe vera
  aloe300: '#A8D5B9',
  aloe100: '#E7F3EC',
  aloe50: '#F3F9F5',
  // Warm highlight, used sparingly (Paw Points, ratings, "new" tags)
  honey600: '#B7791F',
  honey500: '#E9A23B',
  honey100: '#FDF2DF',

  // Neutrals (clean, near-white marketplace look)
  ink: '#171A18',
  slate: '#646A66',
  stone: '#9BA19D',
  line: '#E6E8E6',
  mist: '#F4F5F4',
  white: '#FFFFFF',

  // Feedback
  success: '#2F8A5B',
  successSoft: '#E3F3EA',
  warning: '#B7791F',
  warningSoft: '#FBF0DA',
  danger: '#C2413A',
  dangerSoft: '#F9E5E3',
  info: '#2F6E9E',
  infoSoft: '#E3EDF6',
} as const;

export const colors = {
  background: palette.white,
  surface: palette.white,
  surfaceMuted: palette.mist,
  border: palette.line,
  text: palette.ink,
  textMuted: palette.slate,
  textSubtle: palette.stone,
  textInverse: palette.white,
  primary: palette.aloe700,
  primaryPressed: palette.aloe800,
  primarySoft: palette.aloe100,
  brand: palette.aloe500,
  brandTint: palette.aloe50,
  accent: palette.honey500,
  accentStrong: palette.honey600,
  accentSoft: palette.honey100,
  success: palette.success,
  successSoft: palette.successSoft,
  warning: palette.warning,
  warningSoft: palette.warningSoft,
  danger: palette.danger,
  dangerSoft: palette.dangerSoft,
  info: palette.info,
  infoSoft: palette.infoSoft,
  overlay: 'rgba(17, 20, 18, 0.94)',
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

/** Marketplace-style: tight corners on controls and cards, round only for avatars/chips. */
export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 20,
  pill: 999,
} as const;

export const fontFamily = {
  display: 'Inter_700Bold',
  displayBold: 'Inter_800ExtraBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

/** Type scale — a single sans-serif family (Inter), hierarchy carried by weight and size. */
export const typography = {
  displayL: { fontFamily: fontFamily.display, fontSize: 26, lineHeight: 32, letterSpacing: -0.4 },
  displayM: { fontFamily: fontFamily.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  displayS: { fontFamily: fontFamily.display, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  title: { fontFamily: fontFamily.bodySemiBold, fontSize: 17, lineHeight: 23 },
  body: { fontFamily: fontFamily.body, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fontFamily.bodySemiBold, fontSize: 15, lineHeight: 22 },
  callout: { fontFamily: fontFamily.bodyMedium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fontFamily.body, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fontFamily.bodySemiBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
  number: { fontFamily: fontFamily.bodyBold, fontSize: 17, lineHeight: 22 },
} as const;

export type TypographyVariant = keyof typeof typography;

/** Flat UI: separation comes from hairline borders; only floating layers cast a shadow. */
export const shadow = {
  card: {},
  floating: {
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
} as const;

export const layout = {
  screenPadding: spacing.lg,
  maxContentWidth: 560,
  galleryColumns: 3,
  galleryGap: 2,
  /** Two-column grid gap for card grids (pets). */
  gridGap: 12,
  hitSlop: 8,
} as const;
