/**
 * 4PetsGo design tokens — the single source of truth for the visual identity.
 * Never hard-code a colour, font size, spacing or radius in a screen: import from `@/theme`.
 */

/**
 * Brand palette (validated by the founder, 24/11/2026):
 * pastel green = main colour · forest = key actions/icons/contrast · warm white = main backgrounds ·
 * mist = secondary backgrounds & selected states · soft peach = small warm touches · charcoal = text.
 */
export const palette = {
  pastel: '#B9D8C5', // couleur principale
  pastelLight: '#DCEBE1',
  forest: '#244C3B', // boutons importants, icônes, contraste (white text 9.7:1)
  forestDark: '#1A3A2C',
  warmWhite: '#F7F6F0', // fonds principaux
  mist: '#E7EDE7', // fonds secondaires, éléments sélectionnés
  peach: '#E9B98E', // petites touches décoratives
  peachLight: '#FBEBDD',
  peachText: '#8A5A33', // peach-family text on light backgrounds (5.4:1)
  charcoal: '#343B37', // textes et titres
  charcoalMuted: '#5E6661',
  charcoalSubtle: '#9AA19C',
  line: '#DFE4DE',
  white: '#FFFFFF',
  /** Logo-only: the "Go" of the wordmark keeps its original green. */
  logoLeaf: '#209C40',

  // Feedback
  success: '#2E7D55',
  successSoft: '#DDEFE4',
  warning: '#8A5A33',
  warningSoft: '#FBEBDD',
  danger: '#B23A33',
  dangerSoft: '#F8E3E1',
  info: '#2F6E9E',
  infoSoft: '#E3EDF6',
} as const;

export const colors = {
  background: palette.warmWhite,
  surface: palette.white,
  surfaceMuted: palette.mist,
  selected: palette.mist,
  border: palette.line,
  text: palette.charcoal,
  textMuted: palette.charcoalMuted,
  textSubtle: palette.charcoalSubtle,
  textInverse: palette.white,
  primary: palette.forest,
  primaryPressed: palette.forestDark,
  primarySoft: palette.pastel,
  brand: palette.pastel,
  brandTint: palette.pastelLight,
  accent: palette.peach,
  accentStrong: palette.peachText,
  accentSoft: palette.peachLight,
  success: palette.success,
  successSoft: palette.successSoft,
  warning: palette.warning,
  warningSoft: palette.warningSoft,
  danger: palette.danger,
  dangerSoft: palette.dangerSoft,
  info: palette.info,
  infoSoft: palette.infoSoft,
  overlay: 'rgba(20, 26, 23, 0.95)',
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

/** Slightly rounded components; circles are reserved for profile photos (users and pets) and chips. */
export const radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 22,
  pill: 999,
} as const;

export const fontFamily = {
  display: 'Inter_700Bold',
  displayBold: 'Inter_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

/** Type scale — Inter only, in Regular, Medium, SemiBold and Bold. */
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
  screenPadding: 20,
  /** Vertical rhythm between blocks of a screen (generous spacing). */
  sectionGap: 20,
  maxContentWidth: 560,
  galleryColumns: 3,
  galleryGap: 2,
  /** Two-column grid gap for card grids (pets). */
  gridGap: 12,
  hitSlop: 8,
} as const;
