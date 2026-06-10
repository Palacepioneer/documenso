import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';

import { TemplateDocumentRejectionConfirmed } from '../template-components/template-document-rejection-confirmed';
import { TemplateEmailShell } from '../template-components/template-email-shell';

export type DocumentRejectionConfirmedEmailProps = {
  recipientName: string;
  documentName: string;
  documentOwnerName: string;
  reason: string;
  assetBaseUrl?: string;
};

export function DocumentRejectionConfirmedEmail({
  recipientName,
  documentName,
  documentOwnerName,
  reason,
  assetBaseUrl = 'http://localhost:3002',
}: DocumentRejectionConfirmedEmailProps) {
  const { _ } = useLingui();

  const previewText = _(msg`you declined ${documentName} — ${documentOwnerName} has been notified`);

  return (
    <TemplateEmailShell previewText={previewText} assetBaseUrl={assetBaseUrl}>
      <TemplateDocumentRejectionConfirmed
        recipientName={recipientName}
        documentName={documentName}
        documentOwnerName={documentOwnerName}
        reason={reason}
      />
    </TemplateEmailShell>
  );
}

export default DocumentRejectionConfirmedEmail;
