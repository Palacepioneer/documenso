import { RECIPIENT_ROLES_DESCRIPTION } from '@documenso/lib/constants/recipient-roles';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { OrganisationType, RecipientRole } from '@prisma/client';
import { match, P } from 'ts-pattern';

import { Button, Section, Text } from '../components';
import { JESS_COLORS, JESS_SERIF, displayDocumentName } from '../jess-brand';
import { TemplateCustomMessageBody } from './template-custom-message-body';

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
}

export const TemplateDocumentInvite = ({
  inviterName,
  documentName,
  signDocumentLink,
  role,
  selfSigner,
  teamName,
  includeSenderDetails,
  organisationType,
  customBody,
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
        {match({ selfSigner, organisationType, includeSenderDetails, teamName })
          .with({ selfSigner: true }, () => (
            <Trans>
              your document is ready to {action}
              <br />“{docDisplayName}”
            </Trans>
          ))
          .with(
            {
              organisationType: OrganisationType.ORGANISATION,
              includeSenderDetails: true,
              teamName: P.string,
            },
            () => (
              <Trans>
                {inviterName} at {teamName} sent you
                <br />“{docDisplayName}” to {action}
              </Trans>
            ),
          )
          .with({ organisationType: OrganisationType.ORGANISATION, teamName: P.string }, () => (
            <Trans>
              {teamName} sent you
              <br />“{docDisplayName}” to {action}
            </Trans>
          ))
          .otherwise(() => (
            <Trans>
              {inviterName} sent you
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
            .with(RecipientRole.SIGNER, () => <Trans>it takes about a minute — open it below.</Trans>)
            .with(RecipientRole.VIEWER, () => <Trans>a quick read — open it below.</Trans>)
            .with(RecipientRole.APPROVER, () => <Trans>your approval is the last step — open it below.</Trans>)
            .with(RecipientRole.CC, () => '')
            .with(RecipientRole.ASSISTANT, () => <Trans>you can fill it in for them — open it below.</Trans>)
            .exhaustive()}
        </Text>
      )}

      <Section className="mt-8 mb-4 text-center">
        <Button
          className="inline-flex items-center justify-center rounded-lg px-8 py-3.5 text-center font-semibold text-base no-underline"
          style={{ backgroundColor: JESS_COLORS.gold, color: JESS_COLORS.navy }}
          href={signDocumentLink}
        >
          {match(role)
            .with(RecipientRole.SIGNER, () => <Trans>review &amp; sign</Trans>)
            .with(RecipientRole.VIEWER, () => <Trans>view the document</Trans>)
            .with(RecipientRole.APPROVER, () => <Trans>review &amp; approve</Trans>)
            .with(RecipientRole.CC, () => '')
            .with(RecipientRole.ASSISTANT, () => <Trans>open &amp; assist</Trans>)
            .exhaustive()}
        </Button>
      </Section>
    </Section>
  );
};

export default TemplateDocumentInvite;
