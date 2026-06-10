import { mailer } from '@documenso/email/mailer';
import { DocumentCompletedEmailTemplate } from '@documenso/email/templates/document-completed';
import { prisma } from '@documenso/prisma';
import { msg } from '@lingui/core/macro';
import { DocumentSource, EnvelopeType, SigningStatus } from '@prisma/client';
import { createElement } from 'react';

import { getI18nInstance } from '../../client-only/providers/i18n-server';
import { NEXT_PUBLIC_WEBAPP_URL } from '../../constants/app';
import { DOCUMENT_AUDIT_LOG_TYPE } from '../../types/document-audit-logs';
import { extractDerivedDocumentEmailSettings } from '../../types/document-email';
import type { RequestMetadata } from '../../universal/extract-request-metadata';
import { getFileServerSide } from '../../universal/upload/get-file.server';
import { createDocumentAuditLogData } from '../../utils/document-audit-logs';
import type { EnvelopeIdOptions } from '../../utils/envelope';
import { unsafeBuildEnvelopeIdQuery } from '../../utils/envelope';
import { isRecipientEmailValidForSending } from '../../utils/recipients';
import { renderCustomEmailTemplate } from '../../utils/render-custom-email-template';
import { renderEmailWithI18N } from '../../utils/render-email-with-i18n';
import { formatDocumentsPath } from '../../utils/teams';
import { getEmailContext } from '../email/get-email-context';

export interface SendDocumentOptions {
  id: EnvelopeIdOptions;
  requestMetadata?: RequestMetadata;
}

export const sendCompletedEmail = async ({ id, requestMetadata }: SendDocumentOptions) => {
  const envelope = await prisma.envelope.findUnique({
    where: unsafeBuildEnvelopeIdQuery(id, EnvelopeType.DOCUMENT),
    include: {
      envelopeItems: {
        include: {
          documentData: {
            select: {
              type: true,
              id: true,
              data: true,
            },
          },
        },
      },
      documentMeta: true,
      recipients: {
        include: {
          fields: {
            include: {
              signature: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      team: {
        select: {
          id: true,
          url: true,
        },
      },
    },
  });

  if (!envelope) {
    throw new Error('Document not found');
  }

  const isDirectTemplate = envelope?.source === DocumentSource.TEMPLATE_DIRECT_LINK;

  if (envelope.recipients.length === 0) {
    throw new Error('Document has no recipients');
  }

  const { branding, emailLanguage, senderEmail, replyToEmail } = await getEmailContext({
    emailType: 'RECIPIENT',
    source: {
      type: 'team',
      teamId: envelope.teamId,
    },
    meta: envelope.documentMeta,
  });

  const { user: owner } = envelope;

  // Jess fork: attach the sealed PDFs with a size guard — inboxes bounce or
  // clip oversized mail, so anything pushing the email past ~7MB is skipped
  // and the recipient keeps the download CTA instead.
  const MAX_COMPLETED_EMAIL_ATTACHMENT_BYTES = 7 * 1024 * 1024;

  let completedDocumentEmailAttachments = await Promise.all(
    envelope.envelopeItems.map(async (envelopeItem) => {
      const file = await getFileServerSide(envelopeItem.documentData);

      // Use the envelope title for version 1, and the envelope item title for version 2.
      const fileNameToUse = envelope.internalVersion === 1 ? envelope.title : envelopeItem.title + '.pdf';

      return {
        filename: fileNameToUse.endsWith('.pdf') ? fileNameToUse : fileNameToUse + '.pdf',
        content: Buffer.from(file),
        contentType: 'application/pdf',
      };
    }),
  );

  completedDocumentEmailAttachments = completedDocumentEmailAttachments.filter(
    (attachment) => attachment.content.length <= MAX_COMPLETED_EMAIL_ATTACHMENT_BYTES,
  );

  const totalAttachmentBytes = completedDocumentEmailAttachments.reduce(
    (total, attachment) => total + attachment.content.length,
    0,
  );

  if (totalAttachmentBytes > MAX_COMPLETED_EMAIL_ATTACHMENT_BYTES) {
    completedDocumentEmailAttachments = [];
  }

  // Jess fork: "signed by" ceremony block — each signer's actual signature.
  // Drawn signatures travel as small inline CID images (Gmail strips data
  // URIs); typed signatures render as text in the template.
  const signatureCidFor = (recipientId: number) => `jess-signature-${recipientId}`;

  const dataUriToImage = (dataUri: string) => {
    const match = dataUri.match(/^data:(image\/[a-z+.-]+);base64,(.*)$/i);

    if (!match) {
      return null;
    }

    return { contentType: match[1], content: Buffer.from(match[2], 'base64') };
  };

  const documentSigners = envelope.recipients
    .filter((recipient) => recipient.signingStatus === SigningStatus.SIGNED)
    .flatMap((recipient) => {
      const signature = recipient.fields
        .map((field) => field.signature)
        .find((fieldSignature) => fieldSignature?.signatureImageAsBase64 || fieldSignature?.typedSignature);

      if (!signature) {
        return [];
      }

      const drawnImage = signature.signatureImageAsBase64 ? dataUriToImage(signature.signatureImageAsBase64) : null;

      return [
        {
          recipientId: recipient.id,
          name: recipient.name,
          email: recipient.email,
          drawnImage,
          typedSignature: signature.typedSignature ?? undefined,
        },
      ];
    });

  const signatureAttachments = documentSigners.flatMap((signer) =>
    signer.drawnImage
      ? [
          {
            filename: `signature-${signer.recipientId}.png`,
            content: signer.drawnImage.content,
            contentType: signer.drawnImage.contentType,
            cid: signatureCidFor(signer.recipientId),
            contentDisposition: 'inline' as const,
          },
        ]
      : [],
  );

  const completedEmailSigners = documentSigners.map((signer) => ({
    name: signer.name,
    email: signer.email,
    signatureImageSrc: signer.drawnImage ? `cid:${signatureCidFor(signer.recipientId)}` : undefined,
    typedSignature: signer.typedSignature,
  }));

  const completedEmailAttachments = [...completedDocumentEmailAttachments, ...signatureAttachments];

  const assetBaseUrl = NEXT_PUBLIC_WEBAPP_URL() || 'http://localhost:3000';

  let documentOwnerDownloadLink = `${NEXT_PUBLIC_WEBAPP_URL()}${formatDocumentsPath(
    envelope.team?.url,
  )}/${envelope.id}`;

  if (envelope.team?.url) {
    documentOwnerDownloadLink = `${NEXT_PUBLIC_WEBAPP_URL()}/t/${envelope.team.url}/documents/${envelope.id}`;
  }

  const emailSettings = extractDerivedDocumentEmailSettings(envelope.documentMeta);
  const isDocumentCompletedEmailEnabled = emailSettings.documentCompleted;
  const isOwnerDocumentCompletedEmailEnabled = emailSettings.ownerDocumentCompleted;

  // Send email to document owner if:
  // 1. Owner document completed emails are enabled AND
  // 2. Either:
  //    - The owner is not a recipient, OR
  //    - Recipient emails are disabled
  if (
    isOwnerDocumentCompletedEmailEnabled &&
    (!envelope.recipients.find((recipient) => recipient.email === owner.email) || !isDocumentCompletedEmailEnabled)
  ) {
    // Jess fork: meta.subject is honored for the owner's completed email too.
    const ownerEmailTemplate = {
      'signer.name': owner.name ?? '',
      'signer.email': owner.email,
      'document.name': envelope.title,
    };

    const template = createElement(DocumentCompletedEmailTemplate, {
      documentName: envelope.title,
      assetBaseUrl,
      downloadLink: documentOwnerDownloadLink,
      hasAttachments: completedDocumentEmailAttachments.length > 0,
      signers: completedEmailSigners,
    });

    const [html, text] = await Promise.all([
      renderEmailWithI18N(template, { lang: emailLanguage, branding }),
      renderEmailWithI18N(template, {
        lang: emailLanguage,
        branding,
        plainText: true,
      }),
    ]);

    const i18n = await getI18nInstance(emailLanguage);

    await mailer.sendMail({
      to: [
        {
          name: owner.name || '',
          address: owner.email,
        },
      ],
      from: senderEmail,
      replyTo: replyToEmail,
      subject: envelope.documentMeta?.subject
        ? renderCustomEmailTemplate(envelope.documentMeta.subject, ownerEmailTemplate)
        : i18n._(msg`all signed — "${envelope.title}" is complete`),
      html,
      text,
      attachments: completedEmailAttachments,
    });

    await prisma.documentAuditLog.create({
      data: createDocumentAuditLogData({
        type: DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT,
        envelopeId: envelope.id,
        user: null,
        requestMetadata,
        data: {
          emailType: 'DOCUMENT_COMPLETED',
          recipientEmail: owner.email,
          recipientName: owner.name ?? '',
          recipientId: owner.id,
          recipientRole: 'OWNER',
          isResending: false,
        },
      }),
    });
  }

  if (!isDocumentCompletedEmailEnabled) {
    return;
  }

  const recipientsToNotify = envelope.recipients.filter((recipient) => isRecipientEmailValidForSending(recipient));

  await Promise.all(
    recipientsToNotify.map(async (recipient) => {
      const customEmailTemplate = {
        'signer.name': recipient.name,
        'signer.email': recipient.email,
        'document.name': envelope.title,
      };

      const downloadLink = `${NEXT_PUBLIC_WEBAPP_URL()}/sign/${recipient.token}/complete`;

      const template = createElement(DocumentCompletedEmailTemplate, {
        documentName: envelope.title,
        assetBaseUrl,
        downloadLink: recipient.email === owner.email ? documentOwnerDownloadLink : downloadLink,
        hasAttachments: completedDocumentEmailAttachments.length > 0,
        signers: completedEmailSigners,
        customBody:
          isDirectTemplate && envelope.documentMeta?.message
            ? renderCustomEmailTemplate(envelope.documentMeta.message, customEmailTemplate)
            : undefined,
      });

      const [html, text] = await Promise.all([
        renderEmailWithI18N(template, { lang: emailLanguage, branding }),
        renderEmailWithI18N(template, {
          lang: emailLanguage,
          branding,
          plainText: true,
        }),
      ]);

      const i18n = await getI18nInstance(emailLanguage);

      await mailer.sendMail({
        to: [
          {
            name: recipient.name,
            address: recipient.email,
          },
        ],
        from: senderEmail,
        replyTo: replyToEmail,
        // Jess fork: meta.subject honored for every completed email (was
        // direct-template only, leaving recipients with "Signing Complete!").
        subject: envelope.documentMeta?.subject
          ? renderCustomEmailTemplate(envelope.documentMeta.subject, customEmailTemplate)
          : i18n._(msg`all signed — "${envelope.title}" is complete`),
        html,
        text,
        attachments: completedEmailAttachments,
      });

      await prisma.documentAuditLog.create({
        data: createDocumentAuditLogData({
          type: DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT,
          envelopeId: envelope.id,
          user: null,
          requestMetadata,
          data: {
            emailType: 'DOCUMENT_COMPLETED',
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            recipientId: recipient.id,
            recipientRole: recipient.role,
            isResending: false,
          },
        }),
      });
    }),
  );
};
