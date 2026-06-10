import { mailer } from '@documenso/email/mailer';
import DocumentInviteEmailTemplate from '@documenso/email/templates/document-invite';
import { isRecipientEmailValidForSending } from '@documenso/lib/utils/recipients';
import { prisma } from '@documenso/prisma';
import { msg } from '@lingui/core/macro';
import {
  DocumentSource,
  DocumentStatus,
  EnvelopeType,
  OrganisationType,
  RecipientRole,
  SendStatus,
} from '@prisma/client';
import { createElement } from 'react';

import { getI18nInstance } from '../../../client-only/providers/i18n-server';
import { NEXT_PUBLIC_WEBAPP_URL } from '../../../constants/app';
import { RECIPIENT_ROLE_TO_EMAIL_TYPE, RECIPIENT_ROLES_DESCRIPTION } from '../../../constants/recipient-roles';
import {
  EMAIL_DOCUMENT_THUMBNAIL_CID,
  emailDocumentThumbnailAttachment,
  getEmailDocumentThumbnail,
  isEmailThumbnailAllowedForRecipient,
} from '../../../server-only/document/get-email-document-thumbnail';
import { getEmailContext } from '../../../server-only/email/get-email-context';
import { updateRecipientNextReminder } from '../../../server-only/recipient/update-recipient-next-reminder';
import { DOCUMENT_AUDIT_LOG_TYPE } from '../../../types/document-audit-logs';
import { extractDerivedDocumentEmailSettings } from '../../../types/document-email';
import { createDocumentAuditLogData } from '../../../utils/document-audit-logs';
import { unsafeBuildEnvelopeIdQuery } from '../../../utils/envelope';
import { renderCustomEmailTemplate } from '../../../utils/render-custom-email-template';
import { renderEmailWithI18N } from '../../../utils/render-email-with-i18n';
import type { JobRunIO } from '../../client/_internal/job';
import type { TSendSigningEmailJobDefinition } from './send-signing-email';

export const run = async ({ payload, io }: { payload: TSendSigningEmailJobDefinition; io: JobRunIO }) => {
  const { userId, documentId, recipientId, requestMetadata } = payload;

  const [user, envelope, recipient] = await Promise.all([
    prisma.user.findFirstOrThrow({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    }),
    prisma.envelope.findFirstOrThrow({
      where: {
        ...unsafeBuildEnvelopeIdQuery(
          {
            type: 'documentId',
            id: documentId,
          },
          EnvelopeType.DOCUMENT,
        ),
        status: DocumentStatus.PENDING,
      },
      include: {
        documentMeta: true,
        envelopeItems: {
          include: {
            documentData: true,
          },
          orderBy: {
            order: 'asc',
          },
          take: 1,
        },
        team: {
          select: {
            teamEmail: true,
            name: true,
          },
        },
      },
    }),
    prisma.recipient.findFirstOrThrow({
      where: {
        id: recipientId,
      },
    }),
  ]);

  const { documentMeta, team } = envelope;

  if (recipient.role === RecipientRole.CC) {
    return;
  }

  const isRecipientSigningRequestEmailEnabled = extractDerivedDocumentEmailSettings(
    envelope.documentMeta,
  ).recipientSigningRequest;

  if (!isRecipientSigningRequestEmailEnabled) {
    return;
  }

  const { branding, emailLanguage, settings, organisationType, senderEmail, replyToEmail } = await getEmailContext({
    emailType: 'RECIPIENT',
    source: {
      type: 'team',
      teamId: envelope.teamId,
    },
    meta: envelope.documentMeta,
  });

  const customEmail = envelope?.documentMeta;
  const isDirectTemplate = envelope.source === DocumentSource.TEMPLATE_DIRECT_LINK;

  const recipientEmailType = RECIPIENT_ROLE_TO_EMAIL_TYPE[recipient.role];

  const { email, name } = recipient;
  const selfSigner = email === user.email;

  const i18n = await getI18nInstance(emailLanguage);

  const recipientActionVerb = i18n._(RECIPIENT_ROLES_DESCRIPTION[recipient.role].actionVerb).toLowerCase();

  // Jess fork: fallback strings rewritten in house voice. The tokens are passed
  // as interpolations (literal braces are invalid ICU syntax) and substituted
  // per-recipient via renderCustomEmailTemplate.
  const documentNameVar = '{document.name}';
  const signerNameVar = '{signer.name}';

  let emailMessage = customEmail?.message || '';
  let emailSubject = i18n._(msg`${documentNameVar} is ready for you to ${recipientActionVerb}`);

  if (selfSigner) {
    emailMessage = i18n._(
      msg`your document "${documentNameVar}" is ready — it just needs you to ${recipientActionVerb} it.`,
    );
    emailSubject = i18n._(msg`your document is ready to ${recipientActionVerb}`);
  }

  if (isDirectTemplate) {
    emailMessage = i18n._(
      msg`a document was created from your direct template and needs you to ${recipientActionVerb} it.`,
    );
    emailSubject = i18n._(msg`${documentNameVar} — created from your direct template`);
  }

  if (organisationType === OrganisationType.ORGANISATION) {
    emailSubject = i18n._(msg`${team.name} sent you "${documentNameVar}" to ${recipientActionVerb}`);
    emailMessage = customEmail?.message ?? '';

    if (!emailMessage) {
      const inviterName = user.name || '';

      emailMessage = i18n._(
        msg`hi ${signerNameVar} — ${inviterName} sent over "${documentNameVar}" for you to ${recipientActionVerb}. it takes about a minute, and you can reply to this email with any questions. — ${inviterName}`,
      );
    }
  }

  const customEmailTemplate = {
    'signer.name': name,
    'signer.email': email,
    'document.name': envelope.title,
  };

  const assetBaseUrl = NEXT_PUBLIC_WEBAPP_URL() || 'http://localhost:3000';
  const signDocumentLink = `${NEXT_PUBLIC_WEBAPP_URL()}/sign/${recipient.token}`;

  // Jess fork: page-1 preview of the actual document as the email hero.
  // Gated per recipient — never rendered when access auth is required.
  const documentThumbnail =
    isRecipientEmailValidForSending(recipient) && isEmailThumbnailAllowedForRecipient({ envelope, recipient })
      ? await getEmailDocumentThumbnail({ envelope })
      : null;

  const template = createElement(DocumentInviteEmailTemplate, {
    documentName: envelope.title,
    inviterName: user.name || undefined,
    inviterEmail:
      organisationType === OrganisationType.ORGANISATION ? team?.teamEmail?.email || user.email : user.email,
    assetBaseUrl,
    signDocumentLink,
    customBody: renderCustomEmailTemplate(emailMessage, customEmailTemplate),
    role: recipient.role,
    selfSigner,
    organisationType,
    teamName: team?.name,
    teamEmail: team?.teamEmail?.email,
    includeSenderDetails: settings.includeSenderDetails,
    documentThumbnailSrc: documentThumbnail ? `cid:${EMAIL_DOCUMENT_THUMBNAIL_CID}` : undefined,
  });

  if (isRecipientEmailValidForSending(recipient)) {
    await io.runTask('send-signing-email', async () => {
      const [html, text] = await Promise.all([
        renderEmailWithI18N(template, { lang: emailLanguage, branding }),
        renderEmailWithI18N(template, {
          lang: emailLanguage,
          branding,
          plainText: true,
        }),
      ]);

      await mailer.sendMail({
        to: {
          name: recipient.name,
          address: recipient.email,
        },
        from: senderEmail,
        replyTo: replyToEmail,
        subject: renderCustomEmailTemplate(documentMeta?.subject || emailSubject, customEmailTemplate),
        html,
        text,
        attachments: documentThumbnail ? [emailDocumentThumbnailAttachment(documentThumbnail)] : undefined,
      });
    });
  }

  const sentAt = new Date();

  await io.runTask('update-recipient', async () => {
    await prisma.recipient.update({
      where: {
        id: recipient.id,
      },
      data: {
        sendStatus: SendStatus.SENT,
        sentAt,
      },
    });
  });

  // Compute the first reminder time based on the envelope's effective settings.
  await updateRecipientNextReminder({
    recipientId: recipient.id,
    envelopeId: envelope.id,
    sentAt,
    lastReminderSentAt: null,
  });

  await prisma.documentAuditLog.create({
    data: createDocumentAuditLogData({
      type: DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT,
      envelopeId: envelope.id,
      user,
      requestMetadata,
      data: {
        emailType: recipientEmailType,
        recipientId: recipient.id,
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        recipientRole: recipient.role,
        isResending: false,
      },
    }),
  });
};
