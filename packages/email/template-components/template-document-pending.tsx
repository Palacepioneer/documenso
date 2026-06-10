import { Trans } from '@lingui/react/macro';

import { Section, Text } from '../components';
import { JESS_COLORS, JESS_SERIF, displayDocumentName } from '../jess-brand';
import { TemplateStatusBadge } from './template-status-badge';

export interface TemplateDocumentPendingProps {
  documentName: string;
  assetBaseUrl: string;
}

export const TemplateDocumentPending = ({ documentName }: TemplateDocumentPendingProps) => {
  const docDisplayName = displayDocumentName(documentName);

  return (
    <Section className="mt-2">
      <TemplateStatusBadge label="waiting on others" tone="navy" className="mb-4" />

      <Text
        className="mx-auto mb-0 max-w-[90%] text-center font-semibold text-[22px] leading-snug"
        style={{ color: JESS_COLORS.navy, fontFamily: JESS_SERIF }}
      >
        <Trans>your signature's in</Trans>
      </Text>

      <Text
        className="mx-auto mt-4 mb-4 max-w-[85%] text-center text-base leading-relaxed"
        style={{ color: JESS_COLORS.muted }}
      >
        <Trans>
          your part of “{docDisplayName}” is done. we're waiting on the other signers — you'll get
          the final copy as soon as everyone has signed.
        </Trans>
      </Text>
    </Section>
  );
};

export default TemplateDocumentPending;
