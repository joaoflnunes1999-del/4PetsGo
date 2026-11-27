/**
 * 4PetsGo design tokens — the single source of truth for the visual identity.
 * Never hard-code a colour, font size, spacing or radius in a screen: import from `@/theme`.
 */

/**
 * Brand palette — v4 (27/11/2026), inspired by the founder's reference mock-up:
 * terracotta for ACTIONS only, forest/sage green as the brand's natural colour (icons, positive states,
 * large calm surfaces), warm cream backgrounds, soft cream cards with a light shadow, muted gold for rewards.
 * Every colour and its variants live here; screens only use the semantic `colors` below.
 *
 * Contrast: white on terracotta 500 = 4.1:1 (bold labels ≥ 16 px only); white on forest 700 = 6.2:1;
 * forest 700 on cream = 5.5:1; charcoal on sage 100 = 11:1.
 */
export const palette = {
  terracotta: {
    50: '#FBF3EF',
    100: '#F4E1D8',
    200: '#E8C3B3',
    500: '#B9674E', // CTA buttons, active tab, active filter
    600: '#A35A43', // pressed
    700: '#9C553F', // terracotta text & small icons
  },
  forest: {
    50: '#F0F5ED',
    100: '#DFE9D8', // sage surfaces: welcome, banners, own chat bubbles, "confirmed" pills
    200: '#C5D6BE',
    500: '#5E8467',
    700: '#3F6A4F', // brand green: icons, send button, verified check, positive text
    800: '#2F5340',
  },
  cream: '#F6F1EA', // app background
  card: '#FFFDFA', // cards (soft cream white)
  sand: {
    100: '#F1E9DF', // tags, secondary zones
    300: '#E9DDCF',
    400: '#DED1C2', // borders
  },
  gold: {
    100: '#FBEFD6', // Owner Club card, reward backgrounds
    500: '#D5AD79', // rewards, Paw Points, stars
    700: '#80602F',
  },
  charcoal: {
    900: '#2F2B28', // titles and main text
    600: '#6A625B', // secondary text
    400: '#9C938B', // placeholders, inactive tab icons
  },
  white: '#FFFFFF',
  line: '#EAE1D6',
  /** Logo green from the supplied logo file (app icon only). */
  logoLeaf: '#209C40',
  danger: '#A83A2F',
  dangerSoft: '#F6DEDA',
} as const;

export const colors = {
  background: palette.cream,
  surface: palette.card,
  surfaceMuted: palette.sand[100],
  field: palette.white,
  border: palette.line,
  text: palette.charcoal[900],
  textMuted: palette.charcoal[600],
  textSubtle: palette.charcoal[400],
  textInverse: palette.white,
  /** Actions only (Burnt Terracotta): primary buttons, active tab and filter. */
  action: palette.terracotta[500],
  actionPressed: palette.terracotta[600],
  /** Brand green: icons, links, positive emphasis. */
  primary: palette.forest[700],
  primaryPressed: palette.forest[800],
  primarySoft: palette.forest[100],
  secondary: palette.terracotta[700],
  brand: palette.terracotta[500],
  brandText: palette.terracotta[700],
  brandTint: palette.terracotta[50],
  /** Calm brand surfaces (welcome, banners). */
  brandSurface: palette.forest[100],
  /** Active filter chip: filled terracotta, white label. */
  selected: palette.terracotta[500],
  selectedBorder: palette.terracotta[500],
  selectedText: palette.white,
  accent: palette.gold[500],
  accentStrong: palette.gold[700],
  accentSoft: palette.gold[100],
  success: palette.forest[700],
  successSoft: palette.forest[100],
  warning: palette.gold[700],
  warningSoft: palette.gold[100],
  danger: palette.danger,
  dangerSoft: palette.dangerSoft,
  info: palette.forest[700],
  infoSoft: palette.forest[50],
  /** Chat */
  chatBackground: palette.cream,
  bubbleOwn: palette.forest[100],
  bubbleOther: palette.card,
  readTicks: palette.forest[500],
  sendButton: palette.forest[700],
  overlay: 'rgba(30, 24, 20, 0.95)',
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

/** Soft, friendly shapes: pill buttons and filters, 20 px cards, circles for profile photos. */
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Poppins (geometric, rounded, bold) for titles; Inter for reading text. */
export const fontFamily = {
  display: 'Poppins_700Bold',
  displayBold: 'Poppins_700Bold',
  heading: 'Poppins_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

/** Type scale — Poppins titles with tight leading, Inter body text. */
export const typography = {
  displayXL: { fontFamily: fontFamily.display, fontSize: 44, lineHeight: 50, letterSpacing: -1 },
  displayL: { fontFamily: fontFamily.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  displayM: { fontFamily: fontFamily.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  displayS: { fontFamily: fontFamily.heading, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  title: { fontFamily: fontFamily.heading, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fontFamily.body, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fontFamily.bodySemiBold, fontSize: 15, lineHeight: 22 },
  callout: { fontFamily: fontFamily.bodyMedium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fontFamily.body, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fontFamily.bodySemiBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
  /** Sentence-case badges ("Expert", "Identité vérifiée") — bold. */
  badge: { fontFamily: fontFamily.bodyBold, fontSize: 12, lineHeight: 16, letterSpacing: 0 },
  /** Numbers inside badges (Paw Points). */
  badgeValue: { fontFamily: fontFamily.bodySemiBold, fontSize: 12, lineHeight: 16, letterSpacing: 0 },
  number: { fontFamily: fontFamily.heading, fontSize: 17, lineHeight: 22 },
  /** Button labels: bold to keep white-on-terracotta legible. */
  button: { fontFamily: fontFamily.heading, fontSize: 16, lineHeight: 22, letterSpacing: 0.1 },
} as const;

export type TypographyVariant = keyof typeof typography;

/** Cards float on the cream background with a soft warm shadow (no outline). */
export const shadow = {
  card: {
    shadowColor: '#5A4636',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#3A2C22',
    shadowOpacity: 0.12,
    shadowRadius: 18,
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
