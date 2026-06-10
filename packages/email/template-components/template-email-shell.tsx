import { Body, Container, Head, Hr, Html, Img, Link, Preview, Section } from '../components';
import { JESS_COLORS } from '../jess-brand';
import { useBranding } from '../providers/branding';
import { TemplateFooter } from './template-footer';

export interface TemplateEmailShellProps {
  previewText: string;
  assetBaseUrl: string;
  children: React.ReactNode;
  /** Rendered between the card and the footer (e.g. a personal note for legacy layouts). */
  belowCard?: React.ReactNode;
}

/**
 * Shared outer structure for Jess Intelligence lifecycle emails:
 * white body -> cream card with a gold top rule -> linked logo -> content -> footer.
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

  const logo =
    branding.brandingEnabled && branding.brandingLogo ? (
      <Img src={branding.brandingLogo} alt={companyName} className="mb-5 h-6" />
    ) : (
      <Img src={getAssetUrl('/static/logo.png')} alt={companyName} className="mb-5 h-6" />
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
            </Section>
          </Container>

          {belowCard ? <Container className="mx-auto mt-6 max-w-xl">{belowCard}</Container> : null}

          <Hr className="mx-auto mt-10 max-w-xl" style={{ borderColor: '#E5E0D5' }} />

          <Container className="mx-auto max-w-xl">
            <TemplateFooter />
          </Container>
        </Section>
      </Body>
    </Html>
  );
};

export default TemplateEmailShell;
