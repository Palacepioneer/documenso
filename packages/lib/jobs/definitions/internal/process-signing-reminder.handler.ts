import { mailer } from '@documenso/email/mailer';
import DocumentReminderEmailTemplate from '@documenso/email/templates/document-reminder';
import { prisma } from '@documenso/prisma';
import { msg } from '@lingui/core/macro';
import {
  DocumentDistributionMethod,
  DocumentStatus,
  OrganisationType,
  RecipientRole,
  SendStatus,
  SigningStatus,
  WebhookTriggerEvents,
} from '@prisma/client';
import { createElement } from 'react';

import { getI18nInstance } from '../../../client-only/providers/i18n-server';
import { NEXT_PUBLIC_WEBAPP_URL } from '../../../constants/app';
import { RECIPIENT_ROLES_DESCRIPTION } from '../../../constants/recipient-roles';
import {
  EMAIL_DOCUMENT_THUMBNAIL_CID,
  emailDocumentThumbnailAttachment,
  getEmailDocumentThumbnail,
  isEmailThumbnailAllowedForRecipient,
} from '../../../server-only/document/get-email-document-thumbnail';
import { getEmailContext } from '../../../server-only/email/get-email-context';
import { updateRecipientNextReminder } from '../../../server-only/recipient/update-recipient-next-reminder';
import { triggerWebhook } from '../../../server-only/webhooks/trigger/trigger-webhook';
import { DOCUMENT_AUDIT_LOG_TYPE, DOCUMENT_EMAIL_TYPE } from '../../../types/document-audit-logs';
import { extractDerivedDocumentEmailSettings } from '../../../types/document-email';
import { mapEnvelopeToWebhookDocumentPayload, ZWebhookDocumentSchema } from '../../../types/webhook-payload';
import { createDocumentAuditLogData } from '../../../utils/document-audit-logs';
import { renderCustomEmailTemplate } from '../../../utils/render-custom-email-template';
import { renderEmailWithI18N } from '../../../utils/render-email-with-i18n';
import type { JobRunIO } from '../../client/_internal/job';
import type { TProcessSigningReminderJobDefinition } from './process-signing-reminder';

export const run = async ({ payload, io }: { payload: TProcessSigningReminderJobDefinition; io: JobRunIO }) => {
  const { recipientId } = payload;
  const now = new Date();

  // Atomically claim this reminder by setting lastReminderSentAt and clearing
  // nextReminderAt so no other sweep picks it up. The expiration filter
  // guards against races where the expiration sweep hasn't yet flagged
  // a recipient whose deadline has already passed.
  const updatedCount = await prisma.recipient.updateMany({
    where: {
      id: recipientId,
      signingStatus: SigningStatus.NOT_SIGNED,
      sendStatus: SendStatus.SENT,
      role: { not: RecipientRole.CC },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      envelope: {
        status: DocumentStatus.PENDING,
        deletedAt: null,
      },
    },
    data: {
      lastReminderSentAt: now,
      nextReminderAt: null,
    },
  });

  if (updatedCount.count === 0) {
    io.logger.info(`Recipient ${recipientId} no longer eligible for reminder, skipping`);
    return;
  }

  const recipient = await prisma.recipient.findFirst({
    where: { id: recipientId },
    include: {
      envelope: {
        include: {
          documentMeta: true,
          user: true,
          recipients: true,
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
              name: true,
            },
          },
        },
      },
    },
  });

  if (!recipient) {
    io.logger.warn(`Recipient ${recipientId} not found`);
    return;
  }

  const { envelope } = recipient;

  if (!envelope.documentMeta) {
    io.logger.warn(`Envelope ${envelope.id} missing documentMeta`);
    return;
  }

  // Skip if distribution method is NONE (manual link sharing, no emails).
  if (envelope.documentMeta.distributionMethod === DocumentDistributionMethod.NONE) {
    io.logger.info(`Envelope ${envelope.id} uses manual distribution, skipping email reminder`);
    return;
  }

  if (!extractDerivedDocumentEmailSettings(envelope.documentMeta).recipientSigningRequest) {
    io.logger.info(`Envelope ${envelope.id} has email signing requests disabled, skipping`);
    return;
  }

  const { branding, emailLanguage, organisationType, senderEmail, replyToEmail } = await getEmailContext({
    emailType: 'RECIPIENT',
    source: {
      type: 'team',
      teamId: envelope.teamId,
    },
    meta: envelope.documentMeta,
  });

  const i18n = await getI18nInstance(emailLanguage);

  const recipientActionVerb = i18n._(RECIPIENT_ROLES_DESCRIPTION[recipient.role].actionVerb).toLowerCase();

  // Jess fork: fallback subjects in house voice.
  let emailSubject = i18n._(msg`reminder: "${envelope.title}" still needs you to ${recipientActionVerb}`);

  if (organisationType === OrganisationType.ORGANISATION) {
    emailSubject = i18n._(msg`reminder: ${envelope.team.name} is still waiting on "${envelope.title}"`);
  }

  const customEmailTemplate = {
    'signer.name': recipient.name,
    'signer.email': recipient.email,
    'document.name': envelope.title,
  };

  if (envelope.documentMeta.subject) {
    emailSubject = renderCustomEmailTemplate(
      i18n._(msg`reminder: ${envelope.documentMeta.subject}`),
      customEmailTemplate,
    );
  }

  const emailMessage = envelope.documentMeta.message
    ? renderCustomEmailTemplate(envelope.documentMeta.message, customEmailTemplate)
    : undefined;

  const assetBaseUrl = NEXT_PUBLIC_WEBAPP_URL() || 'http://localhost:3000';
  const signDocumentLink = `${NEXT_PUBLIC_WEBAPP_URL()}/sign/${recipient.token}`;

  io.logger.info(
    `Sending signing reminder for envelope ${envelope.id} to recipient ${recipient.id} (${recipient.email})`,
  );

  // Jess fork: page-1 preview of the actual document as the email hero.
  // Gated per recipient — never rendered when access auth is required.
  const documentThumbnail = isEmailThumbnailAllowedForRecipient({ envelope, recipient })
    ? await getEmailDocumentThumbnail({ envelope })
    : null;

  const template = createElement(DocumentReminderEmailTemplate, {
    recipientName: recipient.name,
    documentName: envelope.title,
    assetBaseUrl,
    signDocumentLink,
    customBody: emailMessage,
    role: recipient.role,
    documentThumbnailSrc: documentThumbnail ? `cid:${EMAIL_DOCUMENT_THUMBNAIL_CID}` : undefined,
  });

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
    subject: emailSubject,
    html,
    text,
    attachments: documentThumbnail ? [emailDocumentThumbnailAttachment(documentThumbnail)] : undefined,
  });

  await prisma.documentAuditLog.create({
    data: createDocumentAuditLogData({
      type: DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT,
      envelopeId: envelope.id,
      data: {
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        recipientId: recipient.id,
        recipientRole: recipient.role,
        emailType: DOCUMENT_EMAIL_TYPE.REMINDER,
        isResending: false,
      },
    }),
  });

  await triggerWebhook({
    event: WebhookTriggerEvents.DOCUMENT_REMINDER_SENT,
    data: ZWebhookDocumentSchema.parse(mapEnvelopeToWebhookDocumentPayload(envelope)),
    userId: envelope.userId,
    teamId: envelope.teamId,
  });

  // Compute the next reminder time (repeat interval).
  if (recipient.sentAt) {
    await updateRecipientNextReminder({
      recipientId: recipient.id,
      envelopeId: envelope.id,
      sentAt: recipient.sentAt,
      lastReminderSentAt: now,
    });
  }
};
