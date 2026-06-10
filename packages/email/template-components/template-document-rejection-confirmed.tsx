import { Trans } from '@lingui/react/macro';

import { Section, Text } from '../components';
import { JESS_COLORS, JESS_SERIF, displayDocumentName } from '../jess-brand';
import { TemplateStatusBadge } from './template-status-badge';

interface TemplateDocumentRejectionConfirmedProps {
  recipientName: string;
  documentName: string;
  documentOwnerName: string;
  reason?: string;
}

export function TemplateDocumentRejectionConfirmed({
  documentName,
  documentOwnerName,
  reason,
}: TemplateDocumentRejectionConfirmedProps) {
  const docDisplayName = displayDocumentName(documentName);

  return (
    <Section className="mt-2">
      <TemplateStatusBadge label="Declined" tone="terracotta" className="mb-4" />

      <Text
        className="mx-auto mb-0 max-w-[90%] text-center font-semibold text-[22px] leading-snug"
        style={{ color: JESS_COLORS.navy, fontFamily: JESS_SERIF }}
      >
        <Trans>
          You declined
          <br />“{docDisplayName}”
        </Trans>
      </Text>

      {reason && (
        <Section
          className="mx-auto mt-6 max-w-[85%] rounded-lg bg-white p-4"
          {...({ bgcolor: '#FFFFFF' } as object)}
        >
          <Text className="my-0 text-sm font-semibold" style={{ color: JESS_COLORS.muted }}>
            <Trans>Your reason</Trans>
          </Text>
          <Text className="mt-1 mb-0 text-base leading-relaxed" style={{ color: JESS_COLORS.navy }}>
            “{reason}”
          </Text>
        </Section>
      )}

      <Text
        className="mx-auto mt-6 mb-4 max-w-[85%] text-center text-base leading-relaxed"
        style={{ color: JESS_COLORS.muted }}
      >
        <Trans>
          I've been notified — nothing else is needed from you. If you change your mind or have
          questions, just reply to this email.
        </Trans>
      </Text>
    </Section>
  );
}

export default TemplateDocumentRejectionConfirmed;
