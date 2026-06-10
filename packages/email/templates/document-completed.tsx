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
  signers,
}: DocumentCompletedEmailTemplateProps) => {
  const { _ } = useLingui();

  // Count-aware preview: singular copy for single-signer envelopes.
  const previewText =
    signers && signers.length === 1
      ? msg`Signed — ${documentName} is complete, your copy is ready`
      : msg`All signed — ${documentName} is complete, your copy is ready`;

  return (
    <TemplateEmailShell previewText={_(previewText)} assetBaseUrl={assetBaseUrl}>
      <TemplateDocumentCompleted
        downloadLink={downloadLink}
        documentName={documentName}
        assetBaseUrl={assetBaseUrl}
        customBody={customBody}
        hasAttachments={hasAttachments}
        signers={signers}
      />
    </TemplateEmailShell>
  );
};

export default DocumentCompletedEmailTemplate;
