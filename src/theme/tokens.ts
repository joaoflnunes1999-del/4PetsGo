/**
 * 4PetsGo design tokens — the single source of truth for the visual identity.
 * Never hard-code a colour, font size, spacing or radius in a screen: import from `@/theme`.
 */

/** Colours sampled from the 4PetsGo logo: forest green, leaf green and mint. */
export const palette = {
  forest900: '#01331A',
  forest800: '#024622', // logo dark green — primary actions, headings accents
  leaf600: '#1B8A37',
  leaf500: '#209C40', // logo "Go" green — brand highlights
  mint300: '#C2F8C8', // logo background
  mint200: '#D6F9DB',
  mint100: '#E5FAE8', // app background (green, not white)
  mint50: '#F2FCF4',
  // Warm highlight, used sparingly (Paw Points, ratings, "new" tags)
  honey600: '#A86B12',
  honey500: '#E9A23B',
  honey100: '#FDF2DF',

  // Green-tinted neutrals
  ink: '#10291A',
  slate: '#4D6656',
  stone: '#8BA393',
  line: '#C9E8D0',
  white: '#FFFFFF',

  // Feedback
  success: '#1B8A37',
  successSoft: '#D6F5DD',
  warning: '#A86B12',
  warningSoft: '#FBF0DA',
  danger: '#C2413A',
  dangerSoft: '#F9E5E3',
  info: '#2F6E9E',
  infoSoft: '#E3EDF6',
} as const;

export const colors = {
  background: palette.mint100,
  surface: palette.white,
  surfaceMuted: palette.mint50,
  border: palette.line,
  text: palette.ink,
  textMuted: palette.slate,
  textSubtle: palette.stone,
  textInverse: palette.white,
  primary: palette.forest800,
  primaryPressed: palette.forest900,
  primarySoft: palette.mint300,
  brand: palette.leaf500,
  brandTint: palette.mint200,
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
  overlay: 'rgba(1, 26, 13, 0.95)',
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
