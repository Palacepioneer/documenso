import { Body, Container, Head, Html, Img, Link, Preview, Section } from '../components';
import { JESS_COLORS } from '../jess-brand';
import { useBranding } from '../providers/branding';
import { TemplateJessSignature } from './template-jess-signature';

export interface TemplateEmailShellProps {
  previewText: string;
  assetBaseUrl: string;
  children: React.ReactNode;
  /** Rendered between the card and the footer (e.g. a personal note for legacy layouts). */
  belowCard?: React.ReactNode;
}

/**
 * Shared outer structure for Jess Intelligence lifecycle emails:
 * white body -> cream card with a gold top rule -> linked logo -> content ->
 * Jess signature card, and NOTHING after it (operator ruling 2026-06-10).
 *
 * - `bgcolor` attributes are set alongside inline styles so image-blocked and
 *   legacy Outlook renderings keep the card structure.
 * - `color-scheme: light only` opts out of client dark-mode inversion; every
 *   text/surface pair is WCAG AA in light polarity (see jess-brand.ts).
 */
export const TemplateEmailShell = ({ previewText, assetBaseUrl, children, belowCard }: TemplateEmailShellProps) => {
  const branding = useBranding();

  const getAssetUrl = (path: string) => {
    return new URL(path, assetBaseUrl).toString();
  };

  // First line of the company details, minus a legal suffix, doubles as the
  // accessible logo name ("Jess Intelligence, Inc." -> "Jess Intelligence").
  const companyName =
    (branding.brandingCompanyDetails || '')
      .split('\n')[0]
      ?.replace(/,?\s+(inc\.?|llc|ltd\.?|gmbh)$/i, '')
      .trim() || 'Logo';

  // Logo at 9rem (144px): the signature mark's ink only fills ~2/3 of its
  // canvas height, so it renders small for its box. Operator corrections
  // 2026-06-10: 1.5rem -> 3rem -> 6rem ("double the logo size"), then the
  // "tiny, as always" pass -> 9rem.
  //
  // The asset is /static/logo-email.png — the canonical navy mark with the
  // cream backdrop BAKED INTO the pixels. Dark-mode email clients (Gmail
  // app, Outlook dark) recolor CSS/bgcolor backgrounds but never image
  // pixels, so a navy-on-transparent logo (like the DB org branding logo)
  // can vanish on a client-darkened card; the baked backdrop cannot be
  // hidden. Single-tenant Jess fork: the bundled asset IS the org mark.
  const logo = (
    <Img
      src={getAssetUrl('/static/logo-email.png')}
      alt={companyName}
      className="mb-5 h-36"
      style={{ height: '9rem', backgroundColor: JESS_COLORS.cream }}
    />
  );

  return (
    <Html>
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
      </Head>
      <Preview>{previewText}</Preview>

      <Body
        className="mx-auto my-auto bg-white font-sans"
        style={{ backgroundColor: JESS_COLORS.white }}
        {...({ bgcolor: JESS_COLORS.white } as object)}
      >
        <Section {...({ bgcolor: JESS_COLORS.white } as object)}>
          <Container
            className="mx-auto mt-8 mb-2 max-w-xl rounded-lg p-6"
            style={{
              backgroundColor: JESS_COLORS.cream,
              borderTop: `3px solid ${JESS_COLORS.gold}`,
            }}
            {...({ bgcolor: JESS_COLORS.cream } as object)}
          >
            <Section>
              {branding.brandingUrl ? <Link href={branding.brandingUrl}>{logo}</Link> : logo}

              {children}

              <TemplateJessSignature />
            </Section>
          </Container>

          {belowCard ? <Container className="mx-auto mt-6 max-w-xl">{belowCard}</Container> : null}

          {/* No footer: operator ruling 2026-06-10 — emails END just below Jess's
              photo+signature card. The stock rule + company-details block duplicated
              the signature card's contact info. */}
        </Section>
      </Body>
    </Html>
  );
};

export default TemplateEmailShell;
