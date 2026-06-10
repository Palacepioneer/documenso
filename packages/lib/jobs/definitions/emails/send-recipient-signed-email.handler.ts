import { mailer } from '@documenso/email/mailer';
import { DocumentRecipientSignedEmailTemplate } from '@documenso/email/templates/document-recipient-signed';
import { prisma } from '@documenso/prisma';
import { msg } from '@lingui/core/macro';
import { EnvelopeType, RecipientRole, SigningStatus } from '@prisma/client';
import { createElement } from 'react';

import { getI18nInstance } from '../../../client-only/providers/i18n-server';
import { NEXT_PUBLIC_WEBAPP_URL } from '../../../constants/app';
import { getEmailContext } from '../../../server-only/email/get-email-context';
import { extractDerivedDocumentEmailSettings } from '../../../types/document-email';
import { unsafeBuildEnvelopeIdQuery } from '../../../utils/envelope';
import { formatDocumentsPath } from '../../../utils/teams';
import { isRecipientEmailValidForSending } from '../../../utils/recipients';
import { renderEmailWithI18N } from '../../../utils/render-email-with-i18n';
import type { JobRunIO } from '../../client/_internal/job';
import type { TSendRecipientSignedEmailJobDefinition } from './send-recipient-signed-email';

export const run = async ({ payload, io }: { payload: TSendRecipientSignedEmailJobDefinition; io: JobRunIO }) => {
  const { documentId, recipientId } = payload;

  const envelope = await prisma.envelope.findFirst({
    where: {
      ...unsafeBuildEnvelopeIdQuery(
        {
          type: 'documentId',
          id: documentId,
        },
        EnvelopeType.DOCUMENT,
      ),
      recipients: {
        some: {
          id: recipientId,
        },
      },
    },
    include: {
      recipients: {
        where: {
          id: recipientId,
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
          url: true,
        },
      },
      documentMeta: true,
    },
  });

  if (!envelope) {
    throw new Error('Document not found');
  }

  if (envelope.recipients.length === 0) {
    throw new Error('Document has no recipients');
  }

  const isRecipientSignedEmailEnabled = extractDerivedDocumentEmailSettings(envelope.documentMeta).recipientSigned;

  if (!isRecipientSignedEmailEnabled) {
    return;
  }

  const [recipient] = envelope.recipients;
  const { email: recipientEmail, name: recipientName } = recipient;
  const { user: owner } = envelope;

  const recipientReference = recipientName || recipientEmail;

  // Don't send notification if the owner is the one who signed.
  if (owner.email === recipientEmail || !isRecipientEmailValidForSending(recipient)) {
    return;
  }

  const { branding, emailLanguage, senderEmail } = await getEmailContext({
    emailType: 'INTERNAL',
    source: {
      type: 'team',
      teamId: envelope.teamId,
    },
    meta: envelope.documentMeta,
  });

  const assetBaseUrl = NEXT_PUBLIC_WEBAPP_URL() || 'http://localhost:3000';

  const i18n = await getI18nInstance(emailLanguage);

  // Jess fork: give the owner a CTA into the document (the upstream email had
  // none) and a live signing-progress count.
  const documentLink = `${NEXT_PUBLIC_WEBAPP_URL()}${formatDocumentsPath(envelope.team?.url)}/${envelope.id}`;

  const [signedCount, totalCount] = await Promise.all([
    prisma.recipient.count({
      where: {
        envelopeId: envelope.id,
        role: { not: RecipientRole.CC },
        signingStatus: SigningStatus.SIGNED,
      },
    }),
    prisma.recipient.count({
      where: {
        envelopeId: envelope.id,
        role: { not: RecipientRole.CC },
      },
    }),
  ]);

  const template = createElement(DocumentRecipientSignedEmailTemplate, {
    documentName: envelope.title,
    recipientName,
    recipientEmail,
    assetBaseUrl,
    documentLink,
    signedCount,
    totalCount,
  });

  await io.runTask('send-recipient-signed-email', async () => {
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
        name: owner.name ?? '',
        address: owner.email,
      },
      from: senderEmail,
      subject: i18n._(msg`${recipientReference} signed "${envelope.title}"`),
      html,
      text,
    });
  });
};
