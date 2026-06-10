import { Trans } from '@lingui/react/macro';

import { Button, Section, Text } from '../components';
import { JESS_COLORS, JESS_SERIF, displayDocumentName } from '../jess-brand';
import { TemplateStatusBadge } from './template-status-badge';

export interface TemplateDocumentRecipientSignedProps {
  documentName: string;
  recipientName: string;
  recipientEmail: string;
  assetBaseUrl: string;
  documentLink?: string;
  signedCount?: number;
  totalCount?: number;
}

export const TemplateDocumentRecipientSigned = ({
  documentName,
  recipientName,
  recipientEmail,
  documentLink,
  signedCount,
  totalCount,
}: TemplateDocumentRecipientSignedProps) => {
  const showProgress = typeof signedCount === 'number' && typeof totalCount === 'number' && totalCount > 1;

  const recipientReference = recipientName || recipientEmail;

  const docDisplayName = displayDocumentName(documentName);

  return (
    <Section className="mt-2">
      <TemplateStatusBadge label="Signed" tone="gold" className="mb-4" />

      <Text
        className="mx-auto mb-0 max-w-[90%] text-center font-semibold text-[22px] leading-snug"
        style={{ color: JESS_COLORS.navy, fontFamily: JESS_SERIF }}
      >
        <Trans>
          {recipientReference} signed
          <br />“{docDisplayName}”
        </Trans>
      </Text>

      <Text className="mt-4 mb-0 text-center text-base" style={{ color: JESS_COLORS.muted }}>
        {showProgress ? (
          <Trans>
            That's {signedCount} of {totalCount} signatures in — you'll get the final copy when
            everyone's signed.
          </Trans>
        ) : (
          <Trans>Their part's done — you'll get the final copy once everyone has signed.</Trans>
        )}
      </Text>

      {documentLink && (
        <Section className="mt-8 mb-4 text-center">
          <Button
            className="inline-flex items-center justify-center rounded-lg border border-solid px-8 py-3 text-center font-semibold text-base no-underline"
            style={{
              borderColor: JESS_COLORS.navy,
              color: JESS_COLORS.navy,
              backgroundColor: 'transparent',
            }}
            href={documentLink}
          >
            <Trans>View the document</Trans>
          </Button>
        </Section>
      )}
    </Section>
  );
};

export default TemplateDocumentRecipientSigned;
