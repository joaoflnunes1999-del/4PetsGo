/**
 * 4PetsGo design tokens — the single source of truth for the visual identity.
 * Never hard-code a colour, font size, spacing or radius in a screen: import from `@/theme`.
 */

/**
 * Brand palette (validated by the founder, 24/11/2026) — natural, earthy tones.
 * Every colour of the app and all its variants live here; screens only use `colors` (semantic tokens).
 * Reference values: terracotta #C8795B · earth brown #713F32 · cream #F8F3EC · rosy beige #EAD9CC ·
 * sage #A9B5A0 · charcoal #34312E.
 */
export const palette = {
  terracotta: {
    50: '#FBF1EC',
    100: '#F1E2D6',
    200: '#E2C3B0',
    500: '#C8795B', // couleur principale, boutons d'action
    600: '#B0654A', // pressed
    700: '#9E583D', // terracotta-family text on light backgrounds (4.9:1)
  },
  earth: {
    500: '#713F32', // contrastes, éléments importants (7.7:1 on cream)
    700: '#5A3027',
  },
  cream: '#F8F3EC', // fonds principaux
  beige: {
    100: '#F1E7DE',
    300: '#EAD9CC', // fonds secondaires et cartes
    400: '#E0CDBF', // bordures
  },
  sage: {
    100: '#DDE3D8', // éléments sélectionnés (fond)
    300: '#A9B5A0', // couleur complémentaire
    500: '#7E8C74', // bordure des éléments sélectionnés
    700: '#56634E', // texte sauge (5.8:1)
  },
  charcoal: {
    900: '#34312E', // textes et titres
    600: '#58504A', // texte secondaire
    400: '#958C84', // placeholders
  },
  white: '#FFFFFF',
  field: '#FFFDFA', // fond des champs de saisie
  /** Logo green from the supplied logo file (app icon only). */
  logoLeaf: '#209C40',

  // Feedback
  success: '#56634E',
  successSoft: '#DDE3D8',
  warning: '#9E583D',
  warningSoft: '#F7E4D4',
  danger: '#A83A2F',
  dangerSoft: '#F6DEDA',
  info: '#3F6478',
  infoSoft: '#E1E9EE',
} as const;

export const colors = {
  background: palette.cream,
  surface: palette.beige[300],
  surfaceMuted: palette.beige[100],
  field: palette.field,
  selected: palette.sage[100],
  selectedBorder: palette.sage[500],
  border: palette.beige[400],
  text: palette.charcoal[900],
  textMuted: palette.charcoal[600],
  textSubtle: palette.charcoal[400],
  textInverse: palette.white,
  /** Action buttons (terracotta). */
  action: palette.terracotta[500],
  actionPressed: palette.terracotta[600],
  /** Important elements, icons, links and text accents (earth brown). */
  primary: palette.earth[500],
  primaryPressed: palette.earth[700],
  primarySoft: palette.terracotta[200],
  brand: palette.terracotta[500],
  brandText: palette.terracotta[700],
  brandTint: palette.terracotta[100],
  accent: palette.sage[300],
  accentStrong: palette.sage[700],
  accentSoft: palette.sage[100],
  success: palette.success,
  successSoft: palette.successSoft,
  warning: palette.warning,
  warningSoft: palette.warningSoft,
  danger: palette.danger,
  dangerSoft: palette.dangerSoft,
  info: palette.info,
  infoSoft: palette.infoSoft,
  overlay: 'rgba(30, 24, 20, 0.95)',
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
  /** Button labels: bold to keep white-on-terracotta legible. */
  button: { fontFamily: fontFamily.bodyBold, fontSize: 16, lineHeight: 22, letterSpacing: 0.1 },
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
