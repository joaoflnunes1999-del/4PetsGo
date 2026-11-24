/**
 * 4PetsGo design tokens — the single source of truth for the visual identity.
 * Never hard-code a colour, font size, spacing or radius in a screen: import from `@/theme`.
 */

/**
 * Brand palette (validated by the founder, 24/11/2026) — natural, elegant, terracotta-led.
 * Every colour and all its variants live here; screens only use the semantic `colors` below.
 * Base values: Burnt Terracotta #B9674E · Clay Brown #854B3A · Warm Ivory #F7F2EA · Soft Sand #E9D8C9 ·
 * Dusty Blue #718B9C · Sage Green #A8B09A · Charcoal #35312E · Muted Gold #D5AD79.
 *
 * Contrast rules: white on terracotta 500 = 4.1:1 (bold button labels only). Coloured TEXT and small
 * icons use the 700 shades (≥ 4.6:1 on ivory and white).
 */
export const palette = {
  terracotta: {
    50: '#FBF3EF',
    100: '#F4E1D8',
    150: '#EED0C1', // own chat bubbles
    200: '#E8C3B3',
    500: '#B9674E', // Burnt Terracotta — brand, action buttons, accents
    600: '#A35A43', // pressed
    700: '#9C553F', // terracotta text & icons (5.0:1 on ivory)
  },
  clay: {
    500: '#854B3A', // Clay Brown — contrast and depth (6.2:1 on ivory)
    700: '#6E3D2F',
  },
  ivory: '#F7F2EA', // Warm Ivory — main background
  sand: {
    100: '#F2E8DE',
    300: '#E9D8C9', // Soft Sand — secondary backgrounds, content zones
    400: '#DDCBBB', // borders on sand
  },
  blue: {
    100: '#E3EAEE',
    500: '#718B9C', // Dusty Blue — filters, selection, secondary info (use sparingly)
    700: '#4F6877', // blue text & icons (5.3:1 on ivory)
  },
  sage: {
    100: '#E8EBE2',
    500: '#A8B09A', // Sage Green — positive elements, natural details
    700: '#596249', // sage text (5.8:1)
  },
  gold: {
    100: '#F6EBDC',
    500: '#D5AD79', // Muted Gold — rewards, Paw Points, small decorative details
    700: '#80602F', // gold text (5.2:1)
  },
  charcoal: {
    900: '#35312E', // Charcoal — main text and titles
    600: '#5F5852', // secondary text (≥ 5:1 on ivory, white and sand)
    400: '#978E86', // placeholders, disabled
  },
  white: '#FFFFFF',
  line: '#E6DCD1',
  /** Logo green from the supplied logo file (app icon only). */
  logoLeaf: '#209C40',

  // Feedback (danger is the only colour outside the brand palette)
  danger: '#A83A2F',
  dangerSoft: '#F6DEDA',
} as const;

export const colors = {
  background: palette.ivory,
  /** Cards are white on the ivory background. */
  surface: palette.white,
  surfaceMuted: palette.sand[300],
  field: palette.white,
  border: palette.line,
  text: palette.charcoal[900],
  textMuted: palette.charcoal[600],
  textSubtle: palette.charcoal[400],
  textInverse: palette.white,
  /** Action buttons (Burnt Terracotta). */
  action: palette.terracotta[500],
  actionPressed: palette.terracotta[600],
  /** Important elements, icons, links and text accents — terracotta family, text-safe shade. */
  primary: palette.terracotta[700],
  primaryPressed: palette.clay[700],
  primarySoft: palette.terracotta[100],
  /** Contrast and depth (Clay Brown). */
  secondary: palette.clay[500],
  brand: palette.terracotta[500],
  brandText: palette.terracotta[700],
  brandTint: palette.terracotta[50],
  /** Filters and selected states (Dusty Blue, used sparingly). */
  selected: palette.blue[100],
  selectedBorder: palette.blue[500],
  selectedText: palette.blue[700],
  /** Rewards and Paw Points (Muted Gold). */
  accent: palette.gold[500],
  accentStrong: palette.gold[700],
  accentSoft: palette.gold[100],
  /** Positive states (Sage Green). */
  success: palette.sage[700],
  successSoft: palette.sage[100],
  warning: palette.gold[700],
  warningSoft: palette.gold[100],
  danger: palette.danger,
  dangerSoft: palette.dangerSoft,
  info: palette.blue[700],
  infoSoft: palette.blue[100],
  /** Chat (WhatsApp-like layout, 4PetsGo palette). */
  chatBackground: palette.sand[100],
  bubbleOwn: palette.terracotta[150],
  bubbleOther: palette.white,
  readTicks: palette.blue[500],
  overlay: 'rgba(30, 24, 20, 0.95)',
  /** Backdrop behind bottom sheets. */
  scrim: 'rgba(30, 24, 20, 0.35)',
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
  /** Sentence-case badges ("Expert", "Identité vérifiée") — bold. */
  badge: { fontFamily: fontFamily.bodyBold, fontSize: 12, lineHeight: 16, letterSpacing: 0 },
  /** Numbers inside badges (Paw Points). */
  badgeValue: { fontFamily: fontFamily.bodySemiBold, fontSize: 12, lineHeight: 16, letterSpacing: 0 },
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
