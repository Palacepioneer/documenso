import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';

import type { TemplateDocumentCancelProps } from '../template-components/template-document-cancel';
import { TemplateDocumentCancel } from '../template-components/template-document-cancel';
import { TemplateEmailShell } from '../template-components/template-email-shell';

export type DocumentCancelEmailTemplateProps = Partial<TemplateDocumentCancelProps>;

export const DocumentCancelTemplate = ({
  inviterName = 'Lucas Smith',
  inviterEmail = 'lucas@documenso.com',
  documentName = 'Open Source Pledge.pdf',
  assetBaseUrl = 'http://localhost:3002',
  cancellationReason,
}: DocumentCancelEmailTemplateProps) => {
  const { _ } = useLingui();

  const previewText = msg`${inviterName} cancelled ${documentName} — no signature needed anymore`;

  return (
    <TemplateEmailShell previewText={_(previewText)} assetBaseUrl={assetBaseUrl}>
      <TemplateDocumentCancel
        inviterName={inviterName}
        inviterEmail={inviterEmail}
        documentName={documentName}
        assetBaseUrl={assetBaseUrl}
        cancellationReason={cancellationReason}
      />
    </TemplateEmailShell>
  );
};

export default DocumentCancelTemplate;
