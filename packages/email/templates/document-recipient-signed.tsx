import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';

import { TemplateDocumentRecipientSigned } from '../template-components/template-document-recipient-signed';
import { TemplateEmailShell } from '../template-components/template-email-shell';

export interface DocumentRecipientSignedEmailTemplateProps {
  documentName?: string;
  recipientName?: string;
  recipientEmail?: string;
  assetBaseUrl?: string;
  documentLink?: string;
  signedCount?: number;
  totalCount?: number;
}

export const DocumentRecipientSignedEmailTemplate = ({
  documentName = 'Open Source Pledge.pdf',
  recipientName = 'John Doe',
  recipientEmail = 'lucas@documenso.com',
  assetBaseUrl = 'http://localhost:3002',
  documentLink,
  signedCount,
  totalCount,
}: DocumentRecipientSignedEmailTemplateProps) => {
  const { _ } = useLingui();

  const recipientReference = recipientName || recipientEmail;

  const previewText = msg`${recipientReference} signed ${documentName}`;

  return (
    <TemplateEmailShell previewText={_(previewText)} assetBaseUrl={assetBaseUrl}>
      <TemplateDocumentRecipientSigned
        documentName={documentName}
        recipientName={recipientName}
        recipientEmail={recipientEmail}
        assetBaseUrl={assetBaseUrl}
        documentLink={documentLink}
        signedCount={signedCount}
        totalCount={totalCount}
      />
    </TemplateEmailShell>
  );
};

export default DocumentRecipientSignedEmailTemplate;
