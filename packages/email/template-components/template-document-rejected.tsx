import { Trans } from '@lingui/react/macro';

import { Button, Section, Text } from '../components';
import { JESS_COLORS, JESS_SERIF, displayDocumentName } from '../jess-brand';
import { TemplateStatusBadge } from './template-status-badge';

export interface TemplateDocumentRejectedProps {
  documentName: string;
  recipientName: string;
  rejectionReason?: string;
  documentUrl: string;
}

export function TemplateDocumentRejected({
  documentName,
  recipientName: signerName,
  rejectionReason,
  documentUrl,
}: TemplateDocumentRejectedProps) {
  const docDisplayName = displayDocumentName(documentName);

  return (
    <Section className="mt-2">
      <TemplateStatusBadge label="Declined" tone="terracotta" className="mb-4" />

      <Text
        className="mx-auto mb-0 max-w-[90%] text-center font-semibold text-[22px] leading-snug"
        style={{ color: JESS_COLORS.navy, fontFamily: JESS_SERIF }}
      >
        <Trans>
          {signerName} declined
          <br />“{docDisplayName}”
        </Trans>
      </Text>

      {rejectionReason && (
        <Section
          className="mx-auto mt-6 max-w-[85%] rounded-lg bg-white p-4"
          {...({ bgcolor: '#FFFFFF' } as object)}
        >
          <Text className="my-0 text-sm font-semibold" style={{ color: JESS_COLORS.muted }}>
            <Trans>Their reason</Trans>
          </Text>
          <Text className="mt-1 mb-0 text-base leading-relaxed" style={{ color: JESS_COLORS.navy }}>
            “{rejectionReason}”
          </Text>
        </Section>
      )}

      <Text className="mt-6 mb-0 text-center text-base" style={{ color: JESS_COLORS.muted }}>
        <Trans>You can reply to them directly, or open the document to adjust and resend.</Trans>
      </Text>

      <Section className="mt-8 mb-4 text-center">
        <Button
          className="inline-flex items-center justify-center rounded-lg px-8 py-3.5 text-center font-semibold text-base no-underline"
          style={{ backgroundColor: JESS_COLORS.gold, color: JESS_COLORS.navy }}
          href={documentUrl}
        >
          <Trans>View the document</Trans>
        </Button>
      </Section>
    </Section>
  );
}

export default TemplateDocumentRejected;
