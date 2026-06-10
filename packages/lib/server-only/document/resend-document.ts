import { mailer } from '@documenso/email/mailer';
import { DocumentInviteEmailTemplate } from '@documenso/email/templates/document-invite';
import { resolveExpiresAt } from '@documenso/lib/constants/envelope-expiration';
import { RECIPIENT_ROLE_TO_EMAIL_TYPE, RECIPIENT_ROLES_DESCRIPTION } from '@documenso/lib/constants/recipient-roles';
import { DOCUMENT_AUDIT_LOG_TYPE } from '@documenso/lib/types/document-audit-logs';
import type { ApiRequestMetadata } from '@documenso/lib/universal/extract-request-metadata';
import { createDocumentAuditLogData } from '@documenso/lib/utils/document-audit-logs';
import { renderCustomEmailTemplate } from '@documenso/lib/utils/render-custom-email-template';
import { prisma } from '@documenso/prisma';
import { msg } from '@lingui/core/macro';
import {
  DocumentStatus,
  EnvelopeType,
  OrganisationType,
  RecipientRole,
  SigningStatus,
  WebhookTriggerEvents,
} from '@prisma/client';
import { createElement } from 'react';

import { getI18nInstance } from '../../client-only/providers/i18n-server';
import { NEXT_PUBLIC_WEBAPP_URL } from '../../constants/app';
import { extractDerivedDocumentEmailSettings } from '../../types/document-email';
import { mapEnvelopeToWebhookDocumentPayload, ZWebhookDocumentSchema } from '../../types/webhook-payload';
import { isDocumentCompleted } from '../../utils/document';
import type { EnvelopeIdOptions } from '../../utils/envelope';
import { isRecipientEmailValidForSending } from '../../utils/recipients';
import { renderEmailWithI18N } from '../../utils/render-email-with-i18n';
import { getEmailContext } from '../email/get-email-context';
import { getEnvelopeWhereInput } from '../envelope/get-envelope-by-id';
import { triggerWebhook } from '../webhooks/trigger/trigger-webhook';

export type ResendDocumentOptions = {
  id: EnvelopeIdOptions;
  userId: number;
  recipients: number[];
  teamId: number;
  requestMetadata: ApiRequestMetadata;
};

export const resendDocument = async ({ id, userId, recipients, teamId, requestMetadata }: ResendDocumentOptions) => {
  const user = await prisma.user.findFirstOrThrow({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  const { envelopeWhereInput } = await getEnvelopeWhereInput({
    id,
    type: EnvelopeType.DOCUMENT,
    userId,
    teamId,
  });

  const envelope = await prisma.envelope.findUnique({
    where: envelopeWhereInput,
    include: {
      recipients: true,
      documentMeta: true,
      team: {
        select: {
          teamEmail: true,
          name: true,
        },
      },
    },
  });

  if (!envelope) {
    throw new Error('Document not found');
  }

  if (envelope.recipients.length === 0) {
    throw new Error('Document has no recipients');
  }

  if (envelope.status === DocumentStatus.DRAFT) {
    throw new Error('Can not send draft document');
  }

  if (isDocumentCompleted(envelope.status)) {
    throw new Error('Can not send completed document');
  }

  // Refresh the expiresAt on each resent recipient.
  const expiresAt = resolveExpiresAt(envelope.documentMeta?.envelopeExpirationPeriod ?? null);

  const recipientsToRemind = envelope.recipients.filter(
    (recipient) =>
      recipients.includes(recipient.id) &&
      recipient.signingStatus === SigningStatus.NOT_SIGNED &&
      recipient.role !== RecipientRole.CC,
  );

  // Extend the expiration deadline for recipients being resent.
  if (expiresAt && recipientsToRemind.length > 0) {
    await prisma.recipient.updateMany({
      where: {
        id: {
          in: recipientsToRemind.map((r) => r.id),
        },
      },
      data: {
        expiresAt,
        expirationNotifiedAt: null,
      },
    });
  }

  const isRecipientSigningRequestEmailEnabled = extractDerivedDocumentEmailSettings(
    envelope.documentMeta,
  ).recipientSigningRequest;

  if (!isRecipientSigningRequestEmailEnabled) {
    return envelope;
  }

  const { branding, emailLanguage, organisationType, senderEmail, replyToEmail } = await getEmailContext({
    emailType: 'RECIPIENT',
    source: {
      type: 'team',
      teamId: envelope.teamId,
    },
    meta: envelope.documentMeta,
  });

  await Promise.all(
    recipientsToRemind.map(async (recipient) => {
      if (recipient.role === RecipientRole.CC || !isRecipientEmailValidForSending(recipient)) {
        return;
      }

      const i18n = await getI18nInstance(emailLanguage);

      const recipientEmailType = RECIPIENT_ROLE_TO_EMAIL_TYPE[recipient.role];

      const { email, name } = recipient;
      const selfSigner = email === user.email;

      const recipientActionVerb = i18n._(RECIPIENT_ROLES_DESCRIPTION[recipient.role].actionVerb).toLowerCase();

      // Jess fork: fallback strings rewritten in house voice ({signer.name} /
      // {document.name} are substituted per-recipient downstream).
      let emailMessage = envelope.documentMeta.message || '';
      let emailSubject = i18n._(msg`reminder: "{document.name}" still needs you to ${recipientActionVerb}`);

      if (selfSigner) {
        emailMessage = i18n._(
          msg`your document "{document.name}" is still waiting — it just needs you to ${recipientActionVerb} it.`,
        );
        emailSubject = i18n._(msg`reminder: your document still needs you to ${recipientActionVerb}`);
      }

      if (organisationType === OrganisationType.ORGANISATION) {
        emailSubject = i18n._(
          msg`reminder: ${envelope.team.name} is still waiting on "{document.name}"`,
        );
        emailMessage =
          envelope.documentMeta.message ||
          i18n._(
            msg`hi {signer.name} — just a nudge from ${user.name || user.email}: "{document.name}" still needs you to ${recipientActionVerb}. it takes about a minute, and you can reply to this email with any questions.`,
          );
      }

      const customEmailTemplate = {
        'signer.name': name,
        'signer.email': email,
        'document.name': envelope.title,
      };

      const assetBaseUrl = NEXT_PUBLIC_WEBAPP_URL() || 'http://localhost:3000';
      const signDocumentLink = `${NEXT_PUBLIC_WEBAPP_URL()}/sign/${recipient.token}`;

      const template = createElement(DocumentInviteEmailTemplate, {
        documentName: envelope.title,
        inviterName: user.name || undefined,
        inviterEmail:
          organisationType === OrganisationType.ORGANISATION
            ? envelope.team?.teamEmail?.email || user.email
            : user.email,
        assetBaseUrl,
        signDocumentLink,
        customBody: renderCustomEmailTemplate(emailMessage, customEmailTemplate),
        role: recipient.role,
        selfSigner,
        organisationType,
        teamName: envelope.team?.name,
      });

      const [html, text] = await Promise.all([
        renderEmailWithI18N(template, {
          lang: emailLanguage,
          branding,
        }),
        renderEmailWithI18N(template, {
          lang: emailLanguage,
          branding,
          plainText: true,
        }),
      ]);

      // Send email outside any transaction to avoid holding a connection
      // open during network I/O.
      await mailer.sendMail({
        to: {
          address: email,
          name,
        },
        from: senderEmail,
        replyTo: replyToEmail,
        subject: envelope.documentMeta.subject
          ? renderCustomEmailTemplate(i18n._(msg`reminder: ${envelope.documentMeta.subject}`), customEmailTemplate)
          : emailSubject,
        html,
        text,
      });

      await prisma.documentAuditLog.create({
        data: createDocumentAuditLogData({
          type: DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT,
          envelopeId: envelope.id,
          metadata: requestMetadata,
          data: {
            emailType: recipientEmailType,
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            recipientRole: recipient.role,
            recipientId: recipient.id,
            isResending: true,
          },
        }),
      });
    }),
  );

  await triggerWebhook({
    event: WebhookTriggerEvents.DOCUMENT_REMINDER_SENT,
    data: ZWebhookDocumentSchema.parse(mapEnvelopeToWebhookDocumentPayload(envelope)),
    userId: envelope.userId,
    teamId: envelope.teamId,
  });

  return envelope;
};
