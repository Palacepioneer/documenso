import { Column, Img, Link, Row, Section, Text } from '../components';
import { JESS_COLORS } from '../jess-brand';

/**
 * Jess's personal email signature block — photo, gold bar, name, email, phone.
 *
 * Markup mirrors the canonical block in the locked house template
 * (/home/ceo/templates/jess-email-template.html, itself a mirror of
 * jess-email-pro/signature-avi.html): 56x69 rounded photo, 2px gold left
 * border, name / company / email / cell / site. The photo is referenced as a
 * hosted https URL (same asset the live jess-email pipeline uses) because
 * Gmail strips data URIs and CID attachments are unreliable through Resend.
 */
export const TemplateJessSignature = () => {
  return (
    <Section className="mt-6">
      <Row>
        <Column style={{ width: '70px', paddingRight: '14px', verticalAlign: 'middle' }}>
          <Img
            src="https://mcguiremgmt.com/assets/jess/jess-sig-80.png"
            width={56}
            height={69}
            alt="Jess"
            style={{ display: 'block', borderRadius: '8px' }}
          />
        </Column>

        <Column
          style={{
            borderLeft: `2px solid ${JESS_COLORS.gold}`,
            paddingLeft: '14px',
            verticalAlign: 'middle',
          }}
        >
          <Text
            className="my-0 font-bold text-[15px] leading-[1.22]"
            style={{ color: JESS_COLORS.navy, letterSpacing: '-0.01em' }}
          >
            Jess
          </Text>
          <Text className="my-0 pt-0.5 text-xs leading-normal" style={{ color: JESS_COLORS.muted }}>
            Jess Intelligence, Inc.
          </Text>
          <Text className="my-0 text-xs leading-normal">
            <Link href="mailto:jess@jessintelligence.com" style={{ color: JESS_COLORS.muted, textDecoration: 'none' }}>
              jess@jessintelligence.com
            </Link>
          </Text>
          <Text className="my-0 text-xs leading-normal" style={{ color: JESS_COLORS.muted }}>
            cell{' '}
            <Link href="tel:+17276425370" style={{ color: JESS_COLORS.muted, textDecoration: 'none' }}>
              (727) 642-5370
            </Link>
          </Text>
          <Text className="my-0 pt-0.5 text-xs leading-normal">
            <Link href="https://jessintelligence.com" style={{ color: JESS_COLORS.goldDark, textDecoration: 'none' }}>
              jessintelligence.com
            </Link>
          </Text>
        </Column>
      </Row>
    </Section>
  );
};

export default TemplateJessSignature;
