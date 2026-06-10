import { RECIPIENT_ROLES_DESCRIPTION } from '@documenso/lib/constants/recipient-roles';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { RecipientRole } from '@prisma/client';

import { TemplateDocumentReminder } from '../template-components/template-document-reminder';
import { TemplateEmailShell } from '../template-components/template-email-shell';

export type DocumentReminderEmailTemplateProps = {
  recipientName: string;
  documentName: string;
  signDocumentLink: string;
  assetBaseUrl?: string;
  customBody?: string;
  role: RecipientRole;
};

export const DocumentReminderEmailTemplate = ({
  recipientName = 'John Doe',
  documentName = 'Open Source Pledge.pdf',
  signDocumentLink = 'https://documenso.com',
  assetBaseUrl = 'http://localhost:3002',
  customBody,
  role = RecipientRole.SIGNER,
}: DocumentReminderEmailTemplateProps) => {
  const { _ } = useLingui();

  const action = _(RECIPIENT_ROLES_DESCRIPTION[role].actionVerb).toLowerCase();

  const previewText = msg`a quick nudge — ${documentName} is waiting for you to ${action}`;

  return (
    <TemplateEmailShell previewText={_(previewText)} assetBaseUrl={assetBaseUrl}>
      <TemplateDocumentReminder
        recipientName={recipientName}
        documentName={documentName}
        signDocumentLink={signDocumentLink}
        assetBaseUrl={assetBaseUrl}
        role={role}
        customBody={customBody}
      />
    </TemplateEmailShell>
  );
};

export default DocumentReminderEmailTemplate;
