import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';

import { TemplateDocumentRejected } from '../template-components/template-document-rejected';
import { TemplateEmailShell } from '../template-components/template-email-shell';

type DocumentRejectedEmailProps = {
  recipientName: string;
  documentName: string;
  documentUrl: string;
  rejectionReason: string;
  assetBaseUrl?: string;
};

export function DocumentRejectedEmail({
  recipientName,
  documentName,
  documentUrl,
  rejectionReason,
  assetBaseUrl = 'http://localhost:3002',
}: DocumentRejectedEmailProps) {
  const { _ } = useLingui();

  const previewText = _(msg`${recipientName} declined ${documentName} — their reason is inside`);

  return (
    <TemplateEmailShell previewText={previewText} assetBaseUrl={assetBaseUrl}>
      <TemplateDocumentRejected
        recipientName={recipientName}
        documentName={documentName}
        documentUrl={documentUrl}
        rejectionReason={rejectionReason}
      />
    </TemplateEmailShell>
  );
}

export default DocumentRejectedEmail;
