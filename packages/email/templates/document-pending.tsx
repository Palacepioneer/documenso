import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';

import type { TemplateDocumentPendingProps } from '../template-components/template-document-pending';
import { TemplateDocumentPending } from '../template-components/template-document-pending';
import { TemplateEmailShell } from '../template-components/template-email-shell';

export type DocumentPendingEmailTemplateProps = Partial<TemplateDocumentPendingProps>;

export const DocumentPendingEmailTemplate = ({
  documentName = 'Open Source Pledge.pdf',
  assetBaseUrl = 'http://localhost:3002',
  signedCount,
  totalCount,
}: DocumentPendingEmailTemplateProps) => {
  const { _ } = useLingui();

  const previewText = msg`your signature's in — waiting on the other signers of ${documentName}`;

  return (
    <TemplateEmailShell previewText={_(previewText)} assetBaseUrl={assetBaseUrl}>
      <TemplateDocumentPending
        documentName={documentName}
        assetBaseUrl={assetBaseUrl}
        signedCount={signedCount}
        totalCount={totalCount}
      />
    </TemplateEmailShell>
  );
};

export default DocumentPendingEmailTemplate;
