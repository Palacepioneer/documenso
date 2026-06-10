import { Trans } from '@lingui/react/macro';

import { Button, Section, Text } from '../components';
import { JESS_COLORS, JESS_SERIF, displayDocumentName } from '../jess-brand';
import { TemplateCustomMessageBody } from './template-custom-message-body';
import { TemplateStatusBadge } from './template-status-badge';

export interface TemplateDocumentCompletedProps {
  downloadLink: string;
  documentName: string;
  assetBaseUrl: string;
  customBody?: string;
}

export const TemplateDocumentCompleted = ({
  downloadLink,
  documentName,
  customBody,
}: TemplateDocumentCompletedProps) => {
  const docDisplayName = displayDocumentName(documentName);

  return (
    <Section className="mt-2">
      <TemplateStatusBadge label="all signed" tone="gold" className="mb-4" />

      <Text
        className="mx-auto mb-0 max-w-[90%] text-center font-semibold text-[22px] leading-snug"
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
          <Trans>everyone's in — your final copy is ready below.</Trans>
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
