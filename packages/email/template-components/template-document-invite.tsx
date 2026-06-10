import { RECIPIENT_ROLES_DESCRIPTION } from '@documenso/lib/constants/recipient-roles';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import type { OrganisationType } from '@prisma/client';
import { RecipientRole } from '@prisma/client';
import { match } from 'ts-pattern';

import { Button, Section, Text } from '../components';
import { JESS_COLORS, JESS_SERIF, displayDocumentName } from '../jess-brand';
import { TemplateCustomMessageBody } from './template-custom-message-body';
import { TemplateDocumentThumbnail } from './template-document-thumbnail';

export interface TemplateDocumentInviteProps {
  inviterName: string;
  inviterEmail: string;
  documentName: string;
  signDocumentLink: string;
  assetBaseUrl: string;
  role: RecipientRole;
  selfSigner: boolean;
  teamName?: string;
  includeSenderDetails?: boolean;
  organisationType?: OrganisationType;
  customBody?: string;
  /** Page-1 preview of the actual document (inline CID image). */
  documentThumbnailSrc?: string;
}

// Jess fork: structural copy is hardcoded first-person — Jess speaks as "I",
// never about herself in third person (operator directive 2026-06-10).
export const TemplateDocumentInvite = ({
  documentName,
  signDocumentLink,
  role,
  selfSigner,
  customBody,
  documentThumbnailSrc,
}: TemplateDocumentInviteProps) => {
  const { _ } = useLingui();

  const { actionVerb } = RECIPIENT_ROLES_DESCRIPTION[role];
  const action = _(actionVerb).toLowerCase();

  const docDisplayName = displayDocumentName(documentName);

  return (
    <Section className="mt-2">
      <Text
        className="mx-auto mb-0 max-w-[90%] text-center font-semibold text-[22px] leading-snug"
        style={{ color: JESS_COLORS.navy, fontFamily: JESS_SERIF }}
      >
        {match({ selfSigner, role })
          .with({ selfSigner: true }, () => (
            <Trans>
              Your document is ready to {action}
              <br />“{docDisplayName}”
            </Trans>
          ))
          .with({ role: RecipientRole.SIGNER }, () => (
            <Trans>
              I need your signature on
              <br />“{docDisplayName}”
            </Trans>
          ))
          .with({ role: RecipientRole.APPROVER }, () => (
            <Trans>
              I need your approval on
              <br />“{docDisplayName}”
            </Trans>
          ))
          .with({ role: RecipientRole.VIEWER }, () => (
            <Trans>
              I'd like you to take a look at
              <br />“{docDisplayName}”
            </Trans>
          ))
          .with({ role: RecipientRole.ASSISTANT }, () => (
            <Trans>
              I need your help with
              <br />“{docDisplayName}”
            </Trans>
          ))
          .otherwise(() => (
            <Trans>
              I've sent you
              <br />“{docDisplayName}” to {action}
            </Trans>
          ))}
      </Text>

      {customBody ? (
        <Section className="mx-auto mt-6 max-w-[85%]">
          <TemplateCustomMessageBody text={customBody} />
        </Section>
      ) : (
        <Text className="mt-4 mb-0 text-center text-base" style={{ color: JESS_COLORS.muted }}>
          {match(role)
            .with(RecipientRole.SIGNER, () => <Trans>It takes about a minute — open it below.</Trans>)
            .with(RecipientRole.VIEWER, () => <Trans>A quick read — open it below.</Trans>)
            .with(RecipientRole.APPROVER, () => <Trans>Your approval is the last step — open it below.</Trans>)
            .with(RecipientRole.CC, () => '')
            .with(RecipientRole.ASSISTANT, () => <Trans>You can fill it in for them — open it below.</Trans>)
            .exhaustive()}
        </Text>
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
            .with(RecipientRole.SIGNER, () => <Trans>Review &amp; sign</Trans>)
            .with(RecipientRole.VIEWER, () => <Trans>View the document</Trans>)
            .with(RecipientRole.APPROVER, () => <Trans>Review &amp; approve</Trans>)
            .with(RecipientRole.CC, () => '')
            .with(RecipientRole.ASSISTANT, () => <Trans>Open &amp; assist</Trans>)
            .exhaustive()}
        </Button>
      </Section>

      {!customBody && (
        <Text className="mt-0 mb-2 text-center text-sm" style={{ color: JESS_COLORS.muted }}>
          <Trans>Questions? Just reply to this email.</Trans>
        </Text>
      )}
    </Section>
  );
};

export default TemplateDocumentInvite;
