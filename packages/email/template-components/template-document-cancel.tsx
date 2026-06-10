import { Trans } from '@lingui/react/macro';

import { Section, Text } from '../components';
import { JESS_COLORS, JESS_SERIF, displayDocumentName } from '../jess-brand';
import { TemplateStatusBadge } from './template-status-badge';

export interface TemplateDocumentCancelProps {
  inviterName: string;
  inviterEmail: string;
  documentName: string;
  assetBaseUrl: string;
  cancellationReason?: string;
}

export const TemplateDocumentCancel = ({
  inviterName,
  documentName,
  cancellationReason,
}: TemplateDocumentCancelProps) => {
  const docDisplayName = displayDocumentName(documentName);

  return (
    <Section className="mt-2">
      <TemplateStatusBadge label="Cancelled" tone="muted" className="mb-4" />

      <Text
        className="mx-auto mb-0 max-w-[90%] text-center font-semibold text-[22px] leading-snug"
        style={{ color: JESS_COLORS.navy, fontFamily: JESS_SERIF }}
      >
        <Trans>
          “{docDisplayName}”
          <br />
          was cancelled
        </Trans>
      </Text>

      <Text
        className="mx-auto mt-4 mb-4 max-w-[85%] text-center text-base leading-relaxed"
        style={{ color: JESS_COLORS.muted }}
      >
        <Trans>
          I've cancelled this document — all signatures are void and there's nothing you need to
          do.
        </Trans>
      </Text>

      {cancellationReason && (
        <Section
          className="mx-auto mt-2 mb-4 max-w-[85%] rounded-lg bg-white p-4"
          {...({ bgcolor: '#FFFFFF' } as object)}
        >
          <Text className="my-0 text-sm font-semibold" style={{ color: JESS_COLORS.muted }}>
            <Trans>Reason</Trans>
          </Text>
          <Text className="mt-1 mb-0 text-base leading-relaxed" style={{ color: JESS_COLORS.navy }}>
            “{cancellationReason}”
          </Text>
        </Section>
      )}
    </Section>
  );
};

export default TemplateDocumentCancel;
