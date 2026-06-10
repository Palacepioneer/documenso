import { Trans } from '@lingui/react/macro';

import { Button, Column, Img, Row, Section, Text } from '../components';
import { JESS_COLORS, JESS_SERIF, displayDocumentName } from '../jess-brand';
import { TemplateCustomMessageBody } from './template-custom-message-body';

export interface TemplateDocumentCompletedSigner {
  name: string;
  email: string;
  /** Drawn signature (HMAC-signed https URL in real sends, data URI in previews). */
  signatureImageSrc?: string;
  /** Typed signature, rendered as text. */
  typedSignature?: string;
}

export interface TemplateDocumentCompletedProps {
  downloadLink: string;
  documentName: string;
  assetBaseUrl: string;
  customBody?: string;
  hasAttachments?: boolean;
  signers?: TemplateDocumentCompletedSigner[];
}

export const TemplateDocumentCompleted = ({
  downloadLink,
  documentName,
  customBody,
  hasAttachments,
  signers,
}: TemplateDocumentCompletedProps) => {
  const docDisplayName = displayDocumentName(documentName);

  return (
    <Section className="mt-2">
      {/* Gold completion seal — pure HTML so it survives image blocking. */}
      <Section className="mb-3">
        <Row>
          <Column align="center">
            <table cellPadding={0} cellSpacing={0} role="presentation">
              <tbody>
                <tr>
                  <td
                    align="center"
                    {...({ bgcolor: JESS_COLORS.gold } as object)}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: JESS_COLORS.gold,
                      color: JESS_COLORS.navy,
                      fontSize: '26px',
                      fontWeight: 700,
                      fontFamily: JESS_SERIF,
                      lineHeight: '56px',
                      textAlign: 'center',
                    }}
                  >
                    ✓
                  </td>
                </tr>
              </tbody>
            </table>
          </Column>
        </Row>
      </Section>

      <Text
        className="my-0 text-center font-semibold text-xs tracking-[0.12em]"
        style={{ color: JESS_COLORS.goldDark, textTransform: 'uppercase' }}
      >
        <Trans>All signed</Trans>
      </Text>

      <Text
        className="mx-auto mt-2 mb-0 max-w-[90%] text-center font-semibold text-[22px] leading-snug"
        style={{ color: JESS_COLORS.navy, fontFamily: JESS_SERIF }}
      >
        <Trans>
          “{docDisplayName}”
          <br />
          is fully signed
        </Trans>
      </Text>

      {customBody ? (
        <Section className="mx-auto mt-6 max-w-[85%]">
          <TemplateCustomMessageBody text={customBody} />
        </Section>
      ) : (
        <Text className="mt-4 mb-0 text-center text-base" style={{ color: JESS_COLORS.muted }}>
          {hasAttachments ? (
            <Trans>All signed — your copy's attached. — Jess</Trans>
          ) : (
            <Trans>All signed — your final copy is ready below. — Jess</Trans>
          )}
        </Text>
      )}

      {signers && signers.length > 0 && (
        <Section className="mx-auto mt-7 max-w-[85%]">
          <Text
            className="my-0 text-center font-semibold text-xs tracking-[0.12em]"
            style={{ color: JESS_COLORS.goldDark, textTransform: 'uppercase' }}
          >
            <Trans>Signed by</Trans>
          </Text>

          {signers.map((signer, index) => (
            <Section
              key={index}
              className="mt-2 rounded-md px-4 py-3 text-center"
              style={{ backgroundColor: JESS_COLORS.white, border: '1px solid #E5E0D5' }}
              {...({ bgcolor: JESS_COLORS.white } as object)}
            >
              {signer.signatureImageSrc ? (
                <Img
                  src={signer.signatureImageSrc}
                  alt={`${signer.name} — signature`}
                  height={40}
                  className="mx-auto"
                  style={{ height: '40px', maxWidth: '70%' }}
                />
              ) : signer.typedSignature ? (
                <Text
                  className="my-0 text-center text-[20px] leading-snug"
                  style={{ color: JESS_COLORS.navy, fontFamily: JESS_SERIF, fontStyle: 'italic' }}
                >
                  {signer.typedSignature}
                </Text>
              ) : null}

              <Text className="mt-1 mb-0 text-center text-xs" style={{ color: JESS_COLORS.muted }}>
                {signer.name ? `${signer.name} · ${signer.email}` : signer.email}
              </Text>
            </Section>
          ))}
        </Section>
      )}

      <Section className="mt-8 mb-4 text-center">
        <Button
          className="inline-flex items-center justify-center rounded-lg px-8 py-3.5 text-center font-semibold text-base no-underline"
          style={{ backgroundColor: JESS_COLORS.gold, color: JESS_COLORS.navy }}
          href={downloadLink}
        >
          <Trans>Download your copy</Trans>
        </Button>
      </Section>
    </Section>
  );
};

export default TemplateDocumentCompleted;
