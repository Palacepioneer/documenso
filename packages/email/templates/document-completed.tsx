import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';

import type { TemplateDocumentCompletedProps } from '../template-components/template-document-completed';
import { TemplateDocumentCompleted } from '../template-components/template-document-completed';
import { TemplateEmailShell } from '../template-components/template-email-shell';

export type DocumentCompletedEmailTemplateProps = Partial<TemplateDocumentCompletedProps> & {
  customBody?: string;
  hasAttachments?: boolean;
};

export const DocumentCompletedEmailTemplate = ({
  downloadLink = 'https://documenso.com',
  documentName = 'Open Source Pledge.pdf',
  assetBaseUrl = 'http://localhost:3002',
  customBody,
  hasAttachments,
}: DocumentCompletedEmailTemplateProps) => {
  const { _ } = useLingui();

  const previewText = msg`all signed — ${documentName} is complete, your copy is ready`;

  return (
    <TemplateEmailShell previewText={_(previewText)} assetBaseUrl={assetBaseUrl}>
      <TemplateDocumentCompleted
        downloadLink={downloadLink}
        documentName={documentName}
        assetBaseUrl={assetBaseUrl}
        customBody={customBody}
        hasAttachments={hasAttachments}
      />
    </TemplateEmailShell>
  );
};

export default DocumentCompletedEmailTemplate;
