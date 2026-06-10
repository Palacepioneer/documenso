/**
 * Jess Intelligence email design tokens.
 *
 * All color pairs are WCAG AA checked (2026-06-10):
 * - navy on gold button: 5.59:1
 * - navy on cream: 13.62:1
 * - muted on cream: 4.74:1 / on white: 5.43:1
 * - goldDark text on cream: 4.68:1
 * - terracotta text on cream: 6.21:1
 */
export const JESS_COLORS = {
  /** Headlines, body text, button labels. */
  navy: '#15243B',
  /** Card surface. */
  cream: '#F4EFE7',
  /** Primary button background, accents. Never use as text on light surfaces. */
  gold: '#C2933B',
  /** Gold-toned text (badges) on cream/white — AA-safe gold. */
  goldDark: '#8A6420',
  /** Secondary text, footers. */
  muted: '#5C6B80',
  /** "Declined" tone. */
  terracotta: '#8F4128',
  /** Body background. */
  white: '#FFFFFF',
} as const;

/** Email-safe serif stack for headlines (matches the Jess lockup). */
export const JESS_SERIF = "Georgia, 'Times New Roman', serif";

/** Strip a trailing .pdf for display — headlines should read like documents, not files. */
export const displayDocumentName = (name: string) => name.replace(/\.pdf$/i, '');

/** Gold scale used to override the upstream `documenso` lime scale in emails. */
export const JESS_GOLD_SCALE = {
  DEFAULT: '#C2933B',
  50: '#FBF7EF',
  100: '#F4EFE7',
  200: '#EADCBE',
  300: '#DEC18F',
  400: '#D2AE6B',
  500: '#C2933B',
  600: '#A87D2E',
  700: '#8A6420',
  800: '#6B4D18',
  900: '#4D3711',
  950: '#33240B',
} as const;
