import { RECIPIENT_ROLES_DESCRIPTION } from '@documenso/lib/constants/recipient-roles';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { RecipientRole } from '@prisma/client';
import { match } from 'ts-pattern';

import { Button, Section, Text } from '../components';
import { JESS_COLORS, JESS_SERIF, displayDocumentName } from '../jess-brand';
import { TemplateCustomMessageBody } from './template-custom-message-body';
import { TemplateDocumentThumbnail } from './template-document-thumbnail';

export interface TemplateDocumentReminderProps {
  recipientName: string;
  documentName: string;
  signDocumentLink: string;
  assetBaseUrl: string;
  role: RecipientRole;
  customBody?: string;
  /** Page-1 preview of the actual document (inline CID image). */
  documentThumbnailSrc?: string;
}

export const TemplateDocumentReminder = ({
  recipientName,
  documentName,
  signDocumentLink,
  role,
  customBody,
  documentThumbnailSrc,
}: TemplateDocumentReminderProps) => {
  const { _ } = useLingui();

  const docDisplayName = displayDocumentName(documentName);

  return (
    <Section className="mt-2">
      <Text
        className="mx-auto mb-0 max-w-[90%] text-center font-semibold text-[22px] leading-snug"
        style={{ color: JESS_COLORS.navy, fontFamily: JESS_SERIF }}
      >
        <Trans>
          “{docDisplayName}”
          <br />
          is still waiting for you
        </Trans>
      </Text>

      <Text className="mt-4 mb-0 text-center text-base" style={{ color: JESS_COLORS.muted }}>
        {match(role)
          .with(RecipientRole.SIGNER, () => (
            <Trans>hi {recipientName} — just a nudge, signing takes about a minute.</Trans>
          ))
          .with(RecipientRole.VIEWER, () => (
            <Trans>hi {recipientName} — just a nudge, it's a quick read.</Trans>
          ))
          .with(RecipientRole.APPROVER, () => (
            <Trans>hi {recipientName} — just a nudge, your approval is the last step.</Trans>
          ))
          .with(RecipientRole.CC, () => '')
          .with(RecipientRole.ASSISTANT, () => (
            <Trans>hi {recipientName} — just a nudge, they're waiting on your help.</Trans>
          ))
          .exhaustive()}
      </Text>

      {customBody && (
        <Section className="mx-auto mt-6 max-w-[85%]">
          <TemplateCustomMessageBody text={customBody} />
        </Section>
      )}

      {documentThumbnailSrc && (
        <TemplateDocumentThumbnail src={documentThumbnailSrc} alt={docDisplayName} href={signDocumentLink} />
      )}

      <Section className="mt-8 mb-4 text-center">
        <Button
          className="inline-flex items-center justify-center rounded-lg px-8 py-3.5 text-center font-semibold text-base no-underline"
          style={{ backgroundColor: JESS_COLORS.gold, color: JESS_COLORS.navy }}
          href={signDocumentLink}
        >
          {match(role)
            .with(RecipientRole.SIGNER, () => <Trans>pick up where you left off</Trans>)
            .with(RecipientRole.VIEWER, () => <Trans>view the document</Trans>)
            .with(RecipientRole.APPROVER, () => <Trans>review &amp; approve</Trans>)
            .with(RecipientRole.CC, () => '')
            .with(RecipientRole.ASSISTANT, () => <Trans>open &amp; assist</Trans>)
            .exhaustive()}
        </Button>
      </Section>

      {!customBody && (
        <Text className="mt-0 mb-2 text-center text-sm" style={{ color: JESS_COLORS.muted }}>
          <Trans>questions? just reply to this email.</Trans>
        </Text>
      )}
    </Section>
  );
};

export default TemplateDocumentReminder;
