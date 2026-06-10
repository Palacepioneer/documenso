import type { DocumentMeta, Envelope, Recipient } from '@prisma/client';

import { extractDerivedDocumentEmailSettings } from '../../types/document-email';
import { getFileServerSide } from '../../universal/upload/get-file.server';
import { extractDocumentAuthMethods } from '../../utils/document-auth';
import { pdfFirstPageToPng } from '../ai/pdf-to-images';
import {
  EMAIL_THUMBNAIL_TOKEN_TTL_MS,
  createEmailAssetUrl,
} from '../email/email-asset-token';

/**
 * Jess fork: page-1 document preview embedded in signing request and
 * reminder emails.
 *
 * Served as an HMAC-signed `https` URL (the `/api/email/thumbnail/:envelopeId`
 * route) instead of an inline CID attachment — Resend sends with `cid:`
 * references arrived in Gmail with the inline image missing (operator report
 * 2026-06-10, email 1d4ee344-32c9-4e09-b468-77534681da3b), and a plain image
 * URL is the one form every client's image proxy understands.
 */

/** Display width inside the email (the PNG is rendered at 2x for retina). */
const THUMBNAIL_TARGET_WIDTH = 600;

type ThumbnailEnvelopeGates = Pick<Envelope, 'authOptions'> & {
  documentMeta?: DocumentMeta | null;
};

type ThumbnailEnvelope = ThumbnailEnvelopeGates &
  Pick<Envelope, 'id'> & {
    envelopeItems: Array<{ order: number }>;
  };

type RenderableThumbnailEnvelope = ThumbnailEnvelopeGates & {
  envelopeItems: Array<{
    order: number;
    documentData: Parameters<typeof getFileServerSide>[0];
  }>;
};

/**
 * Envelope-level gate: the `emailDocumentThumbnail` email setting must be on
 * and the envelope must not require global access authentication (sensitive
 * documents must not leak page 1 into inboxes).
 */
export const isEmailThumbnailAllowedForEnvelope = (envelope: ThumbnailEnvelopeGates): boolean => {
  const emailSettings = extractDerivedDocumentEmailSettings(envelope.documentMeta);

  if (!emailSettings.emailDocumentThumbnail) {
    return false;
  }

  const { documentAuthOption } = extractDocumentAuthMethods({
    documentAuth: envelope.authOptions,
  });

  return documentAuthOption.globalAccessAuth.length === 0;
};

/**
 * Signed, expiring URL for the envelope's page-1 preview, or `null` when the
 * gates fail, the envelope has no items, or no server signing key is set.
 * Never throws — a missing preview must not block an email send.
 */
export const getEmailDocumentThumbnailUrl = ({
  envelope,
}: {
  envelope: ThumbnailEnvelope;
}): string | null => {
  try {
    if (!isEmailThumbnailAllowedForEnvelope(envelope) || envelope.envelopeItems.length === 0) {
      return null;
    }

    return createEmailAssetUrl({
      path: `/api/email/thumbnail/${envelope.id}`,
      purpose: 'document-thumbnail',
      assetId: envelope.id,
      ttlMs: EMAIL_THUMBNAIL_TOKEN_TTL_MS,
    });
  } catch (err) {
    console.error('[email-document-thumbnail] url generation failed, sending without preview', err);

    return null;
  }
};

/**
 * Renders page 1 of the envelope's first document to a PNG buffer. Used by
 * the `/api/email/thumbnail/:envelopeId` route — which re-checks the same
 * gates via `isEmailThumbnailAllowedForEnvelope` before calling this.
 */
export const renderEmailDocumentThumbnail = async ({
  envelope,
}: {
  envelope: RenderableThumbnailEnvelope;
}): Promise<Buffer | null> => {
  const firstItem = [...envelope.envelopeItems].sort((a, b) => a.order - b.order)[0];

  if (!firstItem) {
    return null;
  }

  const file = await getFileServerSide(firstItem.documentData);
  const pdfBytes = new Uint8Array(file);

  const { image } = await pdfFirstPageToPng(pdfBytes, { targetWidth: THUMBNAIL_TARGET_WIDTH });

  return image;
};

/**
 * Recipient-level gate: when the derived access auth for this recipient is
 * non-empty (their own auth options or the envelope's global ones), the
 * document content must not be previewed in their inbox.
 */
export const isEmailThumbnailAllowedForRecipient = ({
  envelope,
  recipient,
}: {
  envelope: Pick<Envelope, 'authOptions'>;
  recipient: Pick<Recipient, 'authOptions'>;
}): boolean => {
  const { recipientAccessAuthRequired } = extractDocumentAuthMethods({
    documentAuth: envelope.authOptions,
    recipientAuth: recipient.authOptions,
  });

  return !recipientAccessAuthRequired;
};
