import { Trans } from '@lingui/react/macro';

import { Button, Column, Row, Section, Text } from '../components';
import { JESS_COLORS, JESS_SERIF, displayDocumentName } from '../jess-brand';
import { TemplateCustomMessageBody } from './template-custom-message-body';

export interface TemplateDocumentCompletedProps {
  downloadLink: string;
  documentName: string;
  assetBaseUrl: string;
  customBody?: string;
  hasAttachments?: boolean;
}

export const TemplateDocumentCompleted = ({
  downloadLink,
  documentName,
  customBody,
  hasAttachments,
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
        <Trans>all signed</Trans>
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
            <Trans>everyone's in — your signed copy is attached to this email.</Trans>
          ) : (
            <Trans>everyone's in — your final copy is ready below.</Trans>
          )}
        </Text>
      )}

      <Section className="mt-8 mb-4 text-center">
        <Button
          className="inline-flex items-center justify-center rounded-lg px-8 py-3.5 text-center font-semibold text-base no-underline"
          style={{ backgroundColor: JESS_COLORS.gold, color: JESS_COLORS.navy }}
          href={downloadLink}
        >
          <Trans>download your copy</Trans>
        </Button>
      </Section>
    </Section>
  );
};

export default TemplateDocumentCompleted;
