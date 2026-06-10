/**
 * Jess Intelligence email design tokens.
 *
 * Canonical pair sampled from the operator-approved 2026-06-10 logo
 * (claude-design-onboarding/john-approved-logo-2026-06-10.png):
 * navy #1A2844, gold #B39139.
 *
 * All color pairs are WCAG AA checked (2026-06-10):
 * - navy on gold button: 4.91:1
 * - navy on cream: 12.82:1
 * - muted on cream: 4.74:1 / on white: 5.43:1
 * - goldDark text on cream: 4.59:1
 * - terracotta text on cream: 6.21:1
 */
export const JESS_COLORS = {
  /** Headlines, body text, button labels. */
  navy: '#1A2844',
  /** Card surface. */
  cream: '#F4EFE7',
  /** Primary button background, accents. Never use as text on light surfaces. */
  gold: '#B39139',
  /** Gold-toned text (badges) on cream/white — AA-safe gold. */
  goldDark: '#85681E',
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
  DEFAULT: '#B39139',
  50: '#FBF8EF',
  100: '#F4EFE7',
  200: '#EADEBE',
  300: '#DEC88F',
  400: '#D2B56B',
  500: '#B39139',
  600: '#A8862E',
  700: '#85681E',
  800: '#6B5418',
  900: '#4D3C11',
  950: '#33280B',
} as const;
